// City pages ("What happened in X today") and public-service alert topics.
// Each entry becomes a public, indexable page fed by live reporting.

export interface LocalPlace { slug: string; name: string; hindi: string; state: string }

const raw: [string, string, string][] = [
  ["Delhi","दिल्ली","Delhi"],["Mumbai","मुंबई","Maharashtra"],["Bengaluru","बेंगलुरु","Karnataka"],
  ["Kolkata","कोलकाता","West Bengal"],["Chennai","चेन्नई","Tamil Nadu"],["Hyderabad","हैदराबाद","Telangana"],
  ["Pune","पुणे","Maharashtra"],["Ahmedabad","अहमदाबाद","Gujarat"],["Jaipur","जयपुर","Rajasthan"],
  ["Lucknow","लखनऊ","Uttar Pradesh"],["Kanpur","कानपुर","Uttar Pradesh"],["Varanasi","वाराणसी","Uttar Pradesh"],
  ["Prayagraj","प्रयागराज","Uttar Pradesh"],["Agra","आगरा","Uttar Pradesh"],["Noida","नोएडा","Uttar Pradesh"],
  ["Ghaziabad","गाज़ियाबाद","Uttar Pradesh"],["Meerut","मेरठ","Uttar Pradesh"],["Gorakhpur","गोरखपुर","Uttar Pradesh"],
  ["Patna","पटना","Bihar"],["Gaya","गया","Bihar"],["Muzaffarpur","मुज़फ़्फ़रपुर","Bihar"],
  ["Bhopal","भोपाल","Madhya Pradesh"],["Indore","इंदौर","Madhya Pradesh"],["Gwalior","ग्वालियर","Madhya Pradesh"],
  ["Jabalpur","जबलपुर","Madhya Pradesh"],["Raipur","रायपुर","Chhattisgarh"],["Ranchi","रांची","Jharkhand"],
  ["Dhanbad","धनबाद","Jharkhand"],["Jodhpur","जोधपुर","Rajasthan"],["Udaipur","उदयपुर","Rajasthan"],
  ["Kota","कोटा","Rajasthan"],["Ajmer","अजमेर","Rajasthan"],["Bikaner","बीकानेर","Rajasthan"],
  ["Chandigarh","चंडीगढ़","Chandigarh"],["Ludhiana","लुधियाना","Punjab"],["Amritsar","अमृतसर","Punjab"],
  ["Gurugram","गुरुग्राम","Haryana"],["Faridabad","फ़रीदाबाद","Haryana"],["Dehradun","देहरादून","Uttarakhand"],
  ["Haridwar","हरिद्वार","Uttarakhand"],["Shimla","शिमला","Himachal Pradesh"],["Jammu","जम्मू","Jammu and Kashmir"],
  ["Srinagar","श्रीनगर","Jammu and Kashmir"],["Surat","सूरत","Gujarat"],["Vadodara","वडोदरा","Gujarat"],
  ["Rajkot","राजकोट","Gujarat"],["Nagpur","नागपुर","Maharashtra"],["Nashik","नासिक","Maharashtra"],
  ["Thane","ठाणे","Maharashtra"],["Goa","गोवा","Goa"],["Bhubaneswar","भुवनेश्वर","Odisha"],
  ["Guwahati","गुवाहाटी","Assam"],["Kochi","कोच्चि","Kerala"],["Thiruvananthapuram","तिरुवनंतपुरम","Kerala"],
  ["Coimbatore","कोयंबटूर","Tamil Nadu"],["Madurai","मदुरै","Tamil Nadu"],["Visakhapatnam","विशाखापत्तनम","Andhra Pradesh"],
  ["Vijayawada","विजयवाड़ा","Andhra Pradesh"],["Mysuru","मैसूरु","Karnataka"],["Siliguri","सिलीगुड़ी","West Bengal"],
];

export const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

export const LOCAL_PLACES: LocalPlace[] = raw.map(([name, hindi, state]) => ({ slug: slugify(name), name, hindi, state }));

export const findPlace = (slug?: string) => LOCAL_PLACES.find((p) => p.slug === slug);

export interface AlertTopic { slug: string; title: string; hindi: string; query: string; blurb: string; match: string[] }

export const ALERT_TOPICS: AlertTopic[] = [
  { slug: "exam-results", title: "Exam results", hindi: "परीक्षा परिणाम", query: "result declared board exam", blurb: "Board, university and competitive exam results as they are announced.", match: ["result","topper","merit list","परिणाम","रिजल्ट"] },
  { slug: "admit-cards", title: "Admit cards", hindi: "एडमिट कार्ड", query: "admit card released", blurb: "Admit card and hall ticket releases for upcoming exams.", match: ["admit card","hall ticket","एडमिट"] },
  { slug: "government-jobs", title: "Government jobs", hindi: "सरकारी नौकरी", query: "recruitment notification vacancies government", blurb: "New recruitment notifications, vacancies and application deadlines.", match: ["recruitment","vacanc","bharti","notification","भर्ती","नौकरी"] },
  { slug: "power-cuts", title: "Power cuts", hindi: "बिजली कटौती", query: "power cut outage electricity", blurb: "Scheduled and unplanned electricity outages reported across India.", match: ["power cut","outage","electricity","बिजली"] },
  { slug: "school-holidays", title: "School holidays", hindi: "स्कूल छुट्टी", query: "schools closed holiday declared", blurb: "School closures and holidays declared by states and districts.", match: ["school","holiday","closed","छुट्टी","स्कूल"] },
  { slug: "weather-alerts", title: "Weather alerts", hindi: "मौसम चेतावनी", query: "IMD alert warning weather", blurb: "IMD warnings for rain, heat, cold waves, fog and storms.", match: ["imd","rain","heatwave","cold wave","fog","cyclone","weather","मौसम","बारिश"] },
  { slug: "train-updates", title: "Train updates", hindi: "ट्रेन अपडेट", query: "trains cancelled diverted railways", blurb: "Cancelled, diverted and rescheduled trains and new services.", match: ["train","railway","रेल","ट्रेन"] },
  { slug: "fuel-and-lpg-prices", title: "Fuel & LPG prices", hindi: "पेट्रोल-डीज़ल, एलपीजी दाम", query: "petrol diesel LPG price", blurb: "Changes to petrol, diesel and cooking gas prices.", match: ["petrol","diesel","lpg","fuel","पेट्रोल","डीज़ल","सिलेंडर"] },
];

export const findAlert = (slug?: string) => ALERT_TOPICS.find((a) => a.slug === slug);

export const whatsappShareUrl = (headline: string, url: string) =>
  `https://wa.me/?text=${encodeURIComponent(`${headline}\n\n${url}`)}`;

/** Keep only stories that mention one of the keywords (headline, summary, tags or region). */
export function matchesKeywords(a: { headline: string; summary?: string; region?: string; tags?: string[] }, keywords: string[]) {
  const hay = `${a.headline} ${a.summary ?? ""} ${a.region ?? ""} ${(a.tags ?? []).join(" ")}`.toLowerCase();
  return keywords.some((k) => hay.includes(k.toLowerCase()));
}
