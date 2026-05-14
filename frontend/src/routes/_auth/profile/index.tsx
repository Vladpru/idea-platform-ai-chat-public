import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/_auth/profile/')({
  component: ProfilePage,
});

function ProfilePage() {
  return (
    <main className="p-4">
      <h1 className="text-xl font-semibold">Profile</h1>
    </main>
  );
}
