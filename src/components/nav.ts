import { BarChart3, FileText, GitBranch, LayoutGrid, Sparkles, TrendingUp, type LucideIcon } from "lucide-react";

export type NavItem = { to: string; label: string; icon: LucideIcon; soon?: boolean; description: string };

export const NAV: NavItem[] = [
  { to: "/creative-analytics", label: "Creative Analytics", icon: BarChart3, description: "Cruzá métricas y analizá el rendimiento creativo de tus anuncios" },
  { to: "/ads", label: "Ads", icon: LayoutGrid, soon: true, description: "Listado completo de anuncios" },
  { to: "/ad-insights", label: "Ad Insights", icon: Sparkles, soon: true, description: "Análisis de creativos con IA" },
  { to: "/top-performers", label: "Top Performers", icon: TrendingUp, soon: true, description: "Rendimiento por ángulos, audiencias, productos y promociones" },
  { to: "/reporte-mensual", label: "Reporte Mensual", icon: FileText, soon: true, description: "Informe mensual automático" },
  { to: "/escenarios", label: "Escenarios Posibles", icon: GitBranch, soon: true, description: "Proyecciones de inversión y resultados" },
];
