'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Command, CommandGroup, CommandItem, CommandList } from '@/components/ui/command';
import type { ActivityItem } from '@/mock-data/issue-details';
import type { Member } from '@/services/members.service';
import { useAuthStore } from '@/store/auth-store';
import { addIssueComment, addIssueReaction, removeIssueReaction } from '@/lib/api/issues';
import { toast } from 'sonner';
import {
   Ban,
   CircleDot,
   GitPullRequestArrow,
   Link2,
   PenLine,
   Plus,
   RefreshCcw,
   SmilePlus,
   Tag,
   Unlock,
} from 'lucide-react';
import { ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import { ContentBlocks } from './content-blocks';

const EVENT_ICONS: Record<string, ReactNode> = {
   created: <PenLine className="size-3.5" />,
   status: <CircleDot className="size-3.5" />,
   label: <Tag className="size-3.5" />,
   priority: <CircleDot className="size-3.5" />,
   cycle: <RefreshCcw className="size-3.5" />,
   blocked: <Ban className="size-3.5" />,
   unblocked: <Unlock className="size-3.5" />,
   related: <Link2 className="size-3.5" />,
   pr: <GitPullRequestArrow className="size-3.5" />,
};

function EventRow({ item }: { item: Extract<ActivityItem, { kind: 'event' }> }) {
   return (
      <div className="flex items-center gap-2.5 text-sm text-muted-foreground py-1.5">
         <span className="size-5 rounded-full bg-accent flex items-center justify-center shrink-0">
            {EVENT_ICONS[item.event] ?? <CircleDot className="size-3.5" />}
         </span>
         <span className="min-w-0 truncate">
            <span className="text-foreground/90 font-medium">
               {item.actor?.name || 'Unknown member'}
            </span>{' '}
            {item.text}
         </span>
         <span className="shrink-0 text-xs">· {item.timeAgo}</span>
      </div>
   );
}

function CommentCard({
   item,
   onReact,
   members,
}: {
   item: Extract<ActivityItem, { kind: 'comment' }>;
   onReact?: (activityId: string, emoji: string) => void;
   members?: Map<string, { name: string }>;
}) {
   return (
      <div className="my-2 rounded-lg border border-border/60 bg-container p-3.5">
         <div className="flex items-center gap-2 mb-1.5">
            <Avatar className="size-5">
               <AvatarImage src={item.actor?.avatarUrl} alt={item.actor?.name} />
               <AvatarFallback>{item.actor?.name?.[0] || '?'}</AvatarFallback>
            </Avatar>
            <span className="text-sm font-medium">{item.actor?.name || 'Unknown member'}</span>
            <span className="text-xs text-muted-foreground">{item.timeAgo}</span>
         </div>
         <div className="text-sm [&_p]:my-1.5">
            <ContentBlocks blocks={item.body} members={members} />
         </div>
         <div className="flex items-center gap-1.5 mt-1">
            {item.reactions?.map((reaction) => (
               <button
                  key={reaction.emoji}
                  onClick={() => onReact?.(item.id, reaction.emoji)}
                  className="inline-flex items-center gap-1 text-xs bg-accent/60 hover:bg-accent border border-border/60 rounded-full px-2 py-0.5 transition-colors cursor-pointer"
               >
                  {reaction.emoji} {reaction.count}
               </button>
            ))}
            <button
               onClick={() => onReact?.(item.id, '👍')}
               className="text-muted-foreground hover:text-foreground p-1 transition-colors"
               title="Add thumbs up"
            >
               <SmilePlus className="size-3.5" />
            </button>
         </div>
      </div>
   );
}

export function ActivityFeed({
   activity,
   issueIdentifier,
   members = [],
   isSubscribed = false,
   isSubscriptionPending = false,
   onToggleSubscription,
}: {
   activity: ActivityItem[];
   issueIdentifier?: string;
   members?: Member[];
   isSubscribed?: boolean;
   isSubscriptionPending?: boolean;
   onToggleSubscription?: () => void;
}) {
   const [items, setItems] = useState<ActivityItem[]>(activity);
   const [draft, setDraft] = useState('');
   const [isSubmitting, setIsSubmitting] = useState(false);
   const [submitError, setSubmitError] = useState<string | null>(null);
   const skipNextActivitySyncRef = useRef(false);
   const { user } = useAuthStore();
   const textareaRef = useRef<HTMLTextAreaElement>(null);

   // Active `@` mention query, if the caret is right after an in-progress `@token`.
   const [mentionQuery, setMentionQuery] = useState<string | null>(null);
   const [mentionStart, setMentionStart] = useState(-1);

   const membersById = useMemo(() => new Map(members.map((m) => [m.id, m])), [members]);

   const mentionMatches = useMemo(() => {
      if (mentionQuery === null) return [];
      const q = mentionQuery.toLowerCase();
      return members
         .filter((m) => m.name.toLowerCase().includes(q) || m.id.toLowerCase().includes(q))
         .slice(0, 6);
   }, [mentionQuery, members]);

   useEffect(() => {
      if (!activity || isSubmitting) return;

      if (skipNextActivitySyncRef.current) {
         skipNextActivitySyncRef.current = false;
         return;
      }

      // Activity is refetched after issue mutations. Do not replace the local
      // feed while the composer is focused or contains unsent text: that
      // update can reset the subtree and make typing lose its caret.
      const composerIsActive = Boolean(draft) || textareaRef.current === document.activeElement;
      if (composerIsActive) return;
      setItems(activity);
   }, [activity, draft, isSubmitting]);

   const handleDraftChange = (value: string, cursorPos: number) => {
      setDraft(value);
      const uptoCursor = value.slice(0, cursorPos);
      const match = uptoCursor.match(/(?:^|\s)@([a-z0-9_.-]*)$/i);
      if (match) {
         setMentionQuery(match[1]);
         setMentionStart(cursorPos - match[1].length - 1);
      } else {
         setMentionQuery(null);
         setMentionStart(-1);
      }
   };

   const selectMention = (member: Member) => {
      if (mentionStart < 0 || mentionQuery === null) return;
      const before = draft.slice(0, mentionStart);
      const after = draft.slice(mentionStart + 1 + mentionQuery.length);
      const inserted = `@${member.id} `;
      const newDraft = `${before}${inserted}${after}`;
      setDraft(newDraft);
      setMentionQuery(null);
      setMentionStart(-1);

      requestAnimationFrame(() => {
         const el = textareaRef.current;
         if (el) {
            const pos = before.length + inserted.length;
            el.focus();
            el.setSelectionRange(pos, pos);
         }
      });
   };

   const submitComment = async () => {
      const text = draft.trim();
      if (!text || !user) return;
      if (!issueIdentifier) {
         const message = 'Unable to post a comment without an issue identifier';
         setSubmitError(message);
         toast.error(message);
         return;
      }
      setIsSubmitting(true);
      setSubmitError(null);
      try {
         const updated = await addIssueComment(issueIdentifier, {
            textContent: text,
            commentBlocks: [{ type: 'paragraph', text }],
         });
         if (updated?.activity) {
            skipNextActivitySyncRef.current = true;
            setItems(updated.activity);
         }
         setDraft('');
         setMentionQuery(null);
         setMentionStart(-1);
      } catch (err) {
         const message = err instanceof Error ? err.message : 'Failed to post comment';
         setSubmitError(message);
         toast.error(message);
         console.error(`Failed to post comment on ${issueIdentifier}:`, err);
      } finally {
         setIsSubmitting(false);
      }
   };

   const handleReact = async (activityId: string, emoji: string) => {
      if (!user) return;
      const currentItem = items.find((item) => item.id === activityId);
      const currentReaction =
         currentItem?.kind === 'comment'
            ? currentItem.reactions?.find((reaction) => reaction.emoji === emoji)
            : undefined;
      const hasReacted = Boolean(currentReaction?.userIds?.includes(user.id));
      // Optimistic update
      const previousItems = items;
      setItems((prev) =>
         prev.map((item) => {
            if (item.id !== activityId || item.kind !== 'comment') return item;
            const reactions = item.reactions ? [...item.reactions] : [];
            const existing = reactions.find((r) => r.emoji === emoji);
            if (hasReacted && existing) {
               const userIds = (existing.userIds || []).filter((userId) => userId !== user.id);
               if (userIds.length === 0) {
                  return { ...item, reactions: reactions.filter((r) => r.emoji !== emoji) };
               }
               existing.userIds = userIds;
               existing.count = userIds.length;
            } else if (existing) {
               const userIds = [...(existing.userIds || []), user.id];
               existing.userIds = userIds;
               existing.count = userIds.length;
            } else {
               reactions.push({ emoji, count: 1, userIds: [user.id] });
            }
            return { ...item, reactions };
         })
      );

      try {
         if (hasReacted) {
            await removeIssueReaction(activityId, emoji);
         } else {
            await addIssueReaction(activityId, emoji, user.id);
         }
      } catch (err) {
         setItems(previousItems);
         toast.error(err instanceof Error ? err.message : 'Failed to update reaction');
      }
   };

   return (
      <div className="mt-10">
         <div className="flex items-center justify-between mb-2">
            <h2 className="text-base font-semibold">Activity</h2>
            <button
               type="button"
               onClick={onToggleSubscription}
               disabled={!onToggleSubscription || isSubscriptionPending}
               aria-pressed={isSubscribed}
               className="text-xs text-muted-foreground hover:text-foreground disabled:opacity-50"
            >
               {isSubscriptionPending ? 'Saving...' : isSubscribed ? 'Unsubscribe' : 'Subscribe'}
            </button>
         </div>
         {submitError && <p className="mb-2 text-xs text-destructive">{submitError}</p>}

         <div className="flex flex-col">
            {items.map((item) =>
               item.kind === 'event' ? (
                  <EventRow key={item.id} item={item} />
               ) : (
                  <CommentCard
                     key={item.id}
                     item={item}
                     onReact={handleReact}
                     members={membersById}
                  />
               )
            )}
         </div>

         {/* Composer */}
         <div className="relative mt-3 rounded-lg border border-border/60 bg-container p-3 flex flex-col gap-2">
            {mentionQuery !== null && mentionMatches.length > 0 && (
               <div className="absolute bottom-full left-0 mb-1 w-64 rounded-md border border-border/60 bg-popover shadow-md z-10">
                  <Command>
                     <CommandList>
                        <CommandGroup>
                           {mentionMatches.map((member) => (
                              <CommandItem
                                 key={member.id}
                                 value={member.id}
                                 onSelect={() => selectMention(member)}
                                 className="cursor-pointer"
                              >
                                 {member.name}
                              </CommandItem>
                           ))}
                        </CommandGroup>
                     </CommandList>
                  </Command>
               </div>
            )}
            <textarea
               ref={textareaRef}
               value={draft}
               onChange={(event) =>
                  handleDraftChange(event.target.value, event.target.selectionStart)
               }
               onKeyDown={(event) => {
                  if (mentionQuery !== null && mentionMatches.length > 0) {
                     if (event.key === 'Enter' || event.key === 'Tab') {
                        event.preventDefault();
                        selectMention(mentionMatches[0]);
                        return;
                     }
                     if (event.key === 'Escape') {
                        event.preventDefault();
                        setMentionQuery(null);
                        setMentionStart(-1);
                        return;
                     }
                  }
                  if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
                     submitComment();
                  }
               }}
               placeholder="Leave a comment..."
               rows={2}
               className="w-full resize-none bg-transparent outline-none text-sm placeholder:text-muted-foreground"
            />
            <div className="flex items-center justify-between">
               <Plus className="size-4 text-muted-foreground" />
               <Button size="xs" onClick={submitComment} disabled={!draft.trim()}>
                  Comment
               </Button>
            </div>
         </div>
      </div>
   );
}
