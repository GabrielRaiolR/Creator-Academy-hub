import { describe, expect, it } from "vitest";
import { parseYouTubeId, youTubeEmbedUrl } from "@/lib/youtube";

describe("parseYouTubeId", () => {
  it.each([
    ["https://www.youtube.com/watch?v=dQw4w9WgXcQ", "dQw4w9WgXcQ"],
    ["https://youtube.com/watch?v=dQw4w9WgXcQ&t=42s", "dQw4w9WgXcQ"],
    ["https://m.youtube.com/watch?v=dQw4w9WgXcQ", "dQw4w9WgXcQ"],
    ["youtube.com/watch?v=dQw4w9WgXcQ", "dQw4w9WgXcQ"],
    ["https://youtu.be/dQw4w9WgXcQ", "dQw4w9WgXcQ"],
    ["https://youtu.be/dQw4w9WgXcQ?si=abc", "dQw4w9WgXcQ"],
    ["https://www.youtube.com/embed/dQw4w9WgXcQ", "dQw4w9WgXcQ"],
    ["https://www.youtube.com/shorts/dQw4w9WgXcQ", "dQw4w9WgXcQ"],
    ["https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ", "dQw4w9WgXcQ"],
  ])("extracts the id from %s", (input, expected) => {
    expect(parseYouTubeId(input)).toBe(expected);
  });

  it.each([
    "",
    "not a url",
    "https://vimeo.com/123456",
    "https://www.youtube.com/watch?v=short",
    "https://evil.com/watch?v=dQw4w9WgXcQ",
    "https://youtube.com.evil.com/watch?v=dQw4w9WgXcQ",
    "javascript:alert(1)",
    '<iframe src="https://www.youtube.com/embed/dQw4w9WgXcQ"></iframe>',
  ])("rejects %s", (input) => {
    expect(parseYouTubeId(input)).toBeNull();
  });

  it("builds a privacy-enhanced embed url", () => {
    expect(youTubeEmbedUrl("dQw4w9WgXcQ")).toMatch(/^https:\/\/www\.youtube-nocookie\.com\/embed\/dQw4w9WgXcQ/);
  });
});
