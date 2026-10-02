import { NextResponse } from "next/server";
import { pool } from "@/db/postgres";
import { requireRole } from "@/lib/require-auth";

export async function GET() {
  try {
    await requireRole(["Owner", "Administrator"]);
    const result = await pool.query(`
      SELECT
        id,
        workflow_name,
        execution_id,
        message,
        payload,
        status,
        repeat_count,
        occurred_at,
        resolved_at
      FROM workflow_errors
      ORDER BY occurred_at DESC
      LIMIT 100
    `);

    return NextResponse.json(result.rows);
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return NextResponse.json({ error: "Administrator access required" }, { status: 403 });
    }
    console.error("Failures error:", error);

    return NextResponse.json(
      { error: "Failed to load failures" },
      { status: 500 }
    );
  }
}
