import { NextResponse } from "next/server";
import { requireRole } from "@/lib/require-auth";
import { pool } from "@/db/postgres";

const META_GRAPH_API_VERSION =
  process.env.META_GRAPH_API_VERSION || "v24.0";
type MetaDebugResponse = {
  data?: {
    is_valid?: boolean;
    app_id?: string;
    user_id?: string;
    scopes?: string[];
    expires_at?: number;
    data_access_expiration_time?: number;
  };
  error?: {
    message?: string;
    type?: string;
    code?: number;
  };
};

type MetaInstagramResponse = {
  id?: string;
  username?: string;
  error?: {
    message?: string;
    type?: string;
    code?: number;
  };
};
export async function GET(request: Request) {
  try {
    await requireRole(["Owner", "Administrator"]);

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Meta integration id is required" },
        { status: 400 }
      );
    }

    const result = await pool.query(
      `
      SELECT
        id,
        market,
        account_name,
        configuration
      FROM integrations
      WHERE id = $1
        AND provider = 'meta'
      LIMIT 1
      `,
      [id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "Meta integration not found" },
        { status: 404 }
      );
    }

    const integration = result.rows[0];
    const configuration = integration.configuration || {};

    const appId = configuration.app_id;
    const appSecret = configuration.app_secret;
    const accessToken = configuration.access_token;
    const igUserId = configuration.ig_user_id;

    if (!appId || !appSecret || !accessToken || !igUserId) {
      return NextResponse.json(
        {
          healthy: false,
          error:
            "App ID, App Secret, Access Token and Instagram User ID are required",
        },
        { status: 400 }
      );
    }

    const appAccessToken = `${appId}|${appSecret}`;

    const debugUrl = new URL(
      `https://graph.facebook.com/${META_GRAPH_API_VERSION}/debug_token`
    );

    debugUrl.searchParams.set("input_token", accessToken);
    debugUrl.searchParams.set("access_token", appAccessToken);

    const debugResponse = await fetch(debugUrl.toString(), {
      method: "GET",
      cache: "no-store",
    });

    const debugData =
     (await debugResponse.json()) as MetaDebugResponse;

    if (!debugResponse.ok || debugData.error || !debugData.data) {
      await pool.query(
        `
        UPDATE integrations
        SET
          status = 'error',
          last_health_check = NOW(),
          health_details = $1::jsonb,
          updated_at = NOW()
        WHERE id = $2
        `,
        [
          JSON.stringify({
            error:
              debugData.error?.message ||
              "Unable to validate Meta access token",
          }),
          integration.id,
        ]
      );

      return NextResponse.json(
        {
          healthy: false,
          error:
            debugData.error?.message ||
            "Unable to validate Meta access token",
        },
        { status: 401 }
      );
    }

    const tokenData = debugData.data;

    if (!tokenData.is_valid) {
      await pool.query(
        `
        UPDATE integrations
        SET
          status = 'error',
          last_health_check = NOW(),
          health_details = $1::jsonb,
          updated_at = NOW()
        WHERE id = $2
        `,
        [
          JSON.stringify({
            token_valid: false,
            app_id: tokenData.app_id || appId,
            user_id: tokenData.user_id || null,
            scopes: tokenData.scopes || [],
          }),
          integration.id,
        ]
      );

      return NextResponse.json(
        {
          healthy: false,
          error: "Meta access token is invalid or expired",
        },
        { status: 401 }
      );
    }

    const meUrl = new URL(
      `https://graph.facebook.com/${META_GRAPH_API_VERSION}/${igUserId}`
    );

    meUrl.searchParams.set("fields", "id,username");
    meUrl.searchParams.set("access_token", accessToken);

    const meResponse = await fetch(meUrl.toString(), {
      method: "GET",
      cache: "no-store",
    });

    const meData =
     (await meResponse.json()) as MetaInstagramResponse;

    if (!meResponse.ok || meData.error) {
      await pool.query(
        `
        UPDATE integrations
        SET
          status = 'error',
          last_health_check = NOW(),
          health_details = $1::jsonb,
          updated_at = NOW()
        WHERE id = $2
        `,
        [
          JSON.stringify({
            token_valid: true,
            instagram_error:
              meData.error?.message ||
              "Unable to access Instagram account",
          }),
          integration.id,
        ]
      );

      return NextResponse.json(
        {
          healthy: false,
          error:
            meData.error?.message ||
            "Unable to access Instagram account",
        },
        { status: 401 }
      );
    }

    const expiresAt =
      typeof tokenData.expires_at === "number" &&
      tokenData.expires_at > 0
        ? new Date(tokenData.expires_at * 1000).toISOString()
        : null;

    const dataAccessExpiresAt =
      typeof tokenData.data_access_expiration_time === "number"
        ? new Date(
            tokenData.data_access_expiration_time * 1000
          ).toISOString()
        : null;

    await pool.query(
      `
      UPDATE integrations
      SET
        status = 'healthy',
        token_expires_at = $1,
        last_health_check = NOW(),
        health_details = $2::jsonb,
        updated_at = NOW()
      WHERE id = $3
      `,
      [
        expiresAt,
        JSON.stringify({
          token_valid: true,
          app_id: tokenData.app_id || appId,
          user_id: tokenData.user_id || null,
          scopes: tokenData.scopes || [],
          instagram_user_id: meData.id || igUserId,
          username: meData.username || null,
          expires_at: expiresAt,
          data_access_expiration_time: dataAccessExpiresAt,
        }),
        integration.id,
      ]
    );

    return NextResponse.json({
      healthy: true,
      market: integration.market,
      accountName: integration.account_name,
      instagramUserId: meData.id || igUserId,
      username: meData.username || null,
      tokenValid: true,
      expiresAt,
      dataAccessExpiresAt,
      scopes: tokenData.scopes || [],
      lastHealthCheck: new Date().toISOString(),
    });
  } catch (error) {
    console.error("META_HEALTH_ERROR:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to check Meta connection",
      },
      { status: 500 }
    );
  }
}
