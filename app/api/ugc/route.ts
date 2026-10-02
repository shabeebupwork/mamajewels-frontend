import { NextResponse } from "next/server";
import { pool } from "@/db/postgres";
import { requireAuth } from "@/lib/require-auth";
import { parseDriveFileIds, publicMediaUrls } from "@/lib/media-url";

export async function GET() {
  try {
    await requireAuth();
    const result = await pool.query(`
      SELECT
        id,
        external_id,
        market,
        creator_username,
        caption,
        media_type,
        permalink,
        published_at,
        discovered_at,
        drive_file_id,
        engagement,
        permission_status AS status,
        source,
        raw_payload
      FROM ugc_items
      WHERE LOWER(COALESCE(permission_status, 'new')) NOT IN ('completed', 'rejected', 'declined')
      ORDER BY discovered_at DESC
      LIMIT 100
    `);

    const items = result.rows.map((row: any) => {
      const driveFileIds = parseDriveFileIds(row.drive_file_id);
      const images = publicMediaUrls(driveFileIds);
      const mediaUrl = images[0] || row.raw_payload?.media_url || "";

      const rawStatus = String(row.status || "new").trim().toLowerCase();
      const statusLabels: Record<string, string> = {
        "tag new": "new",
        tag_new: "new",
        ready_for_approval_tagged: "ready_for_approval",
        not_requested: "new",
        requested: "new",
        approved: "ready_for_approval",
        declined: "rejected",
      };
      const status = statusLabels[rawStatus] || rawStatus;

      return {
        id: String(row.id),
        externalId: row.external_id,
        kind: "ugc",
        market: row.market,
        creator: row.creator_username || "Unknown creator",
        capturedLabel: row.discovered_at
            ? new Date(row.discovered_at).toLocaleString()
            : "Unknown date",
        title: row.creator_username
          ? `UGC by @${row.creator_username}`
          : "UGC content",
        caption: row.caption || "",
        type: "UGC",
        image: mediaUrl,
        images: images.length ? images : mediaUrl ? [mediaUrl] : [],
        driveFileId: driveFileIds[0] || null,
        driveFileIds,
        mediaType: row.media_type || "image",
        source: row.source || "Instagram",
        status,
        permalink: row.permalink || null,
        publishedAt: row.published_at || null,
        discoveredAt: row.discovered_at || null,
        engagement: row.engagement || {},
      };
    });

    return NextResponse.json(items);
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }
    console.error("UGC content error:", error);

    return NextResponse.json(
      { error: "Failed to load UGC content" },
      { status: 500 }
    );
  }
}
