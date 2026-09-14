import { useState } from "react";
import { Article } from "@/data/mockData";
import { Eye, AlertTriangle } from "lucide-react";

type Perspective = "agreement" | "differences";

const TABS: { id: Perspective; label: string; icon: React.ElementType; color: string }[] = [
  { id: "agreement", label: "Agreed", icon: Eye, color: "text-gainn-cyan border-gainn-cyan" },
  { id: "differences", label: "Differences", icon: AlertTriangle, color: "text-gainn-amber border-gainn-amber" },
];

// Generate perspective summaries from article data
function getPerspective(article: Article, perspective: Perspective): string {
  if (perspective === "agreement") return article.verification?.agreement.core_claim || "No independently corroborated claim is recorded yet.";
  return article.verification?.disagreements.map((item) => item.point).join(" ") || "No sourced disagreements are recorded.";
}

export const MultiPerspectiveTabs = ({ article }: { article: Article }) => {
  const [active, setActive] = useState<Perspective>("agreement");

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
