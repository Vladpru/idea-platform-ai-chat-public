import {
  IDEA_EDITOR_QUOTE,
  IDEA_EDITOR_TITLE,
} from '@/features/ideas/lib/modals/copy';
import { pageTitleClass } from '@/features/ideas/lib/styles';

export function IdeaEditorPageHeading() {
  return (
    <div className="mb-8">
      <h1 className={pageTitleClass}>{IDEA_EDITOR_TITLE}</h1>
      <p className="text-brand-dark-blue mt-2 max-w-xl text-sm italic">
        {IDEA_EDITOR_QUOTE}
      </p>
    </div>
  );
}
