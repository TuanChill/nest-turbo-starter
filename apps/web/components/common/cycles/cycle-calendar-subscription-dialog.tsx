'use client';

import * as React from 'react';
import { CalendarDays, Check, Copy, ExternalLink, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
   Dialog,
   DialogContent,
   DialogDescription,
   DialogFooter,
   DialogHeader,
   DialogTitle,
   DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
   useCycleCalendarSubscription,
   useSubscribeCycleCalendar,
   useUnsubscribeCycleCalendar,
} from '@/hooks/queries/use-cycles-query';

export function CycleCalendarSubscriptionDialog({ teamId }: { teamId: string }) {
   const [open, setOpen] = React.useState(false);
   const [copied, setCopied] = React.useState(false);
   const subscription = useCycleCalendarSubscription(teamId, open);
   const subscribeMutation = useSubscribeCycleCalendar();
   const unsubscribeMutation = useUnsubscribeCycleCalendar();
   const busy = subscribeMutation.isPending || unsubscribeMutation.isPending;
   const feedUrl = subscription.data?.feedUrl;

   const copyFeedUrl = async () => {
      if (!feedUrl || !navigator.clipboard) {
         toast.error('Calendar link is unavailable');
         return;
      }
      await navigator.clipboard.writeText(feedUrl);
      setCopied(true);
      toast.success('Calendar link copied');
      window.setTimeout(() => setCopied(false), 2000);
   };

   return (
      <Dialog open={open} onOpenChange={setOpen}>
         <DialogTrigger asChild>
            <Button variant="ghost" size="sm" aria-label="Subscribe to cycle calendar">
               <CalendarDays className="size-4" />
               <span className="hidden sm:inline">Calendar</span>
            </Button>
         </DialogTrigger>
         <DialogContent className="sm:max-w-[560px]">
            <DialogHeader>
               <DialogTitle>Cycle calendar</DialogTitle>
               <DialogDescription>
                  Subscribe to this team&apos;s cycles in Google Calendar or any calendar app that
                  supports an iCalendar feed.
               </DialogDescription>
            </DialogHeader>

            {subscription.isLoading ? (
               <div className="py-8 text-sm text-muted-foreground">Loading subscription…</div>
            ) : subscription.isError ? (
               <div className="space-y-3 py-6 text-sm">
                  <p className="text-destructive">
                     {subscription.error.message || 'Could not load calendar subscription.'}
                  </p>
                  <Button type="button" variant="outline" onClick={() => subscription.refetch()}>
                     Retry
                  </Button>
               </div>
            ) : subscription.data?.subscribed && feedUrl ? (
               <div className="space-y-4 py-4">
                  <div className="space-y-2">
                     <p className="text-sm font-medium">Calendar feed URL</p>
                     <div className="flex gap-2">
                        <Input value={feedUrl} readOnly aria-label="Cycle calendar feed URL" />
                        <Button type="button" variant="outline" onClick={copyFeedUrl}>
                           {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
                           <span className="sr-only">Copy calendar link</span>
                        </Button>
                     </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                     Anyone with this private link can view the team&apos;s cycle dates. Generating
                     a new link invalidates the previous one.
                  </p>
                  <div className="flex flex-wrap gap-2">
                     <Button type="button" variant="outline" asChild>
                        <a href={feedUrl} target="_blank" rel="noreferrer">
                           <ExternalLink className="size-4" />
                           Open feed
                        </a>
                     </Button>
                     <Button
                        type="button"
                        variant="outline"
                        disabled={busy}
                        onClick={() => subscribeMutation.mutate(teamId)}
                     >
                        {subscribeMutation.isPending && <Loader2 className="size-4 animate-spin" />}
                        Generate new link
                     </Button>
                  </div>
               </div>
            ) : (
               <div className="py-6 text-sm text-muted-foreground">
                  Generate a private calendar link for this team&apos;s cycle schedule.
               </div>
            )}

            <DialogFooter>
               {subscription.data?.subscribed && (
                  <Button
                     type="button"
                     variant="destructive"
                     disabled={busy}
                     onClick={() => unsubscribeMutation.mutate(teamId)}
                  >
                     {unsubscribeMutation.isPending && <Loader2 className="size-4 animate-spin" />}
                     Stop subscription
                  </Button>
               )}
               {!subscription.data?.subscribed &&
                  !subscription.isLoading &&
                  !subscription.isError && (
                     <Button
                        type="button"
                        disabled={busy}
                        onClick={() => subscribeMutation.mutate(teamId)}
                     >
                        {subscribeMutation.isPending && <Loader2 className="size-4 animate-spin" />}
                        Generate calendar link
                     </Button>
                  )}
            </DialogFooter>
         </DialogContent>
      </Dialog>
   );
}
