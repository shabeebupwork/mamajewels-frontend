import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/require-auth";
import { parseDriveFileIds, publicMediaUrls } from "@/lib/media-url";

export async function GET(request: Request) {
  try {
    await requireAuth();
    const requestUrl = new URL(request.url);

    const params = new URLSearchParams();

    const allowedParams = [
      "search",
      "status",
      "market",
      "type",
      "sort",
      "direction",
      "limit",
      "offset",
    ];

    for (const key of allowedParams) {
      const value = requestUrl.searchParams.get(key);

      if (value !== null) {
        params.set(key, value);
      }
    }

    const n8nUrl =
      "https://n8n.mamajewels.nl/webhook/mj-dashboard-content";

    const response = await fetch(
      `${n8nUrl}?${params.toString()}`,
      {
        method: "GET",
        headers: {
          "X-Dashboard-Key": process.env.DASHBOARD_API_KEY || "",
        },
        cache: "no-store",
      }
    );

    const data: any = await response.json();

    if (!response.ok) {
      console.error("n8n content request failed:", data);

      return NextResponse.json(
        { error: "Failed to load content" },
        { status: response.status }
      );
    }

    if (!data?.success || !Array.isArray(data.items)) {
      console.error("Invalid n8n content response:", data);

      return NextResponse.json(
        { error: "Invalid content response" },
        { status: 502 }
      );
    }

    const items = data.items.map((row: any) => {
      const driveFileIds = parseDriveFileIds(row.drive_file_id);
      const images = publicMediaUrls(driveFileIds);
      const variants = Array.isArray(row.variants)
        ? row.variants
        : [];
      const variantStatus = variants.find((variant: any) => {
        const status = String(variant.status || "").trim().toLowerCase().replace(/[\s-]+/g, "_");
        return status === "tag_new" || status === "ready_for_approval_tagged";
      })?.status;
      const rawStatus = String(variantStatus || row.status || "Processing").trim();
      const normalizedStatus = rawStatus.toLowerCase().replace(/[\s-]+/g, "_");
      const contentStatus = normalizedStatus === "tag_new"
        ? "new"
        : normalizedStatus === "ready_for_approval_tagged"
          ? "ready_for_approval"
          : rawStatus;

      const localizations = variants.map((item: any) => ({
        market: item.market,
        caption: item.caption || "",
        status: item.status || "",
        approved_by: item.approved_by ?? null,
        approved_at: item.approved_at ?? null,
        published_at: item.published_at ?? null,
        meta_media_id: item.meta_media_id ?? null,
      }));

      return {
        id: String(row.id),

        title:
          row.original_caption ||
          row.external_id ||
          "Untitled content",

        type:
          row.content_type === "image"
            ? "Image"
            : row.content_type === "carousel"
              ? "Carousel"
              : row.content_type === "reel" || row.content_type === "video"
                ? "Reel"
                : "Image",

        mediaType: row.content_type || "image",

        status: contentStatus,

        capturedAt: row.captured_at,

        capturedLabel: row.captured_at
          ? new Date(row.captured_at).toLocaleString("en-GB", {
              day: "2-digit",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })
          : "—",

        source: row.source_account || "—",

        markets: [
          "NL",
          ...localizations.map((item: any) => item.market),
        ],

        image: images[0] || row.media_url || "",
        images: images.length ? images : row.media_url ? [row.media_url] : [],
        driveFileId: driveFileIds[0] || null,
        driveFileIds,

        caption: row.original_caption || "",

        kind: "owned",

        localizations,
      };
    });

    return NextResponse.json(items);
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }
    console.error("Dashboard content API error:", error);

    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    );
  }
}
