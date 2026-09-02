'use client';

import * as React from 'react';
import { useCreateIssueStore } from '@/store/create-issue-store';

export function CreateIssueModalProvider() {
   const { isOpen, openModal } = useCreateIssueStore();

   React.useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
         // Ignore if user is typing in an input, textarea, select, or contenteditable element
         const target = e.target as HTMLElement | null;
         if (
            target &&
            (target.tagName === 'INPUT' ||
               target.tagName === 'TEXTAREA' ||
               target.tagName === 'SELECT' ||
               target.isContentEditable)
         ) {
            return;
         }

         // Listen for plain key 'c' or 'C'
         if ((e.key === 'c' || e.key === 'C') && !e.metaKey && !e.ctrlKey && !e.altKey && !isOpen) {
            e.preventDefault();
            openModal();
         }
      };

      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
   }, [isOpen, openModal]);

   return null;
}
