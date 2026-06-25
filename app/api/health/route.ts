import { getDatabaseSetupIssue, query } from "@/app/lib/postgres";

export const runtime = "nodejs";

export async function GET() {
  const setupIssue = getDatabaseSetupIssue();

  if (setupIssue) {
    return Response.json(
      {
        ok: false,
        database: "not_configured",
        message: setupIssue,
      },
      { status: 503 },
    );
  }

  try {
    await query("SELECT 1");

    return Response.json({
      ok: true,
      database: "reachable",
    });
  } catch (error) {
    return Response.json(
      {
        ok: false,
        database: "unreachable",
        message: error instanceof Error ? error.message : "Database health check failed.",
      },
      { status: 503 },
    );
  }
}
