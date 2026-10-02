import crypto from "crypto";
import { NextResponse } from "next/server";
import { pool } from "@/db/postgres";
import { requireRole } from "@/lib/require-auth";

const roles = ["Owner", "Administrator", "Editor and approver", "Reviewer", "Viewer"];

function authFailure(error: unknown) {
  if (error instanceof Error && error.message === "UNAUTHORIZED") {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }
  if (error instanceof Error && error.message === "FORBIDDEN") {
    return NextResponse.json({ error: "Owner or administrator access required" }, { status: 403 });
  }
  return null;
}

export async function GET() {
  try {
    await requireRole(["Owner", "Administrator"]);
    const result = await pool.query(`
      SELECT
        u.id, u.email, u.name, u.role, u.is_active, u.last_login_at,
        u.setup_token_expires_at,
        EXISTS (
          SELECT 1 FROM user_sessions s
          WHERE s.user_id = u.id AND s.revoked_at IS NULL AND s.expires_at > NOW()
        ) AS has_session
      FROM users u
      ORDER BY CASE WHEN u.role = 'Owner' THEN 0 ELSE 1 END, u.name
    `);

    return NextResponse.json({
      users: result.rows.map((user: any) => ({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        isActive: user.is_active,
        lastLoginAt: user.last_login_at,
        setupExpiresAt: user.setup_token_expires_at,
        hasSession: user.has_session,
      })),
    });
  } catch (error) {
    return authFailure(error) || NextResponse.json({ error: "Unable to load team" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const actor = await requireRole(["Owner", "Administrator"]);
    const body = (await request.json()) as { id?: number; name?: string; email?: string; role?: string };
    if (body.id !== undefined) {
      const id = Number(body.id);
      if (!Number.isInteger(id) || id <= 0) {
        return NextResponse.json({ error: "A valid user ID is required" }, { status: 400 });
      }
      const existing = await pool.query("SELECT email, role, is_active FROM users WHERE id = $1", [id]);
      if (existing.rowCount === 0) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }
      if (existing.rows[0].role === "Owner" || existing.rows[0].is_active) {
        return NextResponse.json({ error: "Only pending accounts can receive a new setup link" }, { status: 409 });
      }
      const token = crypto.randomBytes(32).toString("hex");
      const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
      await pool.query(
        `UPDATE users SET setup_token_hash = $2, setup_token_expires_at = NOW() + INTERVAL '24 hours', updated_at = NOW() WHERE id = $1`,
        [id, tokenHash]
      );
      await pool.query(
        `INSERT INTO audit_log (request_id, action, actor_type, actor_email, entity_type, entity_id, details)
         VALUES ($1, 'team_setup_link_regenerated', 'user', $2, 'user', $3, $4::jsonb)`,
        [crypto.randomUUID(), actor.email, String(id), JSON.stringify({ email: existing.rows[0].email })]
      );
      const baseUrl = process.env.APP_BASE_URL || new URL(request.url).origin;
      const setupUrl = new URL("/setup", baseUrl);
      setupUrl.hash = new URLSearchParams({ token }).toString();
      return NextResponse.json({ setupUrl: setupUrl.toString() });
    }

    const name = String(body.name || "").trim();
    const email = String(body.email || "").trim().toLowerCase();
    const role = String(body.role || "Reviewer");

    if (!name || name.length > 120 || !/^\S+@\S+\.\S+$/.test(email)) {
      return NextResponse.json({ error: "Enter a name and valid email address" }, { status: 400 });
    }
    if (!roles.includes(role)) {
      return NextResponse.json({ error: "Choose a valid role" }, { status: 400 });
    }
    if (role === "Owner" && actor.role !== "Owner") {
      return NextResponse.json({ error: "Only an owner can invite another owner" }, { status: 403 });
    }

    const token = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    const client = await pool.connect();
    let user!: { id: string | number; email: string; name: string; role: string; setup_token_expires_at: string };
    try {
      await client.query("BEGIN");
      const result = await client.query(
        `INSERT INTO users (email, name, role, is_active, setup_token_hash, setup_token_expires_at)
         VALUES ($1, $2, $3, FALSE, $4, NOW() + INTERVAL '24 hours')
         RETURNING id, email, name, role, setup_token_expires_at`,
        [email, name, role, tokenHash]
      );
      user = result.rows[0];
      await client.query(
        `INSERT INTO audit_log (request_id, action, actor_type, actor_email, entity_type, entity_id, details)
         VALUES ($1, 'team_user_invited', 'user', $2, 'user', $3, $4::jsonb)`,
        [crypto.randomUUID(), actor.email, String(user.id), JSON.stringify({ email, role })]
      );
      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      if ((error as { code?: string })?.code === "23505") {
        return NextResponse.json({ error: "A user with this email already exists" }, { status: 409 });
      }
      throw error;
    } finally {
      client.release();
    }
    const baseUrl = process.env.APP_BASE_URL || new URL(request.url).origin;
    const setupUrl = new URL("/setup", baseUrl);
    setupUrl.hash = new URLSearchParams({ token }).toString();

    return NextResponse.json({
      user: { id: user.id, email: user.email, name: user.name, role: user.role, isActive: false, setupExpiresAt: user.setup_token_expires_at },
      setupUrl: setupUrl.toString(),
    }, { status: 201 });
  } catch (error) {
    return authFailure(error) || NextResponse.json({ error: "Unable to create team member" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const actor = await requireRole(["Owner", "Administrator"]);
    const body = (await request.json()) as { id?: number; role?: string; isActive?: boolean };
    const id = Number(body.id);
    if (!Number.isInteger(id) || id <= 0) {
      return NextResponse.json({ error: "A valid user ID is required" }, { status: 400 });
    }
    if (body.role !== undefined && !roles.includes(body.role)) {
      return NextResponse.json({ error: "Choose a valid role" }, { status: 400 });
    }
    if (body.role === "Owner" && actor.role !== "Owner") {
      return NextResponse.json({ error: "Only an owner can assign owner access" }, { status: 403 });
    }
    if (body.isActive !== undefined && typeof body.isActive !== "boolean") {
      return NextResponse.json({ error: "isActive must be a boolean" }, { status: 400 });
    }
    if (Number(actor.id) === id) {
      return NextResponse.json({ error: "You cannot change your own access" }, { status: 400 });
    }

    const existing = await pool.query("SELECT role, password_hash FROM users WHERE id = $1", [id]);
    if (existing.rowCount === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    if (existing.rows[0].role === "Owner") {
      return NextResponse.json({ error: "Owner access cannot be changed here" }, { status: 403 });
    }
    if (body.isActive === true && !existing.rows[0].password_hash) {
      return NextResponse.json({ error: "This user must complete account setup before activation" }, { status: 409 });
    }

    const result = await pool.query(
      `UPDATE users SET
         role = COALESCE($2, role),
         is_active = COALESCE($3, is_active),
         updated_at = NOW()
       WHERE id = $1
       RETURNING id, email, name, role, is_active, last_login_at, setup_token_expires_at`,
      [id, body.role ?? null, body.isActive ?? null]
    );
    const user = result.rows[0];
    await pool.query(
      `INSERT INTO audit_log (request_id, action, actor_type, actor_email, entity_type, entity_id, details)
       VALUES ($1, 'team_user_updated', 'user', $2, 'user', $3, $4::jsonb)`,
      [crypto.randomUUID(), actor.email, String(id), JSON.stringify({ role: body.role, is_active: body.isActive })]
    );
    if (body.isActive === false) {
      await pool.query("UPDATE user_sessions SET revoked_at = NOW() WHERE user_id = $1 AND revoked_at IS NULL", [id]);
    }

    return NextResponse.json({
      user: { id: user.id, email: user.email, name: user.name, role: user.role, isActive: user.is_active, lastLoginAt: user.last_login_at, setupExpiresAt: user.setup_token_expires_at },
    });
  } catch (error) {
    return authFailure(error) || NextResponse.json({ error: "Unable to update team member" }, { status: 500 });
  }
}
