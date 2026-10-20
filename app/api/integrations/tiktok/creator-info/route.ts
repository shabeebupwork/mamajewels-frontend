import { NextResponse } from "next/server";
import { pool } from "@/db/postgres";
import { requireRole } from "@/lib/require-auth";
import { getTikTokCreatorInfo } from "@/lib/social-publishing";

export async function POST() {
  try {
    await requireRole(["Owner", "Administrator", "Editor and approver"]);
    const result = await pool.query(
      `SELECT configuration, token_expires_at FROM integrations WHERE provider = 'tiktok' ORDER BY id DESC LIMIT 1`,
    );
    if (!result.rowCount) return NextResponse.json({ error: "TikTok is not configured in Settings > Integrations." }, { status: 400 });
    const integration = result.rows[0];
    const config = (integration.configuration || {}) as Record<string, unknown>;
    const accessToken = typeof config.access_token === "string" ? config.access_token.trim() : "";
    const expiry = integration.token_expires_at || config.token_expires_at;
    if (!accessToken) return NextResponse.json({ error: "Add the TikTok access token in Settings > Integrations." }, { status: 400 });
    if (expiry && new Date(String(expiry)).getTime() <= Date.now()) return NextResponse.json({ error: "TikTok access token has expired." }, { status: 400 });
    const creator = await getTikTokCreatorInfo(accessToken);
    return NextResponse.json({
      creator: {
        username: creator.creator_username || null,
        nickname: creator.creator_nickname || null,
        privacyOptions: creator.privacy_level_options,
        maxVideoDurationSeconds: creator.max_video_post_duration_sec || null,
        commentDisabled: Boolean(creator.comment_disabled),
        duetDisabled: Boolean(creator.duet_disabled),
        stitchDisabled: Boolean(creator.stitch_disabled),
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    if (error instanceof Error && error.message === "FORBIDDEN") return NextResponse.json({ error: "You do not have permission to publish to TikTok." }, { status: 403 });
    console.error("TikTok creator info error:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to load TikTok publishing options." }, { status: 502 });
  }
}
