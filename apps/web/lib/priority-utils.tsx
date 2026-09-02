import React from 'react';
import { priorities, Priority } from '@/mock-data/priorities';

export function renderPriorityIcon(
   priorityId?: string,
   className?: string
): React.ReactElement | null {
   const selectedItem = priorities.find((item) => item.id === priorityId) || priorities[0];
   if (selectedItem) {
      const Icon = selectedItem.icon;
      return <Icon className={className || 'size-4'} />;
   }
   return null;
}

export function getPriorityById(priorityId?: string): Priority {
   return priorities.find((item) => item.id === priorityId) || priorities[0];
}
