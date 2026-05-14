import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/_auth/profile/ideas')({
  component: ProfileIdeasPage,
});

function ProfileIdeasPage() {
  return (
    <main className="p-4">
      <h1 className="text-xl font-semibold">My ideas, joins & drafts</h1>
    </main>
  );
}
