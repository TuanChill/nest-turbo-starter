'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import {
   Dialog,
   DialogContent,
   DialogFooter,
   DialogHeader,
   DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
   Select,
   SelectContent,
   SelectItem,
   SelectTrigger,
   SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useCycleSettings, useUpdateCycleSettings } from '@/hooks/queries/use-cycles-query';

const DAYS = [
   ['0', 'Sunday'],
   ['1', 'Monday'],
   ['2', 'Tuesday'],
   ['3', 'Wednesday'],
   ['4', 'Thursday'],
   ['5', 'Friday'],
   ['6', 'Saturday'],
] as const;

export function CycleSettingsDialog({
   teamId,
   open,
   onOpenChange,
}: {
   teamId: string;
   open: boolean;
   onOpenChange: (open: boolean) => void;
}) {
   const { data: settings, isLoading, isError, error, refetch } = useCycleSettings(teamId, open);
   const updateMutation = useUpdateCycleSettings();
   const [enabled, setEnabled] = React.useState(false);
   const [durationWeeks, setDurationWeeks] = React.useState('2');
   const [startDayOfWeek, setStartDayOfWeek] = React.useState('1');
   const [timeZone, setTimeZone] = React.useState('UTC');
   const [cooldownDays, setCooldownDays] = React.useState('0');
   const [upcomingCycleCount, setUpcomingCycleCount] = React.useState('3');
   const [autoAddActiveIssues, setAutoAddActiveIssues] = React.useState(false);

   React.useEffect(() => {
      if (!settings) return;
      setEnabled(settings.enabled);
      setDurationWeeks(String(settings.durationWeeks));
      setStartDayOfWeek(String(settings.startDayOfWeek));
      setTimeZone(settings.timeZone);
      setCooldownDays(String(settings.cooldownDays));
      setUpcomingCycleCount(String(settings.upcomingCycleCount));
      setAutoAddActiveIssues(settings.autoAddActiveIssues);
   }, [settings]);

   const handleSave = async (event: React.FormEvent) => {
      event.preventDefault();
      try {
         await updateMutation.mutateAsync({
            teamId,
            payload: {
               enabled,
               durationWeeks: Number(durationWeeks),
               startDayOfWeek: Number(startDayOfWeek),
               timeZone,
               cooldownDays: Number(cooldownDays),
               upcomingCycleCount: Number(upcomingCycleCount),
               autoAddActiveIssues,
            },
         });
         onOpenChange(false);
      } catch (err) {
         toast.error(err instanceof Error ? err.message : 'Could not update cycle settings');
      }
   };

   return (
      <Dialog open={open} onOpenChange={onOpenChange}>
         <DialogContent className="sm:max-w-[520px]">
            <form onSubmit={handleSave}>
               <DialogHeader>
                  <DialogTitle>Cycle settings</DialogTitle>
               </DialogHeader>
               {isLoading ? (
                  <div className="py-8 text-sm text-muted-foreground">Loading cycle settings…</div>
               ) : isError ? (
                  <div className="py-6 space-y-3 text-sm">
                     <p className="text-destructive">
                        {error?.message || 'Could not load cycle settings.'}
                     </p>
                     <Button type="button" variant="outline" size="sm" onClick={() => refetch()}>
                        Retry
                     </Button>
                  </div>
               ) : (
                  <div className="space-y-5 py-5">
                     <div className="flex items-center justify-between rounded-md border p-3">
                        <div>
                           <Label htmlFor="cycles-enabled">Enable cycles</Label>
                           <p className="text-xs text-muted-foreground">
                              Automatically keep upcoming cycles scheduled.
                           </p>
                        </div>
                        <Switch
                           id="cycles-enabled"
                           checked={enabled}
                           onCheckedChange={setEnabled}
                        />
                     </div>
                     <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                           <Label htmlFor="cycle-duration">Cycle duration (weeks)</Label>
                           <Input
                              id="cycle-duration"
                              type="number"
                              min={1}
                              max={8}
                              value={durationWeeks}
                              onChange={(event) => setDurationWeeks(event.target.value)}
                           />
                        </div>
                        <div className="space-y-1.5">
                           <Label>Starting day</Label>
                           <Select value={startDayOfWeek} onValueChange={setStartDayOfWeek}>
                              <SelectTrigger>
                                 <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                 {DAYS.map(([value, label]) => (
                                    <SelectItem key={value} value={value}>
                                       {label}
                                    </SelectItem>
                                 ))}
                              </SelectContent>
                           </Select>
                        </div>
                        <div className="space-y-1.5 col-span-2">
                           <Label htmlFor="cycle-time-zone">Cycle timezone</Label>
                           <Input
                              id="cycle-time-zone"
                              value={timeZone}
                              onChange={(event) => setTimeZone(event.target.value)}
                              placeholder="UTC or Asia/Ho_Chi_Minh"
                              aria-describedby="cycle-time-zone-help"
                           />
                           <p id="cycle-time-zone-help" className="text-xs text-muted-foreground">
                              Calendar boundaries and automation use this IANA timezone.
                           </p>
                        </div>
                        <div className="space-y-1.5">
                           <Label htmlFor="cycle-cooldown">Cooldown (days)</Label>
                           <Input
                              id="cycle-cooldown"
                              type="number"
                              min={0}
                              max={30}
                              value={cooldownDays}
                              onChange={(event) => setCooldownDays(event.target.value)}
                           />
                        </div>
                        <div className="space-y-1.5">
                           <Label htmlFor="upcoming-cycles">Upcoming cycles</Label>
                           <Input
                              id="upcoming-cycles"
                              type="number"
                              min={0}
                              max={15}
                              value={upcomingCycleCount}
                              onChange={(event) => setUpcomingCycleCount(event.target.value)}
                           />
                        </div>
                     </div>
                     <div className="flex items-center justify-between rounded-md border p-3">
                        <div>
                           <Label htmlFor="auto-add-active">Auto-add active issues</Label>
                           <p className="text-xs text-muted-foreground">
                              Add started or completed issues without a cycle to the appropriate
                              cycle.
                           </p>
                        </div>
                        <Switch
                           id="auto-add-active"
                           checked={autoAddActiveIssues}
                           onCheckedChange={setAutoAddActiveIssues}
                        />
                     </div>
                  </div>
               )}
               <DialogFooter>
                  <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
                     Cancel
                  </Button>
                  <Button type="submit" disabled={isLoading || isError || updateMutation.isPending}>
                     {updateMutation.isPending ? (
                        <Loader2 className="size-4 animate-spin" />
                     ) : (
                        'Save settings'
                     )}
                  </Button>
               </DialogFooter>
            </form>
         </DialogContent>
      </Dialog>
   );
}
