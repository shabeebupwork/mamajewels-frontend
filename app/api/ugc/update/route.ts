import { NextResponse } from "next/server";
import { pool } from "@/db/postgres";
import { requireRole } from "@/lib/require-auth";

export async function POST(request: Request) {
  try {
    await requireRole(["Owner", "Administrator", "Editor and approver"]);
    const body = (await request.json()) as {
      id: string | number;
      caption?: string;
      status?: string;
    };

    const id = Number(body.id);

    if (!id) {
      return NextResponse.json(
        { error: "UGC id is required" },
        { status: 400 }
      );
    }

    const allowedStatuses = ["generating", "rejected"];

    if (
      body.status !== undefined &&
      !allowedStatuses.includes(body.status)
    ) {
      return NextResponse.json({ error: "Invalid UGC status" }, { status: 400 });
    }

    const result = await pool.query(
      `
      UPDATE ugc_items
      SET
        caption = COALESCE($2, caption),
        permission_status = COALESCE($3, permission_status),
        updated_at = NOW()
      WHERE id = $1
      RETURNING
        id,
        caption,
        permission_status AS status,
        updated_at
      `,
      [
        id,
        body.caption !== undefined ? body.caption : null,
        body.status !== undefined
          ? body.status
          : null,
      ]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "UGC item not found" },
        { status: 404 }
      );
    }

    if (body.status === "generating") {
      const webhookResponse = await fetch(
        "https://n8n.mamajewels.nl/webhook/ugc-status",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Dashboard-Key": process.env.DASHBOARD_API_KEY || "",
          },
          body: JSON.stringify({ id: String(id) }),
          cache: "no-store",
        }
      );

      if (!webhookResponse.ok) {
        console.error("UGC generation webhook failed:", webhookResponse.status);
        return NextResponse.json(
          { error: "UGC was marked as generating, but the workflow trigger failed" },
          { status: 502 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      item: result.rows[0],
    });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return NextResponse.json({ error: "UGC review access required" }, { status: 403 });
    }
    console.error("UGC update error:", error);

    return NextResponse.json(
      { error: "Failed to update UGC item" },
      { status: 500 }
    );
  }
}
