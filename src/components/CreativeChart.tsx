import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatMetric, METRICS, type Ad, type MetricKey } from "../lib/metrics";

type Props = { ads: Ad[]; m1: MetricKey; m2: MetricKey; currency: string };

const TICK_W = 46;

// Eje X con el thumbnail del creativo + nombre recortado.
function CreativeTick({ x, y, payload, ads }: { x?: number | string; y?: number | string; payload?: { value: string }; ads: Ad[] }) {
  const ad = ads.find((a) => a.ad_id === payload?.value);
  if (!ad || x === undefined || y === undefined) return null;
  x = Number(x);
  y = Number(y);
  return (
    <foreignObject x={x - TICK_W / 2} y={y + 4} width={TICK_W} height={64}>
      <div className="flex flex-col items-center gap-1">
        {ad.thumbnail_url ? (
          <img src={ad.thumbnail_url} alt="" className="border-line h-9 w-9 rounded-md border object-cover" />
        ) : (
          <div className="bg-line h-9 w-9 rounded-md" />
        )}
        <span className="text-muted w-full truncate text-center text-[10px]">{ad.ad_name}</span>
      </div>
    </foreignObject>
  );
}

function ChartTooltip({ active, payload, m1, m2, currency }: any) {
  if (!active || !payload?.length) return null;
  const ad: Ad = payload[0].payload;
  return (
    <div className="border-line bg-panel-2 rounded-lg border p-3 text-xs shadow-xl">
      <div className="text-ink mb-2 max-w-56 font-medium">{ad.ad_name}</div>
      {[m1, m2].map((k: MetricKey, i: number) => (
        <div key={k} className="flex items-center justify-between gap-6">
          <span className="text-muted flex items-center gap-1.5">
            <span className={`h-2 w-2 rounded-sm ${i === 0 ? "bg-m1" : "bg-m2"}`} />
            {METRICS[k].label}
          </span>
          <span className="tabular text-ink">{formatMetric(k, ad[k], currency)}</span>
        </div>
      ))}
    </div>
  );
}

export function CreativeChart({ ads, m1, m2, currency }: Props) {
  // Cada métrica tiene su propio eje: Spend y CPA, por ejemplo, viven en escalas distintas.
  return (
    <div className="h-[420px] w-full overflow-x-auto">
      <div style={{ minWidth: Math.max(ads.length * 52, 600), height: "100%" }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={ads} margin={{ top: 8, right: 8, left: 8, bottom: 8 }} barGap={2}>
            <CartesianGrid vertical={false} stroke="var(--color-line)" strokeDasharray="3 3" />
            <XAxis
              dataKey="ad_id"
              interval={0}
              height={72}
              tickLine={false}
              axisLine={{ stroke: "var(--color-line)" }}
              tick={(p) => <CreativeTick {...p} ads={ads} />}
            />
            <YAxis
              yAxisId="m1"
              tickLine={false}
              axisLine={false}
              width={64}
              tick={{ fill: "var(--color-m1)", fontSize: 11 }}
              tickFormatter={(v) => formatMetric(m1, v, currency, true)}
            />
            <YAxis
              yAxisId="m2"
              orientation="right"
              tickLine={false}
              axisLine={false}
              width={64}
              tick={{ fill: "var(--color-m2)", fontSize: 11 }}
              tickFormatter={(v) => formatMetric(m2, v, currency, true)}
            />
            <Tooltip
              cursor={{ fill: "var(--color-panel-2)" }}
              content={<ChartTooltip m1={m1} m2={m2} currency={currency} />}
            />
            <Bar yAxisId="m1" dataKey={m1} fill="var(--color-m1)" radius={[4, 4, 0, 0]} maxBarSize={28} />
            <Bar yAxisId="m2" dataKey={m2} fill="var(--color-m2)" radius={[4, 4, 0, 0]} maxBarSize={28} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
