import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { CheckSquare, AlertCircle } from 'lucide-react';

export const TestSessionList: React.FC = () => {
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { token, user } = useAuth();

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const res = await fetch('/api/test-sessions', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        
        if (res.ok) {
          setSessions(data);
        } else {
          setError(data.error || 'Failed to fetch sessions');
        }
      } catch (err) {
        setError('Network error');
      } finally {
        setLoading(false);
      }
    };

    fetchSessions();
  }, [token]);

  if (loading) return <div className="p-8 text-center text-textSecondary animate-pulse">Loading sessions...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-xl font-serif text-textPrimary">Test Sessions</h3>
          <p className="text-sm text-textSecondary">Manage and review verification test sessions.</p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-fail/10 text-fail rounded-md flex items-center space-x-2">
          <AlertCircle className="h-5 w-5" />
          <span>{error}</span>
        </div>
      )}

      {sessions.length === 0 && !error ? (
        <div className="card p-12 text-center flex flex-col items-center">
          <CheckSquare className="h-12 w-12 text-gray-300 mb-4" />
          <h4 className="text-lg font-medium text-textPrimary mb-2">No sessions found</h4>
          <p className="text-textSecondary text-sm max-w-md">
            Go to the Instruments registry to start a new test session.
          </p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-gray-50 border-b border-border">
              <tr>
                <th className="px-6 py-4 font-medium text-textSecondary">Instrument</th>
                <th className="px-6 py-4 font-medium text-textSecondary">Status</th>
                <th className="px-6 py-4 font-medium text-textSecondary">Officer</th>
                <th className="px-6 py-4 font-medium text-textSecondary">Date</th>
                <th className="px-6 py-4 font-medium text-textSecondary text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {sessions.map((s) => (
                <tr key={s.id} className="hover:bg-gray-50/50">
                  <td className="px-6 py-4">
                    <div className="font-medium text-textPrimary">{s.instrument?.modelName}</div>
                    <div className="text-textSecondary text-xs mt-0.5">{s.instrument?.serialNumber}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium 
                      ${s.status === 'SUBMITTED' ? 'bg-primary/10 text-primary' : 
                        s.status === 'DRAFT' ? 'bg-gray-100 text-gray-600' :
                        s.status === 'REJECTED' ? 'bg-fail/10 text-fail' :
                        'bg-success/10 text-success'}`}>
                      {s.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-textPrimary">{s.labOfficer?.name}</td>
                  <td className="px-6 py-4 text-textSecondary">
                    {new Date(s.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right space-x-3">
                    {s.status === 'SUBMITTED' && user?.role === 'ADMIN' && (
                      <Link 
                        to={`/test-sessions/${s.id}/review`} 
                        className="text-primary hover:text-teal-700 font-medium inline-flex items-center"
                      >
                        <CheckSquare className="h-4 w-4 mr-1" />
                        Review
                      </Link>
                    )}
                    <Link to={`/test-sessions/${s.id}`} className="text-textSecondary hover:text-textPrimary">Details</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
