import React from 'react';
import { FileText } from 'lucide-react';

export const Reports: React.FC = () => {
  return (
    <div className="p-6">
      <div className="flex items-center space-x-3 mb-6">
        <FileText className="h-6 w-6 text-primary" />
        <h2 className="text-2xl font-serif text-textPrimary">Reports & Analytics</h2>
      </div>
      <div className="card p-8 text-center text-textSecondary">
        <p>This module is pending implementation in Phase 2.</p>
        <p className="mt-2 text-sm">Will include Word exports and advanced filtering.</p>
      </div>
    </div>
  );
};
