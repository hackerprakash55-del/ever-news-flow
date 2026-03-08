import { useState, useEffect, useRef } from "react";
import { Bell, X, Zap, AlertTriangle, Info, CheckCircle, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { MOCK_ARTICLES, PIPELINE_EVENTS } from "@/data/mockData";

interface Notification {
  id: string;
  type: "breaking" | "urgent" | "ai" | "update";
  title: string;
  body: string;
  time: string;
  read: boolean;
  articleId?: string;
}

const TYPE_CONFIG = {
  breaking: {
    icon: Zap,
    color: "text-destructive",
    bg: "bg-destructive/10 border-destructive/20",
    dot: "bg-destructive",
    label: "Breaking",
  },
  urgent: {
    icon: AlertTriangle,
    color: "text-yellow-500",
    bg: "bg-yellow-500/10 border-yellow-500/20",
    dot: "bg-yellow-500",
    label: "Urgent",
  },
  ai: {
    icon: CheckCircle,
    color: "text-primary",
    bg: "bg-primary/10 border-primary/20",
    dot: "bg-primary",
    label: "AI Update",
  },
  update: {
    icon: Info,
    color: "text-muted-foreground",
    bg: "bg-muted/50 border-border",
    dot: "bg-muted-foreground",
    label: "Update",
  },
};

function seedNotifications(): Notification[] {
  return [
    {
      id: "n1",
      type: "breaking",
      title: "Breaking: " + MOCK_ARTICLES[0]?.headline?.slice(0, 50) + "…",
      body: MOCK_ARTICLES[0]?.summary?.slice(0, 90) + "…",
      time: "Just now",
      read: false,
      articleId: MOCK_ARTICLES[0]?.id,
    },
    {
      id: "n2",
      type: "ai",
      title: "AI Anchor broadcast ready",
      body: "Your daily AI-generated video briefing has been compiled and is ready to watch.",
      time: "3m ago",
      read: false,
    },
    {
      id: "n3",
      type: "urgent",
      title: "Developing: " + MOCK_ARTICLES[1]?.headline?.slice(0, 45) + "…",
      body: MOCK_ARTICLES[1]?.summary?.slice(0, 90) + "…",
      time: "12m ago",
      read: true,
      articleId: MOCK_ARTICLES[1]?.id,
    },
    {
      id: "n4",
      type: "update",
      title: "Pipeline processed 1,247 articles",
      body: "AI agents completed the morning digest. Bias score avg: 0.02 — excellent neutrality.",
      time: "1h ago",
      read: true,
    },
    {
      id: "n5",
      type: "breaking",
      title: "Breaking: " + MOCK_ARTICLES[2]?.headline?.slice(0, 50) + "…",
      body: MOCK_ARTICLES[2]?.summary?.slice(0, 90) + "…",
      time: "2h ago",
      read: true,
      articleId: MOCK_ARTICLES[2]?.id,
    },
  ];
}

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>(seedNotifications);
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const unread = notifications.filter((n) => !n.read).length;

  // Close on outside click
  useEffect(() => {
    const fn = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);

  // Simulate live notifications every 30s
  useEffect(() => {
    const live = [
      { title: "AI Anchor: New segment published", body: "A breaking story has been added to the live broadcast queue.", type: "ai" as const },
      { title: "Breaking alert from Monitor Alpha", body: "New signal detected — global economic indicator release imminent.", type: "breaking" as const },
      { title: "Fact-check complete", body: "3 sources verified for top story. Credibility score: 97%.", type: "update" as const },
    ];
    let i = 0;
    const t = setInterval(() => {
      const item = live[i % live.length];
      i++;
      const newNote: Notification = {
        id: `live-${Date.now()}`,
        type: item.type,
        title: item.title,
        body: item.body,
        time: "Just now",
        read: false,
      };
      setNotifications((prev) => [newNote, ...prev].slice(0, 12));
    }, 30_000);
    return () => clearInterval(t);
  }, []);

  function markAllRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }

  function handleClick(n: Notification) {
    setNotifications((prev) => prev.map((x) => x.id === n.id ? { ...x, read: true } : x));
    if (n.articleId) { setOpen(false); navigate(`/article/${n.articleId}`); }
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="h-8 w-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors relative"
      >
        <Bell className={cn("w-4 h-4 transition-all", open && "text-primary")} />
        {unread > 0 && (
          <span className="absolute top-1 right-1 flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-destructive" />
          </span>
        )}
      </button>

      {open && (
        <div className="absolute top-full right-0 mt-2 w-80 bg-card rounded-xl shadow-elevated border border-border overflow-hidden z-50">
          {/* Header */}
          <div className="px-4 py-3 border-b border-border flex items-center justify-between bg-muted/30">
            <div className="flex items-center gap-2">
              <Bell className="w-3.5 h-3.5 text-primary" />
              <span className="text-sm font-semibold">Notifications</span>
              {unread > 0 && (
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-destructive text-destructive-foreground font-bold">
                  {unread}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {unread > 0 && (
                <button
                  onClick={markAllRead}
                  className="text-[10px] font-mono text-primary hover:text-accent transition-colors px-2 py-0.5"
                >
                  Mark all read
                </button>
              )}
              <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground transition-colors">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="max-h-[400px] overflow-y-auto divide-y divide-border/50">
            {notifications.map((n) => {
              const cfg = TYPE_CONFIG[n.type];
              const Icon = cfg.icon;
              return (
                <div
                  key={n.id}
                  onClick={() => handleClick(n)}
                  className={cn(
                    "flex gap-3 px-4 py-3 cursor-pointer transition-colors hover:bg-muted/40",
                    !n.read && "bg-primary/5"
                  )}
                >
                  <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 border mt-0.5", cfg.bg)}>
                    <Icon className={cn("w-3.5 h-3.5", cfg.color)} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-1">
                      <p className={cn("text-xs font-semibold leading-snug line-clamp-1", !n.read ? "text-foreground" : "text-muted-foreground")}>
                        {n.title}
                      </p>
                      {n.articleId && <ExternalLink className="w-3 h-3 text-muted-foreground flex-shrink-0 mt-0.5" />}
                    </div>
                    <p className="text-[11px] text-muted-foreground line-clamp-2 mt-0.5 leading-relaxed">{n.body}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={cn("text-[9px] font-mono uppercase tracking-wide font-bold", cfg.color)}>{cfg.label}</span>
                      <span className="text-[9px] text-muted-foreground font-mono">{n.time}</span>
                      {!n.read && <span className={cn("w-1.5 h-1.5 rounded-full ml-auto", cfg.dot)} />}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer */}
          <div className="border-t border-border px-4 py-2.5 bg-muted/20">
            <span className="text-[10px] font-mono text-muted-foreground">
              Live alerts every 30s · {notifications.length} total
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
