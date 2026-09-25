import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Scale } from 'lucide-react';

export const Dashboard: React.FC = () => {
  const { user } = useAuth();

  return (
    <>
      {/* Welcome Banner */}
      <div className="bg-primary text-white rounded-lg p-8 mb-8 shadow-sm flex justify-between items-center relative overflow-hidden">
        <div className="relative z-10">
          <h3 className="text-2xl font-serif text-white mb-2">Welcome back, {user?.name}!</h3>
          <p className="text-white/90 max-w-lg">
            You are currently logged in as a <strong>{user?.role}</strong>. 
            {user?.labName ? ` Operating out of ${user.labName}.` : ''}
          </p>
        </div>
        <div className="absolute right-0 top-0 bottom-0 opacity-20 text-white pointer-events-none transform translate-x-8 translate-y-8">
          <Scale className="w-48 h-48" />
        </div>
      </div>

      {/* Stats / Info Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card p-6 flex flex-col">
          <h4 className="text-sm font-medium text-textSecondary uppercase tracking-wider mb-4">Account Status</h4>
          <div className="flex items-center space-x-3 mt-auto">
            <div className={`w-3 h-3 rounded-full ${user?.status === 'ACTIVE' ? 'bg-success' : 'bg-secondary'}`}></div>
            <span className="text-lg font-medium text-textPrimary">{user?.status || 'UNKNOWN'}</span>
          </div>
        </div>

        <div className="card p-6 flex flex-col">
          <h4 className="text-sm font-medium text-textSecondary uppercase tracking-wider mb-4">Role Privileges</h4>
          <p className="text-textPrimary mt-auto text-sm">
            {user?.role === 'OFFICER' && 'Can register instruments and perform test sessions.'}
            {user?.role === 'ADMIN' && 'Can review tests, approve results, and generate final reports.'}
            {user?.role === 'MANUFACTURER' && 'Can view reports and track instrument status.'}
          </p>
        </div>

        <div className="card p-6 flex flex-col">
          <h4 className="text-sm font-medium text-textSecondary uppercase tracking-wider mb-4">Profile Details</h4>
          <div className="space-y-2 mt-auto text-sm text-textPrimary">
            <div className="flex justify-between">
              <span className="text-textSecondary">Email:</span>
              <span className="truncate ml-2 font-medium">{user?.email}</span>
            </div>
            {(user?.employeeCode || user?.manufacturerLicenseNo) && (
              <div className="flex justify-between">
                <span className="text-textSecondary">ID/License:</span>
                <span className="truncate ml-2 font-medium">{user?.employeeCode || user?.manufacturerLicenseNo}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};
