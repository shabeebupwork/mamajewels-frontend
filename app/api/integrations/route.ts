import { NextResponse } from "next/server";
import { pool } from "@/db/postgres";
import { requireRole } from "@/lib/require-auth";

const allowedProviders = ["apify", "openai", "meta", "n8n"];

const allowedKeys: Record<string, string[]> = {
  apify: ["api_token"],
  openai: ["api_key"],
  meta: ["page_id", "access_token"],
  n8n: ["base_url", "api_key"],
};

const secretKeys: Record<string, string[]> = {
  apify: ["api_token"],
  openai: ["api_key"],
  meta: ["access_token"],
  n8n: ["api_key"],
};
export async function GET() {
  try {
    await requireRole(["Owner", "Administrator"]);

    const result = await pool.query(`
      SELECT
        id,
        provider,
        market,
        account_name,
        status,
        token_expires_at,
        last_health_check,
        health_details,
        configuration,
        created_at,
        updated_at
      FROM integrations
      ORDER BY provider, market NULLS FIRST
    `);

    const integrations = result.rows.map((row: any) => {
      const config = row.configuration || {};
      const secrets = secretKeys[row.provider] || [];

      const safeConfiguration: Record<string, unknown> = {};

      for (const key of allowedKeys[row.provider] || []) {
        if (row.provider === "meta") continue;
        if (secrets.includes(key)) {
          safeConfiguration[`has_${key}`] = Boolean(config[key]);
        } else if (config[key] !== undefined) {
          safeConfiguration[key] = config[key];
        }
      }

      if (row.provider === "meta") {
        if (config.page_id !== undefined) safeConfiguration.page_id = config.page_id;
        safeConfiguration.has_access_token = Boolean(config.access_token);
        for (const key of ["token_expiry", "days_until_expiry", "token_health"]) {
          if (config[key] !== undefined) safeConfiguration[key] = config[key];
        }
      }

      const healthDetails = row.provider === "meta"
        ? {
            username: row.health_details?.username ?? null,
            token_valid: row.health_details?.token_valid ?? null,
          }
        : row.health_details;

      return {
        id: row.id,
        provider: row.provider,
        market: row.market,
        account_name: row.account_name,
        status: row.status,
        token_expires_at: row.token_expires_at,
        last_health_check: row.last_health_check,
        health_details: healthDetails,
        configuration: safeConfiguration,
        created_at: row.created_at,
        updated_at: row.updated_at,
      };
    });

    return NextResponse.json({ integrations });
  } catch (error) {
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
      { error: "Unable to load integrations" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    await requireRole(["Owner", "Administrator"]);

    const body = (await request.json()) as {
        id?: number;
        configuration?: Record<string, unknown>;
        };

    const id = Number(body.id);
    const configuration = body.configuration;


    if (!Number.isInteger(id) || !configuration || typeof configuration !== "object") {
      return NextResponse.json(
        { error: "Integration ID and configuration are required" },
        { status: 400 }
      );
    }

    const existing = await pool.query(
      `
      SELECT provider
      FROM integrations
      WHERE id = $1
      LIMIT 1
      `,
      [id]
    );

    if (existing.rowCount === 0) {
      return NextResponse.json(
        { error: "Integration not found" },
        { status: 404 }
      );
    }

    const provider = existing.rows[0].provider;

    if (!allowedProviders.includes(provider)) {
      return NextResponse.json(
        { error: "Unsupported integration provider" },
        { status: 400 }
      );
    }

    const allowed = allowedKeys[provider];
    const cleanConfiguration: Record<string, string> = {};

    for (const [key, value] of Object.entries(configuration)) {
      if (!allowed.includes(key)) {
        return NextResponse.json(
          { error: `Unsupported configuration field: ${key}` },
          { status: 400 }
        );
      }

      if (typeof value !== "string") {
        return NextResponse.json(
          { error: `Configuration field ${key} must be text` },
          { status: 400 }
        );
      }

      if (value.trim() !== "") {
        cleanConfiguration[key] = value.trim();
      }
    }

    const result = await pool.query(
      `
      UPDATE integrations
      SET
        configuration = configuration || $2::jsonb,
        updated_at = NOW()
      WHERE id = $1
      RETURNING
        id,
        provider,
        market,
        account_name,
        status,
        token_expires_at,
        last_health_check,
        updated_at
      `,
      [id, JSON.stringify(cleanConfiguration)]
    );

    return NextResponse.json({
      integration: result.rows[0],
    });
  } catch (error) {
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
      { error: "Unable to update integration" },
      { status: 500 }
    );
  }
}
