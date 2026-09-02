import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { reviewsService, Review } from '@/services/reviews.service';
import { reviewKeys } from './keys';
import { toast } from 'sonner';

export function useReviews(status?: string) {
   return useQuery({
      queryKey: reviewKeys.list(status),
      queryFn: () => reviewsService.getReviews(status),
   });
}

export function useReview(id: string, enabled = true) {
   return useQuery({
      queryKey: reviewKeys.detail(id),
      queryFn: () => reviewsService.getReviewById(id),
      enabled: Boolean(id) && enabled,
   });
}

export function useCreateReview() {
   const queryClient = useQueryClient();

   return useMutation({
      mutationFn: (payload: Partial<Review>) => reviewsService.createReview(payload),
      onSuccess: () => {
         queryClient.invalidateQueries({ queryKey: reviewKeys.lists() });
         toast.success('Review created');
      },
      onError: (error: Error) => {
         toast.error(error.message || 'Failed to create review');
      },
   });
}
