import {
  isCustomerRequestStatus,
  listCustomerRequests,
  updateCustomerRequestStatus,
  type CustomerRequestStatus,
} from "@/app/lib/customer-requests";
import { getSessionFromRequest } from "@/app/lib/auth";

export const runtime = "nodejs";

type PatchRequest = {
  id?: string;
  status?: CustomerRequestStatus;
};

function jsonError(message: string, status: number) {
  return Response.json({ error: message }, { status });
}

async function hasAdminAccess(request: Request) {
  const session = await getSessionFromRequest(request);

  if (session?.user.role === "admin") return true;

  const configuredToken = process.env.ADMIN_DASHBOARD_TOKEN;

  if (!configuredToken) return false;

  const authHeader = request.headers.get("authorization");
  const bearerToken = authHeader?.startsWith("Bearer ") ? authHeader.slice("Bearer ".length) : "";
  const headerToken = request.headers.get("x-admin-token") || "";

  return bearerToken === configuredToken || headerToken === configuredToken;
}

function toDateOnly(value: Date | string) {
  if (typeof value === "string") return value.slice(0, 10);

  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function toAdminRequest(row: Awaited<ReturnType<typeof listCustomerRequests>>[number]) {
  return {
    id: row.id,
    salonId: row.salon_id,
    salonName: row.salon_name,
    customerName: row.customer_name,
    phone: row.phone,
    email: row.email,
    date: toDateOnly(row.appointment_date),
    time: row.appointment_time,
    service: row.service,
    notes: row.notes,
    type: row.request_type,
    status: row.status,
    paymentOrderId: row.payment_order_id,
    paymentId: row.payment_id,
    amountPaid: row.amount_paid,
    customerUserId: row.customer_user_id,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
}

export async function GET(request: Request) {
  if (!(await hasAdminAccess(request))) {
    return jsonError("Admin OAuth session or token is required.", 401);
  }

  const { searchParams } = new URL(request.url);
  const limit = Number(searchParams.get("limit") || 50);
  const requests = await listCustomerRequests(Number.isFinite(limit) ? limit : 50);

  return Response.json({
    requests: requests.map(toAdminRequest),
  });
}

export async function PATCH(request: Request) {
  if (!(await hasAdminAccess(request))) {
    return jsonError("Admin OAuth session or token is required.", 401);
  }

  let body: PatchRequest;

  try {
    body = (await request.json()) as PatchRequest;
  } catch {
    return jsonError("Invalid admin request.", 400);
  }

  if (!body.id || !isCustomerRequestStatus(body.status)) {
    return jsonError("Request id and valid status are required.", 400);
  }

  const updatedRequest = await updateCustomerRequestStatus(body.id, body.status);

  if (!updatedRequest) {
    return jsonError("Customer request was not found.", 404);
  }

  return Response.json({ request: toAdminRequest(updatedRequest) });
}
