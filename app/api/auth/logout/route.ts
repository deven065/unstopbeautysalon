import { NextResponse } from "next/server";
import { SESSION_COOKIE_NAME, deleteSessionByToken } from "@/app/lib/auth";

export const runtime = "nodejs";

function getSessionToken(request: Request) {
  return request.headers
    .get("cookie")
    ?.split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${SESSION_COOKIE_NAME}=`))
    ?.slice(SESSION_COOKIE_NAME.length + 1);
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const token = getSessionToken(request);

  await deleteSessionByToken(token ? decodeURIComponent(token) : undefined);

  const response = NextResponse.redirect(new URL("/", requestUrl.origin));
  response.cookies.delete(SESSION_COOKIE_NAME);

  return response;
}

export async function POST(request: Request) {
  return GET(request);
}
