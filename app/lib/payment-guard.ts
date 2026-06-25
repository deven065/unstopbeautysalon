import { query } from "@/app/lib/postgres";

type RateLimitBucket = {
  count: number;
  resetAt: number;
};

type PendingPayment = {
  amount: number;
  currency: string;
  receipt: string;
  salonId: string;
  salonName: string;
  service: string;
  customerUserId?: string | null;
  createdAt: Date;
};

declare global {
  // Rate limiting is process-local for the local MVP. Move it to Redis/Upstash
  // before running multiple app instances.
  var __glownestRateLimits: Map<string, RateLimitBucket> | undefined;
}

function getRateLimitStore() {
  globalThis.__glownestRateLimits ??= new Map<string, RateLimitBucket>();
  return globalThis.__glownestRateLimits;
}

export function sanitizeService(value: unknown) {
  if (typeof value !== "string") return "Beauty service";
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, 80) : "Beauty service";
}

export function sanitizeShortText(value: unknown, fallback: string, maxLength = 80) {
  if (typeof value !== "string") return fallback;
  const trimmed = value.trim().replace(/\s+/g, " ");
  return trimmed ? trimmed.slice(0, maxLength) : fallback;
}

export function isValidPhone(value: unknown) {
  return typeof value === "string" && /^[+\d][+\d\s().-]{6,24}$/.test(value.trim());
}

export function isValidOptionalEmail(value: unknown) {
  return (
    value === undefined ||
    value === "" ||
    (typeof value === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim()))
  );
}

export function getClientIdentifier(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return (
    forwardedFor ||
    request.headers.get("cf-connecting-ip") ||
    request.headers.get("x-real-ip") ||
    "unknown-client"
  );
}

export function checkRateLimit(
  request: Request,
  scope: string,
  limit: number,
  windowMs: number,
) {
  const now = Date.now();
  const key = `${scope}:${getClientIdentifier(request)}`;
  const store = getRateLimitStore();
  const current = store.get(key);

  if (!current || current.resetAt <= now) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { limited: false, retryAfter: 0 };
  }

  current.count += 1;

  if (current.count > limit) {
    return {
      limited: true,
      retryAfter: Math.ceil((current.resetAt - now) / 1000),
    };
  }

  return { limited: false, retryAfter: 0 };
}

export async function rememberPendingPayment(orderId: string, payment: PendingPayment) {
  await query(
    `
      INSERT INTO payment_orders (
        razorpay_order_id,
        amount,
        currency,
        receipt,
        salon_id,
        salon_name,
        service,
        customer_user_id,
        status,
        created_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending', $9)
      ON CONFLICT (razorpay_order_id) DO UPDATE SET
        amount = EXCLUDED.amount,
        currency = EXCLUDED.currency,
        receipt = EXCLUDED.receipt,
        salon_id = EXCLUDED.salon_id,
        salon_name = EXCLUDED.salon_name,
        service = EXCLUDED.service,
        customer_user_id = EXCLUDED.customer_user_id,
        status = 'pending',
        razorpay_payment_id = NULL,
        created_at = EXCLUDED.created_at,
        verified_at = NULL
    `,
    [
      orderId,
      payment.amount,
      payment.currency,
      payment.receipt,
      payment.salonId,
      payment.salonName,
      payment.service,
      payment.customerUserId || null,
      payment.createdAt,
    ],
  );
}

export async function getPendingPayment(orderId: string) {
  await expireOldPendingPayments();

  const result = await query<{
    amount: number;
    currency: string;
    receipt: string;
    salon_id: string;
    salon_name: string;
    service: string;
    customer_user_id: string | null;
    created_at: Date;
  }>(
    `
      SELECT amount, currency, receipt, salon_id, salon_name, service, customer_user_id, created_at
      FROM payment_orders
      WHERE razorpay_order_id = $1 AND status = 'pending'
      LIMIT 1
    `,
    [orderId],
  );

  const row = result.rows[0];
  if (!row) return undefined;

  return {
    amount: row.amount,
    currency: row.currency,
    receipt: row.receipt,
    salonId: row.salon_id,
    salonName: row.salon_name,
    service: row.service,
    customerUserId: row.customer_user_id,
    createdAt: row.created_at,
  } satisfies PendingPayment;
}

export async function forgetPendingPayment(orderId: string, paymentId: string) {
  await query(
    `
      UPDATE payment_orders
      SET status = 'verified',
        razorpay_payment_id = $2,
        verified_at = now()
      WHERE razorpay_order_id = $1 AND status = 'pending'
    `,
    [orderId, paymentId],
  );
}

async function expireOldPendingPayments() {
  await query(
    `
      UPDATE payment_orders
      SET status = 'expired'
      WHERE status = 'pending' AND created_at < now() - interval '30 minutes'
    `,
  );
}
