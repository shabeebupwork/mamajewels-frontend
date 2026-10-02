export function publicMediaUrl(fileId: string | number) {
  const mediaManagerBaseUrl = (
    process.env.MEDIA_MANAGER_PUBLIC_URL ||
    process.env.APP_BASE_URL ||
    "https://mediamanager.mamajewels.nl"
  ).replace(/\/+$/, "");
  return `${mediaManagerBaseUrl}/api/media/${encodeURIComponent(String(fileId))}`;
}

export function parseDriveFileIds(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.flatMap(parseDriveFileIds);
  }
  if (typeof value !== "string" && typeof value !== "number") return [];

  const raw = String(value).trim();
  if (!raw) return [];

  const normalized = raw.startsWith("{") && raw.endsWith("}")
    ? raw.slice(1, -1)
    : raw;

  return normalized
    .split(",")
    .map((fileId) => fileId.trim().replace(/^"|"$/g, ""))
    .filter(Boolean);
}

export function publicMediaUrls(value: unknown): string[] {
  return parseDriveFileIds(value).map(publicMediaUrl);
}
