import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/_auth/problems')({
  component: ProblemsPage,
});

function ProblemsPage() {
  return (
    <main className="p-4">
      <h1 className="text-xl font-semibold">Problems</h1>
    </main>
  );
}
