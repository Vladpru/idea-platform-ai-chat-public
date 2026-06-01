import { create } from 'zustand';

type DiscussionUiState = {
  editingCommentId: string | null;
  isEditingDirty: boolean;
  startEditing: (id: string) => void;
  setEditingDirty: (dirty: boolean) => void;
  stopEditing: () => void;

  isDraftDirty: boolean;
  setDraftDirty: (dirty: boolean) => void;
  draftClearToken: number;

  discardAllUnsaved: () => void;
};

export const useDiscussionUiStore = create<DiscussionUiState>(set => ({
  editingCommentId: null,
  isEditingDirty: false,
  startEditing: id => set({ editingCommentId: id, isEditingDirty: false }),
  setEditingDirty: dirty => set({ isEditingDirty: dirty }),
  stopEditing: () => set({ editingCommentId: null, isEditingDirty: false }),

  isDraftDirty: false,
  setDraftDirty: dirty => set({ isDraftDirty: dirty }),
  draftClearToken: 0,

  discardAllUnsaved: () =>
    set({
      editingCommentId: null,
      isEditingDirty: false,
      isDraftDirty: false,
    }),
}));
