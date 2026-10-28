import { useState } from "react";
import { ArrowDownUp, Play } from "lucide-react";
import { formatMetric, METRICS, type Ad, type MetricKey } from "../lib/metrics";

const COLUMNS: MetricKey[] = ["spend", "revenue", "roas", "cpa", "conversions", "impressions", "ctr", "cpc"];

export function CreativeTable({ ads, currency }: { ads: Ad[]; currency: string }) {
  const [sort, setSort] = useState<{ key: MetricKey; desc: boolean }>({ key: "spend", desc: true });

  // Los nulos (ej. CPA sin conversiones) siempre van al final.
  const rows = [...ads].sort((a, b) => {
    const av = a[sort.key];
    const bv = b[sort.key];
    if (av === null) return 1;
    if (bv === null) return -1;
    return sort.desc ? bv - av : av - bv;
  });

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[900px] text-sm">
        <thead>
          <tr className="border-line text-muted border-b text-left text-[11px] tracking-wider uppercase">
            <th className="px-4 py-3 font-semibold">Anuncio</th>
            {COLUMNS.map((k) => (
              <th key={k} className="px-3 py-3 text-right font-semibold">
                <button
                  className="hover:text-ink inline-flex items-center gap-1"
                  onClick={() => setSort((s) => ({ key: k, desc: s.key === k ? !s.desc : true }))}
                >
                  {METRICS[k].label}
                  <ArrowDownUp size={12} className={sort.key === k ? "text-m1" : ""} aria-hidden />
                </button>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((ad, i) => (
            <tr key={ad.ad_id} className="border-line hover:bg-panel-2 border-b last:border-0">
              <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <span className="text-muted tabular w-5 text-right text-xs">{i + 1}</span>
                  <Thumb ad={ad} />
                  <div className="min-w-0">
                    <div className="text-ink max-w-64 truncate font-medium" title={ad.ad_name}>
                      {ad.ad_name}
                    </div>
                    <div className={`text-[11px] ${ad.status === "ACTIVE" ? "text-good" : "text-muted"}`}>
                      {statusLabel(ad.status)}
                    </div>
                  </div>
                </div>
              </td>
              {COLUMNS.map((k) => (
                <td key={k} className={`tabular px-3 py-3 text-right ${k === "roas" ? roasColor(ad.roas) : "text-ink"}`}>
                  {formatMetric(k, ad[k], currency)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// effective_status de Meta: ACTIVE, PAUSED, CAMPAIGN_PAUSED, ADSET_PAUSED, ARCHIVED, etc.
function statusLabel(status: string) {
  if (status === "ACTIVE") return "Activo";
  if (status.includes("PAUSED")) return "Pausado";
  if (status === "ARCHIVED" || status === "DELETED") return "Archivado";
  return status.toLowerCase().replace(/_/g, " ");
}

function roasColor(roas: number | null) {
  if (roas === null) return "text-muted";
  return roas >= 1 ? "text-good font-semibold" : "text-bad font-semibold";
}

function Thumb({ ad }: { ad: Ad }) {
  const img = ad.thumbnail_url ? (
    <img src={ad.thumbnail_url} alt="" loading="lazy" className="border-line h-11 w-11 rounded-md border object-cover" />
  ) : (
    <div className="bg-line h-11 w-11 rounded-md" />
  );
  const inner = (
    <div className="relative shrink-0">
      {img}
      {ad.is_video && (
        <span className="absolute right-0.5 bottom-0.5 rounded bg-black/70 p-0.5">
          <Play size={10} className="fill-white text-white" aria-label="Video" />
        </span>
      )}
    </div>
  );
  return ad.preview_url ? (
    <a href={ad.preview_url} target="_blank" rel="noreferrer" title="Ver anuncio en Meta">
      {inner}
    </a>
  ) : (
    inner
  );
}
