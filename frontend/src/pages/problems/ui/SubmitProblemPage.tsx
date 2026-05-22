import { SubmitProblemForm } from '@/features/problems/ui/submit-problem';
import { CreationPageTemplate } from '@/shared/ui/pages/CreationPageTemplate';

const SUBMIT_PROBLEM_QUOTE =
  '\u201cCertainty of purpose is the starting point of all achievement\u201d \u2014 W. Clement Stone.';

export function SubmitProblemPage() {
  return (
    <CreationPageTemplate title="Submit Problem" quote={SUBMIT_PROBLEM_QUOTE}>
      <SubmitProblemForm />
    </CreationPageTemplate>
  );
}
