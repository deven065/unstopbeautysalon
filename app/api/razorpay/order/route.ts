import {
  checkRateLimit,
  isValidOptionalEmail,
  isValidPhone,
  rememberPendingPayment,
  sanitizeService,
  sanitizeShortText,
} from "@/app/lib/payment-guard";
import { ensureAuthSchema, getSessionFromRequest } from "@/app/lib/auth";
import { getTrustedSalonFromDb } from "@/app/lib/marketplace-data";

export const runtime = "nodejs";

type OrderRequest = {
  salonId?: string;
  customerName?: string;
  email?: string;
  phone?: string;
  service?: string;
};

function getRazorpayCredentials() {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret || keyId.includes("replace") || keySecret.includes("replace")) {
    return null;
  }

  return { keyId, keySecret };
}

function buildBasicAuth(keyId: string, keySecret: string) {
  return Buffer.from(`${keyId}:${keySecret}`).toString("base64");
}

function jsonError(message: string, status: number, headers?: HeadersInit) {
  return Response.json({ error: message }, { status, headers });
}

export async function POST(request: Request) {
  await ensureAuthSchema();

  const rateLimit = checkRateLimit(request, "razorpay-order", 12, 60_000);

  if (rateLimit.limited) {
    return jsonError("Too many payment attempts. Please wait and try again.", 429, {
      "Retry-After": String(rateLimit.retryAfter),
    });
  }

  const credentials = getRazorpayCredentials();

  if (!credentials) {
    return jsonError("Payment provider is not configured.", 500);
  }

  let body: OrderRequest;

  try {
    body = (await request.json()) as OrderRequest;
  } catch {
    return jsonError("Invalid payment request.", 400);
  }

  const salon = await getTrustedSalonFromDb(body.salonId);

  if (!body.salonId || !salon) {
    return jsonError("Unknown salon selected.", 400);
  }

  if (body.phone && !isValidPhone(body.phone)) {
    return jsonError("Enter a valid phone number before payment.", 400);
  }

  if (!isValidOptionalEmail(body.email)) {
    return jsonError("Enter a valid email address before payment.", 400);
  }

  const amountInPaise = salon.basePrice * 100;
  const currency = process.env.RAZORPAY_CURRENCY || "INR";
  const service = sanitizeService(body.service);
  const session = await getSessionFromRequest(request);
  const customerName = sanitizeShortText(body.customerName || session?.user.name, "Guest", 80);
  const receipt = `glownest_${body.salonId}_${Date.now()}`.slice(0, 40);

  const razorpayResponse = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: {
      Authorization: `Basic ${buildBasicAuth(credentials.keyId, credentials.keySecret)}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount: amountInPaise,
      currency,
      receipt,
      notes: {
        customerName,
        salonId: body.salonId,
        salonName: salon.name,
        service,
      },
    }),
  });

  const data = (await razorpayResponse.json()) as {
    id?: string;
    amount?: number;
    currency?: string;
    receipt?: string;
    error?: { description?: string };
  };

  if (!razorpayResponse.ok || !data.id || !data.amount || !data.currency) {
    return jsonError(data.error?.description || "Unable to create Razorpay order.", 502);
  }

  await rememberPendingPayment(data.id, {
    amount: data.amount,
    currency: data.currency,
    receipt: data.receipt || receipt,
    salonId: body.salonId,
    salonName: salon.name,
    service,
    customerUserId: session?.user.id,
    createdAt: new Date(),
  });

  return Response.json({
    id: data.id,
    amount: data.amount,
    currency: data.currency,
    receipt: data.receipt || receipt,
    keyId: credentials.keyId,
  });
}
