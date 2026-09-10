import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { AudioLines, CalendarClock, Pause, Play, Radio, SkipForward, Volume2, VolumeX } from "lucide-react";
import { GlobalHeader } from "@/components/GlobalHeader";
import { SeoHead } from "@/components/SeoHead";
import { useNews } from "@/hooks/useNews";
import { fetchNarration, releaseNarration } from "@/lib/tts";
import { tuneUtterance, waitForVoices } from "@/lib/voice";
import { useLanguage } from "@/lib/language";
import { cn } from "@/lib/utils";
import type { Article } from "@/data/mockData";

const TIME_KEY = "gainn:primetime-schedule";
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const COPY = {
  hi: {
    kicker: "गेन प्राइम टाइम · हिन्दी बुलेटिन",
    title: "हिन्दी प्राइम टाइम शेड्यूल",
    lead: "अपना पसंदीदा समय चुनिए — गेन का एआई एंकर उसी वक़्त हिन्दी में दिन की बड़ी ख़बरें पढ़कर सुनाएगा।",
    pick: "बुलेटिन का समय",
    days: "दिन चुनें",
    next: "अगला बुलेटिन",
    runNow: "अभी लाइव चलाएँ",
    stop: "बुलेटिन रोकें",
    lineup: "आज की सुर्ख़ियाँ",
    onair: "ऑन एयर",
    cue: "आवाज़ तैयार हो रही है…",
    saved: "समय सुरक्षित",
  },
  en: {
    kicker: "GAINN Prime Time · Hindi bulletin",
    title: "Hindi Prime Time Schedule",
    lead: "Pick a time and GAINN's AI anchor reads the day's biggest stories aloud in Hindi.",
    pick: "Bulletin time",
    days: "Days",
    next: "Next bulletin",
    runNow: "Run it live now",
    stop: "Stop bulletin",
    lineup: "Tonight's lineup",
    onair: "On air",
    cue: "Cueing AI narration…",
    saved: "Time saved",
  },
};

function loadSchedule() {
  try {
    const raw = localStorage.getItem(TIME_KEY);
    if (raw) {
      const p = JSON.parse(raw) as { time: string; days: number[] };
      if (p?.time) return { time: p.time, days: Array.isArray(p.days) && p.days.length ? p.days : [0, 1, 2, 3, 4, 5, 6] };
    }
  } catch { /* noop */ }
  return { time: "21:00", days: [0, 1, 2, 3, 4, 5, 6] };
}

function nextRun(time: string, days: number[]): Date | null {
  if (!days.length) return null;
  const [h, m] = time.split(":").map(Number);
  for (let i = 0; i < 8; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    d.setHours(h || 0, m || 0, 0, 0);
    if (days.includes(d.getDay()) && d.getTime() > Date.now()) return d;
  }
  return null;
}

export default function PrimeTimeSchedulePage() {
  const [lang, setLang] = useLanguage();
  const hindi = lang.startsWith("hi");
  const t = hindi ? COPY.hi : COPY.en;

  const initial = useMemo(loadSchedule, []);
  const [time, setTime] = useState(initial.time);
  const [days, setDays] = useState<number[]>(initial.days);
  const [now, setNow] = useState(new Date());
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [idx, setIdx] = useState(0);
  const [voiceState, setVoiceState] = useState<"idle" | "loading" | "premium" | "browser">("idle");

  const { articles } = useNews({ pageSize: 20, location: "India", lang: hindi ? "hi" : "en" });
  const lineup = useMemo(() => articles.slice(0, 6), [articles]);
  const story = lineup[idx];

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioUrlRef = useRef<string | null>(null);
  const idxRef = useRef(0);
  const playingRef = useRef(false);
  useEffect(() => { idxRef.current = idx; }, [idx]);
  useEffect(() => { playingRef.current = playing; }, [playing]);

  useEffect(() => {
    try { localStorage.setItem(TIME_KEY, JSON.stringify({ time, days })); } catch { /* noop */ }
  }, [time, days]);

  useEffect(() => {
    const iv = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(iv);
  }, []);

  const upcoming = useMemo(() => nextRun(time, days), [time, days, now.getMinutes()]);

  const stopAudio = useCallback(() => {
    try { window.speechSynthesis?.cancel(); } catch { /* noop */ }
    if (audioRef.current) {
      audioRef.current.onended = null;
      audioRef.current.onerror = null;
      audioRef.current.pause();
      audioRef.current = null;
    }
    releaseNarration(audioUrlRef.current);
    audioUrlRef.current = null;
  }, []);

  const advance = useCallback(() => {
    setIdx((i) => (lineup.length ? (i + 1) % lineup.length : 0));
  }, [lineup.length]);

  const scriptFor = (a: Article) =>
    `${a.headline}. ${a.summary || a.body?.slice(0, 260) || ""}`.replace(/\s+/g, " ").trim().slice(0, 460);

  const speakBrowser = useCallback(async (a: Article, i: number) => {
    if (!("speechSynthesis" in window)) return;
    setVoiceState("browser");
    await waitForVoices();
    const u = new SpeechSynthesisUtterance(scriptFor(a));
    tuneUtterance(u, hindi ? "hi-IN" : lang);
    u.volume = muted ? 0 : 1;
    u.onend = () => { if (playingRef.current && i === idxRef.current) advance(); };
    window.speechSynthesis.speak(u);
  }, [advance, hindi, lang, muted]);

  // Bulletin engine: narrate each story, then move to the next one.
  useEffect(() => {
    stopAudio();
    if (!playing || !story) return;
    let cancelled = false;
    const i = idx;
    setVoiceState("loading");
    (async () => {
      const { audioUrl } = await fetchNarration(scriptFor(story), story.headline, hindi ? "hi-IN" : lang);
      if (cancelled || i !== idxRef.current) return;
      if (!audioUrl) { await speakBrowser(story, i); return; }
      audioUrlRef.current = audioUrl;
      const audio = new Audio(audioUrl);
      audio.muted = muted;
      audioRef.current = audio;
      audio.onended = () => { if (playingRef.current && i === idxRef.current) advance(); };
      audio.onerror = () => { speakBrowser(story, i); };
      setVoiceState("premium");
      audio.play().catch(() => speakBrowser(story, i));
    })();
    return () => { cancelled = true; stopAudio(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, idx, story?.id, lang]);

  useEffect(() => { if (audioRef.current) audioRef.current.muted = muted; }, [muted]);
  useEffect(() => () => stopAudio(), [stopAudio]);

  // Auto-start the bulletin when the scheduled minute arrives and the page is open.
  const firedRef = useRef<string>("");
  useEffect(() => {
    const stamp = `${now.toDateString()} ${now.getHours()}:${now.getMinutes()}`;
    const [h, m] = time.split(":").map(Number);
    if (
      !playing && days.includes(now.getDay()) &&
      now.getHours() === h && now.getMinutes() === m && firedRef.current !== stamp
    ) {
      firedRef.current = stamp;
      setIdx(0);
      setPlaying(true);
    }
  }, [now, time, days, playing]);

  const countdown = upcoming
    ? (() => {
        const s = Math.max(0, Math.floor((upcoming.getTime() - now.getTime()) / 1000));
        return `${String(Math.floor(s / 3600)).padStart(2, "0")}:${String(Math.floor((s % 3600) / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
      })()
    : "—";

  return (
    <div className="min-h-screen bg-background">
      <SeoHead
        path="/prime-time/schedule"
        title="Hindi Prime Time Schedule — GAINN AI News Bulletin"
        description="Schedule GAINN's Hindi Prime Time bulletin: pick a time, and the AI anchor reads India's biggest stories aloud in Hindi, live."
      />
      <div className="ambient-orbs" aria-hidden="true"><span /></div>
      <GlobalHeader />

      <main className="max-w-screen-lg mx-auto px-4 md:px-6 py-10 space-y-8">
        <header>
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/40 text-[10px] font-mono tracking-widest text-primary uppercase">
            <CalendarClock className="w-3 h-3" /> {t.kicker}
          </span>
          <h1 className="mt-4 font-display font-bold text-4xl md:text-5xl text-white">{t.title}</h1>
          <p className="mt-3 max-w-2xl text-sm md:text-base text-muted-foreground leading-relaxed">{t.lead}</p>
          <div className="mt-4 flex items-center gap-1 p-0.5 rounded-full border border-border w-fit">
            {(["hi", "en"] as const).map((l) => (
              <button
                key={l}
                onClick={() => setLang(l === "hi" ? "hi-IN" : "en-IN")}
                aria-pressed={hindi === (l === "hi")}
                className={cn("px-3 py-1 rounded-full text-[11px] font-mono transition",
                  hindi === (l === "hi") ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground")}
              >
                {l === "hi" ? "हिन्दी" : "English"}
              </button>
            ))}
          </div>
        </header>

        {/* Scheduler */}
        <section className="card-glass rounded-xl p-5 md:p-6 grid gap-6 md:grid-cols-[220px_1fr]">
          <div>
            <label htmlFor="bulletin-time" className="block text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
              {t.pick}
            </label>
            <input
              id="bulletin-time"
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="mt-2 w-full bg-surface-1 border border-border rounded-lg px-3 py-2.5 font-mono text-lg text-foreground focus:outline-none focus:border-primary/60"
            />
            <p className="mt-2 text-[10px] font-mono text-muted-foreground">{t.saved} · {time}</p>
          </div>

          <div>
            <span className="block text-[10px] font-mono uppercase tracking-widest text-muted-foreground">{t.days}</span>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {DAYS.map((d, i) => (
                <button
                  key={d}
                  onClick={() => setDays((prev) => prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i].sort())}
                  aria-pressed={days.includes(i)}
                  className={cn("px-3 py-1.5 rounded-full border text-[11px] font-mono transition",
                    days.includes(i)
                      ? "border-primary/60 bg-primary/15 text-primary"
                      : "border-border text-muted-foreground hover:text-foreground")}
                >
                  {d}
                </button>
              ))}
            </div>

            <div className="mt-5 flex items-end gap-6 flex-wrap">
              <div>
                <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">{t.next}</div>
                <div className="mt-1 font-display text-2xl font-bold text-white tabular-nums">{countdown}</div>
                <div className="text-[10px] font-mono text-muted-foreground">
                  {upcoming ? upcoming.toLocaleString("en-IN", { weekday: "short", hour: "2-digit", minute: "2-digit" }) : "—"}
                </div>
              </div>
              <button
                onClick={() => { setIdx(0); setPlaying((p) => !p); }}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gainn-red text-white text-sm font-bold hover:brightness-110 active:scale-95 transition"
              >
                {playing ? <><Pause className="w-4 h-4" /> {t.stop}</> : <><Play className="w-4 h-4" /> {t.runNow}</>}
              </button>
            </div>
          </div>
        </section>

        {/* Live bulletin player */}
        <section className="card-glass rounded-xl p-5 md:p-6">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <span className="inline-flex items-center gap-2 text-[10px] font-mono tracking-widest uppercase text-gainn-red">
              <Radio className="w-3.5 h-3.5" />
              <span className={cn("w-2 h-2 rounded-full bg-gainn-red", playing && "live-dot")} /> {t.onair}
            </span>
            <div className="flex items-center gap-2">
              <button onClick={advance} aria-label="Next story"
                className="w-9 h-9 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:text-foreground transition">
                <SkipForward className="w-4 h-4" />
              </button>
              <button onClick={() => setMuted((m) => !m)} aria-label={muted ? "Unmute" : "Mute"}
                className="w-9 h-9 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:text-foreground transition">
                {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <h2 lang={hindi ? "hi" : "en"} className="mt-4 font-display font-bold text-xl md:text-2xl text-white leading-snug">
            {story?.headline || "—"}
          </h2>
          <p lang={hindi ? "hi" : "en"} className="mt-2 text-sm text-muted-foreground leading-relaxed line-clamp-4">
            {story?.summary}
          </p>
          <div className="mt-3 flex items-center gap-2 text-[10px] font-mono text-primary">
            <AudioLines className={cn("w-4 h-4", playing && "animate-pulse")} />
            {!playing ? t.runNow : voiceState === "loading" ? t.cue : `${idx + 1} / ${lineup.length || 1}`}
          </div>
        </section>

        {/* Lineup */}
        <section>
          <h2 className="text-sm font-semibold font-mono uppercase tracking-wider text-primary mb-3">{t.lineup}</h2>
          <ol className="space-y-2">
            {lineup.map((a, i) => (
              <li key={a.id}>
                <button
                  onClick={() => { setIdx(i); setPlaying(true); }}
                  className={cn("w-full text-left px-4 py-3 rounded-lg border transition",
                    i === idx ? "border-primary/60 bg-primary/10" : "border-border hover:border-primary/30")}
                >
                  <span className="font-mono text-[10px] text-muted-foreground mr-2">{String(i + 1).padStart(2, "0")}</span>
                  <span lang={hindi ? "hi" : "en"} className="text-sm text-foreground">{a.headline}</span>
                </button>
              </li>
            ))}
          </ol>
          <Link to="/prime-time" className="mt-5 inline-block text-xs font-mono text-primary hover:underline">
            ← Prime Time
          </Link>
        </section>
      </main>
    </div>
  );
}
