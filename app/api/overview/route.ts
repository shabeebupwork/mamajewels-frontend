import { NextResponse } from "next/server";
import { pool } from "@/db/postgres";
import { requireAuth } from "@/lib/require-auth";

export async function GET() {
  try {
    await requireAuth();
    const [content, approval, published, failures, accounts] = await Promise.all([
      pool.query(`
        SELECT COUNT(*) AS total
        FROM content_items
      `),

      pool.query(`
        SELECT COUNT(*) AS total
        FROM localized_variants
        WHERE status IN ('draft', 'pending')
      `),

      pool.query(`
        SELECT
          COUNT(*) FILTER (
            WHERE status = 'published'
            AND published_at >= NOW() - INTERVAL '7 days'
          ) AS published_7d,
          COUNT(*) FILTER (
            WHERE status = 'published'
          ) AS published_total
        FROM publish_jobs
      `),

      pool.query(`
        SELECT
          COUNT(*) FILTER (WHERE occurred_at >= NOW() - INTERVAL '30 days') AS total_30d,
          COUNT(*) FILTER (WHERE status = 'resolved' AND occurred_at >= NOW() - INTERVAL '30 days') AS resolved_30d,
          COUNT(*) FILTER (WHERE status <> 'resolved') AS open
        FROM workflow_errors
      `),
      pool.query(`
        SELECT market, account_name, status
        FROM integrations
        WHERE provider = 'meta'
        ORDER BY market NULLS FIRST, account_name
      `),
    ]);

    const failureTotal = Number(failures.rows[0]?.total_30d || 0);
    const failureResolved = Number(failures.rows[0]?.resolved_30d || 0);

    const failureResolutionRate =
      failureTotal === 0
        ? null
        : Number(((failureResolved / failureTotal) * 100).toFixed(1));

    return NextResponse.json({
      capturedContent: Number(content.rows[0]?.total || 0),
      pendingApproval: Number(approval.rows[0]?.total || 0),
      published7d: Number(published.rows[0]?.published_7d || 0),
      publishedTotal: Number(published.rows[0]?.published_total || 0),
      failureResolutionRate,
      openFailures: Number(failures.rows[0]?.open || 0),
      publishingAccounts: accounts.rows.map((row: { market: string | null; account_name: string | null; status: string | null }) => ({
        market: row.market,
        accountName: row.account_name,
        status: row.status,
      })),
    });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }
    console.error("Overview error:", error);

    return NextResponse.json(
      { error: "Failed to load overview" },
      { status: 500 }
    );
  }
}
