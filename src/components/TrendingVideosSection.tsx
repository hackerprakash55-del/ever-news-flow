import { useEffect, useState, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNews } from "@/hooks/useNews";
import { Play, Pause, Loader2, Film, ArrowUpRight, Sparkles, Eye, Radio } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { tuneUtterance, waitForVoices } from "@/lib/voice";
import { VideoModal, type VideoModalSource } from "@/components/VideoModal";
import { getVideoGradient } from "@/lib/videoVisuals";

interface VideoRecord {
  id: string;
  title: string;
  category: string;
  duration: string;
  script: string;
  thumbnail_prompt: string;
  raw_headlines: any;
  generated_at: string;
  created_at: string;
}

const CATEGORY_COLORS: Record<string, string> = {
  "AI": "text-gainn-purple border-gainn-purple/40 bg-gainn-purple/10",
  "Technology": "text-gainn-blue border-gainn-blue/40 bg-gainn-blue/10",
  "Economy": "text-gainn-green border-gainn-green/40 bg-gainn-green/10",
  "Politics": "text-gainn-red border-gainn-red/40 bg-gainn-red/10",
  "Environment": "text-gainn-green border-gainn-green/40 bg-gainn-green/10",
  "Science": "text-gainn-cyan border-gainn-cyan/40 bg-gainn-cyan/10",
  "Health": "text-gainn-amber border-gainn-amber/40 bg-gainn-amber/10",
  "Global Affairs": "text-gainn-blue border-gainn-blue/40 bg-gainn-blue/10",
  "General": "text-muted-foreground border-border bg-surface-2",
};

const CATEGORY_ICON: Record<string, string> = {
  "AI": "🤖", "Technology": "💻", "Economy": "📈", "Politics": "🏛️",
  "Environment": "🌿", "Science": "🔬", "Health": "🏥", "Global Affairs": "🌍", "General": "📰",
};

function MiniVoicePlayer({ script }: { script: string }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const uttRef = useRef<SpeechSynthesisUtterance | null>(null);

  const cleanText = script
    .replace(/\*\*[A-Z\s]+\*\*/g, "")
    .replace(/#{1,3}\s+\w+/g, "")
    .replace(/\*\*/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
    .slice(0, 5000);

  const toggle = useCallback(async () => {
    if (isPlaying) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
    } else {
      window.speechSynthesis.cancel();
      await waitForVoices();
      const utter = new SpeechSynthesisUtterance(cleanText);
      tuneUtterance(utter);
      utter.onend = () => setIsPlaying(false);
      utter.onerror = () => setIsPlaying(false);
      uttRef.current = utter;
      window.speechSynthesis.speak(utter);
      setIsPlaying(true);
    }
  }, [isPlaying, cleanText]);

  useEffect(() => () => { window.speechSynthesis.cancel(); }, []);

  return (
    <button
      onClick={e => { e.stopPropagation(); toggle(); }}
      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
        isPlaying
          ? "bg-gainn-green/20 text-gainn-green border border-gainn-green/40"
          : "bg-gainn-blue/15 text-gainn-blue border border-gainn-blue/30 hover:bg-gainn-blue/25"
      }`}
    >
      {isPlaying ? (
        <>
          <Pause className="w-3 h-3" />
          <span>Pause</span>
          <div className="flex items-end gap-0.5 ml-1">
            {[3,5,4,6,3].map((h,i) => (
              <div key={i} className="w-0.5 rounded-full bg-gainn-green animate-pulse"
                style={{ height: `${h}px`, animationDelay: `${i*0.08}s` }} />
            ))}
          </div>
        </>
      ) : (
        <>
          <Play className="w-3 h-3" />
          <span>Play</span>
        </>
      )}
    </button>
  );
}

async function autoGenerateScript(topic: string): Promise<VideoRecord | null> {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  if (!supabaseUrl || !anonKey) return null;
  try {
    const res = await fetch(`${supabaseUrl}/functions/v1/generate-video-script`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${anonKey}`,
        apikey: anonKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ topic }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (!data.script) return null;

    const { data: inserted } = await supabase.from("generated_videos").insert({
      title: data.title || topic,
      category: data.category || "General",
      duration: data.duration || "5-7 min",
      script: data.script,
      thumbnail_prompt: data.thumbnailPrompt || "",
      raw_headlines: data.rawHeadlines || [],
      generated_at: data.generatedAt || new Date().toISOString(),
    }).select().single();

    return inserted as VideoRecord;
  } catch {
    return null;
  }
}

// Deterministic view count from video id
function getViewCount(id: string): string {
  const n = id.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const views = (n % 90 + 10) * 100 + (n % 47) * 10;
  return views >= 1000 ? `${(views / 1000).toFixed(1)}K` : String(views);
}

export function TrendingVideosSection() {
  const navigate = useNavigate();
  const { articles, isLoading: newsLoading } = useNews({ pageSize: 10 });
  const [videos, setVideos] = useState<VideoRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAutoGenerating, setIsAutoGenerating] = useState(false);
  const autoGenStarted = useRef(false);
  const [activeVideo, setActiveVideo] = useState<VideoModalSource | null>(null);

  const trendingTopics = articles
    .slice(0, 4)
    .map(a => a.headline.replace(/ - [^-]+$/, "").slice(0, 80));

  useEffect(() => { loadVideos(); }, []);

  const loadVideos = async () => {
    setIsLoading(true);
    try {
      const { data } = await supabase
        .from("generated_videos")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(3);
      if (data) setVideos(data as VideoRecord[]);
    } finally {
      setIsLoading(false);
    }
  };

  const generateTrendingVideos = async (topics: string[]) => {
    if (topics.length === 0) return;
    setIsAutoGenerating(true);
    const results = await Promise.all(
      topics.slice(0, 2).map(topic => autoGenerateScript(topic))
    );
    const newVideos = results.filter(Boolean) as VideoRecord[];
    if (newVideos.length > 0) {
      setVideos(prev => [...newVideos, ...prev].slice(0, 3));
    }
    setIsAutoGenerating(false);
  };

  useEffect(() => {
    if (!isLoading && !newsLoading && videos.length === 0 && trendingTopics.length > 0 && !autoGenStarted.current) {
      autoGenStarted.current = true;
      generateTrendingVideos(trendingTopics);
    }
  }, [isLoading, newsLoading, videos.length, trendingTopics.length]);

  const handleVideoClick = (video: VideoRecord) => {
    setActiveVideo({
      title: video.title,
      category: video.category,
      script: video.script,
      poster: null,
    });
  };

  if (isLoading) {
    return (
      <div>
        <VideoSectionHeader generating={false} />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="card-glass rounded-xl h-56 shimmer-bg" />
          ))}
        </div>
      </div>
    );
  }

  if (isAutoGenerating && videos.length === 0) {
    return (
      <div>
        <VideoSectionHeader generating={true} />
        <div className="card-glass rounded-xl p-8 flex flex-col items-center gap-3 text-center">
          <Loader2 className="w-8 h-8 text-gainn-blue animate-spin" />
          <p className="text-sm font-medium">Generating AI video reports for today's top stories…</p>
          <p className="text-xs text-muted-foreground font-mono">This takes about 15 seconds per video</p>
        </div>
      </div>
    );
  }

  if (videos.length === 0) {
    return (
      <div>
        <VideoSectionHeader generating={false} />
        <div className="card-glass rounded-xl p-6 flex flex-col items-center gap-3 text-center border border-dashed border-border">
          <Film className="w-8 h-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">No videos yet. Visit the AI Video Studio to generate your first report.</p>
          <button onClick={() => navigate("/video")}
            className="px-4 py-2 rounded-lg bg-gainn-blue text-background text-xs font-semibold hover:bg-gainn-blue/80 transition-colors">
            Open AI Video Studio
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <VideoSectionHeader generating={isAutoGenerating} onRefresh={() => generateTrendingVideos(trendingTopics)} />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {videos.slice(0, 3).map((video, idx) => (
          <VideoCard key={video.id} video={video} isNewest={idx === 0} onClick={() => handleVideoClick(video)} />
        ))}
      </div>
      <div className="mt-4 flex items-center justify-between">
        <button
          onClick={() => navigate("/video")}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-colors bg-gainn-red/15 text-gainn-red border border-gainn-red/30 hover:bg-gainn-red/25"
        >
          <Radio className="w-3.5 h-3.5" /> Watch Live Broadcast →
        </button>
        <button onClick={() => navigate("/videos")}
          className="inline-flex items-center gap-1.5 text-xs font-mono text-gainn-blue hover:text-gainn-cyan transition-colors">
          View All Videos → <ArrowUpRight className="w-3 h-3" />
        </button>
      </div>
      <VideoModal open={!!activeVideo} video={activeVideo} onClose={() => setActiveVideo(null)} />
    </div>
  );
}

function VideoSectionHeader({ generating, onRefresh }: { generating: boolean; onRefresh?: () => void }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2">
        <span className="text-base">📺</span>
        <h2 className="text-sm font-semibold uppercase tracking-wider font-mono">AI Video Reports — Watch Now</h2>
        {generating && (
          <span className="flex items-center gap-1 text-[10px] font-mono text-gainn-amber px-2 py-0.5 rounded-full border border-gainn-amber/30 bg-gainn-amber/10">
            <Loader2 className="w-2.5 h-2.5 animate-spin" /> Generating…
          </span>
        )}
      </div>
      <div className="flex items-center gap-2">
        <span className="flex items-center gap-1 text-[10px] font-mono text-gainn-red px-2 py-0.5 rounded-full border border-gainn-red/30 bg-gainn-red/10">
          <span className="w-1.5 h-1.5 rounded-full bg-gainn-red live-dot" /> LIVE
        </span>
        {onRefresh && (
          <button onClick={onRefresh}
            className="flex items-center gap-1 text-[10px] font-mono text-gainn-blue hover:text-gainn-cyan transition-colors">
            <Sparkles className="w-3 h-3" /> Generate New
          </button>
        )}
      </div>
    </div>
  );
}

function VideoCard({ video, isNewest, onClick }: { video: VideoRecord; isNewest: boolean; onClick: () => void }) {
  const colorClass = CATEGORY_COLORS[video.category] || CATEGORY_COLORS["General"];
  const icon = CATEGORY_ICON[video.category] || "📰";
  const gradient = getVideoGradient(video.category);
  const timeAgo = getTimeAgo(video.created_at);
  const views = getViewCount(video.id);

  return (
    <div
      onClick={onClick}
      className="card-glass rounded-xl overflow-hidden hover:border-gainn-blue/40 transition-all cursor-pointer group"
    >
      {/* Cinematic thumbnail */}
      <div className="relative h-44 overflow-hidden">
        {/* Ken Burns animated gradient layer */}
        <div className="absolute inset-0 animate-ken-burns will-change-transform" style={{ background: gradient }} />

        {/* Soft radial highlight */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.18),transparent_55%)]" />

        {/* Decorative icon */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-7xl opacity-15 select-none group-hover:opacity-25 transition-opacity duration-500">{icon}</div>
        </div>

        {/* Film grain */}
        <div className="absolute inset-0 film-grain opacity-40 pointer-events-none" />

        {/* Bottom vignette */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent" />

        {/* Hover shimmer */}
        <div className="absolute inset-0 overflow-hidden opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-[1600ms] ease-out" />
        </div>

        {/* Premium play button with pulsing ring */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative">
            <span className="absolute inset-0 rounded-full bg-white/40 animate-ring-pulse" />
            <span className="absolute inset-0 rounded-full bg-white/30 animate-ring-pulse" style={{ animationDelay: "0.8s" }} />
            <div className="relative w-16 h-16 rounded-full bg-white/95 flex items-center justify-center shadow-[0_8px_30px_rgba(0,0,0,0.5)] group-hover:scale-110 transition-transform duration-300">
              <Play className="w-6 h-6 text-black ml-1" fill="black" />
            </div>
          </div>
        </div>

        {/* LIVE badge on newest */}
        {isNewest && (
          <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-0.5 rounded bg-gainn-red text-white text-[9px] font-bold font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-white live-dot" />
            🔴 LIVE
          </div>
        )}

        {/* Category badge */}
        {!isNewest && (
          <div className="absolute top-2 left-2">
            <span className={`text-[9px] font-bold font-mono px-2 py-0.5 rounded border ${colorClass}`}>
              {video.category.toUpperCase()}
            </span>
          </div>
        )}

        {/* View count top-right */}
        <div className="absolute top-2 right-2 flex items-center gap-1 text-[10px] font-mono text-white/80 bg-black/40 px-1.5 py-0.5 rounded backdrop-blur-sm">
          <Eye className="w-3 h-3" /> {views}
        </div>

        {/* Duration bottom-right */}
        <div className="absolute bottom-2 right-2 text-[10px] font-mono text-white/90 bg-black/50 px-1.5 py-0.5 rounded backdrop-blur-sm">
          {video.duration}
        </div>
      </div>

      {/* Content */}
      <div className="p-3 space-y-2">
        <h3 className="text-xs font-semibold text-foreground line-clamp-2 leading-snug group-hover:text-gainn-cyan transition-colors">
          {video.title}
        </h3>
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono text-muted-foreground">{timeAgo}</span>
          <button
            onClick={(e) => { e.stopPropagation(); onClick(); }}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all bg-gainn-blue/15 text-gainn-blue border border-gainn-blue/30 hover:bg-gainn-blue/25"
          >
            <Play className="w-3 h-3" />
            <span>Play</span>
          </button>
        </div>
      </div>
    </div>
  );
}

function getTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}
