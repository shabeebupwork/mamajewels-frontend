import { NextResponse } from "next/server";
import { pool } from "@/db/postgres";
import { requireRole } from "@/lib/require-auth";

const allowedMarkets = ["DE", "FR", "US"];

export async function POST(request: Request) {
  try {
    const actor = await requireRole(["Owner", "Administrator", "Editor and approver"]);
    const body = (await request.json()) as {
      contentId: string | number;
      markets?: string[];
      actor_email?: string;
    };

    const contentId = Number(body.contentId);
    const markets = Array.isArray(body.markets)
      ? [...new Set(body.markets.map((market) => String(market).toUpperCase()))]
      : [];

    if (!Number.isInteger(contentId) || contentId <= 0) {
      return NextResponse.json(
        { error: "contentId is required" },
        { status: 400 }
      );
    }
    if (markets.length === 0 || markets.some((market) => !allowedMarkets.includes(market))) {
      return NextResponse.json(
        { error: "Select one or more valid markets: DE, FR, US" },
        { status: 400 }
      );
    }

    const actorEmail = actor.email || body.actor_email || "dashboard";

    const approval = await pool.query(
      `
      UPDATE localized_variants
      SET
        status = 'approved',
        approved_by = $2,
        approved_at = NOW(),
        updated_at = NOW()
      WHERE content_id = $1
        AND market = ANY($3::text[])
      RETURNING market
      `,
      [contentId, actorEmail, markets]
    );

    const approvedMarkets = approval.rows.map((row: { market: string }) => row.market);
    if (approvedMarkets.length === 0) {
      return NextResponse.json(
        { error: "No localized variants were found for the selected markets" },
        { status: 404 }
      );
    }

    await pool.query(
      `
      UPDATE content_items
      SET
        status = 'Approved',
        updated_at = NOW()
      WHERE id = $1
      `,
      [contentId]
    );

    fetch(
      "https://n8n.mamajewels.nl/webhook/mj-dashboard-action",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Dashboard-Key": process.env.DASHBOARD_API_KEY || "",
        },
        body: JSON.stringify({
          action: "approve_markets",
          content_id: contentId,
          markets: approvedMarkets,
          actor_email: actorEmail,
        }),
      }
    ).catch((error) => {
      console.error("n8n approval action failed:", error);
    });

    return NextResponse.json({
      success: true,
      contentId,
      markets: approvedMarkets,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return NextResponse.json({ error: "Approval access required" }, { status: 403 });
    }
    console.error("Approve content error:", error);

    return NextResponse.json(
      { error: "Failed to approve content" },
      { status: 500 }
    );
  }
}
