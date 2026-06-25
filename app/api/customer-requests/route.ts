import {
  createCustomerRequest,
  type CustomerRequestInput,
} from "@/app/lib/customer-requests";
import { ensureAuthSchema, getSessionFromRequest } from "@/app/lib/auth";
import { checkRateLimit } from "@/app/lib/payment-guard";

export const runtime = "nodejs";

function jsonError(message: string, status: number, headers?: HeadersInit) {
  return Response.json({ error: message }, { status, headers });
}

function serializeDate(value: Date | string) {
  return value instanceof Date ? value.toISOString() : value;
}

export async function POST(request: Request) {
  await ensureAuthSchema();

  const rateLimit = checkRateLimit(request, "customer-requests", 20, 60_000);

  if (rateLimit.limited) {
    return jsonError("Too many request attempts. Please wait and try again.", 429, {
      "Retry-After": String(rateLimit.retryAfter),
    });
  }

  let body: CustomerRequestInput;

  try {
    body = (await request.json()) as CustomerRequestInput;
  } catch {
    return jsonError("Invalid customer request.", 400);
  }

  try {
    const session = await getSessionFromRequest(request);
    const savedRequest = await createCustomerRequest({
      ...body,
      customerUserId: session?.user.id,
      customerName: body.customerName || session?.user.name,
      email: body.email || session?.user.email,
    });

    return Response.json(
      {
        id: savedRequest.id,
        status: savedRequest.status,
        createdAt: serializeDate(savedRequest.created_at),
      },
      { status: 201 },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to save customer request.";
    return jsonError(message, 400);
  }
}
