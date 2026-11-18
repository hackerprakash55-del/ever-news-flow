import { useParams } from "react-router-dom";
import { LocalFeedPage } from "@/components/LocalFeedPage";
import { ALERT_TOPICS, LOCAL_PLACES, findAlert } from "@/data/localPages";
import NotFound from "./NotFound";

export default function AlertsPage() {
  const { slug } = useParams();
  const others = (current?: string) => [
    ...ALERT_TOPICS.filter((a) => a.slug !== current).map((a) => ({ label: `${a.title} · ${a.hindi}`, href: `/alerts/${a.slug}` })),
    ...LOCAL_PLACES.slice(0, 12).map((p) => ({ label: p.name, href: `/local/${p.slug}` })),
  ];
  if (!slug) {
    return (
      <LocalFeedPage
        title="Public alerts for India"
        hindiTitle="सरकारी और ज़रूरी अलर्ट"
        description="Exam results, admit cards, government jobs, power cuts, school holidays, weather warnings, train updates and fuel prices — in one place, updated every few minutes."
        path="/alerts"
        location="India"
        q="result OR recruitment OR alert OR holiday declared"
        match={ALERT_TOPICS.flatMap((a) => a.match)}
        eyebrow="Alerts"
        relatedTitle="Alert topics"
        related={others()}
      />
    );
  }
  const topic = findAlert(slug);
  if (!topic) return <NotFound />;
  return (
    <LocalFeedPage
      key={topic.slug}
      title={`${topic.title} today`}
      hindiTitle={`आज के ${topic.hindi}`}
      description={`${topic.blurb} Latest updates from Indian news reports, refreshed every few minutes. Always confirm dates on the official website.`}
      path={`/alerts/${topic.slug}`}
      location="India"
      q={topic.query}
      match={topic.match}
      eyebrow="Alerts"
      relatedTitle="More alerts and cities"
      related={others(topic.slug)}
    />
  );
}
