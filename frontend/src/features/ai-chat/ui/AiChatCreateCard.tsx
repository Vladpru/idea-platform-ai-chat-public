import { CheckCircle2, Lightbulb, TriangleAlert } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';

import { createIdeaDraft } from '@/features/ideas/api/ideas.api';
import { createProblemDraft } from '@/features/problems/api/problems.api';
import { Button } from '@/shared/ui/button';
import { cn } from '@/shared/lib/utils';

import type { ChatActionPayload } from '../api/ai-chat.types';

type Props = {
  action: ChatActionPayload;
  onDismiss: () => void;
  isWidget?: boolean;
};

type CardState = 'idle' | 'loading' | 'success' | 'error';

export function AiChatCreateCard({ action, onDismiss, isWidget }: Props) {
  const navigate = useNavigate();
  const [cardState, setCardState] = useState<CardState>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [draftUrl, setDraftUrl] = useState<string>('');

  const isIdea = action.type === 'create_idea';
  const label = isIdea ? 'New Idea Draft' : 'New Problem Draft';

  async function handleCreate() {
    setCardState('loading');
    setErrorMessage('');
    try {
      if (action.type === 'create_idea') {
        const idea = await createIdeaDraft({
          title: action.title ?? undefined,
          description: action.description ?? undefined,
          tagLabels: action.tags ?? [],
        });
        setDraftUrl(`/ideas/new?ideaId=${idea.id}`);
      } else {
        const problem = await createProblemDraft({
          title: action.title,
          description: action.description,
        });
        setDraftUrl(`/problems/${problem.id}`);
      }
      setCardState('success');
    } catch {
      setCardState('error');
      setErrorMessage('Failed to create draft. Please try again.');
    }
  }

  function handleOpenDraft() {
    void navigate({ to: draftUrl });
    onDismiss();
  }

  return (
    <div
      className={cn(
        'border-border bg-card rounded-xl border shadow-sm',
        isWidget ? 'mx-3 mb-2 p-3' : 'mx-auto mb-3 w-full max-w-3xl px-4 sm:px-6',
      )}
    >
      <div className={cn('flex flex-col gap-3', isWidget ? 'p-0' : 'py-3')}>
        <div className="flex items-center gap-2">
          <Lightbulb
            className={cn(
              'text-brand-dark-blue shrink-0',
              isWidget ? 'size-4' : 'size-5',
            )}
          />
          <span
            className={cn(
              'font-semibold text-foreground',
              isWidget ? 'text-xs' : 'text-sm',
            )}
          >
            {label}
          </span>
        </div>

        {cardState !== 'success' && (
          <div className={cn('flex flex-col gap-1.5', isWidget ? 'text-xs' : 'text-sm')}>
            {action.title && (
              <div>
                <span className="text-muted-foreground">Title: </span>
                <span className="text-foreground font-medium">{action.title}</span>
              </div>
            )}
            {action.description && (
              <div>
                <span className="text-muted-foreground">Description: </span>
                <span className="text-foreground">{action.description}</span>
              </div>
            )}
            {action.type === 'create_idea' && action.tags && action.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 pt-0.5">
                {action.tags.map(tag => (
                  <span
                    key={tag}
                    className="bg-muted text-muted-foreground rounded-full px-2 py-0.5 text-xs"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
            {action.type === 'create_problem' && (
              <div className="text-muted-foreground flex items-center gap-1 pt-0.5 text-xs">
                <TriangleAlert className="size-3 shrink-0" />
                Will be saved as draft
              </div>
            )}
          </div>
        )}

        {cardState === 'success' && (
          <div className={cn('flex items-center gap-2 text-green-600', isWidget ? 'text-xs' : 'text-sm')}>
            <CheckCircle2 className="size-4 shrink-0" />
            <span>Draft created!</span>
          </div>
        )}

        {cardState === 'error' && (
          <p className={cn('text-destructive', isWidget ? 'text-xs' : 'text-sm')}>
            {errorMessage}
          </p>
        )}

        <div className="flex items-center gap-2">
          {cardState === 'success' ? (
            <>
              <Button size="sm" onClick={handleOpenDraft}>
                Open Draft →
              </Button>
              <Button size="sm" variant="ghost" onClick={onDismiss}>
                Dismiss
              </Button>
            </>
          ) : (
            <>
              <Button
                size="sm"
                onClick={() => void handleCreate()}
                isLoading={cardState === 'loading'}
                disabled={cardState === 'loading'}
              >
                {cardState === 'error' ? 'Retry' : 'Create Draft'}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={onDismiss}
                disabled={cardState === 'loading'}
              >
                Dismiss
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
