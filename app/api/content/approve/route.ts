import { NextResponse } from "next/server";
import { pool } from "@/db/postgres";
import { requireRole } from "@/lib/require-auth";
import { parseDriveFileIds, publicMediaUrl, publicMediaUrls } from "@/lib/media-url";
import { getTikTokCreatorInfo, publishPinterestImage, publishPinterestVideo, publishTikTok } from "@/lib/social-publishing";

const allowedMarkets = ["DE", "FR", "US"];
type Platform = "pinterest" | "tiktok";
type PinterestCarouselMode = "separate" | "first" | "skip";

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "The social platform request failed.";
}

async function refreshContentStatus(contentId: number) {
  const result = await pool.query(
    `SELECT COUNT(*) AS total_count,
            COUNT(*) FILTER (WHERE status = 'processing') AS processing_count,
            COUNT(*) FILTER (WHERE status = 'failed') AS failed_count
     FROM publish_jobs WHERE content_id = $1 AND platform IN ('pinterest', 'tiktok')`,
    [contentId],
  );
  const processing = Number(result.rows[0]?.processing_count || 0);
  const failed = Number(result.rows[0]?.failed_count || 0);
  const total = Number(result.rows[0]?.total_count || 0);
  const status = processing ? "Publishing" : failed ? "Publish failed" : total ? "Published" : "Approved";
  await pool.query(`UPDATE content_items SET status = $2, updated_at = NOW() WHERE id = $1`, [contentId, status]);
}

async function startPublishJob(input: {
  contentId: number;
  variantId: number | null;
  market: string;
  platform: Platform;
  slideIndex: number | null;
}) {
  const idempotencyKey = `${input.platform}:${input.contentId}:${input.market}:${input.slideIndex ?? 0}`;
  const inserted = await pool.query(
    `INSERT INTO publish_jobs
       (content_id, variant_id, market, platform, slide_index, status, idempotency_key, attempt_count, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, 'processing', $6, 1, NOW(), NOW())
     ON CONFLICT (idempotency_key) DO UPDATE SET status = 'processing',
       attempt_count = publish_jobs.attempt_count + 1, last_error = NULL, next_retry_at = NULL, updated_at = NOW()
     WHERE publish_jobs.status = 'failed'
     RETURNING id`,
    [input.contentId, input.variantId, input.market, input.platform, input.slideIndex, idempotencyKey],
  );
  if (inserted.rowCount) return { id: inserted.rows[0].id, started: true };
  const existing = await pool.query(`SELECT id, status, permalink, platform_post_id FROM publish_jobs WHERE idempotency_key = $1`, [idempotencyKey]);
  return { ...(existing.rows[0] || {}), started: false };
}

async function updateMarketStatus(contentId: number, market: string, platform: Platform) {
  const result = await pool.query(
    `SELECT COUNT(*) AS total,
            COUNT(*) FILTER (WHERE status = 'published') AS published,
            COUNT(*) FILTER (WHERE status = 'processing') AS processing,
            COUNT(*) FILTER (WHERE status = 'failed') AS failed
     FROM publish_jobs WHERE content_id = $1 AND market = $2 AND platform = $3`,
    [contentId, market, platform],
  );
  const row = result.rows[0];
  const total = Number(row.total || 0);
  const status = !total ? "approved" : Number(row.processing) ? "publishing" : Number(row.failed) ? "publish_failed" : Number(row.published) === total ? "published" : "approved";
  await pool.query(
    `UPDATE localized_variants
     SET status = $3, published_at = CASE WHEN $3 = 'published' THEN COALESCE(published_at, NOW()) ELSE published_at END, updated_at = NOW()
     WHERE content_id = $1 AND market = $2`,
    [contentId, market, status],
  );
}

export async function POST(request: Request) {
  try {
    const actor = await requireRole(["Owner", "Administrator", "Editor and approver"]);
    const body = await request.json() as {
      contentId?: string | number;
      markets?: string[];
      status?: string;
      platform?: Platform;
      pinterestCarouselMode?: PinterestCarouselMode;
      tiktokPrivacyLevel?: string;
      tiktokConsent?: boolean;
    };
    const contentId = Number(body.contentId);
    const markets = Array.isArray(body.markets) ? [...new Set(body.markets.map((market) => String(market).toUpperCase()))] : [];
    if (!Number.isSafeInteger(contentId) || contentId <= 0) return NextResponse.json({ error: "A valid contentId is required." }, { status: 400 });
    if (!markets.length || markets.some((market) => !allowedMarkets.includes(market))) {
      return NextResponse.json({ error: "Select one or more valid markets: DE, FR, US." }, { status: 400 });
    }

    const isSelected = body.status === "selected";
    const platform = body.platform;
    if (!isSelected && !platform) return NextResponse.json({ error: "Choose TikTok or Pinterest to publish. Approval alone does not publish content." }, { status: 400 });
    if (platform && !["pinterest", "tiktok"].includes(platform)) return NextResponse.json({ error: "Unsupported publishing platform." }, { status: 400 });

    const contentResult = await pool.query(
      `SELECT id, external_id, original_caption, content_type, drive_file_id, source_account FROM content_items WHERE id = $1 LIMIT 1`,
      [contentId],
    );
    if (!contentResult.rowCount) return NextResponse.json({ error: "Content item not found." }, { status: 404 });
    const content = contentResult.rows[0];
    const isMamaJewelsOwned = String(content.source_account || "").toLowerCase().includes("mamajewels.nl");
    let isGeneratedUgc = false;
    if (!isSelected && !isMamaJewelsOwned && content.external_id) {
      const ugcResult = await pool.query(
        `SELECT id FROM ugc_items
         WHERE external_id = $1
           AND LOWER(TRIM(COALESCE(permission_status, ''))) = 'completed'
         LIMIT 1`,
        [content.external_id],
      );
      isGeneratedUgc = Boolean(ugcResult.rowCount);
    }
    if (!isSelected && !isMamaJewelsOwned && !isGeneratedUgc) {
      return NextResponse.json({ error: "Only MamaJewels-owned content or UGC that has completed content generation can be published to TikTok or Pinterest." }, { status: 403 });
    }
    const driveFileIds = parseDriveFileIds(content.drive_file_id);
    const mediaUrls = publicMediaUrls(driveFileIds);
    const contentType = String(content.content_type || "image").toLowerCase();
    const isVideo = ["video", "reel"].includes(contentType);
    const isCarousel = contentType === "carousel" && driveFileIds.length > 1;

    if (isSelected) {
      for (const market of markets) {
        await pool.query(
          `INSERT INTO localized_variants (content_id, market, caption, status, approved_by, approved_at, updated_at)
           VALUES ($1, $2, '', 'selected', $3, NOW(), NOW())
           ON CONFLICT (content_id, market) DO UPDATE SET status = 'selected', approved_by = EXCLUDED.approved_by, approved_at = NOW(), updated_at = NOW()`,
          [contentId, market, actor.email || "dashboard"],
        );
      }
      await pool.query(`UPDATE content_items SET status = 'Selected', updated_at = NOW() WHERE id = $1`, [contentId]);
      return NextResponse.json({ success: true, contentId, markets, status: "selected" });
    }
    if (!platform) return NextResponse.json({ error: "Choose TikTok or Pinterest to publish." }, { status: 400 });

    if (platform === "pinterest" && isCarousel && !["separate", "first", "skip"].includes(String(body.pinterestCarouselMode))) {
      return NextResponse.json({ error: "Choose separate Pins, first image only, or cancel Pinterest publishing for this carousel." }, { status: 400 });
    }
    if (platform === "pinterest" && isCarousel && body.pinterestCarouselMode === "skip") {
      return NextResponse.json({ success: true, skipped: true, message: "Pinterest publishing was cancelled for this carousel." });
    }
    if (platform === "tiktok" && body.tiktokConsent !== true) return NextResponse.json({ error: "TikTok publishing requires your confirmation before media is sent." }, { status: 400 });
    if (!mediaUrls.length) return NextResponse.json({ error: "No publishable media file is available." }, { status: 400 });

    const integrationResult = await pool.query(
      `SELECT configuration, token_expires_at FROM integrations WHERE provider = $1 ORDER BY id DESC LIMIT 1`,
      [platform],
    );
    if (!integrationResult.rowCount) return NextResponse.json({ error: `${platform} is not configured in Settings > Integrations.` }, { status: 400 });
    const integration = integrationResult.rows[0];
    const config = (integration.configuration || {}) as Record<string, unknown>;
    const accessToken = typeof config.access_token === "string" ? config.access_token.trim() : "";
    const expiresAt = integration.token_expires_at || config.token_expires_at;
    if (!accessToken) return NextResponse.json({ error: `Add the ${platform} access token in Settings > Integrations.` }, { status: 400 });
    if (expiresAt && new Date(String(expiresAt)).getTime() <= Date.now()) return NextResponse.json({ error: `${platform} access token has expired. Update it in Settings > Integrations.` }, { status: 400 });

    let creatorInfo: Awaited<ReturnType<typeof getTikTokCreatorInfo>> | null = null;
    if (platform === "tiktok") {
      if (!body.tiktokPrivacyLevel) return NextResponse.json({ error: "Choose the TikTok audience before publishing." }, { status: 400 });
      creatorInfo = await getTikTokCreatorInfo(accessToken);
      if (!creatorInfo.privacy_level_options.includes(body.tiktokPrivacyLevel)) {
        return NextResponse.json({ error: "That TikTok privacy setting is no longer available. Reopen the publishing prompt and choose again." }, { status: 400 });
      }
    }

    const boardId = typeof config.board_id === "string" ? config.board_id.trim() : "";
    if (platform === "pinterest" && !boardId) return NextResponse.json({ error: "Add a Pinterest board ID in Settings > Integrations." }, { status: 400 });
    let coverImageUrl = "";
    if (isVideo && driveFileIds.length > 1) coverImageUrl = publicMediaUrl(driveFileIds[1]);

    const results: { market: string; status: string; postId?: string; slideIndex?: number; error?: string }[] = [];
    for (const market of markets) {
      const variantResult = await pool.query(`SELECT id, caption FROM localized_variants WHERE content_id = $1 AND market = $2 LIMIT 1`, [contentId, market]);
      const variant = variantResult.rows[0];
      const caption = String(variant?.caption || "").trim();
      if (!caption) {
        results.push({ market, status: "failed", error: `No caption is available for ${market}.` });
        continue;
      }

      const slideIndices = platform === "pinterest" && isCarousel
        ? body.pinterestCarouselMode === "separate" ? driveFileIds.map((_, index) => index) : [0]
        : [0];
      for (const slideIndex of slideIndices) {
        const job = await startPublishJob({
          contentId,
          variantId: variant?.id ? Number(variant.id) : null,
          market,
          platform,
          slideIndex: isCarousel && platform === "pinterest" ? slideIndex + 1 : null,
        });
        if (!job.started) {
          results.push({ market, status: job.status || "processing", postId: job.platform_post_id, slideIndex: isCarousel ? slideIndex + 1 : undefined });
          continue;
        }

        try {
          if (platform === "pinterest") {
            const mediaUrl = mediaUrls[slideIndex] || mediaUrls[0];
            const title = caption.split(/\s+/).slice(0, 10).join(" ");
            const pin = isVideo
              ? await publishPinterestVideo(accessToken, boardId, title, caption, mediaUrls[0], coverImageUrl)
              : await publishPinterestImage(accessToken, boardId, title, caption, mediaUrl);
            await pool.query(
              `UPDATE publish_jobs SET status = 'published', platform_post_id = $2, permalink = $3, published_at = NOW(), last_error = NULL, updated_at = NOW() WHERE id = $1`,
              [job.id, pin.id, pin.url],
            );
            results.push({ market, status: "published", postId: pin.id, slideIndex: isCarousel ? slideIndex + 1 : undefined });
          } else {
            const urls = isVideo ? [mediaUrls[0]] : (isCarousel ? mediaUrls : [mediaUrls[0]]);
            const post = await publishTikTok(accessToken, caption, urls, isVideo, body.tiktokPrivacyLevel!);
            await pool.query(`UPDATE publish_jobs SET status = 'processing', platform_post_id = $2, last_error = NULL, updated_at = NOW() WHERE id = $1`, [job.id, post.publishId]);
            results.push({ market, status: "processing", postId: post.publishId });
          }
        } catch (error) {
          const message = errorMessage(error);
          await pool.query(`UPDATE publish_jobs SET status = 'failed', last_error = $2, updated_at = NOW() WHERE id = $1`, [job.id, message]);
          results.push({ market, status: "failed", error: message, slideIndex: isCarousel ? slideIndex + 1 : undefined });
        }
      }
      await updateMarketStatus(contentId, market, platform);
    }

    await refreshContentStatus(contentId);
    const accepted = results.some((result) => result.status === "published" || result.status === "processing");
    const failed = results.filter((result) => result.status === "failed");
    if (!accepted && failed.length) return NextResponse.json({ success: false, results, error: failed.map((result) => result.error).join(" ") }, { status: 502 });
    const message = platform === "tiktok"
      ? "TikTok accepted the post request. The dashboard will update its status after processing finishes."
      : failed.length
        ? `Some Pinterest Pins were not created: ${failed.map((result) => result.error).join(" ")}`
        : "Pinterest Pins published.";
    return NextResponse.json({ success: true, contentId, platform, results, message, creator: creatorInfo?.creator_username || null }, { status: failed.length ? 207 : 202 });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    if (error instanceof Error && error.message === "FORBIDDEN") return NextResponse.json({ error: "You do not have permission to publish content." }, { status: 403 });
    console.error("Direct content publishing error:", error);
    return NextResponse.json({ error: errorMessage(error) }, { status: 500 });
  }
}
