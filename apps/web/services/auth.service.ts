import { apiClient } from './api-client';

export interface AuthUser {
   id: string;
   email: string;
   name?: string;
   avatarUrl?: string;
   role?: string;
   status?: string;
   timezone?: string;
   teamIds?: string[];
}

export interface LoginPayload {
   email: string;
   password?: string;
   phoneNumber?: string;
   callingCode?: string;
}

export interface SignUpPayload {
   email: string;
   password?: string;
   name?: string;
   phoneNumber?: string;
   callingCode?: string;
}

export interface GoogleAuthPayload {
   idToken: string;
   profile?: {
      email?: string;
      name?: string;
      picture?: string;
   };
}

import { Workspace } from './workspaces.service';

export interface AuthResponse {
   accessToken: string;
   refreshToken: string;
   user?: AuthUser;
   workspace?: Workspace;
}

export const authService = {
   async login(payload: LoginPayload): Promise<AuthResponse> {
      return apiClient<AuthResponse>('/circle/api/auth/login', {
         method: 'POST',
         body: JSON.stringify(payload),
         skipAuth: true,
      });
   },

   async signUp(payload: SignUpPayload): Promise<AuthResponse> {
      return apiClient<AuthResponse>('/circle/api/auth/sign-up', {
         method: 'POST',
         body: JSON.stringify(payload),
         skipAuth: true,
      });
   },

   async loginWithGoogle(payload: GoogleAuthPayload): Promise<AuthResponse> {
      return apiClient<AuthResponse>('/circle/api/auth/google', {
         method: 'POST',
         body: JSON.stringify(payload),
         skipAuth: true,
      });
   },

   async logout(): Promise<{ success: boolean }> {
      try {
         return await apiClient<{ success: boolean }>('/auth/api/logout', {
            method: 'POST',
         });
      } catch {
         return { success: true };
      }
   },

   async sendForgotPassword(email: string): Promise<{ success: boolean }> {
      return apiClient<{ success: boolean }>('/auth/api/forgot-password', {
         method: 'POST',
         body: JSON.stringify({ email }),
         skipAuth: true,
      });
   },

   async resetPassword(password: string, token: string): Promise<{ success: boolean }> {
      return apiClient<{ success: boolean }>('/auth/api/reset-password', {
         method: 'POST',
         body: JSON.stringify({ password, token }),
         skipAuth: true,
      });
   },
};
