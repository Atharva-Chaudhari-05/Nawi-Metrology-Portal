import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Scale, CheckSquare, Clock, TrendingUp } from 'lucide-react';

export const Dashboard: React.FC = () => {
  const { user, token } = useAuth();
  const [stats, setStats] = useState({
    totalSessions: 0,
    pendingReviews: 0,
    passRate: 0,
    instrumentsCount: 0
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [sessRes, instRes] = await Promise.all([
          fetch('/api/test-sessions', { headers: { 'Authorization': `Bearer ${token}` } }),
          fetch('/api/instruments', { headers: { 'Authorization': `Bearer ${token}` } })
        ]);

        if (sessRes.ok && instRes.ok) {
          const sessions = await sessRes.json();
          const instruments = await instRes.json();

          const totalSessions = sessions.length;
          const pendingReviews = sessions.filter((s: any) => s.status === 'SUBMITTED').length;
          
          const completedSessions = sessions.filter((s: any) => s.status === 'APPROVED' || s.status === 'REJECTED');
          const approvedSessions = sessions.filter((s: any) => s.status === 'APPROVED').length;
          const passRate = completedSessions.length > 0 ? Math.round((approvedSessions / completedSessions.length) * 100) : 0;

          setStats({
            totalSessions,
            pendingReviews,
            passRate,
            instrumentsCount: instruments.length
          });
        }
      } catch (err) {
        console.error('Failed to fetch stats', err);
      }
    };
    if (token) fetchStats();
  }, [token]);

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

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="card p-6 flex flex-col items-center text-center">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-3">
            <Scale className="h-6 w-6" />
          </div>
          <h4 className="text-sm font-medium text-textSecondary uppercase tracking-wider mb-1">Instruments</h4>
          <p className="text-3xl font-bold text-textPrimary">{stats.instrumentsCount}</p>
        </div>

        <div className="card p-6 flex flex-col items-center text-center">
          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mb-3">
            <CheckSquare className="h-6 w-6" />
          </div>
          <h4 className="text-sm font-medium text-textSecondary uppercase tracking-wider mb-1">Total Sessions</h4>
          <p className="text-3xl font-bold text-textPrimary">{stats.totalSessions}</p>
        </div>

        <div className="card p-6 flex flex-col items-center text-center">
          <div className="w-12 h-12 bg-orange-50 text-orange-600 rounded-full flex items-center justify-center mb-3">
            <Clock className="h-6 w-6" />
          </div>
          <h4 className="text-sm font-medium text-textSecondary uppercase tracking-wider mb-1">Pending Reviews</h4>
          <p className="text-3xl font-bold text-textPrimary">{stats.pendingReviews}</p>
        </div>

        <div className="card p-6 flex flex-col items-center text-center">
          <div className="w-12 h-12 bg-green-50 text-green-600 rounded-full flex items-center justify-center mb-3">
            <TrendingUp className="h-6 w-6" />
          </div>
          <h4 className="text-sm font-medium text-textSecondary uppercase tracking-wider mb-1">Pass Rate</h4>
          <p className="text-3xl font-bold text-textPrimary">{stats.passRate}%</p>
        </div>
      </div>

      {/* Info Grid */}
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
