import React from 'react';
import { Settings as SettingsIcon } from 'lucide-react';

export const Settings: React.FC = () => {
  return (
    <div className="p-6">
      <div className="flex items-center space-x-3 mb-6">
        <SettingsIcon className="h-6 w-6 text-primary" />
        <h2 className="text-2xl font-serif text-textPrimary">Settings</h2>
      </div>
      <div className="card p-8 text-center text-textSecondary">
        <p>Settings — coming soon.</p>
        <p className="mt-2 text-sm">Will include user management and system configuration.</p>
      </div>
    </div>
  );
};
