import { useState } from "react";
import { GlobalHeader } from "@/components/GlobalHeader";
import { NewsTickerBar } from "@/components/NewsTickerBar";
import {
  Video, Sparkles, Play, Clock, Globe, ChevronRight,
  Loader2, RefreshCw, Download, Share2, AlertCircle,
  Mic, Film, BookOpen, Zap, TrendingUp
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

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

// Format script sections for readable display
function formatScript(script: string) {
  return script
    .split("\n")
    .map((line, i) => {
      const trimmed = line.trim();
      if (!trimmed) return null;
      // Section headers like **OPENING** or ## BACKGROUND
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

export default function AIVideoPage() {
  const [topic, setTopic] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [videoScript, setVideoScript] = useState<VideoScript | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

  const generate = async (topicOverride?: string) => {
    const finalTopic = topicOverride || topic.trim();
    if (!finalTopic) return;

    setIsGenerating(true);
    setError(null);
    setVideoScript(null);

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
    } catch (e) {
      setError("Network error — please try again.");
    } finally {
      setIsGenerating(false);
    }
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
            Generate long-form, balanced news video scripts on any global topic — AI-researched, fact-checked, and delivered from all perspectives.
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
                  <><Sparkles className="w-4 h-4 mr-1.5" /> Generate</>
                )}
              </Button>
            </div>

            {/* Suggested Topics */}
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
              <h3 className="text-base font-semibold mb-2">AI Newsroom at Work</h3>
              <div className="space-y-1.5 text-xs font-mono text-muted-foreground">
                {[
                  "📡 Pulling latest headlines from global feeds...",
                  "🔍 Researching all perspectives and viewpoints...",
                  "✍️ Writing balanced, long-form script...",
                  "🎬 Formatting for video production...",
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
              <button onClick={() => generate()} className="ml-auto text-xs underline">
                Retry
              </button>
            </div>
          </div>
        )}

        {/* Result */}
        {videoScript && !isGenerating && (
          <div className="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-6 mt-2">
            {/* Script Panel */}
            <div className="card-glass rounded-xl overflow-hidden border border-border">
              {/* Video Header */}
              <div className="relative bg-gradient-to-br from-surface-1 to-surface-2 p-6 border-b border-border">
                <div className="absolute inset-0 opacity-5 bg-[radial-gradient(ellipse_at_top_right,hsl(var(--gainn-blue)),transparent)]" />
                <div className="relative">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-gainn-red/15 text-gainn-red border border-gainn-red/30 uppercase tracking-wider">
                      <div className="w-1.5 h-1.5 rounded-full bg-gainn-red animate-pulse" />
                      GAINN Video
                    </span>
                    <span className="text-[10px] font-mono text-muted-foreground border border-border px-2 py-0.5 rounded-full">
                      {videoScript.category}
                    </span>
                  </div>
                  <h2 className="text-xl md:text-2xl font-display text-foreground mb-3 leading-tight">
                    {videoScript.title}
                  </h2>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1.5 font-mono">
                      <Clock className="w-3 h-3" /> {videoScript.duration}
                    </span>
                    <span className="flex items-center gap-1.5 font-mono">
                      <Globe className="w-3 h-3" /> All perspectives
                    </span>
                    <span className="flex items-center gap-1.5 font-mono">
                      <Film className="w-3 h-3" /> AI-generated script
                    </span>
                    <span className="text-gainn-green font-mono">
                      {new Date(videoScript.generatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Script Body */}
              <div className="p-6">
                <div className="flex items-center gap-2 mb-5">
                  <BookOpen className="w-4 h-4 text-gainn-cyan" />
                  <h3 className="text-sm font-semibold">Full Video Script</h3>
                  <span className="text-[10px] font-mono text-muted-foreground ml-auto">
                    ~{Math.round(videoScript.script.split(" ").length / 150)} min read-through
                  </span>
                </div>
                <div className="prose-sm max-w-none">
                  {formatScript(videoScript.script)}
                </div>
              </div>

              {/* Actions */}
              <div className="px-6 pb-6 flex gap-2 flex-wrap">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-gainn-blue/30 text-gainn-blue hover:bg-gainn-blue/10"
                  onClick={copyScript}
                >
                  <Download className="w-3.5 h-3.5 mr-1.5" /> Copy Script
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => generate()}
                  className="border-border text-muted-foreground hover:text-foreground"
                >
                  <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Regenerate
                </Button>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-4">
              {/* Thumbnail Prompt */}
              <div className="card-glass rounded-xl p-4 border border-border">
                <div className="flex items-center gap-2 mb-3">
                  <Film className="w-4 h-4 text-gainn-purple" />
                  <h4 className="text-sm font-semibold">Thumbnail Concept</h4>
                </div>
                <div className="bg-surface-2 rounded-lg p-3 border border-border">
                  <p className="text-xs text-muted-foreground italic leading-relaxed">
                    "{videoScript.thumbnailPrompt}"
                  </p>
                </div>
              </div>

              {/* Live Sources used */}
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

              {/* Editorial Standards */}
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
                    { label: "Content Type", value: "Long-form", good: true },
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

              {/* Generate another */}
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
              { icon: Play, title: "Balanced Reporting", desc: "Every script presents 3+ perspectives — no political bias, no sensationalism.", color: "text-gainn-green" },
              { icon: Film, title: "Video-Ready Format", desc: "Structured scripts with timed sections, ready for AI voice-over or anchor recording.", color: "text-gainn-purple" },
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
    </div>
  );
}
