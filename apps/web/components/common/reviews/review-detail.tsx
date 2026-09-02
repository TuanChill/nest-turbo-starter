'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { getReviewById } from '@/mock-data/reviews';
import { Skeleton } from '@/components/ui/skeleton';
import { Eye, Link2, MoreHorizontal, Play, Star } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ReviewDiff } from './review-diff';
import { ReviewGuide } from './review-guide';
import { ReviewOverview } from './review-overview';
import { DiffStat, IssueCheckIcon, PrIcon } from './review-shared';

export type ReviewSection = 'overview' | 'guide' | 'diff';

const SECTION_TABS: { key: ReviewSection; label: string; path: string }[] = [
   { key: 'overview', label: 'Overview', path: '' },
   { key: 'guide', label: 'Guide', path: '/review' },
   { key: 'diff', label: 'Diff', path: '/changes' },
];

function ReviewSkeleton() {
   return (
      <div className="h-full flex flex-col p-6 space-y-4 animate-in fade-in-50 duration-200">
         <div className="flex items-center gap-3">
            <Skeleton className="size-5 rounded-full" />
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-4 w-16" />
         </div>
         <div className="flex gap-2 pt-2">
            <Skeleton className="h-7 w-20 rounded" />
            <Skeleton className="h-7 w-20 rounded" />
            <Skeleton className="h-7 w-20 rounded" />
         </div>
         <div className="space-y-3 pt-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-4/6" />
         </div>
      </div>
   );
}

import { useReview } from '@/hooks/queries/use-reviews-query';

/** Right pane of the Reviews split view: breadcrumb, tabs and section body. */
export function ReviewDetail({ reviewId, section }: { reviewId: string; section: ReviewSection }) {
   const { orgId } = useParams<{ orgId: string }>();
   const { data: fetchedReview, isLoading } = useReview(reviewId);

   const review = React.useMemo(() => {
      return fetchedReview || getReviewById(reviewId);
   }, [fetchedReview, reviewId]);

   if (isLoading) {
      return <ReviewSkeleton />;
   }

   if (!review) {
      return (
         <div className="h-full flex flex-col items-center justify-center gap-3 text-sm text-muted-foreground animate-in fade-in-50 duration-200">
            <p className="text-base font-medium text-foreground">Review not found</p>
            <p className="text-xs text-muted-foreground">
               This review does not exist or has been removed.
            </p>
            <Link
               href={`/${orgId ?? 'lndev-ui'}/reviews`}
               className="mt-2 text-xs px-3 py-1.5 rounded-md border border-border/80 bg-accent hover:bg-accent/80 transition-colors font-medium text-foreground"
            >
               Back to reviews
            </Link>
         </div>
      );
   }

   return (
      <div className="h-full flex flex-col overflow-hidden">
         <div className="flex items-center gap-2 px-4 h-10 border-b shrink-0 min-w-0">
            <Link
               href={`/${orgId}/issue/${review.resolves.identifier}`}
               className="flex items-center gap-1.5 shrink-0 hover:opacity-80"
            >
               <IssueCheckIcon />
               <span className="text-sm font-medium">{review.resolves.identifier}</span>
            </Link>
            <span className="text-muted-foreground text-xs shrink-0">›</span>
            <PrIcon status={review.status} />
            <span className="text-sm font-medium truncate">{review.title}</span>
            <DiffStat additions={review.additions} deletions={review.deletions} />
            <span className="flex-1" />
            <Star className="size-3.5 text-muted-foreground shrink-0" />
            <MoreHorizontal className="size-3.5 text-muted-foreground shrink-0" />
            <Link2 className="size-3.5 text-muted-foreground shrink-0 hidden sm:block" />
         </div>
         <div className="flex items-center justify-between px-4 h-10 border-b shrink-0">
            <div className="flex items-center gap-1.5">
               {SECTION_TABS.map((tab) => (
                  <Link
                     key={tab.key}
                     href={`/${orgId}/review/${review.id}${tab.path}`}
                     className={cn(
                        'px-2.5 py-1 rounded-md border text-xs font-medium transition-colors',
                        section === tab.key
                           ? 'bg-accent border-transparent'
                           : 'text-muted-foreground hover:bg-accent/50'
                     )}
                  >
                     {tab.label}
                  </Link>
               ))}
            </div>
            <div className="flex items-center gap-1">
               <Button size="xs" variant="ghost">
                  <Eye className="size-3.5" />
                  Preview
               </Button>
               <Play className="size-3.5 text-muted-foreground" />
            </div>
         </div>
         <div className="flex-1 min-h-0 overflow-hidden">
            {section === 'overview' && <ReviewOverview review={review} />}
            {section === 'guide' && <ReviewGuide review={review} />}
            {section === 'diff' && <ReviewDiff review={review} />}
         </div>
      </div>
   );
}
