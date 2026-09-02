import { apiClient } from './api-client';

export interface AgentChatMessage {
   id: string;
   role: 'user' | 'assistant';
   content: string;
   createdAt: string;
}

export interface AgentExample {
   id: string;
   icon: string;
   title: string;
   description: string;
   prompt: string;
}

export const agentService = {
   async sendAgentMessage(message: string): Promise<{ reply: string; title?: string }> {
      return apiClient<{ reply: string; title?: string }>('/agent/chat', {
         method: 'POST',
         body: JSON.stringify({ message }),
      });
   },

   async getAgentExamples(): Promise<AgentExample[]> {
      return apiClient<AgentExample[]>('/agent/examples');
   },
};
