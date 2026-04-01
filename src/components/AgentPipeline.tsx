import { useEffect, useState, useRef } from "react";
import { Rss, ShieldCheck, FileText, Send, CheckCircle, Loader2 } from "lucide-react";

type StepStatus = "waiting" | "processing" | "complete";

interface PipelineStep {
  id: number;
  icon: React.ElementType;
  title: string;
  subtitle: string;
  detail: string;
  color: string;
}

const STEPS: PipelineStep[] = [
  { id: 1, icon: Rss, title: "Data Ingestion", subtitle: "Monitor Agent", detail: "Scanning 12,891 sources — RSS, APIs, social feeds", color: "text-gainn-blue" },
  { id: 2, icon: ShieldCheck, title: "Verification", subtitle: "Verifier Agent", detail: "Cross-checking 4 primary sources — credibility: 97%", color: "text-gainn-amber" },
  { id: 3, icon: FileText, title: "Generation", subtitle: "Reporter Agent", detail: "Composing structured article with key points", color: "text-gainn-green" },
  { id: 4, icon: Send, title: "Distribution", subtitle: "Publisher Agent", detail: "Publishing to feed across 5 platforms", color: "text-gainn-purple" },
];

const CYCLE_MS = 3000;

export const AgentPipeline = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [statuses, setStatuses] = useState<StepStatus[]>(["processing", "waiting", "waiting", "waiting"]);
  const cycleCount = useRef(0);

  useEffect(() => {
    const iv = setInterval(() => {
      setActiveStep((prev) => {
        const next = (prev + 1) % (STEPS.length + 1);
        setStatuses(
          STEPS.map((_, i) => {
            if (next > STEPS.length - 1) return "complete"; // all done briefly
            if (i < next) return "complete";
            if (i === next) return "processing";
            return "waiting";
          })
        );
        // Reset cycle after showing all complete
        if (next === STEPS.length) {
          cycleCount.current++;
          setTimeout(() => {
            setStatuses(["processing", "waiting", "waiting", "waiting"]);
            setActiveStep(0);
          }, 1500);
        }
        return next;
      });
    }, CYCLE_MS);
    return () => clearInterval(iv);
  }, []);

  return (
    <div className="card-glass rounded-lg overflow-hidden">
      <div className="px-4 py-3 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-gainn-green live-dot" />
          <span className="text-sm font-semibold">AI Agent Pipeline</span>
          <span className="text-[10px] font-mono text-muted-foreground">— real-time processing</span>
        </div>
        <span className="text-[10px] font-mono text-gainn-green">
          {cycleCount.current > 0 ? `${cycleCount.current} articles processed` : "Processing…"}
        </span>
      </div>

      <div className="p-4">
        {/* Pipeline steps */}
        <div className="flex items-start gap-0">
          {STEPS.map((step, i) => {
            const Icon = step.icon;
            const status = statuses[i];

            return (
              <div key={step.id} className="flex-1 relative">
                {/* Connector line */}
                {i < STEPS.length - 1 && (
                  <div className="absolute top-5 left-[calc(50%+20px)] right-0 h-0.5 overflow-hidden">
                    <div
                      className={`h-full transition-all duration-700 ${
                        status === "complete" ? "bg-gainn-green" : "bg-border"
                      }`}
                      style={{ width: status === "complete" ? "100%" : "0%" }}
                    />
                    <div className="absolute inset-0 bg-border -z-10" />
                  </div>
                )}

                <div className="flex flex-col items-center text-center px-2">
                  {/* Step circle */}
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 border-2 transition-all duration-500 ${
                      status === "complete"
                        ? "border-gainn-green bg-gainn-green/10"
                        : status === "processing"
                        ? `border-primary/60 bg-primary/10 shadow-[0_0_12px_hsl(var(--primary)/0.3)]`
                        : "border-border bg-surface-2"
                    }`}
                  >
                    {status === "complete" ? (
                      <CheckCircle className="w-5 h-5 text-gainn-green" />
                    ) : status === "processing" ? (
                      <Loader2 className={`w-5 h-5 ${step.color} animate-spin`} />
                    ) : (
                      <Icon className="w-5 h-5 text-muted-foreground" />
                    )}
                  </div>

                  {/* Label */}
                  <span className={`text-xs font-semibold mb-0.5 transition-colors ${
                    status === "processing" ? "text-foreground" : status === "complete" ? "text-gainn-green" : "text-muted-foreground"
                  }`}>
                    {step.title}
                  </span>
                  <span className="text-[10px] text-muted-foreground font-mono">{step.subtitle}</span>

                  {/* Detail text — visible when active */}
                  <div className={`mt-2 text-[10px] font-mono leading-relaxed transition-opacity duration-300 max-w-[160px] ${
                    status === "processing" ? "opacity-100 text-accent" : status === "complete" ? "opacity-60 text-gainn-green" : "opacity-0"
                  }`}>
                    {status === "complete" ? "✓ Complete" : step.detail}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
