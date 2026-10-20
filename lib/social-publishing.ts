type JsonObject = Record<string, any>;

async function readApiResponse(response: Response, platform: string): Promise<JsonObject> {
  const data = await response.json().catch(() => ({})) as JsonObject;
  const apiError = data.error;
  const failed = !response.ok || (apiError && apiError.code && apiError.code !== "ok");
  if (failed) {
    const message = apiError?.message || data.message || `${platform} returned HTTP ${response.status}`;
    throw new Error(`${platform}: ${message}`);
  }
  return data;
}

export async function getTikTokCreatorInfo(accessToken: string) {
  const response = await fetch("https://open.tiktokapis.com/v2/post/publish/creator_info/query/", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json; charset=UTF-8",
    },
    body: "{}",
    cache: "no-store",
  });
  const data = await readApiResponse(response, "TikTok");
  if (!Array.isArray(data.data?.privacy_level_options) || data.data.privacy_level_options.length === 0) {
    throw new Error("TikTok did not return available privacy settings for this account.");
  }
  return data.data as {
    creator_username?: string;
    creator_nickname?: string;
    privacy_level_options: string[];
    max_video_post_duration_sec?: number;
    comment_disabled?: boolean;
    duet_disabled?: boolean;
    stitch_disabled?: boolean;
  };
}

export async function publishTikTok(
  accessToken: string,
  caption: string,
  mediaUrls: string[],
  isVideo: boolean,
  privacyLevel: string,
) {
  if (!mediaUrls.length) throw new Error("No media was provided for TikTok.");
  const url = isVideo
    ? "https://open.tiktokapis.com/v2/post/publish/video/init/"
    : "https://open.tiktokapis.com/v2/post/publish/content/init/";
  const body = isVideo
    ? {
        post_info: {
          title: caption.slice(0, 150),
          privacy_level: privacyLevel,
          disable_duet: false,
          disable_stitch: false,
          disable_comment: false,
        },
        source_info: { source: "PULL_FROM_URL", video_url: mediaUrls[0] },
      }
    : {
        post_info: {
          title: caption.slice(0, 90),
          description: caption,
          privacy_level: privacyLevel,
          disable_comment: false,
          auto_add_music: false,
        },
        source_info: {
          source: "PULL_FROM_URL",
          photo_cover_index: 0,
          photo_images: mediaUrls,
        },
        post_mode: "DIRECT_POST",
        media_type: "PHOTO",
      };
  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json; charset=UTF-8",
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  const data = await readApiResponse(response, "TikTok");
  const publishId = data.data?.publish_id;
  if (typeof publishId !== "string" || !publishId) throw new Error("TikTok did not return a publish ID.");
  return { publishId };
}

export async function fetchTikTokPublishStatus(accessToken: string, publishId: string) {
  const response = await fetch("https://open.tiktokapis.com/v2/post/publish/status/fetch/", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json; charset=UTF-8",
    },
    body: JSON.stringify({ publish_id: publishId }),
    cache: "no-store",
  });
  return readApiResponse(response, "TikTok");
}

export async function publishPinterestImage(
  accessToken: string,
  boardId: string,
  title: string,
  description: string,
  mediaUrl: string,
) {
  const response = await fetch("https://api.pinterest.com/v5/pins", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      board_id: boardId,
      title: title.slice(0, 95) || "Mama Jewels",
      description: description.slice(0, 795),
      media_source: { source_type: "image_url", url: mediaUrl },
    }),
    cache: "no-store",
  });
  const data = await readApiResponse(response, "Pinterest") as JsonObject;
  if (typeof data.id !== "string") throw new Error("Pinterest did not return a Pin ID.");
  return { id: data.id, url: `https://www.pinterest.com/pin/${data.id}/` };
}

export async function publishPinterestVideo(
  accessToken: string,
  boardId: string,
  title: string,
  description: string,
  videoUrl: string,
  coverImageUrl: string,
) {
  if (!coverImageUrl) throw new Error("Pinterest video Pins require a cover image; no cover image is available for this video.");
  const mediaResponse = await fetch(videoUrl, { cache: "no-store" });
  if (!mediaResponse.ok) throw new Error(`Unable to download video for Pinterest (HTTP ${mediaResponse.status}).`);
  const videoBlob = await mediaResponse.blob();

  const registerResponse = await fetch("https://api.pinterest.com/v5/media", {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({ media_type: "video" }),
    cache: "no-store",
  });
  const registration = await readApiResponse(registerResponse, "Pinterest") as JsonObject;
  if (typeof registration.media_id !== "string" || typeof registration.upload_url !== "string" || !registration.upload_parameters) {
    throw new Error("Pinterest returned an incomplete video upload request.");
  }

  const form = new FormData();
  for (const [key, value] of Object.entries(registration.upload_parameters as Record<string, string>)) {
    form.append(key, value);
  }
  const contentType = videoBlob.type || "video/mp4";
  form.append("file", videoBlob, contentType === "video/quicktime" ? "video.mov" : "video.mp4");
  const uploadResponse = await fetch(registration.upload_url, { method: "POST", body: form, cache: "no-store" });
  if (!uploadResponse.ok) throw new Error(`Pinterest video upload failed (HTTP ${uploadResponse.status}).`);

  let ready = false;
  for (let attempt = 0; attempt < 12; attempt += 1) {
    if (attempt) await new Promise((resolve) => setTimeout(resolve, 1500));
    const statusResponse = await fetch(`https://api.pinterest.com/v5/media/${encodeURIComponent(registration.media_id)}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    });
    const mediaStatus = await readApiResponse(statusResponse, "Pinterest") as JsonObject;
    if (mediaStatus.status === "succeeded") { ready = true; break; }
    if (mediaStatus.status === "failed") throw new Error("Pinterest could not process the uploaded video.");
  }
  if (!ready) throw new Error("Pinterest is still processing the video. Try publishing again in a moment.");

  const pinResponse = await fetch("https://api.pinterest.com/v5/pins", {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      board_id: boardId,
      title: title.slice(0, 95) || "Mama Jewels",
      description: description.slice(0, 795),
      media_source: {
        source_type: "video_id",
        media_id: registration.media_id,
        cover_image_url: coverImageUrl,
      },
    }),
    cache: "no-store",
  });
  const data = await readApiResponse(pinResponse, "Pinterest") as JsonObject;
  if (typeof data.id !== "string") throw new Error("Pinterest did not return a Pin ID.");
  return { id: data.id, url: `https://www.pinterest.com/pin/${data.id}/` };
}
