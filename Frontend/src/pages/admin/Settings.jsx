import React from 'react';
import { Settings as SettingsIcon } from '@mui/icons-material';

export default function Settings() {
  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <SettingsIcon className="text-amber-600" sx={{ fontSize: 32 }} />
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <p className="text-gray-600">
          Admin access is protected by password only. Use your admin password to sign in.
        </p>
      </div>
    </div>
  );
}
