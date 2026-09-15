import SettingsPlaceholder from './settings-placeholder';

/**
 * Connected accounts stay explicit until each provider has a persisted OAuth,
 * permission, and disconnect contract.
 */
export default function AccountConnections() {
   return (
      <SettingsPlaceholder
         config={{
            title: 'Connected accounts',
            description: 'Provider connections are not configured in this deployment.',
            emptyLabel: 'Connected accounts unavailable',
         }}
      />
   );
}
