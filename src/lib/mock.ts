import type { Account, AdRow } from "./types";

// Datos de demo para desarrollar sin backend. Deterministas por cuenta/período.

export const MOCK_ACCOUNTS: Account[] = [
  { id: "act_1000000000001", name: "Demo Skincare", currency: "USD", status: "active" },
  { id: "act_1000000000002", name: "Demo Indumentaria", currency: "USD", status: "active" },
];

const NAMES = [
  "Video - Rutina antiacné", "Video_Emulsión UGC", "Imagen - Black Week", "Video - Desodorante natural",
  "Carrusel - Kit piel sensible", "Video_Testimonio Sofi", "Imagen - Antes y después", "Video - Unboxing",
  "Video_Hook pregunta", "Imagen - Ingredientes orgánicos", "Video - Rosácea", "Imagen - Promo 2x1",
  "Video_Calming gel", "Video - Dermatóloga", "Imagen - Envío gratis", "Video_Rutina noche",
  "Carrusel - Más vendidos", "Video - POV piel grasa", "Imagen - Reseñas 5★", "Video_Bálsamo",
  "Video - Green screen", "Imagen - Lanzamiento", "Video_Comparativa", "Imagen - Cupón",
];

const CAMPAIGNS = [
  { name: "[CONV] Prospecting - Advantage+", adsets: ["Broad 25-55", "Intereses skincare"] },
  { name: "[CONV] Retargeting 30d", adsets: ["Visitantes web", "Carrito abandonado"] },
  { name: "[TOF] Video views", adsets: ["Lookalike 1% compradores"] },
];

function rng(seed: number) {
  return () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };
}

function hash(s: string) {
  let h = 2166136261;
  for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return h >>> 0;
}

function thumb(i: number, label: string) {
  const hue = (i * 47) % 360;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160">
<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
<stop offset="0" stop-color="hsl(${hue},70%,55%)"/><stop offset="1" stop-color="hsl(${(hue + 60) % 360},70%,35%)"/>
</linearGradient></defs><rect width="160" height="160" fill="url(#g)"/>
<text x="80" y="96" font-family="sans-serif" font-size="44" font-weight="700" fill="white" text-anchor="middle">${label}</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export function mockAds(accountId: string, days: number): AdRow[] {
  const rand = rng(hash(accountId));
  return NAMES.map((name, i) => {
    const isVideo = name.startsWith("Video");
    const spend = Math.round(rand() * 60 * days) + 20;
    const impressions = Math.round(spend * (8 + rand() * 10));
    const link_clicks = Math.round(impressions * (0.006 + rand() * 0.022));
    const purchases = Math.round(spend / (8 + rand() * 14));
    const purchase_value = Math.round(purchases * (25 + rand() * 30));
    const c = CAMPAIGNS[i % CAMPAIGNS.length];
    const cIdx = i % CAMPAIGNS.length;
    const sIdx = Math.floor(i / CAMPAIGNS.length) % c.adsets.length;
    return {
      ad_id: `${accountId}-${i}`,
      ad_name: name,
      campaign_id: `${accountId}-c${cIdx}`,
      campaign_name: c.name,
      adset_id: `${accountId}-c${cIdx}-s${sIdx}`,
      adset_name: c.adsets[sIdx],
      status: rand() > 0.25 ? "ACTIVE" : "ADSET_PAUSED",
      preview_url: null,
      thumbnail_url: thumb(i, name.replace(/^(Video|Imagen|Carrusel)[ _-]+/, "").slice(0, 2).toUpperCase()),
      object_type: isVideo ? "VIDEO" : "SHARE",
      is_video: isVideo,
      spend,
      impressions,
      link_clicks,
      purchases,
      purchase_value,
      leads: Math.round(link_clicks * (0.02 + rand() * 0.08)),
    };
  });
}
