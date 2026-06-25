import { getSessionFromRequest } from "@/app/lib/auth";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const session = await getSessionFromRequest(request);

  return Response.json({
    user: session?.user || null,
    expiresAt: session?.expiresAt?.toISOString() || null,
  });
}
