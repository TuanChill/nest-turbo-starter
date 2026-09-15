'use client';

import * as React from 'react';
import { SLASH_COMMAND_ITEMS, SlashCommandState } from './slash-command';
import { cn } from '@/lib/utils';

interface SlashCommandMenuProps {
   state: SlashCommandState;
   onClose: () => void;
   onKeyDownRef: React.MutableRefObject<((event: KeyboardEvent) => boolean) | null>;
}

export function SlashCommandMenu({ state, onClose, onKeyDownRef }: SlashCommandMenuProps) {
   const [selectedIndex, setSelectedIndex] = React.useState(0);
   const menuRef = React.useRef<HTMLDivElement>(null);
   const [coords, setCoords] = React.useState<{ top: number; left: number } | null>(null);

   const { isOpen, clientRect, query, command } = state;

   const filteredItems = React.useMemo(() => {
      const q = query.toLowerCase().trim();
      if (!q) return SLASH_COMMAND_ITEMS;
      return SLASH_COMMAND_ITEMS.filter((item) => {
         if (item.title.toLowerCase().includes(q)) return true;
         if (item.description.toLowerCase().includes(q)) return true;
         if (item.searchTerms?.some((term) => term.toLowerCase().includes(q))) return true;
         return false;
      });
   }, [query]);

   // Reset selected index when query changes
   React.useEffect(() => {
      setSelectedIndex(0);
   }, [filteredItems]);

   // Compute position relative to viewport
   React.useEffect(() => {
      if (!isOpen || !clientRect) {
         setCoords(null);
         return;
      }
      const rect = clientRect();
      if (!rect) {
         setCoords(null);
         return;
      }

      const menuHeight = 280;
      const menuWidth = 260;
      const spaceBelow = window.innerHeight - rect.bottom;

      let top = rect.bottom + 6;
      const left = Math.max(12, Math.min(rect.left, window.innerWidth - menuWidth - 16));

      // Flip above if not enough space below
      if (spaceBelow < menuHeight && rect.top > menuHeight) {
         top = rect.top - menuHeight - 6;
      }

      setCoords({ top, left });
   }, [isOpen, clientRect]);

   const selectItem = React.useCallback(
      (index: number) => {
         const item = filteredItems[index];
         if (item && command) {
            command(item);
            onClose();
         }
      },
      [filteredItems, command, onClose]
   );

   // Handle key navigation from ProseMirror
   React.useEffect(() => {
      if (!state.isOpen) {
         onKeyDownRef.current = null;
         return;
      }

      onKeyDownRef.current = (event: KeyboardEvent) => {
         if (event.key === 'ArrowUp') {
            event.preventDefault();
            setSelectedIndex((prev) => (prev <= 0 ? filteredItems.length - 1 : prev - 1));
            return true;
         }
         if (event.key === 'ArrowDown') {
            event.preventDefault();
            setSelectedIndex((prev) => (prev >= filteredItems.length - 1 ? 0 : prev + 1));
            return true;
         }
         if (event.key === 'Enter') {
            event.preventDefault();
            if (filteredItems.length > 0) {
               selectItem(selectedIndex);
            }
            return true;
         }
         if (event.key === 'Escape') {
            event.preventDefault();
            onClose();
            return true;
         }
         return false;
      };

      return () => {
         onKeyDownRef.current = null;
      };
   }, [state.isOpen, filteredItems, selectedIndex, selectItem, onClose, onKeyDownRef]);

   // Scroll selected item into view
   React.useEffect(() => {
      if (!menuRef.current) return;
      const selectedEl = menuRef.current.querySelector<HTMLElement>(
         `[data-index="${selectedIndex}"]`
      );
      if (selectedEl) {
         selectedEl.scrollIntoView({ block: 'nearest' });
      }
   }, [selectedIndex]);

   if (!state.isOpen || !coords || filteredItems.length === 0) {
      return null;
   }

   return (
      <div
         ref={menuRef}
         style={{ top: `${coords.top}px`, left: `${coords.left}px` }}
         className="fixed z-50 w-64 max-h-72 overflow-y-auto rounded-lg border border-border/70 bg-popover/95 p-1 text-popover-foreground shadow-2xl backdrop-blur-md animate-in fade-in-50 zoom-in-95 duration-150"
         onMouseDown={(event) => {
            // Keep the editor focused while selecting a block from the menu.
            if ((event.target as HTMLElement).closest('button')) {
               event.preventDefault();
            }
         }}
      >
         <div className="px-2 py-1 text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
            Basic Blocks
         </div>
         <div className="space-y-0.5">
            {filteredItems.map((item, index) => {
               const Icon = item.icon;
               const isSelected = index === selectedIndex;
               return (
                  <button
                     key={item.title}
                     type="button"
                     data-index={index}
                     onClick={() => selectItem(index)}
                     onMouseEnter={() => setSelectedIndex(index)}
                     className={cn(
                        'w-full flex items-center gap-2.5 rounded-md px-2 py-1.5 text-left text-xs transition-colors',
                        isSelected
                           ? 'bg-accent text-accent-foreground'
                           : 'text-foreground/80 hover:bg-accent/50'
                     )}
                  >
                     <div className="flex size-6 shrink-0 items-center justify-center rounded border border-border/60 bg-muted/40">
                        <Icon className="size-3.5" />
                     </div>
                     <div className="min-w-0 flex-1">
                        <div className="font-medium truncate">{item.title}</div>
                        <div className="text-[11px] text-muted-foreground truncate">
                           {item.description}
                        </div>
                     </div>
                  </button>
               );
            })}
         </div>
      </div>
   );
}
