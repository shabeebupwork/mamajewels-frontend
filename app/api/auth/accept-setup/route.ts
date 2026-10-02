import crypto from "crypto";
import { NextResponse } from "next/server";
import { pool } from "@/db/postgres";
import { hashPassword } from "@/lib/auth";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { token?: string; password?: string } | null;
  const token = String(body?.token || "");
  const password = String(body?.password || "");
  if (!/^[a-f0-9]{64}$/i.test(token)) {
    return NextResponse.json({ error: "This setup link is invalid or expired" }, { status: 400 });
  }
  if (password.length < 12 || password.length > 200) {
    return NextResponse.json({ error: "Use a password between 12 and 200 characters" }, { status: 400 });
  }

  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
  const passwordHash = await hashPassword(password);
  const sessionToken = crypto.randomBytes(32).toString("hex");
  const sessionHash = crypto.createHash("sha256").update(sessionToken).digest("hex");
  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    const result = await client.query(
      `UPDATE users
       SET password_hash = $1, is_active = TRUE, setup_token_hash = NULL,
           setup_token_expires_at = NULL, updated_at = NOW()
       WHERE setup_token_hash = $2 AND setup_token_expires_at > NOW() AND is_active = FALSE
       RETURNING id, email, name, role`,
      [passwordHash, tokenHash]
    );
    if (result.rowCount === 0) {
      await client.query("ROLLBACK");
      return NextResponse.json({ error: "This setup link is invalid, expired, or already used" }, { status: 400 });
    }
    const user = result.rows[0];
    await client.query(
      `INSERT INTO user_sessions (user_id, session_token_hash, expires_at)
       VALUES ($1, $2, NOW() + INTERVAL '7 days')`,
      [user.id, sessionHash]
    );
    await client.query(
      `INSERT INTO audit_log (request_id, action, actor_type, actor_email, entity_type, entity_id, details)
       VALUES ($1, 'team_user_setup_completed', 'user', $2, 'user', $3, $4::jsonb)`,
      [crypto.randomUUID(), user.email, String(user.id), JSON.stringify({ role: user.role })]
    );
    await client.query("COMMIT");

    const response = NextResponse.json({
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
    });
    response.cookies.set("mj_session", sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });
    return response;
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Account setup failed:", error);
    return NextResponse.json({ error: "Unable to complete account setup" }, { status: 500 });
  } finally {
    client.release();
  }
}
