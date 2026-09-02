import { apiClient } from './client';
import type { Review } from '@/mock-data/reviews';

export type { Review };
export type ReviewItem = Review;

export async function getReviews(status?: string): Promise<Review[]> {
   const query = status ? `?status=${encodeURIComponent(status)}` : '';
   return apiClient<Review[]>(`/circle/api/reviews${query}`);
}

export async function getReviewById(id: string): Promise<Review> {
   return apiClient<Review>(`/circle/api/reviews/${id}`);
}

export async function createReview(payload: Partial<Review>): Promise<Review> {
   return apiClient<Review>('/circle/api/reviews', {
      method: 'POST',
      body: JSON.stringify(payload),
   });
}

export async function updateReview(id: string, payload: Partial<Review>): Promise<Review> {
   return apiClient<Review>(`/circle/api/reviews/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
   });
}
