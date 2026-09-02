'use client';

import * as React from 'react';
import { ArrowLeft, Check, Copy, Link as LinkIcon, Sparkles, UserPlus, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

interface StepInviteProps {
   inviteEmails: string[];
   setInviteEmails: (emails: string[]) => void;
   workspaceSlug: string;
   onFinish: () => void;
   onBack: () => void;
   isSubmitting: boolean;
}

export function StepInvite({
   inviteEmails,
   setInviteEmails,
   workspaceSlug,
   onFinish,
   onBack,
   isSubmitting,
}: StepInviteProps) {
   const [emailInput, setEmailInput] = React.useState('');
   const [copied, setCopied] = React.useState(false);

   const inviteUrl =
      typeof window !== 'undefined'
         ? `${window.location.origin}/join/${workspaceSlug || 'circle'}`
         : `http://localhost:3001/join/${workspaceSlug || 'circle'}`;

   const handleAddEmail = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter' || e.key === ',') {
         e.preventDefault();
         const clean = emailInput.trim().toLowerCase();
         if (clean && clean.includes('@') && !inviteEmails.includes(clean)) {
            setInviteEmails([...inviteEmails, clean]);
            setEmailInput('');
         }
      }
   };

   const removeEmail = (target: string) => {
      setInviteEmails(inviteEmails.filter((em) => em !== target));
   };

   const copyInviteLink = () => {
      navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      toast.success('Invite link copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
   };

   const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      // If there is un-entered text in input, add it if valid
      if (emailInput.trim() && emailInput.includes('@')) {
         const clean = emailInput.trim().toLowerCase();
         if (!inviteEmails.includes(clean)) {
            setInviteEmails([...inviteEmails, clean]);
         }
      }
      onFinish();
   };

   return (
      <form onSubmit={handleSubmit} className="space-y-6">
         <div className="space-y-1 text-center sm:text-left">
            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-500 text-[11px] font-medium tracking-wide">
               <Users className="size-3" />
               Step 3 of 3
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-foreground">
               Invite your teammates
            </h2>
            <p className="text-xs text-muted-foreground">
               Linear works best with your team. Invite colleagues or share a join link.
            </p>
         </div>

         {/* Shareable Invite Link Card */}
         <div className="p-3.5 rounded-xl border border-border/80 bg-muted/20 space-y-2">
            <div className="flex items-center justify-between text-xs">
               <span className="font-medium text-foreground flex items-center gap-1.5">
                  <LinkIcon className="size-3.5 text-primary" />
                  1-Click Invite Link
               </span>
               <span className="text-[11px] text-muted-foreground">Anyone with link can join</span>
            </div>
            <div className="flex items-center gap-2">
               <div className="flex-1 px-3 py-2 rounded-lg border border-input bg-background/70 font-mono text-xs text-muted-foreground truncate select-all">
                  {inviteUrl}
               </div>
               <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={copyInviteLink}
                  className="h-8.5 px-3 text-xs shrink-0"
               >
                  {copied ? (
                     <>
                        <Check className="size-3.5 mr-1.5 text-emerald-500" />
                        Copied
                     </>
                  ) : (
                     <>
                        <Copy className="size-3.5 mr-1.5" />
                        Copy
                     </>
                  )}
               </Button>
            </div>
         </div>

         {/* Email Input Tags */}
         <div className="space-y-2">
            <Label htmlFor="invite-input" className="text-xs font-medium text-foreground">
               Email Addresses <span className="text-muted-foreground font-normal">(Optional)</span>
            </Label>
            <div className="p-2 min-h-[72px] rounded-lg border border-input bg-background/60 focus-within:ring-1 focus-within:ring-ring space-y-2">
               {inviteEmails.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                     {inviteEmails.map((email) => (
                        <span
                           key={email}
                           className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-muted text-xs text-foreground font-medium border border-border/60"
                        >
                           <span className="truncate max-w-[180px]">{email}</span>
                           <button
                              type="button"
                              onClick={() => removeEmail(email)}
                              className="text-muted-foreground hover:text-foreground text-xs leading-none"
                           >
                              ×
                           </button>
                        </span>
                     ))}
                  </div>
               )}
               <Input
                  id="invite-input"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  onKeyDown={handleAddEmail}
                  placeholder={
                     inviteEmails.length === 0
                        ? 'colleague@company.com (press Enter to add)'
                        : 'Add more emails...'
                  }
                  className="h-8 text-xs border-0 shadow-none focus-visible:ring-0 px-1 bg-transparent"
               />
            </div>
            <p className="text-[11px] text-muted-foreground">
               Type an email and press{' '}
               <kbd className="px-1 py-0.5 bg-muted rounded border text-[10px]">Enter</kbd> to add.
            </p>
         </div>

         {/* Bottom Action Buttons */}
         <div className="pt-2 flex items-center justify-between">
            <Button
               type="button"
               variant="outline"
               size="sm"
               onClick={onBack}
               disabled={isSubmitting}
               className="h-9 px-4 text-xs font-medium"
            >
               <ArrowLeft className="size-3.5 mr-1.5" />
               Back
            </Button>
            <div className="flex items-center gap-2">
               <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={onFinish}
                  disabled={isSubmitting}
                  className="h-9 text-xs text-muted-foreground hover:text-foreground"
               >
                  Skip for now
               </Button>
               <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="h-9 px-5 text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-sm"
               >
                  {isSubmitting ? (
                     <>
                        <div className="size-3.5 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                        Setting up...
                     </>
                  ) : (
                     <>
                        <Sparkles className="size-3.5 mr-1.5" />
                        Finish Setup
                     </>
                  )}
               </Button>
            </div>
         </div>
      </form>
   );
}
