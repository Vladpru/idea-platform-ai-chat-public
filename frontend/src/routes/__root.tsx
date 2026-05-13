import { createRootRouteWithContext, Outlet } from "@tanstack/react-router";

export type RouterContext = {
  isAuthenticated: boolean;
};

export const Route = createRootRouteWithContext<RouterContext>()({
  component: () => <Outlet />,
});
