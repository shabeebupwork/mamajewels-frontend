import { NextResponse } from "next/server";
import { pool } from "@/db/postgres";
import { requireRole } from "@/lib/require-auth";
import { publicMediaUrl, parseDriveFileIds } from "@/lib/media-url";

const allowedMarkets = ["DE", "FR", "US"];

async function publishToPinterest(
  accessToken: string,
  boardId: string,
  title: string,
  description: string,
  mediaUrl: string
) {
  const response = await fetch("https://api.pinterest.com/v5/pins", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      board_id: boardId,
      title: title.slice(0, 95) || "Mama Jewels",
      description: description.slice(0, 795),
      media_source: {
        source_type: "image_url",
        url: mediaUrl,
      },
    }),
  });

  const data: any = await response.json().catch(() => ({}));
  if (!response.ok) {
    const errorMsg = data.message || data.error?.message || `Pinterest HTTP ${response.status}`;
    throw new Error(`Pinterest error: ${errorMsg}`);
  }
  return { id: data.id, url: `https://www.pinterest.com/pin/${data.id}/` };
}

async function publishToTikTok(
  accessToken: string,
  caption: string,
  mediaUrl: string,
  isVideo: boolean
) {
  const url = isVideo
    ? "https://open.tiktokapis.com/v2/post/publish/video/init/"
    : "https://open.tiktokapis.com/v2/post/publish/content/init/";

  const body = isVideo
    ? {
        post_info: {
          title: caption.slice(0, 150),
          privacy_level: "PUBLIC_TO_EVERYONE",
          disable_duet: false,
          disable_stitch: false,
          disable_comment: false,
        },
        source_info: {
          source: "PULL_FROM_URL",
          video_url: mediaUrl,
        },
      }
    : {
        post_info: {
          title: caption.slice(0, 150),
          privacy_level: "PUBLIC_TO_EVERYONE",
        },
        source_info: {
          source: "PULL_FROM_URL",
          photo_cover_index: 1,
          photo_images: [mediaUrl],
        },
      };

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json; charset=UTF-8",
    },
    body: JSON.stringify(body),
  });

  const data: any = await response.json().catch(() => ({}));
  if (!response.ok || (data.error && data.error.code !== "ok")) {
    const errorMsg = data.error?.message || data.message || `TikTok HTTP ${response.status}`;
    throw new Error(`TikTok error: ${errorMsg}`);
  }
  return { id: data.data?.publish_id || "ok" };
}

export async function POST(request: Request) {
  try {
    const actor = await requireRole(["Owner", "Administrator", "Editor and approver"]);
    const body = (await request.json()) as {
      contentId: string | number;
      markets?: string[];
      actor_email?: string;
      status?: string;
      platform?: "pinterest" | "tiktok";
      action?: string;
    };

    const contentId = Number(body.contentId);
    const markets = Array.isArray(body.markets)
      ? [...new Set(body.markets.map((market) => String(market).toUpperCase()))]
      : [];

    if (!Number.isInteger(contentId) || contentId <= 0) {
      return NextResponse.json({ error: "contentId is required" }, { status: 400 });
    }
    if (markets.length === 0 || markets.some((market) => !allowedMarkets.includes(market))) {
      return NextResponse.json(
        { error: "Select one or more valid markets: DE, FR, US" },
        { status: 400 }
      );
    }

    const actorEmail = actor.email || body.actor_email || "dashboard";
    const isSelected = body.status === "selected";
    const platform = body.platform;

    // 1. Fetch content details
    const contentRes = await pool.query(
      `SELECT id, original_caption, content_type, drive_file_id FROM content_items WHERE id = $1`,
      [contentId]
    );
    if (contentRes.rowCount === 0) {
      return NextResponse.json({ error: "Content item not found" }, { status: 404 });
    }
    const content = contentRes.rows[0];
    const driveIds = parseDriveFileIds(content.drive_file_id);
    const mediaUrl = driveIds.length > 0 ? publicMediaUrl(driveIds[0]) : "";

    // 2. Direct platform publishing
    let publishResults: Record<string, string> = {};

    if (platform && !isSelected) {
      // Check credentials in integrations table
      const integRes = await pool.query(
        `SELECT configuration, status, token_expires_at FROM integrations WHERE provider = $1 ORDER BY id DESC LIMIT 1`,
        [platform]
      );

      if (integRes.rowCount === 0) {
        return NextResponse.json(
          { error: `${platform.toUpperCase()} integration is not configured. Add credentials in Settings > Integrations.` },
          { status: 400 }
        );
      }

      const integ = integRes.rows[0];
      const config = integ.configuration || {};

      if (integ.token_expires_at && new Date(integ.token_expires_at) < new Date()) {
        return NextResponse.json(
          { error: `${platform.toUpperCase()} access token expired on ${new Date(integ.token_expires_at).toLocaleDateString()}. Please refresh it in Settings > Integrations.` },
          { status: 400 }
        );
      }

      const accessToken = (config.access_token as string || "").trim();
      if (!accessToken) {
        return NextResponse.json(
          { error: `Missing Access Token for ${platform.toUpperCase()}. Please update Settings > Integrations.` },
          { status: 400 }
        );
      }

      if (!mediaUrl) {
        return NextResponse.json({ error: "Media file URL is missing for this item." }, { status: 400 });
      }

      if (platform === "pinterest") {
        const boardId = (config.board_id as string || "").trim();
        if (!boardId) {
          return NextResponse.json(
            { error: "Pinterest Board ID is missing. Please set it in Settings > Integrations." },
            { status: 400 }
          );
        }

        for (const m of markets) {
          const varRes = await pool.query(
            `SELECT caption FROM localized_variants WHERE content_id = $1 AND market = $2`,
            [contentId, m]
          );
          const caption = (varRes.rows[0]?.caption || content.original_caption || "").trim();

          try {
            const res = await publishToPinterest(accessToken, boardId, caption, caption, mediaUrl);
            publishResults[m] = res.url || res.id;
          } catch (err: any) {
            // Update integration status to error on credential/auth failures
            if (err.message.includes("401") || err.message.includes("unauthorized") || err.message.includes("token")) {
              await pool.query(
                `UPDATE integrations SET status = 'error', health_details = jsonb_build_object('last_error', $2, 'error_at', NOW()) WHERE provider = 'pinterest'`,
                [err.message]
              );
            }
            return NextResponse.json({ error: err.message }, { status: 400 });
          }
        }
      } else if (platform === "tiktok") {
        const isVideo = content.content_type?.toLowerCase() === "video" || content.content_type?.toLowerCase() === "reel";

        for (const m of markets) {
          const varRes = await pool.query(
            `SELECT caption FROM localized_variants WHERE content_id = $1 AND market = $2`,
            [contentId, m]
          );
          const caption = (varRes.rows[0]?.caption || content.original_caption || "").trim();

          try {
            const res = await publishToTikTok(accessToken, caption, mediaUrl, isVideo);
            publishResults[m] = res.id;
          } catch (err: any) {
            if (err.message.includes("401") || err.message.includes("token")) {
              await pool.query(
                `UPDATE integrations SET status = 'error', health_details = jsonb_build_object('last_error', $2, 'error_at', NOW()) WHERE provider = 'tiktok'`,
                [err.message]
              );
            }
            return NextResponse.json({ error: err.message }, { status: 400 });
          }
        }
      }
    }

    // 3. Upsert localized_variants for selected markets
    const finalStatus = isSelected ? "selected" : "published";

    for (const m of markets) {
      await pool.query(
        `
        INSERT INTO localized_variants (content_id, market, caption, status, approved_by, approved_at, published_at, updated_at)
        VALUES ($1, $2, '', $3, $4, NOW(), ${isSelected ? "NULL" : "NOW()"}, NOW())
        ON CONFLICT (content_id, market)
        DO UPDATE SET
          status = EXCLUDED.status,
          approved_by = EXCLUDED.approved_by,
          approved_at = NOW(),
          published_at = ${isSelected ? "localized_variants.published_at" : "NOW()"},
          updated_at = NOW()
        `,
        [contentId, m, finalStatus, actorEmail]
      );
    }

    const approval = await pool.query(
      `SELECT id, market FROM localized_variants WHERE content_id = $1 AND market = ANY($2::text[])`,
      [contentId, markets]
    );

    // 4. Update content_items status
    await pool.query(
      `UPDATE content_items SET status = $2, updated_at = NOW() WHERE id = $1`,
      [contentId, isSelected ? "Selected" : "Published"]
    );

    // 5. Record in publish_jobs
    for (const row of approval.rows) {
      const idempotencyKey = `${isSelected ? "selected" : platform || "published"}_${contentId}_${row.market}_${Date.now()}`;
      const permalink = publishResults[row.market] || null;

      await pool.query(
        `
        INSERT INTO publish_jobs (content_id, variant_id, market, status, idempotency_key, permalink, published_at, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, ${isSelected ? "NULL" : "NOW()"}, NOW(), NOW())
        ON CONFLICT (idempotency_key) DO NOTHING
        `,
        [contentId, row.id, row.market, finalStatus, idempotencyKey, permalink]
      );
    }

    return NextResponse.json({
      success: true,
      contentId,
      markets: approval.rows.map((r: { market: string }) => r.market),
      published: !isSelected,
    });
  } catch (error: any) {
    console.error("Approve/Publish error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to process publish request" },
      { status: 500 }
    );
  }
}
