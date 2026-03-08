import { useState, useRef, useEffect } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { Search, Radio, Menu, X, Video, Library, LogIn, Settings, LogOut, Bookmark, User, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import gainnLogo from "@/assets/gainn-logo.png";
import { cn } from "@/lib/utils";
import { SearchOverlay } from "@/components/SearchOverlay";
import { NotificationBell } from "@/components/NotificationPanel";

const CATEGORIES = [
  { label: "Home",        cat: null },
  { label: "Technology",  cat: "Technology" },
  { label: "Politics",    cat: "Politics" },
  { label: "Science",     cat: "Science" },
  { label: "Economy",     cat: "Economy" },
  { label: "Environment", cat: "Environment" },
  { label: "AI",          cat: "AI" },
  { label: "Global",      cat: "Global Affairs" },
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
        <Button
          variant="outline"
          size="sm"
          className="h-8 gap-1.5 text-xs font-mono border-primary/40 text-primary hover:bg-primary/10 hover:text-primary"
        >
          <LogIn className="w-3.5 h-3.5" /> Sign In
        </Button>
      </Link>
    );
  }

  const initials = (profile?.display_name || user.email || "?")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 h-8 px-2 rounded-lg hover:bg-muted transition-colors"
      >
        <div className="w-7 h-7 rounded-lg bg-primary/20 border border-primary/30 overflow-hidden flex items-center justify-center text-xs font-bold text-primary">
          {profile?.avatar_url ? (
            <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
          ) : (
            initials
          )}
        </div>
        <ChevronDown className={cn("w-3 h-3 text-muted-foreground transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div className="absolute top-full right-0 mt-2 w-56 bg-card rounded-xl shadow-elevated border border-border overflow-hidden z-50">
          {/* User info */}
          <div className="px-4 py-3 border-b border-border bg-muted/40">
            <p className="text-sm font-semibold text-card-foreground truncate">
              {profile?.display_name || "GAINN User"}
            </p>
            <p className="text-xs text-muted-foreground font-mono truncate">{user.email}</p>
          </div>

          {/* Menu items */}
          <div className="py-1">
            {[
              { icon: User,     label: "Profile & Settings", href: "/settings" },
              { icon: Bookmark, label: "Saved Articles",     href: "/settings?tab=saved" },
            ].map(({ icon: Icon, label, href }) => (
              <Link
                key={label}
                to={href}
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-foreground hover:bg-muted transition-colors"
              >
                <Icon className="w-3.5 h-3.5 text-muted-foreground" />
                {label}
              </Link>
            ))}
          </div>

          <div className="border-t border-border py-1">
            <button
              onClick={async () => {
                setOpen(false);
                await signOut();
                navigate("/auth");
              }}
              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-destructive hover:bg-destructive/10 transition-colors"
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
  /** Called when a category pill is clicked (homepage use) */
  onCategoryChange?: (cat: string) => void;
  activeCategory?: string;
}

export const GlobalHeader = ({
  onNewsroomClick,
  onCategoryChange,
  activeCategory = "All",
}: GlobalHeaderProps) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [, setSearchParams] = useSearchParams();

  const now = new Date().toLocaleTimeString("en-US", {
    hour: "2-digit", minute: "2-digit", hour12: false, timeZoneName: "short",
  });

  function handleCatClick(cat: string | null, label: string) {
    setMobileOpen(false);
    if (location.pathname !== "/") {
      // navigate to home with cat param
      navigate(cat ? `/?cat=${encodeURIComponent(cat)}` : "/");
    } else {
      // already on home — update param + notify parent
      if (cat) {
        setSearchParams({ cat });
      } else {
        setSearchParams({});
      }
      onCategoryChange?.(label === "Home" ? "All" : label);
    }
  }

  function isNavActive(cat: string | null) {
    if (location.pathname !== "/") return false;
    if (cat === null) return activeCategory === "All";
    return activeCategory === (cat === "Global Affairs" ? "Global" : cat) || activeCategory === cat;
  }

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur-xl">
      {/* Top bar */}
      <div className="border-b border-border/50 px-4 py-1.5 flex items-center justify-between">
        <div className="flex items-center gap-3 text-xs text-muted-foreground font-mono">
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
            <span>108 Agents Active</span>
          </div>
          <span className="text-border">|</span>
          <span>UTC {now}</span>
          <span className="text-border">|</span>
          <span className="text-accent">24/7 AI Newsroom</span>
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
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 flex-shrink-0">
          <img src={gainnLogo} alt="GAINN Logo" className="w-8 h-8 object-contain" />
          <div>
            <div
              className="text-lg font-bold tracking-tight text-gradient-primary"
              style={{ fontFamily: "var(--font-display)" }}
            >
              GAINN
            </div>
            <div className="text-[9px] tracking-[0.2em] text-muted-foreground uppercase font-mono -mt-0.5">
              Global AI News Network
            </div>
          </div>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden lg:flex items-center gap-0.5 flex-1 ml-4">
          {CATEGORIES.map((item) => {
            const active = isNavActive(item.cat);
            return (
              <button
                key={item.label}
                onClick={() => handleCatClick(item.cat, item.label)}
                className={cn(
                  "px-3 py-1.5 text-sm rounded-md transition-all font-medium whitespace-nowrap",
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                {item.label}
              </button>
            );
          })}

          <Link
            to="/video"
            className={cn(
              "ml-2 flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold rounded-md transition-colors border",
              location.pathname === "/video"
                ? "bg-gainn-purple/20 text-gainn-purple border-gainn-purple/50"
                : "text-gainn-purple hover:bg-gainn-purple/10 border-gainn-purple/25 hover:border-gainn-purple/50"
            )}
          >
            <Video className="w-3.5 h-3.5" />
            AI Video
          </Link>
          <Link
            to="/videos"
            className={cn(
              "ml-1 flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold rounded-md transition-colors border",
              location.pathname === "/videos"
                ? "bg-accent/20 text-accent border-accent/50"
                : "text-accent hover:bg-accent/10 border-accent/25 hover:border-accent/50"
            )}
          >
            <Library className="w-3.5 h-3.5" />
            Video Library
          </Link>
        </nav>

        {/* Right actions */}
        <div className="flex items-center gap-2 ml-auto">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
          >
            <Search className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground relative"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-destructive" />
          </Button>
          <UserMenu />
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 lg:hidden text-muted-foreground hover:text-foreground"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      {/* Mobile nav */}
      {mobileOpen && (
        <div className="lg:hidden border-t border-border bg-card px-4 py-3 flex flex-col gap-1">
          {CATEGORIES.map((item) => {
            const active = isNavActive(item.cat);
            return (
              <button
                key={item.label}
                onClick={() => handleCatClick(item.cat, item.label)}
                className={cn(
                  "text-left px-3 py-2 text-sm rounded-md transition-colors",
                  active
                    ? "bg-primary text-primary-foreground font-semibold"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                {item.label}
              </button>
            );
          })}
          <Link
            to="/video"
            onClick={() => setMobileOpen(false)}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-gainn-purple rounded-md hover:bg-gainn-purple/10"
          >
            <Video className="w-3.5 h-3.5" /> AI Video
          </Link>
          <Link
            to="/videos"
            onClick={() => setMobileOpen(false)}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-accent rounded-md hover:bg-accent/10"
          >
            <Library className="w-3.5 h-3.5" /> Video Library
          </Link>

          <div className="border-t border-border/50 mt-2 pt-2">
            {user ? (
              <Link
                to="/settings"
                className="flex items-center gap-1.5 px-3 py-2 text-sm text-muted-foreground hover:text-foreground rounded-md"
                onClick={() => setMobileOpen(false)}
              >
                <Settings className="w-3.5 h-3.5" /> Settings
              </Link>
            ) : (
              <Link
                to="/auth"
                className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-primary rounded-md hover:bg-primary/10"
                onClick={() => setMobileOpen(false)}
              >
                <LogIn className="w-3.5 h-3.5" /> Sign In
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
