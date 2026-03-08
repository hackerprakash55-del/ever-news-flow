import { TICKER_ITEMS } from "@/data/mockData";

export const NewsTickerBar = () => {
  const doubled = [...TICKER_ITEMS, ...TICKER_ITEMS];

  return (
    <div className="h-8 bg-gainn-red/10 border-y border-gainn-red/30 flex items-center overflow-hidden">
      <div className="flex-shrink-0 px-3 h-full flex items-center bg-gainn-red z-10">
        <span className="text-[10px] font-mono font-bold tracking-widest text-white uppercase">
          Live
        </span>
        <span className="ml-2 w-2 h-2 rounded-full bg-white live-dot inline-block" />
      </div>
      <div className="flex-1 overflow-hidden">
        <div className="ticker-wrap h-full flex items-center">
          <div className="ticker-content">
            {doubled.map((item, i) => (
              <span key={i} className="inline-flex items-center px-6 text-xs font-mono text-foreground/80">
                {item}
                <span className="ml-6 text-gainn-blue/40">•</span>
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
