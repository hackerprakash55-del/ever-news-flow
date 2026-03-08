// ============================================================
// GAINN Mock Data — Realistic news articles, agents, events
// ============================================================

export type Article = {
  id: string;
  headline: string;
  summary: string;
  body: string;
  category: string;
  credibilityScore: number;
  sources: string[];
  publishedAt: string;
  readTime: number;
  tags: string[];
  isBreaking: boolean;
  region: string;
  imageUrl?: string;
  aiGenerated: boolean;
  biasScore: number; // 0 = neutral, -1 = left, +1 = right
};

export type Agent = {
  id: string;
  name: string;
  department: string;
  status: "running" | "idle" | "processing" | "error";
  taskCount: number;
  currentTask: string;
  successRate: number;
  uptime: number;
  color: string;
};

export type PipelineEvent = {
  id: string;
  timestamp: string;
  type: "monitor" | "research" | "verify" | "editorial" | "publish" | "alert";
  agentId: string;
  agentName: string;
  message: string;
  status: "success" | "info" | "warning" | "error";
};

export type BreakingAlert = {
  id: string;
  text: string;
  region: string;
  severity: "breaking" | "urgent" | "developing";
};

export const CATEGORIES = [
  "All", "Technology", "Politics", "Science", "Economy",
  "Environment", "AI", "Global Affairs", "Health", "Space"
];

export const BREAKING_ALERTS: BreakingAlert[] = [
  { id: "1", text: "BREAKING: Global AI Summit reaches landmark agreement on autonomous systems governance", region: "Geneva", severity: "breaking" },
  { id: "2", text: "URGENT: Major tech company announces breakthrough in quantum computing — 1M qubit milestone", region: "San Francisco", severity: "urgent" },
  { id: "3", text: "DEVELOPING: Climate emergency declared in 12 nations as Arctic temperatures hit record high", region: "Arctic", severity: "developing" },
  { id: "4", text: "BREAKING: Central banks coordinate on global digital currency framework launch timeline", region: "Washington D.C.", severity: "breaking" },
  { id: "5", text: "URGENT: Mars mission discovers complex organic compounds — scientists call it 'revolutionary'", region: "NASA HQ", severity: "urgent" },
];

export const TICKER_ITEMS = [
  "🔴 LIVE: Global AI Summit Day 2 — 194 nations sign autonomous AI charter",
  "📊 Markets: S&P 500 +1.2% | NASDAQ +0.8% | Bitcoin $112,450 ▲3.4%",
  "🌍 UN Security Council emergency session on autonomous weapons ban",
  "🚀 SpaceX successfully lands first crew on lunar south pole",
  "🧬 Oxford researchers announce 96% effective universal cancer vaccine",
  "⚡ EU passes landmark AI Act — 72-hour compliance window for all systems",
  "🌊 Pacific heat dome event triggers atmospheric river across North America",
  "💊 FDA approves first AI-designed drug compound for clinical trials",
  "🏛️ US Senate passes Digital Privacy Protection Act 68-32",
  "🔬 CERN discovers fifth fundamental force of nature — peer review underway",
];

export const MOCK_ARTICLES: Article[] = [
  {
    id: "art-001",
    headline: "Global AI Summit Reaches Historic Agreement on Autonomous Systems Governance",
    summary: "Representatives from 194 nations signed the Geneva AI Accord, establishing the first internationally binding framework for the development and deployment of autonomous AI systems.",
    body: `In a landmark moment for global technology policy, delegates from 194 nations gathered at the Palais des Nations in Geneva signed the Geneva AI Accord — the world's first internationally binding framework for autonomous artificial intelligence systems.

The agreement, three years in the making, establishes clear guidelines for AI development, mandates transparency in training data, and creates an independent global oversight body headquartered in Zurich.

"This is not the end of AI innovation — it is the beginning of responsible AI civilization," said UN Secretary-General Dr. Amara Hassan, addressing a packed assembly hall.

Key provisions of the accord include mandatory impact assessments for AI systems affecting more than 10,000 people, a global AI incident reporting registry, and binding limits on autonomous weapons development. The framework also establishes a $50 billion international fund to help developing nations build sovereign AI capabilities.

Technology companies including major US, Chinese, and European AI labs have pledged compliance, though enforcement mechanisms remain a point of ongoing negotiation. Critics argue the accord lacks teeth without criminal penalties for violations.

The agreement comes amid escalating concerns about AI systems making consequential decisions in healthcare, justice, and national security without meaningful human oversight.`,
    category: "AI",
    credibilityScore: 97,
    sources: ["Reuters", "Associated Press", "BBC World", "UN Official Release"],
    publishedAt: "2026-03-08T09:15:00Z",
    readTime: 5,
    tags: ["AI Governance", "United Nations", "Technology Policy", "Geneva"],
    isBreaking: true,
    region: "Geneva, Switzerland",
    imageUrl: "https://images.unsplash.com/photo-1677442135703-1787eea5ce01?w=800&auto=format",
    aiGenerated: true,
    biasScore: 0.02,
  },
  {
    id: "art-002",
    headline: "Quantum Computing Milestone: IBM Achieves 1 Million Qubit Threshold",
    summary: "IBM's quantum research division announced achieving stable operation at one million qubits — a milestone long considered a prerequisite for practical quantum advantage over classical supercomputers.",
    body: `IBM Research today announced a quantum computing breakthrough that experts are calling the most significant advance in computing since the introduction of the transistor. The company's Condor-II processor has achieved stable, error-corrected operation at one million qubits — a threshold that theoretical physicists had projected would unlock practical quantum advantage.

The achievement effectively means certain classes of computational problems that would take classical supercomputers thousands of years can now be solved in hours or days.

Dr. Sarah Chen, IBM's Chief Quantum Officer, demonstrated the system solving a protein folding optimization problem that traditional computers could not complete within a human lifetime. The computation completed in 4.7 hours.

Implications span cryptography, pharmaceutical discovery, climate modeling, and materials science. Notably, the breakthrough renders current RSA encryption vulnerable — prompting the National Institute of Standards and Technology to accelerate its post-quantum cryptography standards rollout.

Financial markets responded immediately: quantum computing stocks surged an average of 34% on the news, while cybersecurity firms saw gains as enterprise customers rushed to assess their encryption exposure.`,
    category: "Technology",
    credibilityScore: 94,
    sources: ["IBM Research Blog", "Nature Quantum Information", "MIT Technology Review"],
    publishedAt: "2026-03-08T07:30:00Z",
    readTime: 6,
    tags: ["Quantum Computing", "IBM", "Technology", "Cryptography"],
    isBreaking: false,
    region: "Yorktown Heights, NY",
    imageUrl: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=800&auto=format",
    aiGenerated: true,
    biasScore: -0.01,
  },
  {
    id: "art-003",
    headline: "Arctic Temperature Anomaly Triggers Climate Emergency Declarations Across 12 Nations",
    summary: "Unprecedented warmth in the Arctic — 14°C above seasonal average — has triggered formal climate emergency declarations across 12 nations and prompted emergency UN Security Council consultations.",
    body: `The Arctic is experiencing what climatologists are describing as an "uncharted thermal event" with temperatures measuring 14.3 degrees Celsius above the 1990-2020 seasonal baseline. The anomaly, detected by the Global Climate Monitoring Network and confirmed by independent satellite analysis, has triggered formal climate emergency declarations in Norway, Iceland, Canada, Russia, Finland, Sweden, Denmark, Greenland, the United States, the Netherlands, Germany, and France.

The phenomenon is driving an atmospheric river formation over the North Atlantic that is expected to bring extreme precipitation events across Northern Europe and Eastern North America over the coming two weeks.

"We are observing a feedback cascade that our models projected for 2040 at the earliest," said Dr. Elena Vasquez of the Intergovernmental Panel on Climate Change. "The pace of change has significantly exceeded our worst-case scenarios."

The UN Security Council convened an emergency session, with the Secretary-General invoking Article 99 of the UN Charter — a rarely used provision that allows the Secretary-General to bring matters to the Council that threaten international peace and security.

Sea ice extent is currently at the lowest ever recorded for this date, with the Northwest Passage ice-free for the eighth consecutive winter — a condition last seen in geological records approximately 130,000 years ago.`,
    category: "Environment",
    credibilityScore: 96,
    sources: ["IPCC", "NOAA", "European Environment Agency", "NASA Earth Observatory"],
    publishedAt: "2026-03-08T06:45:00Z",
    readTime: 7,
    tags: ["Climate Change", "Arctic", "Emergency", "United Nations"],
    isBreaking: true,
    region: "Global",
    imageUrl: "https://images.unsplash.com/photo-1574267432553-4b4628081c31?w=800&auto=format",
    aiGenerated: true,
    biasScore: 0.04,
  },
  {
    id: "art-004",
    headline: "Federal Reserve Signals Coordinated Rate Policy Shift Amid Digital Currency Rollout",
    summary: "The Federal Reserve, in coordination with the ECB and Bank of Japan, announced a synchronized monetary policy framework adjustment tied to the planned introduction of central bank digital currencies.",
    body: `The Federal Reserve released a joint statement with the European Central Bank and Bank of Japan announcing a coordinated adjustment to monetary policy frameworks — a development economists describe as the most significant central banking coordination since the 2008 Bretton Woods II discussions.

The coordination is linked directly to the planned 2027 rollout of sovereign digital currencies by all three central banking authorities. The synchronized framework aims to prevent the currency arbitrage and capital flight risks that independent digital currency launches could trigger.

Federal Reserve Chair Jerome Chen stated that the digital currency transition creates "a once-in-a-century opportunity to design monetary systems with transparency and efficiency built in from the foundation."

The announcement sent bond markets on a sharp rally, with the 10-year US Treasury yield falling 18 basis points to 3.42%. Gold fell 1.8% while the US dollar index strengthened modestly.

Critics from both the progressive and libertarian camps raised concerns about privacy implications and the potential for unprecedented government visibility into financial transactions. Congressional hearings are expected to begin within the month.`,
    category: "Economy",
    credibilityScore: 93,
    sources: ["Federal Reserve", "ECB Press Release", "Financial Times", "Bloomberg"],
    publishedAt: "2026-03-08T08:00:00Z",
    readTime: 5,
    tags: ["Federal Reserve", "Digital Currency", "Monetary Policy", "Economy"],
    isBreaking: false,
    region: "Washington D.C.",
    imageUrl: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&auto=format",
    aiGenerated: true,
    biasScore: 0.01,
  },
  {
    id: "art-005",
    headline: "Mars Rover Discovers Complex Organic Compounds Suggesting Ancient Microbial Life",
    summary: "NASA's Perseverance II rover has confirmed the presence of complex aromatic organic compounds in subsurface rock samples — a discovery scientists say is the strongest evidence yet for ancient microbial life on Mars.",
    body: `In what NASA Administrator Dr. James Okafor called "the most significant discovery in the history of space exploration," the Perseverance II rover has confirmed the presence of complex polycyclic aromatic hydrocarbons and amino acid precursors in subsurface samples collected from Hellas Planitia — a region believed to have hosted liquid water three billion years ago.

The compounds, identified by the rover's mass spectrometer and confirmed through three independent analytical methods, are structurally consistent with biological rather than purely abiotic formation pathways.

"We are not announcing that we found life," Dr. Okafor emphasized at a press conference that drew over 2 billion live viewers globally. "We are announcing that we found the most compelling chemical evidence yet that life may once have existed on Mars."

The discovery has prompted NASA to accelerate its Mars Sample Return mission timeline. The agency is working with international partners to retrieve the samples for analysis in Earth-based laboratories, where more sophisticated testing can be conducted.

Astrobiologists note that confirming Martian life — even ancient, extinct microbial life — would be the most transformative scientific discovery in human history, reshaping our understanding of life's distribution in the universe.`,
    category: "Science",
    credibilityScore: 98,
    sources: ["NASA", "Science Journal", "Nature Astrobiology", "ESA"],
    publishedAt: "2026-03-08T05:20:00Z",
    readTime: 6,
    tags: ["Mars", "Space", "NASA", "Astrobiology", "Discovery"],
    isBreaking: true,
    region: "NASA JPL, California",
    imageUrl: "https://images.unsplash.com/photo-1545156521-77bd85671d30?w=800&auto=format",
    aiGenerated: true,
    biasScore: -0.02,
  },
  {
    id: "art-006",
    headline: "Universal Cancer Vaccine Shows 96% Efficacy in Phase III Trials",
    summary: "A broad-spectrum mRNA cancer vaccine developed by Oxford-BioNTech demonstrates 96% efficacy across 12 cancer types in the largest oncology trial ever conducted, with regulatory approval expected within months.",
    body: `Oxford University and BioNTech jointly announced results from the largest oncology clinical trial in history: a universal cancer vaccine has demonstrated 96% efficacy across 12 cancer types in a Phase III study involving 127,000 participants across 28 countries.

The vaccine, designated OBV-23, uses a novel mRNA platform that trains the immune system to recognize and destroy cancer cells across multiple tumor types — including previously treatment-resistant pancreatic, lung, and glioblastoma cancers.

The trial results, simultaneously published in the New England Journal of Medicine and The Lancet, show that participants receiving OBV-23 had a 96.3% reduction in tumor progression at 18 months compared to standard of care alone.

"This represents the convergence of decades of research into mRNA technology, immunology, and AI-assisted drug design," said lead researcher Professor Amelia Wong. "We believe we are looking at the end of cancer as a death sentence."

The UK Medicines and Healthcare products Regulatory Agency has granted priority review status, with approval possible within six months. The FDA is expected to follow suit. Manufacturing agreements are already in place to produce 500 million doses in the first year.`,
    category: "Health",
    credibilityScore: 97,
    sources: ["New England Journal of Medicine", "The Lancet", "Oxford University Press Release"],
    publishedAt: "2026-03-08T04:00:00Z",
    readTime: 6,
    tags: ["Cancer", "Vaccine", "mRNA", "Oxford", "Medical Breakthrough"],
    isBreaking: false,
    region: "Oxford, UK",
    imageUrl: "https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=800&auto=format",
    aiGenerated: true,
    biasScore: 0.0,
  },
];

export const AGENTS: Agent[] = [
  // Global Monitoring Agents
  { id: "gm-01", name: "Monitor Alpha", department: "Global Monitoring", status: "running", taskCount: 2847, currentTask: "Scanning 847 RSS feeds", successRate: 99.2, uptime: 99.8, color: "#0ea5e9" },
  { id: "gm-02", name: "Monitor Beta", department: "Global Monitoring", status: "running", taskCount: 1923, currentTask: "Twitter trend analysis", successRate: 98.7, uptime: 99.5, color: "#0ea5e9" },
  { id: "gm-03", name: "Monitor Gamma", department: "Global Monitoring", status: "processing", taskCount: 3102, currentTask: "Government press releases", successRate: 99.5, uptime: 100, color: "#0ea5e9" },
  { id: "gm-04", name: "Monitor Delta", department: "Global Monitoring", status: "running", taskCount: 2156, currentTask: "Scientific journal monitoring", successRate: 98.9, uptime: 99.7, color: "#0ea5e9" },
  { id: "gm-05", name: "Monitor Epsilon", department: "Global Monitoring", status: "running", taskCount: 1789, currentTask: "Financial market feeds", successRate: 99.1, uptime: 99.9, color: "#0ea5e9" },
  { id: "gm-06", name: "Monitor Zeta", department: "Global Monitoring", status: "idle", taskCount: 987, currentTask: "Waiting for trigger", successRate: 97.3, uptime: 98.2, color: "#0ea5e9" },
  { id: "gm-07", name: "Monitor Eta", department: "Global Monitoring", status: "running", taskCount: 2341, currentTask: "Social media sentiment", successRate: 98.4, uptime: 99.4, color: "#0ea5e9" },
  { id: "gm-08", name: "Monitor Theta", department: "Global Monitoring", status: "running", taskCount: 1654, currentTask: "Satellite imagery alerts", successRate: 99.0, uptime: 99.6, color: "#0ea5e9" },
  // Research Intelligence Agents
  { id: "ri-01", name: "Research Alpha", department: "Research Intelligence", status: "processing", taskCount: 1456, currentTask: "Geneva AI Accord deep dive", successRate: 97.8, uptime: 99.2, color: "#8b5cf6" },
  { id: "ri-02", name: "Research Beta", department: "Research Intelligence", status: "running", taskCount: 892, currentTask: "Quantum computing context", successRate: 98.2, uptime: 99.0, color: "#8b5cf6" },
  { id: "ri-03", name: "Research Gamma", department: "Research Intelligence", status: "running", taskCount: 1203, currentTask: "Arctic climate background", successRate: 96.9, uptime: 98.7, color: "#8b5cf6" },
  { id: "ri-04", name: "Research Delta", department: "Research Intelligence", status: "idle", taskCount: 743, currentTask: "Queue processing", successRate: 97.5, uptime: 99.1, color: "#8b5cf6" },
  { id: "ri-05", name: "Research Epsilon", department: "Research Intelligence", status: "processing", taskCount: 1087, currentTask: "Mars discovery analysis", successRate: 98.6, uptime: 99.4, color: "#8b5cf6" },
  // Fact Verification Agents
  { id: "fv-01", name: "Verifier Alpha", department: "Fact Verification", status: "running", taskCount: 3291, currentTask: "Cross-referencing IBM claims", successRate: 99.7, uptime: 99.9, color: "#f59e0b" },
  { id: "fv-02", name: "Verifier Beta", department: "Fact Verification", status: "running", taskCount: 2876, currentTask: "Source credibility scoring", successRate: 99.4, uptime: 99.8, color: "#f59e0b" },
  { id: "fv-03", name: "Verifier Gamma", department: "Fact Verification", status: "processing", taskCount: 1987, currentTask: "Misinformation detection sweep", successRate: 99.8, uptime: 100, color: "#f59e0b" },
  { id: "fv-04", name: "Verifier Delta", department: "Fact Verification", status: "running", taskCount: 2134, currentTask: "Statistics validation", successRate: 99.1, uptime: 99.7, color: "#f59e0b" },
  { id: "fv-05", name: "Verifier Epsilon", department: "Fact Verification", status: "idle", taskCount: 1243, currentTask: "Standby mode", successRate: 98.9, uptime: 99.2, color: "#f59e0b" },
  // Editorial Agents
  { id: "ed-01", name: "Editor Alpha", department: "Editorial", status: "processing", taskCount: 892, currentTask: "Reviewing Arctic article", successRate: 99.1, uptime: 99.6, color: "#06b6d4" },
  { id: "ed-02", name: "Editor Beta", department: "Editorial", status: "running", taskCount: 743, currentTask: "Bias detection scan", successRate: 98.7, uptime: 99.3, color: "#06b6d4" },
  { id: "ed-03", name: "Editor Gamma", department: "Editorial", status: "running", taskCount: 1102, currentTask: "Headline optimization", successRate: 99.3, uptime: 99.8, color: "#06b6d4" },
  // Reporter Agents
  { id: "rp-01", name: "Reporter Alpha", department: "Reporter", status: "running", taskCount: 534, currentTask: "Writing quantum computing piece", successRate: 97.4, uptime: 99.0, color: "#10b981" },
  { id: "rp-02", name: "Reporter Beta", department: "Reporter", status: "processing", taskCount: 612, currentTask: "Mars article generation", successRate: 98.1, uptime: 99.3, color: "#10b981" },
  { id: "rp-03", name: "Reporter Gamma", department: "Reporter", status: "running", taskCount: 489, currentTask: "Economic analysis piece", successRate: 97.8, uptime: 98.9, color: "#10b981" },
  { id: "rp-04", name: "Reporter Delta", department: "Reporter", status: "idle", taskCount: 378, currentTask: "Queue: 3 pending", successRate: 97.2, uptime: 98.5, color: "#10b981" },
  // Data & Analysis Agents
  { id: "da-01", name: "Analyst Alpha", department: "Data Analysis", status: "running", taskCount: 1876, currentTask: "Economic trend modeling", successRate: 98.4, uptime: 99.5, color: "#f97316" },
  { id: "da-02", name: "Analyst Beta", department: "Data Analysis", status: "processing", taskCount: 1234, currentTask: "Political sentiment analysis", successRate: 97.9, uptime: 99.1, color: "#f97316" },
  { id: "da-03", name: "Analyst Gamma", department: "Data Analysis", status: "running", taskCount: 956, currentTask: "Climate data correlation", successRate: 98.7, uptime: 99.4, color: "#f97316" },
  // Media Production Agents
  { id: "mp-01", name: "Media Alpha", department: "Media Production", status: "processing", taskCount: 234, currentTask: "Generating AI Summit thumbnail", successRate: 96.8, uptime: 98.7, color: "#ec4899" },
  { id: "mp-02", name: "Media Beta", department: "Media Production", status: "running", taskCount: 187, currentTask: "Creating Mars infographic", successRate: 97.2, uptime: 99.0, color: "#ec4899" },
  { id: "mp-03", name: "Media Gamma", department: "Media Production", status: "idle", taskCount: 156, currentTask: "Batch render queue", successRate: 96.5, uptime: 98.4, color: "#ec4899" },
  // Ethics Agents
  { id: "eth-01", name: "Ethics Alpha", department: "Ethical Governance", status: "running", taskCount: 2987, currentTask: "Bias audit — AI Summit article", successRate: 99.9, uptime: 100, color: "#ef4444" },
  { id: "eth-02", name: "Ethics Beta", department: "Ethical Governance", status: "running", taskCount: 2143, currentTask: "Propaganda detection sweep", successRate: 99.8, uptime: 99.9, color: "#ef4444" },
];

export const PIPELINE_EVENTS: PipelineEvent[] = [
  { id: "evt-001", timestamp: "09:14:32", type: "alert", agentId: "gm-01", agentName: "Monitor Alpha", message: "Breaking: AI Accord signed — 194 nations. Confidence: 99%", status: "success" },
  { id: "evt-002", timestamp: "09:14:45", type: "research", agentId: "ri-01", agentName: "Research Alpha", message: "Initiating deep background research on Geneva AI Accord", status: "info" },
  { id: "evt-003", timestamp: "09:15:02", type: "verify", agentId: "fv-01", agentName: "Verifier Alpha", message: "Cross-referenced 4 primary sources — credibility: 97%", status: "success" },
  { id: "evt-004", timestamp: "09:15:18", type: "editorial", agentId: "ed-03", agentName: "Editor Gamma", message: "Bias score: +0.02 (near-neutral) — approved for publication", status: "success" },
  { id: "evt-005", timestamp: "09:15:31", type: "publish", agentId: "rp-01", agentName: "Reporter Alpha", message: "Article published: 'Global AI Summit Reaches Historic Agreement'", status: "success" },
  { id: "evt-006", timestamp: "09:15:48", type: "alert", agentId: "gm-03", agentName: "Monitor Gamma", message: "Alert: IBM quantum milestone press release detected", status: "info" },
  { id: "evt-007", timestamp: "09:16:03", type: "verify", agentId: "fv-03", agentName: "Verifier Gamma", message: "WARNING: Detecting 3 unverified claims in source material", status: "warning" },
  { id: "evt-008", timestamp: "09:16:15", type: "research", agentId: "ri-02", agentName: "Research Beta", message: "Pulling quantum computing context from knowledge base", status: "info" },
  { id: "evt-009", timestamp: "09:16:44", type: "verify", agentId: "fv-01", agentName: "Verifier Alpha", message: "IBM claims verified via Nature Quantum Information. Credibility: 94%", status: "success" },
  { id: "evt-010", timestamp: "09:17:02", type: "publish", agentId: "rp-02", agentName: "Reporter Beta", message: "Article queued: 'IBM Achieves 1M Qubit Threshold'", status: "success" },
  { id: "evt-011", timestamp: "09:17:20", type: "alert", agentId: "gm-08", agentName: "Monitor Theta", message: "NOAA satellite data: Arctic temp +14.3°C anomaly confirmed", status: "warning" },
  { id: "evt-012", timestamp: "09:17:45", type: "editorial", agentId: "eth-01", agentName: "Ethics Alpha", message: "Climate article audit: balanced framing confirmed", status: "success" },
];

export const DEPARTMENT_STATS = [
  { name: "Global Monitoring", agents: 20, active: 19, tasks: 12847, color: "#0ea5e9" },
  { name: "Research Intelligence", agents: 20, active: 18, tasks: 8932, color: "#8b5cf6" },
  { name: "Fact Verification", agents: 15, active: 15, tasks: 11287, color: "#f59e0b" },
  { name: "Editorial", agents: 10, active: 9, tasks: 4521, color: "#06b6d4" },
  { name: "Reporter", agents: 15, active: 13, tasks: 2987, color: "#10b981" },
  { name: "Data Analysis", agents: 10, active: 10, tasks: 7654, color: "#f97316" },
  { name: "Media Production", agents: 10, active: 7, tasks: 1234, color: "#ec4899" },
  { name: "Video Production", agents: 10, active: 8, tasks: 876, color: "#a855f7" },
  { name: "Social Distribution", agents: 5, active: 5, tasks: 4321, color: "#14b8a6" },
  { name: "Ethical Governance", agents: 5, active: 5, tasks: 9876, color: "#ef4444" },
];

export const WORLD_NEWS_PINS = [
  { id: "pin-1", lat: 46.2, lng: 6.1, label: "AI Summit — Geneva", severity: "breaking" as const, region: "Europe" },
  { id: "pin-2", lat: 40.7, lng: -74.0, label: "Fed Rate Decision", severity: "urgent" as const, region: "North America" },
  { id: "pin-3", lat: 71.0, lng: 25.0, label: "Arctic Emergency", severity: "breaking" as const, region: "Arctic" },
  { id: "pin-4", lat: 34.0, lng: -118.2, label: "IBM Quantum Milestone", severity: "urgent" as const, region: "North America" },
  { id: "pin-5", lat: 51.5, lng: -0.1, label: "Cancer Vaccine Trial", severity: "urgent" as const, region: "Europe" },
  { id: "pin-6", lat: 35.7, lng: 139.7, label: "Nikkei Record High", severity: "developing" as const, region: "Asia" },
  { id: "pin-7", lat: 28.6, lng: 77.2, label: "Tech Corridor Expansion", severity: "developing" as const, region: "Asia" },
  { id: "pin-8", lat: -33.9, lng: 18.4, label: "Climate Summit", severity: "developing" as const, region: "Africa" },
];
