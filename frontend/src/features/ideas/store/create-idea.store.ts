import {
  EMPTY_CREATE_IDEA_DRAFT,
  EMPTY_CREATE_IDEA_FILES,
} from '@/features/ideas/lib/create-idea-defaults';
import {
  draftToFormValues,
  formValuesToDraftPatch,
  formValuesToLocalFiles,
  ideaApiToDraft,
  ideaApiToRemoteMedia,
} from '@/features/ideas/lib/create-idea-mappers';
import type { IdeaCreateFormValues } from '@/features/ideas/lib/idea-create-schema';
import {
  type CreateIdeaDraft,
  type CreateIdeaLocalFiles,
  IDEA_STATUS,
  type IdeaApi,
  type IdeaMediaItem,
} from '@/features/ideas/model/idea.types';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

type CreateIdeaState = {
  draft: CreateIdeaDraft;
  localFiles: CreateIdeaLocalFiles;
  remoteMedia: IdeaMediaItem[];
  isHydrating: boolean;
  isSaving: boolean;
  isDirty: boolean;
  error: string | null;

  reset: () => void;
  hydrateFromIdea: (idea: IdeaApi) => void;
  applyServerIdea: (idea: IdeaApi) => void;
  patchDraft: (patch: Partial<CreateIdeaDraft>) => void;
  setLocalFiles: (patch: Partial<CreateIdeaLocalFiles>) => void;
  syncFromForm: (values: IdeaCreateFormValues) => void;
  getFormValues: () => IdeaCreateFormValues;
  setHydrating: (isHydrating: boolean) => void;
  setSaving: (isSaving: boolean) => void;
  setError: (error: string | null) => void;
  markClean: () => void;
};

const initialState = {
  draft: EMPTY_CREATE_IDEA_DRAFT,
  localFiles: { ...EMPTY_CREATE_IDEA_FILES },
  remoteMedia: [] as IdeaMediaItem[],
  isHydrating: false,
  isSaving: false,
  isDirty: false,
  error: null,
};

export const useCreateIdeaStore = create<CreateIdeaState>()(
  persist(
    (set, get) => ({
      ...initialState,

      reset: () => {
        set({
          ...initialState,
          localFiles: { ...EMPTY_CREATE_IDEA_FILES },
        });
        void useCreateIdeaStore.persist.clearStorage();
      },

      hydrateFromIdea: idea => {
        set({
          draft: ideaApiToDraft(idea),
          remoteMedia: ideaApiToRemoteMedia(idea),
          localFiles: { ...EMPTY_CREATE_IDEA_FILES },
          isHydrating: false,
          isDirty: false,
          error: null,
        });
      },

      applyServerIdea: idea => {
        set({
          draft: ideaApiToDraft(idea),
          remoteMedia: ideaApiToRemoteMedia(idea),
          isSaving: false,
          isDirty: false,
          error: null,
        });
      },

      patchDraft: patch => {
        set(state => ({
          draft: { ...state.draft, ...patch },
          isDirty: true,
        }));
      },

      setLocalFiles: patch => {
        set(state => ({
          localFiles: { ...state.localFiles, ...patch },
          isDirty: true,
        }));
      },

      syncFromForm: values => {
        set(state => ({
          draft: { ...state.draft, ...formValuesToDraftPatch(values) },
          localFiles: formValuesToLocalFiles(values),
          isDirty: true,
        }));
      },

      getFormValues: () => {
        const { draft, localFiles } = get();
        return draftToFormValues(draft, localFiles);
      },

      setHydrating: isHydrating => set({ isHydrating }),
      setSaving: isSaving => set({ isSaving }),
      setError: error => set({ error, isSaving: false }),
      markClean: () => set({ isDirty: false }),
    }),
    {
      name: 'create-idea-session',
      storage: createJSONStorage(() => sessionStorage),
      partialize: state => ({
        draft: state.draft,
        remoteMedia: state.remoteMedia,
      }),
      merge: (persisted, current) => {
        const saved = persisted as Partial<CreateIdeaState> | undefined;
        if (!saved?.draft) return current;

        return {
          ...current,
          draft: {
            ...EMPTY_CREATE_IDEA_DRAFT,
            ...saved.draft,
            status: saved.draft.status ?? IDEA_STATUS.DRAFT,
          },
          remoteMedia: saved.remoteMedia ?? [],
        };
      },
    },
  ),
);

export function hasPersistedDraftId(): boolean {
  return Boolean(useCreateIdeaStore.getState().draft.id);
}

export function isCreateIdeaDraft(idea: Pick<IdeaApi, 'status'>): boolean {
  return idea.status === IDEA_STATUS.DRAFT;
}
