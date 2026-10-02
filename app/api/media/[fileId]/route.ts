import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ fileId: string }> }
) {
  try {
    const { fileId } = await params;

    if (!fileId || !/^[A-Za-z0-9_-]{1,200}$/.test(fileId)) {
      return NextResponse.json(
        { error: "Invalid file ID" },
        { status: 400 }
      );
    }

    const dashboardKey = process.env.DASHBOARD_API_KEY;
    if (!dashboardKey) {
      return NextResponse.json({ error: "Media service is not configured" }, { status: 503 });
    }

    const n8nUrl =
      `https://n8n.mamajewels.nl/webhook/mj-dashboard-media?fileId=${encodeURIComponent(fileId)}`;

    const response = await fetch(n8nUrl, {
      method: "GET",
      headers: {
        "X-Dashboard-Key": dashboardKey,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: "Media file is unavailable" },
        { status: response.status === 404 ? 404 : 502 }
      );
    }
    if (!response.body) {
      return NextResponse.json({ error: "Media service returned an empty response" }, { status: 502 });
    }

    const contentType = response.headers.get("content-type") || "application/octet-stream";
    const mediaType = contentType.split(";", 1)[0].trim().toLowerCase();
    if (!mediaType.startsWith("image/") && !mediaType.startsWith("video/") && mediaType !== "application/octet-stream") {
      return NextResponse.json({ error: "Media service did not return an image or video" }, { status: 502 });
    }

    const headers = new Headers({
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
      "X-Content-Type-Options": "nosniff",
    });
    const contentLength = response.headers.get("content-length");
    if (contentLength && /^\d+$/.test(contentLength)) headers.set("Content-Length", contentLength);

    return new Response(response.body, {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error("Media API error:", error);

    return NextResponse.json(
      { error: "Unable to load media" },
      { status: 502 }
    );
  }
}
