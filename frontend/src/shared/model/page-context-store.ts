import { create } from 'zustand';

export type PageContext =
  | {
      type: 'idea_form';
      title: string;
      description: string;
      tags: string[];
      linkedProblemIds: string[];
    }
  | {
      type: 'problem_form';
      title: string;
      description: string;
    }
  | null;

type PageContextStore = {
  context: PageContext;
  setContext: (ctx: PageContext) => void;
  clearContext: () => void;
};

const usePageContextStore = create<PageContextStore>(set => ({
  context: null,
  setContext: ctx => set({ context: ctx }),
  clearContext: () => set({ context: null }),
}));

export function setPageContext(ctx: PageContext): void {
  usePageContextStore.getState().setContext(ctx);
}

export function clearPageContext(): void {
  usePageContextStore.getState().clearContext();
}

export function usePageContext(): PageContext {
  return usePageContextStore(s => s.context);
}
