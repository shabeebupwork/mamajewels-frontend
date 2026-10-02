import { NextResponse } from "next/server";
import { pool } from "@/db/postgres";
import { requireAuth } from "@/lib/require-auth";

export async function GET(request: Request) {
  try {
    await requireAuth();
    const { searchParams } = new URL(request.url);
    const requestedDays = Number(searchParams.get("days") || 30);
    const days = [7, 30, 90].includes(requestedDays) ? requestedDays : 30;

    const [published, approval, ugc, failures] = await Promise.all([
      pool.query(
        `
        SELECT
          COUNT(*) FILTER (WHERE status = 'published') AS published_total,
          COUNT(*) FILTER (
            WHERE status = 'published'
            AND published_at >= NOW() - ($1 * INTERVAL '1 day')
          ) AS published_period
        FROM publish_jobs
        `,
        [days]
      ),

      pool.query(`
        SELECT
          COUNT(*) FILTER (WHERE status IN ('draft', 'pending')) AS waiting_approval,
          COUNT(*) FILTER (
            WHERE status IN ('draft', 'pending')
            AND market IN ('DE', 'FR', 'US')
          ) AS international_waiting
        FROM localized_variants
      `),

      pool.query(
        `
        SELECT
          COUNT(*) FILTER (
            WHERE discovered_at >= NOW() - ($1 * INTERVAL '1 day')
          ) AS new_ugc,
          COUNT(*) FILTER (
            WHERE discovered_at >= NOW() - ($1 * INTERVAL '1 day')
            AND permission_status = 'approved'
          ) AS approved_ugc
        FROM ugc_items
        `,
        [days]
      ),

      pool.query(
        `
        SELECT
          COUNT(*) AS total,
          COUNT(*) FILTER (WHERE status = 'resolved') AS resolved
        FROM workflow_errors
        WHERE occurred_at >= NOW() - ($1 * INTERVAL '1 day')
        `,
        [days]
      ),
    ]);

    const marketResult = await pool.query(
      `
      SELECT
        market,
        COUNT(*) AS published
      FROM publish_jobs
      WHERE status = 'published'
        AND published_at >= NOW() - ($1 * INTERVAL '1 day')
      GROUP BY market
      ORDER BY market
      `,
      [days]
    );

    const failureTotal = Number(failures.rows[0]?.total || 0);
    const failureResolved = Number(failures.rows[0]?.resolved || 0);

    const failureResolutionRate =
      failureTotal === 0
        ? null
        : Number(((failureResolved / failureTotal) * 100).toFixed(1));

    return NextResponse.json({
      period: days,
      published: Number(published.rows[0]?.published_total || 0),
      publishedPeriod: Number(published.rows[0]?.published_period || 0),
      waitingApproval: Number(approval.rows[0]?.waiting_approval || 0),
      internationalWaiting: Number(
        approval.rows[0]?.international_waiting || 0
      ),
      newUgc: Number(ugc.rows[0]?.new_ugc || 0),
      approvedUgc: Number(ugc.rows[0]?.approved_ugc || 0),
      failureResolutionRate,
      publishedByMarket: marketResult.rows.map(
        (row: { market: string; published: string }) => ({
          market: row.market,
          published: Number(row.published),
        })
      ),
    });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }
    console.error("Analytics error:", error);
    return NextResponse.json(
      { error: "Failed to load analytics" },
      { status: 500 }
    );
  }
}
