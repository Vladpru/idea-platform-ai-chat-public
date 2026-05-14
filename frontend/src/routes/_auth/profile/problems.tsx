import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/_auth/profile/problems')({
  component: ProfileProblemsPage,
});

function ProfileProblemsPage() {
  return (
    <main className="p-4">
      <h1 className="text-xl font-semibold">My problems, joins & drafts</h1>
    </main>
  );
}
