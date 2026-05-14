import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/_auth/ideas')({
  component: IdeasPage,
});

function IdeasPage() {
  return (
    <main className="p-4">
      <h1 className="text-xl font-semibold">Ideas</h1>
    </main>
  );
}
