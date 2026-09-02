import { apiClient } from './client';

export interface AgentChatMessage {
   id: string;
   role: 'user' | 'assistant';
   content: string;
   createdAt: string;
}

export async function sendAgentMessage(
   message: string
): Promise<{ reply: string; title?: string }> {
   return apiClient<{ reply: string; title?: string }>('/agent/chat', {
      method: 'POST',
      body: JSON.stringify({ message }),
   });
}

export async function getAgentExamples(): Promise<
   Array<{ id: string; icon: string; title: string; description: string; prompt: string }>
> {
   return apiClient<
      Array<{ id: string; icon: string; title: string; description: string; prompt: string }>
   >('/agent/examples');
}
