import { useEffect, useMemo, useState } from "react";
import { BarChart3, RefreshCw, Table2 } from "lucide-react";
import { PageHeader } from "../components/PageHeader";
import { CreativeChart } from "../components/CreativeChart";
import { CreativeTable } from "../components/CreativeTable";
import { fetchAccounts, fetchAds } from "../lib/api";
import { PERIODS, periodRange, type Period } from "../lib/dates";
import { deriveAd, formatMetric, METRIC_KEYS, METRICS, summarize, type MetricKey } from "../lib/metrics";
import type { ConversionType } from "../lib/types";
import { useAsync } from "../lib/useAsync";

const TOP_N = [10, 20, 50] as const;

export function CreativeAnalyticsPage() {
  const accounts = useAsync(fetchAccounts, []);
  const [accountId, setAccountId] = useState<string>();
  const [period, setPeriod] = useState<Period>(7);
  const [m1, setM1] = useState<MetricKey>("spend");
  const [m2, setM2] = useState<MetricKey>("cpa");
  const [topN, setTopN] = useState<number>(20);
  const [view, setView] = useState<"chart" | "table">("chart");
  const [conversion, setConversion] = useState<ConversionType>("purchases");

  useEffect(() => {
    if (!accountId && accounts.data?.length) setAccountId(accounts.data[0].id);
  }, [accounts.data, accountId]);

  const account = accounts.data?.find((a) => a.id === accountId);
  const currency = account?.currency ?? "USD";
  const range = periodRange(period);

  const ads = useAsync(
    () => (accountId ? fetchAds(accountId, range.since, range.until, period) : Promise.resolve([])),
    [accountId, range.since, range.until],
  );

  const derived = useMemo(() => (ads.data ?? []).map((r) => deriveAd(r, conversion)), [ads.data, conversion]);
  const summary = useMemo(() => summarize(derived), [derived]);
  const top = useMemo(() => [...derived].sort((a, b) => b.spend - a.spend).slice(0, topN), [derived, topN]);

  return (
    <>
      <PageHeader
        title="Creative Analytics"
        description="Cruzá métricas y analizá el rendimiento creativo de tus anuncios"
      />

      <section className="border-line bg-panel mb-4 flex flex-wrap items-center gap-3 rounded-xl border p-4">
        <label className="sr-only" htmlFor="account">Cuenta publicitaria</label>
        <select
          id="account"
          value={accountId ?? ""}
          onChange={(e) => setAccountId(e.target.value)}
          className="border-line bg-panel-2 text-ink w-full rounded-lg border px-3 py-2 text-sm sm:w-auto"
          disabled={!accounts.data}
        >
          {accounts.loading && <option>Cargando cuentas…</option>}
          {accounts.data?.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name} ({a.id.replace("act_", "")})
            </option>
          ))}
        </select>

        <div className="flex gap-1" role="group" aria-label="Período">
          {PERIODS.map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`rounded-lg px-3 py-1.5 text-sm ${period === p ? "bg-m1/15 text-m1 font-medium" : "text-muted hover:bg-panel-2"}`}
            >
              {p}d
            </button>
          ))}
        </div>

        <div className="text-muted text-xs">
          {range.since} → {range.until}
        </div>

        <button
          onClick={ads.reload}
          className="text-muted hover:bg-panel-2 hover:text-ink ml-auto rounded-lg p-2"
          aria-label="Recargar"
          title="Recargar"
        >
          <RefreshCw size={16} className={ads.loading ? "animate-spin" : ""} />
        </button>
      </section>

      {(accounts.error || ads.error) && (
        <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
          {accounts.error ?? ads.error}
        </div>
      )}

      <section className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Anuncios con entrega" value={String(summary.count)} />
        <Stat label="Gasto total" value={formatMetric("spend", summary.spend, currency)} />
        <Stat label="ROAS promedio" value={formatMetric("roas", summary.roas, currency)} />
        <Stat label="Revenue total" value={formatMetric("revenue", summary.revenue, currency)} />
      </section>

      <section className="border-line bg-panel rounded-xl border">
        <div className="border-line flex flex-wrap items-center gap-3 border-b p-4">
          <span className="text-muted text-sm">Métricas:</span>
          <MetricSelect n={1} value={m1} onChange={setM1} />
          <MetricSelect n={2} value={m2} onChange={setM2} />

          <select
            value={conversion}
            onChange={(e) => setConversion(e.target.value as ConversionType)}
            className="border-line bg-panel-2 text-ink rounded-lg border px-2 py-1.5 text-sm"
            aria-label="Tipo de conversión"
          >
            <option value="purchases">Conversión: compras</option>
            <option value="leads">Conversión: leads</option>
          </select>

          <div className="ml-auto flex items-center gap-3">
            <select
              value={topN}
              onChange={(e) => setTopN(Number(e.target.value))}
              className="border-line bg-panel-2 text-ink rounded-lg border px-2 py-1.5 text-sm"
              aria-label="Cantidad de anuncios"
            >
              {TOP_N.map((n) => (
                <option key={n} value={n}>Top {n} por Spend</option>
              ))}
            </select>
            <div className="border-line flex rounded-lg border p-0.5">
              <ViewButton active={view === "chart"} onClick={() => setView("chart")} label="Gráfico">
                <BarChart3 size={16} />
              </ViewButton>
              <ViewButton active={view === "table"} onClick={() => setView("table")} label="Tabla">
                <Table2 size={16} />
              </ViewButton>
            </div>
          </div>
        </div>

        <div className="p-4">
          {ads.loading && !ads.data ? (
            <div className="text-muted py-20 text-center text-sm">Cargando anuncios…</div>
          ) : top.length === 0 ? (
            <div className="text-muted py-20 text-center text-sm">Sin anuncios con entrega en este período.</div>
          ) : view === "chart" ? (
            <>
              <div className="mb-2 flex gap-4 text-sm">
                <Legend n={1} label={METRICS[m1].label} />
                <Legend n={2} label={METRICS[m2].label} />
              </div>
              <CreativeChart ads={top} m1={m1} m2={m2} currency={currency} />
            </>
          ) : (
            <CreativeTable ads={top} currency={currency} />
          )}
        </div>
      </section>
    </>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-line bg-panel rounded-xl border p-4">
      <div className="text-muted text-[11px] font-semibold tracking-wider uppercase">{label}</div>
      <div className="tabular text-ink mt-1 text-xl font-semibold sm:text-2xl">{value}</div>
    </div>
  );
}

function Badge({ n }: { n: 1 | 2 }) {
  return (
    <span className={`inline-flex h-5 w-5 items-center justify-center rounded text-xs font-bold text-slate-900 ${n === 1 ? "bg-m1" : "bg-m2"}`}>
      {n}
    </span>
  );
}

function MetricSelect({ n, value, onChange }: { n: 1 | 2; value: MetricKey; onChange: (k: MetricKey) => void }) {
  return (
    <label className="border-line bg-panel-2 flex items-center gap-2 rounded-lg border py-1 pr-1 pl-2">
      <Badge n={n} />
      <span className="sr-only">Métrica {n}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as MetricKey)}
        className={`bg-transparent py-0.5 text-sm font-medium ${n === 1 ? "text-m1" : "text-m2"}`}
      >
        {METRIC_KEYS.map((k) => (
          <option key={k} value={k} className="bg-panel-2 text-ink">
            {METRICS[k].label}
          </option>
        ))}
      </select>
    </label>
  );
}

function Legend({ n, label }: { n: 1 | 2; label: string }) {
  return (
    <span className="text-ink flex items-center gap-2">
      <Badge n={n} />
      {label}
    </span>
  );
}

function ViewButton({ active, onClick, label, children }: { active: boolean; onClick: () => void; label: string; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      title={label}
      className={`rounded-md p-1.5 ${active ? "bg-panel-2 text-m1" : "text-muted hover:text-ink"}`}
    >
      {children}
    </button>
  );
}
