import { ProblemDetailsView } from '@/features/problem-details';

type ProblemDetailsPageProps = {
  problemId: string;
};

export function ProblemDetailsPage({ problemId }: ProblemDetailsPageProps) {
  return <ProblemDetailsView problemId={problemId} />;
}
