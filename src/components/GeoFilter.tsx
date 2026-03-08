import { useState, useRef, useEffect } from "react";
import { MapPin, ChevronDown, Globe, X, Search } from "lucide-react";

// ── Geo hierarchy data ────────────────────────────────────────────────────
export const GEO_REGIONS: Record<string, { states: Record<string, string[]> }> = {
  "United States": {
    states: {
      "California": ["Los Angeles", "San Francisco", "San Diego", "Silicon Valley", "Sacramento"],
      "New York": ["New York City", "Buffalo", "Albany", "Brooklyn", "Manhattan"],
      "Texas": ["Houston", "Dallas", "Austin", "San Antonio", "Fort Worth"],
      "Florida": ["Miami", "Orlando", "Tampa", "Jacksonville", "Tallahassee"],
      "Washington": ["Seattle", "Spokane", "Olympia", "Tacoma"],
      "Illinois": ["Chicago", "Springfield", "Naperville"],
      "Massachusetts": ["Boston", "Cambridge", "Worcester"],
      "Georgia": ["Atlanta", "Savannah", "Augusta"],
      "Nevada": ["Las Vegas", "Reno"],
      "Colorado": ["Denver", "Boulder", "Colorado Springs"],
    },
  },
  "United Kingdom": {
    states: {
      "England": ["London", "Manchester", "Birmingham", "Leeds", "Liverpool", "Bristol"],
      "Scotland": ["Edinburgh", "Glasgow", "Aberdeen", "Dundee"],
      "Wales": ["Cardiff", "Swansea", "Newport"],
      "Northern Ireland": ["Belfast", "Derry", "Armagh"],
    },
  },
  "India": {
    states: {
      "Maharashtra": ["Mumbai", "Pune", "Nagpur", "Nashik"],
      "Delhi": ["New Delhi", "Noida", "Gurgaon"],
      "Karnataka": ["Bengaluru", "Mysuru", "Mangaluru"],
      "Tamil Nadu": ["Chennai", "Coimbatore", "Madurai"],
      "West Bengal": ["Kolkata", "Howrah", "Siliguri"],
      "Telangana": ["Hyderabad", "Warangal"],
      "Gujarat": ["Ahmedabad", "Surat", "Vadodara"],
      "Rajasthan": ["Jaipur", "Jodhpur", "Udaipur"],
      "Uttar Pradesh": ["Lucknow", "Kanpur", "Varanasi", "Agra"],
      "Punjab": ["Chandigarh", "Ludhiana", "Amritsar"],
    },
  },
  "China": {
    states: {
      "Beijing": ["Beijing"],
      "Shanghai": ["Shanghai"],
      "Guangdong": ["Guangzhou", "Shenzhen", "Dongguan"],
      "Sichuan": ["Chengdu"],
      "Zhejiang": ["Hangzhou", "Ningbo"],
    },
  },
  "Germany": {
    states: {
      "Bavaria": ["Munich", "Nuremberg", "Augsburg"],
      "Berlin": ["Berlin"],
      "Hamburg": ["Hamburg"],
      "North Rhine-Westphalia": ["Cologne", "Düsseldorf", "Dortmund"],
      "Baden-Württemberg": ["Stuttgart", "Mannheim", "Karlsruhe"],
    },
  },
  "France": {
    states: {
      "Île-de-France": ["Paris", "Versailles"],
      "Provence": ["Marseille", "Nice", "Toulon"],
      "Occitanie": ["Toulouse", "Montpellier"],
      "Auvergne-Rhône-Alpes": ["Lyon", "Grenoble"],
    },
  },
  "Japan": {
    states: {
      "Tokyo": ["Tokyo", "Shinjuku", "Shibuya"],
      "Osaka": ["Osaka", "Kyoto", "Kobe"],
      "Kanagawa": ["Yokohama"],
      "Aichi": ["Nagoya"],
    },
  },
  "Australia": {
    states: {
      "New South Wales": ["Sydney", "Newcastle", "Wollongong"],
      "Victoria": ["Melbourne", "Geelong", "Ballarat"],
      "Queensland": ["Brisbane", "Gold Coast", "Cairns"],
      "Western Australia": ["Perth", "Fremantle"],
      "South Australia": ["Adelaide"],
    },
  },
  "Canada": {
    states: {
      "Ontario": ["Toronto", "Ottawa", "Hamilton", "London"],
      "Quebec": ["Montreal", "Quebec City", "Laval"],
      "British Columbia": ["Vancouver", "Victoria", "Burnaby"],
      "Alberta": ["Calgary", "Edmonton"],
    },
  },
  "Brazil": {
    states: {
      "São Paulo": ["São Paulo", "Campinas", "Santos"],
      "Rio de Janeiro": ["Rio de Janeiro", "Niterói"],
      "Minas Gerais": ["Belo Horizonte"],
      "Bahia": ["Salvador"],
    },
  },
  "Russia": {
    states: {
      "Moscow Oblast": ["Moscow"],
      "Saint Petersburg": ["Saint Petersburg"],
      "Novosibirsk Oblast": ["Novosibirsk"],
    },
  },
  "South Korea": {
    states: {
      "Seoul": ["Seoul"],
      "Busan": ["Busan"],
      "Gyeonggi": ["Suwon", "Incheon"],
    },
  },
  "Israel": {
    states: {
      "Tel Aviv District": ["Tel Aviv", "Ramat Gan"],
      "Jerusalem District": ["Jerusalem"],
      "Haifa District": ["Haifa"],
    },
  },
  "UAE": {
    states: {
      "Dubai": ["Dubai"],
      "Abu Dhabi": ["Abu Dhabi"],
      "Sharjah": ["Sharjah"],
    },
  },
  "Singapore": { states: { "Singapore": ["Singapore"] } },
  "Global": { states: {} },
};

export const WORLD_COUNTRIES = Object.keys(GEO_REGIONS).filter((c) => c !== "Global");

export interface GeoSelection {
  country: string | null;
  state: string | null;
  city: string | null;
}

export function geoToQuery(geo: GeoSelection): string {
  if (geo.city) return geo.city;
  if (geo.state) return geo.state;
  if (geo.country) return geo.country;
  return "";
}

// ── Component ─────────────────────────────────────────────────────────────

interface GeoFilterProps {
  value: GeoSelection;
  onChange: (geo: GeoSelection) => void;
}

export function GeoFilter({ value, onChange }: GeoFilterProps) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<"country" | "state" | "city">("country");
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const fn = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);

  const selectedCountryData = value.country ? GEO_REGIONS[value.country] : null;
  const states = selectedCountryData ? Object.keys(selectedCountryData.states) : [];
  const cities = value.state && selectedCountryData ? selectedCountryData.states[value.state] ?? [] : [];

  const labelText = value.city ?? value.state ?? value.country ?? "All Regions";
  const isFiltered = !!(value.country);

  function openPicker() {
    setStep(value.country ? (value.state ? "city" : "state") : "country");
    setSearch("");
    setOpen(true);
  }

  function selectCountry(c: string) {
    onChange({ country: c, state: null, city: null });
    if (c === "Global" || !GEO_REGIONS[c] || Object.keys(GEO_REGIONS[c].states).length === 0) {
      setOpen(false);
    } else {
      setStep("state");
      setSearch("");
    }
  }

  function selectState(s: string) {
    onChange({ country: value.country, state: s, city: null });
    const cites = selectedCountryData?.states[s] ?? [];
    if (cites.length === 0) {
      setOpen(false);
    } else {
      setStep("city");
      setSearch("");
    }
  }

  function selectCity(c: string) {
    onChange({ country: value.country, state: value.state, city: c });
    setOpen(false);
  }

  function clearGeo() {
    onChange({ country: null, state: null, city: null });
    setOpen(false);
  }

  const countryList = WORLD_COUNTRIES.filter((c) =>
    c.toLowerCase().includes(search.toLowerCase())
  );
  const stateList = states.filter((s) => s.toLowerCase().includes(search.toLowerCase()));
  const cityList = cities.filter((c) => c.toLowerCase().includes(search.toLowerCase()));

  return (
    <div ref={ref} className="relative flex-shrink-0">
      <button
        onClick={openPicker}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium font-mono transition-all border ${
          isFiltered
            ? "bg-gainn-blue/20 text-gainn-cyan border-gainn-blue/40"
            : "bg-surface-2 text-muted-foreground border-border hover:border-gainn-blue/30 hover:text-foreground"
        }`}
      >
        <MapPin className="w-3 h-3" />
        <span className="max-w-[140px] truncate">{labelText}</span>
        <ChevronDown className="w-3 h-3 opacity-60" />
      </button>

      {isFiltered && (
        <button
          onClick={clearGeo}
          className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-gainn-red/80 text-white flex items-center justify-center hover:bg-gainn-red transition-colors"
        >
          <X className="w-2.5 h-2.5" />
        </button>
      )}

      {open && (
        <div className="absolute top-full mt-2 left-0 z-50 w-72 card-glass rounded-xl shadow-2xl border border-border overflow-hidden">
          {/* Header */}
          <div className="px-3 py-2.5 border-b border-border bg-surface-1 flex items-center gap-2">
            <Globe className="w-3.5 h-3.5 text-gainn-blue" />
            <span className="text-xs font-semibold text-foreground">
              {step === "country" ? "Select Country" : step === "state" ? `${value.country} → State/Region` : `${value.state} → City`}
            </span>
            {step !== "country" && (
              <button
                onClick={() => { setStep(step === "city" ? "state" : "country"); setSearch(""); }}
                className="ml-auto text-[10px] text-gainn-blue hover:text-gainn-cyan font-mono"
              >
                ← Back
              </button>
            )}
          </div>

          {/* Search */}
          <div className="px-3 py-2 border-b border-border/50">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
              <input
                autoFocus
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={`Search ${step}…`}
                className="w-full pl-7 pr-3 py-1.5 text-xs bg-surface-2 rounded border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-gainn-blue/40"
              />
            </div>
          </div>

          {/* List */}
          <div className="max-h-56 overflow-y-auto scrollbar-none">
            {step === "country" && (
              <>
                <button
                  onClick={() => { onChange({ country: null, state: null, city: null }); setOpen(false); }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-surface-2 transition-colors text-gainn-cyan border-b border-border/30"
                >
                  <Globe className="w-3.5 h-3.5" /> All Global News
                </button>
                {countryList.map((c) => (
                  <button
                    key={c}
                    onClick={() => selectCountry(c)}
                    className={`w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-surface-2 transition-colors ${value.country === c ? "text-gainn-cyan bg-gainn-blue/10" : "text-foreground"}`}
                  >
                    <MapPin className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                    {c}
                  </button>
                ))}
              </>
            )}

            {step === "state" && (
              <>
                <button
                  onClick={() => { onChange({ country: value.country, state: null, city: null }); setOpen(false); }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-surface-2 transition-colors text-gainn-cyan border-b border-border/30"
                >
                  <Globe className="w-3.5 h-3.5" /> All of {value.country}
                </button>
                {stateList.map((s) => (
                  <button
                    key={s}
                    onClick={() => selectState(s)}
                    className={`w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-surface-2 transition-colors ${value.state === s ? "text-gainn-cyan bg-gainn-blue/10" : "text-foreground"}`}
                  >
                    <MapPin className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                    {s}
                  </button>
                ))}
              </>
            )}

            {step === "city" && (
              <>
                <button
                  onClick={() => { onChange({ country: value.country, state: value.state, city: null }); setOpen(false); }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-surface-2 transition-colors text-gainn-cyan border-b border-border/30"
                >
                  <Globe className="w-3.5 h-3.5" /> All of {value.state}
                </button>
                {cityList.map((c) => (
                  <button
                    key={c}
                    onClick={() => selectCity(c)}
                    className={`w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-surface-2 transition-colors ${value.city === c ? "text-gainn-cyan bg-gainn-blue/10" : "text-foreground"}`}
                  >
                    <MapPin className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                    {c}
                  </button>
                ))}
              </>
            )}
          </div>

          {/* Breadcrumb path */}
          {(value.country || value.state || value.city) && (
            <div className="px-3 py-2 border-t border-border/50 bg-surface-1/80 flex items-center gap-1 text-[10px] font-mono text-muted-foreground">
              {value.country && <span className="text-gainn-cyan">{value.country}</span>}
              {value.state && <><span>›</span><span className="text-gainn-cyan">{value.state}</span></>}
              {value.city && <><span>›</span><span className="text-gainn-green">{value.city}</span></>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
