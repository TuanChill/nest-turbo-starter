import SettingsPlaceholder from './settings-placeholder';

/**
 * Integrations remain unavailable until each provider has a persisted
 * connection, permission, and callback contract. Do not render a static
 * catalog that implies an integration is enabled when no provider is wired.
 */
export default function Integrations() {
   return (
      <SettingsPlaceholder
         config={{
            title: 'Integrations',
            description: 'Provider connections are not configured in this deployment.',
            emptyLabel: 'Integrations unavailable',
         }}
      />
   );
}
