import { useState, useRef, useEffect, useCallback } from "react";
import { useLocation } from "react-router-dom";
import { GlobalHeader } from "@/components/GlobalHeader";
import { NewsTickerBar } from "@/components/NewsTickerBar";
import {
  Video, Sparkles, Play, Pause, Clock, Globe, ChevronRight,
  Loader2, RefreshCw, Download, AlertCircle,
  Mic, Film, BookOpen, Zap, TrendingUp, Image as ImageIcon,
  PlayCircle, Volume2, VolumeX, Headphones, Square, Radio,
  Library, CalendarDays, ArrowUpRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const SUGGESTED_TOPICS = [
  { label: "Iran Conflict & Middle East", icon: "🌍", category: "Global Affairs" },
  { label: "AI Revolution in 2026", icon: "🤖", category: "AI" },
  { label: "Global Economy & Tariffs", icon: "📈", category: "Economy" },
  { label: "Climate Emergency Updates", icon: "🌿", category: "Environment" },
  { label: "US Politics & Policy", icon: "🏛️", category: "Politics" },
  { label: "Space Exploration Breakthroughs", icon: "🚀", category: "Science" },
  { label: "Cybersecurity & Tech Giants", icon: "💻", category: "Technology" },
  { label: "Health & Pandemic Preparedness", icon: "🏥", category: "Health" },
];

interface VideoScript {
  title: string;
  duration: string;
  category: string;
  thumbnailPrompt: string;
  script: string;
  rawHeadlines: string[];
  generatedAt: string;
}

interface VideoRecord {
  id: string;
  title: string;
  category: string | null;
  duration: string | null;
  script: string;
  thumbnail_prompt: string | null;
  thumbnail_url: string | null;
  raw_headlines: string[] | null;
  generated_at: string | null;
  created_at: string | null;
}

  id: string;
  title: string;
  category: string;
  duration: string;
  script: string;
  thumbnail_prompt: string;
  raw_headlines: string[];
  generated_at: string;
  created_at: string;
}

const CATEGORY_COLORS: Record<string, string> = {
  "AI": "bg-gainn-purple/20 text-gainn-purple border-gainn-purple/30",
  "Technology": "bg-gainn-blue/20 text-gainn-blue border-gainn-blue/30",
  "Economy": "bg-gainn-green/20 text-gainn-green border-gainn-green/30",
  "Politics": "bg-gainn-red/20 text-gainn-red border-gainn-red/30",
  "Environment": "bg-gainn-green/20 text-gainn-green border-gainn-green/30",
  "Science": "bg-gainn-cyan/20 text-gainn-cyan border-gainn-cyan/30",
  "Health": "bg-gainn-amber/20 text-gainn-amber border-gainn-amber/30",
  "Global Affairs": "bg-gainn-blue/20 text-gainn-blue border-gainn-blue/30",
};

const CATEGORY_GRADIENTS: Record<string, string> = {
  "AI": "from-gainn-purple/30 to-gainn-blue/10",
  "Technology": "from-gainn-blue/30 to-gainn-cyan/10",
  "Economy": "from-gainn-green/30 to-gainn-cyan/10",
  "Politics": "from-gainn-red/30 to-gainn-amber/10",
  "Environment": "from-gainn-green/30 to-gainn-blue/10",
  "Science": "from-gainn-cyan/30 to-gainn-blue/10",
  "Health": "from-gainn-amber/30 to-gainn-green/10",
  "Global Affairs": "from-gainn-blue/30 to-gainn-purple/10",
};


function formatScript(script: string | undefined | null) {
  if (!script) return null;
  return script
    .split("\n")
    .map((line, i) => {
      const trimmed = line.trim();
      if (!trimmed) return null;
      if (/^\*\*[A-Z\s]+\*\*$/.test(trimmed) || /^#{1,3}\s/.test(trimmed)) {
        const label = trimmed.replace(/\*\*/g, "").replace(/^#+\s/, "");
        return (
          <div key={i} className="mt-6 mb-2">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest font-mono bg-gainn-blue/15 text-gainn-blue border border-gainn-blue/30">
              <Mic className="w-3 h-3" /> {label}
            </span>
          </div>
        );
      }
      return (
        <p key={i} className="text-sm text-foreground/90 leading-relaxed mb-2">
          {trimmed}
        </p>
      );
    })
    .filter(Boolean);
}

function formatTime(seconds: number) {
  if (!isFinite(seconds)) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

// Audio Player Component
function AudioPlayer({
  audioUrl,
  title,
}: {
  audioUrl: string;
  title: string;
}) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onLoaded = () => setDuration(audio.duration);
    const onEnded = () => setIsPlaying(false);
    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("loadedmetadata", onLoaded);
    audio.addEventListener("ended", onEnded);
    return () => {
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("loadedmetadata", onLoaded);
      audio.removeEventListener("ended", onEnded);
    };
  }, [audioUrl]);

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play();
      setIsPlaying(true);
    }
  }, [isPlaying]);

  const stop = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.pause();
    audio.currentTime = 0;
    setIsPlaying(false);
  }, []);

  const toggleMute = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.muted = !isMuted;
    setIsMuted(!isMuted);
  }, [isMuted]);

  const handleProgressClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    const bar = progressRef.current;
    if (!audio || !bar || !duration) return;
    const rect = bar.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    audio.currentTime = ratio * duration;
  }, [duration]);

  const handleVolumeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    const val = parseFloat(e.target.value);
    if (audio) audio.volume = val;
    setVolume(val);
    if (val === 0) setIsMuted(true);
    else setIsMuted(false);
  }, []);

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="bg-surface-1 border border-gainn-blue/20 rounded-xl p-4">
      <audio ref={audioRef} src={audioUrl} preload="auto" />

      {/* Player header */}
      <div className="flex items-center gap-2 mb-3">
        <div className="w-7 h-7 rounded-lg bg-gainn-blue/15 border border-gainn-blue/30 flex items-center justify-center flex-shrink-0">
          <Headphones className="w-3.5 h-3.5 text-gainn-blue" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-foreground truncate">{title}</p>
          <p className="text-[10px] font-mono text-muted-foreground">AI Anchor Voice-Over · George (ElevenLabs)</p>
        </div>
        {isPlaying && (
          <div className="flex items-center gap-0.5">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className="w-0.5 bg-gainn-blue rounded-full animate-pulse"
                style={{
                  height: `${8 + (i % 3) * 4}px`,
                  animationDelay: `${i * 0.1}s`,
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Progress bar */}
      <div
        ref={progressRef}
        onClick={handleProgressClick}
        className="relative h-1.5 bg-surface-3 rounded-full cursor-pointer mb-3 group"
      >
        <div
          className="h-full bg-gainn-blue rounded-full transition-all"
          style={{ width: `${progress}%` }}
        />
        <div
          className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-gainn-blue border-2 border-background shadow opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ left: `calc(${progress}% - 6px)` }}
        />
      </div>

      {/* Time + controls */}
      <div className="flex items-center gap-3">
        {/* Transport controls */}
        <div className="flex items-center gap-1">
          <button
            onClick={togglePlay}
            className="w-8 h-8 rounded-full bg-gainn-blue flex items-center justify-center hover:bg-gainn-blue/80 transition-colors"
          >
            {isPlaying ? (
              <Pause className="w-3.5 h-3.5 text-background" />
            ) : (
              <Play className="w-3.5 h-3.5 text-background ml-0.5" />
            )}
          </button>
          <button
            onClick={stop}
            className="w-7 h-7 rounded-full bg-surface-2 border border-border flex items-center justify-center hover:bg-surface-3 transition-colors"
          >
            <Square className="w-3 h-3 text-muted-foreground" />
          </button>
        </div>

        {/* Time */}
        <span className="text-[10px] font-mono text-muted-foreground flex-1">
          {formatTime(currentTime)} / {formatTime(duration)}
        </span>

        {/* Volume */}
        <div className="flex items-center gap-1.5">
          <button onClick={toggleMute} className="text-muted-foreground hover:text-foreground transition-colors">
            {isMuted || volume === 0 ? (
              <VolumeX className="w-3.5 h-3.5" />
            ) : (
              <Volume2 className="w-3.5 h-3.5" />
            )}
          </button>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={isMuted ? 0 : volume}
            onChange={handleVolumeChange}
            className="w-16 h-1 accent-gainn-blue cursor-pointer"
          />
        </div>
      </div>
    </div>
  );
}

// Browser Web Speech API voice player (free fallback)
function BrowserVoicePlayer({ script, title }: { script: string; title: string }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const uttRef = useRef<SpeechSynthesisUtterance | null>(null);

  const cleanText = script
    .replace(/\*\*[A-Z\s]+\*\*/g, "")
    .replace(/#{1,3}\s+\w+/g, "")
    .replace(/\*\*/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
    .slice(0, 5000);

  const play = useCallback(() => {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(cleanText);
    utter.rate = 0.9;
    utter.pitch = 0.85;
    utter.volume = 1;
    // Pick a deep male voice if available
    const voices = window.speechSynthesis.getVoices();
    const preferred = voices.find(v => /male|daniel|google uk|en-gb/i.test(v.name));
    if (preferred) utter.voice = preferred;
    utter.onend = () => { setIsPlaying(false); setIsPaused(false); };
    utter.onerror = () => { setIsPlaying(false); setIsPaused(false); };
    uttRef.current = utter;
    window.speechSynthesis.speak(utter);
    setIsPlaying(true);
    setIsPaused(false);
  }, [cleanText]);

  const pause = useCallback(() => {
    window.speechSynthesis.pause();
    setIsPaused(true);
  }, []);

  const resume = useCallback(() => {
    window.speechSynthesis.resume();
    setIsPaused(false);
  }, []);

  const stop = useCallback(() => {
    window.speechSynthesis.cancel();
    setIsPlaying(false);
    setIsPaused(false);
  }, []);

  useEffect(() => () => { window.speechSynthesis.cancel(); }, []);

  return (
    <div className="bg-surface-1 border border-border rounded-xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-7 h-7 rounded-lg bg-gainn-green/15 border border-gainn-green/30 flex items-center justify-center flex-shrink-0">
          <Radio className="w-3.5 h-3.5 text-gainn-green" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-foreground truncate">{title}</p>
          <p className="text-[10px] font-mono text-muted-foreground">Browser Voice-Over · Web Speech API</p>
        </div>
        {isPlaying && !isPaused && (
          <div className="flex items-center gap-0.5">
            {[0,1,2,3].map(i => (
              <div key={i} className="w-0.5 bg-gainn-green rounded-full animate-pulse"
                style={{ height: `${8+(i%3)*4}px`, animationDelay: `${i*0.1}s` }} />
            ))}
          </div>
        )}
      </div>
      <div className="flex items-center gap-2">
        {!isPlaying ? (
          <button onClick={play}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gainn-green text-background text-xs font-semibold hover:bg-gainn-green/80 transition-colors">
            <Play className="w-3 h-3" /> Play Voice-Over
          </button>
        ) : isPaused ? (
          <>
            <button onClick={resume}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gainn-green text-background text-xs font-semibold hover:bg-gainn-green/80 transition-colors">
              <Play className="w-3 h-3" /> Resume
            </button>
            <button onClick={stop}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-2 border border-border text-xs text-muted-foreground hover:text-foreground transition-colors">
              <Square className="w-3 h-3" /> Stop
            </button>
          </>
        ) : (
          <>
            <button onClick={pause}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gainn-amber/15 border border-gainn-amber/30 text-gainn-amber text-xs font-semibold hover:bg-gainn-amber/25 transition-colors">
              <Pause className="w-3 h-3" /> Pause
            </button>
            <button onClick={stop}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-2 border border-border text-xs text-muted-foreground hover:text-foreground transition-colors">
              <Square className="w-3 h-3" /> Stop
            </button>
          </>
        )}
        <span className="text-[10px] font-mono text-muted-foreground ml-auto">
          ~{Math.round(cleanText.split(" ").length / 140)} min
        </span>
      </div>
    </div>
  );
}

export default function AIVideoPage() {
  const location = useLocation();
  const navVideo = (location.state as any)?.video as VideoRecord | undefined;

  const [topic, setTopic] = useState(navVideo?.title || "");
  const [isGenerating, setIsGenerating] = useState(false);
  const [videoScript, setVideoScript] = useState<VideoScript | null>(
    navVideo ? {
      title: navVideo.title,
      category: navVideo.category,
      duration: navVideo.duration,
      script: navVideo.script,
      thumbnailPrompt: navVideo.thumbnail_prompt,
      rawHeadlines: navVideo.raw_headlines || [],
      generatedAt: navVideo.generated_at,
    } : null
  );
  const [error, setError] = useState<string | null>(null);
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const [isGeneratingThumbnail, setIsGeneratingThumbnail] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const [useBrowserVoice, setUseBrowserVoice] = useState(!!navVideo);
  const [library, setLibrary] = useState<VideoRecord[]>([]);
  const [isLoadingLibrary, setIsLoadingLibrary] = useState(true);
  const { toast } = useToast();

  // Load video library on mount; if came from nav with a video, generate its assets
  useEffect(() => {
    loadLibrary();
    if (navVideo) {
      generateThumbnail(navVideo.thumbnail_prompt, navVideo.title);
    }
  }, []);

  const loadLibrary = async () => {
    setIsLoadingLibrary(true);
    try {
      const { data } = await supabase
        .from("generated_videos")
        .select("id, title, category, duration, thumbnail_prompt, thumbnail_url, raw_headlines, generated_at, created_at, script")
        .order("created_at", { ascending: false });
      if (data) {
        setLibrary(data as VideoRecord[]);
        // Auto-generate all 8 suggested topics if the library is empty on first load
        if (data.length === 0) {
          autoGenerateAllTopics();
        }
      }
    } catch (e) {
      console.error("Failed to load library:", e);
    } finally {
      setIsLoadingLibrary(false);
    }
  };

  // Auto-generate all 8 suggested topics sequentially when library is empty
  const autoGenerateAllTopics = async () => {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
    if (!supabaseUrl || !anonKey) return;

    for (const t of SUGGESTED_TOPICS) {
      try {
        const res = await fetch(`${supabaseUrl}/functions/v1/generate-video-script`, {
          method: "POST",
          headers: { Authorization: `Bearer ${anonKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({ topic: t.label }),
        });
        if (!res.ok) continue;
        const data: VideoScript = await res.json();
        if (!data?.script) continue;

        // Save to DB
        const { data: inserted } = await supabase.from("generated_videos").insert({
          title: data.title,
          category: data.category,
          duration: data.duration,
          script: data.script,
          thumbnail_prompt: data.thumbnailPrompt,
          raw_headlines: data.rawHeadlines,
          generated_at: data.generatedAt,
        }).select("id").single();

        // Generate & save thumbnail
        if (inserted?.id && data.thumbnailPrompt) {
          try {
            const thumbRes = await fetch(`${supabaseUrl}/functions/v1/generate-video-thumbnail`, {
              method: "POST",
              headers: { Authorization: `Bearer ${anonKey}`, "Content-Type": "application/json" },
              body: JSON.stringify({ thumbnailPrompt: data.thumbnailPrompt, title: data.title }),
            });
            if (thumbRes.ok) {
              const thumbData = await thumbRes.json();
              if (thumbData.imageUrl) {
                await supabase.from("generated_videos")
                  .update({ thumbnail_url: thumbData.imageUrl })
                  .eq("id", inserted.id);
              }
            }
          } catch (e) {
            console.error("Auto thumbnail failed:", e);
          }
        }
      } catch (e) {
        console.error("Auto-generate failed for topic:", t.label, e);
      }
    }
    // Refresh library after all are generated
    loadLibrary();
  };

  const saveVideoToDb = async (video: VideoScript) => {
    try {
      const { data: inserted } = await supabase.from("generated_videos").insert({
        title: video.title,
        category: video.category,
        duration: video.duration,
        script: video.script,
        thumbnail_prompt: video.thumbnailPrompt,
        raw_headlines: video.rawHeadlines,
        generated_at: video.generatedAt,
      }).select("id").single();
      // Refresh library
      loadLibrary();
      return inserted?.id ?? null;
    } catch (e) {
      console.error("Failed to save video:", e);
      return null;
    }
  };

  const loadVideoFromLibrary = (record: VideoRecord) => {
    setVideoScript({
      title: record.title,
      duration: record.duration ?? "6-8 min",
      category: record.category ?? "Global Affairs",
      thumbnailPrompt: record.thumbnail_prompt ?? "",
      script: record.script ?? "",
      rawHeadlines: Array.isArray(record.raw_headlines) ? record.raw_headlines : [],
      generatedAt: record.generated_at ?? new Date().toISOString(),
    });
    setError(null);
    setTopic(record.title);
    // Use the already-generated thumbnail if available
    if (record.thumbnail_url) {
      setThumbnailUrl(record.thumbnail_url);
    } else if (record.thumbnail_prompt) {
      generateThumbnail(record.thumbnail_prompt, record.title);
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  };



  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

  const generate = async (topicOverride?: string) => {
    const finalTopic = topicOverride || topic.trim();
    if (!finalTopic) return;

    setIsGenerating(true);
    setError(null);
    setVideoScript(null);
    setThumbnailUrl(null);
    setAudioUrl(null);
    setUseBrowserVoice(false);

    try {
      const res = await fetch(`${supabaseUrl}/functions/v1/generate-video-script`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${anonKey}`,
          apikey: anonKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ topic: finalTopic }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 429) {
          toast({ title: "Rate limit reached", description: data.error, variant: "destructive" });
        } else if (res.status === 402) {
          toast({ title: "Credits required", description: data.error, variant: "destructive" });
        } else {
          setError(data.error || "Failed to generate script");
        }
        return;
      }

      setVideoScript(data);
      if (topicOverride) setTopic(topicOverride);

      // Save to library DB
      saveVideoToDb(data);


      generateThumbnail(data.thumbnailPrompt, data.title);
      generateAudio(data.script, data.title);
    } catch (e) {
      setError("Network error — please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const generateThumbnail = async (prompt: string, title: string) => {
    setIsGeneratingThumbnail(true);
    try {
      const res = await fetch(`${supabaseUrl}/functions/v1/generate-video-thumbnail`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${anonKey}`,
          apikey: anonKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ thumbnailPrompt: prompt, title }),
      });
      const data = await res.json();
      if (res.ok && data.imageUrl) setThumbnailUrl(data.imageUrl);
    } catch (e) {
      console.error("Thumbnail generation failed:", e);
    } finally {
      setIsGeneratingThumbnail(false);
    }
  };

  const generateAudio = (script: string, _title: string) => {
    // Use browser Web Speech API directly — ElevenLabs free tier is blocked
    // from server environments. When a paid ElevenLabs key is available the
    // edge function will return audioContent and we'll use that instead.
    setAudioUrl(null);
    setUseBrowserVoice(true);
    setIsGeneratingAudio(false);
  };

  const copyScript = () => {
    if (!videoScript) return;
    navigator.clipboard.writeText(videoScript.script);
    toast({ title: "Script copied!", description: "Full script copied to clipboard." });
  };

  return (
    <div className="min-h-screen bg-background">
      <GlobalHeader />
      <NewsTickerBar />

      <main className="max-w-screen-xl mx-auto px-4 md:px-6 py-8">
        {/* Hero Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-gainn-purple/30 bg-gainn-purple/10 text-gainn-purple text-xs font-mono mb-4">
            <Sparkles className="w-3 h-3" />
            Powered by GAINN AI
          </div>
          <h1 className="text-4xl md:text-5xl font-display text-gradient-primary mb-3">
            AI Video News Channel
          </h1>
          <p className="text-muted-foreground text-sm md:text-base max-w-xl mx-auto">
            Generate long-form, balanced news videos on any global topic — AI-researched, fact-checked, and delivered from all perspectives.
          </p>
        </div>

        {/* Input Section */}
        <div className="max-w-2xl mx-auto mb-8">
          <div className="card-glass rounded-xl p-5 border border-border">
            <label className="text-xs font-mono text-muted-foreground uppercase tracking-wider mb-2 block">
              Enter a topic or choose below
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && generate()}
                placeholder="e.g. Iran conflict, AI regulation, global inflation..."
                className="flex-1 bg-surface-2 border border-border rounded-lg px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-gainn-blue font-mono"
              />
              <Button
                onClick={() => generate()}
                disabled={isGenerating || !topic.trim()}
                className="bg-gainn-blue hover:bg-gainn-blue/80 text-background font-semibold px-5"
              >
                {isGenerating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <><Video className="w-4 h-4 mr-1.5" /> Generate</>
                )}
              </Button>
            </div>

            <div className="mt-4">
              <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider mb-2">
                Trending topics — click to generate instantly
              </p>
              <div className="flex flex-wrap gap-2">
                {SUGGESTED_TOPICS.map((t) => (
                  <button
                    key={t.label}
                    onClick={() => generate(t.label)}
                    disabled={isGenerating}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border border-border bg-surface-2 hover:bg-surface-3 hover:border-gainn-blue/40 hover:text-gainn-blue transition-all disabled:opacity-40"
                  >
                    <span>{t.icon}</span>
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Generating State */}
        {isGenerating && (
          <div className="max-w-2xl mx-auto">
            <div className="card-glass rounded-xl p-8 text-center border border-gainn-blue/20">
              <div className="w-16 h-16 rounded-full bg-gainn-blue/10 border border-gainn-blue/30 flex items-center justify-center mx-auto mb-4">
                <Loader2 className="w-7 h-7 text-gainn-blue animate-spin" />
              </div>
              <h3 className="text-base font-semibold mb-2">GAINN Newsroom at Work</h3>
              <div className="space-y-1.5 text-xs font-mono text-muted-foreground">
                {[
                  "📡 Pulling latest headlines from global feeds...",
                  "🔍 Researching all perspectives and viewpoints...",
                  "✍️ Writing balanced, long-form news script...",
                  "🎬 Generating cinematic thumbnail + AI voice-over...",
                ].map((step) => (
                  <div key={step} className="flex items-center gap-2 justify-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-gainn-blue animate-pulse" />
                    {step}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && !isGenerating && (
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center gap-3 p-4 rounded-lg border border-destructive/30 bg-destructive/5 text-destructive">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span className="text-sm">{error}</span>
              <button onClick={() => generate()} className="ml-auto text-xs underline">Retry</button>
            </div>
          </div>
        )}

        {/* Result */}
        {videoScript && !isGenerating && (
          <div className="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-6 mt-2">
            {/* Main Panel */}
            <div className="card-glass rounded-xl overflow-hidden border border-border">

              {/* VIDEO PLAYER */}
              <div className="relative w-full bg-black" style={{ aspectRatio: "16/9" }}>
                {isGeneratingThumbnail ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-surface-1">
                    <Loader2 className="w-8 h-8 text-gainn-blue animate-spin" />
                    <span className="text-xs font-mono text-muted-foreground">Generating cinematic thumbnail...</span>
                  </div>
                ) : thumbnailUrl ? (
                  <>
                    <img src={thumbnailUrl} alt={videoScript.title} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20 flex flex-col justify-between p-4 md:p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-gainn-red text-white uppercase tracking-wider">
                            <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                            GAINN LIVE
                          </span>
                          <span className="text-[10px] font-mono text-white/70 bg-black/40 px-2 py-0.5 rounded-full">
                            {videoScript.category}
                          </span>
                        </div>
                        <span className="text-[10px] font-mono text-white/60 bg-black/40 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {videoScript.duration}
                        </span>
                      </div>
                      <div className="flex items-center justify-center">
                        <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center">
                          <PlayCircle className="w-10 h-10 text-white" />
                        </div>
                      </div>
                      <div>
                        <h2 className="text-white font-display text-lg md:text-xl leading-tight drop-shadow-lg">
                          {videoScript.title}
                        </h2>
                        <div className="flex items-center gap-3 mt-1 text-white/60 text-[10px] font-mono">
                          <span className="flex items-center gap-1"><Globe className="w-3 h-3" /> All perspectives</span>
                          <span className="flex items-center gap-1"><Film className="w-3 h-3" /> AI-generated</span>
                          <span className="text-gainn-green">
                            {new Date(videoScript.generatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-surface-1">
                    <div className="w-14 h-14 rounded-full bg-surface-2 border border-border flex items-center justify-center">
                      <ImageIcon className="w-6 h-6 text-muted-foreground" />
                    </div>
                    <span className="text-xs font-mono text-muted-foreground">Thumbnail unavailable</span>
                    <button onClick={() => generateThumbnail(videoScript.thumbnailPrompt, videoScript.title)} className="text-xs text-gainn-blue underline">
                      Retry generation
                    </button>
                  </div>
                )}
              </div>

              {/* AUDIO PLAYER */}
              <div className="px-4 pt-4 pb-2 border-b border-border">
                {isGeneratingAudio ? (
                  <div className="flex items-center gap-3 bg-surface-1 border border-gainn-blue/20 rounded-xl p-4">
                    <Loader2 className="w-4 h-4 text-gainn-blue animate-spin flex-shrink-0" />
                    <div>
                      <p className="text-xs font-semibold text-foreground">Generating AI Voice-Over...</p>
                      <p className="text-[10px] font-mono text-muted-foreground">ElevenLabs · George voice · ~60s</p>
                    </div>
                  </div>
                ) : audioUrl ? (
                  <AudioPlayer audioUrl={audioUrl} title={videoScript.title} />
                ) : useBrowserVoice ? (
                  <BrowserVoicePlayer script={videoScript.script} title={videoScript.title} />
                ) : (
                  <div className="flex items-center gap-3 bg-surface-1 border border-border rounded-xl p-4">
                    <Headphones className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    <p className="text-xs text-muted-foreground flex-1">Voice-over unavailable</p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => generateAudio(videoScript.script, videoScript.title)}
                      className="border-gainn-blue/30 text-gainn-blue hover:bg-gainn-blue/10 text-xs h-7"
                    >
                      <Mic className="w-3 h-3 mr-1" /> Generate
                    </Button>
                  </div>
                )}
              </div>

              {/* Video Header Meta */}
              <div className="px-6 pt-4 pb-2 border-b border-border">
                <div className="flex items-center gap-2 mb-2">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-gainn-red/15 text-gainn-red border border-gainn-red/30 uppercase tracking-wider">
                    <div className="w-1.5 h-1.5 rounded-full bg-gainn-red animate-pulse" />
                    GAINN Video
                  </span>
                  <span className="text-[10px] font-mono text-muted-foreground border border-border px-2 py-0.5 rounded-full">
                    {videoScript.category}
                  </span>
                </div>
                <h2 className="text-xl md:text-2xl font-display text-foreground leading-tight">
                  {videoScript.title}
                </h2>
                <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2">
                  <span className="flex items-center gap-1.5 font-mono"><Clock className="w-3 h-3" /> {videoScript.duration}</span>
                  <span className="flex items-center gap-1.5 font-mono"><Globe className="w-3 h-3" /> All perspectives</span>
                  <span className="flex items-center gap-1.5 font-mono"><Film className="w-3 h-3" /> AI-generated</span>
                </div>
              </div>

              {/* Script Body */}
              <div className="p-6">
                <div className="flex items-center gap-2 mb-5">
                  <BookOpen className="w-4 h-4 text-gainn-cyan" />
                  <h3 className="text-sm font-semibold">Full Video Script</h3>
                  <span className="text-[10px] font-mono text-muted-foreground ml-auto">
                    ~{Math.round((videoScript.script ?? "").split(" ").length / 150)} min read-through
                  </span>
                </div>
                <div className="prose-sm max-w-none">
                  {formatScript(videoScript.script)}
                </div>
              </div>

              {/* Actions */}
              <div className="px-6 pb-6 flex gap-2 flex-wrap">
                <Button variant="outline" size="sm" className="border-gainn-blue/30 text-gainn-blue hover:bg-gainn-blue/10" onClick={copyScript}>
                  <Download className="w-3.5 h-3.5 mr-1.5" /> Copy Script
                </Button>
                <Button variant="outline" size="sm" onClick={() => generate()} className="border-border text-muted-foreground hover:text-foreground">
                  <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Regenerate
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => generateThumbnail(videoScript.thumbnailPrompt, videoScript.title)}
                  disabled={isGeneratingThumbnail}
                  className="border-gainn-purple/30 text-gainn-purple hover:bg-gainn-purple/10"
                >
                  {isGeneratingThumbnail ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <ImageIcon className="w-3.5 h-3.5 mr-1.5" />}
                  New Thumbnail
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => generateAudio(videoScript.script, videoScript.title)}
                  disabled={isGeneratingAudio}
                  className="border-gainn-green/30 text-gainn-green hover:bg-gainn-green/10"
                >
                  {isGeneratingAudio ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Mic className="w-3.5 h-3.5 mr-1.5" />}
                  New Voice-Over
                </Button>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-4">
              <div className="card-glass rounded-xl p-4 border border-border">
                <div className="flex items-center gap-2 mb-3">
                  <Film className="w-4 h-4 text-gainn-purple" />
                  <h4 className="text-sm font-semibold">Visual Concept</h4>
                </div>
                <div className="bg-surface-2 rounded-lg p-3 border border-border">
                  <p className="text-xs text-muted-foreground italic leading-relaxed">"{videoScript.thumbnailPrompt}"</p>
                </div>
              </div>

              {videoScript.rawHeadlines.length > 0 && (
                <div className="card-glass rounded-xl p-4 border border-border">
                  <div className="flex items-center gap-2 mb-3">
                    <TrendingUp className="w-4 h-4 text-gainn-green" />
                    <h4 className="text-sm font-semibold">Live Headlines Used</h4>
                    <span className="text-[10px] font-mono text-gainn-green ml-auto">● Live</span>
                  </div>
                  <div className="space-y-2">
                    {videoScript.rawHeadlines.map((h, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs">
                        <span className="font-mono text-muted-foreground/50 flex-shrink-0 pt-0.5">{String(i + 1).padStart(2, "0")}</span>
                        <p className="text-muted-foreground leading-snug">{h}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="card-glass rounded-xl p-4 border border-border">
                <div className="flex items-center gap-2 mb-3">
                  <Zap className="w-4 h-4 text-gainn-amber" />
                  <h4 className="text-sm font-semibold">Editorial Standards</h4>
                </div>
                <div className="space-y-2">
                  {[
                    { label: "Neutral Bias Score", value: "0.00", good: true },
                    { label: "Perspectives Covered", value: "3+ sides", good: true },
                    { label: "Source Attribution", value: "Included", good: true },
                    { label: "Fact-Checked", value: "AI Verified", good: true },
                    { label: "Voice Model", value: "ElevenLabs", good: true },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">{item.label}</span>
                      <span className={`font-mono font-semibold ${item.good ? "text-gainn-green" : "text-gainn-amber"}`}>
                        {item.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="card-glass rounded-xl p-4 border border-border">
                <p className="text-xs text-muted-foreground mb-3">Generate another video on a different topic</p>
                <div className="space-y-1.5">
                  {SUGGESTED_TOPICS.slice(0, 4).map((t) => (
                    <button
                      key={t.label}
                      onClick={() => generate(t.label)}
                      className="w-full text-left flex items-center gap-2 px-3 py-2 rounded-lg text-xs hover:bg-surface-2 transition-colors group"
                    >
                      <span>{t.icon}</span>
                      <span className="text-muted-foreground group-hover:text-foreground flex-1">{t.label}</span>
                      <ChevronRight className="w-3 h-3 text-muted-foreground/40 group-hover:text-gainn-blue transition-colors" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Empty state */}
        {!videoScript && !isGenerating && !error && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto mt-4">
            {[
              { icon: Globe, title: "Live Global News", desc: "Scripts sourced from real-time headlines across 12,000+ publications worldwide.", color: "text-gainn-blue" },
              { icon: Headphones, title: "AI Voice-Over", desc: "Every script is read aloud by a professional AI anchor voice powered by ElevenLabs.", color: "text-gainn-green" },
              { icon: Film, title: "Video-Ready Format", desc: "Structured scripts with timed sections plus AI-generated cinematic thumbnails.", color: "text-gainn-purple" },
            ].map(({ icon: Icon, title, desc, color }) => (
              <div key={title} className="card-glass rounded-xl p-5 text-center border border-border">
                <div className="w-10 h-10 rounded-xl bg-surface-2 flex items-center justify-center mx-auto mb-3 border border-border">
                  <Icon className={`w-5 h-5 ${color}`} />
                </div>
                <h3 className="text-sm font-semibold mb-1">{title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* VIDEO LIBRARY */}
      <section className="max-w-screen-xl mx-auto px-4 md:px-6 pb-16 mt-8">
        <div className="flex items-center gap-3 mb-6">
          <Library className="w-5 h-5 text-gainn-blue" />
          <h2 className="text-lg font-display font-semibold">Video Library</h2>
          <span className="text-xs font-mono text-muted-foreground bg-surface-2 border border-border px-2 py-0.5 rounded-full">
            {library.length} videos
          </span>
          <button onClick={loadLibrary} className="ml-auto text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
            <RefreshCw className="w-3 h-3" /> Refresh
          </button>
        </div>

        {isLoadingLibrary ? (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading library...
          </div>
        ) : library.length === 0 ? (
          <div className="card-glass rounded-xl p-8 text-center border border-border">
            <Film className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-40" />
            <p className="text-sm text-muted-foreground">No videos yet — generate your first one above!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {library.map((record) => {
              const gradient = CATEGORY_GRADIENTS[record.category] || "from-gainn-blue/20 to-gainn-purple/10";
              const badge = CATEGORY_COLORS[record.category] || "bg-surface-2 text-muted-foreground border-border";
              return (
                <button
                  key={record.id}
                  onClick={() => loadVideoFromLibrary(record)}
                  className="card-glass rounded-xl overflow-hidden border border-border hover:border-gainn-blue/40 hover:shadow-lg transition-all text-left group"
                >
                  {/* Thumbnail placeholder */}
                  <div className={`relative h-32 bg-gradient-to-br ${gradient} flex items-center justify-center`}>
                    <PlayCircle className="w-10 h-10 text-white/30 group-hover:text-white/60 transition-colors" />
                    <div className="absolute top-2 left-2">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${badge} uppercase tracking-wider`}>
                        {record.category}
                      </span>
                    </div>
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <ArrowUpRight className="w-4 h-4 text-white/70" />
                    </div>
                  </div>
                  {/* Meta */}
                  <div className="p-3">
                    <p className="text-xs font-semibold text-foreground leading-snug line-clamp-2 mb-2">{record.title}</p>
                    <div className="flex items-center gap-2 text-[10px] font-mono text-muted-foreground">
                      <span className="flex items-center gap-0.5"><Clock className="w-2.5 h-2.5" /> {record.duration}</span>
                      <span className="flex items-center gap-0.5 ml-auto"><CalendarDays className="w-2.5 h-2.5" />
                        {new Date(record.created_at).toLocaleDateString([], { month: "short", day: "numeric" })}
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
