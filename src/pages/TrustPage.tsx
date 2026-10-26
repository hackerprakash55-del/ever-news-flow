import { Link, useLocation } from "react-router-dom";
import { SeoHead } from "@/components/SeoHead";

// Contact details below are placeholders until the owner supplies real ones.
const CONTACT_EMAIL = "";
const UPDATED = "26 October 2026";

type Page = { title: string; description: string; body: JSX.Element };

const contactLine = CONTACT_EMAIL
  ? <>Email: <a className="text-primary underline" href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a></>
  : <>Contact email: being set up — it will be published here shortly.</>;

const PAGES: Record<string, Page> = {
  about: {
    title: "About GAINN",
    description: "GAINN is an AI-assisted Indian news service: live local and national news, sources shown, in Hindi and 10 Indian languages, read aloud.",
    body: (
      <>
        <p>GAINN is an independent, AI-assisted news service from India, founded by Prakash. We gather live Indian and local news from established publishers, summarise it, translate it into Hindi and 10 other Indian languages, and read it aloud.</p>
        <h2>How we work</h2>
        <ul>
          <li>Every story links to its original report and names the outlet.</li>
          <li>We only show a "Verified" label when at least three independent outlets report the same core facts. Otherwise a story is marked "Single source" or "Developing".</li>
          <li>Summaries, translations and narration are produced with AI tools. They can contain mistakes — please report them on our <Link to="/corrections">Corrections</Link> page.</li>
          <li>We do not invent quotes, numbers or scores.</li>
        </ul>
      </>
    ),
  },
  contact: {
    title: "Contact GAINN",
    description: "How to reach the GAINN team.",
    body: (<><p>{contactLine}</p><p>For complaints about content, see our <Link to="/grievance">Grievance Officer</Link> page.</p></>),
  },
  grievance: {
    title: "Grievance Officer",
    description: "GAINN's grievance redressal process under India's IT Rules, 2021.",
    body: (
      <>
        <p>In line with the Information Technology (Intermediary Guidelines and Digital Media Ethics Code) Rules, 2021, GAINN has appointed a Grievance Officer based in India.</p>
        <p><strong>Grievance Officer:</strong> Prakash, Founder, GAINN<br />{contactLine}</p>
        <h2>Process</h2>
        <ul>
          <li>We acknowledge complaints within 24 hours.</li>
          <li>We decide on and respond to every complaint within 15 days.</li>
          <li>Please include the story link, what is wrong, and how to reach you.</li>
        </ul>
      </>
    ),
  },
  corrections: {
    title: "Corrections policy",
    description: "How GAINN corrects mistakes in AI-assisted news.",
    body: (
      <>
        <p>We correct errors quickly and openly. If a summary, translation, narration or headline misstates the original report, tell us with the story link.</p>
        <p>{contactLine}</p>
        <p>When we correct a story we update it and note that it was corrected. If the original source changes its report, we follow it.</p>
      </>
    ),
  },
  privacy: {
    title: "Privacy policy",
    description: "What data GAINN collects and why.",
    body: (
      <>
        <p>You can read GAINN without an account. If you sign in, we store your email, display name, saved articles, language and topic preferences so we can personalise your feed.</p>
        <p>We record basic reading activity (for example which stories you open) to improve recommendations. We do not sell personal data.</p>
        <p>Text you ask us to translate or narrate is sent to our language and voice providers only to produce that output.</p>
        <p>To delete your account or data, contact us: {contactLine}</p>
      </>
    ),
  },
  terms: {
    title: "Terms of use",
    description: "Terms for using GAINN.",
    body: (
      <>
        <p>GAINN provides AI-assisted summaries of reporting by other publishers, with links to the originals. Summaries are for information only; rely on the original report for important decisions.</p>
        <p>Headlines and articles belong to their original publishers. Do not copy GAINN content for commercial use without permission.</p>
      </>
    ),
  },
};

export default function TrustPage() {
  const slug = useLocation().pathname.replace(/^\//, "") || "about";
  const page = PAGES[slug] ?? PAGES.about;
  return (
    <main className="max-w-3xl mx-auto px-4 md:px-6 py-16">
      <SeoHead title={`${page.title} — GAINN`} description={page.description} path={`/${slug}`} />
      <h1 className="font-display text-4xl font-bold mb-2">{page.title}</h1>
      <p className="text-xs text-muted-foreground mb-8">Last updated {UPDATED}</p>
      <div className="space-y-4 text-muted-foreground leading-relaxed [&_h2]:text-foreground [&_h2]:font-display [&_h2]:text-xl [&_h2]:mt-8 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-2 [&_strong]:text-foreground">
        {page.body}
      </div>
      <nav className="mt-12 flex flex-wrap gap-4 text-sm">
        {Object.keys(PAGES).map((k) => (
          <Link key={k} to={`/${k}`} className="text-primary hover:underline">{PAGES[k].title}</Link>
        ))}
        <Link to="/" className="text-primary hover:underline">Home</Link>
      </nav>
    </main>
  );
}
