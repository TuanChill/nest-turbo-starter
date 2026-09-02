'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Command, CommandGroup, CommandItem, CommandList } from '@/components/ui/command';
import { ActivityItem } from '@/mock-data/issue-details';
import type { Member } from '@/services/members.service';
import { useAuthStore } from '@/store/auth-store';
import { addIssueComment, addIssueReaction } from '@/lib/api/issues';
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
            <span className="text-foreground/90 font-medium">{item.actor?.name || 'Member'}</span>{' '}
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
               <AvatarFallback>{item.actor?.name?.[0] || 'U'}</AvatarFallback>
            </Avatar>
            <span className="text-sm font-medium">{item.actor?.name || 'Member'}</span>
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
}: {
   activity: ActivityItem[];
   issueIdentifier?: string;
   members?: Member[];
}) {
   const [items, setItems] = useState<ActivityItem[]>(activity);
   const [draft, setDraft] = useState('');
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
      if (activity) {
         setItems(activity);
      }
   }, [activity]);

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

      const actor = {
         id: user.id,
         name: user.name || user.email.split('@')[0],
         email: user.email,
         avatarUrl: user.avatarUrl || `https://api.dicebear.com/9.x/glass/svg?seed=${user.email}`,
         role: 'Member' as const,
         status: 'online' as const,
         joinedDate: new Date().toISOString().slice(0, 10),
         timezone: 'UTC',
         teamIds: ['CORE'],
      };

      const newComment: ActivityItem = {
         kind: 'comment',
         id: `local-${Date.now()}`,
         actor,
         timeAgo: 'just now',
         body: [{ type: 'paragraph', text }],
         reactions: [],
      };

      setItems((previous) => [...previous, newComment]);
      setDraft('');
      setMentionQuery(null);
      setMentionStart(-1);

      if (issueIdentifier) {
         try {
            const updated = await addIssueComment(issueIdentifier, {
               textContent: text,
               commentBlocks: [{ type: 'paragraph', text }],
            });
            if (updated?.activity) {
               setItems(updated.activity);
            }
         } catch (err) {
            console.error(`Failed to post comment on ${issueIdentifier}:`, err);
         }
      }
   };

   const handleReact = async (activityId: string, emoji: string) => {
      // Optimistic update
      setItems((prev) =>
         prev.map((item) => {
            if (item.id !== activityId || item.kind !== 'comment') return item;
            const reactions = item.reactions ? [...item.reactions] : [];
            const existing = reactions.find((r) => r.emoji === emoji);
            if (existing) {
               existing.count += 1;
            } else {
               reactions.push({ emoji, count: 1 });
            }
            return { ...item, reactions };
         })
      );

      try {
         await addIssueReaction(activityId, emoji, user?.id || 'ln');
      } catch (err) {
         console.error('Failed to post reaction:', err);
      }
   };

   return (
      <div className="mt-10">
         <div className="flex items-center justify-between mb-2">
            <h2 className="text-base font-semibold">Activity</h2>
            <button className="text-xs text-muted-foreground hover:text-foreground">
               Subscribe
            </button>
         </div>

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
