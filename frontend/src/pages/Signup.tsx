import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Scale } from 'lucide-react';
import type { Role } from '../context/AuthContext';

export const Signup: React.FC = () => {
  const [role, setRole] = useState<Role>('OFFICER');
  const [formData, setFormData] = useState({
    name: '', email: '', password: '', confirmPassword: '', phone: '',
    labName: '', labRegId: '', designation: '', employeeCode: '',
    companyName: '', manufacturerLicenseNo: ''
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const navigate = useNavigate();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      return setError('Passwords do not match');
    }

    setIsLoading(true);

    try {
      const res = await fetch('http://localhost:3001/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, role })
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to register');
      } else {
        // Redirect to login after successful registration
        navigate('/login', { state: { message: 'Registration successful. Please log in.' } });
      }
    } catch (err) {
      setError('Network error. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 py-12">
      <div className="w-full max-w-2xl">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center mb-4 shadow-sm">
            <Scale className="text-white h-6 w-6" />
          </div>
          <h1 className="text-2xl font-serif text-textPrimary text-center">Ministry of Consumer Affairs</h1>
          <h2 className="text-sm text-textSecondary uppercase tracking-wider mt-1">Portal Registration</h2>
        </div>

        <div className="card p-8">
          {error && (
            <div className="mb-6 p-3 bg-fail/10 border border-fail/20 text-fail rounded-md text-sm text-center">
              {error}
            </div>
          )}

          <div className="flex border-b border-border mb-6">
            <button
              className={`flex-1 py-3 text-sm font-medium transition-colors border-b-2 ${role === 'OFFICER' ? 'border-primary text-primary' : 'border-transparent text-textSecondary hover:text-textPrimary'}`}
              onClick={() => setRole('OFFICER')}
            >
              Lab Officer
            </button>
            <button
              className={`flex-1 py-3 text-sm font-medium transition-colors border-b-2 ${role === 'ADMIN' ? 'border-primary text-primary' : 'border-transparent text-textSecondary hover:text-textPrimary'}`}
              onClick={() => setRole('ADMIN')}
            >
              Lab Supervisor
            </button>
            <button
              className={`flex-1 py-3 text-sm font-medium transition-colors border-b-2 ${role === 'MANUFACTURER' ? 'border-primary text-primary' : 'border-transparent text-textSecondary hover:text-textPrimary'}`}
              onClick={() => setRole('MANUFACTURER')}
            >
              Manufacturer
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-textSecondary mb-1">Full Name</label>
                <input required type="text" name="name" className="input-field" value={formData.name} onChange={handleInputChange} />
              </div>
              <div>
                <label className="block text-sm font-medium text-textSecondary mb-1">Email Address</label>
                <input required type="email" name="email" className="input-field" value={formData.email} onChange={handleInputChange} />
              </div>
              <div>
                <label className="block text-sm font-medium text-textSecondary mb-1">Password</label>
                <input required minLength={8} type="password" name="password" className="input-field" value={formData.password} onChange={handleInputChange} />
              </div>
              <div>
                <label className="block text-sm font-medium text-textSecondary mb-1">Confirm Password</label>
                <input required minLength={8} type="password" name="confirmPassword" className="input-field" value={formData.confirmPassword} onChange={handleInputChange} />
              </div>
              <div>
                <label className="block text-sm font-medium text-textSecondary mb-1">Phone Number</label>
                <input type="text" name="phone" className="input-field" value={formData.phone} onChange={handleInputChange} />
              </div>
            </div>

            <div className="border-t border-border pt-6 mt-6">
              <h4 className="text-sm font-semibold text-textPrimary uppercase tracking-wider mb-4">
                {role === 'MANUFACTURER' ? 'Manufacturer Details' : 'Laboratory Details'}
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(role === 'OFFICER' || role === 'ADMIN') && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-textSecondary mb-1">Lab Name</label>
                      <input required type="text" name="labName" className="input-field" value={formData.labName} onChange={handleInputChange} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-textSecondary mb-1">Lab Registration ID</label>
                      <input required type="text" name="labRegId" className="input-field" value={formData.labRegId} onChange={handleInputChange} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-textSecondary mb-1">Designation</label>
                      <input required type="text" name="designation" className="input-field" value={formData.designation} onChange={handleInputChange} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-textSecondary mb-1">Employee Code</label>
                      <input required type="text" name="employeeCode" className="input-field" value={formData.employeeCode} onChange={handleInputChange} />
                    </div>
                  </>
                )}

                {role === 'MANUFACTURER' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-textSecondary mb-1">Company Name</label>
                      <input required type="text" name="companyName" className="input-field" value={formData.companyName} onChange={handleInputChange} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-textSecondary mb-1">Manufacturer License Number</label>
                      <input required type="text" name="manufacturerLicenseNo" className="input-field" value={formData.manufacturerLicenseNo} onChange={handleInputChange} />
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="pt-4">
              <button type="submit" disabled={isLoading} className="btn-primary w-full py-2.5 text-base">
                {isLoading ? 'Submitting...' : 'Complete Registration'}
              </button>
            </div>
          </form>

          <div className="mt-6 text-center text-sm text-textSecondary">
            Already registered? <Link to="/login" className="text-primary hover:underline font-medium">Sign in here</Link>
          </div>
        </div>
      </div>
    </div>
  );
};
