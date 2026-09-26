import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { Scale, Plus, AlertCircle, FileText, CheckCircle2 } from 'lucide-react';

interface Instrument {
  id: string;
  modelName: string;
  instrumentType: string;
  serialNumber: string;
  accuracyClass: string;
  manufacturerName: string | null;
  manufacturer?: { name: string };
  createdAt: string;
}

export const InstrumentList: React.FC = () => {
  const [instruments, setInstruments] = useState<Instrument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { token, user } = useAuth();

  useEffect(() => {
    const fetchInstruments = async () => {
      try {
        const res = await fetch('/api/instruments', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        
        if (res.ok) {
          setInstruments(data);
        } else {
          setError(data.error || 'Failed to fetch instruments');
        }
      } catch (err) {
        setError('Network error');
      } finally {
        setLoading(false);
      }
    };

    fetchInstruments();
  }, [token]);

  if (loading) {
    return <div className="p-8 text-center text-textSecondary animate-pulse">Loading instruments...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-xl font-serif text-textPrimary">Registered Instruments</h3>
          <p className="text-sm text-textSecondary">Manage scales, weighbridges, and weights.</p>
        </div>
        
        {(user?.role === 'OFFICER' || user?.role === 'ADMIN') && (
          <Link to="/instruments/new" className="btn-primary flex items-center space-x-2">
            <Plus className="h-4 w-4" />
            <span>Register Instrument</span>
          </Link>
        )}
      </div>

      {error && (
        <div className="p-4 bg-fail/10 text-fail rounded-md flex items-center space-x-2">
          <AlertCircle className="h-5 w-5" />
          <span>{error}</span>
        </div>
      )}

      {instruments.length === 0 && !error ? (
        <div className="card p-12 text-center flex flex-col items-center">
          <Scale className="h-12 w-12 text-gray-300 mb-4" />
          <h4 className="text-lg font-medium text-textPrimary mb-2">No instruments found</h4>
          <p className="text-textSecondary text-sm mb-6 max-w-md">
            There are currently no instruments registered in the system. Get started by registering a new scale or weighbridge.
          </p>
          {(user?.role === 'OFFICER' || user?.role === 'ADMIN') && (
            <Link to="/instruments/new" className="btn-secondary">Register First Instrument</Link>
          )}
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-gray-50 border-b border-border">
              <tr>
                <th className="px-6 py-4 font-medium text-textSecondary tracking-wider">Model / Serial No.</th>
                <th className="px-6 py-4 font-medium text-textSecondary tracking-wider">Type & Class</th>
                <th className="px-6 py-4 font-medium text-textSecondary tracking-wider">Manufacturer</th>
                <th className="px-6 py-4 font-medium text-textSecondary tracking-wider">Registered</th>
                <th className="px-6 py-4 font-medium text-textSecondary tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {instruments.map((inst) => (
                <tr key={inst.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-medium text-textPrimary">{inst.modelName}</div>
                    <div className="text-textSecondary text-xs mt-0.5">SN: {inst.serialNumber}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-textPrimary">{inst.instrumentType.replace('_', ' ')}</div>
                    <div className="text-textSecondary text-xs mt-0.5">Class: {inst.accuracyClass}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-textPrimary">{inst.manufacturer?.name || inst.manufacturerName || 'N/A'}</span>
                  </td>
                  <td className="px-6 py-4 text-textSecondary">
                    {new Date(inst.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right space-x-3">
                    {(user?.role === 'OFFICER' || user?.role === 'ADMIN') && (
                      <Link 
                        to={`/test-sessions/new?instrumentId=${inst.id}`} 
                        className="inline-flex items-center text-primary hover:text-teal-700 font-medium"
                      >
                        <CheckCircle2 className="h-4 w-4 mr-1" />
                        Start Test
                      </Link>
                    )}
                    <Link to={`/instruments/${inst.id}`} className="text-textSecondary hover:text-textPrimary">Details</Link>
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
