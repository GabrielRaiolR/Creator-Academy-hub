import { youTubeEmbedUrl } from "@/lib/youtube";

/** Privacy-enhanced YouTube embed built from a validated video id (never stored HTML). */
export function VideoPlayer({ videoId, title }: { videoId: string; title: string }) {
  return (
    <div className="overflow-hidden rounded-2xl bg-zinc-900 shadow-ring md:rounded-[2rem]">
      <div className="relative aspect-video">
        <iframe
          src={youTubeEmbedUrl(videoId)}
          title={title}
          className="absolute inset-0 size-full"
          loading="lazy"
          allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen
        />
      </div>
    </div>
  );
}
