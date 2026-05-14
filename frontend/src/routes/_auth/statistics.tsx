import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_auth/statistics")({
  component: StatisticsPage,
});

function StatisticsPage() {
  return (
    <main className="p-4">
      <h1 className="text-xl font-semibold">Statistics</h1>
    </main>
  );
}
