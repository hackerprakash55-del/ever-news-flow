import { useState } from "react";
import { Article } from "@/data/mockData";
import { Eye, ThumbsUp, AlertTriangle } from "lucide-react";

type Perspective = "neutral" | "optimistic" | "critical";

const TABS: { id: Perspective; label: string; icon: React.ElementType; color: string }[] = [
  { id: "neutral", label: "Neutral", icon: Eye, color: "text-gainn-cyan border-gainn-cyan" },
  { id: "optimistic", label: "Optimistic", icon: ThumbsUp, color: "text-gainn-green border-gainn-green" },
  { id: "critical", label: "Critical", icon: AlertTriangle, color: "text-gainn-amber border-gainn-amber" },
];

// Generate perspective summaries from article data
function getPerspective(article: Article, perspective: Perspective): string {
  const base = article.summary;
  switch (perspective) {
    case "neutral":
      return base;
    case "optimistic":
      return `This development signals significant positive momentum. ${base} Experts suggest this could lead to substantial improvements in the field, with long-term benefits for global stakeholders and potential breakthroughs in related areas.`;
    case "critical":
      return `While noteworthy, critical analysis reveals potential concerns. ${base} Skeptics point to unresolved challenges, implementation risks, and the possibility that outcomes may not meet expectations without significant additional effort and oversight.`;
  }
}

export const MultiPerspectiveTabs = ({ article }: { article: Article }) => {
  const [active, setActive] = useState<Perspective>("neutral");

  return (
    <div className="mt-3">
      <div className="flex gap-1 mb-2">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = active === tab.id;
          return (
            <button
              key={tab.id}
              onClick={(e) => { e.stopPropagation(); setActive(tab.id); }}
              className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] font-mono border transition-all ${
                isActive
                  ? `${tab.color} bg-surface-2 border-current`
                  : "text-muted-foreground border-transparent hover:border-border hover:bg-surface-2"
              }`}
            >
              <Icon className="w-2.5 h-2.5" />
              {tab.label}
            </button>
          );
        })}
      </div>
      <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-3">
        {getPerspective(article, active)}
      </p>
    </div>
  );
};
