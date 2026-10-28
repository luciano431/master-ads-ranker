import { Link, Outlet } from "@tanstack/react-router";
import { NAV } from "./nav";
import { USE_MOCK } from "../lib/api";

export function Layout() {
  return (
    <div className="flex min-h-full flex-col md:flex-row">
      <aside className="border-line bg-panel shrink-0 border-b md:w-64 md:border-r md:border-b-0">
        <div className="px-5 py-5">
          <div className="text-ink text-base font-semibold">Master Ads Ranker</div>
          <div className="text-muted text-xs">Ranker Studio · uso interno</div>
        </div>
        <div className="text-muted px-5 pb-2 text-[11px] font-semibold tracking-wider uppercase">Optimizar</div>
        <nav className="flex gap-1 overflow-x-auto px-3 pb-4 md:flex-col md:overflow-visible">
          {NAV.map(({ to, label, icon: Icon, soon }) => (
            <Link
              key={to}
              to={to}
              className="text-muted hover:bg-panel-2 hover:text-ink flex shrink-0 items-center gap-3 rounded-lg px-3 py-2 text-sm whitespace-nowrap"
              activeProps={{ className: "!bg-panel-2 !text-m1 font-medium" }}
            >
              <Icon size={16} className="shrink-0" aria-hidden />
              <span className="flex-1">{label}</span>
              {soon && <span className="bg-line text-muted rounded px-1.5 py-0.5 text-[10px]">pronto</span>}
            </Link>
          ))}
        </nav>
        {USE_MOCK && (
          <div className="mx-4 mb-4 hidden rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-200 md:block">
            Modo demo: datos de ejemplo. Configurá <code>VITE_SUPABASE_URL</code> y <code>VITE_SUPABASE_ANON_KEY</code> para usar Meta.
          </div>
        )}
      </aside>
      <main className="min-w-0 flex-1 px-4 py-6 md:px-8">
        <Outlet />
      </main>
    </div>
  );
}
