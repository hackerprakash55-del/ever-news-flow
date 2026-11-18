import { useParams } from "react-router-dom";
import { LocalFeedPage } from "@/components/LocalFeedPage";
import { ALERT_TOPICS, LOCAL_PLACES, findPlace } from "@/data/localPages";
import NotFound from "./NotFound";

export default function LocalNewsPage() {
  const { slug } = useParams();
  if (!slug) {
    return (
      <LocalFeedPage
        title="Local news from Indian cities"
        hindiTitle="आपके शहर की ताज़ा ख़बरें"
        description="Today's news from 60 Indian cities, updated every few minutes. Pick your city for local reporting in English and Hindi."
        path="/local"
        location="India"
        eyebrow="Local"
        relatedTitle="Choose your city"
        related={LOCAL_PLACES.map((p) => ({ label: `${p.name} · ${p.hindi}`, href: `/local/${p.slug}` }))}
      />
    );
  }
  const place = findPlace(slug);
  if (!place) return <NotFound />;
  const nearby = LOCAL_PLACES.filter((p) => p.state === place.state && p.slug !== place.slug);
  return (
    <LocalFeedPage
      key={place.slug}
      title={`What happened in ${place.name} today`}
      hindiTitle={`आज ${place.hindi} में क्या हुआ`}
      description={`Latest ${place.name} news today: local reports from ${place.name}, ${place.state}, updated every few minutes. ${place.hindi} की ताज़ा ख़बरें।`}
      path={`/local/${place.slug}`}
      location={place.name}
      match={[place.name, place.hindi]}
      eyebrow={place.state}
      relatedTitle={nearby.length ? `More from ${place.state} and alerts` : "Alerts and other cities"}
      related={[
        ...nearby.map((p) => ({ label: p.name, href: `/local/${p.slug}` })),
        ...ALERT_TOPICS.map((a) => ({ label: a.title, href: `/alerts/${a.slug}` })),
        { label: "All cities", href: "/local" },
      ]}
    />
  );
}
