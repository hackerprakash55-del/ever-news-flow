import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { GlobalHeader } from "@/components/GlobalHeader";
import { NewsTickerBar } from "@/components/NewsTickerBar";
import { AgentCard, DepartmentOverview } from "@/components/AgentCard";
import { PipelineLog } from "@/components/PipelineLog";
import { AGENTS, DEPARTMENT_STATS, MOCK_ARTICLES } from "@/data/mockData";
import { StatsBar } from "@/components/BreakingNewsBanner";
import {
  Activity, Cpu, Shield, Eye, Radio, Database, Zap,
  TrendingUp, CheckCircle, AlertTriangle, Clock, Globe
} from "lucide-react";
import gainnLogo from "@/assets/gainn-logo.png";
import { SeoHead } from "@/components/SeoHead";

const MetricCard = ({
  label, value, sub, icon: Icon, color, trend
}: { label: string; value: string; sub?: string; icon: any; color: string; trend?: string }) => (
  <div className="card-glass rounded-lg p-4 flex items-start gap-3">
    <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${color}20` }}>
      <Icon className="w-4.5 h-4.5" style={{ color }} />
    </div>
    <div className="flex-1 min-w-0">
      <div className="text-xl font-bold font-mono" style={{ color }}>{value}</div>
      <div className="text-xs text-foreground font-medium">{label}</div>
      {sub && <div className="text-[10px] text-muted-foreground font-mono mt-0.5">{sub}</div>}
    </div>
    {trend && (
      <span className="text-[10px] font-mono text-gainn-green flex-shrink-0">{trend}</span>
    )}
  </div>
);

const PipelineDiagram = () => {
  const steps = [
    { label: "Monitor", sub: "20 agents", icon: Eye, color: "#0ea5e9" },
    { label: "Research", sub: "20 agents", icon: Database, color: "#8b5cf6" },
    { label: "Verify", sub: "15 agents", icon: Shield, color: "#f59e0b" },
    { label: "Editorial", sub: "10 agents", icon: CheckCircle, color: "#06b6d4" },
    { label: "Generate", sub: "15 agents", icon: Zap, color: "#10b981" },
    { label: "Publish", sub: "5 agents", icon: Radio, color: "#ef4444" },
  ];

  return (
    <div className="card-glass rounded-lg p-4">
      <div className="flex items-center gap-2 mb-4">
        <Activity className="w-4 h-4 text-gainn-cyan" />
        <h3 className="text-sm font-semibold">News Production Pipeline</h3>
        <span className="ml-auto text-xs font-mono text-gainn-green animate-pulse">● Active</span>
      </div>
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {steps.map((step, i) => {
          const Icon = step.icon;
          return (
            <div key={step.label} className="flex items-center gap-2 flex-shrink-0">
              <div className="flex flex-col items-center gap-1.5">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center border-2"
                  style={{ borderColor: step.color, background: `${step.color}15` }}
                >
                  <Icon className="w-5 h-5" style={{ color: step.color }} />
                </div>
                <span className="text-[10px] font-medium text-center">{step.label}</span>
                <span className="text-[9px] text-muted-foreground font-mono">{step.sub}</span>
              </div>
              {i < steps.length - 1 && (
                <div className="flex flex-col items-center gap-0.5 mx-1">
                  <div className="w-6 h-0.5 bg-gradient-to-r from-gainn-blue to-gainn-cyan rounded-full" />
                  <div className="w-1.5 h-1.5 rounded-full bg-gainn-cyan animate-pulse" />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default function NewsroomPage() {
  const [activeTab, setActiveTab] = useState<"overview" | "agents" | "pipeline">("overview");
  const [agentFilter, setAgentFilter] = useState("All");
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const departments = ["All", ...new Set(AGENTS.map(a => a.department))];
  const filteredAgents = agentFilter === "All"
    ? AGENTS
    : AGENTS.filter(a => a.department === agentFilter);

  const runningCount = AGENTS.filter(a => a.status === "running" || a.status === "processing").length;

  return (
    <div className="min-h-screen bg-background">
      <GlobalHeader />
      <NewsTickerBar />

      <div className="max-w-screen-2xl mx-auto px-4 md:px-6 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <img src={gainnLogo} alt="GAINN" className="w-8 h-8" />
              <h1 className="text-2xl font-display text-gradient-primary">Newsroom Command Center</h1>
            </div>
            <p className="text-sm text-muted-foreground font-mono">
              {runningCount}/108 agents active • Real-time AI newsroom operations
            </p>
          </div>
          <Link to="/">
            <div className="text-xs font-mono text-gainn-blue hover:text-gainn-cyan transition-colors cursor-pointer">
              ← Back to GAINN
            </div>
          </Link>
        </div>

        {/* Stats Bar (moved from homepage) */}
        <div className="mb-6">
          <StatsBar />
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-6">
          <MetricCard label="Active Agents" value={`${runningCount}`} sub={`of 108 total`} icon={Cpu} color="#0ea5e9" trend="↑ 2" />
          <MetricCard label="Articles Today" value="1,247" sub="since midnight" icon={Zap} color="#10b981" trend="+12%" />
          <MetricCard label="Fact Checks" value="8,432" sub="completed" icon={Shield} color="#f59e0b" />
          <MetricCard label="Sources Live" value="12,891" sub="monitored feeds" icon={Globe} color="#8b5cf6" />
          <MetricCard label="Fake Blocked" value="384" sub="misinformation" icon={AlertTriangle} color="#ef4444" />
          <MetricCard label="System Uptime" value="99.7%" sub="last 30 days" icon={TrendingUp} color="#06b6d4" />
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-4 border-b border-border">
          {(["overview", "agents", "pipeline"] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-sm font-medium capitalize transition-colors border-b-2 -mb-px ${
                activeTab === tab
                  ? "border-gainn-blue text-gainn-blue"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-6">
            <div className="space-y-4">
              <PipelineDiagram />
              <DepartmentOverview />
              {/* Recent output */}
              <div className="card-glass rounded-lg overflow-hidden">
                <div className="px-4 py-3 border-b border-border flex items-center gap-2">
                  <Zap className="w-4 h-4 text-gainn-amber" />
                  <span className="text-sm font-semibold">Latest AI-Generated Articles</span>
                </div>
                <div className="divide-y divide-border">
                  {MOCK_ARTICLES.map((article) => (
                    <div key={article.id} className="flex items-center gap-3 px-4 py-3 hover:bg-surface-2 transition-colors">
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${article.isBreaking ? "bg-gainn-red live-dot" : "bg-gainn-green"}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-foreground truncate">{article.headline}</p>
                        <div className="flex items-center gap-3 text-[10px] text-muted-foreground font-mono mt-0.5">
                          <span>{article.category}</span>
                          <span>Credibility: {article.credibilityScore}%</span>
                          <span>{new Date(article.publishedAt).toLocaleTimeString()}</span>
                        </div>
                      </div>
                      {article.isBreaking && (
                        <span className="text-[9px] font-bold text-gainn-red px-1.5 py-0.5 rounded border border-gainn-red/30 flex-shrink-0">BREAKING</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="space-y-4" style={{ height: "fit-content" }}>
              <div style={{ height: 600 }}>
                <PipelineLog />
              </div>
            </div>
          </div>
        )}

        {/* Agents Tab */}
        {activeTab === "agents" && (
          <div>
            {/* Department filter */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-4">
              {departments.map(dept => (
                <button
                  key={dept}
                  onClick={() => setAgentFilter(dept)}
                  className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-mono transition-all ${
                    agentFilter === dept
                      ? "bg-gainn-blue text-background"
                      : "bg-surface-2 text-muted-foreground hover:bg-surface-3 border border-border"
                  }`}
                >
                  {dept}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
              {filteredAgents.map(agent => (
                <AgentCard key={agent.id} agent={agent} />
              ))}
            </div>
          </div>
        )}

        {/* Pipeline Tab */}
        {activeTab === "pipeline" && (
          <div className="grid grid-cols-1 xl:grid-cols-[1fr_400px] gap-6">
            <div className="space-y-4">
              <PipelineDiagram />
              {/* System health */}
              <div className="card-glass rounded-lg p-4">
                <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-gainn-cyan" /> System Health Monitor
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {[
                    { label: "CPU Usage", pct: 67, color: "#0ea5e9" },
                    { label: "Memory", pct: 54, color: "#10b981" },
                    { label: "API Throughput", pct: 89, color: "#8b5cf6" },
                    { label: "DB Queries/s", pct: 72, color: "#f59e0b" },
                    { label: "Vector Search", pct: 45, color: "#06b6d4" },
                    { label: "Model Inference", pct: 83, color: "#f97316" },
                  ].map(metric => (
                    <div key={metric.label} className="bg-surface-2 rounded-lg p-3">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs text-muted-foreground">{metric.label}</span>
                        <span className="text-xs font-mono font-bold" style={{ color: metric.color }}>{metric.pct}%</span>
                      </div>
                      <div className="h-2 rounded-full bg-surface-3 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-2000"
                          style={{ width: `${metric.pct}%`, background: metric.color }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              {/* AI Model Status */}
              <div className="card-glass rounded-lg p-4">
                <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-gainn-purple" /> AI Model Registry
                </h3>
                <div className="space-y-2">
                  {[
                    { name: "LLM Orchestrator (Gemini 3 Flash)", status: "running", requests: "12,847/hr", latency: "284ms" },
                    { name: "RAG Pipeline (Vector DB)", status: "running", requests: "8,432/hr", latency: "42ms" },
                    { name: "Fact Verification Model", status: "running", requests: "6,891/hr", latency: "156ms" },
                    { name: "Bias Detection Engine", status: "running", requests: "4,321/hr", latency: "98ms" },
                    { name: "Multilingual Translator (52 langs)", status: "running", requests: "2,104/hr", latency: "312ms" },
                    { name: "Image Generation Pipeline", status: "processing", requests: "234/hr", latency: "2.4s" },
                  ].map(model => (
                    <div key={model.name} className="flex items-center gap-3 p-2.5 bg-surface-2 rounded-lg">
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${model.status === "running" ? "bg-gainn-green animate-pulse" : "bg-gainn-cyan animate-pulse"}`} />
                      <span className="text-xs text-foreground flex-1 truncate">{model.name}</span>
                      <span className="text-[10px] font-mono text-muted-foreground">{model.requests}</span>
                      <span className="text-[10px] font-mono text-gainn-cyan">{model.latency}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div style={{ height: 700 }}>
              <PipelineLog />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
