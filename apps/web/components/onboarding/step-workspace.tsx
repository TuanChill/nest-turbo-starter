'use client';

import * as React from 'react';
import { ArrowRight, Check, Globe, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SITE_HOST } from '@/lib/utils/site-url';

export const GRADIENT_PRESETS = [
   { label: 'Sunset', value: 'from-orange-600 to-amber-500' },
   { label: 'Indigo', value: 'from-indigo-600 to-violet-500' },
   { label: 'Emerald', value: 'from-emerald-600 to-teal-500' },
   { label: 'Rose', value: 'from-rose-600 to-pink-500' },
   { label: 'Cyan', value: 'from-blue-600 to-cyan-500' },
   { label: 'Fuchsia', value: 'from-fuchsia-600 to-purple-500' },
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

interface StepWorkspaceProps {
   workspaceName: string;
   setWorkspaceName: (val: string) => void;
   workspaceSlug: string;
   setWorkspaceSlug: (val: string) => void;
   workspaceIcon: string;
   setWorkspaceIcon: (val: string) => void;
   onNext: () => void;
}

export function StepWorkspace({
   workspaceName,
   setWorkspaceName,
   workspaceSlug,
   setWorkspaceSlug,
   workspaceIcon,
   setWorkspaceIcon,
   onNext,
}: StepWorkspaceProps) {
   const [isSlugCustomized, setIsSlugCustomized] = React.useState(false);

   const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      setWorkspaceName(val);
      if (!isSlugCustomized) {
         setWorkspaceSlug(slugify(val));
      }
   };

   const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setIsSlugCustomized(true);
      setWorkspaceSlug(slugify(e.target.value));
   };

   const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (workspaceName.trim()) {
         onNext();
      }
   };

   const initials = (workspaceName.trim() || 'Workspace').slice(0, 2).toUpperCase();

   return (
      <form onSubmit={handleSubmit} className="space-y-6">
         <div className="space-y-1 text-center sm:text-left">
            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-500 text-[11px] font-medium tracking-wide">
               <Sparkles className="size-3" />
               Step 1 of 3
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-foreground">
               Create your workspace
            </h2>
            <p className="text-xs text-muted-foreground">
               A workspace is your team&apos;s home for projects, issues, and cycles.
            </p>
         </div>

         {/* Live Preview Card */}
         <div className="flex items-center gap-3.5 p-3.5 rounded-xl border border-border/80 bg-muted/30 shadow-inner">
            <div
               className={`flex aspect-square size-11 items-center justify-center rounded-lg bg-gradient-to-tr ${workspaceIcon} text-white font-bold text-sm shadow-md transition-all`}
            >
               {initials}
            </div>
            <div className="flex-1 min-w-0">
               <p className="text-sm font-semibold truncate text-foreground">
                  {workspaceName.trim() || 'Your Company / Team'}
               </p>
               <p className="text-xs text-muted-foreground font-mono truncate flex items-center gap-1 mt-0.5">
                  <Globe className="size-3 shrink-0" />
                  {SITE_HOST}/{workspaceSlug || 'workspace-url'}
               </p>
            </div>
         </div>

         {/* Inputs */}
         <div className="space-y-4">
            <div className="space-y-1.5">
               <Label htmlFor="ws-name" className="text-xs font-medium text-foreground">
                  Workspace Name <span className="text-destructive">*</span>
               </Label>
               <Input
                  id="ws-name"
                  value={workspaceName}
                  onChange={handleNameChange}
                  placeholder="Acme Corp, Vercel, Linear..."
                  className="h-10 text-sm bg-background/60 border-input"
                  autoFocus
                  required
               />
            </div>

            <div className="space-y-1.5">
               <Label htmlFor="ws-slug" className="text-xs font-medium text-foreground">
                  Workspace URL Identifier
               </Label>
               <div className="flex items-center rounded-md border border-input bg-background/60 focus-within:ring-1 focus-within:ring-ring">
                  <span className="pl-3 text-xs text-muted-foreground font-mono select-none">
                     {SITE_HOST}/
                  </span>
                  <Input
                     id="ws-slug"
                     value={workspaceSlug}
                     onChange={handleSlugChange}
                     placeholder="acme-corp"
                     className="h-10 text-xs font-mono border-0 focus-visible:ring-0 shadow-none bg-transparent"
                  />
               </div>
            </div>

            {/* Gradient Selector */}
            <div className="space-y-2">
               <Label className="text-xs font-medium text-foreground">Workspace Color Style</Label>
               <div className="flex items-center gap-2.5 pt-0.5">
                  {GRADIENT_PRESETS.map((preset) => (
                     <button
                        key={preset.value}
                        type="button"
                        onClick={() => setWorkspaceIcon(preset.value)}
                        className={`relative size-8 rounded-lg bg-gradient-to-tr ${preset.value} flex items-center justify-center transition-transform hover:scale-105 ${
                           workspaceIcon === preset.value
                              ? 'ring-2 ring-primary ring-offset-2 ring-offset-background scale-110 shadow-lg'
                              : 'opacity-80'
                        }`}
                     >
                        {workspaceIcon === preset.value && <Check className="size-4 text-white" />}
                     </button>
                  ))}
               </div>
            </div>
         </div>

         {/* Bottom Action */}
         <div className="pt-2 flex justify-end">
            <Button
               type="submit"
               disabled={!workspaceName.trim()}
               className="h-9 px-5 text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-sm"
            >
               Continue
               <ArrowRight className="size-3.5 ml-1.5" />
            </Button>
         </div>
      </form>
   );
}
