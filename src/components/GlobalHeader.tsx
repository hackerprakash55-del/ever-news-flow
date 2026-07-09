import { useState, useRef, useEffect, lazy, Suspense } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import {
  Search, Radio, Menu, X, Video, Library, LogIn, Settings, LogOut,
  User, ChevronDown, Sun, Moon, Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "next-themes";
import gainnLogo from "@/assets/gainn-logo.png";
import { cn } from "@/lib/utils";

const SearchOverlay    = lazy(() => import("@/components/SearchOverlay").then(m => ({ default: m.SearchOverlay })));

const CATEGORIES = [
  { label: "Home",        cat: null },
  { label: "Politics",    cat: "Politics" },
  { label: "Government",  cat: "Government" },
  { label: "Crime",       cat: "Crime" },
  { label: "Technology",  cat: "Technology" },
  { label: "Science",     cat: "Science" },
  { label: "Economy",     cat: "Economy" },
  { label: "Environment", cat: "Environment" },
  { label: "AI",          cat: "AI" },
  { label: "Global",      cat: "Global Affairs" },
];

// ── User Menu Dropdown ─────────────────────────────────────
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

  // Derive first name for greeting
  const displayName = profile?.display_name || user.email?.split("@")[0] || "User";
  const firstName = displayName.split(" ")[0];
  const initials = displayName.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase();

  const menuItems = [
    { icon: User,     label: "Account Settings",        href: "/settings" },
  ];

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 h-8 px-2 rounded-lg hover:bg-muted transition-colors"
        aria-label="User menu"
      >
        {/* Avatar */}
        <div className="w-7 h-7 rounded-lg bg-primary/20 border border-primary/30 overflow-hidden flex items-center justify-center text-xs font-bold text-primary flex-shrink-0">
          {profile?.avatar_url ? (
            <img src={profile.avatar_url} alt={displayName} className="w-full h-full object-cover" />
          ) : initials}
        </div>
        {/* First name (desktop) */}
        <span className="hidden md:block text-sm font-medium text-foreground max-w-[80px] truncate">
          {firstName}
        </span>
        <ChevronDown className={cn("w-3 h-3 text-muted-foreground transition-transform flex-shrink-0", open && "rotate-180")} />
      </button>

      {open && (
        <div className="absolute top-full right-0 mt-2 w-60 bg-card rounded-xl shadow-elevated border border-border overflow-hidden z-50 animate-fade-in-up">
          {/* Profile header */}
          <div className="px-4 py-3 border-b border-border bg-muted/40 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary/20 border border-primary/30 overflow-hidden flex items-center justify-center text-sm font-bold text-primary flex-shrink-0">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt={displayName} className="w-full h-full object-cover" />
              ) : initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-card-foreground truncate">{displayName}</p>
              <p className="text-[11px] text-muted-foreground font-mono truncate">{user.email}</p>
            </div>
          </div>

          {/* Menu items */}
          <div className="py-1">
            {menuItems.map(({ icon: Icon, label, href }) => (
              <Link
                key={label}
                to={href}
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-foreground hover:bg-muted transition-colors"
              >
                <Icon className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                {label}
              </Link>
            ))}
          </div>

          {/* Sign out */}
          <div className="border-t border-border py-1">
            <button
              onClick={async () => { setOpen(false); await signOut(); navigate("/auth"); }}
              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-destructive hover:bg-destructive/10 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" /> Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Header ──────────────────────────────────────────────────
interface GlobalHeaderProps {
  onNewsroomClick?: () => void;
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
  const [inlineSearch, setInlineSearch] = useState("");
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [, setSearchParams] = useSearchParams();

  // Keyboard shortcut: "/" focuses search
  useEffect(() => {
    const fn = (e: KeyboardEvent) => {
      if (e.key === "/" && !(e.target instanceof HTMLInputElement) && !(e.target instanceof HTMLTextAreaElement)) {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    document.addEventListener("keydown", fn);
    return () => document.removeEventListener("keydown", fn);
  }, []);

  const now = new Date().toLocaleTimeString("en-US", {
    hour: "2-digit", minute: "2-digit", hour12: false, timeZoneName: "short",
  });

  function handleCatClick(cat: string | null, label: string) {
    setMobileOpen(false);
    if (location.pathname !== "/") {
      navigate(cat ? `/?cat=${encodeURIComponent(cat)}` : "/");
    } else {
      if (cat) setSearchParams({ cat });
      else setSearchParams({});
      onCategoryChange?.(label === "Home" ? "All" : label);
    }
  }

  function isNavActive(cat: string | null) {
    if (location.pathname !== "/") return false;
    if (cat === null) return activeCategory === "All";
    return activeCategory === (cat === "Global Affairs" ? "Global" : cat) || activeCategory === cat;
  }

  function handleInlineSearch(e: React.FormEvent) {
    e.preventDefault();
    if (inlineSearch.trim()) setSearchOpen(true);
  }

  return (
    <header className="sticky top-0 z-50 nav-glass animate-slide-down">
      {/* Main header row */}
      <div className="px-4 md:px-6 py-3 flex items-center gap-4">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 flex-shrink-0 animate-logo-pop">
          <img src={gainnLogo} alt="GAINN Logo" className="w-8 h-8 object-contain" />
          <div>
            <div className="text-lg font-bold tracking-tight text-gradient-primary" style={{ fontFamily: "var(--font-display)" }}>
              GAINN
            </div>
            <div className="text-[9px] tracking-[0.2em] text-muted-foreground uppercase font-mono -mt-0.5">
              Global AI News Network
            </div>
          </div>
        </Link>

        {/* Always-visible inline search bar (desktop) */}
        <form onSubmit={handleInlineSearch} className="hidden md:flex flex-1 max-w-sm ml-2">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
            <Input
              type="search"
              placeholder='Search stories… (press "/" to open)'
              value={inlineSearch}
              onChange={(e) => setInlineSearch(e.target.value)}
              onFocus={() => setSearchOpen(true)}
              className="pl-9 h-8 text-sm bg-surface-2 border-border focus:border-primary/50 placeholder:text-muted-foreground/50"
            />
          </div>
        </form>

        {/* Desktop nav */}
        <nav className="hidden lg:flex items-center gap-0.5 ml-2 flex-shrink-0">
          {CATEGORIES.map((item) => {
            const active = isNavActive(item.cat);
            return (
              <button
                key={item.label}
                onClick={() => handleCatClick(item.cat, item.label)}
                className={cn(
                  "stagger-item nav-underline px-3 py-1.5 text-sm rounded-md transition-all font-medium whitespace-nowrap",
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
            <Video className="w-3.5 h-3.5" />AI Video
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
            <Library className="w-3.5 h-3.5" />Video Library
          </Link>
          <Link
            to="/newsroom"
            className={cn(
              "ml-1 flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold rounded-md transition-colors border",
              location.pathname === "/newsroom"
                ? "bg-gainn-red/20 text-gainn-red border-gainn-red/50"
                : "text-gainn-red hover:bg-gainn-red/10 border-gainn-red/25 hover:border-gainn-red/50"
            )}
          >
            <Radio className="w-3.5 h-3.5 animate-live-pulse" />Live
          </Link>
          <Link
            to="/shorts"
            className={cn(
              "relative ml-1 flex items-center gap-1.5 px-3 py-1.5 text-sm font-bold rounded-md transition-all border",
              location.pathname.startsWith("/shorts")
                ? "bg-gradient-to-r from-red-500/30 to-cyan-500/30 text-white border-cyan-400/60"
                : "bg-gradient-to-r from-red-500/15 to-cyan-500/15 text-white border-cyan-400/40 hover:from-red-500/25 hover:to-cyan-500/25 hover:border-cyan-400/70"
            )}
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
            </span>
            <Zap className="w-3.5 h-3.5" />Shorts
            <span className="ml-1 px-1.5 py-0.5 rounded-full bg-cyan-400/90 text-black text-[9px] font-black tracking-wider">NEW</span>
          </Link>
        </nav>

        {/* Right actions */}
        <div className="flex items-center gap-2 ml-auto">
          {/* Mobile search icon */}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted md:hidden"
            onClick={() => setSearchOpen(true)}
            aria-label="Open search"
          >
            <Search className="w-4 h-4" />
          </Button>
          {/* Dark / Light toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          >
            {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </Button>
          <UserMenu />
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 lg:hidden text-muted-foreground hover:text-foreground"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      {/* Mobile nav */}
      {mobileOpen && (
        <div className="lg:hidden border-t border-border bg-card px-4 py-3 flex flex-col gap-1">
          {/* Mobile search */}
          <form onSubmit={handleInlineSearch} className="mb-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
              <Input
                type="search"
                placeholder="Search stories…"
                value={inlineSearch}
                onChange={(e) => setInlineSearch(e.target.value)}
                onFocus={() => { setSearchOpen(true); setMobileOpen(false); }}
                className="pl-9 h-9 text-sm bg-surface-2 border-border"
              />
            </div>
          </form>
          {CATEGORIES.map((item) => {
            const active = isNavActive(item.cat);
            return (
              <button
                key={item.label}
                onClick={() => handleCatClick(item.cat, item.label)}
                className={cn(
                  "text-left px-3 py-2 text-sm rounded-md transition-colors",
                  active ? "bg-primary text-primary-foreground font-semibold" : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                {item.label}
              </button>
            );
          })}
          <Link to="/video" onClick={() => setMobileOpen(false)}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-gainn-purple rounded-md hover:bg-gainn-purple/10"
          >
            <Video className="w-3.5 h-3.5" /> AI Video
          </Link>
          <Link to="/videos" onClick={() => setMobileOpen(false)}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-accent rounded-md hover:bg-accent/10"
          >
            <Library className="w-3.5 h-3.5" /> Video Library
          </Link>
          <Link to="/newsroom" onClick={() => setMobileOpen(false)}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-gainn-red rounded-md hover:bg-gainn-red/10"
          >
            <Radio className="w-3.5 h-3.5" /> Live Broadcast
          </Link>
          <Link to="/shorts" onClick={() => setMobileOpen(false)}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-cyan-300 rounded-md hover:bg-cyan-500/10"
          >
            <Zap className="w-3.5 h-3.5" /> AI Shorts
          </Link>
          <div className="border-t border-border/50 mt-2 pt-2">
            {user ? (
              <Link to="/settings" className="flex items-center gap-1.5 px-3 py-2 text-sm text-muted-foreground hover:text-foreground rounded-md"
                onClick={() => setMobileOpen(false)}
              >
                <Settings className="w-3.5 h-3.5" /> Settings
              </Link>
            ) : (
              <Link to="/auth" className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-primary rounded-md hover:bg-primary/10"
                onClick={() => setMobileOpen(false)}
              >
                <LogIn className="w-3.5 h-3.5" /> Sign In
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Search overlay */}
      <Suspense fallback={null}>
        <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
      </Suspense>
    </header>
  );
};
