import { IdeaCreateForm } from '@/features/ideas';
import { SparklesIcon } from '@/features/ideas/ui/SparklesIcon';
import {
  pageTitleClass,
  primaryBtnClass,
} from '@/features/ideas/ui/idea-creation-classes';

import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/button';
import { Card } from '@/shared/ui/card';

export function IdeaCreationPage() {
  return (
    <main className="bg-brand-neutral min-h-[calc(100vh-56px)] px-4 md:px-8 lg:px-12">
      <div className="mx-auto max-w-5xl">
        <Card className="text-card-foreground bg-white p-6 md:p-10">
          <div className="mb-8 flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0 flex-1">
              <h1 className={pageTitleClass}>Idea creation</h1>
              <p className="text-brand-dark-blue mt-2 max-w-xl text-sm italic">
                &ldquo;Certainty of purpose is the starting point of all
                achievement&rdquo; &mdash; W. Clement Stone.
              </p>
            </div>
            <Button type="button" className={cn(primaryBtnClass, 'shrink-0')}>
              <SparklesIcon className="size-5" />
              Generate draft with AI
            </Button>
          </div>
          <IdeaCreateForm />
        </Card>
      </div>
    </main>
  );
}
