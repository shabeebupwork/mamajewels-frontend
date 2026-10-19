import { NextResponse } from "next/server";
import { pool } from "@/db/postgres";
import { requireAuth } from "@/lib/require-auth";
import { parseDriveFileIds, publicMediaUrls } from "@/lib/media-url";

export async function GET(request: Request) {
  try {
    await requireAuth();
    const { searchParams } = new URL(request.url);
    const filterStatus = searchParams.get("status");
    const isCompleted = filterStatus?.toLowerCase() === "completed";

    // For completed items (UGC Content), join with content_items and localized_variants
    // to retrieve the translated captions for DE, FR, US
    const query = isCompleted
      ? `
        SELECT
          u.id AS ugc_id,
          COALESCE(c.id, u.id) AS id,
          u.external_id,
          u.market,
          u.creator_username,
          u.caption,
          u.media_type,
          u.permalink,
          u.published_at,
          u.discovered_at,
          u.drive_file_id,
          u.engagement,
          u.permission_status AS status,
          u.source,
          u.raw_payload,
          COALESCE(
            JSON_AGG(
              JSON_BUILD_OBJECT(
                'market', lv.market,
                'caption', lv.caption,
                'status', lv.status,
                'approved_by', lv.approved_by,
                'approved_at', lv.approved_at,
                'published_at', lv.published_at,
                'meta_media_id', lv.meta_media_id
              )
            ) FILTER (WHERE lv.id IS NOT NULL),
            '[]'::json
          ) AS localizations
        FROM ugc_items u
        LEFT JOIN content_items c ON c.external_id = u.external_id
        LEFT JOIN localized_variants lv ON lv.content_id = COALESCE(c.id, u.id)
        WHERE LOWER(TRIM(COALESCE(u.permission_status, ''))) = 'completed'
        GROUP BY u.id, c.id
        ORDER BY u.updated_at DESC, u.discovered_at DESC
        LIMIT 100
      `
      : `
        SELECT
          u.id AS ugc_id,
          u.id,
          u.external_id,
          u.market,
          u.creator_username,
          u.caption,
          u.media_type,
          u.permalink,
          u.published_at,
          u.discovered_at,
          u.drive_file_id,
          u.engagement,
          u.permission_status AS status,
          u.source,
          u.raw_payload,
          '[]'::json AS localizations
        FROM ugc_items u
        WHERE LOWER(TRIM(COALESCE(u.permission_status, 'new'))) NOT IN ('completed', 'rejected', 'declined')
        ORDER BY u.discovered_at DESC
        LIMIT 100
      `;

    const result = await pool.query(query);

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
        completed: "ready_for_approval",
      };
      const status = isCompleted ? "ready_for_approval" : (statusLabels[rawStatus] || rawStatus);

      const mediaType = row.media_type || "image";
      const displayType =
        mediaType === "carousel"
          ? "Carousel"
          : mediaType === "video" || mediaType === "reel"
            ? "Reel"
            : "Image";

      const market = String(row.market || "NL").toUpperCase();

      const localizations = Array.isArray(row.localizations)
        ? row.localizations
        : typeof row.localizations === "string"
          ? JSON.parse(row.localizations)
          : [];

      const availableMarkets = localizations.map((item: any) => String(item.market).toUpperCase());
      const allMarkets = Array.from(new Set([market, "DE", "FR", "US", ...availableMarkets]));

      return {
        id: String(row.id),
        externalId: row.external_id,
        kind: isCompleted ? "ugc_content" : "ugc",
        market,
        markets: allMarkets,
        creator: row.creator_username || "Unknown creator",
        capturedLabel: row.discovered_at
          ? new Date(row.discovered_at).toLocaleString("en-GB", {
              day: "2-digit",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })
          : "—",
        title: row.creator_username
          ? `UGC by @${row.creator_username}`
          : "UGC content",
        caption: row.caption || "",
        type: displayType,
        image: mediaUrl,
        images: images.length ? images : mediaUrl ? [mediaUrl] : [],
        driveFileId: driveFileIds[0] || null,
        driveFileIds,
        mediaType,
        source: row.creator_username ? `@${row.creator_username}` : (row.source || "UGC"),
        status,
        permalink: row.permalink || null,
        publishedAt: row.published_at || null,
        discoveredAt: row.discovered_at || null,
        engagement: row.engagement || {},
        localizations,
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
