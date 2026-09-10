import { apiClient } from './api-client';

export interface OnboardingPayload {
   workspaceName: string;
   workspaceSlug?: string;
   workspaceIcon?: string;
   teamName: string;
   teamKey: string;
   teamIcon?: string;
   teamColor?: string;
   inviteEmails?: string[];
}

export interface OnboardingResponse {
   workspace: {
      id: string;
      name: string;
      slug: string;
      icon?: string;
      description?: string;
      ownerId?: string;
      role: string;
      inviteCode: string;
      memberCount: number;
      createdAt?: string;
   };
   team: {
      id: string;
      name: string;
      icon?: string;
      color?: string;
      joined: boolean;
      workspaceId: string;
   };
   welcomeIssue: {
      id: string;
      identifier: string;
      title: string;
   };
}

export const onboardingService = {
   async completeOnboarding(payload: OnboardingPayload): Promise<OnboardingResponse> {
      return apiClient<OnboardingResponse>('/circle/api/onboarding/complete', {
         method: 'POST',
         body: JSON.stringify(payload),
      });
   },
};
