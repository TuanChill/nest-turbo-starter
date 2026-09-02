import React from 'react';
import {
   Compass,
   Vault,
   Boxes,
   Layers,
   Shield,
   Folder,
   Layout,
   FileText,
   Code,
   Cpu,
   Zap,
   Globe,
   Database,
   Sparkles,
   LucideIcon,
} from 'lucide-react';

const LUCIDE_PROJECT_ICONS: Record<string, LucideIcon> = {
   Vault,
   Boxes,
   Layers,
   Shield,
   Folder,
   Layout,
   FileText,
   Code,
   Cpu,
   Zap,
   Globe,
   Database,
   Sparkles,
   Compass,
};

export function renderProjectIcon(icon: unknown, className: string = 'size-4'): React.ReactElement {
   if (typeof icon === 'function') {
      const IconComponent = icon as React.ComponentType<{ className?: string }>;
      return <IconComponent className={className} />;
   }
   if (typeof icon === 'string' && icon.trim() !== '') {
      const MatchedIcon = LUCIDE_PROJECT_ICONS[icon];
      if (MatchedIcon) {
         return <MatchedIcon className={className} />;
      }
      if (icon.length <= 4) {
         return <span className={className}>{icon}</span>;
      }
   }
   return <Compass className={className} />;
}
