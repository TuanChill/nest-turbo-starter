import { create } from 'zustand';

export type ReviewGrouping = 'status' | 'none';
export type ReviewOrdering = 'updated' | 'created' | 'title';

interface ReviewsDisplayState {
   grouping: ReviewGrouping;
   ordering: ReviewOrdering;
   showCompleted: boolean;

   setGrouping: (g: ReviewGrouping) => void;
   setOrdering: (o: ReviewOrdering) => void;
   setShowCompleted: (show: boolean) => void;
}

export const useReviewsDisplayStore = create<ReviewsDisplayState>((set) => ({
   grouping: 'status',
   ordering: 'updated',
   showCompleted: true,

   setGrouping: (grouping) => set({ grouping }),
   setOrdering: (ordering) => set({ ordering }),
   setShowCompleted: (showCompleted) => set({ showCompleted }),
}));
