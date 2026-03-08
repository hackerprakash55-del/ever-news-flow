import { useState, useRef, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Bell, Search, Radio, Menu, X, Video, Library, LogIn, Settings, LogOut, Bookmark, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import gainnLogo from "@/assets/gainn-logo.png";

const NAV_ITEMS = [
  { label: "Home", href: "/" },
  { label: "Technology", href: "/?cat=Technology" },
  { label: "Politics", href: "/?cat=Politics" },
  { label: "Science", href: "/?cat=Science" },
  { label: "Economy", href: "/?cat=Economy" },
  { label: "Environment", href: "/?cat=Environment" },
  { label: "AI", href: "/?cat=AI" },
  { label: "Global", href: "/?cat=Global Affairs" },
];

// ── User Menu Dropdown ─────────────────────────────────────────────────────

function UserMenu() {
  const { user, profile, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fn = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);

  if (!user) {
    return (
      <Link to="/auth">
        <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-xs font-mono text-muted-foreground hover:text-foreground">
          <LogIn className="w-3.5 h-3.5" /> Sign In
        </Button>
      </Link>
    );
  }

  const initials = (profile?.display_name || user.email || "?").slice(0, 2).toUpperCase();

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 h-8 px-1.5 rounded-lg hover:bg-surface-2 transition-colors"
      >
        <div className="w-7 h-7 rounded-lg bg-gainn-blue/20 border border-gainn-blue/30 overflow-hidden flex items-center justify-center text-xs font-bold text-gainn-blue">
          {profile?.avatar_url ? (
            <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
          ) : (
            initials
          )}
        </div>
      </button>

      {open && (
        <div className="absolute top-full right-0 mt-2 w-56 card-glass rounded-xl shadow-2xl border border-border overflow-hidden z-50">
          {/* User info */}
          <div className="px-4 py-3 border-b border-border bg-surface-1">
            <p className="text-sm font-semibold text-foreground truncate">{profile?.display_name || "GAINN User"}</p>
            <p className="text-xs text-muted-foreground font-mono truncate">{user.email}</p>
          </div>

          {/* Menu items */}
          <div className="py-1">
            {[
              { icon: User, label: "Profile & Settings", href: "/settings" },
              { icon: Bookmark, label: "Saved Articles", href: "/settings?tab=saved" },
            ].map(({ icon: Icon, label, href }) => (
              <Link
                key={label}
                to={href}
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-foreground hover:bg-surface-2 transition-colors"
              >
                <Icon className="w-3.5 h-3.5 text-muted-foreground" />
                {label}
              </Link>
            ))}
          </div>

          <div className="border-t border-border py-1">
            <button
              onClick={async () => { setOpen(false); await signOut(); navigate("/"); }}
              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gainn-red hover:bg-gainn-red/10 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Header ─────────────────────────────────────────────────────────────────

interface GlobalHeaderProps {
  onNewsroomClick?: () => void;
}

export const GlobalHeader = ({ onNewsroomClick }: GlobalHeaderProps) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user } = useAuth();

  const now = new Date().toLocaleTimeString("en-US", {
    hour: "2-digit", minute: "2-digit", hour12: false, timeZoneName: "short"
  });

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-surface-1/95 backdrop-blur-xl">
      {/* Top bar */}
      <div className="border-b border-border/50 px-4 py-1.5 flex items-center justify-between">
        <div className="flex items-center gap-3 text-xs text-muted-foreground font-mono">
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-gainn-green animate-pulse" />
            <span>108 Agents Active</span>
          </div>
          <span className="text-border">|</span>
          <span>UTC {now}</span>
          <span className="text-border">|</span>
          <span className="text-gainn-cyan">24/7 AI Newsroom</span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="h-6 text-xs gap-1.5 text-gainn-amber border border-gainn-amber/30 hover:bg-gainn-amber/10"
            onClick={onNewsroomClick}
          >
            <Radio className="w-3 h-3 animate-live-pulse" />
            Newsroom Command
          </Button>
        </div>
      </div>

      {/* Main header */}
      <div className="px-4 md:px-6 py-3 flex items-center gap-4">
        <Link to="/" className="flex items-center gap-2.5 flex-shrink-0">
          <img src={gainnLogo} alt="GAINN Logo" className="w-8 h-8 object-contain" />
          <div>
            <div className="text-lg font-bold tracking-tight" style={{ fontFamily: "var(--font-display)" }}>
              <span className="text-gradient-primary">GAINN</span>
            </div>
            <div className="text-[9px] tracking-[0.2em] text-muted-foreground uppercase font-mono -mt-0.5">
              Global AI News Network
            </div>
          </div>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden lg:flex items-center gap-1 flex-1 ml-4">
          {NAV_ITEMS.slice(0, 7).map((item) => (
            <Link
              key={item.label}
              to={item.href}
              className="px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-surface-2 rounded-md transition-colors font-medium"
            >
              {item.label}
            </Link>
          ))}
          <Link
            to="/video"
            className="ml-1 flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold text-gainn-purple hover:bg-gainn-purple/10 rounded-md transition-colors border border-gainn-purple/25 hover:border-gainn-purple/50"
          >
            <Video className="w-3.5 h-3.5" />
            AI Video
          </Link>
          <Link
            to="/videos"
            className="ml-1 flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold text-gainn-cyan hover:bg-gainn-cyan/10 rounded-md transition-colors border border-gainn-cyan/25 hover:border-gainn-cyan/50"
          >
            <Library className="w-3.5 h-3.5" />
            Video Library
          </Link>
        </nav>

        {/* Right actions */}
        <div className="flex items-center gap-2 ml-auto">
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
            <Search className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground relative">
            <Bell className="w-4 h-4" />
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-gainn-red" />
          </Button>
          <UserMenu />
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 lg:hidden"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      {/* Mobile nav */}
      {mobileOpen && (
        <div className="lg:hidden border-t border-border bg-surface-1 px-4 py-3 flex flex-col gap-1">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.label}
              to={item.href}
              className="px-3 py-2 text-sm text-muted-foreground hover:text-foreground rounded-md"
              onClick={() => setMobileOpen(false)}
            >
              {item.label}
            </Link>
          ))}
          <Link to="/video" className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-gainn-purple rounded-md" onClick={() => setMobileOpen(false)}>
            <Video className="w-3.5 h-3.5" /> AI Video
          </Link>
          <Link to="/videos" className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-gainn-cyan rounded-md" onClick={() => setMobileOpen(false)}>
            <Library className="w-3.5 h-3.5" /> Video Library
          </Link>
          <div className="border-t border-border/50 mt-2 pt-2">
            {user ? (
              <Link to="/settings" className="flex items-center gap-1.5 px-3 py-2 text-sm text-muted-foreground rounded-md" onClick={() => setMobileOpen(false)}>
                <Settings className="w-3.5 h-3.5" /> Settings
              </Link>
            ) : (
              <Link to="/auth" className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-gainn-blue rounded-md" onClick={() => setMobileOpen(false)}>
                <LogIn className="w-3.5 h-3.5" /> Sign In
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
