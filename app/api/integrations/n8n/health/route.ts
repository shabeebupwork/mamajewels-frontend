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
      WHERE provider = 'n8n'
        AND market IS NULL
      ORDER BY id
      LIMIT 1
      `
    );

    if (result.rowCount === 0) {
      return NextResponse.json(
        { error: "n8n integration not found" },
        { status: 404 }
      );
    }

    const configuration = result.rows[0].configuration || {};
    const baseUrl = configuration.base_url;
    const apiKey = configuration.api_key;

    if (!baseUrl) {
      return NextResponse.json(
        { error: "n8n base URL is not configured" },
        { status: 400 }
      );
    }

    if (!apiKey) {
      return NextResponse.json(
        { error: "n8n API key is not configured" },
        { status: 400 }
      );
    }

    const normalizedBaseUrl = String(baseUrl).replace(/\/+$/, "");

    const headers = {
      "X-N8N-API-KEY": apiKey,
      Accept: "application/json",
    };

    let workflowCount = 0;
    let cursor: string | null = null;

    do {
      const url = new URL(
        `${normalizedBaseUrl}/api/v1/workflows`
      );

      url.searchParams.set("limit", "250");

      if (cursor) {
        url.searchParams.set("cursor", cursor);
      }

      const response = await fetch(url.toString(), {
        headers,
        cache: "no-store",
      });

      if (!response.ok) {
        await pool.query(
          `
          UPDATE integrations
          SET
            status = 'error',
            last_health_check = NOW(),
            health_details = $1::jsonb,
            updated_at = NOW()
          WHERE provider = 'n8n'
            AND market IS NULL
          `,
          [
            JSON.stringify({
              healthy: false,
              error: "n8n authentication or API request failed",
            }),
          ]
        );

        return NextResponse.json(
          { error: "n8n API key is invalid or n8n is unavailable" },
          { status: 502 }
        );
      }

      const data = (await response.json()) as {
        data?: unknown[];
        nextCursor?: string | null;
      };

      workflowCount += Array.isArray(data.data)
        ? data.data.length
        : 0;

      cursor = data.nextCursor ?? null;
    } while (cursor);

    


    await pool.query(
      `
      UPDATE integrations
      SET
        status = 'healthy',
        last_health_check = NOW(),
        health_details = $1::jsonb,
        updated_at = NOW()
      WHERE provider = 'n8n'
        AND market IS NULL
      `,
      [
        JSON.stringify({
          healthy: true,
          workflow_count: workflowCount,
          base_url: normalizedBaseUrl,
        }),
      ]
    );

    return NextResponse.json({
      healthy: true,
      workflowCount,
      baseUrl: normalizedBaseUrl,
    });
  } catch (error) {
    console.error("N8N_HEALTH_ERROR:", error);

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
      { error: "Unable to check n8n health" },
      { status: 500 }
    );
  }
}