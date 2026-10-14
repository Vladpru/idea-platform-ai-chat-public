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

type FieldActionHandler = (field: 'tags' | 'linked_problems', merged: string[]) => void;

type PageContextStore = {
  context: PageContext;
  fieldActionHandler: FieldActionHandler | null;
  setContext: (ctx: PageContext) => void;
  clearContext: () => void;
  setFieldActionHandler: (handler: FieldActionHandler | null) => void;
};

const usePageContextStore = create<PageContextStore>(set => ({
  context: null,
  fieldActionHandler: null,
  setContext: ctx => set({ context: ctx }),
  clearContext: () => set({ context: null }),
  setFieldActionHandler: handler => set({ fieldActionHandler: handler }),
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

export function setFieldActionHandler(handler: FieldActionHandler | null): void {
  usePageContextStore.getState().setFieldActionHandler(handler);
}

export function useFieldActionHandler(): FieldActionHandler | null {
  return usePageContextStore(s => s.fieldActionHandler);
}
