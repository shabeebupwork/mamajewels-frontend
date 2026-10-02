import { NextResponse } from "next/server";
import { pool } from "@/db/postgres";
import { requireRole } from "@/lib/require-auth";

export async function GET() {
  try {
    await requireRole(["Owner", "Administrator"]);

    const result = await pool.query(
      `
      SELECT configuration
      FROM integrations
      WHERE provider = 'apify'
        AND market IS NULL
      ORDER BY id
      LIMIT 1
      `
    );

    if (result.rowCount === 0) {
      return NextResponse.json(
        { error: "Apify integration not found" },
        { status: 404 }
      );
    }

    const configuration = result.rows[0].configuration || {};
    const apiToken = configuration.api_token;

    if (!apiToken) {
      return NextResponse.json(
        { error: "Apify API token is not configured" },
        { status: 400 }
      );
    }

    const headers = {
      Authorization: `Bearer ${apiToken}`,
    };

    const userResponse = await fetch(
      "https://api.apify.com/v2/users/me",
      {
        headers,
        cache: "no-store",
      }
    );

    if (!userResponse.ok) {
      await pool.query(
        `
        UPDATE integrations
        SET
            status = 'error',
            last_health_check = NOW(),
            health_details = $1::jsonb,
            updated_at = NOW()
        WHERE provider = 'apify'
            AND market IS NULL
        `,
        [
            JSON.stringify({
            healthy: false,
            error: "Apify authentication failed",
            }),
        ]
        );

      return NextResponse.json(
        { error: "Apify token is invalid or unavailable" },
        { status: 502 }
      );
    }

    const limitsResponse = await fetch(
      "https://api.apify.com/v2/users/me/limits",
      {
        headers,
        cache: "no-store",
      }
    );

    if (!limitsResponse.ok) {
      return NextResponse.json(
        { error: "Unable to retrieve Apify usage limits" },
        { status: 502 }
      );
    }

    const userData = (await userResponse.json()) as {
      data?: {
        username?: string;
        plan?: {
          id?: string;
        };
      };
    };

    const limitsData = (await limitsResponse.json()) as {
      data?: {
        monthlyUsageCycle?: {
          startAt?: string;
          endAt?: string;
        };
        limits?: {
          maxMonthlyUsageUsd?: number;
        };
        current?: {
          monthlyUsageUsd?: number;
        };
      };
    };

    const limits = limitsData.data;

    const monthlyLimit = limits?.limits?.maxMonthlyUsageUsd ?? null;
    const monthlyUsage = limits?.current?.monthlyUsageUsd ?? null;

    const remaining =
      monthlyLimit !== null && monthlyUsage !== null
        ? Math.max(monthlyLimit - monthlyUsage, 0)
        : null;

    await pool.query(
        `
        UPDATE integrations
        SET
            status = 'healthy',
            last_health_check = NOW(),
            health_details = $1::jsonb,
            updated_at = NOW()
        WHERE provider = 'apify'
            AND market IS NULL
        `,
        [
            JSON.stringify({
            healthy: true,
            username: userData.data?.username ?? null,
            plan: userData.data?.plan?.id ?? null,
            monthly_usage_usd: monthlyUsage,
            monthly_limit_usd: monthlyLimit,
            monthly_remaining_usd: remaining,
            usage_cycle_start: limits?.monthlyUsageCycle?.startAt ?? null,
            usage_cycle_end: limits?.monthlyUsageCycle?.endAt ?? null,
            }),
        ]
    );

    return NextResponse.json({
      healthy: true,
      username: userData.data?.username ?? null,
      plan: userData.data?.plan?.id ?? null,
      monthlyUsageUsd: monthlyUsage,
      monthlyLimitUsd: monthlyLimit,
      monthlyRemainingUsd: remaining,
      usageCycleStart: limits?.monthlyUsageCycle?.startAt ?? null,
      usageCycleEnd: limits?.monthlyUsageCycle?.endAt ?? null,
    });
  } catch (error) {
    console.error("APIFY_HEALTH_ERROR:", error);
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    if (error instanceof Error && error.message === "FORBIDDEN") {
      return NextResponse.json(
        { error: "Administrator access required" },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { error: "Unable to check Apify health" },
      { status: 500 }
    );
  }
}