import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, CheckCircle2, Scale, Calendar, User, FileText } from 'lucide-react';

export const InstrumentDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [instrument, setInstrument] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { token, user } = useAuth();

  useEffect(() => {
    const fetchInstrument = async () => {
      try {
        const res = await fetch(`/api/instruments/${id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        
        if (res.ok) {
          setInstrument(data);
        } else {
          setError(data.error || 'Failed to fetch instrument details');
        }
      } catch (err) {
        setError('Network error');
      } finally {
        setLoading(false);
      }
    };

    fetchInstrument();
  }, [id, token]);

  if (loading) return <div className="p-8 text-center text-textSecondary animate-pulse">Loading instrument details...</div>;
  if (error) return <div className="p-8 text-center text-fail">{error}</div>;
  if (!instrument) return <div className="p-8 text-center text-textSecondary">Instrument not found</div>;

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
          <Link to="/instruments" className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <ArrowLeft className="h-5 w-5 text-gray-500" />
          </Link>
          <div>
            <h2 className="text-2xl font-serif text-textPrimary">Instrument Details</h2>
            <div className="text-sm text-textSecondary flex items-center space-x-2 mt-1">
              <span className="font-medium text-gray-700">{instrument.modelName}</span>
              <span>•</span>
              <span>SN: {instrument.serialNumber}</span>
            </div>
          </div>
        </div>
        
        {(user?.role === 'OFFICER' || user?.role === 'ADMIN') && (
          <Link 
            to={`/test-sessions/new?instrumentId=${instrument.id}`} 
            className="btn-primary flex items-center space-x-2"
          >
            <CheckCircle2 className="h-4 w-4" />
            <span>Start New Test</span>
          </Link>
        )}
      </div>

      {/* Info Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-2 mb-4 text-primary">
            <Scale className="h-5 w-5" />
            <h3 className="font-medium">Specifications</h3>
          </div>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between border-b border-gray-100 pb-2">
              <span className="text-gray-500">Type</span>
              <span className="font-medium">{instrument.instrumentType.replace('_', ' ')}</span>
            </div>
            <div className="flex justify-between border-b border-gray-100 pb-2">
              <span className="text-gray-500">Accuracy Class</span>
              <span className="font-medium text-primary">Class {instrument.accuracyClass}</span>
            </div>
            <div className="flex justify-between border-b border-gray-100 pb-2">
              <span className="text-gray-500">Max Capacity</span>
              <span className="font-medium">{instrument.maxCapacity} kg</span>
            </div>
            <div className="flex justify-between border-b border-gray-100 pb-2">
              <span className="text-gray-500">Min Capacity</span>
              <span className="font-medium">{instrument.minCapacity} kg</span>
            </div>
            <div className="flex justify-between pb-2">
              <span className="text-gray-500">Verification Interval (e)</span>
              <span className="font-medium">{instrument.eValue} kg</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-2 mb-4 text-primary">
            <User className="h-5 w-5" />
            <h3 className="font-medium">Registration Info</h3>
          </div>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between border-b border-gray-100 pb-2">
              <span className="text-gray-500">Manufacturer</span>
              <span className="font-medium">{instrument.manufacturer?.name || instrument.manufacturerName || 'N/A'}</span>
            </div>
            <div className="flex justify-between border-b border-gray-100 pb-2">
              <span className="text-gray-500">Registered Date</span>
              <span className="font-medium">{new Date(instrument.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Test History */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2 text-primary">
            <FileText className="h-5 w-5" />
            <h3 className="font-medium text-lg">Test Session History</h3>
          </div>
        </div>
        
        {!instrument.testSessions || instrument.testSessions.length === 0 ? (
          <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg border border-dashed border-gray-200">
            No test sessions recorded for this instrument yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-gray-50 border-b border-border">
                <tr>
                  <th className="px-6 py-3 font-medium text-textSecondary tracking-wider rounded-tl-lg">Date</th>
                  <th className="px-6 py-3 font-medium text-textSecondary tracking-wider">Status</th>
                  <th className="px-6 py-3 font-medium text-textSecondary tracking-wider text-right rounded-tr-lg">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {instrument.testSessions.map((s: any) => (
                  <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-gray-700">
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <span>{new Date(s.createdAt).toLocaleDateString()}</span>
                      </div>
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
                    <td className="px-6 py-4 text-right">
                      <Link to={`/test-sessions/${s.id}`} className="text-primary hover:text-teal-700 font-medium text-sm">
                        View Details
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
