import SettingsPlaceholder from './settings-placeholder';

/**
 * Personal notification preferences are intentionally unavailable until their
 * persisted backend contract exists. Inbox actions remain available separately.
 */
export default function AccountNotifications() {
   return (
      <SettingsPlaceholder
         config={{
            title: 'Notifications',
            description: 'Notification preferences are not connected in this deployment.',
            emptyLabel: 'Notification preferences unavailable',
         }}
      />
   );
}
