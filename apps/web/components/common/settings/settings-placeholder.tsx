'use client';

import { PlaceholderConfig } from './placeholder-sections';

/**
 * Explicit unsupported state for settings without a backend contract. It must
 * not expose fake records or inert create/filter controls.
 */
export default function SettingsPlaceholder({ config }: { config: PlaceholderConfig }) {
   return (
      <div className="w-full overflow-y-auto h-full">
         <div className="max-w-4xl mx-auto px-6 py-10">
            <h1 className="text-2xl font-medium">{config.title}</h1>
            {config.description && (
               <p className="text-sm text-muted-foreground mt-1">{config.description}</p>
            )}

            <div className="mt-8 max-w-xl rounded-lg border border-dashed border-border/70 p-6">
               <p className="text-sm font-medium">Not available in this deployment</p>
               <p className="mt-2 text-sm text-muted-foreground">
                  {config.title} has no connected backend contract yet. This page does not display
                  synthetic records or offer actions that cannot be persisted.
               </p>
            </div>
         </div>
      </div>
   );
}
