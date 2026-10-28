import { createRootRoute, createRoute, createRouter, redirect } from "@tanstack/react-router";
import { Layout } from "./components/Layout";
import { CreativeAnalyticsPage } from "./pages/CreativeAnalytics";
import { ComingSoon } from "./pages/ComingSoon";
import { NAV } from "./components/nav";

const rootRoute = createRootRoute({ component: Layout });

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  beforeLoad: () => {
    throw redirect({ to: "/creative-analytics" });
  },
});

const creativeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/creative-analytics",
  component: CreativeAnalyticsPage,
});

const soonRoutes = NAV.filter((n) => n.soon).map((n) =>
  createRoute({
    getParentRoute: () => rootRoute,
    path: n.to,
    component: () => <ComingSoon title={n.label} description={n.description} />,
  }),
);

const routeTree = rootRoute.addChildren([indexRoute, creativeRoute, ...soonRoutes]);

export const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
