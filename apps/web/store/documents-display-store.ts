import { create } from 'zustand';

export type DocOrdering = 'name' | 'updatedAt' | 'createdAt';

interface DocumentsDisplayState {
   ordering: DocOrdering;
   pinToTop: boolean;

   setOrdering: (ordering: DocOrdering) => void;
   setPinToTop: (pinToTop: boolean) => void;
}

export const useDocumentsDisplayStore = create<DocumentsDisplayState>((set) => ({
   ordering: 'name',
   pinToTop: true,

   setOrdering: (ordering) => set({ ordering }),
   setPinToTop: (pinToTop) => set({ pinToTop }),
}));
