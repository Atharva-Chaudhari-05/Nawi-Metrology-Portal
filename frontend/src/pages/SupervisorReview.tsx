import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useParams, useNavigate, Link } from 'react-router-dom';
import SignatureCanvas from 'react-signature-canvas';
import { CheckCircle2, XCircle, AlertCircle, ArrowLeft, PenTool, Download } from 'lucide-react';
import { AccuracyClass, isReadingPass } from '../utils/oiml-calculator';

export const SupervisorReview: React.FC = () => {
  const { id } = useParams();
  const { token } = useAuth();
  const navigate = useNavigate();
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [reviewNotes, setReviewNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const sigCanvas = useRef<any>(null);

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const res = await fetch(`/api/test-sessions/${id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        
        if (res.ok) {
          setSession(data);
        } else {
          setError(data.error || 'Failed to fetch session');
        }
      } catch (err) {
        setError('Network error');
      } finally {
        setLoading(false);
      }
    };

    fetchSession();
  }, [id, token]);

  if (loading) return <div className="p-8 text-center text-textSecondary animate-pulse">Loading review data...</div>;
  if (!session) return <div className="p-8 text-fail text-center">Session not found</div>;

  const allPassed = session.testResults.every((t: any) => t.result === 'PASS');
  const sessionVerdict = allPassed ? 'PASS' : 'FAIL';

  const handleClearSignature = () => {
    sigCanvas.current?.clear();
  };

  const handleAction = async (action: 'APPROVE' | 'REJECT') => {
    setError('');
    if (action === 'REJECT' && !reviewNotes.trim()) {
      setError('Review notes are required when rejecting.');
      return;
    }
    
    let signatureData = null;
    if (action === 'APPROVE') {
      if (sigCanvas.current?.isEmpty()) {
        setError('Signature is required to approve.');
        return;
      }
      // Use getCanvas() instead of getTrimmedCanvas() due to Vite CommonJS issues with trim-canvas
      signatureData = sigCanvas.current.getCanvas().toDataURL('image/png');
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/test-sessions/${id}/review`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ action, reviewNotes, signatureData })
      });
      const data = await res.json();
      if (res.ok) {
        navigate('/test-sessions');
      } else {
        setError(data.error || `Failed to ${action.toLowerCase()} session`);
      }
    } catch (err) {
      setError('Network error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-24">
      <div className="flex items-center space-x-4 mb-6">
        <Link to="/test-sessions" className="p-2 text-textSecondary hover:bg-gray-100 rounded-md transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h3 className="text-xl font-serif text-textPrimary">Supervisor Review</h3>
          <p className="text-sm text-textSecondary">Review submitted test session before final approval.</p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-fail/10 text-fail rounded-md flex items-center space-x-2">
          <AlertCircle className="h-5 w-5" />
          <span>{error}</span>
        </div>
      )}

      {/* OVERALL VERDICT BANNER */}
      <div className={`p-6 rounded-lg flex items-center justify-between shadow-sm border ${sessionVerdict === 'PASS' ? 'bg-success/5 border-success/20' : 'bg-fail/5 border-fail/20'}`}>
        <div className="flex items-center space-x-4">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${sessionVerdict === 'PASS' ? 'bg-success/20' : 'bg-fail/20'}`}>
            {sessionVerdict === 'PASS' ? <CheckCircle2 className="w-6 h-6 text-success" /> : <XCircle className="w-6 h-6 text-fail" />}
          </div>
          <div>
            <h4 className="text-lg font-bold text-textPrimary">
              Overall Session Verdict: <span className={sessionVerdict === 'PASS' ? 'text-success' : 'text-fail'}>{sessionVerdict}</span>
            </h4>
            <p className="text-sm text-textSecondary mt-0.5">
              {sessionVerdict === 'PASS' 
                ? 'All individual tests passed the verification limits.' 
                : 'One or more tests failed the Maximum Permissible Error (MPE) limit.'}
            </p>
          </div>
        </div>
        
        {session.status === 'APPROVED' && session.report && (
          <div className="flex items-center space-x-3">
            <button 
              onClick={async () => {
                try {
                  const res = await fetch(`/api/test-sessions/${session.id}/report`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                  });
                  if (res.ok) {
                    const blob = await res.blob();
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `Report_${session.report.reportNumber.replace(/\//g, '_')}.pdf`;
                    document.body.appendChild(a);
                    a.click();
                    window.URL.revokeObjectURL(url);
                    a.remove();
                  } else {
                    setError('Failed to download PDF.');
                  }
                } catch (e) {
                  setError('Network error downloading report.');
                }
              }}
              className="flex items-center space-x-2 bg-primary hover:bg-teal-800 text-white px-4 py-2 rounded-md font-medium transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Download PDF</span>
            </button>
            <button 
              onClick={async () => {
                try {
                  const res = await fetch(`/api/test-sessions/${session.id}/report/docx`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                  });
                  if (res.ok) {
                    const blob = await res.blob();
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `Report_${session.report.reportNumber.replace(/\//g, '_')}.docx`;
                    document.body.appendChild(a);
                    a.click();
                    window.URL.revokeObjectURL(url);
                    a.remove();
                  } else {
                    setError('Failed to download Word Document.');
                  }
                } catch (e) {
                  setError('Network error downloading report.');
                }
              }}
              className="flex items-center space-x-2 bg-white border border-primary text-primary hover:bg-primary/5 px-4 py-2 rounded-md font-medium transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Download Word</span>
            </button>
          </div>
        )}
      </div>

      {/* READ ONLY METADATA */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card p-6">
          <h4 className="font-medium text-textPrimary uppercase tracking-wider text-sm mb-4">Instrument Details</h4>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between"><span className="text-textSecondary">Model</span><span className="font-medium">{session.instrument.modelName}</span></div>
            <div className="flex justify-between"><span className="text-textSecondary">Serial No.</span><span className="font-mono">{session.instrument.serialNumber}</span></div>
            <div className="flex justify-between"><span className="text-textSecondary">Accuracy Class</span><span>{session.instrument.accuracyClass}</span></div>
            <div className="flex justify-between"><span className="text-textSecondary">Max Capacity</span><span>{session.instrument.maxCapacity} kg</span></div>
            <div className="flex justify-between"><span className="text-textSecondary">Verification Interval (e)</span><span>{session.instrument.eValue} kg</span></div>
          </div>
        </div>
        
        <div className="card p-6">
          <h4 className="font-medium text-textPrimary uppercase tracking-wider text-sm mb-4">Session Info</h4>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between"><span className="text-textSecondary">Tested By</span><span className="font-medium">{session.labOfficer.name}</span></div>
            <div className="flex justify-between"><span className="text-textSecondary">Submitted On</span><span>{new Date(session.submittedAt || session.createdAt).toLocaleString()}</span></div>
            <div className="flex justify-between"><span className="text-textSecondary">Lab Temperature</span><span>{session.labTemperature ? `${session.labTemperature}°C` : '-'}</span></div>
            <div className="flex justify-between"><span className="text-textSecondary">Lab Humidity</span><span>{session.labHumidity ? `${session.labHumidity}%` : '-'}</span></div>
          </div>
        </div>
      </div>

      {/* READ ONLY RESULTS TABLES */}
      <div className="space-y-6">
        <h4 className="font-serif text-lg text-textPrimary">Test Results</h4>
        
        {session.testResults.map((result: any) => (
          <div key={result.id} className="card p-0 overflow-hidden">
            <div className="bg-gray-50 border-b border-border p-4 flex justify-between items-center">
              <h5 className="font-medium text-textPrimary">{result.testType.replace('_', ' ')}</h5>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${result.result === 'PASS' ? 'bg-success/10 text-success' : 'bg-fail/10 text-fail'}`}>
                {result.result}
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-white border-b border-border">
                  <tr>
                    <th className="px-6 py-3 font-medium text-textSecondary">Pt.</th>
                    <th className="px-6 py-3 font-medium text-textSecondary">Ref. Load</th>
                    <th className="px-6 py-3 font-medium text-textSecondary">Indicated</th>
                    <th className="px-6 py-3 font-medium text-textSecondary">Error</th>
                    <th className="px-6 py-3 font-medium text-textSecondary">MPE</th>
                    <th className="px-6 py-3 font-medium text-textSecondary">Result</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border bg-white">
                  {result.rawReadings.map((r: any, idx: number) => {
                    // Recalculate just for UI presentation consistency (backend already decided)
                    const evalResult = isReadingPass(
                      session.instrument.accuracyClass as AccuracyClass,
                      session.instrument.eValue,
                      r.referenceValue,
                      r.indicatedValue
                    );
                    return (
                      <tr key={idx} className="hover:bg-gray-50/30">
                        <td className="px-6 py-3 text-textSecondary">{r.loadPoint}</td>
                        <td className="px-6 py-3 font-mono">{r.referenceValue}</td>
                        <td className="px-6 py-3 font-mono">{r.indicatedValue}</td>
                        <td className="px-6 py-3 font-mono">{evalResult.error.toFixed(4)}</td>
                        <td className="px-6 py-3 font-mono text-textSecondary">±{evalResult.mpe.toFixed(4)}</td>
                        <td className="px-6 py-3">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${evalResult.pass ? 'bg-success/5 text-success' : 'bg-fail/5 text-fail'}`}>
                            {evalResult.pass ? 'PASS' : 'FAIL'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>

      {/* APPROVAL ACTION AREA */}
      {session.status === 'SUBMITTED' ? (
        <div className="card p-8 bg-surface">
          <h4 className="font-serif text-lg text-textPrimary mb-6 flex items-center">
            <PenTool className="w-5 h-5 mr-2 text-primary" />
            Supervisor Decision
          </h4>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-textSecondary mb-2">Reviewer Notes (Optional for Approve, Required for Reject)</label>
              <textarea 
                rows={3} 
                className="input-field" 
                placeholder="Enter any comments or reasons for rejection..."
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-textSecondary mb-2">Draw your signature to approve</label>
              <div className="border border-border rounded-lg bg-white overflow-hidden shadow-inner w-full max-w-lg">
                <SignatureCanvas 
                  ref={sigCanvas}
                  penColor="#1F5F5B"
                  canvasProps={{ className: 'w-full h-48 cursor-crosshair' }} 
                />
              </div>
              <button onClick={handleClearSignature} className="text-sm text-textSecondary hover:text-fail mt-2">
                Clear Signature
              </button>
            </div>
            
            <div className="pt-6 border-t border-border flex space-x-4">
              <button 
                onClick={() => handleAction('REJECT')} 
                disabled={isSubmitting}
                className="px-6 py-2 rounded-md font-medium text-fail border border-fail/20 hover:bg-fail/5 transition-colors"
              >
                Reject Session
              </button>
              <button 
                onClick={() => handleAction('APPROVE')} 
                disabled={isSubmitting}
                className="btn-primary px-8"
              >
                {isSubmitting ? 'Processing...' : 'Approve & Sign'}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="card p-8 bg-surface border border-border">
          <h4 className="font-serif text-lg text-textPrimary mb-4">Review Complete</h4>
          <div className="space-y-3">
            <div className="flex justify-between max-w-sm"><span className="text-textSecondary">Status</span><span className={`font-medium ${session.status === 'APPROVED' ? 'text-success' : 'text-fail'}`}>{session.status}</span></div>
            <div className="flex justify-between max-w-sm"><span className="text-textSecondary">Reviewed By</span><span className="font-medium">{session.reviewedBy?.name}</span></div>
            <div className="flex justify-between max-w-sm"><span className="text-textSecondary">Reviewed On</span><span className="font-medium">{session.reviewedAt ? new Date(session.reviewedAt).toLocaleDateString() : '-'}</span></div>
            {session.reviewNotes && (
              <div className="mt-4">
                <span className="text-textSecondary block mb-1 text-sm">Reviewer Notes:</span>
                <p className="p-3 bg-gray-50 rounded-md text-sm border border-border">{session.reviewNotes}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
