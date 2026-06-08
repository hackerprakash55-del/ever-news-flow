import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { X, Play, Pause, Radio } from "lucide-react";
import { tuneUtterance, waitForVoices } from "@/lib/voice";
import { cleanNarrationText, estimateNarrationSeconds, getVideoGradient } from "@/lib/videoVisuals";

export interface VideoModalSource {
  title: string;
  category?: string;
  script?: string | null;
  poster?: string | null;
}

interface Props {
  open: boolean;
  onClose: () => void;
  video: VideoModalSource | null;
}

/** Full-screen AI video script reader — no brittle video URLs, only Web Speech narration. */
export function VideoModal({ open, onClose, video }: Props) {
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const startedAtRef = useRef<number | null>(null);
  const elapsedBeforePauseRef = useRef(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [elapsed, setElapsed] = useState(0);

  const narration = useMemo(() => cleanNarrationText(video?.script || video?.title), [video?.script, video?.title]);
  const duration = useMemo(() => estimateNarrationSeconds(narration), [narration]);
  const progress = Math.min(100, (elapsed / duration) * 100);

  const stopNarration = useCallback(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();
    utteranceRef.current = null;
    startedAtRef.current = null;
    elapsedBeforePauseRef.current = 0;
    setElapsed(0);
    setIsPlaying(false);
    setIsPaused(false);
  }, []);

  const startNarration = useCallback(async () => {
    if (!narration || typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    await waitForVoices();
    // Chrome occasionally drops a speak() call that immediately follows
    // cancel(); a small yield avoids that race and is inaudible to users.
    await new Promise((r) => setTimeout(r, 60));
    const utterance = new SpeechSynthesisUtterance(narration);
    tuneUtterance(utterance);
    utterance.onend = () => {
      startedAtRef.current = null;
      elapsedBeforePauseRef.current = 0;
      setElapsed(duration);
      setIsPlaying(false);
      setIsPaused(false);
    };
    utterance.onerror = (e) => {
      console.warn("Speech synthesis error:", e);
      setIsPlaying(false);
      setIsPaused(false);
    };
    utteranceRef.current = utterance;
    elapsedBeforePauseRef.current = 0;
    startedAtRef.current = Date.now();
    setElapsed(0);
    setIsPlaying(true);
    setIsPaused(false);
    window.speechSynthesis.speak(utterance);
    // Some Chromium builds pause the speech queue after ~15s of silence;
    // a manual resume tick keeps long narrations alive.
    const keepAlive = window.setInterval(() => {
      if (!window.speechSynthesis.speaking) {
        window.clearInterval(keepAlive);
        return;
      }
      if (!window.speechSynthesis.paused) {
        window.speechSynthesis.pause();
        window.speechSynthesis.resume();
      }
    }, 10000);
  }, [duration, narration]);

  const togglePause = useCallback(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window) || !isPlaying) return;
    if (isPaused) {
      window.speechSynthesis.resume();
      startedAtRef.current = Date.now();
      setIsPaused(false);
    } else {
      window.speechSynthesis.pause();
      if (startedAtRef.current) elapsedBeforePauseRef.current += (Date.now() - startedAtRef.current) / 1000;
      startedAtRef.current = null;
      setIsPaused(true);
    }
  }, [isPaused, isPlaying]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const t = window.setTimeout(() => { startNarration(); }, 80);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
      window.clearTimeout(t);
      stopNarration();
    };
  }, [open, onClose, startNarration, stopNarration]);

  useEffect(() => {
    if (!open || !isPlaying || isPaused) return;
    const timer = window.setInterval(() => {
      const running = startedAtRef.current ? (Date.now() - startedAtRef.current) / 1000 : 0;
      setElapsed(Math.min(duration, elapsedBeforePauseRef.current + running));
    }, 250);
    return () => window.clearInterval(timer);
  }, [duration, isPaused, isPlaying, open]);

  if (!open || !video) return null;
  const gradient = getVideoGradient(video.category);

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

      <div onClick={(e) => e.stopPropagation()} className="relative w-full max-w-4xl overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] shadow-[0_30px_120px_rgba(0,0,0,0.75)]">
        <div className="absolute inset-0 scale-110 opacity-55 blur-2xl" style={{ background: gradient }} />
        {video.poster && <div className="absolute inset-0 bg-cover bg-center opacity-20 blur-xl scale-110" style={{ backgroundImage: `url(${video.poster})` }} />}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-black/40" />

        <div className="relative min-h-[520px] flex items-center justify-center p-6 md:p-10">
          <div className="w-full max-w-2xl rounded-2xl border border-white/12 bg-black/45 backdrop-blur-xl p-6 md:p-8 text-center">
            <div className="mx-auto mb-5 flex w-fit items-center gap-2 rounded-full border border-gainn-red/40 bg-gainn-red/15 px-3 py-1 text-[10px] font-bold font-mono text-gainn-red tracking-widest">
              <span className="h-1.5 w-1.5 rounded-full bg-gainn-red live-dot" /> AI VIDEO REPORT
            </div>

            <h2 className="font-display text-3xl md:text-5xl font-bold leading-tight text-white drop-shadow-[0_0_35px_rgba(0,212,255,0.18)]">
              {video.title}
            </h2>
            {video.category && <p className="mt-3 text-xs font-mono uppercase tracking-[0.25em] text-gainn-cyan">{video.category}</p>}

            <div className="mt-8 flex items-end justify-center gap-1.5 h-14" aria-hidden="true">
              {[18, 34, 50, 30, 42].map((height, i) => (
                <span
                  key={i}
                  className={`w-2 rounded-full bg-gainn-cyan ${isPlaying && !isPaused ? "animate-ai-wave" : "opacity-35"}`}
                  style={{ height, animationDelay: `${i * 0.12}s` }}
                />
              ))}
            </div>

            <div className="mt-7 flex items-center justify-center gap-3">
              {!isPlaying ? (
                <button onClick={startNarration} className="inline-flex items-center gap-2 rounded-full bg-gainn-cyan px-5 py-2.5 text-sm font-bold text-background transition-transform hover:scale-[1.03]">
                  <Play className="h-4 w-4" /> Play narration
                </button>
              ) : (
                <button onClick={togglePause} className="inline-flex items-center gap-2 rounded-full bg-white/10 px-5 py-2.5 text-sm font-bold text-white border border-white/15 transition-transform hover:scale-[1.03]">
                  {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                  {isPaused ? "Resume" : "Pause"}
                </button>
              )}
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-[10px] font-mono text-white/60">
                <Radio className="h-3 w-3 text-gainn-red" /> Web Speech API
              </span>
            </div>

            <p className="mt-5 line-clamp-3 text-sm leading-relaxed text-white/58">{narration}</p>
          </div>

          <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-white/10">
            <div className="h-full bg-gainn-cyan transition-[width] duration-300" style={{ width: `${progress}%` }} />
          </div>
        </div>
      </div>
    </div>
  );
}