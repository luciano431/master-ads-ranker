import type { AdRow, ConversionType } from "./types";

export type MetricKey =
  | "spend"
  | "revenue"
  | "roas"
  | "cpa"
  | "conversions"
  | "impressions"
  | "ctr"
  | "cpc";

export type Ad = AdRow & {
  revenue: number;
  conversions: number;
  roas: number | null;
  cpa: number | null;
  ctr: number | null;
  cpc: number | null;
};

type Format = "money" | "ratio" | "percent" | "int";

export const METRICS: Record<MetricKey, { label: string; format: Format; higherIsBetter: boolean }> = {
  spend: { label: "Spend", format: "money", higherIsBetter: true },
  revenue: { label: "Revenue", format: "money", higherIsBetter: true },
  roas: { label: "ROAS", format: "ratio", higherIsBetter: true },
  cpa: { label: "CPA", format: "money", higherIsBetter: false },
  conversions: { label: "Conv.", format: "int", higherIsBetter: true },
  impressions: { label: "Impresiones", format: "int", higherIsBetter: true },
  ctr: { label: "CTR", format: "percent", higherIsBetter: true },
  cpc: { label: "CPC", format: "money", higherIsBetter: false },
};

export const METRIC_KEYS = Object.keys(METRICS) as MetricKey[];

const div = (a: number, b: number) => (b > 0 ? a / b : null);

// CTR y CPC usan link clicks (inline_link_clicks), no `clicks` crudo.
export function deriveAd(row: AdRow, conversion: ConversionType): Ad {
  const conversions = row[conversion];
  const revenue = row.purchase_value;
  return {
    ...row,
    revenue,
    conversions,
    roas: div(revenue, row.spend),
    cpa: div(row.spend, conversions),
    ctr: row.impressions > 0 ? (row.link_clicks / row.impressions) * 100 : null,
    cpc: div(row.spend, row.link_clicks),
  };
}

// ROAS promedio = revenue total / gasto total (ponderado por gasto),
// no el promedio simple de los ROAS de cada anuncio.
export function summarize(ads: Ad[]) {
  const spend = ads.reduce((s, a) => s + a.spend, 0);
  const revenue = ads.reduce((s, a) => s + a.revenue, 0);
  const conversions = ads.reduce((s, a) => s + a.conversions, 0);
  return {
    count: ads.filter((a) => a.impressions > 0).length,
    spend,
    revenue,
    conversions,
    roas: div(revenue, spend),
    cpa: div(spend, conversions),
  };
}

export function formatMetric(key: MetricKey, value: number | null, currency: string, compact = false) {
  if (value === null || !Number.isFinite(value)) return "—";
  switch (METRICS[key].format) {
    case "money":
      return new Intl.NumberFormat("es-AR", {
        style: "currency",
        currency,
        maximumFractionDigits: compact || value >= 1000 ? 0 : 2,
        notation: compact ? "compact" : "standard",
      }).format(value);
    case "ratio":
      return `${value.toFixed(2)}x`;
    case "percent":
      return `${value.toFixed(2)}%`;
    case "int":
      return new Intl.NumberFormat("es-AR", { notation: compact ? "compact" : "standard" }).format(value);
  }
}

// Opciones de filtro (campañas o conjuntos) ordenadas por gasto, a partir de los anuncios.
export function groupOptions(ads: Ad[], idKey: "campaign_id" | "adset_id", nameKey: "campaign_name" | "adset_name") {
  const map = new Map<string, { id: string; name: string; spend: number }>();
  for (const a of ads) {
    const g = map.get(a[idKey]) ?? { id: a[idKey], name: a[nameKey], spend: 0 };
    g.spend += a.spend;
    map.set(a[idKey], g);
  }
  return [...map.values()].sort((a, b) => b.spend - a.spend);
}
