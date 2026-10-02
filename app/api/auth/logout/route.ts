import { NextResponse } from "next/server";
import crypto from "crypto";
import { cookies } from "next/headers";
import { pool } from "@/db/postgres";

export async function POST() {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("mj_session")?.value;

    if (sessionToken) {
      const sessionTokenHash = crypto
        .createHash("sha256")
        .update(sessionToken)
        .digest("hex");

      await pool.query(
        `
        UPDATE user_sessions
        SET revoked_at = NOW()
        WHERE session_token_hash = $1
        `,
        [sessionTokenHash]
      );
    }

    const response = NextResponse.json({ success: true });

    response.cookies.set("mj_session", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });

    return response;
  } catch {
    return NextResponse.json(
      { error: "Unable to sign out" },
      { status: 500 }
    );
  }
}