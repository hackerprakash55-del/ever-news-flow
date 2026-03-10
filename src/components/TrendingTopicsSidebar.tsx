import { TrendingUp, Hash } from "lucide-react";
import { useNavigate } from "react-router-dom";

const TRENDING_TOPICS = [
  { tag: "AI Governance", count: 847, hot: true },
  { tag: "Quantum Computing", count: 623 },
  { tag: "Climate Crisis", count: 591, hot: true },
  { tag: "Mars Discovery", count: 482 },
  { tag: "Digital Currency", count: 441 },
  { tag: "Cancer Vaccine", count: 398 },
  { tag: "NATO", count: 312 },
  { tag: "Space Exploration", count: 289 },
  { tag: "Cybersecurity", count: 251 },
  { tag: "Renewable Energy", count: 234 },
  { tag: "mRNA Technology", count: 198 },
  { tag: "Geopolitics", count: 187 },
];

export const TrendingTopicsSidebar = ({ onTagClick }: { onTagClick?: (tag: string) => void }) => {
  const navigate = useNavigate();

  function handleClick(tag: string) {
    if (onTagClick) {
      onTagClick(tag);
    } else {
      navigate(`/?q=${encodeURIComponent(tag)}`);
    }
  }

  return (
    <div className="card-glass rounded-lg overflow-hidden">
      <div className="px-4 py-3 border-b border-border flex items-center gap-2">
        <TrendingUp className="w-3.5 h-3.5 text-gainn-green" />
        <span className="text-sm font-semibold">Trending Topics</span>
        <span className="ml-auto text-[10px] font-mono text-gainn-green animate-live-pulse">● Live</span>
      </div>
      <div className="p-4 flex flex-wrap gap-2">
        {TRENDING_TOPICS.map((t) => (
          <button
            key={t.tag}
            onClick={() => handleClick(t.tag)}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-medium border transition-all hover:scale-105 ${
              t.hot
                ? "border-gainn-red/30 bg-gainn-red/10 text-gainn-red hover:bg-gainn-red/20"
                : "border-border bg-surface-2 text-muted-foreground hover:border-accent/30 hover:text-accent hover:bg-accent/10"
            }`}
          >
            <Hash className="w-2.5 h-2.5" />
            {t.tag}
            <span className="text-[9px] opacity-60 font-mono ml-0.5">{t.count}</span>
          </button>
        ))}
      </div>
    </div>
  );
};
