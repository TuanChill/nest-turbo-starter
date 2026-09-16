'use client';

import * as React from 'react';
import {
   Dialog,
   DialogContent,
   DialogDescription,
   DialogFooter,
   DialogHeader,
   DialogTitle,
   DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
   Select,
   SelectContent,
   SelectItem,
   SelectTrigger,
   SelectValue,
} from '@/components/ui/select';
import { useCreateMember } from '@/hooks/queries/use-members-query';
import { useTeams } from '@/hooks/queries/use-teams-query';
import { Check, Loader2, Plus, Search, UserPlus, X } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useParams } from 'next/navigation';

interface InviteMemberDialogProps {
   trigger?: React.ReactNode;
   open?: boolean;
   onOpenChange?: (open: boolean) => void;
}

export function InviteMemberDialog({
   trigger,
   open: controlledOpen,
   onOpenChange: setControlledOpen,
}: InviteMemberDialogProps) {
   const [internalOpen, setInternalOpen] = React.useState(false);
   const isControlled = controlledOpen !== undefined;
   const open = isControlled ? controlledOpen : internalOpen;
   const setOpen = isControlled ? setControlledOpen! : setInternalOpen;

   const createMemberMutation = useCreateMember();
   const { data: teams = [] } = useTeams();
   const { orgId } = useParams<{ orgId?: string }>();

   const [email, setEmail] = React.useState('');
   const [name, setName] = React.useState('');
   const [role, setRole] = React.useState<'Member' | 'Admin' | 'Guest'>('Member');
   const [selectedTeamIds, setSelectedTeamIds] = React.useState<string[]>([]);
   const [teamSearch, setTeamSearch] = React.useState('');
   const [isSubmitting, setIsSubmitting] = React.useState(false);

   const filteredTeams = React.useMemo(() => {
      if (!teamSearch.trim()) return teams;
      const query = teamSearch.toLowerCase().trim();
      return teams.filter(
         (t) => t.name.toLowerCase().includes(query) || t.id.toLowerCase().includes(query)
      );
   }, [teams, teamSearch]);

   const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setEmail(e.target.value);
   };

   const toggleTeam = (teamId: string) => {
      setSelectedTeamIds((prev) =>
         prev.includes(teamId) ? prev.filter((id) => id !== teamId) : [...prev, teamId]
      );
   };

   const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      const trimmedEmail = email.trim();
      if (!trimmedEmail) {
         toast.error('Please enter an email address');
         return;
      }
      // Simple email validation regex
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
         toast.error('Please enter a valid email address');
         return;
      }

      const displayName = name.trim();
      if (!displayName) {
         toast.error("Please enter the invitee's full name");
         return;
      }

      setIsSubmitting(true);
      try {
         const invitation = await createMemberMutation.mutateAsync({
            name: displayName,
            email: trimmedEmail,
            role,
            teamIds: selectedTeamIds,
            workspaceId: orgId,
         });

         if (invitation.inviteUrl) {
            try {
               await navigator.clipboard.writeText(invitation.inviteUrl);
               toast.success(`Invitation sent and secure link copied for ${trimmedEmail}`);
            } catch {
               toast.success(`Invitation sent to ${trimmedEmail}`);
               toast.info('The secure invitation link could not be copied automatically.');
            }
         } else {
            toast.success(`Invitation sent to ${trimmedEmail}`);
         }
         setEmail('');
         setName('');
         setRole('Member');
         setSelectedTeamIds([]);
         setOpen(false);
      } catch (err: unknown) {
         console.error('Failed to invite member:', err);
         const errorMessage = err instanceof Error ? err.message : 'Could not send invitation';
         toast.error(errorMessage);
      } finally {
         setIsSubmitting(false);
      }
   };

   return (
      <Dialog open={open} onOpenChange={setOpen}>
         {trigger ? (
            <DialogTrigger asChild>{trigger}</DialogTrigger>
         ) : (
            <DialogTrigger asChild>
               <Button className="relative" size="xs" variant="secondary">
                  <Plus className="size-4 mr-1" />
                  Invite
               </Button>
            </DialogTrigger>
         )}
         <DialogContent className="sm:max-w-[480px] p-0 gap-0 overflow-hidden bg-container border-border/60">
            <form onSubmit={handleSubmit}>
               <DialogHeader className="p-5 pb-4 border-b border-border/40">
                  <div className="flex items-center gap-2.5">
                     <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                        <UserPlus className="size-4" />
                     </div>
                     <div>
                        <DialogTitle className="text-base font-semibold">
                           Invite to workspace
                        </DialogTitle>
                        <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                           Invite new colleagues to collaborate on issues, cycles, and projects.
                        </DialogDescription>
                     </div>
                  </div>
               </DialogHeader>

               <div className="p-5 space-y-4">
                  {/* Email field */}
                  <div className="space-y-1.5">
                     <Label htmlFor="invite-email" className="text-xs font-medium">
                        Email address <span className="text-destructive">*</span>
                     </Label>
                     <Input
                        id="invite-email"
                        type="email"
                        placeholder="colleague@company.com"
                        value={email}
                        onChange={handleEmailChange}
                        disabled={isSubmitting}
                        required
                        autoFocus
                        className="h-9 text-sm"
                     />
                  </div>

                  {/* Name field */}
                  <div className="space-y-1.5">
                     <Label htmlFor="invite-name" className="text-xs font-medium">
                        Full name <span className="text-destructive">*</span>
                     </Label>
                     <Input
                        id="invite-name"
                        placeholder="Alex Morgan"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        disabled={isSubmitting}
                        className="h-9 text-sm"
                     />
                  </div>

                  {/* Role selector */}
                  <div className="space-y-1.5">
                     <Label htmlFor="invite-role" className="text-xs font-medium">
                        Role
                     </Label>
                     <Select
                        value={role}
                        onValueChange={(val: 'Member' | 'Admin' | 'Guest') => setRole(val)}
                        disabled={isSubmitting}
                     >
                        <SelectTrigger id="invite-role" className="h-9 text-sm">
                           <SelectValue placeholder="Select a role" />
                        </SelectTrigger>
                        <SelectContent className="bg-popover border-border/60">
                           <SelectItem value="Member">
                              <div className="flex flex-col text-left py-0.5">
                                 <span className="font-medium text-sm">Member</span>
                                 <span className="text-xs text-muted-foreground">
                                    Can view, create and edit all workspace items
                                 </span>
                              </div>
                           </SelectItem>
                           <SelectItem value="Admin">
                              <div className="flex flex-col text-left py-0.5">
                                 <span className="font-medium text-sm">Admin</span>
                                 <span className="text-xs text-muted-foreground">
                                    Full workspace and member management permissions
                                 </span>
                              </div>
                           </SelectItem>
                           <SelectItem value="Guest">
                              <div className="flex flex-col text-left py-0.5">
                                 <span className="font-medium text-sm">Guest</span>
                                 <span className="text-xs text-muted-foreground">
                                    Limited access to specific assigned teams and projects
                                 </span>
                              </div>
                           </SelectItem>
                        </SelectContent>
                     </Select>
                  </div>

                  {/* Team membership checkboxes */}
                  {teams.length > 0 && (
                     <div className="space-y-2 pt-1">
                        <div className="flex items-center justify-between">
                           <Label className="text-xs font-medium">Assign to teams</Label>
                           <span className="text-[11px] text-muted-foreground font-normal">
                              {selectedTeamIds.length} selected
                           </span>
                        </div>

                        {/* Team search input */}
                        {teams.length > 4 && (
                           <div className="relative">
                              <Search className="size-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                              <Input
                                 placeholder="Search teams by name..."
                                 value={teamSearch}
                                 onChange={(e) => setTeamSearch(e.target.value)}
                                 disabled={isSubmitting}
                                 className="h-8 pl-8 pr-7 text-xs bg-background/50"
                              />
                              {teamSearch && (
                                 <button
                                    type="button"
                                    onClick={() => setTeamSearch('')}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                 >
                                    <X className="size-3" />
                                 </button>
                              )}
                           </div>
                        )}

                        <div className="grid grid-cols-2 gap-2 max-h-36 overflow-y-auto pr-1">
                           {filteredTeams.map((team) => {
                              const isSelected = selectedTeamIds.includes(team.id);
                              return (
                                 <button
                                    key={team.id}
                                    type="button"
                                    onClick={() => toggleTeam(team.id)}
                                    className={cn(
                                       'flex items-center gap-2 p-2 rounded-md border text-xs text-left transition-all',
                                       isSelected
                                          ? 'border-primary bg-primary/10 text-foreground font-medium'
                                          : 'border-border/50 hover:bg-sidebar/50 text-muted-foreground'
                                    )}
                                 >
                                    <span className="text-sm shrink-0">{team.icon || '🛠️'}</span>
                                    <span className="truncate flex-1">{team.name}</span>
                                    {isSelected && (
                                       <Check className="size-3.5 text-primary shrink-0" />
                                    )}
                                 </button>
                              );
                           })}
                           {filteredTeams.length === 0 && (
                              <div className="col-span-2 py-4 text-center text-xs text-muted-foreground">
                                 No teams found matching &ldquo;{teamSearch}&rdquo;
                              </div>
                           )}
                        </div>
                     </div>
                  )}
               </div>

               <DialogFooter className="p-4 bg-muted/20 border-t border-border/40 flex items-center justify-between sm:justify-between">
                  <span className="text-[11px] text-muted-foreground">
                     The secure invitation link is copied after the invite is sent.
                  </span>

                  <div className="flex items-center gap-2">
                     <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setOpen(false)}
                        disabled={isSubmitting}
                        className="h-8 text-xs"
                     >
                        Cancel
                     </Button>
                     <Button
                        type="submit"
                        size="sm"
                        disabled={isSubmitting || !email.trim()}
                        className="h-8 text-xs gap-1.5"
                     >
                        {isSubmitting ? (
                           <>
                              <Loader2 className="size-3.5 animate-spin" />
                              Sending...
                           </>
                        ) : (
                           'Send invite'
                        )}
                     </Button>
                  </div>
               </DialogFooter>
            </form>
         </DialogContent>
      </Dialog>
   );
}
