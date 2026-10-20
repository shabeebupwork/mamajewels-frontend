import { NextResponse } from "next/server";
import { pool } from "@/db/postgres";
import { requireRole } from "@/lib/require-auth";
import { fetchTikTokPublishStatus } from "@/lib/social-publishing";

export async function POST() {
  try {
    await requireRole(["Owner", "Administrator", "Editor and approver", "Reviewer", "Viewer"]);
    const integrationResult = await pool.query(
      `SELECT configuration FROM integrations WHERE provider = 'tiktok' ORDER BY id DESC LIMIT 1`,
    );
    const config = (integrationResult.rows[0]?.configuration || {}) as Record<string, unknown>;
    const accessToken = typeof config.access_token === "string" ? config.access_token.trim() : "";
    if (!accessToken) {
      const missingToken = await pool.query(
        `UPDATE publish_jobs SET status = 'failed', last_error = 'TikTok access token is unavailable for status checks.', updated_at = NOW()
         WHERE platform = 'tiktok' AND status = 'processing' RETURNING content_id, market`,
      );
      for (const job of missingToken.rows) {
        await pool.query(`UPDATE localized_variants SET status = 'publish_failed', updated_at = NOW() WHERE content_id = $1 AND market = $2`, [job.content_id, job.market]);
        await pool.query(`UPDATE content_items SET status = 'Publish failed', updated_at = NOW() WHERE id = $1`, [job.content_id]);
      }
      return NextResponse.json({ checked: 0, completed: 0, failed: missingToken.rowCount || 0, pending: 0 });
    }

    const interrupted = await pool.query(
      `UPDATE publish_jobs SET status = 'failed', last_error = 'Publishing request did not receive a platform response; retry from the content review.', updated_at = NOW()
       WHERE platform = 'tiktok' AND status = 'processing' AND platform_post_id IS NULL
         AND updated_at < NOW() - INTERVAL '2 minutes'
       RETURNING content_id, market`,
    );
    for (const job of interrupted.rows) {
      await pool.query(`UPDATE localized_variants SET status = 'publish_failed', updated_at = NOW() WHERE content_id = $1 AND market = $2`, [job.content_id, job.market]);
    }

    const jobs = await pool.query(
      `SELECT id, content_id, market, platform_post_id
       FROM publish_jobs
       WHERE platform = 'tiktok' AND status = 'processing' AND platform_post_id IS NOT NULL
         AND updated_at < NOW() - INTERVAL '30 seconds'
       ORDER BY updated_at ASC LIMIT 10`,
    );
    let completed = 0;
    let failed = 0;
    for (const job of jobs.rows) {
      try {
        const result = await fetchTikTokPublishStatus(accessToken, String(job.platform_post_id));
        const state = String(result.data?.status || "").toUpperCase();
        if (state === "PUBLISH_COMPLETE") {
          const publicIds = result.data?.publicaly_available_post_id;
          const postId = Array.isArray(publicIds) && publicIds.length ? String(publicIds[0]) : null;
          await pool.query(
            `UPDATE publish_jobs SET status = 'published', platform_post_id = COALESCE($2, platform_post_id), permalink = $3, published_at = NOW(), last_error = NULL, updated_at = NOW() WHERE id = $1`,
            [job.id, postId, postId ? `https://www.tiktok.com/video/${encodeURIComponent(postId)}` : null],
          );
          await pool.query(
            `UPDATE localized_variants SET status = 'published', published_at = COALESCE(published_at, NOW()), updated_at = NOW() WHERE content_id = $1 AND market = $2`,
            [job.content_id, job.market],
          );
          completed += 1;
        } else if (state === "FAILED") {
          const reason = String(result.data?.fail_reason || "TikTok could not publish this post.");
          await pool.query(`UPDATE publish_jobs SET status = 'failed', last_error = $2, updated_at = NOW() WHERE id = $1`, [job.id, reason]);
          await pool.query(`UPDATE localized_variants SET status = 'publish_failed', updated_at = NOW() WHERE content_id = $1 AND market = $2`, [job.content_id, job.market]);
          failed += 1;
        } else {
          await pool.query(`UPDATE publish_jobs SET updated_at = NOW() WHERE id = $1`, [job.id]);
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : "TikTok status check failed.";
        if (/access_token_invalid|scope_not_authorized|token_not_authorized|401/i.test(message)) {
          await pool.query(`UPDATE integrations SET status = 'error', health_details = COALESCE(health_details, '{}'::jsonb) || $2::jsonb, updated_at = NOW() WHERE provider = 'tiktok'`, [JSON.stringify({ last_error: message, error_at: new Date().toISOString() })]);
          await pool.query(`UPDATE publish_jobs SET status = 'failed', last_error = $2, updated_at = NOW() WHERE id = $1`, [job.id, message]);
          await pool.query(`UPDATE localized_variants SET status = 'publish_failed', updated_at = NOW() WHERE content_id = $1 AND market = $2`, [job.content_id, job.market]);
          failed += 1;
          continue;
        }
        await pool.query(`UPDATE publish_jobs SET last_error = $2, updated_at = NOW() WHERE id = $1`, [job.id, message]);
      }
    }

    const remaining = await pool.query(`SELECT COUNT(*) AS count FROM publish_jobs WHERE platform = 'tiktok' AND status = 'processing'`);
    const contentIds = [...new Set([
      ...interrupted.rows.map((job: { content_id: string | number }) => String(job.content_id)),
      ...jobs.rows.map((job: { content_id: string | number }) => String(job.content_id)),
    ])];
    for (const contentId of contentIds) {
      const state = await pool.query(
        `SELECT COUNT(*) FILTER (WHERE status = 'processing') AS processing,
                COUNT(*) FILTER (WHERE status = 'failed') AS failed
         FROM publish_jobs WHERE content_id = $1 AND platform IN ('pinterest', 'tiktok')`,
        [contentId],
      );
      const status = Number(state.rows[0]?.processing || 0) ? "Publishing" : Number(state.rows[0]?.failed || 0) ? "Publish failed" : "Published";
      await pool.query(`UPDATE content_items SET status = $2, updated_at = NOW() WHERE id = $1`, [contentId, status]);
    }
    return NextResponse.json({ checked: jobs.rowCount || 0, completed, failed, pending: Number(remaining.rows[0]?.count || 0) });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    if (error instanceof Error && error.message === "FORBIDDEN") return NextResponse.json({ error: "You do not have permission to check publishing status." }, { status: 403 });
    console.error("Publishing status check error:", error);
    return NextResponse.json({ error: "Unable to refresh publishing status." }, { status: 500 });
  }
}
