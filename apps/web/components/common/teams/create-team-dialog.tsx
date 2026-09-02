'use client';

import * as React from 'react';
import { useParams } from 'next/navigation';
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
import { Textarea } from '@/components/ui/textarea';
import { useCreateTeam } from '@/hooks/queries/use-teams-query';
import { useMembers } from '@/hooks/queries/use-members-query';
import { useWorkspaces } from '@/hooks/queries';
import { Check, Hash, Loader2, Plus, Search, Users, X } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface CreateTeamDialogProps {
   trigger?: React.ReactNode;
   open?: boolean;
   onOpenChange?: (open: boolean) => void;
}

const ICON_PRESETS = ['⚡', '📱', '🚀', '🎨', '🌐', '🔒', '🛠️', '💡', '📊', '🧠', '⚙️', '🔌'];
const COLOR_PRESETS = [
   '#5e6ad2', // Linear Indigo
   '#e5484d', // Crimson Red
   '#30a46c', // Emerald Green
   '#f76808', // Orange
   '#8e4ec6', // Purple
   '#12a594', // Teal
   '#f1c40f', // Sun Yellow
   '#34495e', // Slate Blue
];

export function CreateTeamDialog({
   trigger,
   open: controlledOpen,
   onOpenChange: setControlledOpen,
}: CreateTeamDialogProps) {
   const [internalOpen, setInternalOpen] = React.useState(false);
   const isControlled = controlledOpen !== undefined;
   const open = isControlled ? controlledOpen : internalOpen;
   const setOpen = isControlled ? setControlledOpen! : setInternalOpen;

   const createTeamMutation = useCreateTeam();
   const { data: members = [] } = useMembers();
   const { orgId } = useParams<{ orgId?: string }>();
   const { data: workspaces = [] } = useWorkspaces();
   const currentWorkspaceId = workspaces.find((ws) => ws.slug === orgId || ws.id === orgId)?.id;

   const [name, setName] = React.useState('');
   const [key, setKey] = React.useState('');
   const [isKeyManuallyEdited, setIsKeyManuallyEdited] = React.useState(false);
   const [selectedIcon, setSelectedIcon] = React.useState(ICON_PRESETS[0]);
   const [selectedColor, setSelectedColor] = React.useState(COLOR_PRESETS[0]);
   const [description, setDescription] = React.useState('');
   const [selectedMemberIds, setSelectedMemberIds] = React.useState<string[]>([]);
   const [memberSearch, setMemberSearch] = React.useState('');
   const [isSubmitting, setIsSubmitting] = React.useState(false);

   const filteredMembers = React.useMemo(() => {
      if (!memberSearch.trim()) return members;
      const query = memberSearch.toLowerCase().trim();
      return members.filter(
         (m) =>
            m.name.toLowerCase().includes(query) ||
            m.email?.toLowerCase().includes(query) ||
            m.id.toLowerCase().includes(query)
      );
   }, [members, memberSearch]);

   // Derive key from name automatically unless manually modified
   const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newName = e.target.value;
      setName(newName);
      if (!isKeyManuallyEdited) {
         const words = newName.trim().split(/\s+/).filter(Boolean);
         let generatedKey = '';
         if (words.length === 1) {
            generatedKey = words[0].slice(0, 4).toUpperCase();
         } else if (words.length > 1) {
            generatedKey = words
               .map((w) => w[0])
               .join('')
               .slice(0, 5)
               .toUpperCase();
         }
         setKey(generatedKey.replace(/[^A-Z0-9]/g, ''));
      }
   };

   const handleKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setKey(
         e.target.value
            .toUpperCase()
            .replace(/[^A-Z0-9]/g, '')
            .slice(0, 8)
      );
      setIsKeyManuallyEdited(true);
   };

   const toggleMember = (memberId: string) => {
      setSelectedMemberIds((prev) =>
         prev.includes(memberId) ? prev.filter((id) => id !== memberId) : [...prev, memberId]
      );
   };

   const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      const trimmedName = name.trim();
      if (!trimmedName) {
         toast.error('Please enter a team name');
         return;
      }

      let teamKey = key.trim();
      if (!teamKey) {
         teamKey =
            trimmedName
               .toUpperCase()
               .replace(/[^A-Z0-9]/g, '')
               .slice(0, 4) || 'TEAM';
      }

      setIsSubmitting(true);
      try {
         await createTeamMutation.mutateAsync({
            id: teamKey,
            name: trimmedName,
            icon: selectedIcon,
            color: selectedColor,
            joined: true,
            description: description.trim() || undefined,
            memberIds: selectedMemberIds,
            workspaceId: currentWorkspaceId,
         });

         toast.success(`Team "${trimmedName}" created successfully`);
         setName('');
         setKey('');
         setIsKeyManuallyEdited(false);
         setSelectedIcon(ICON_PRESETS[0]);
         setSelectedColor(COLOR_PRESETS[0]);
         setDescription('');
         setSelectedMemberIds([]);
         setOpen(false);
      } catch (err: unknown) {
         console.error('Failed to create team:', err);
         const errorMessage = err instanceof Error ? err.message : 'Could not create team';
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
                  Add team
               </Button>
            </DialogTrigger>
         )}
         <DialogContent className="sm:max-w-[500px] p-0 gap-0 overflow-hidden bg-container border-border/60">
            <form onSubmit={handleSubmit}>
               <DialogHeader className="p-5 pb-4 border-b border-border/40">
                  <div className="flex items-center gap-2.5">
                     <div
                        className="size-8 rounded-lg flex items-center justify-center text-lg shadow-sm"
                        style={{ backgroundColor: `${selectedColor}20`, color: selectedColor }}
                     >
                        <span>{selectedIcon}</span>
                     </div>
                     <div>
                        <DialogTitle className="text-base font-semibold">
                           Create a new team
                        </DialogTitle>
                        <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                           Teams organize issues, cycles, and projects around people working
                           together.
                        </DialogDescription>
                     </div>
                  </div>
               </DialogHeader>

               <div className="p-5 space-y-4 max-h-[65vh] overflow-y-auto">
                  {/* Name and Identifier Key row */}
                  <div className="grid grid-cols-3 gap-3">
                     <div className="col-span-2 space-y-1.5">
                        <Label htmlFor="team-name" className="text-xs font-medium">
                           Team name <span className="text-destructive">*</span>
                        </Label>
                        <Input
                           id="team-name"
                           placeholder="e.g. Mobile Engineering"
                           value={name}
                           onChange={handleNameChange}
                           disabled={isSubmitting}
                           required
                           autoFocus
                           className="h-9 text-sm"
                        />
                     </div>

                     <div className="col-span-1 space-y-1.5">
                        <Label
                           htmlFor="team-key"
                           className="text-xs font-medium flex items-center justify-between"
                        >
                           <span>Key</span>
                           {key && (
                              <span className="text-[10px] text-muted-foreground font-mono">
                                 {key}-1
                              </span>
                           )}
                        </Label>
                        <div className="relative">
                           <Hash className="size-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                           <Input
                              id="team-key"
                              placeholder="MOB"
                              value={key}
                              onChange={handleKeyChange}
                              disabled={isSubmitting}
                              className="h-9 pl-7 text-xs uppercase font-mono tracking-wider"
                           />
                        </div>
                     </div>
                  </div>

                  {/* Icon & Color selector */}
                  <div className="space-y-2">
                     <Label className="text-xs font-medium">Icon & Color</Label>
                     <div className="space-y-2.5 p-3 rounded-lg border border-border/50 bg-background/50">
                        {/* Emoji selection */}
                        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                           {ICON_PRESETS.map((icon) => (
                              <button
                                 key={icon}
                                 type="button"
                                 onClick={() => setSelectedIcon(icon)}
                                 className={cn(
                                    'size-8 rounded-md flex items-center justify-center text-sm transition-all shrink-0',
                                    selectedIcon === icon
                                       ? 'bg-primary/20 ring-2 ring-primary scale-105'
                                       : 'hover:bg-sidebar/80 opacity-75 hover:opacity-100'
                                 )}
                              >
                                 {icon}
                              </button>
                           ))}
                        </div>

                        {/* Color selection */}
                        <div className="flex items-center gap-2 pt-1 border-t border-border/30">
                           {COLOR_PRESETS.map((color) => (
                              <button
                                 key={color}
                                 type="button"
                                 onClick={() => setSelectedColor(color)}
                                 className={cn(
                                    'size-5 rounded-full transition-transform shrink-0 relative flex items-center justify-center',
                                    selectedColor === color
                                       ? 'scale-125 ring-2 ring-offset-2 ring-offset-background ring-primary'
                                       : 'opacity-80 hover:opacity-100'
                                 )}
                                 style={{ backgroundColor: color }}
                              >
                                 {selectedColor === color && (
                                    <Check className="size-3 text-white stroke-[3]" />
                                 )}
                              </button>
                           ))}
                        </div>
                     </div>
                  </div>

                  {/* Description field */}
                  <div className="space-y-1.5">
                     <Label htmlFor="team-desc" className="text-xs font-medium">
                        Description (optional)
                     </Label>
                     <Textarea
                        id="team-desc"
                        placeholder="What is this team focused on?"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        disabled={isSubmitting}
                        rows={2}
                        className="text-xs resize-none"
                     />
                  </div>

                  {/* Initial members selection */}
                  {members.length > 0 && (
                     <div className="space-y-2 pt-1">
                        <div className="flex items-center justify-between">
                           <Label className="text-xs font-medium flex items-center gap-1.5">
                              <Users className="size-3.5" />
                              Add members
                           </Label>
                           <span className="text-[11px] text-muted-foreground font-normal">
                              {selectedMemberIds.length} selected
                           </span>
                        </div>

                        {/* Search members input */}
                        <div className="relative">
                           <Search className="size-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                           <Input
                              placeholder="Search members by name or email..."
                              value={memberSearch}
                              onChange={(e) => setMemberSearch(e.target.value)}
                              disabled={isSubmitting}
                              className="h-8 pl-8 pr-7 text-xs bg-background/50"
                           />
                           {memberSearch && (
                              <button
                                 type="button"
                                 onClick={() => setMemberSearch('')}
                                 className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                              >
                                 <X className="size-3" />
                              </button>
                           )}
                        </div>

                        <div className="grid grid-cols-2 gap-1.5 max-h-36 overflow-y-auto pr-1">
                           {filteredMembers.map((member) => {
                              const isSelected = selectedMemberIds.includes(member.id);
                              return (
                                 <button
                                    key={member.id}
                                    type="button"
                                    onClick={() => toggleMember(member.id)}
                                    className={cn(
                                       'flex items-center gap-2 p-1.5 rounded-md border text-xs text-left transition-all',
                                       isSelected
                                          ? 'border-primary bg-primary/10 text-foreground font-medium'
                                          : 'border-border/40 hover:bg-sidebar/50 text-muted-foreground'
                                    )}
                                 >
                                    <Avatar className="size-5 shrink-0">
                                       <AvatarImage src={member.avatarUrl} alt={member.name} />
                                       <AvatarFallback className="text-[10px]">
                                          {member.name.slice(0, 2).toUpperCase()}
                                       </AvatarFallback>
                                    </Avatar>
                                    <span className="truncate flex-1">{member.name}</span>
                                    {isSelected && (
                                       <Check className="size-3 text-primary shrink-0" />
                                    )}
                                 </button>
                              );
                           })}
                           {filteredMembers.length === 0 && (
                              <div className="col-span-2 py-4 text-center text-xs text-muted-foreground">
                                 No members found matching &ldquo;{memberSearch}&rdquo;
                              </div>
                           )}
                        </div>
                     </div>
                  )}
               </div>

               <DialogFooter className="p-4 bg-muted/20 border-t border-border/40 flex items-center justify-end gap-2">
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
                     disabled={isSubmitting || !name.trim()}
                     className="h-8 text-xs gap-1.5"
                  >
                     {isSubmitting ? (
                        <>
                           <Loader2 className="size-3.5 animate-spin" />
                           Creating...
                        </>
                     ) : (
                        'Create team'
                     )}
                  </Button>
               </DialogFooter>
            </form>
         </DialogContent>
      </Dialog>
   );
}
