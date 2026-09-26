import React, { useState, useEffect } from 'react';
import { FileText, Download, Filter, Search } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface Report {
  id: string;
  testSessionId: string;
  reportNumber: string;
  createdAt: string;
  pdfUrl: string;
  docxUrl: string;
  testSession: {
    status: string;
    createdAt: string;
    instrument: {
      modelName: string;
      manufacturerName: string | null;
    };
  };
}

export const Reports: React.FC = () => {
  const { token, user } = useAuth();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [modelFilter, setModelFilter] = useState('');
  const [manufacturerFilter, setManufacturerFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateStart, setDateStart] = useState('');
  const [dateEnd, setDateEnd] = useState('');

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const res = await fetch('/api/reports', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setReports(data);
      }
    } catch (err) {
      console.error('Failed to fetch reports', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (testSessionId: string, type: 'pdf' | 'docx') => {
    try {
      const url = `/api/test-sessions/${testSessionId}/report${type === 'docx' ? '/docx' : ''}`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!res.ok) throw new Error('Download failed');
      
      const blob = await res.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      // Get filename from content-disposition if possible, otherwise fallback
      const cd = res.headers.get('content-disposition');
      let filename = `report.${type}`;
      if (cd && cd.includes('filename=')) {
        filename = cd.split('filename=')[1].replace(/"/g, '');
      }
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(downloadUrl);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Download error:', err);
      alert('Failed to download report.');
    }
  };

  const filteredReports = reports.filter(r => {
    const modelMatch = r.testSession.instrument.modelName.toLowerCase().includes(modelFilter.toLowerCase());
    const mfgMatch = (r.testSession.instrument.manufacturerName || '').toLowerCase().includes(manufacturerFilter.toLowerCase());
    
    // Status is based on the testSession status, which is APPROVED or REJECTED.
    // Assuming APPROVED = Pass, REJECTED = Fail for the final report.
    const isPass = r.testSession.status === 'APPROVED';
    const statusMatch = statusFilter === '' ? true : 
                        statusFilter === 'PASS' ? isPass : !isPass;

    let dateMatch = true;
    const reportDate = new Date(r.createdAt);
    if (dateStart) {
      if (reportDate < new Date(dateStart)) dateMatch = false;
    }
    if (dateEnd) {
      // Add one day to end date to make it inclusive of the selected day
      const end = new Date(dateEnd);
      end.setDate(end.getDate() + 1);
      if (reportDate >= end) dateMatch = false;
    }

    return modelMatch && mfgMatch && statusMatch && dateMatch;
  });

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center space-x-3 mb-6">
        <FileText className="h-6 w-6 text-primary" />
        <h2 className="text-2xl font-serif text-textPrimary">Report Repository</h2>
      </div>

      {/* Filters Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex items-center space-x-2 mb-4 text-sm font-medium text-gray-700">
          <Filter className="h-4 w-4" />
          <span>Filters</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Instrument Model</label>
            <input 
              type="text" 
              className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder="Search model..."
              value={modelFilter}
              onChange={(e) => setModelFilter(e.target.value)}
            />
          </div>
          {user?.role !== 'MANUFACTURER' && (
            <div>
              <label className="block text-xs text-gray-500 mb-1">Manufacturer</label>
              <input 
                type="text" 
                className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="Search manufacturer..."
                value={manufacturerFilter}
                onChange={(e) => setManufacturerFilter(e.target.value)}
              />
            </div>
          )}
          <div>
            <label className="block text-xs text-gray-500 mb-1">Status</label>
            <select 
              className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All</option>
              <option value="PASS">Pass (Approved)</option>
              <option value="FAIL">Fail (Rejected)</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Date From</label>
            <input 
              type="date" 
              className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              value={dateStart}
              onChange={(e) => setDateStart(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Date To</label>
            <input 
              type="date" 
              className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              value={dateEnd}
              onChange={(e) => setDateEnd(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Reports Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50 text-gray-700 text-xs uppercase border-b">
              <tr>
                <th className="px-6 py-4 font-medium">Report Number</th>
                <th className="px-6 py-4 font-medium">Instrument</th>
                <th className="px-6 py-4 font-medium">Manufacturer</th>
                <th className="px-6 py-4 font-medium">Test Date</th>
                <th className="px-6 py-4 font-medium">Generated Date</th>
                <th className="px-6 py-4 font-medium text-center">Status</th>
                <th className="px-6 py-4 font-medium text-right">Downloads</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={7} className="px-6 py-8 text-center text-gray-500">Loading reports...</td></tr>
              ) : filteredReports.length === 0 ? (
                <tr><td colSpan={7} className="px-6 py-8 text-center text-gray-500">No reports found matching filters.</td></tr>
              ) : (
                filteredReports.map((report) => (
                  <tr key={report.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-900">{report.reportNumber}</td>
                    <td className="px-6 py-4">{report.testSession.instrument.modelName}</td>
                    <td className="px-6 py-4">{report.testSession.instrument.manufacturerName || 'N/A'}</td>
                    <td className="px-6 py-4">{new Date(report.testSession.createdAt).toLocaleDateString()}</td>
                    <td className="px-6 py-4">{new Date(report.createdAt).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        report.testSession.status === 'APPROVED' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {report.testSession.status === 'APPROVED' ? 'PASS' : 'FAIL'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right space-x-2 whitespace-nowrap">
                      <button 
                        onClick={() => handleDownload(report.testSessionId, 'pdf')}
                        className="inline-flex items-center px-3 py-1.5 text-xs font-medium bg-primary/10 text-primary rounded hover:bg-primary/20 transition-colors"
                        title="Download PDF"
                      >
                        <Download className="w-3 h-3 mr-1" /> PDF
                      </button>
                      <button 
                        onClick={() => handleDownload(report.testSessionId, 'docx')}
                        className="inline-flex items-center px-3 py-1.5 text-xs font-medium bg-blue-50 text-blue-600 border border-blue-100 rounded hover:bg-blue-100 transition-colors"
                        title="Download Word"
                      >
                        <Download className="w-3 h-3 mr-1" /> DOCX
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
