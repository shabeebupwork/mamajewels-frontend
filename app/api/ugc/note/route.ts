import crypto from "crypto";
import { NextResponse } from "next/server";
import { pool } from "@/db/postgres";
import { requireRole } from "@/lib/require-auth";

export async function POST(request: Request) {
  try {
    const actor = await requireRole(["Owner", "Administrator", "Editor and approver", "Reviewer"]);
    const body = (await request.json().catch(() => null)) as { id?: string | number; note?: string } | null;
    const id = Number(body?.id);
    const note = String(body?.note || "").trim();

    if (!Number.isSafeInteger(id) || id <= 0) {
      return NextResponse.json({ error: "A valid UGC item ID is required" }, { status: 400 });
    }
    if (!note || note.length > 2000) {
      return NextResponse.json({ error: "Enter a note between 1 and 2000 characters" }, { status: 400 });
    }

    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const result = await client.query(
        `UPDATE ugc_items
         SET raw_payload = jsonb_set(
           COALESCE(raw_payload, '{}'::jsonb),
           '{review_notes}',
           COALESCE(raw_payload->'review_notes', '[]'::jsonb) ||
             jsonb_build_array(jsonb_build_object('note', $2::text, 'author', $3::text, 'created_at', NOW())),
           TRUE
         ), updated_at = NOW()
         WHERE id = $1
         RETURNING raw_payload->'review_notes' AS review_notes`,
        [id, note, actor.email]
      );
      if (result.rowCount === 0) {
        await client.query("ROLLBACK");
        return NextResponse.json({ error: "UGC item not found" }, { status: 404 });
      }
      await client.query(
        `INSERT INTO audit_log (request_id, action, actor_type, actor_email, entity_type, entity_id, details)
         VALUES ($1, 'ugc_review_note_added', 'user', $2, 'ugc_item', $3, $4::jsonb)`,
        [crypto.randomUUID(), actor.email, String(id), JSON.stringify({ note })]
      );
      await client.query("COMMIT");
      return NextResponse.json({ success: true, reviewNotes: result.rows[0].review_notes || [] });
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return NextResponse.json({ error: "Review note access required" }, { status: 403 });
    }
    console.error("UGC review note error:", error);
    return NextResponse.json({ error: "Unable to save review note" }, { status: 500 });
  }
}
