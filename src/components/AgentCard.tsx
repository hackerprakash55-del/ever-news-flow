import { Agent, DEPARTMENT_STATS } from "@/data/mockData";
import { Activity, CheckCircle, AlertCircle, Pause, Cpu } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const statusIcon = {
  running: <span className="w-2 h-2 rounded-full bg-gainn-green agent-active inline-block" />,
  processing: <span className="w-2 h-2 rounded-full bg-gainn-cyan animate-pulse inline-block" />,
  idle: <span className="w-2 h-2 rounded-full bg-muted-foreground/40 inline-block" />,
  error: <span className="w-2 h-2 rounded-full bg-gainn-red animate-pulse inline-block" />,
};

const statusLabel = {
  running: "text-gainn-green",
  processing: "text-gainn-cyan",
  idle: "text-muted-foreground",
  error: "text-gainn-red",
};

interface AgentCardProps {
  agent: Agent;
}

export const AgentCard = ({ agent }: AgentCardProps) => (
  <div className="card-glass rounded-lg p-3 card-hover">
    <div className="flex items-start justify-between mb-2">
      <div className="flex items-center gap-2">
        <div
          className="w-7 h-7 rounded-md flex items-center justify-center text-[10px] font-bold text-background"
          style={{ background: agent.color }}
        >
          {agent.name.charAt(0)}
        </div>
        <div>
          <div className="text-xs font-semibold text-foreground">{agent.name}</div>
          <div className="text-[10px] text-muted-foreground font-mono">{agent.department}</div>
        </div>
      </div>
      <div className="flex items-center gap-1">
        {statusIcon[agent.status]}
        <span className={`text-[10px] font-mono capitalize ${statusLabel[agent.status]}`}>
          {agent.status}
        </span>
      </div>
    </div>
    <div className="text-[10px] text-muted-foreground font-mono truncate mb-2">{agent.currentTask}</div>
    <div className="flex items-center justify-between text-[10px] font-mono">
      <span className="text-muted-foreground">Tasks: <span className="text-foreground">{agent.taskCount.toLocaleString()}</span></span>
      <span className="text-gainn-green">{agent.successRate}% ✓</span>
    </div>
    <div className="mt-2 h-1 rounded-full bg-surface-3 overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-1000"
        style={{ width: `${agent.successRate}%`, background: agent.color }}
      />
    </div>
  </div>
);

interface DepartmentOverviewProps {
  className?: string;
}

export const DepartmentOverview = ({ className = "" }: DepartmentOverviewProps) => (
  <div className={`card-glass rounded-lg overflow-hidden ${className}`}>
    <div className="px-4 py-3 border-b border-border flex items-center gap-2">
      <Cpu className="w-4 h-4 text-gainn-blue" />
      <span className="text-sm font-semibold">Newsroom Departments</span>
      <span className="ml-auto text-xs font-mono text-gainn-green">100+ Agents Active</span>
    </div>
    <div className="p-4 space-y-3">
      {DEPARTMENT_STATS.map((dept) => (
        <div key={dept.name} className="flex items-center gap-3">
          <div
            className="w-2.5 h-2.5 rounded-full flex-shrink-0"
            style={{ background: dept.color }}
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-foreground truncate">{dept.name}</span>
              <span className="text-[10px] font-mono text-muted-foreground ml-2 flex-shrink-0">
                {dept.active}/{dept.agents}
              </span>
            </div>
            <div className="h-1.5 rounded-full bg-surface-3 overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${(dept.active / dept.agents) * 100}%`,
                  background: dept.color,
                }}
              />
            </div>
          </div>
          <span className="text-[10px] font-mono text-muted-foreground flex-shrink-0">
            {dept.tasks.toLocaleString()} tasks
          </span>
        </div>
      ))}
    </div>
    <div className="border-t border-border px-4 py-2.5 flex items-center justify-between">
      <span className="text-xs text-muted-foreground">Total tasks processed today</span>
      <span className="text-sm font-bold font-mono text-gainn-cyan">
        {DEPARTMENT_STATS.reduce((s, d) => s + d.tasks, 0).toLocaleString()}
      </span>
    </div>
  </div>
);
