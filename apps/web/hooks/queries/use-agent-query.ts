import { useQuery, useMutation } from '@tanstack/react-query';
import { agentService } from '@/services/agent.service';
import { agentKeys } from './keys';

export function useAgentExamples() {
   return useQuery({
      queryKey: agentKeys.examples(),
      queryFn: () => agentService.getAgentExamples(),
   });
}

export function useSendAgentMessage() {
   return useMutation({
      mutationFn: (message: string) => agentService.sendAgentMessage(message),
   });
}
