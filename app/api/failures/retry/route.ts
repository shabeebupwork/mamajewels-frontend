import crypto from "crypto";
import { NextResponse } from "next/server";
import { pool } from "@/db/postgres";
import { requireRole } from "@/lib/require-auth";

const retryWebhookUrl =
  process.env.N8N_RETRY_WEBHOOK_URL ||
  "https://n8n.mamajewels.nl/webhook/dashboard/retry-failed-execution";

export async function POST(request: Request) {
  try {
    const actor = await requireRole(["Owner", "Administrator"]);
    const body = (await request.json()) as { id?: string | number };
    const id = Number(body.id);

    if (!Number.isInteger(id) || id <= 0) {
      return NextResponse.json({ error: "Failure id is required" }, { status: 400 });
    }

    const failureResult = await pool.query(
      `SELECT execution_id, status FROM workflow_errors WHERE id = $1 LIMIT 1`,
      [id]
    );
    if (failureResult.rowCount === 0) {
      return NextResponse.json({ error: "Failure not found" }, { status: 404 });
    }

    const { execution_id: executionId, status } = failureResult.rows[0];
    if (!executionId || !/^\d+$/.test(String(executionId))) {
      return NextResponse.json({ error: "This failure has no valid n8n execution ID" }, { status: 409 });
    }
    if (status === "resolved") {
      return NextResponse.json({ error: "This failure is already resolved" }, { status: 409 });
    }
    if (!process.env.DASHBOARD_API_KEY) {
      return NextResponse.json({ error: "Dashboard API key is not configured" }, { status: 500 });
    }

    let retryResponse: Response;
    try {
      retryResponse = await fetch(retryWebhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-dashboard-key": process.env.DASHBOARD_API_KEY,
        },
        body: JSON.stringify({ executionId: String(executionId) }),
        cache: "no-store",
      });
    } catch {
      return NextResponse.json({ error: "Retry failed: unable to reach n8n" }, { status: 502 });
    }

    const retryData = await retryResponse.json().catch(() => null) as { ok?: boolean; success?: boolean; error?: string; message?: string } | null;
    if (!retryResponse.ok || retryData?.ok === false || retryData?.success === false) {
      return NextResponse.json(
        { error: retryData?.error || retryData?.message || "Retry failed: n8n rejected the request" },
        { status: 502 }
      );
    }

    await pool.query(
      `UPDATE workflow_errors SET status = 'retry_requested' WHERE id = $1`,
      [id]
    );
    await pool.query(
      `INSERT INTO audit_log (request_id, action, actor_type, actor_email, entity_type, entity_id, details)
       VALUES ($1, 'workflow_retry_requested', 'user', $2, 'workflow_error', $3, $4::jsonb)`,
      [crypto.randomUUID(), actor.email, String(id), JSON.stringify({ execution_id: String(executionId) })]
    );

    return NextResponse.json({
      success: true,
      message: "Retry accepted by n8n",
      executionId: String(executionId),
      retry: retryData,
    }, { status: 202 });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return NextResponse.json({ error: "Administrator access required" }, { status: 403 });
    }
    console.error("Failure retry error:", error);
    return NextResponse.json({ error: "Retry failed" }, { status: 500 });
  }
}
