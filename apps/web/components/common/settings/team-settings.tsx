'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
   Dialog,
   DialogContent,
   DialogDescription,
   DialogFooter,
   DialogHeader,
   DialogTitle,
} from '@/components/ui/dialog';
import {
   AlertDialog,
   AlertDialogAction,
   AlertDialogCancel,
   AlertDialogContent,
   AlertDialogDescription,
   AlertDialogFooter,
   AlertDialogHeader,
   AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { getCyclesByTeam } from '@/mock-data/cycles';
import { status } from '@/mock-data/status';
import {
   Bot,
   ChevronRight,
   Lock,
   Radar,
   RefreshCcw,
   Repeat,
   Settings,
   Sparkles,
   Tag,
   Target,
   Users,
   Workflow,
   Zap,
   Loader2,
   Trash2,
   AlertTriangle,
} from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { SettingsCard, SettingsRow, SettingsSection } from './shared';
import { toast } from 'sonner';

interface TeamSettingsProps {
   teamId: string;
}

const EMOJI_PRESETS = ['🛠️', '🎨', '⚡', '🚀', '🔒', '📱', '🌐', '📊', '💡', '🧪', '📦', '🎯'];

function TeamSettingsSkeleton() {
   return (
      <div className="max-w-2xl mx-auto px-6 py-10 space-y-8 animate-in fade-in-50 duration-200">
         <div className="flex items-center gap-3">
            <div className="size-9 bg-muted/40 rounded-md animate-pulse" />
            <div className="space-y-2 flex-1">
               <div className="h-6 w-48 bg-muted/40 rounded animate-pulse" />
               <div className="h-4 w-64 bg-muted/40 rounded animate-pulse" />
            </div>
         </div>
         <div className="space-y-4">
            <div className="h-32 w-full bg-muted/20 rounded-lg border border-border/40 animate-pulse" />
            <div className="h-28 w-full bg-muted/20 rounded-lg border border-border/40 animate-pulse" />
            <div className="h-36 w-full bg-muted/20 rounded-lg border border-border/40 animate-pulse" />
         </div>
      </div>
   );
}

import {
   useTeam,
   useUpdateTeam,
   useDeleteTeam,
   useToggleJoinTeam,
} from '@/hooks/queries/use-teams-query';
import { Team } from '@/services/teams.service';

export default function TeamSettings({ teamId }: TeamSettingsProps) {
   const { orgId } = useParams<{ orgId: string }>();
   const router = useRouter();
   const { data: team, isLoading } = useTeam(teamId);
   const updateTeamMutation = useUpdateTeam();
   const deleteTeamMutation = useDeleteTeam();
   const toggleJoinMutation = useToggleJoinTeam();
   const updateTeam = (id: string, data: Partial<Team>) =>
      updateTeamMutation.mutateAsync({ id, data });
   const deleteTeam = (id: string) => deleteTeamMutation.mutateAsync(id);
   const toggleJoin = (id: string) => toggleJoinMutation.mutateAsync(id);

   // Dialog states
   const [generalOpen, setGeneralOpen] = React.useState(false);
   const [permissionsOpen, setPermissionsOpen] = React.useState(false);
   const [leaveOpen, setLeaveOpen] = React.useState(false);
   const [retireOpen, setRetireOpen] = React.useState(false);
   const [deleteOpen, setDeleteOpen] = React.useState(false);

   // General form state
   const [name, setName] = React.useState(team?.name || '');
   const [icon, setIcon] = React.useState(team?.icon || '⚡');
   const [description, setDescription] = React.useState(team?.description || '');
   const [isUpdating, setIsUpdating] = React.useState(false);

   // Delete confirmation state
   const [deleteConfirmText, setDeleteConfirmText] = React.useState('');
   const [isDeleting, setIsDeleting] = React.useState(false);

   React.useEffect(() => {
      if (team) {
         setName(team.name);
         setIcon(team.icon);
         setDescription(team.description || '');
      }
   }, [team]);

   if (isLoading) {
      return <TeamSettingsSkeleton />;
   }

   if (!team) {
      return (
         <div className="max-w-2xl mx-auto px-6 py-16 flex flex-col items-center justify-center gap-3 text-center animate-in fade-in-50 duration-200">
            <h1 className="text-xl font-semibold">Team not found</h1>
            <p className="text-sm text-muted-foreground">
               The requested team does not exist or has been deleted.
            </p>
            <Link
               href={`/${orgId ?? 'lndev-ui'}/teams`}
               className="mt-2 text-xs px-3 py-1.5 rounded-md border border-border/80 bg-accent hover:bg-accent/80 transition-colors font-medium text-foreground"
            >
               Back to teams
            </Link>
         </div>
      );
   }

   const cycles = getCyclesByTeam(team.id);

   const handleSaveGeneral = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!name.trim()) {
         toast.error('Team name cannot be empty');
         return;
      }
      setIsUpdating(true);
      try {
         await updateTeam(team.id, {
            name: name.trim(),
            icon,
            description: description.trim() || undefined,
         });
         toast.success('Team settings updated');
         setGeneralOpen(false);
      } catch (err: unknown) {
         toast.error(err instanceof Error ? err.message : 'Could not update team');
      } finally {
         setIsUpdating(false);
      }
   };

   const handleLeaveTeam = async () => {
      try {
         await toggleJoin(team.id);
         toast.success(`You left team "${team.name}"`);
         setLeaveOpen(false);
         router.push(`/${orgId}/teams`);
      } catch (err: unknown) {
         toast.error(err instanceof Error ? err.message : 'Could not leave team');
      }
   };

   const handleRetireTeam = async () => {
      toast.success(`Team "${team.name}" has been retired`);
      setRetireOpen(false);
   };

   const handleDeleteTeam = async () => {
      if (deleteConfirmText.trim() !== team.id) {
         toast.error(`Please type "${team.id}" to confirm deletion`);
         return;
      }
      setIsDeleting(true);
      try {
         await deleteTeam(team.id);
         toast.success(`Team "${team.name}" permanently deleted`);
         setDeleteOpen(false);
         router.push(`/${orgId}/teams`);
      } catch (err: unknown) {
         toast.error(err instanceof Error ? err.message : 'Could not delete team');
      } finally {
         setIsDeleting(false);
      }
   };

   return (
      <div className="w-full overflow-y-auto h-full">
         <div className="max-w-2xl mx-auto px-6 py-10 pb-20">
            <div className="flex items-center gap-3">
               <span className="inline-flex size-9 bg-muted/50 items-center justify-center rounded-md text-lg">
                  {team.icon}
               </span>
               <div className="flex-1">
                  <h1 className="text-2xl font-medium">{team.name}</h1>
                  <p className="text-sm text-muted-foreground">
                     {team.description || 'Accessible to all workspace members'}
                  </p>
               </div>
               <Link
                  href={`/${orgId}/team/${team.id}/overview`}
                  className="text-sm inline-flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
               >
                  Team overview
                  <ChevronRight className="size-4" />
               </Link>
            </div>

            <div className="flex flex-col gap-10 mt-10">
               <SettingsSection>
                  <SettingsCard>
                     <SettingsRow
                        icon={<Settings className="size-4" />}
                        title="General"
                        description="Name, identifier, icon, and description"
                        chevron
                        onClick={() => setGeneralOpen(true)}
                     />
                     <SettingsRow
                        icon={<Lock className="size-4" />}
                        title="Access and permissions"
                        description="Manage team visibility and member permissions"
                        chevron
                        onClick={() => setPermissionsOpen(true)}
                     />
                     <Link href={`/${orgId}/team/${team.id}/members`} className="block">
                        <SettingsRow
                           icon={<Users className="size-4" />}
                           title="Members"
                           description="Manage team members"
                           trailing={<span>{team.members.length} members</span>}
                           chevron
                           onClick={() => {}}
                        />
                     </Link>
                     <SettingsRow
                        icon={<Zap className="size-4" />}
                        title="Slack notifications"
                        description="Broadcast notifications to Slack"
                        trailing={<span>Off</span>}
                        chevron
                        onClick={() => toast.info('Connect Slack from Integrations settings')}
                     />
                  </SettingsCard>
               </SettingsSection>

               <SettingsSection title="Issues, projects, and docs">
                  <SettingsCard>
                     <Link href={`/${orgId}/settings/issue-labels`} className="block">
                        <SettingsRow
                           icon={<Tag className="size-4" />}
                           title="Issue labels"
                           description="Labels available to this team's issues"
                           trailing={<span>7 labels</span>}
                           chevron
                           onClick={() => {}}
                        />
                     </Link>
                     <SettingsRow
                        icon={<Repeat className="size-4" />}
                        title="Recurring issues"
                        description="Automatically create issues on a schedule"
                        trailing={<span>None</span>}
                        chevron
                        onClick={() =>
                           toast.info('Recurring schedules will be available in next sprint')
                        }
                     />
                  </SettingsCard>
               </SettingsSection>

               <SettingsSection title="Workflow">
                  <SettingsCard>
                     <SettingsRow
                        icon={<Target className="size-4" />}
                        title="Issue statuses"
                        description="Customize the statuses issues go through"
                        trailing={<span>{status.length} statuses</span>}
                        chevron
                        onClick={() =>
                           toast.info('Issue statuses match the workspace default for now')
                        }
                     />
                     <SettingsRow
                        icon={<Workflow className="size-4" />}
                        title="Workflows & automations"
                        description="Manage issue automations and git workflows"
                        chevron
                        onClick={() => toast.info('Automations are active for this team')}
                     />
                     <SettingsRow
                        icon={<Radar className="size-4" />}
                        title="Triage"
                        description="Streamline how you handle requests from outside your team"
                        trailing={<span>Enabled</span>}
                        chevron
                        onClick={() => toast.info('Triage inbox is enabled')}
                     />
                     <Link href={`/${orgId}/team/${team.id}/cycles`} className="block">
                        <SettingsRow
                           icon={<RefreshCcw className="size-4" />}
                           title="Cycles"
                           description="Focus your team over short, time-boxed windows"
                           trailing={<span>{cycles.length > 0 ? 'Active' : 'Off'}</span>}
                           chevron
                           onClick={() => {}}
                        />
                     </Link>
                  </SettingsCard>
               </SettingsSection>

               <SettingsSection title="AI & Agents">
                  <SettingsCard>
                     <Link href={`/${orgId}/settings/ai`} className="block">
                        <SettingsRow
                           icon={<Bot className="size-4" />}
                           title="Team agents"
                           description="Add guidance for how agents should operate within this team"
                           chevron
                           onClick={() => {}}
                        />
                     </Link>
                     <SettingsRow
                        icon={<Sparkles className="size-4" />}
                        title="Agent skills"
                        description="Agent skills shared with this team"
                        trailing={<span>None</span>}
                        chevron
                        onClick={() => toast.info('Configure skills in Workspace Settings > AI')}
                     />
                  </SettingsCard>
               </SettingsSection>

               <SettingsSection title="Danger zone">
                  <SettingsCard>
                     <SettingsRow
                        title="Leave team"
                        description="Remove yourself as a member of this team"
                        trailing={
                           <Button size="xs" variant="ghost" onClick={() => setLeaveOpen(true)}>
                              Leave team...
                           </Button>
                        }
                     />
                     <SettingsRow
                        title="Retire team"
                        description="Prevent creating and updating issues in this team while preserving all historical data"
                        muted
                        trailing={
                           <Button size="xs" variant="ghost" onClick={() => setRetireOpen(true)}>
                              Retire...
                           </Button>
                        }
                     />
                     <SettingsRow
                        title="Delete team"
                        description="Permanently delete this team and all its data"
                        muted
                        trailing={
                           <Button
                              size="xs"
                              variant="ghost"
                              className="text-destructive hover:text-destructive"
                              onClick={() => {
                                 setDeleteConfirmText('');
                                 setDeleteOpen(true);
                              }}
                           >
                              Delete...
                           </Button>
                        }
                     />
                  </SettingsCard>
               </SettingsSection>
            </div>
         </div>

         {/* General Settings Dialog */}
         <Dialog open={generalOpen} onOpenChange={setGeneralOpen}>
            <DialogContent className="sm:max-w-[480px]">
               <form onSubmit={handleSaveGeneral}>
                  <DialogHeader>
                     <DialogTitle>Team General Settings</DialogTitle>
                     <DialogDescription>Update team name, icon and description.</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                     <div className="space-y-1.5">
                        <Label htmlFor="edit-team-name">Team name</Label>
                        <Input
                           id="edit-team-name"
                           value={name}
                           onChange={(e) => setName(e.target.value)}
                           disabled={isUpdating}
                           required
                        />
                     </div>
                     <div className="space-y-1.5">
                        <Label>Team icon</Label>
                        <div className="flex flex-wrap gap-2 p-2 rounded-lg border border-border/40">
                           {EMOJI_PRESETS.map((emoji) => (
                              <button
                                 key={emoji}
                                 type="button"
                                 onClick={() => setIcon(emoji)}
                                 className={`size-8 rounded flex items-center justify-center text-base transition-all ${
                                    icon === emoji
                                       ? 'bg-primary/20 ring-2 ring-primary'
                                       : 'hover:bg-sidebar'
                                 }`}
                              >
                                 {emoji}
                              </button>
                           ))}
                        </div>
                     </div>
                     <div className="space-y-1.5">
                        <Label htmlFor="edit-team-desc">Description</Label>
                        <Textarea
                           id="edit-team-desc"
                           value={description}
                           onChange={(e) => setDescription(e.target.value)}
                           disabled={isUpdating}
                           rows={2}
                        />
                     </div>
                  </div>
                  <DialogFooter>
                     <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setGeneralOpen(false)}
                     >
                        Cancel
                     </Button>
                     <Button type="submit" size="sm" disabled={isUpdating || !name.trim()}>
                        {isUpdating ? (
                           <Loader2 className="size-3.5 animate-spin" />
                        ) : (
                           'Save changes'
                        )}
                     </Button>
                  </DialogFooter>
               </form>
            </DialogContent>
         </Dialog>

         {/* Access and Permissions Dialog */}
         <Dialog open={permissionsOpen} onOpenChange={setPermissionsOpen}>
            <DialogContent className="sm:max-w-[480px]">
               <DialogHeader>
                  <DialogTitle>Access & Permissions</DialogTitle>
                  <DialogDescription>
                     Control who can view, join, and post issues in this team.
                  </DialogDescription>
               </DialogHeader>
               <div className="space-y-4 py-4">
                  <div className="p-3 rounded-lg border border-border/60 bg-muted/20 space-y-1">
                     <span className="font-medium text-xs">Public to workspace</span>
                     <p className="text-xs text-muted-foreground">
                        Any member in the workspace can view issues, cycles, and projects of this
                        team.
                     </p>
                  </div>
               </div>
               <DialogFooter>
                  <Button type="button" size="sm" onClick={() => setPermissionsOpen(false)}>
                     Done
                  </Button>
               </DialogFooter>
            </DialogContent>
         </Dialog>

         {/* Leave Team Alert Dialog */}
         <AlertDialog open={leaveOpen} onOpenChange={setLeaveOpen}>
            <AlertDialogContent>
               <AlertDialogHeader>
                  <AlertDialogTitle>Leave team &ldquo;{team.name}&rdquo;?</AlertDialogTitle>
                  <AlertDialogDescription>
                     You will be removed from this team. You will no longer receive team-level
                     updates or issues assigned by default.
                  </AlertDialogDescription>
               </AlertDialogHeader>
               <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleLeaveTeam}>Leave team</AlertDialogAction>
               </AlertDialogFooter>
            </AlertDialogContent>
         </AlertDialog>

         {/* Retire Team Alert Dialog */}
         <AlertDialog open={retireOpen} onOpenChange={setRetireOpen}>
            <AlertDialogContent>
               <AlertDialogHeader>
                  <AlertDialogTitle>Retire team &ldquo;{team.name}&rdquo;?</AlertDialogTitle>
                  <AlertDialogDescription>
                     Retiring a team prevents creating and updating issues while preserving
                     historical data.
                  </AlertDialogDescription>
               </AlertDialogHeader>
               <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleRetireTeam}>Retire team</AlertDialogAction>
               </AlertDialogFooter>
            </AlertDialogContent>
         </AlertDialog>

         {/* Delete Team Dialog */}
         <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
            <DialogContent className="sm:max-w-[480px]">
               <DialogHeader>
                  <div className="flex items-center gap-2 text-destructive">
                     <AlertTriangle className="size-5" />
                     <DialogTitle className="text-destructive">
                        Delete team &ldquo;{team.name}&rdquo;
                     </DialogTitle>
                  </div>
                  <DialogDescription className="pt-1 text-xs">
                     This action cannot be undone. All issues, projects, and documents associated
                     with this team will be deleted.
                  </DialogDescription>
               </DialogHeader>
               <div className="space-y-3 py-3">
                  <Label className="text-xs">
                     Please type{' '}
                     <strong className="font-semibold text-foreground">{team.id}</strong> to
                     confirm:
                  </Label>
                  <Input
                     placeholder={team.id}
                     value={deleteConfirmText}
                     onChange={(e) => setDeleteConfirmText(e.target.value)}
                     disabled={isDeleting}
                     className="h-8 text-xs font-mono"
                  />
               </div>
               <DialogFooter>
                  <Button
                     type="button"
                     variant="ghost"
                     size="sm"
                     onClick={() => setDeleteOpen(false)}
                     disabled={isDeleting}
                  >
                     Cancel
                  </Button>
                  <Button
                     type="button"
                     variant="destructive"
                     size="sm"
                     disabled={isDeleting || deleteConfirmText.trim() !== team.id}
                     onClick={handleDeleteTeam}
                     className="gap-1.5"
                  >
                     {isDeleting ? (
                        <Loader2 className="size-3.5 animate-spin" />
                     ) : (
                        <Trash2 className="size-3.5" />
                     )}
                     Permanently delete
                  </Button>
               </DialogFooter>
            </DialogContent>
         </Dialog>
      </div>
   );
}
