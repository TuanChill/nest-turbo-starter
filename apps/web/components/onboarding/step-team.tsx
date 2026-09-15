'use client';

import * as React from 'react';
import { ArrowLeft, ArrowRight, Layers, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const TEAM_PRESETS = [
   { name: 'Engineering', key: 'ENG', icon: '⚡', color: '#5e6ad2' },
   { name: 'Design', key: 'DES', icon: '🎨', color: '#ec4899' },
   { name: 'Product', key: 'PROD', icon: '🚀', color: '#f59e0b' },
   { name: 'Growth', key: 'GRO', icon: '📈', color: '#10b981' },
   { name: 'Operations', key: 'OPS', icon: '🛠️', color: '#06b6d4' },
];

interface StepTeamProps {
   teamName: string;
   setTeamName: (val: string) => void;
   teamKey: string;
   setTeamKey: (val: string) => void;
   teamIcon: string;
   setTeamIcon: (val: string) => void;
   teamColor: string;
   setTeamColor: (val: string) => void;
   onNext: () => void;
   onBack: () => void;
}

export function StepTeam({
   teamName,
   setTeamName,
   teamKey,
   setTeamKey,
   teamIcon,
   setTeamIcon,
   teamColor,
   setTeamColor,
   onNext,
   onBack,
}: StepTeamProps) {
   const [isKeyCustomized, setIsKeyCustomized] = React.useState(false);

   const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      setTeamName(val);
      if (!isKeyCustomized) {
         const autoKey = val
            .toUpperCase()
            .replace(/[^A-Z0-9]/g, '')
            .slice(0, 4);
         setTeamKey(autoKey);
      }
   };

   const handleKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setIsKeyCustomized(true);
      const upper = e.target.value
         .toUpperCase()
         .replace(/[^A-Z0-9]/g, '')
         .slice(0, 6);
      setTeamKey(upper);
   };

   const handleSelectPreset = (preset: (typeof TEAM_PRESETS)[0]) => {
      setTeamName(preset.name);
      setTeamKey(preset.key);
      setTeamIcon(preset.icon);
      setTeamColor(preset.color);
      setIsKeyCustomized(true);
   };

   const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (teamName.trim() && teamKey.trim()) {
         onNext();
      }
   };

   const displayKey = teamKey.trim().toUpperCase();

   return (
      <form onSubmit={handleSubmit} className="space-y-6">
         <div className="space-y-1 text-center sm:text-left">
            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-500 text-[11px] font-medium tracking-wide">
               <Layers className="size-3" />
               Step 2 of 3
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-foreground">
               Create your first team
            </h2>
            <p className="text-xs text-muted-foreground">
               Teams organize your cycles, issue workflows, and roadmaps.
            </p>
         </div>

         {/* Quick Preset Pills */}
         <div className="space-y-1.5">
            <Label className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">
               Quick Suggestions
            </Label>
            <div className="flex flex-wrap gap-2 pt-0.5">
               {TEAM_PRESETS.map((preset) => (
                  <button
                     key={preset.name}
                     type="button"
                     onClick={() => handleSelectPreset(preset)}
                     className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-all flex items-center gap-1.5 ${
                        teamName === preset.name
                           ? 'border-primary bg-primary/10 text-foreground shadow-sm'
                           : 'border-border/70 bg-card hover:bg-muted/50 text-muted-foreground hover:text-foreground'
                     }`}
                  >
                     <span>{preset.icon}</span>
                     <span>{preset.name}</span>
                     <span className="text-[10px] opacity-60 font-mono">({preset.key})</span>
                  </button>
               ))}
            </div>
         </div>

         {/* Inputs */}
         <div className="space-y-4">
            <div className="space-y-1.5">
               <Label htmlFor="team-name" className="text-xs font-medium text-foreground">
                  Team Name <span className="text-destructive">*</span>
               </Label>
               <div className="flex items-center gap-2">
                  <div className="flex aspect-square size-10 items-center justify-center rounded-lg bg-muted border border-input text-base shrink-0 select-none">
                     {teamIcon}
                  </div>
                  <Input
                     id="team-name"
                     value={teamName}
                     onChange={handleNameChange}
                     placeholder="e.g. Engineering, Product, Mobile..."
                     className="h-10 text-sm bg-background/60 border-input flex-1"
                     autoFocus
                     required
                  />
               </div>
            </div>

            <div className="space-y-1.5">
               <div className="flex items-center justify-between">
                  <Label htmlFor="team-key" className="text-xs font-medium text-foreground">
                     Team Identifier Key <span className="text-destructive">*</span>
                  </Label>
                  <span className="text-[11px] text-muted-foreground">2–5 capital letters</span>
               </div>
               <Input
                  id="team-key"
                  value={teamKey}
                  onChange={handleKeyChange}
                  placeholder="ENG"
                  className="h-10 text-xs font-mono font-bold uppercase bg-background/60 border-input tracking-wider"
                  required
               />
            </div>
         </div>

         {/* Live Issue Preview Badge */}
         <div className="p-3.5 rounded-xl border border-border/80 bg-muted/20 space-y-2">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
               <Tag className="size-3.5 text-primary" />
               <span>Issue Identifier Preview:</span>
            </div>
            <div className="flex items-center gap-3 p-2.5 rounded-lg border border-border/60 bg-background/80 shadow-sm">
               <span
                  style={{ color: teamColor }}
                  className="px-1.5 py-0.5 rounded bg-muted text-[11px] font-mono font-bold tracking-wider"
               >
                  {displayKey}-1
               </span>
               <span className="text-xs font-medium text-foreground truncate">
                  Welcome to Circle! Explore your new workspace
               </span>
            </div>
         </div>

         {/* Bottom Action */}
         <div className="pt-2 flex justify-between">
            <Button
               type="button"
               variant="outline"
               size="sm"
               onClick={onBack}
               className="h-9 px-4 text-xs font-medium"
            >
               <ArrowLeft className="size-3.5 mr-1.5" />
               Back
            </Button>
            <Button
               type="submit"
               disabled={!teamName.trim() || !teamKey.trim()}
               className="h-9 px-5 text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-sm"
            >
               Continue
               <ArrowRight className="size-3.5 ml-1.5" />
            </Button>
         </div>
      </form>
   );
}
