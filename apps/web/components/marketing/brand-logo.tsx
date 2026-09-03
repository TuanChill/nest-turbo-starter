import { cn } from '@/lib/utils';

interface BrandLogoProps {
   className?: string;
   iconClassName?: string;
   showWordmark?: boolean;
}

export function BrandLogo({ className, iconClassName, showWordmark = true }: BrandLogoProps) {
   return (
      <div className={cn('flex items-center gap-2', className)}>
         <div
            className={cn(
               'flex aspect-square size-8 items-center justify-center rounded-lg bg-gradient-to-tr from-orange-600 to-amber-500 text-white shadow-md shadow-orange-500/20',
               iconClassName
            )}
         >
            <svg
               className="size-4.5"
               viewBox="0 0 24 24"
               fill="none"
               stroke="currentColor"
               strokeWidth="2.5"
            >
               <circle cx="12" cy="12" r="9" />
               <path d="M12 7v5l3 3" />
            </svg>
         </div>
         {showWordmark && <span className="font-semibold text-lg tracking-tight">Circle</span>}
      </div>
   );
}
