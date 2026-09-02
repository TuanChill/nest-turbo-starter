'use client';

import * as React from 'react';
import { OnboardingWizard } from '@/components/onboarding/onboarding-wizard';

export default function OnboardingPage() {
   return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12 relative overflow-hidden">
         {/* Atmospheric Ambient Glow */}
         <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[600px] h-[380px] bg-gradient-to-b from-orange-500/10 via-amber-500/5 to-transparent blur-3xl pointer-events-none rounded-full" />
         <div className="absolute -bottom-40 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-gradient-to-t from-indigo-500/10 via-purple-500/5 to-transparent blur-3xl pointer-events-none rounded-full" />

         <React.Suspense
            fallback={<div className="text-sm text-muted-foreground">Loading onboarding...</div>}
         >
            <OnboardingWizard />
         </React.Suspense>
      </div>
   );
}
