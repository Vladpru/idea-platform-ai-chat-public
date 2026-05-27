import { SubmitProblemForm } from '@/features/problems/ui/submit-problem';
import { ROUTES } from '@/shared/config/paths';
import { CreationPageTemplate } from '@/shared/ui/pages/CreationPageTemplate';
import { useSearch } from '@tanstack/react-router';

const SUBMIT_PROBLEM_QUOTE =
  '\u201cCertainty of purpose is the starting point of all achievement\u201d \u2014 W. Clement Stone.';

export function SubmitProblemPage() {
  const { problemId } = useSearch({ from: '/_auth/problems/new' });

  return (
    <CreationPageTemplate
      title={problemId ? 'Edit Problem' : 'Submit Problem'}
      quote={SUBMIT_PROBLEM_QUOTE}
      backTo={problemId ? ROUTES.problemDetail(problemId) : undefined}
    >
      <SubmitProblemForm />
    </CreationPageTemplate>
  );
}
