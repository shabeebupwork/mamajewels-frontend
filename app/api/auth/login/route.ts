import { NextResponse } from "next/server";
import crypto from "crypto";
import { pool } from "@/db/postgres";
import { verifyPassword } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
        email?: string;
        password?: string;
    };

    const email = String(body.email ?? "").trim().toLowerCase();
    const password = String(body.password ?? "");

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    const result = await pool.query(
      `
      SELECT id, email, name, role, password_hash, is_active
      FROM users
      WHERE LOWER(email) = $1
      LIMIT 1
      `,
      [email]
    );

    if (result.rowCount === 0) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    const user = result.rows[0];

    if (!user.is_active || !user.password_hash) {
      return NextResponse.json(
        { error: "This account is not available" },
        { status: 403 }
      );
    }

    const validPassword = await verifyPassword(
      password,
      user.password_hash
    );

    if (!validPassword) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

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

    await pool.query(
      `
      UPDATE users
      SET last_login_at = NOW(),
          updated_at = NOW()
      WHERE id = $1
      `,
      [user.id]
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
      { error: "Unable to sign in" },
      { status: 500 }
    );
  }
}