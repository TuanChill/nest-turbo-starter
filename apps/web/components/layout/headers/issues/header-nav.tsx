'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SidebarTrigger } from '@/components/ui/sidebar';
import {
   DropdownMenu,
   DropdownMenuContent,
   DropdownMenuItem,
   DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { useSearchStore } from '@/store/search-store';
import { useViews, useDeleteView, CustomView } from '@/hooks/queries/use-views-query';
import { Layers, MoreHorizontal, Plus, SearchIcon, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useParams, usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import Notifications from './notifications';
import { AddViewDialog } from './add-view-dialog';
import QueryErrorState from '@/components/common/query-error-state';

const ISSUE_VIEW_TABS = [
   { label: 'Active', segment: 'active' },
   { label: 'Backlog', segment: 'backlog' },
   { label: 'All issues', segment: 'all' },
];

function IssueViewTabs() {
   const { orgId, teamId } = useParams<{ orgId: string; teamId: string }>();
   const pathname = usePathname();
   const searchParams = useSearchParams();
   const router = useRouter();
   const activeViewId = searchParams.get('view');
   const [isAddViewOpen, setIsAddViewOpen] = useState(false);

   const { data: views = [], error, refetch } = useViews({ teamId });
   const deleteViewMutation = useDeleteView();

   if (error) {
      return (
         <QueryErrorState subject="issue views" error={error} onRetry={() => refetch()} compact />
      );
   }

   const allIssuesHref = `/${orgId}/team/${teamId}/all`;

   // Only navigate here: the destination page (AllIssues) re-applies the
   // view's filters/layout/display settings itself once it reads `?view=`
   // off the URL. Calling the nuqs-backed filter setters from this handler
   // races router.push — nuqs flushes its own (stale) URL snapshot shortly
   // after, wiping the `view` param this push just set, regardless of call
   // order.
   const handleSelectCustomView = (view: CustomView) => {
      router.push(`${allIssuesHref}?view=${view.id}`);
   };

   const handleDeleteCustomView = async (e: React.MouseEvent, viewId: string) => {
      e.stopPropagation();
      try {
         await deleteViewMutation.mutateAsync(viewId);
         if (activeViewId === viewId) {
            router.push(allIssuesHref);
         }
      } catch (err) {
         console.error('Failed to delete view:', err);
      }
   };

   return (
      <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
         {ISSUE_VIEW_TABS.map((tab) => {
            const href = `/${orgId}/team/${teamId}/${tab.segment}`;
            const isActive =
               tab.segment === 'all' ? pathname === href && !activeViewId : pathname === href;
            return (
               <Link
                  key={tab.segment}
                  href={href}
                  className={cn(
                     'px-2.5 h-7 inline-flex items-center rounded-full border text-xs font-medium transition-colors shrink-0',
                     isActive
                        ? 'bg-accent text-foreground border-border'
                        : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-accent/50'
                  )}
               >
                  {tab.label}
               </Link>
            );
         })}

         {/* Saved custom views for this team */}
         {views.map((view) => {
            const isViewActive = pathname === allIssuesHref && activeViewId === view.id;

            return (
               <div
                  key={view.id}
                  onClick={() => handleSelectCustomView(view)}
                  className={cn(
                     'group relative px-2.5 h-7 inline-flex items-center gap-1.5 rounded-full border text-xs font-medium transition-colors shrink-0 cursor-pointer',
                     isViewActive
                        ? 'bg-accent text-foreground border-border font-semibold'
                        : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-accent/50'
                  )}
               >
                  <span className="text-xs leading-none">{view.icon || '🧊'}</span>
                  <span>{view.name}</span>

                  <DropdownMenu>
                     <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <button
                           className="opacity-0 group-hover:opacity-100 hover:text-foreground text-muted-foreground p-0.5 rounded transition-opacity"
                           title="View options"
                        >
                           <MoreHorizontal className="size-3" />
                        </button>
                     </DropdownMenuTrigger>
                     <DropdownMenuContent align="end" className="w-36 text-xs p-1">
                        <DropdownMenuItem
                           onClick={(e) => handleDeleteCustomView(e, view.id)}
                           className="text-red-500 hover:text-red-600 focus:text-red-600 flex items-center gap-2 cursor-pointer"
                        >
                           <Trash2 className="size-3.5" />
                           Delete view
                        </DropdownMenuItem>
                     </DropdownMenuContent>
                  </DropdownMenu>
               </div>
            );
         })}

         {/* Add View button matching Linear's "create view" affordance */}
         <button
            onClick={() => setIsAddViewOpen(true)}
            title="Add view"
            className="px-2 h-7 inline-flex items-center justify-center rounded-full border border-transparent text-muted-foreground hover:text-foreground hover:bg-accent/60 transition-colors cursor-pointer shrink-0"
         >
            <div className="relative flex items-center justify-center">
               <Layers className="size-3.5" />
               <Plus className="size-2.5 absolute -top-1 -right-1 stroke-[3]" />
            </div>
         </button>

         <AddViewDialog open={isAddViewOpen} onOpenChange={setIsAddViewOpen} teamId={teamId} />
      </div>
   );
}

export default function HeaderNav() {
   const { isSearchOpen, toggleSearch, closeSearch, setSearchQuery, searchQuery } =
      useSearchStore();
   const searchInputRef = useRef<HTMLInputElement>(null);
   const searchContainerRef = useRef<HTMLDivElement>(null);
   const previousValueRef = useRef<string>('');

   useEffect(() => {
      if (isSearchOpen && searchInputRef.current) {
         searchInputRef.current.focus();
      }
   }, [isSearchOpen]);

   useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
         if (
            searchContainerRef.current &&
            !searchContainerRef.current.contains(event.target as Node) &&
            isSearchOpen
         ) {
            if (searchQuery.trim() === '') {
               closeSearch();
            }
         }
      };

      document.addEventListener('mousedown', handleClickOutside);
      return () => {
         document.removeEventListener('mousedown', handleClickOutside);
      };
   }, [isSearchOpen, closeSearch, searchQuery]);

   return (
      <div className="w-full flex justify-between items-center border-b py-1.5 px-6 h-10">
         <div className="flex items-center gap-3 min-w-0">
            <SidebarTrigger className="" />
            <IssueViewTabs />
         </div>

         <div className="flex items-center gap-2">
            {isSearchOpen ? (
               <div
                  ref={searchContainerRef}
                  className="relative flex items-center justify-center w-64 transition-all duration-200 ease-in-out"
               >
                  <SearchIcon className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                     type="search"
                     ref={searchInputRef}
                     value={searchQuery}
                     onChange={(e) => {
                        previousValueRef.current = searchQuery;
                        const newValue = e.target.value;
                        setSearchQuery(newValue);

                        if (previousValueRef.current && newValue === '') {
                           const inputEvent = e.nativeEvent as InputEvent;
                           if (
                              inputEvent.inputType !== 'deleteContentBackward' &&
                              inputEvent.inputType !== 'deleteByCut'
                           ) {
                              closeSearch();
                           }
                        }
                     }}
                     placeholder="Search issues..."
                     className="pl-8 h-7 text-sm"
                     onKeyDown={(e) => {
                        if (e.key === 'Escape') {
                           if (searchQuery.trim() === '') {
                              closeSearch();
                           } else {
                              setSearchQuery('');
                           }
                        }
                     }}
                  />
               </div>
            ) : (
               <>
                  <Button
                     variant="ghost"
                     size="icon"
                     onClick={toggleSearch}
                     className="h-8 w-8"
                     aria-label="Search"
                  >
                     <SearchIcon className="h-4 w-4" />
                  </Button>
                  <Notifications />
               </>
            )}
         </div>
      </div>
   );
}
