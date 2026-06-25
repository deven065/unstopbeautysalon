import crypto from "node:crypto";
import { forgetPendingPayment } from "@/app/lib/payment-guard";

export const runtime = "nodejs";

type RazorpayWebhookPayload = {
  event?: string;
  payload?: {
    payment?: {
      entity?: {
        id?: string;
        order_id?: string;
      };
    };
  };
};

function jsonError(message: string, status: number) {
  return Response.json({ error: message }, { status });
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
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

  if (!webhookSecret) {
    return jsonError("Razorpay webhook secret is not configured.", 501);
  }

  const signature = request.headers.get("x-razorpay-signature");
  const rawBody = await request.text();

  if (!signature) {
    return jsonError("Webhook signature is required.", 400);
  }

  const expectedSignature = crypto
    .createHmac("sha256", webhookSecret)
    .update(rawBody)
    .digest("hex");
  const expectedBuffer = Buffer.from(expectedSignature);
  const receivedBuffer = Buffer.from(signature);
  const signatureMatches =
    expectedBuffer.length === receivedBuffer.length &&
    crypto.timingSafeEqual(expectedBuffer, receivedBuffer);

  if (!signatureMatches) {
    return jsonError("Webhook signature verification failed.", 400);
  }

  let payload: RazorpayWebhookPayload;

  try {
    payload = JSON.parse(rawBody) as RazorpayWebhookPayload;
  } catch {
    return jsonError("Invalid webhook payload.", 400);
  }

  if (payload.event !== "payment.captured" && payload.event !== "order.paid") {
    return Response.json({ received: true, ignored: true });
  }

  const paymentId = payload.payload?.payment?.entity?.id;
  const orderId = payload.payload?.payment?.entity?.order_id;

  if (!isSafeRazorpayId(orderId, "order_") || !isSafeRazorpayId(paymentId, "pay_")) {
    return jsonError("Webhook payment payload is missing order or payment id.", 400);
  }

  await forgetPendingPayment(orderId, paymentId);

  return Response.json({ received: true, orderId, paymentId });
}
