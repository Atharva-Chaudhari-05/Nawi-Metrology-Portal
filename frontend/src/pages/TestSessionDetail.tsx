import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, CheckSquare, XCircle, AlertCircle, FileText } from 'lucide-react';

export const TestSessionDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [revokeReason, setRevokeReason] = useState('');
  const [revoking, setRevoking] = useState(false);
  const { token, user } = useAuth();

  useEffect(() => {
    fetchSession();
  }, [id, token]);

  const fetchSession = async () => {
    try {
      const res = await fetch(`/api/test-sessions/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      
      if (res.ok) {
        setSession(data);
      } else {
        setError(data.error || 'Failed to fetch session details');
      }
    } catch (err) {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  const handleRevoke = async () => {
    if (!revokeReason.trim()) {
      alert("Please provide a reason for revocation.");
      return;
    }
    
    setRevoking(true);
    try {
      const res = await fetch(`/api/test-sessions/${id}/revoke`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ reason: revokeReason })
      });
      
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to revoke approval');
      }
      
      // Refresh
      await fetchSession();
      setRevokeReason('');
    } catch (err: any) {
      alert(err.message);
    } finally {
      setRevoking(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-textSecondary animate-pulse">Loading session details...</div>;
  if (error) return <div className="p-8 text-center text-fail">{error}</div>;
  if (!session) return <div className="p-8 text-center text-textSecondary">Session not found</div>;

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <ArrowLeft className="h-5 w-5 text-gray-500" />
          </button>
          <div>
            <h2 className="text-2xl font-serif text-textPrimary">Session Details</h2>
            <div className="text-sm text-textSecondary flex items-center space-x-2 mt-1">
              <span className="font-medium text-gray-700">{session.instrument?.modelName}</span>
              <span>•</span>
              <span>{new Date(session.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
        
        <div>
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold 
            ${session.status === 'SUBMITTED' ? 'bg-primary/10 text-primary' : 
              session.status === 'DRAFT' ? 'bg-gray-100 text-gray-600' :
              session.status === 'REJECTED' ? 'bg-fail/10 text-fail' :
              'bg-success/10 text-success'}`}>
            {session.status}
          </span>
        </div>
      </div>

      {session.status === 'REJECTED' && session.reviewNotes && (
        <div className="bg-fail/10 border border-fail/20 rounded-xl p-6 mb-8">
          <div className="flex items-center space-x-2 text-fail mb-2">
            <AlertCircle className="h-5 w-5" />
            <h3 className="font-semibold text-lg">Rejection Reason</h3>
          </div>
          <p className="text-fail/90">{session.reviewNotes}</p>
        </div>
      )}

      {user?.role === 'ADMIN' && (session.status === 'DRAFT' || session.status === 'SUBMITTED') && (
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-6 mb-8 flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-blue-900 mb-1">Action Required</h3>
            <p className="text-sm text-blue-700">This session is pending administrative review.</p>
          </div>
          <Link to={`/test-sessions/${session.id}/review`} className="btn-primary flex items-center space-x-2">
            <CheckSquare className="h-4 w-4" />
            <span>Go to Review</span>
          </Link>
        </div>
      )}

      {user?.role === 'ADMIN' && session.status === 'APPROVED' && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-6 mb-8">
          <div className="flex items-center space-x-2 text-orange-800 mb-4">
            <XCircle className="h-5 w-5" />
            <h3 className="font-semibold text-lg">Revoke Approval</h3>
          </div>
          <p className="text-sm text-orange-700 mb-4">If you discovered an issue after approval, you can revoke it here. This will invalidate the generated reports.</p>
          <div className="flex items-start space-x-4">
            <input 
              type="text" 
              placeholder="Reason for revocation..." 
              value={revokeReason}
              onChange={(e) => setRevokeReason(e.target.value)}
              className="flex-1 border-orange-300 rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500 text-sm py-2 px-3"
            />
            <button 
              onClick={handleRevoke}
              disabled={revoking}
              className="bg-orange-600 hover:bg-orange-700 text-white font-medium py-2 px-4 rounded-md transition-colors text-sm"
            >
              {revoking ? 'Revoking...' : 'Revoke'}
            </button>
          </div>
        </div>
      )}

      <div className="space-y-6">
        <h3 className="font-serif text-xl text-textPrimary flex items-center space-x-2">
          <FileText className="h-5 w-5 text-primary" />
          <span>Recorded Test Results</span>
        </h3>
        
        {session.testResults?.length === 0 ? (
          <p className="text-gray-500 italic">No tests recorded yet.</p>
        ) : (
          session.testResults.map((tr: any) => (
            <div key={tr.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6">
              <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                <h4 className="font-medium text-gray-800">{tr.testType.replace('_', ' ')}</h4>
                <span className={`px-2 py-1 rounded text-xs font-bold ${tr.result === 'PASS' ? 'bg-success/10 text-success' : 'bg-fail/10 text-fail'}`}>
                  {tr.result}
                </span>
              </div>
              <div className="p-0 overflow-x-auto">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-white border-b border-gray-100">
                    <tr>
                      <th className="px-6 py-3 font-medium text-gray-500">Load Point</th>
                      <th className="px-6 py-3 font-medium text-gray-500">Reference Load</th>
                      <th className="px-6 py-3 font-medium text-gray-500">Indicated Value</th>
                      {tr.testType !== 'VISUAL_INSPECTION' && (
                        <>
                          <th className="px-6 py-3 font-medium text-gray-500">Error</th>
                          <th className="px-6 py-3 font-medium text-gray-500">MPE</th>
                        </>
                      )}
                      <th className="px-6 py-3 font-medium text-gray-500">Result</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {tr.rawReadings.map((r: any, idx: number) => {
                      const isVisual = tr.testType === 'VISUAL_INSPECTION';
                      const isPass = isVisual ? r.indicatedValue === 0 : (r.calculatedError !== undefined ? Math.abs(r.calculatedError) <= (r.mpe || r.permissibleError) : true);
                      
                      return (
                        <tr key={idx} className="hover:bg-gray-50">
                          <td className="px-6 py-3 text-gray-700">{r.loadPoint}</td>
                          <td className="px-6 py-3 font-mono">{isVisual ? 'N/A' : r.referenceValue}</td>
                          <td className="px-6 py-3 font-mono">{isVisual ? (r.indicatedValue === 0 ? 'Pass' : 'Fail') : r.indicatedValue}</td>
                          {!isVisual && (
                            <>
                              <td className="px-6 py-3 font-mono text-gray-600">{r.calculatedError !== undefined ? r.calculatedError : '-'}</td>
                              <td className="px-6 py-3 font-mono text-gray-600">±{r.mpe || r.permissibleError || '-'}</td>
                            </>
                          )}
                          <td className="px-6 py-3">
                            <span className={isPass || r.result === 'PASS' ? 'text-success font-medium' : 'text-fail font-medium'}>
                              {isVisual ? (r.indicatedValue === 0 ? 'PASS' : 'FAIL') : (r.result || (isPass ? 'PASS' : 'FAIL'))}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
