import { NextResponse } from "next/server";
import { requireRole } from "@/lib/require-auth";

const metaHealthWebhookUrl = "https://n8n.mamajewels.nl/webhook/meta-token-health";

export async function POST() {
  try {
    await requireRole(["Owner", "Administrator"]);

    const dashboardKey = process.env.DASHBOARD_API_KEY;
    if (!dashboardKey) {
      return NextResponse.json({ error: "Dashboard API key is not configured" }, { status: 500 });
    }

    let response: Response;
    try {
      response = await fetch(metaHealthWebhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-dashboard-key": dashboardKey,
        },
        body: JSON.stringify({}),
        cache: "no-store",
      });
    } catch {
      return NextResponse.json({ error: "Unable to reach the Meta health workflow" }, { status: 502 });
    }

    const result = await response.json().catch(() => null) as { ok?: boolean; success?: boolean; error?: string; errorMessage?: string; message?: string } | null;
    if (!response.ok || result?.ok === false || result?.success === false || result?.error || result?.errorMessage) {
      return NextResponse.json(
        { error: result?.error || result?.errorMessage || result?.message || "Meta health refresh failed" },
        { status: 502 }
      );
    }

    return NextResponse.json({ success: true, message: "Meta health refresh started" }, { status: 202 });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return NextResponse.json({ error: "Owner or administrator access required" }, { status: 403 });
    }
    return NextResponse.json({ error: "Meta health refresh failed" }, { status: 500 });
  }
}
