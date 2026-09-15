import { create } from 'zustand';
import { ReviewStatus } from '@/types/review';

interface ReviewsFilterState {
   statuses: ReviewStatus[];
   authors: string[];
   searchQuery: string;

   toggleStatus: (status: ReviewStatus) => void;
   toggleAuthor: (authorId: string) => void;
   setSearchQuery: (query: string) => void;
   clearFilters: () => void;
   getActiveCount: () => number;
}

export const useReviewsFilterStore = create<ReviewsFilterState>((set, get) => ({
   statuses: [],
   authors: [],
   searchQuery: '',

   toggleStatus: (status) =>
      set((state) => ({
         statuses: state.statuses.includes(status)
            ? state.statuses.filter((s) => s !== status)
            : [...state.statuses, status],
      })),

   toggleAuthor: (authorId) =>
      set((state) => ({
         authors: state.authors.includes(authorId)
            ? state.authors.filter((a) => a !== authorId)
            : [...state.authors, authorId],
      })),

   setSearchQuery: (query) => set({ searchQuery: query }),

   clearFilters: () => set({ statuses: [], authors: [], searchQuery: '' }),

   getActiveCount: () => {
      const state = get();
      return state.statuses.length + state.authors.length + (state.searchQuery ? 1 : 0);
   },
}));
