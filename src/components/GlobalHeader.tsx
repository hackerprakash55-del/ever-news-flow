import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Bell, Search, User, Radio, Menu, X, Video, Library } from "lucide-react";
import { Button } from "@/components/ui/button";
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

interface GlobalHeaderProps {
  onNewsroomClick?: () => void;
}

export const GlobalHeader = ({ onNewsroomClick }: GlobalHeaderProps) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  const now = new Date().toLocaleTimeString("en-US", {
    hour: "2-digit", minute: "2-digit", hour12: false,
    timeZoneName: "short"
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
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
            <User className="w-4 h-4" />
          </Button>
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
          <Link
            to="/video"
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-gainn-purple rounded-md"
            onClick={() => setMobileOpen(false)}
          >
            <Video className="w-3.5 h-3.5" /> AI Video
          </Link>
        </div>
      )}
    </header>
  );
};
