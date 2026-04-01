import { useEffect, useState, useRef } from "react";
import { Rss, ShieldCheck, FileText, Send, CheckCircle, Loader2, Cpu } from "lucide-react";

type StepStatus = "waiting" | "processing" | "complete";

interface PipelineStep {
  id: number;
  icon: React.ElementType;
  title: string;
  subtitle: string;
  detail: string;
  color: string;
  bgColor: string;
}

const STEPS: PipelineStep[] = [
  { id: 1, icon: Rss, title: "Data Ingestion", subtitle: "Monitor Agent", detail: "Scanning 12,891 sources — RSS, APIs, social feeds", color: "text-gainn-blue", bgColor: "bg-gainn-blue" },
  { id: 2, icon: ShieldCheck, title: "Verification", subtitle: "Verifier Agent", detail: "Cross-checking 4 primary sources — credibility: 97%", color: "text-gainn-amber", bgColor: "bg-gainn-amber" },
  { id: 3, icon: FileText, title: "Generation", subtitle: "Reporter Agent", detail: "Composing structured article with key points", color: "text-gainn-green", bgColor: "bg-gainn-green" },
  { id: 4, icon: Send, title: "Distribution", subtitle: "Publisher Agent", detail: "Publishing to feed across 5 platforms", color: "text-gainn-purple", bgColor: "bg-gainn-purple" },
];

const CYCLE_MS = 3000;

export const AgentPipeline = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [statuses, setStatuses] = useState<StepStatus[]>(["processing", "waiting", "waiting", "waiting"]);
  const cycleCount = useRef(0);
  const [totalProcessed, setTotalProcessed] = useState(0);

  useEffect(() => {
    const iv = setInterval(() => {
      setActiveStep((prev) => {
        const next = (prev + 1) % (STEPS.length + 1);
        setStatuses(
          STEPS.map((_, i) => {
            if (next > STEPS.length - 1) return "complete";
            if (i < next) return "complete";
            if (i === next) return "processing";
            return "waiting";
          })
        );
        if (next === STEPS.length) {
          cycleCount.current++;
          setTotalProcessed(p => p + 1);
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
      {/* Header */}
      <div className="px-4 py-3 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Cpu className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold">AI Agent Pipeline</span>
          <div className="flex items-center gap-1.5 ml-2">
            <span className="w-2 h-2 rounded-full bg-gainn-green live-dot" />
            <span className="text-[10px] font-mono text-gainn-green font-semibold">LIVE</span>
          </div>
        </div>
        <div className="flex items-center gap-3 text-[10px] font-mono text-muted-foreground">
          <span>Cycle: <span className="text-accent">{totalProcessed}</span> articles</span>
          <span className="text-border">|</span>
          <span className="text-gainn-green">All agents operational</span>
        </div>
      </div>

      <div className="p-5">
        {/* Pipeline steps */}
        <div className="flex items-start gap-0">
          {STEPS.map((step, i) => {
            const Icon = step.icon;
            const status = statuses[i];

            return (
              <div key={step.id} className="flex-1 relative">
                {/* Connector line with animated fill */}
                {i < STEPS.length - 1 && (
                  <div className="absolute top-5 left-[calc(50%+20px)] right-0 h-0.5 overflow-hidden">
                    <div className="absolute inset-0 bg-border" />
                    <div
                      className={`h-full transition-all duration-700 relative z-10 ${
                        status === "complete" ? "bg-gainn-green" : "bg-border"
                      }`}
                      style={{ width: status === "complete" ? "100%" : "0%" }}
                    />
                    {/* Animated pulse on active connector */}
                    {status === "complete" && (
                      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-gainn-green live-dot" />
                    )}
                  </div>
                )}

                <div className="flex flex-col items-center text-center px-2">
                  {/* Step circle */}
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 border-2 transition-all duration-500 ${
                      status === "complete"
                        ? "border-gainn-green bg-gainn-green/10"
                        : status === "processing"
                        ? `border-primary/60 bg-primary/10 shadow-[0_0_16px_hsl(var(--primary)/0.4)]`
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

                  {/* Detail text */}
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

      {/* Bottom status bar */}
      <div className="border-t border-border px-4 py-2 flex items-center justify-between bg-surface-1/50">
        <div className="flex items-center gap-4 text-[10px] font-mono text-muted-foreground">
          <span>Latency: <span className="text-gainn-green">2.4s avg</span></span>
          <span>Accuracy: <span className="text-gainn-green">97.2%</span></span>
          <span>Queue: <span className="text-accent">12 pending</span></span>
        </div>
        <div className="text-[10px] font-mono text-gainn-green flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-gainn-green live-dot" />
          Real-time processing
        </div>
      </div>
    </div>
  );
};
