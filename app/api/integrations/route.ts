import { NextResponse } from "next/server";
import { pool } from "@/db/postgres";
import { requireRole } from "@/lib/require-auth";

const allowedProviders = ["apify", "openai", "n8n", "pinterest", "tiktok"];

const allowedKeys: Record<string, string[]> = {
  apify: ["api_token"],
  openai: ["api_key"],
  n8n: ["base_url", "api_key"],
  pinterest: ["app_id", "app_secret", "access_token", "board_id", "token_expires_at"],
  tiktok: ["client_key", "client_secret", "access_token", "token_expires_at"],
};

const secretKeys: Record<string, string[]> = {
  apify: ["api_token"],
  openai: ["api_key"],
  n8n: ["api_key"],
  pinterest: ["app_secret", "access_token"],
  tiktok: ["client_secret", "access_token"],
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
        activate,
        token_expires_at,
        last_health_check,
        health_details,
        configuration,
        created_at,
        updated_at
      FROM integrations
      WHERE provider = ANY($1::text[])
      ORDER BY provider, market NULLS FIRST
    `, [allowedProviders]);

    const integrations = result.rows.map((row: any) => {
      const config = row.configuration || {};
      const secrets = secretKeys[row.provider] || [];
      const safeConfiguration: Record<string, unknown> = {};

      for (const key of allowedKeys[row.provider] || []) {
        if (secrets.includes(key)) {
          safeConfiguration[`has_${key}`] = Boolean(config[key]);
        } else if (config[key] !== undefined) {
          safeConfiguration[key] = config[key];
        }
      }

      return {
        id: row.id,
        provider: row.provider,
        market: row.market,
        account_name: row.account_name,
        status: row.status || "active",
        activate: row.activate || "active",
        token_expires_at: row.token_expires_at || config.token_expires_at || null,
        last_health_check: row.last_health_check,
        health_details: row.health_details || {},
        configuration: safeConfiguration,
        created_at: row.created_at,
        updated_at: row.updated_at,
      };
    });

    return NextResponse.json({ integrations });
  } catch (error) {
    console.error("Unable to load integrations:", error);
    return NextResponse.json({ error: "Unable to load integrations" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await requireRole(["Owner", "Administrator"]);

    const body = (await request.json()) as {
      id?: number;
      provider?: string;
      account_name?: string;
      configuration?: Record<string, unknown>;
      status?: string;
      token_expires_at?: string;
    };

    const { id, provider, account_name, configuration, status, token_expires_at } = body;

    if (!configuration || typeof configuration !== "object") {
      return NextResponse.json({ error: "Configuration object is required" }, { status: 400 });
    }

    // Update existing or Insert new integration row
    if (id) {
      const cleanConfig: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(configuration)) {
        if (typeof v === "string" && v.trim() !== "") cleanConfig[k] = v.trim();
      }

      const result = await pool.query(
        `
        UPDATE integrations
        SET
          configuration = configuration || $2::jsonb,
          status = COALESCE($3, status),
          token_expires_at = COALESCE($4::timestamptz, token_expires_at),
          updated_at = NOW()
        WHERE id = $1
        RETURNING id, provider, account_name, status, activate, token_expires_at, updated_at
        `,
        [id, JSON.stringify(cleanConfig), status || "active", token_expires_at || null]
      );

      return NextResponse.json({ integration: result.rows[0] });
    } else if (provider && allowedProviders.includes(provider)) {
      if (provider === "pinterest" || provider === "tiktok") {
        const existing = await pool.query(
          `SELECT id FROM integrations WHERE provider = $1 ORDER BY id DESC LIMIT 1`,
          [provider],
        );
        if (existing.rowCount) {
          const cleanConfig: Record<string, unknown> = {};
          for (const [key, value] of Object.entries(configuration)) {
            if (typeof value === "string" && value.trim()) cleanConfig[key] = value.trim();
          }
          const updated = await pool.query(
            `UPDATE integrations
             SET configuration = configuration || $2::jsonb,
                 status = COALESCE($3, status),
                 token_expires_at = COALESCE($4::timestamptz, token_expires_at),
                 updated_at = NOW()
             WHERE id = $1
             RETURNING id, provider, account_name, status, activate, token_expires_at, updated_at`,
            [existing.rows[0].id, JSON.stringify(cleanConfig), status || "active", token_expires_at || null],
          );
          return NextResponse.json({ integration: updated.rows[0] });
        }
      }
      const result = await pool.query(
        `
        INSERT INTO integrations (provider, account_name, configuration, status, activate, token_expires_at)
        VALUES ($1, $2, $3::jsonb, $4, 'active', $5::timestamptz)
        RETURNING id, provider, account_name, status, activate, token_expires_at, updated_at
        `,
        [
          provider,
          account_name || `${provider.toUpperCase()} Production`,
          JSON.stringify(configuration),
          status || "active",
          token_expires_at || null,
        ]
      );
      return NextResponse.json({ integration: result.rows[0] });
    }

    return NextResponse.json({ error: "Missing ID or provider" }, { status: 400 });
  } catch (error) {
    console.error("Unable to update integration:", error);
    return NextResponse.json({ error: "Unable to update integration" }, { status: 500 });
  }
}
