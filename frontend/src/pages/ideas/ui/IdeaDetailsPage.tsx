import { IdeaDetailsView } from '@/features/ideas/ui/idea-details/IdeaDetailsView';

type IdeaDetailsPageProps = {
  ideaId: string;
};

export function IdeaDetailsPage({ ideaId }: IdeaDetailsPageProps) {
  return <IdeaDetailsView ideaId={ideaId} />;
}
