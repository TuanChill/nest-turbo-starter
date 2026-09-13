'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import {
   Dialog,
   DialogContent,
   DialogDescription,
   DialogHeader,
   DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCreateWorkspace, useJoinWorkspace } from '@/hooks/queries';
import { PlusCircle, LogIn, Sparkles, Check, Globe } from 'lucide-react';
import { toast } from 'sonner';
import { ROUTES } from '@/constants/routes';
import { saveActiveWorkspace } from '@/lib/utils/workspace-persistence';

interface CreateOrJoinWorkspaceDialogProps {
   open: boolean;
   onOpenChange: (open: boolean) => void;
   defaultTab?: 'create' | 'join';
}

const GRADIENT_PRESETS = [
   { label: 'Sunset', value: 'from-orange-600 to-amber-500', initials: 'OR' },
   { label: 'Indigo', value: 'from-indigo-600 to-violet-500', initials: 'IN' },
   { label: 'Emerald', value: 'from-emerald-600 to-teal-500', initials: 'EM' },
   { label: 'Rose', value: 'from-rose-600 to-pink-500', initials: 'RO' },
   { label: 'Cyan', value: 'from-blue-600 to-cyan-500', initials: 'CY' },
   { label: 'Fuchsia', value: 'from-fuchsia-600 to-purple-500', initials: 'FU' },
];

function slugify(text: string): string {
   return text
      .toString()
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^\w\-]+/g, '')
      .replace(/\-\-+/g, '-')
      .replace(/^-+/, '')
      .replace(/-+$/, '');
}

export function CreateOrJoinWorkspaceDialog({
   open,
   onOpenChange,
   defaultTab = 'create',
}: CreateOrJoinWorkspaceDialogProps) {
   const router = useRouter();
   const [tab, setTab] = React.useState<'create' | 'join'>(defaultTab);

   // Create Form State
   const [name, setName] = React.useState('');
   const [slug, setSlug] = React.useState('');
   const [isSlugCustomized, setIsSlugCustomized] = React.useState(false);
   const [selectedGradient, setSelectedGradient] = React.useState(GRADIENT_PRESETS[0].value);
   const [description, setDescription] = React.useState('');

   // Join Form State
   const [joinQuery, setJoinQuery] = React.useState('');

   const createMutation = useCreateWorkspace();
   const joinMutation = useJoinWorkspace();

   React.useEffect(() => {
      if (open) {
         setTab(defaultTab);
         setName('');
         setSlug('');
         setIsSlugCustomized(false);
         setJoinQuery('');
      }
   }, [open, defaultTab]);

   const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newName = e.target.value;
      setName(newName);
      if (!isSlugCustomized) {
         setSlug(slugify(newName));
      }
   };

   const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setIsSlugCustomized(true);
      setSlug(slugify(e.target.value));
   };

   const handleCreate = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!name.trim()) {
         toast.error('Please enter a workspace name');
         return;
      }

      createMutation.mutate(
         {
            name: name.trim(),
            slug: slug.trim() || undefined,
            icon: selectedGradient,
            description: description.trim() || undefined,
         },
         {
            onSuccess: (newWorkspace) => {
               onOpenChange(false);
               saveActiveWorkspace(newWorkspace.slug);
               router.push(ROUTES.WORKSPACE.MY_ISSUES(newWorkspace.slug));
            },
         }
      );
   };

   const handleJoin = async (e: React.FormEvent) => {
      e.preventDefault();
      const query = joinQuery.trim();
      if (!query) {
         toast.error('Please enter an invite code or workspace URL');
         return;
      }

      // If it starts with CIR-, it's likely an inviteCode, otherwise could be slug or full URL
      let inviteCode: string | undefined = undefined;
      let slugParam: string | undefined = undefined;

      if (query.toUpperCase().startsWith('CIR-')) {
         inviteCode = query.toUpperCase();
      } else if (query.includes('/')) {
         // extracted slug from URL
         const parts = query.split('/').filter(Boolean);
         slugParam = parts[parts.length - 1];
      } else {
         inviteCode = query.toUpperCase();
         slugParam = slugify(query);
      }

      joinMutation.mutate(
         {
            inviteCode,
            slug: slugParam,
         },
         {
            onSuccess: (joinedWorkspace) => {
               onOpenChange(false);
               saveActiveWorkspace(joinedWorkspace.slug);
               router.push(ROUTES.WORKSPACE.MY_ISSUES(joinedWorkspace.slug));
            },
         }
      );
   };

   const nameInitials = (name.trim() || 'Workspace').slice(0, 2).toUpperCase();

   return (
      <Dialog open={open} onOpenChange={onOpenChange}>
         <DialogContent className="sm:max-w-[480px] p-0 overflow-hidden bg-card border-border/80 shadow-2xl">
            <DialogHeader className="p-6 pb-4 border-b border-border/50 bg-muted/20">
               <DialogTitle className="text-lg font-semibold tracking-tight flex items-center gap-2">
                  <Sparkles className="size-5 text-orange-500" />
                  Workspaces
               </DialogTitle>
               <DialogDescription className="text-xs text-muted-foreground">
                  Create a new team workspace or join an existing organization.
               </DialogDescription>
            </DialogHeader>

            <Tabs
               value={tab}
               onValueChange={(val) => setTab(val as 'create' | 'join')}
               className="w-full"
            >
               <div className="px-6 pt-4">
                  <TabsList className="grid grid-cols-2 w-full h-9 bg-muted/60 p-1">
                     <TabsTrigger
                        value="create"
                        className="text-xs font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm flex items-center gap-1.5"
                     >
                        <PlusCircle className="size-3.5" />
                        Create Workspace
                     </TabsTrigger>
                     <TabsTrigger
                        value="join"
                        className="text-xs font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm flex items-center gap-1.5"
                     >
                        <LogIn className="size-3.5" />
                        Join Workspace
                     </TabsTrigger>
                  </TabsList>
               </div>

               {/* TAB 1: CREATE */}
               <TabsContent
                  value="create"
                  className="p-6 pt-4 space-y-4 focus-visible:outline-none"
               >
                  <form onSubmit={handleCreate} className="space-y-4">
                     {/* Preview Card */}
                     <div className="flex items-center gap-3 p-3 rounded-lg border border-border/60 bg-muted/30">
                        <div
                           className={`flex aspect-square size-10 items-center justify-center rounded-lg bg-gradient-to-tr ${selectedGradient} text-white font-bold text-sm shadow-md`}
                        >
                           {nameInitials}
                        </div>
                        <div className="flex-1 min-w-0">
                           <p className="text-sm font-semibold truncate text-foreground">
                              {name.trim() || 'New Workspace'}
                           </p>
                           <p className="text-xs text-muted-foreground font-mono truncate flex items-center gap-1">
                              <Globe className="size-3" />
                              localhost:3001/{slug || 'workspace-url'}
                           </p>
                        </div>
                     </div>

                     {/* Workspace Name */}
                     <div className="space-y-1.5">
                        <Label htmlFor="ws-name" className="text-xs font-medium">
                           Workspace Name <span className="text-destructive">*</span>
                        </Label>
                        <Input
                           id="ws-name"
                           value={name}
                           onChange={handleNameChange}
                           placeholder="Acme Corp, Design Studio..."
                           className="h-9 text-sm bg-background/50"
                           autoFocus
                           required
                        />
                     </div>

                     {/* Workspace Slug */}
                     <div className="space-y-1.5">
                        <Label htmlFor="ws-slug" className="text-xs font-medium">
                           Workspace URL Identifier
                        </Label>
                        <div className="flex items-center rounded-md border border-input bg-background/50 focus-within:ring-1 focus-within:ring-ring">
                           <span className="pl-3 text-xs text-muted-foreground font-mono select-none">
                              /
                           </span>
                           <Input
                              id="ws-slug"
                              value={slug}
                              onChange={handleSlugChange}
                              placeholder="acme-corp"
                              className="h-9 text-xs font-mono border-0 focus-visible:ring-0 shadow-none bg-transparent"
                           />
                        </div>
                     </div>

                     {/* Gradient Selection */}
                     <div className="space-y-1.5">
                        <Label className="text-xs font-medium">Icon Color Style</Label>
                        <div className="flex items-center gap-2 pt-1">
                           {GRADIENT_PRESETS.map((preset) => (
                              <button
                                 key={preset.value}
                                 type="button"
                                 onClick={() => setSelectedGradient(preset.value)}
                                 className={`relative size-7 rounded-full bg-gradient-to-tr ${preset.value} flex items-center justify-center transition-transform hover:scale-105 ${
                                    selectedGradient === preset.value
                                       ? 'ring-2 ring-primary ring-offset-2 ring-offset-background scale-110'
                                       : 'opacity-80'
                                 }`}
                              >
                                 {selectedGradient === preset.value && (
                                    <Check className="size-3.5 text-white" />
                                 )}
                              </button>
                           ))}
                        </div>
                     </div>

                     {/* Description */}
                     <div className="space-y-1.5">
                        <Label htmlFor="ws-desc" className="text-xs font-medium">
                           Description{' '}
                           <span className="text-xs text-muted-foreground font-normal">
                              (Optional)
                           </span>
                        </Label>
                        <Input
                           id="ws-desc"
                           value={description}
                           onChange={(e) => setDescription(e.target.value)}
                           placeholder="Primary team workspace for tasks and issues"
                           className="h-9 text-xs bg-background/50"
                        />
                     </div>

                     <div className="pt-2 flex justify-end gap-2">
                        <Button
                           type="button"
                           variant="outline"
                           size="sm"
                           onClick={() => onOpenChange(false)}
                           className="text-xs h-8"
                        >
                           Cancel
                        </Button>
                        <Button
                           type="submit"
                           size="sm"
                           disabled={createMutation.isPending || !name.trim()}
                           className="text-xs h-8 bg-primary text-primary-foreground hover:bg-primary/90"
                        >
                           {createMutation.isPending ? (
                              <div className="size-3.5 border-2 border-current border-t-transparent rounded-full animate-spin mr-1.5" />
                           ) : (
                              <PlusCircle className="size-3.5 mr-1.5" />
                           )}
                           Create Workspace
                        </Button>
                     </div>
                  </form>
               </TabsContent>

               {/* TAB 2: JOIN */}
               <TabsContent value="join" className="p-6 pt-4 space-y-4 focus-visible:outline-none">
                  <form onSubmit={handleJoin} className="space-y-4">
                     <div className="p-3.5 rounded-lg border border-border/60 bg-muted/20 text-xs text-muted-foreground space-y-1">
                        <p className="font-medium text-foreground">Have an invite code?</p>
                        <p>
                           Enter the workspace invite code (e.g.{' '}
                           <code className="text-foreground font-mono bg-muted px-1 rounded">
                              CIR-4GADZR
                           </code>
                           ) or the workspace URL provided by your administrator.
                        </p>
                     </div>

                     <div className="space-y-1.5">
                        <Label htmlFor="ws-code" className="text-xs font-medium">
                           Invite Code or Workspace URL
                        </Label>
                        <Input
                           id="ws-code"
                           value={joinQuery}
                           onChange={(e) => setJoinQuery(e.target.value)}
                           placeholder="e.g. CIR-WELCOME or acme-corp"
                           className="h-9 text-sm bg-background/50"
                           autoFocus
                           required
                        />
                     </div>

                     <div className="pt-2 flex justify-end gap-2">
                        <Button
                           type="button"
                           variant="outline"
                           size="sm"
                           onClick={() => onOpenChange(false)}
                           className="text-xs h-8"
                        >
                           Cancel
                        </Button>
                        <Button
                           type="submit"
                           size="sm"
                           disabled={joinMutation.isPending || !joinQuery.trim()}
                           className="text-xs h-8 bg-primary text-primary-foreground hover:bg-primary/90"
                        >
                           {joinMutation.isPending ? (
                              <div className="size-3.5 border-2 border-current border-t-transparent rounded-full animate-spin mr-1.5" />
                           ) : (
                              <LogIn className="size-3.5 mr-1.5" />
                           )}
                           Join Workspace
                        </Button>
                     </div>
                  </form>
               </TabsContent>
            </Tabs>
         </DialogContent>
      </Dialog>
   );
}
