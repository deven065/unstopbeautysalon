import { NextResponse } from "next/server";
import {
  SESSION_COOKIE_NAME,
  createSession,
  getSessionCookieOptions,
  upsertPasswordUser,
  type UserRole,
} from "@/app/lib/auth";
import { checkRateLimit } from "@/app/lib/payment-guard";

export const runtime = "nodejs";

type RegisterRequest = {
  email?: string;
  name?: string;
  password?: string;
  role?: UserRole;
};

function jsonError(message: string, status: number, headers?: HeadersInit) {
  return Response.json({ error: message }, { status, headers });
}

export async function POST(request: Request) {
  const rateLimit = checkRateLimit(request, "password-register", 8, 60_000);

  if (rateLimit.limited) {
    return jsonError("Too many account attempts. Please wait and try again.", 429, {
      "Retry-After": String(rateLimit.retryAfter),
    });
  }

  let body: RegisterRequest;

  try {
    body = (await request.json()) as RegisterRequest;
  } catch {
    return jsonError("Invalid account request.", 400);
  }

  try {
    const user = await upsertPasswordUser({
      email: body.email || "",
      name: body.name || "",
      password: body.password || "",
      role: body.role === "admin" ? "admin" : "customer",
    });
    const session = await createSession(user.id, user);
    const response = NextResponse.json({ user }, { status: 201 });

    response.cookies.set({
      ...getSessionCookieOptions(session.expiresAt),
      name: SESSION_COOKIE_NAME,
      value: session.token,
    });

    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not create account.";
    return jsonError(message, 400);
  }
}
