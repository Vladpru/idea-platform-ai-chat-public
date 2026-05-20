import {
  draftToFormValues,
  EMPTY_CREATE_IDEA_DRAFT,
  EMPTY_CREATE_IDEA_FILES,
  formValuesToDraftPatch,
  formValuesToLocalFiles,
  ideaApiToDraft,
  ideaApiToRemoteMedia,
  type IdeaCreateFormValues,
} from '@/features/ideas/lib/create-idea';
import {
  EMPTY_PERSISTED_LOCAL_FILES,
  getLocalFilesKey,
  localFilesToPersisted,
  persistedToLocalFiles,
  type PersistedLocalFiles,
} from '@/features/ideas/lib/create-idea/file-persistence';
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
  persistedLocalFiles: PersistedLocalFiles;
  localFilesPersistenceKey: string;
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

type PersistedCreateIdeaState = {
  draft: CreateIdeaDraft;
  remoteMedia: IdeaMediaItem[];
  persistedLocalFiles: PersistedLocalFiles;
};

const initialState = {
  draft: EMPTY_CREATE_IDEA_DRAFT,
  localFiles: { ...EMPTY_CREATE_IDEA_FILES },
  persistedLocalFiles: EMPTY_PERSISTED_LOCAL_FILES,
  localFilesPersistenceKey: '',
  remoteMedia: [] as IdeaMediaItem[],
  isHydrating: false,
  isSaving: false,
  isDirty: false,
  error: null,
};

let localFilesPersistGeneration = 0;

function scheduleLocalFilesPersistence(
  localFiles: CreateIdeaLocalFiles,
  localFilesPersistenceKey: string,
) {
  const generation = ++localFilesPersistGeneration;

  void localFilesToPersisted(localFiles)
    .then(persistedLocalFiles => {
      if (generation !== localFilesPersistGeneration) return;

      useCreateIdeaStore.setState({ persistedLocalFiles });
    })
    .catch(() => {
      if (generation !== localFilesPersistGeneration) return;

      useCreateIdeaStore.setState({
        error: 'Could not save uploaded files for this session. They may be too large.',
        localFilesPersistenceKey,
      });
    });
}

function applyLocalFilesUpdate(
  set: (
    partial:
      | Partial<CreateIdeaState>
      | ((state: CreateIdeaState) => Partial<CreateIdeaState>),
  ) => void,
  get: () => CreateIdeaState,
  localFiles: CreateIdeaLocalFiles,
) {
  const nextKey = getLocalFilesKey(localFiles);
  const currentKey = get().localFilesPersistenceKey;

  set({
    localFiles,
    isDirty: true,
    ...(nextKey !== currentKey
      ? {
          localFilesPersistenceKey: nextKey,
          ...(localFiles.mainImage === null && localFiles.attachments.length === 0
            ? {
                persistedLocalFiles: EMPTY_PERSISTED_LOCAL_FILES,
              }
            : {}),
        }
      : {}),
  });

  if (nextKey === currentKey) return;

  if (localFiles.mainImage === null && localFiles.attachments.length === 0) {
    return;
  }

  scheduleLocalFilesPersistence(localFiles, nextKey);
}

export const useCreateIdeaStore = create<CreateIdeaState>()(
  persist(
    (set, get) => ({
      ...initialState,

      reset: () => {
        localFilesPersistGeneration += 1;
        set({
          ...initialState,
          localFiles: { ...EMPTY_CREATE_IDEA_FILES },
          persistedLocalFiles: EMPTY_PERSISTED_LOCAL_FILES,
        });
        void useCreateIdeaStore.persist.clearStorage();
      },

      hydrateFromIdea: idea => {
        set({
          draft: ideaApiToDraft(idea),
          remoteMedia: ideaApiToRemoteMedia(idea),
          localFiles: { ...EMPTY_CREATE_IDEA_FILES },
          persistedLocalFiles: EMPTY_PERSISTED_LOCAL_FILES,
          localFilesPersistenceKey: '',
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
        const localFiles = { ...get().localFiles, ...patch };
        applyLocalFilesUpdate(set, get, localFiles);
      },

      syncFromForm: values => {
        const localFiles = formValuesToLocalFiles(values);
        set(state => ({
          draft: { ...state.draft, ...formValuesToDraftPatch(values) },
          isDirty: true,
        }));
        applyLocalFilesUpdate(set, get, localFiles);
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
        persistedLocalFiles: state.persistedLocalFiles,
      }),
      merge: (persisted, current) => {
        const saved = persisted as Partial<PersistedCreateIdeaState> | undefined;
        if (!saved?.draft) return current;

        const persistedLocalFiles =
          saved.persistedLocalFiles ?? EMPTY_PERSISTED_LOCAL_FILES;
        const localFiles = persistedToLocalFiles(persistedLocalFiles);

        return {
          ...current,
          draft: {
            ...EMPTY_CREATE_IDEA_DRAFT,
            ...saved.draft,
            status: saved.draft.status ?? IDEA_STATUS.DRAFT,
          },
          remoteMedia: saved.remoteMedia ?? [],
          persistedLocalFiles,
          localFiles,
          localFilesPersistenceKey: getLocalFilesKey(localFiles),
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
