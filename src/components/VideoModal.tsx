import { useEffect, useRef } from "react";
import { X, Play } from "lucide-react";

export interface VideoModalSource {
  title: string;
  category?: string;
  /** Direct .mp4 / hosted url. When missing, fallback card is shown. */
  src?: string | null;
  /** Optional poster / thumbnail image. */
  poster?: string | null;
}

interface Props {
  open: boolean;
  onClose: () => void;
  video: VideoModalSource | null;
}

/** Full-screen cinematic video modal — HTML5 controls, ESC to close, fade-in. */
export function VideoModal({ open, onClose, video }: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    // Try to autoplay-with-sound (user clicked, so allowed)
    const t = setTimeout(() => {
      const v = videoRef.current;
      if (v && video?.src) {
        v.muted = false;
        v.play().catch(() => { /* will rely on controls */ });
      }
    }, 50);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
      clearTimeout(t);
      const v = videoRef.current;
      if (v) { v.pause(); v.removeAttribute("src"); v.load(); }
    };
  }, [open, onClose, video?.src]);

  if (!open || !video) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[120] flex items-center justify-center p-4 animate-fade-in"
      style={{ background: "rgba(0,0,0,0.92)", backdropFilter: "blur(8px)" }}
      role="dialog"
      aria-modal="true"
    >
      <button
        onClick={onClose}
        aria-label="Close video"
        className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 flex items-center justify-center text-white transition-colors"
      >
        <X className="w-5 h-5" />
      </button>

      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-5xl"
      >
        <div className="text-white/90 text-sm font-mono mb-3 flex items-center gap-2">
          {video.category && (
            <span className="px-2 py-0.5 rounded border border-white/15 text-[10px] tracking-wider">
              {video.category.toUpperCase()}
            </span>
          )}
          <span className="truncate">{video.title}</span>
        </div>
        <div className="relative w-full overflow-hidden rounded-xl bg-black border border-white/10" style={{ aspectRatio: "16 / 9" }}>
          {video.src ? (
            <video
              ref={videoRef}
              src={video.src}
              poster={video.poster || undefined}
              controls
              playsInline
              preload="metadata"
              autoPlay
              className="w-full h-full"
              onError={(e) => {
                // Force the fallback card by clearing src on error
                (e.currentTarget as HTMLVideoElement).style.display = "none";
                const fallback = (e.currentTarget.parentElement?.querySelector("[data-fallback]") as HTMLElement);
                if (fallback) fallback.style.display = "flex";
              }}
            />
          ) : null}

          {/* Fallback card (shown if no src or video fails) */}
          <div
            data-fallback
            style={{ display: video.src ? "none" : "flex" }}
            className="absolute inset-0 flex-col items-center justify-center gap-3 text-center p-8"
          >
            {video.poster && (
              <img src={video.poster} alt="" className="absolute inset-0 w-full h-full object-cover opacity-30" />
            )}
            <div className="relative w-16 h-16 rounded-full bg-white/10 border border-white/15 flex items-center justify-center">
              <Play className="w-6 h-6 text-white/70 ml-0.5" />
            </div>
            <p className="relative text-white font-semibold">Video unavailable</p>
            <p className="relative text-white/60 text-sm max-w-md">
              This report's video stream couldn't be loaded. The article and AI-generated transcript are still available.
            </p>
          </div>
        </div>
        <div className="mt-3 text-[11px] font-mono text-white/50 text-center">
          Press <kbd className="px-1.5 py-0.5 rounded border border-white/15">Esc</kbd> to close
        </div>
      </div>
    </div>
  );
}