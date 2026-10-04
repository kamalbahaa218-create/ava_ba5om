import { createFileRoute, Navigate } from "@tanstack/react-router";
import { Loading } from "@/components/site/AccessDenied";
import { homePathFor, useMyProfile } from "@/lib/auth";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "لوحتي — أسرة أبا باخوم" }] }),
  component: DashboardRedirect,
});

function DashboardRedirect() {
  const { user } = Route.useRouteContext();
  const { data, isLoading } = useMyProfile(user.id);
  if (isLoading || !data) return <Loading />;
  return <Navigate to={homePathFor(data.user_type)} replace />;
}
