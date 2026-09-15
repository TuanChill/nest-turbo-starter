'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Switch } from '@/components/ui/switch';
import {
   getNotificationPreferences,
   updateNotificationPreferences,
   type NotificationPreferences,
   type NotificationPreferencesPatch,
} from '@/lib/api/inbox';
import { SelectMenu, SettingsCard, SettingsRow, SettingsSection, SettingsShell } from './shared';

type PreferenceKey = keyof NotificationPreferences['channels'];
type CategoryKey = keyof NotificationPreferences['categories'];

const channelRows: Array<{ key: PreferenceKey; title: string; description: string }> = [
   {
      key: 'desktop',
      title: 'Desktop',
      description: 'Real-time notifications in this browser or desktop app',
   },
   {
      key: 'mobile',
      title: 'Mobile',
      description: 'Real-time notifications on supported mobile devices',
   },
   { key: 'email', title: 'Email', description: 'Email notifications or scheduled digests' },
   {
      key: 'slack',
      title: 'Slack',
      description: 'Notifications delivered through a connected Slack workspace',
   },
];

const categoryRows: Array<{ key: CategoryKey; title: string; description: string }> = [
   {
      key: 'comments',
      title: 'Comments',
      description: 'Comments and activity on issues you follow',
   },
   { key: 'mentions', title: 'Mentions', description: 'When another member mentions you' },
   {
      key: 'assignments',
      title: 'Assignments',
      description: 'When issues are assigned to you',
   },
   {
      key: 'statusChanges',
      title: 'Status changes',
      description: 'Important issue status and blocking changes',
   },
   {
      key: 'projectUpdates',
      title: 'Project updates',
      description: 'Updates posted to projects you follow',
   },
];

export default function AccountNotifications() {
   const [preferences, setPreferences] = useState<NotificationPreferences>();
   const [loading, setLoading] = useState(true);
   const [loadError, setLoadError] = useState<string>();
   const [saving, setSaving] = useState<string>();

   useEffect(() => {
      let active = true;
      getNotificationPreferences()
         .then((result) => {
            if (active) setPreferences(result);
         })
         .catch((error: unknown) => {
            if (active) {
               setLoadError(
                  error instanceof Error ? error.message : 'Could not load notification preferences'
               );
               toast.error(
                  error instanceof Error ? error.message : 'Could not load notification preferences'
               );
            }
         })
         .finally(() => {
            if (active) setLoading(false);
         });
      return () => {
         active = false;
      };
   }, []);

   const update = async (key: string, patch: NotificationPreferencesPatch) => {
      if (!preferences) return;
      const previous = preferences;
      setSaving(key);
      setPreferences({
         ...preferences,
         channels: {
            ...preferences.channels,
            ...(patch.desktop === undefined ? {} : { desktop: patch.desktop }),
            ...(patch.mobile === undefined ? {} : { mobile: patch.mobile }),
            ...(patch.email === undefined ? {} : { email: patch.email }),
            ...(patch.slack === undefined ? {} : { slack: patch.slack }),
         },
         categories: { ...preferences.categories, ...(patch.categories ?? {}) },
         emailFormat: patch.emailFormat ?? preferences.emailFormat,
      });
      try {
         setPreferences(await updateNotificationPreferences(patch));
      } catch (error: unknown) {
         setPreferences(previous);
         toast.error(
            error instanceof Error ? error.message : 'Could not update notification preferences'
         );
      } finally {
         setSaving(undefined);
      }
   };

   return (
      <SettingsShell
         title="Notifications"
         description="Choose where and when Circle sends notifications about your work"
      >
         {loading ? (
            <div className="text-sm text-muted-foreground">Loading notification preferences…</div>
         ) : !preferences ? (
            <div className="text-sm text-destructive">
               {loadError ?? 'Notification preferences are unavailable.'}
            </div>
         ) : (
            <>
               <SettingsSection
                  title="Channels"
                  description="In-app inbox notifications remain available for every subscribed issue."
               >
                  <SettingsCard>
                     {channelRows.map((row) => (
                        <SettingsRow
                           key={row.key}
                           title={row.title}
                           description={row.description}
                           trailing={
                              <Switch
                                 checked={preferences.channels[row.key]}
                                 disabled={saving === row.key}
                                 onCheckedChange={(checked) =>
                                    update(row.key, { [row.key]: checked })
                                 }
                              />
                           }
                        />
                     ))}
                     <SettingsRow
                        title="Email format"
                        description="Choose immediate delivery or grouped email digests"
                        trailing={
                           <SelectMenu
                              options={[
                                 { label: 'Digest', value: 'digest' },
                                 { label: 'Immediate', value: 'immediate' },
                              ]}
                              value={preferences.emailFormat}
                              onChange={(value) =>
                                 update('emailFormat', {
                                    emailFormat: value as 'digest' | 'immediate',
                                 })
                              }
                           />
                        }
                     />
                  </SettingsCard>
               </SettingsSection>
               <SettingsSection
                  title="Notification types"
                  description="Control the categories used by configured delivery channels."
               >
                  <SettingsCard>
                     {categoryRows.map((row) => (
                        <SettingsRow
                           key={row.key}
                           title={row.title}
                           description={row.description}
                           trailing={
                              <Switch
                                 checked={preferences.categories[row.key]}
                                 disabled={saving === row.key}
                                 onCheckedChange={(checked) =>
                                    update(row.key, { categories: { [row.key]: checked } })
                                 }
                              />
                           }
                        />
                     ))}
                  </SettingsCard>
               </SettingsSection>
            </>
         )}
      </SettingsShell>
   );
}
