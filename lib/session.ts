import crypto from "crypto";
import { cookies } from "next/headers";
import { pool } from "@/db/postgres";

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("mj_session")?.value;

  if (!sessionToken) {
    return null;
  }

  const sessionTokenHash = crypto
    .createHash("sha256")
    .update(sessionToken)
    .digest("hex");

  const result = await pool.query(
    `
    SELECT
      u.id,
      u.email,
      u.name,
      u.role,
      u.is_active
    FROM user_sessions s
    JOIN users u ON u.id = s.user_id
    WHERE s.session_token_hash = $1
      AND s.expires_at > NOW()
      AND s.revoked_at IS NULL
      AND u.is_active = TRUE
    LIMIT 1
    `,
    [sessionTokenHash]
  );

  if (result.rowCount === 0) {
    return null;
  }

  await pool.query(
    `
    UPDATE user_sessions
    SET last_seen_at = NOW()
    WHERE session_token_hash = $1
    `,
    [sessionTokenHash]
  );

  return result.rows[0];
}

export function hasRole(
  role: string,
  allowedRoles: string[]
) {
  return allowedRoles.includes(role);
}