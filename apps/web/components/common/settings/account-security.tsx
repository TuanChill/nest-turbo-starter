'use client';

import SettingsPlaceholder from './settings-placeholder';

/**
 * Security controls require persisted session, passkey, and API-key contracts.
 * Keep this page explicit until those records can be read and mutated safely.
 */
export default function AccountSecurity() {
   return (
      <SettingsPlaceholder
         config={{
            title: 'Security & access',
            description:
               'Session, passkey, and personal API-key management is not configured in this deployment.',
            emptyLabel: 'Security controls unavailable',
         }}
      />
   );
}
