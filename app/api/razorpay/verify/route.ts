import crypto from "node:crypto";
import {
  checkRateLimit,
  forgetPendingPayment,
  getPendingPayment,
} from "@/app/lib/payment-guard";

export const runtime = "nodejs";

type VerifyRequest = {
  razorpay_order_id?: string;
  razorpay_payment_id?: string;
  razorpay_signature?: string;
};

function jsonError(message: string, status: number, headers?: HeadersInit) {
  return Response.json({ error: message }, { status, headers });
}

function isSafeRazorpayId(value: unknown, prefix: string): value is string {
  return (
    typeof value === "string" &&
    value.startsWith(prefix) &&
    value.length <= 80 &&
    /^[a-zA-Z0-9_]+$/.test(value)
  );
}

export async function POST(request: Request) {
  const rateLimit = checkRateLimit(request, "razorpay-verify", 20, 60_000);

  if (rateLimit.limited) {
    return jsonError("Too many verification attempts. Please wait and try again.", 429, {
      "Retry-After": String(rateLimit.retryAfter),
    });
  }

  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keySecret || keySecret.includes("replace")) {
    return jsonError("Payment provider is not configured.", 500);
  }

  let body: VerifyRequest;

  try {
    body = (await request.json()) as VerifyRequest;
  } catch {
    return jsonError("Invalid verification request.", 400);
  }

  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = body;

  if (
    !isSafeRazorpayId(razorpay_order_id, "order_") ||
    !isSafeRazorpayId(razorpay_payment_id, "pay_") ||
    typeof razorpay_signature !== "string" ||
    !/^[a-f0-9]{64}$/i.test(razorpay_signature)
  ) {
    return jsonError("Missing or invalid Razorpay verification fields.", 400);
  }

  const pendingPayment = await getPendingPayment(razorpay_order_id);

  if (!pendingPayment) {
    return jsonError("Payment order is expired or was not created by this server.", 400);
  }

  const expectedSignature = crypto
    .createHmac("sha256", keySecret)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest("hex");

  const expectedBuffer = Buffer.from(expectedSignature);
  const receivedBuffer = Buffer.from(razorpay_signature);
  const isValid =
    expectedBuffer.length === receivedBuffer.length &&
    crypto.timingSafeEqual(expectedBuffer, receivedBuffer);

  if (!isValid) {
    return jsonError("Payment signature verification failed.", 400);
  }

  await forgetPendingPayment(razorpay_order_id, razorpay_payment_id);

  return Response.json({
    verified: true,
    orderId: razorpay_order_id,
    paymentId: razorpay_payment_id,
    amount: pendingPayment.amount,
    currency: pendingPayment.currency,
    salonId: pendingPayment.salonId,
    salonName: pendingPayment.salonName,
    service: pendingPayment.service,
  });
}
