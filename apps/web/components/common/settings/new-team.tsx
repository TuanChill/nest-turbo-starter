'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTeams, useCreateTeam, useUpdateTeam } from '@/hooks/queries/use-teams-query';
import { useWorkspaces } from '@/hooks/queries';
import { Check, Plus } from 'lucide-react';
import { useState } from 'react';
import { useParams } from 'next/navigation';
import { SettingsCard, SettingsRow, SettingsSection, SettingsShell } from './shared';

import { toast } from 'sonner';

/** "Join or create a team" settings page. */
export default function NewTeam() {
   const { data: teams = [] } = useTeams();
   const createTeamMutation = useCreateTeam();
   const updateTeamMutation = useUpdateTeam();
   const { orgId } = useParams<{ orgId?: string }>();
   const { data: workspaces = [] } = useWorkspaces();
   const currentWorkspaceId = workspaces.find((ws) => ws.slug === orgId || ws.id === orgId)?.id;
   const [teamName, setTeamName] = useState('');
   const [teamKey, setTeamKey] = useState('');
   const [isSubmitting, setIsSubmitting] = useState(false);

   const notJoined = teams.filter((team) => !team.joined);

   const toggleJoin = (teamId: string) => {
      const team = teams.find((t) => t.id === teamId);
      if (team) {
         updateTeamMutation.mutate({
            id: teamId,
            data: { joined: !team.joined },
         });
      }
   };

   const handleCreate = async () => {
      const trimmed = teamName.trim();
      const trimmedKey = teamKey.trim();
      if (!trimmed || !trimmedKey) return;
      setIsSubmitting(true);
      try {
         await createTeamMutation.mutateAsync({
            id: trimmedKey,
            name: trimmed,
            icon: '⚡',
            color: '#5e6ad2',
            joined: true,
            workspaceId: currentWorkspaceId,
         });
         toast.success(`Team "${trimmed}" created`);
         setTeamName('');
         setTeamKey('');
      } catch (err: unknown) {
         console.error('Failed to create team:', err);
         const errorMessage = err instanceof Error ? err.message : 'Could not create team';
         toast.error(errorMessage);
      } finally {
         setIsSubmitting(false);
      }
   };

   return (
      <SettingsShell
         title="Join or create a team"
         description="Teams organize issues, cycles and projects around the people working together"
      >
         <SettingsSection title="Create a new team">
            <SettingsCard>
               <div className="flex items-center gap-3 p-4">
                  <Input
                     placeholder="Team name, e.g. Mobile"
                     className="h-8 flex-1"
                     value={teamName}
                     onChange={(e) => setTeamName(e.target.value)}
                     onKeyDown={(e) => {
                        if (e.key === 'Enter') handleCreate();
                     }}
                  />
                  <Input
                     placeholder="Key"
                     className="h-8 w-20 uppercase"
                     value={teamKey}
                     maxLength={8}
                     onChange={(e) =>
                        setTeamKey(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))
                     }
                  />
                  <Button
                     size="xs"
                     onClick={handleCreate}
                     disabled={isSubmitting || !teamName.trim() || !teamKey.trim()}
                  >
                     <Plus className="size-3.5 mr-1" />
                     {isSubmitting ? 'Creating...' : 'Create team'}
                  </Button>
               </div>
            </SettingsCard>
         </SettingsSection>

         <SettingsSection title="Join an existing team">
            <SettingsCard>
               {notJoined.map((team) => (
                  <SettingsRow
                     key={team.id}
                     icon={<span className="text-sm">{team.icon}</span>}
                     title={team.name}
                     description={`${team.members?.length ?? 0} members · ${team.projects?.length ?? 0} projects`}
                     trailing={
                        <Button size="xs" variant="secondary" onClick={() => toggleJoin(team.id)}>
                           <Check className="size-3.5" />
                           Join
                        </Button>
                     }
                  />
               ))}
               {notJoined.length === 0 && (
                  <div className="p-4 text-xs text-muted-foreground text-center">
                     You are already a member of all workspace teams.
                  </div>
               )}
            </SettingsCard>
         </SettingsSection>
      </SettingsShell>
   );
}
