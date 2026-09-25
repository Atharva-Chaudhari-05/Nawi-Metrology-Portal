import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Scale, AlertCircle } from 'lucide-react';

export const InstrumentForm: React.FC = () => {
  const [formData, setFormData] = useState({
    modelName: '',
    manufacturerName: '', // For now text field since we don't have a /users endpoint
    instrumentType: 'ELECTRONIC_SCALE',
    accuracyClass: 'II',
    serialNumber: '',
    maxCapacity: '',
    minCapacity: '',
    eValue: ''
  });
  
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { token } = useAuth();
  const navigate = useNavigate();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const validateForm = () => {
    const minCap = parseFloat(formData.minCapacity);
    const maxCap = parseFloat(formData.maxCapacity);
    const eVal = parseFloat(formData.eValue);

    if (minCap >= maxCap) {
      setError('Minimum Capacity must be less than Maximum Capacity');
      return false;
    }

    if (eVal <= 0) {
      setError('Verification Scale Interval (e) must be a positive number');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) return;

    setIsLoading(true);

    try {
      const payload = {
        ...formData,
        maxCapacity: parseFloat(formData.maxCapacity),
        minCapacity: parseFloat(formData.minCapacity),
        eValue: parseFloat(formData.eValue)
      };

      const res = await fetch('http://localhost:3001/api/instruments', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (!res.ok) {
        // Backend handles unique constraint on SN and will return an error
        setError(data.error || 'Failed to register instrument');
      } else {
        navigate('/instruments');
      }
    } catch (err) {
      setError('Network error. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center space-x-3 mb-6">
        <div className="p-3 bg-primary/10 rounded-md">
          <Scale className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h3 className="text-xl font-serif text-textPrimary">Register New Instrument</h3>
          <p className="text-sm text-textSecondary">Enter the specifications from the instrument's nameplate.</p>
        </div>
      </div>

      <div className="card p-8">
        {error && (
          <div className="mb-6 p-4 bg-fail/10 border border-fail/20 text-fail rounded-md text-sm flex items-start space-x-2">
            <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* General Info */}
            <div className="md:col-span-2 pb-4 border-b border-border">
              <h4 className="text-sm font-medium text-textPrimary uppercase tracking-wider mb-4">General Details</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-textSecondary mb-1">Model Name / Designation</label>
                  <input required type="text" name="modelName" className="input-field" value={formData.modelName} onChange={handleInputChange} placeholder="e.g. XP-200" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-textSecondary mb-1">Manufacturer</label>
                  <input required type="text" name="manufacturerName" className="input-field" value={formData.manufacturerName} onChange={handleInputChange} placeholder="e.g. Acme Scales Ltd" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-textSecondary mb-1">Instrument Type</label>
                  <select name="instrumentType" className="input-field" value={formData.instrumentType} onChange={handleInputChange}>
                    <option value="ELECTRONIC_SCALE">Electronic Scale</option>
                    <option value="PLATFORM_SCALE">Platform Scale</option>
                    <option value="WEIGHBRIDGE">Weighbridge</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-textSecondary mb-1">Serial Number</label>
                  <input required type="text" name="serialNumber" className="input-field font-mono" value={formData.serialNumber} onChange={handleInputChange} placeholder="Unique SN" />
                </div>
              </div>
            </div>

            {/* Technical Specs */}
            <div className="md:col-span-2">
              <h4 className="text-sm font-medium text-textPrimary uppercase tracking-wider mb-4">Metrological Specifications</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-textSecondary mb-1">Max Capacity (Max)</label>
                  <div className="relative">
                    <input required type="number" step="any" min="0" name="maxCapacity" className="input-field pr-12" value={formData.maxCapacity} onChange={handleInputChange} />
                    <span className="absolute right-3 top-2 text-textSecondary text-sm">kg</span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-textSecondary mb-1">Min Capacity (Min)</label>
                  <div className="relative">
                    <input required type="number" step="any" min="0" name="minCapacity" className="input-field pr-12" value={formData.minCapacity} onChange={handleInputChange} />
                    <span className="absolute right-3 top-2 text-textSecondary text-sm">kg</span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-textSecondary mb-1">Accuracy Class</label>
                  <select name="accuracyClass" className="input-field" value={formData.accuracyClass} onChange={handleInputChange}>
                    <option value="I">Class I (Special)</option>
                    <option value="II">Class II (High)</option>
                    <option value="III">Class III (Medium)</option>
                    <option value="IIII">Class IIII (Ordinary)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-primary mb-1">Verification Scale Interval (e)</label>
                  <div className="relative">
                    <input required type="number" step="any" min="0.0001" name="eValue" className="input-field pr-12 border-primary/50" value={formData.eValue} onChange={handleInputChange} />
                    <span className="absolute right-3 top-2 text-textSecondary text-sm">kg</span>
                  </div>
                  <p className="text-xs text-textSecondary mt-1">Crucial for MPE calculation math.</p>
                </div>
              </div>
            </div>
            
          </div>

          <div className="pt-6 border-t border-border flex justify-end space-x-4">
            <button type="button" onClick={() => navigate(-1)} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={isLoading} className="btn-primary px-8">
              {isLoading ? 'Saving...' : 'Register Instrument'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
