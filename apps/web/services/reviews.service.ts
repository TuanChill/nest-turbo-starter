import { apiClient } from './api-client';
import type { Review } from '@/mock-data/reviews';

export type { Review };
export type ReviewItem = Review;

export const reviewsService = {
   async getReviews(status?: string): Promise<Review[]> {
      const query = status ? `?status=${encodeURIComponent(status)}` : '';
      return apiClient<Review[]>(`/circle/api/reviews${query}`);
   },

   async getReviewById(id: string): Promise<Review> {
      return apiClient<Review>(`/circle/api/reviews/${id}`);
   },

   async createReview(payload: Partial<Review>): Promise<Review> {
      return apiClient<Review>('/circle/api/reviews', {
         method: 'POST',
         body: JSON.stringify(payload),
      });
   },

   async updateReview(id: string, payload: Partial<Review>): Promise<Review> {
      return apiClient<Review>(`/circle/api/reviews/${id}`, {
         method: 'PATCH',
         body: JSON.stringify(payload),
      });
   },
};
