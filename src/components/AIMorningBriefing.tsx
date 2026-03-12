import { useState, useEffect, useRef } from "react";
import { Sparkles, ChevronDown, ChevronUp, Volume2, VolumeX, RefreshCw, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

const MOCK_BULLETS = [
  "Global AI governance summit in Geneva reaches landmark treaty — 47 nations agree on binding safety standards for autonomous AI systems by 2027.",
  "Federal Reserve signals potential rate cuts after latest jobs report shows inflation cooling to 2.1%, markets rally 1.8% overnight.",
  "Breakthrough in quantum computing: IBM announces 1-million qubit processor, expected to accelerate drug discovery timelines by a decade.",
  "Arctic temperatures hit all-time record high for March — 12 nations declare climate emergency; UN emergency session called for Thursday.",
  "SpaceX Starship completes first successful full orbital mission with crew of four astronauts, splashing down safely in the Pacific Ocean.",
];

const HOUR_MS = 60 * 60 * 1000;

function useCountdown(targetMs: number) {
  const [remaining, setRemaining] = useState(targetMs - Date.now());
  useEffect(() => {
    const t = setInterval(() => setRemaining(targetMs - Date.now()), 1000);
    return () => clearInterval(t);
  }, [targetMs]);
  const secs = Math.max(0, Math.floor(remaining / 1000));
  const m = String(Math.floor(secs / 60)).padStart(2, "0");
  const s = String(secs % 60).padStart(2, "0");
  return `${m}:${s}`;
}

export function AIMorningBriefing() {
  const [open, setOpen] = useState(true);
  const [speaking, setSpeaking] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [bullets, setBullets] = useState(MOCK_BULLETS);
  const [refreshAt, setRefreshAt] = useState(() => Date.now() + HOUR_MS);
  const countdown = useCountdown(refreshAt);
  const synthRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Auto-refresh bullets every hour
  useEffect(() => {
    const t = setInterval(() => {
      setRefreshAt(Date.now() + HOUR_MS);
      // In a real app this would call an AI endpoint
      setBullets([...MOCK_BULLETS].reverse());
    }, HOUR_MS);
    return () => clearInterval(t);
  }, []);

  // Stop speech on unmount
  useEffect(() => {
    return () => {
      if (window.speechSynthesis) window.speechSynthesis.cancel();
    };
  }, []);

  function handleListen() {
    if (!window.speechSynthesis) return;
    if (speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
      return;
    }
    const text = bullets.map((b, i) => `Point ${i + 1}. ${b}`).join(" ... ");
    const utt = new SpeechSynthesisUtterance(text);
    utt.rate = 0.95;
    utt.pitch = 1;
    utt.onend = () => setSpeaking(false);
    utt.onerror = () => setSpeaking(false);
    synthRef.current = utt;
    window.speechSynthesis.speak(utt);
    setSpeaking(true);
  }

  function handleRefresh() {
    setRefreshing(true);
    setTimeout(() => {
      setBullets([...MOCK_BULLETS].sort(() => Math.random() - 0.5));
      setRefreshAt(Date.now() + HOUR_MS);
      setRefreshing(false);
    }, 900);
  }

  return (
    <div className="card-glass rounded-xl border border-primary/20 overflow-hidden">
      {/* Header */}
      <div
        className="flex items-center gap-3 px-4 py-3 cursor-pointer select-none bg-primary/5 hover:bg-primary/8 transition-colors"
        onClick={() => setOpen((v) => !v)}
      >
        <div className="flex items-center gap-2 flex-1">
          <div className="w-7 h-7 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
          </div>
          <div>
            <span className="text-sm font-semibold text-foreground">AI Morning Briefing</span>
            <span className="ml-2 text-[10px] font-mono text-primary bg-primary/10 px-1.5 py-0.5 rounded-full">
              5 key stories
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 ml-auto">
          {/* Countdown */}
          <div className="hidden sm:flex items-center gap-1 text-[10px] font-mono text-muted-foreground">
            <Clock className="w-3 h-3" />
            <span>Refresh in {countdown}</span>
          </div>

          {/* Listen */}
          <button
            onClick={(e) => { e.stopPropagation(); handleListen(); }}
            className={cn(
              "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono border transition-all",
              speaking
                ? "bg-destructive/15 border-destructive/30 text-destructive"
                : "bg-accent/10 border-accent/25 text-accent hover:bg-accent/20"
            )}
          >
            {speaking ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
            {speaking ? "Stop" : "Listen"}
          </button>

          {/* Refresh */}
          <button
            onClick={(e) => { e.stopPropagation(); handleRefresh(); }}
            className="h-7 w-7 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            disabled={refreshing}
          >
            <RefreshCw className={cn("w-3.5 h-3.5", refreshing && "animate-spin")} />
          </button>

          {/* Collapse toggle */}
          {open ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </div>
      </div>

      {/* Bullets */}
      {open && (
        <div className={cn("px-4 py-4 space-y-3 transition-all", refreshing && "opacity-40")}>
          {bullets.map((bullet, i) => (
            <div key={i} className="flex gap-3 group animate-fade-in-up" style={{ animationDelay: `${i * 60}ms` }}>
              <div className="flex-shrink-0 mt-0.5">
                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-primary/15 border border-primary/25 text-[10px] font-bold font-mono text-primary">
                  {i + 1}
                </span>
              </div>
              <p className="text-sm text-foreground leading-relaxed group-hover:text-primary transition-colors">
                {bullet}
              </p>
            </div>
          ))}

          {/* Footer */}
          <div className="pt-2 border-t border-border/50 flex items-center gap-3 text-[10px] font-mono text-muted-foreground">
            <Sparkles className="w-3 h-3 text-primary" />
            <span>Generated by GAINN AI · Powered by Gemini</span>
            <span className="ml-auto flex items-center gap-1">
              <Clock className="w-3 h-3" /> Next update in {countdown}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
