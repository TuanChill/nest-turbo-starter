import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { membersService, Member } from '@/services/members.service';
import { memberKeys } from './keys';
import { toast } from 'sonner';

export function useMembers() {
   return useQuery({
      queryKey: memberKeys.lists(),
      queryFn: () => membersService.getMembers(),
   });
}

export function useMember(id: string, enabled = true) {
   return useQuery({
      queryKey: memberKeys.detail(id),
      queryFn: () => membersService.getMemberById(id),
      enabled: Boolean(id) && enabled,
   });
}

export function useCreateMember() {
   const queryClient = useQueryClient();

   return useMutation({
      mutationFn: (payload: Partial<Member>) => membersService.createMember(payload),
      onSuccess: () => {
         queryClient.invalidateQueries({ queryKey: memberKeys.lists() });
         toast.success('Member invited');
      },
      onError: (error: Error) => {
         toast.error(error.message || 'Failed to invite member');
      },
   });
}

export function useUpdateMember() {
   const queryClient = useQueryClient();

   return useMutation({
      mutationFn: ({ id, payload }: { id: string; payload: Partial<Member> }) =>
         membersService.updateMember(id, payload),
      onSuccess: () => {
         queryClient.invalidateQueries({ queryKey: memberKeys.lists() });
      },
      onError: (error: Error) => {
         toast.error(error.message || 'Failed to update profile');
      },
   });
}
