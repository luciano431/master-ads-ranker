// Edge Function: creative-analytics
//
// Separada de `meta-ads` a propósito: no modifica la función que usa el
// dashboard de producción. Reutiliza el mismo secreto META_ACCESS_TOKEN.
//
// POST { mode: "accounts" }
//   -> { accounts: [{ id, name, currency, status }] }
// POST { mode: "ads", account_id, since, until }
//   -> { ads: AdRow[] }   (métricas crudas; CPA/ROAS/CTR/CPC se derivan en el front)

const META_API_VERSION = Deno.env.get("META_API_VERSION") ?? "v23.0";
const GRAPH = `https://graph.facebook.com/${META_API_VERSION}`;
const TOKEN = Deno.env.get("META_ACCESS_TOKEN") ?? "";

// Opcional: lista separada por comas de cuentas permitidas (act_123,act_456).
const ALLOWED = (Deno.env.get("ALLOWED_ACCOUNT_IDS") ?? "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Meta reporta la misma compra bajo varios action_type (omni, pixel, onsite).
// Tomamos el primero presente en este orden para no contar dos veces.
const PURCHASE_TYPES = [
  "omni_purchase",
  "purchase",
  "offsite_conversion.fb_pixel_purchase",
  "onsite_web_purchase",
];
const LEAD_TYPES = [
  "lead",
  "onsite_conversion.lead_grouped",
  "offsite_conversion.fb_pixel_lead",
];

type Action = { action_type: string; value: string };

function pick(list: Action[] | undefined, types: string[]): number {
  if (!list) return 0;
  for (const t of types) {
    const hit = list.find((a) => a.action_type === t);
    if (hit) return Number(hit.value) || 0;
  }
  return 0;
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}

async function graph(path: string, params: Record<string, string>) {
  const url = new URL(path.startsWith("http") ? path : `${GRAPH}/${path}`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  url.searchParams.set("access_token", TOKEN);
  const res = await fetch(url);
  const body = await res.json();
  if (!res.ok || body.error) {
    throw new Error(body.error?.message ?? `Meta API ${res.status}`);
  }
  return body;
}

// Recorre la paginación de Meta (paging.next ya trae el token y los params).
async function graphAll(path: string, params: Record<string, string>, max = 5000) {
  const out: any[] = [];
  let page = await graph(path, params);
  out.push(...(page.data ?? []));
  while (page.paging?.next && out.length < max) {
    const res = await fetch(page.paging.next);
    page = await res.json();
    if (page.error) throw new Error(page.error.message);
    out.push(...(page.data ?? []));
  }
  return out;
}

// Caché por isolate: evita golpear Meta al cambiar de métrica o recargar.
const CACHE_TTL_MS = 10 * 60 * 1000;
const cache = new Map<string, { at: number; value: unknown }>();
async function cached<T>(key: string, fn: () => Promise<T>): Promise<T> {
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < CACHE_TTL_MS) return hit.value as T;
  const value = await fn();
  cache.set(key, { at: Date.now(), value });
  return value;
}

async function listAccounts() {
  const rows = await graphAll("me/adaccounts", {
    fields: "id,name,currency,account_status",
    limit: "200",
  });
  return rows
    .filter((a) => ALLOWED.length === 0 || ALLOWED.includes(a.id))
    .map((a) => ({
      id: a.id as string,
      name: a.name as string,
      currency: a.currency as string,
      status: a.account_status === 1 ? "active" : "inactive",
    }));
}

// Thumbnails: 1 request por cada 50 ads usando ?ids=, en paralelo.
// thumbnail_width/height pide una miniatura usable (por defecto Meta da 64x64).
async function fetchCreatives(adIds: string[]) {
  const chunks: string[][] = [];
  for (let i = 0; i < adIds.length; i += 50) chunks.push(adIds.slice(i, i + 50));
  const results = await Promise.all(
    chunks.map((ids) =>
      graph("", {
        ids: ids.join(","),
        fields:
          "effective_status,preview_shareable_link," +
          "creative.thumbnail_width(320).thumbnail_height(320){thumbnail_url,image_url,object_type,video_id}",
      }),
    ),
  );
  const map = new Map<string, any>();
  for (const r of results) for (const [id, ad] of Object.entries(r)) map.set(id, ad);
  return map;
}

async function listAds(accountId: string, since: string, until: string) {
  const insights = await graphAll(`${accountId}/insights`, {
    level: "ad",
    fields: "ad_id,ad_name,spend,impressions,inline_link_clicks,actions,action_values",
    time_range: JSON.stringify({ since, until }),
    limit: "500",
  });

  const creatives = await fetchCreatives(insights.map((r) => r.ad_id));

  return insights.map((r) => {
    const ad = creatives.get(r.ad_id) ?? {};
    const creative = ad.creative ?? {};
    return {
      ad_id: r.ad_id as string,
      ad_name: r.ad_name as string,
      status: (ad.effective_status ?? "UNKNOWN") as string,
      preview_url: (ad.preview_shareable_link ?? null) as string | null,
      thumbnail_url: (creative.thumbnail_url ?? creative.image_url ?? null) as string | null,
      object_type: (creative.object_type ?? null) as string | null,
      is_video: Boolean(creative.video_id) || creative.object_type === "VIDEO",
      spend: Number(r.spend) || 0,
      impressions: Number(r.impressions) || 0,
      link_clicks: Number(r.inline_link_clicks) || 0,
      purchases: pick(r.actions, PURCHASE_TYPES),
      purchase_value: pick(r.action_values, PURCHASE_TYPES),
      leads: pick(r.actions, LEAD_TYPES),
    };
  });
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const ACCOUNT_RE = /^act_\d+$/;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  if (!TOKEN) return json({ error: "META_ACCESS_TOKEN no configurado" }, 500);

  try {
    const body = await req.json();

    if (body.mode === "accounts") {
      const accounts = await cached("accounts", listAccounts);
      return json({ accounts });
    }

    if (body.mode === "ads") {
      const accountId = String(body.account_id ?? "");
      const id = accountId.startsWith("act_") ? accountId : `act_${accountId}`;
      const { since, until } = body;
      if (!ACCOUNT_RE.test(id)) return json({ error: "account_id inválido" }, 400);
      if (!DATE_RE.test(since) || !DATE_RE.test(until)) {
        return json({ error: "since/until deben ser YYYY-MM-DD" }, 400);
      }
      if (ALLOWED.length > 0 && !ALLOWED.includes(id)) {
        return json({ error: "Cuenta no permitida" }, 403);
      }
      const ads = await cached(`ads:${id}:${since}:${until}`, () => listAds(id, since, until));
      return json({ ads });
    }

    return json({ error: "mode desconocido" }, 400);
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : String(err) }, 502);
  }
});
