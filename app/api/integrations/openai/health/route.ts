import { NextResponse } from "next/server";
import { requireRole } from "@/lib/require-auth";
import { pool } from "@/db/postgres";

export async function GET() {
  try {
    await requireRole(["Owner", "Administrator"]);

    const result = await pool.query(
      `
      SELECT configuration
      FROM integrations
      WHERE provider = 'openai'
      LIMIT 1
      `
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { healthy: false, error: "OpenAI integration not found" },
        { status: 404 }
      );
    }

    const configuration = result.rows[0].configuration || {};
    const apiKey = configuration.api_key;

    if (!apiKey) {
      return NextResponse.json(
        { healthy: false, error: "OpenAI API key is not configured" },
        { status: 400 }
      );
    }

    const response = await fetch("https://api.openai.com/v1/models", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      const errorText = await response.text();

      await pool.query(
        `
        UPDATE integrations
        SET
          status = 'error',
          last_health_check = NOW(),
          health_details = $1::jsonb,
          updated_at = NOW()
        WHERE provider = 'openai'
        `,
        [
          JSON.stringify({
            healthy: false,
            http_status: response.status,
            error: errorText.slice(0, 500),
          }),
        ]
      );

      return NextResponse.json({
        healthy: false,
        error: "OpenAI API key is not working",
      });
    }

    const spendError = "No access";

    await pool.query(
      `
      UPDATE integrations
      SET
        status = 'healthy',
        last_health_check = NOW(),
        health_details = $1::jsonb,
        updated_at = NOW()
      WHERE provider = 'openai'
      `,
      [
        JSON.stringify({
          healthy: true,
          spend_error: spendError,
        }),
      ]
    );

    return NextResponse.json({
      healthy: true,
      monthlySpendUsd: null,
      spendPeriodStart: null,
      spendError,
    });
  } catch (error) {
    console.error("OPENAI_HEALTH_ERROR:", error);

    return NextResponse.json(
      { healthy: false, error: "Unable to check OpenAI" },
      { status: 500 }
    );
  }
}
