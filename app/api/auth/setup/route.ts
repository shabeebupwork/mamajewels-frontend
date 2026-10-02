import { NextResponse } from "next/server";
import crypto from "crypto";
import { pool } from "@/db/postgres";
import { hashPassword } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const setupSecret = request.headers.get("x-mamajewels-setup-secret");

    if (
      !process.env.MAMAJEWELS_SETUP_SECRET ||
      setupSecret !== process.env.MAMAJEWELS_SETUP_SECRET
    ) {
      return NextResponse.json(
        { error: "Setup authorization required" },
        { status: 403 }
      );
    }
    const body = (await request.json()) as {
        name?: string;
        email?: string;
        password?: string;
    };

    const email = String(body.email || "").trim().toLowerCase();
    const name = String(body.name || "").trim();
    const password = String(body.password || "");

    if (!email || !name || !password) {
      return NextResponse.json(
        { error: "Name, email and password are required" },
        { status: 400 }
      );
    }

    if (password.length < 12) {
      return NextResponse.json(
        { error: "Password must be at least 12 characters" },
        { status: 400 }
      );
    }

    const existing = await pool.query(
      `SELECT id FROM users LIMIT 1`
    );

    if (existing.rowCount && existing.rowCount > 0) {
      return NextResponse.json(
        { error: "Initial setup has already been completed" },
        { status: 403 }
      );
    }

    const passwordHash = await hashPassword(password);

    const result = await pool.query(
      `
      INSERT INTO users
        (email, name, password_hash, role, is_active)
      VALUES
        ($1, $2, $3, 'Owner', TRUE)
      RETURNING id, email, name, role
      `,
      [email, name, passwordHash]
    );

    const user = result.rows[0];

    await pool.query(
      `
      INSERT INTO audit_log
        (action, actor_type, actor_email, entity_type, entity_id, details)
      VALUES
        ('initial_owner_created', 'system', $1, 'user', $2, $3::jsonb)
      `,
      [
        user.email,
        String(user.id),
        JSON.stringify({
          role: "Owner",
          method: "initial_setup",
        }),
      ]
    );

    const sessionToken = crypto.randomBytes(32).toString("hex");

    const sessionTokenHash = crypto
      .createHash("sha256")
      .update(sessionToken)
      .digest("hex");

    await pool.query(
      `
      INSERT INTO user_sessions
        (user_id, session_token_hash, expires_at)
      VALUES
        ($1, $2, NOW() + INTERVAL '7 days')
      `,
      [user.id, sessionTokenHash]
    );

    const response = NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });

    response.cookies.set("mj_session", sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch {
    return NextResponse.json(
      { error: "Unable to complete initial setup" },
      { status: 500 }
    );
  }
}
