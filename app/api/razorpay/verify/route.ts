import crypto from "node:crypto";

export const runtime = "nodejs";

type VerifyRequest = {
  razorpay_order_id?: string;
  razorpay_payment_id?: string;
  razorpay_signature?: string;
};

export async function POST(request: Request) {
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keySecret || keySecret.includes("replace")) {
    return Response.json(
      { error: "Razorpay secret is not configured. Update RAZORPAY_KEY_SECRET in .env." },
      { status: 500 },
    );
  }

  let body: VerifyRequest;

  try {
    body = (await request.json()) as VerifyRequest;
  } catch {
    return Response.json({ error: "Invalid verification request." }, { status: 400 });
  }

  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = body;

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return Response.json({ error: "Missing Razorpay verification fields." }, { status: 400 });
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
    return Response.json({ error: "Payment signature verification failed." }, { status: 400 });
  }

  return Response.json({
    verified: true,
    orderId: razorpay_order_id,
    paymentId: razorpay_payment_id,
  });
}
