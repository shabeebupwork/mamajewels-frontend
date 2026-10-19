import { NextResponse } from "next/server";
import { pool } from "@/db/postgres";
import { requireAuth } from "@/lib/require-auth";
import { parseDriveFileIds, publicMediaUrls } from "@/lib/media-url";

export async function GET() {
  try {
    await requireAuth();
    const publishResult = await pool.query(`
      SELECT
        id,
        content_id,
        variant_id,
        market,
        status,
        meta_container_id,
        meta_media_id,
        permalink,
        last_error,
        published_at,
        created_at,
        updated_at
      FROM publish_jobs
      WHERE status IN ('published', 'selected')
      ORDER BY published_at DESC NULLS LAST, created_at DESC
      LIMIT 100
    `);

    const contentResult = await pool.query(`
      SELECT
        id,
        external_id,
        source_account,
        original_caption,
        content_type,
        permalink,
        published_at,
        captured_at,
        drive_file_id,
        status
      FROM content_items
      WHERE id = ANY($1::bigint[])
    `, [
      publishResult.rows.map((row: any) => row.content_id)
    ]);

    const contentMap = new Map<string, any>(
      contentResult.rows.map((row: any) => [
        String(row.id),
        row,
      ])
    );

    const published = publishResult.rows.map((row: any) => {
      const content = contentMap.get(String(row.content_id));
      const driveFileIds = parseDriveFileIds(content?.drive_file_id);
      const images = publicMediaUrls(driveFileIds);

      return {
        id: String(row.id),
        contentId: String(row.content_id),
        variantId: row.variant_id
          ? String(row.variant_id)
          : null,

        market: row.market,
        status: row.status,

        title:
          content?.original_caption ||
          `Content ${row.content_id}`,

        source:
          content?.source_account ||
          "",

        type:
          content?.content_type || "",

        caption:
          content?.original_caption ||
          "",

        originalPermalink:
          content?.permalink ||
          null,

        permalink:
          row.permalink ||
          null,

        metaMediaId:
          row.meta_media_id ||
          null,

        metaContainerId:
          row.meta_container_id ||
          null,

        publishedAt:
          row.published_at ||
          null,

        createdAt:
          row.created_at ||
          null,

        updatedAt:
          row.updated_at ||
          null,

        mediaType:
          content?.content_type || "image",
        capturedAt: content?.captured_at || null,
        capturedLabel: content?.captured_at
          ? new Date(content.captured_at).toLocaleString("en-GB", {
              day: "2-digit",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })
          : "—",
        driveFileId: driveFileIds[0] || null,
        driveFileIds,
        images,

        image: images[0] || null,

        lastError:
          row.last_error ||
          null,
      };
    });

    return NextResponse.json(published);
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }
    console.error("Published content error:", error);

    return NextResponse.json(
      { error: "Failed to load published content" },
      { status: 500 }
    );
  }
}
