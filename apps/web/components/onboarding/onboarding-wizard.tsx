'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { StepWorkspace, GRADIENT_PRESETS } from './step-workspace';
import { StepTeam } from './step-team';
import { StepInvite } from './step-invite';
import { onboardingService } from '@/services/onboarding.service';
import { Workspace } from '@/services/workspaces.service';
import { workspaceKeys, teamKeys } from '@/hooks/queries/keys';
import { useAuthStore } from '@/store/auth-store';
import { toast } from 'sonner';
import { ROUTES } from '@/constants/routes';

export function OnboardingWizard() {
   const router = useRouter();
   const queryClient = useQueryClient();
   const { user, setUser } = useAuthStore();

   const [step, setStep] = React.useState<1 | 2 | 3>(1);
   const [isSubmitting, setIsSubmitting] = React.useState(false);

   // Step 1: Workspace State
   const defaultWsName = user?.name ? `${user.name}'s Workspace` : 'My Workspace';
   const [workspaceName, setWorkspaceName] = React.useState(defaultWsName);
   const [workspaceSlug, setWorkspaceSlug] = React.useState(
      user?.name
         ? user.name
              .toLowerCase()
              .replace(/\s+/g, '-')
              .replace(/[^a-z0-9-]/g, '')
         : 'my-workspace'
   );
   const [workspaceIcon, setWorkspaceIcon] = React.useState(GRADIENT_PRESETS[0].value);

   // Step 2: Team State
   const [teamName, setTeamName] = React.useState('Engineering');
   const [teamKey, setTeamKey] = React.useState('ENG');
   const [teamIcon, setTeamIcon] = React.useState('⚡');
   const [teamColor, setTeamColor] = React.useState('#5e6ad2');

   // Step 3: Invite State
   const [inviteEmails, setInviteEmails] = React.useState<string[]>([]);

   const handleFinish = async () => {
      if (!workspaceName.trim() || !teamName.trim() || !teamKey.trim()) {
         toast.error('Workspace name, team name, and team key are required');
         return;
      }
      setIsSubmitting(true);
      try {
         const res = await onboardingService.completeOnboarding({
            workspaceName: workspaceName.trim(),
            workspaceSlug: workspaceSlug.trim() || undefined,
            workspaceIcon,
            teamName: teamName.trim(),
            teamKey: teamKey.trim().toUpperCase(),
            teamIcon,
            teamColor,
            inviteEmails: inviteEmails.length > 0 ? inviteEmails : undefined,
         });

         // Immediately update query cache with new workspace so downstream components never see empty list
         queryClient.setQueryData<Workspace[]>(workspaceKeys.lists(), (old) => {
            const list = Array.isArray(old) ? old.filter((w) => w.id !== res.workspace.id) : [];
            return [res.workspace as unknown as Workspace, ...list];
         });
         queryClient.setQueryData(workspaceKeys.detail(res.workspace.slug), res.workspace);
         queryClient.setQueryData(workspaceKeys.detail(res.workspace.id), res.workspace);

         // Update auth store user with new team ID
         if (user) {
            setUser({
               ...user,
               teamIds: Array.from(new Set([...(user.teamIds || []), res.team.id])),
            });
         }

         // Invalidate queries so that sidebar and team lists update across all active & inactive queries
         await Promise.all([
            queryClient.invalidateQueries({ queryKey: workspaceKeys.all, refetchType: 'all' }),
            queryClient.invalidateQueries({ queryKey: teamKeys.all, refetchType: 'all' }),
         ]);

         toast.success(`Welcome to ${res.workspace.name}! Your workspace is ready.`);

         // Redirect directly to the newly created team view
         const targetUrl = ROUTES.TEAM.ALL_ISSUES(res.workspace.slug, res.team.id);
         router.push(targetUrl);
      } catch (err: unknown) {
         const message = err instanceof Error ? err.message : 'Failed to complete onboarding';
         toast.error(message);
         setIsSubmitting(false);
      }
   };

   return (
      <div className="w-full max-w-[480px] z-10 flex flex-col items-center">
         {/* Top Brand Logo */}
         <div className="flex items-center gap-2 mb-6">
            <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-gradient-to-tr from-orange-600 to-amber-500 text-white font-bold text-sm shadow-md shadow-orange-500/20">
               <svg
                  className="size-4.5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
               >
                  <circle cx="12" cy="12" r="9" />
                  <path d="M12 7v5l3 3" />
               </svg>
            </div>
            <span className="font-semibold text-lg tracking-tight text-foreground">Circle</span>
            <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-muted text-muted-foreground border">
               Setup
            </span>
         </div>

         {/* Wizard Container Card */}
         <div className="w-full rounded-2xl border border-border/70 bg-card/75 backdrop-blur-2xl p-7 shadow-2xl shadow-black/50 transition-all duration-300">
            {/* Step Progress Indicators */}
            <div className="flex items-center justify-between gap-2 mb-6">
               <div
                  className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                     step >= 1 ? 'bg-primary' : 'bg-muted'
                  }`}
               />
               <div
                  className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                     step >= 2 ? 'bg-primary' : 'bg-muted'
                  }`}
               />
               <div
                  className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                     step >= 3 ? 'bg-primary' : 'bg-muted'
                  }`}
               />
            </div>

            {/* Step 1: Workspace */}
            {step === 1 && (
               <StepWorkspace
                  workspaceName={workspaceName}
                  setWorkspaceName={setWorkspaceName}
                  workspaceSlug={workspaceSlug}
                  setWorkspaceSlug={setWorkspaceSlug}
                  workspaceIcon={workspaceIcon}
                  setWorkspaceIcon={setWorkspaceIcon}
                  onNext={() => setStep(2)}
               />
            )}

            {/* Step 2: Team */}
            {step === 2 && (
               <StepTeam
                  teamName={teamName}
                  setTeamName={setTeamName}
                  teamKey={teamKey}
                  setTeamKey={setTeamKey}
                  teamIcon={teamIcon}
                  setTeamIcon={setTeamIcon}
                  teamColor={teamColor}
                  setTeamColor={setTeamColor}
                  onNext={() => setStep(3)}
                  onBack={() => setStep(1)}
               />
            )}

            {/* Step 3: Invite */}
            {step === 3 && (
               <StepInvite
                  inviteEmails={inviteEmails}
                  setInviteEmails={setInviteEmails}
                  workspaceSlug={workspaceSlug}
                  onFinish={handleFinish}
                  onBack={() => setStep(2)}
                  isSubmitting={isSubmitting}
               />
            )}
         </div>
      </div>
   );
}
