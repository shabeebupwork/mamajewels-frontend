import { NextResponse } from "next/server";
import { pool } from "@/db/postgres";
import { requireRole } from "@/lib/require-auth";

export async function POST(request: Request) {
  try {
    await requireRole(["Owner", "Administrator", "Editor and approver"]);
    const body = (await request.json()) as {
      contentId: string | number;
      market: string;
      caption: string;
    };

    const contentId = Number(body.contentId);
    const market = body.market?.toUpperCase();
    const caption = body.caption?.trim();

    if (!contentId || !market || !caption) {
      return NextResponse.json(
        { error: "contentId, market and caption are required" },
        { status: 400 }
      );
    }

    if (!["DE", "FR", "US"].includes(market)) {
      return NextResponse.json(
        { error: "Invalid market" },
        { status: 400 }
      );
    }

    const result = await pool.query(
      `
      UPDATE localized_variants
      SET
        caption = $1,
        version = version + 1,
        updated_at = NOW()
      WHERE content_id = $2
        AND market = $3
      RETURNING
        id,
        content_id,
        market,
        caption,
        status,
        version,
        updated_at
      `,
      [caption, contentId, market]
    );

    if (result.rowCount === 0) {
      return NextResponse.json(
        { error: "Localization not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      localization: result.rows[0],
    });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return NextResponse.json({ error: "Caption editing access required" }, { status: 403 });
    }
    console.error("Save localization error:", error);

    return NextResponse.json(
      { error: "Failed to save localization" },
      { status: 500 }
    );
  }
}
