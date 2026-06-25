import crypto from "node:crypto";
import { getTrustedSalonFromDb } from "@/app/lib/marketplace-data";
import { query } from "@/app/lib/postgres";
import {
  isValidOptionalEmail,
  isValidPhone,
  sanitizeService,
  sanitizeShortText,
} from "@/app/lib/payment-guard";

export type CustomerRequestType = "booking" | "quote" | "callback";
export type CustomerRequestStatus = "new" | "confirmed" | "contacted" | "completed" | "cancelled";

export type CustomerRequestInput = {
  salonId?: string;
  customerUserId?: string;
  customerName?: string;
  phone?: string;
  email?: string;
  date?: string;
  time?: string;
  service?: string;
  notes?: string;
  type?: CustomerRequestType;
  paymentOrderId?: string;
  paymentId?: string;
  amountPaid?: number;
};

export type CustomerRequestRow = {
  id: string;
  salon_id: string;
  salon_name: string;
  customer_name: string;
  phone: string;
  email: string | null;
  appointment_date: string | Date;
  appointment_time: string;
  service: string;
  notes: string;
  request_type: CustomerRequestType;
  status: CustomerRequestStatus;
  payment_order_id: string | null;
  payment_id: string | null;
  amount_paid: number | null;
  customer_user_id: string | null;
  created_at: Date;
  updated_at: Date;
};

const allowedRequestTypes = new Set<CustomerRequestType>(["booking", "quote", "callback"]);
const allowedStatuses = new Set<CustomerRequestStatus>([
  "new",
  "confirmed",
  "contacted",
  "completed",
  "cancelled",
]);

function isIsoDate(value: unknown): value is string {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function isSafePaymentId(value: unknown, prefix: string): value is string {
  return (
    typeof value === "string" &&
    value.startsWith(prefix) &&
    value.length <= 80 &&
    /^[a-zA-Z0-9_]+$/.test(value)
  );
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export function isCustomerRequestStatus(value: unknown): value is CustomerRequestStatus {
  return typeof value === "string" && allowedStatuses.has(value as CustomerRequestStatus);
}

export async function createCustomerRequest(input: CustomerRequestInput) {
  const requestType = input.type;

  if (!requestType || !allowedRequestTypes.has(requestType)) {
    throw new Error("Choose a valid request type.");
  }

  const salon = await getTrustedSalonFromDb(input.salonId);

  if (!input.salonId || !salon) {
    throw new Error("Unknown salon selected.");
  }

  const customerName = sanitizeShortText(input.customerName, "", 80);
  const phone = sanitizeShortText(input.phone, "", 32);
  const email = sanitizeShortText(input.email, "", 120);
  const date = input.date;
  const time = sanitizeShortText(input.time, "", 40);
  const service = sanitizeService(input.service);
  const notes = sanitizeShortText(input.notes, "", 1000);

  if (!customerName) {
    throw new Error("Customer name is required.");
  }

  if (!isValidPhone(phone)) {
    throw new Error("Enter a valid phone number.");
  }

  if (!isValidOptionalEmail(email)) {
    throw new Error("Enter a valid email address.");
  }

  if (!isIsoDate(date) || date < todayIso()) {
    throw new Error("Choose today or a future appointment date.");
  }

  if (!time) {
    throw new Error("Preferred time is required.");
  }

  let paymentOrderId: string | null = null;
  let paymentId: string | null = null;
  let amountPaid: number | null = null;
  const status: CustomerRequestStatus = requestType === "booking" ? "confirmed" : "new";

  if (requestType === "booking") {
    if (
      !isSafePaymentId(input.paymentOrderId, "order_") ||
      !isSafePaymentId(input.paymentId, "pay_")
    ) {
      throw new Error("Verified payment details are required for a booking.");
    }

    const paymentResult = await query<{
      amount: number;
      salon_id: string;
      razorpay_payment_id: string | null;
      status: string;
    }>(
      `
        SELECT amount, salon_id, razorpay_payment_id, status
        FROM payment_orders
        WHERE razorpay_order_id = $1
        LIMIT 1
      `,
      [input.paymentOrderId],
    );
    const payment = paymentResult.rows[0];

    if (
      !payment ||
      payment.status !== "verified" ||
      payment.salon_id !== input.salonId ||
      payment.razorpay_payment_id !== input.paymentId
    ) {
      throw new Error("Payment has not been verified for this salon booking.");
    }

    paymentOrderId = input.paymentOrderId;
    paymentId = input.paymentId;
    amountPaid = payment.amount;
  }

  const requestId = crypto.randomUUID();
  const customerUserId = input.customerUserId || null;

  const result = await query<CustomerRequestRow>(
    `
      INSERT INTO customer_requests (
        id,
        salon_id,
        salon_name,
        customer_name,
        phone,
        email,
        appointment_date,
        appointment_time,
        service,
        notes,
        request_type,
        status,
        payment_order_id,
        payment_id,
        amount_paid,
        customer_user_id
      )
      VALUES ($1, $2, $3, $4, $5, NULLIF($6, ''), $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      RETURNING *
    `,
    [
      requestId,
      input.salonId,
      salon.name,
      customerName,
      phone,
      email,
      date,
      time,
      service,
      notes,
      requestType,
      status,
      paymentOrderId,
      paymentId,
      amountPaid,
      customerUserId,
    ],
  );

  return result.rows[0];
}

export async function listCustomerRequests(limit = 50) {
  const result = await query<CustomerRequestRow>(
    `
      SELECT *
      FROM customer_requests
      ORDER BY created_at DESC
      LIMIT $1
    `,
    [Math.min(Math.max(limit, 1), 100)],
  );

  return result.rows;
}

export async function updateCustomerRequestStatus(id: string, status: CustomerRequestStatus) {
  if (!isCustomerRequestStatus(status)) {
    throw new Error("Choose a valid request status.");
  }

  const result = await query<CustomerRequestRow>(
    `
      UPDATE customer_requests
      SET status = $2, updated_at = now()
      WHERE id = $1
      RETURNING *
    `,
    [id, status],
  );

  return result.rows[0];
}
