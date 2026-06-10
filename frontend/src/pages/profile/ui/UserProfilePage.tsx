import { UserProfileView } from '@/features/profile';
import { useParams } from '@tanstack/react-router';

export function UserProfilePage() {
  const { profileId } = useParams({ from: '/_auth/profile/$profileId' });
  return <UserProfileView profileId={profileId} />;
}
