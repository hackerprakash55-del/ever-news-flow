import { useEffect, useRef, useState } from "react";
import { Languages, Check } from "lucide-react";
import { LANGUAGES, useLanguage } from "@/lib/language";
import { cn } from "@/lib/utils";

/** Reading + narration language selector (Sarvam-powered Indian languages). */
export const LanguageSwitcher = ({ className }: { className?: string }) => {
  const [lang, setLang] = useLanguage();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fn = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);

  const current = LANGUAGES.find((l) => l.code === lang) ?? LANGUAGES[0];

  return (
    <div ref={ref} className={cn("relative", className)}>
      <button
        onClick={() => setOpen(!open)}
        aria-label="Choose language"
        aria-expanded={open}
        className="flex items-center gap-1.5 h-8 px-2.5 rounded-md text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
      >
        <Languages className="w-4 h-4" />
        <span className="hidden sm:inline">{current.native}</span>
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-44 max-h-80 overflow-y-auto rounded-lg border border-border bg-card shadow-xl z-50 py-1">
          <p className="px-3 py-1.5 text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
            Read &amp; listen in
          </p>
          {LANGUAGES.map((l) => (
            <button
              key={l.code}
              onClick={() => { setLang(l.code); setOpen(false); }}
              className="w-full flex items-center justify-between gap-2 px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors"
            >
              <span>
                {l.native}
                <span className="ml-2 text-[11px] text-muted-foreground">{l.label}</span>
              </span>
              {l.code === lang && <Check className="w-3.5 h-3.5 text-primary" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
