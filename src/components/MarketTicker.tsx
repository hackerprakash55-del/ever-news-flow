import { useState, useEffect } from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface Ticker {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePct: number;
  prefix?: string;
}

const BASE_TICKERS: Ticker[] = [
  { symbol: "BTC", name: "Bitcoin",   price: 67_420.50, change: 1_243.20, changePct: 1.88 },
  { symbol: "ETH", name: "Ethereum",  price: 3_512.80,  change: -87.40,   changePct: -2.43 },
  { symbol: "SPX", name: "S&P 500",   price: 5_312.00,  change: 28.60,    changePct: 0.54 },
  { symbol: "NDX", name: "NASDAQ",    price: 18_640.20, change: 124.80,   changePct: 0.67 },
  { symbol: "XAU", name: "Gold",      price: 2_385.40,  change: -12.30,   changePct: -0.51, prefix: "$" },
  { symbol: "DXY", name: "USD Index", price: 104.32,    change: 0.14,     changePct: 0.13 },
  { symbol: "OIL", name: "Crude Oil", price: 81.74,     change: -0.62,    changePct: -0.75, prefix: "$" },
];

function fmtPrice(v: number, prefix = "") {
  if (v >= 10_000) return `${prefix}${v.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
  if (v >= 100)    return `${prefix}${v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  return `${prefix}${v.toFixed(2)}`;
}

function nudge(base: Ticker): Ticker {
  const delta = (Math.random() - 0.5) * base.price * 0.002;
  const newPrice = Math.max(0.01, base.price + delta);
  const totalChange = base.change + delta;
  const totalChangePct = (totalChange / (newPrice - totalChange)) * 100;
  return { ...base, price: newPrice, change: totalChange, changePct: totalChangePct };
}

function TickerItem({ t, flashing }: { t: Ticker; flashing?: boolean }) {
  const up = t.changePct > 0;
  const flat = Math.abs(t.changePct) < 0.01;
  const flashClass = flashing ? (up ? "price-flash-up" : "price-flash-down") : "";

  return (
    <div className="flex items-center gap-2 px-4 py-1.5 border-r border-border/40 flex-shrink-0">
      <span className="text-[11px] font-mono font-bold text-muted-foreground">{t.symbol}</span>
      <span className={cn("text-[11px] font-mono font-semibold text-foreground", flashClass)}>
        {fmtPrice(t.price, t.prefix ?? (["BTC","ETH"].includes(t.symbol) ? "$" : ""))}
      </span>
      <span className={cn(
        "flex items-center gap-0.5 text-[10px] font-mono font-bold",
        flat ? "text-muted-foreground" : up ? "text-gainn-green" : "text-gainn-red"
      )}>
        {flat ? <Minus className="w-2.5 h-2.5" /> : up ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
        {up && "+"}{t.changePct.toFixed(2)}%
      </span>
    </div>
  );
}

export function MarketTicker() {
  const [tickers, setTickers] = useState<Ticker[]>(BASE_TICKERS);
  const [flash, setFlash] = useState<Set<string>>(new Set());

  useEffect(() => {
    const id = setInterval(() => {
      setTickers((prev) => {
        const next = prev.map((t) => {
          if (Math.random() < 0.4) return nudge(t);
          return t;
        });
        const changed = new Set(
          next.filter((n, i) => n.price !== prev[i].price).map((n) => n.symbol)
        );
        if (changed.size > 0) {
          setFlash(changed);
          setTimeout(() => setFlash(new Set()), 600);
        }
        return next;
      });
    }, 4_000);
    return () => clearInterval(id);
  }, []);

  const doubled = [...tickers, ...tickers];

  return (
    <div className="border-b border-border bg-surface-1/80 backdrop-blur-sm overflow-hidden">
      <div className="flex items-center">
        {/* Label pill */}
        <div className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-gainn-green/10 border-r border-gainn-green/20 z-10">
          <div className="w-1.5 h-1.5 rounded-full bg-gainn-green animate-pulse" />
          <span className="text-[9px] font-mono font-bold text-gainn-green uppercase tracking-widest">Markets</span>
        </div>

        {/* Scrolling strip */}
        <div className="overflow-hidden flex-1">
          <div className="flex animate-[market-scroll_30s_linear_infinite] hover:[animation-play-state:paused]">
            {doubled.map((t, i) => (
              <div key={`${t.symbol}-${i}`}>
                <TickerItem t={t} flashing={flash.has(t.symbol)} />
              </div>
            ))}
          </div>
        </div>

        {/* Timestamp */}
        <div className="flex-shrink-0 px-3 py-1.5 border-l border-border/40 text-[9px] font-mono text-muted-foreground hidden md:block">
          {new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false })} UTC
        </div>
      </div>
    </div>
  );
}
