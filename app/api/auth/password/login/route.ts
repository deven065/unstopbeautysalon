import { NextResponse } from "next/server";
import {
  SESSION_COOKIE_NAME,
  authenticatePasswordUser,
  createSession,
  getSessionCookieOptions,
  type UserRole,
} from "@/app/lib/auth";
import { checkRateLimit } from "@/app/lib/payment-guard";

export const runtime = "nodejs";

type LoginRequest = {
  email?: string;
  password?: string;
  role?: UserRole;
};

function jsonError(message: string, status: number, headers?: HeadersInit) {
  return Response.json({ error: message }, { status, headers });
}

export async function POST(request: Request) {
  const rateLimit = checkRateLimit(request, "password-login", 10, 60_000);

  if (rateLimit.limited) {
    return jsonError("Too many sign-in attempts. Please wait and try again.", 429, {
      "Retry-After": String(rateLimit.retryAfter),
    });
  }

  let body: LoginRequest;

  try {
    body = (await request.json()) as LoginRequest;
  } catch {
    return jsonError("Invalid sign-in request.", 400);
  }

  try {
    const user = await authenticatePasswordUser({
      email: body.email || "",
      password: body.password || "",
    });

    if (body.role === "admin" && user.role !== "admin") {
      return jsonError("This account is not allowed as an admin.", 403);
    }

    const session = await createSession(user.id);
    const response = NextResponse.json({ user });

    response.cookies.set({
      ...getSessionCookieOptions(session.expiresAt),
      name: SESSION_COOKIE_NAME,
      value: session.token,
    });

    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid email or password.";
    return jsonError(message, 401);
  }
}
