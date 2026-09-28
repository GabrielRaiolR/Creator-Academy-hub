const VIDEO_ID = /^[A-Za-z0-9_-]{11}$/;

const YOUTUBE_HOSTS = new Set(["youtube.com", "youtube-nocookie.com"]);

function toUrl(input: string): URL | null {
  const value = input.trim();
  if (!value) return null;
  try {
    return new URL(value);
  } catch {
    try {
      return new URL(`https://${value}`);
    } catch {
      return null;
    }
  }
}

/**
 * Extracts the video id from a known YouTube URL format.
 * Returns null for anything that is not a recognised YouTube URL.
 */
export function parseYouTubeId(input: string): string | null {
  const url = toUrl(input);
  if (!url || (url.protocol !== "https:" && url.protocol !== "http:")) return null;

  const host = url.hostname.toLowerCase().replace(/^(www|m|music)\./, "");
  const pathParts = url.pathname.split("/").filter(Boolean);
  let candidate: string | null = null;

  if (host === "youtu.be") {
    candidate = pathParts[0] ?? null;
  } else if (YOUTUBE_HOSTS.has(host)) {
    if (url.pathname === "/watch") {
      candidate = url.searchParams.get("v");
    } else if (["embed", "shorts", "live", "v"].includes(pathParts[0] ?? "")) {
      candidate = pathParts[1] ?? null;
    }
  }

  return candidate && VIDEO_ID.test(candidate) ? candidate : null;
}

export function canonicalYouTubeUrl(videoId: string): string {
  return `https://www.youtube.com/watch?v=${videoId}`;
}

/** Privacy-enhanced embed URL (no tracking cookies until the viewer plays). */
export function youTubeEmbedUrl(videoId: string): string {
  return `https://www.youtube-nocookie.com/embed/${videoId}?rel=0`;
}
