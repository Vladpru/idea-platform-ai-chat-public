import { IdeaDetailsView } from '@/features/idea-details';

type IdeaDetailsPageProps = {
  ideaId: string;
};

export function IdeaDetailsPage({ ideaId }: IdeaDetailsPageProps) {
  return <IdeaDetailsView ideaId={ideaId} />;
}
