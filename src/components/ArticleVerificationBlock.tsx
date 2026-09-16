import { AlertTriangle, ExternalLink, FileSearch, Link2, Shield } from "lucide-react";
import type { Article } from "@/data/mockData";

export function verificationLabel(article: Article) {
  const verification = article.verification;
  
  // Only show "Verified" with score if ALL of these are true:
  // 1. verification object exists (article went through pipeline)
  // 2. verification_status is explicitly "verified"
  // 3. At least 3 sources were actually checked
  // 4. A credibility_score with basis exists (completed run)
  const sourceCount = verification?.sources_checked ? verification.sources_checked.length : 0;
  const canShowScore = verification?.verification_status === "verified"
    && sourceCount >= 3
    && Boolean(verification.credibility_score?.value && verification.credibility_score.basis);
  
  if (canShowScore) {
    return { 
      label: "Verified", 
      tone: "text-gainn-green", 
      canShowScore,
      basis: verification.credibility_score?.basis || `${sourceCount} sources checked`,
      status: "verified" as const
    };
  }
  
  // If no verification object exists at all, article never went through multi-agent pipeline
  if (!verification) {
    return { 
      label: "Not independently verified", 
      tone: "text-muted-foreground", 
      canShowScore: false,
      basis: undefined,
      status: "not_verified" as const
    };
  }
  
  // Verification exists but didn't complete as "verified" — show actual status
  if (verification.verification_status === "developing") {
    return { 
      label: "Developing", 
      tone: "text-muted-foreground", 
      canShowScore: false,
      basis: `${sourceCount} sources checked`,
      status: "developing" as const
    };
  }
  
  if (verification.verification_status === "single-source" || sourceCount <= 1) {
    return { 
      label: "Single-source", 
      tone: "text-muted-foreground", 
      canShowScore: false,
      basis: sourceCount === 1 ? "Only one source found" : "No sources checked",
      status: "single_source" as const
    };
  }
  
  if (verification.verification_status === "unverified") {
    return { 
      label: "Unverified", 
      tone: "text-muted-foreground", 
      canShowScore: false,
      basis: "Verification incomplete",
      status: "unverified" as const
    };
  }
  
  // Fallback for any other case
  return { 
    label: "Not independently verified", 
    tone: "text-muted-foreground", 
    canShowScore: false,
    basis: undefined,
    status: "not_verified" as const
  };
}

export function ArticleVerificationBlock({ article }: { article: Article }) {
  const verification = article.verification;
  const status = verificationLabel(article);
  const fullReport = article.category === "Economy" || article.category === "Business";

  if (!verification) {
    return (
      <section className="mt-10 border-y border-border py-5" aria-labelledby="verification-heading">
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-muted-foreground" />
          <h2 id="verification-heading" className="text-sm font-semibold">Verification status</h2>
          <span className="ml-auto text-xs font-mono text-muted-foreground">{status.label}</span>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">This story was not independently verified by our multi-agent pipeline. It may be from a single source or cached feed.</p>
      </section>
    );
  }

  return (
    <section className="mt-10 border-y border-border py-6" aria-labelledby="verification-heading">
      <div className="flex flex-wrap items-center gap-2">
        <FileSearch className="h-4 w-4 text-primary" />
        <h2 id="verification-heading" className="font-display text-lg font-semibold">How this story was checked</h2>
        <span className={`ml-auto text-xs font-mono ${status.tone}`}>{status.label}</span>
      </div>

      {status.canShowScore && verification.credibility_score && (
        <div className="mt-4 border-l-2 border-primary pl-4">
          <div className="text-lg font-mono font-bold text-primary">{verification.credibility_score.value}%</div>
          <p className="text-xs text-muted-foreground">{verification.credibility_score.basis}</p>
        </div>
      )}

      <div className="mt-5 space-y-5">
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground/80">Sources checked</h3>
          <ul className="mt-2 space-y-2">
            {verification.sources_checked.length > 0 ? verification.sources_checked.map((source) => (
              <li key={`${source.outlet}-${source.url}`} className="flex items-start gap-2 text-sm">
                <Link2 className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-muted-foreground" />
                <div>
                  {source.url ? (
                    <a href={source.url} target="_blank" rel="noopener noreferrer" className="text-foreground hover:text-primary">
                      {source.outlet} <ExternalLink className="inline h-3 w-3" />
                    </a>
                  ) : <span>{source.outlet}</span>}
                  <p className="text-xs text-muted-foreground">{source.stance_on_core_claim || "Source report"}</p>
                </div>
              </li>
            )) : <li className="text-sm text-muted-foreground">No checked sources recorded.</li>}
          </ul>
        </div>

        {fullReport && verification.agreement.core_claim && (
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground/80">What's agreed</h3>
            <p className="mt-2 text-sm leading-relaxed text-foreground/90">{verification.agreement.core_claim}</p>
            {verification.agreement.corroborating_sources.length > 0 && (
              <p className="mt-1 text-xs text-muted-foreground">Corroborated by {verification.agreement.corroborating_sources.join(", ")}</p>
            )}
          </div>
        )}

        {fullReport && verification.disagreements.length > 0 && (
          <div>
            <h3 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-foreground/80">
              <AlertTriangle className="h-3.5 w-3.5" /> Where sources differ
            </h3>
            <ul className="mt-2 space-y-3">
              {verification.disagreements.map((item) => (
                <li key={item.point} className="text-sm text-foreground/90">
                  <p>{item.point}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{item.source_a.outlet}: {item.source_a.position} · {item.source_b.outlet}: {item.source_b.position}</p>
                </li>
              ))}
            </ul>
          </div>
        )}

        {fullReport && verification.omissions.length > 0 && (
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground/80">What's missing elsewhere</h3>
            <ul className="mt-2 space-y-2 text-sm text-foreground/90">
              {verification.omissions.map((item) => (
                <li key={item.fact}>{item.fact} <span className="text-xs text-muted-foreground">Reported by {item.reported_by.join(", ")}; missing from {item.missing_from.join(", ")}.</span></li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}