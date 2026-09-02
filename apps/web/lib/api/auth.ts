import { apiClient } from './client';

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

import { Workspace } from './workspaces';

export interface AuthResponse {
   accessToken: string;
   refreshToken: string;
   user?: AuthUser;
   workspace?: Workspace;
   isNewUser?: boolean;
}

export async function login(payload: LoginPayload): Promise<AuthResponse> {
   return apiClient<AuthResponse>('/circle/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
      skipAuth: true,
   });
}

export async function signUp(payload: SignUpPayload): Promise<AuthResponse> {
   return apiClient<AuthResponse>('/circle/api/auth/sign-up', {
      method: 'POST',
      body: JSON.stringify(payload),
      skipAuth: true,
   });
}

export async function loginWithGoogle(payload: GoogleAuthPayload): Promise<AuthResponse> {
   return apiClient<AuthResponse>('/circle/api/auth/google', {
      method: 'POST',
      body: JSON.stringify(payload),
      skipAuth: true,
   });
}

export async function logout(): Promise<{ success: boolean }> {
   try {
      return await apiClient<{ success: boolean }>('/auth/api/logout', {
         method: 'POST',
      });
   } catch {
      return { success: true };
   }
}

export async function sendForgotPassword(email: string): Promise<{ success: boolean }> {
   return apiClient<{ success: boolean }>('/auth/api/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
      skipAuth: true,
   });
}

export async function resetPassword(
   password: string,
   token: string
): Promise<{ success: boolean }> {
   return apiClient<{ success: boolean }>('/auth/api/reset-password', {
      method: 'POST',
      body: JSON.stringify({ password, token }),
      skipAuth: true,
   });
}
