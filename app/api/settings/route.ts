import crypto from "crypto";
import { NextResponse } from "next/server";
import { pool } from "@/db/postgres";
import { requireRole } from "@/lib/require-auth";

const settingActions = {
  humanApproval: "set_approval_mode",
  internationalPublishing: "set_publishing_mode",
} as const;

export async function GET() {
  try {
    await requireRole(["Owner", "Administrator"]);
    const result = await pool.query(
      `SELECT key, value FROM automation_settings WHERE key = ANY($1::text[])`,
      [["human_approval", "international_publishing"]]
    );
    const values = new Map<string, { enabled?: boolean }>(result.rows.map((row: { key: string; value: { enabled?: boolean } }) => [row.key, row.value] as [string, { enabled?: boolean }]));
    return NextResponse.json({
      humanApproval: values.get("human_approval")?.enabled ?? true,
      internationalPublishing: values.get("international_publishing")?.enabled ?? true,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return NextResponse.json({ error: "Owner or administrator access required" }, { status: 403 });
    }
    return NextResponse.json({ error: "Unable to load settings" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const actor = await requireRole(["Owner", "Administrator"]);
    const body = (await request.json()) as { setting?: keyof typeof settingActions; enabled?: boolean };
    if (!body.setting || !(body.setting in settingActions) || typeof body.enabled !== "boolean") {
      return NextResponse.json({ error: "A valid setting and boolean value are required" }, { status: 400 });
    }
    const action = settingActions[body.setting];
    const result = await pool.query(
      `SELECT public.apply_dashboard_action($1, $2, $3::jsonb, $4) AS result`,
      [crypto.randomUUID(), action, JSON.stringify({ enabled: body.enabled }), actor.email]
    );
    return NextResponse.json({
      setting: body.setting,
      enabled: body.enabled,
      result: result.rows[0]?.result ?? null,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return NextResponse.json({ error: "Owner or administrator access required" }, { status: 403 });
    }
    console.error("Dashboard setting update failed:", error);
    return NextResponse.json({ error: "Unable to save setting" }, { status: 500 });
  }
}
