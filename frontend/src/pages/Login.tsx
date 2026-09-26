import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Scale } from 'lucide-react';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const res = await fetch('http://localhost:3001/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to login');
      } else {
        login(data.user, data.token);
        navigate('/dashboard');
      }
    } catch (err) {
      setError('Network error. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center mb-4 shadow-sm">
            <Scale className="text-white h-6 w-6" />
          </div>
          <h1 className="text-2xl font-serif text-textPrimary text-center">Ministry of Consumer Affairs</h1>
          <h2 className="text-sm text-textSecondary uppercase tracking-wider mt-1">Legal Metrology Dept</h2>
        </div>

        <div className="card p-8">
          <h3 className="text-xl font-medium mb-6 text-center">Sign in to your account</h3>
          
          {error && (
            <div className="mb-4 p-3 bg-fail/10 border border-fail/20 text-fail rounded-md text-sm text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {import.meta.env.DEV && (
              <div className="mb-4 p-3 bg-gray-50 border border-border rounded-md">
                <label className="block text-xs font-medium text-textSecondary mb-1">Quick Login (Dev Only)</label>
                <select 
                  className="input-field py-1 text-sm bg-white"
                  onChange={(e) => {
                    if (e.target.value) {
                      setEmail(e.target.value);
                      setPassword('password123');
                    }
                  }}
                >
                  <option value="">Select a seeded user...</option>
                  <option value="admin@metrology.gov.in">Admin (Supervisor)</option>
                  <option value="rajesh.officer@metrology.gov.in">Officer (Rajesh)</option>
                  <option value="sneha.officer@metrology.gov.in">Officer (Sneha)</option>
                  <option value="contact@acmescales.in">Manufacturer (Acme)</option>
                </select>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-textSecondary mb-1">Email Address</label>
              <input
                type="email"
                required
                className="input-field"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="officer@metrology.gov.in"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-textSecondary mb-1">Password</label>
              <input
                type="password"
                required
                className="input-field"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            
            <div className="flex items-center justify-between mt-2 mb-4 text-sm">
              <label className="flex items-center text-textSecondary">
                <input type="checkbox" className="mr-2 rounded border-border text-primary focus:ring-primary" />
                Remember me
              </label>
              <a href="#" className="text-primary hover:underline">Forgot password?</a>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full flex justify-center py-2.5"
            >
              {isLoading ? 'Authenticating...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-textSecondary">
            Don't have an account? <Link to="/signup" className="text-primary hover:underline font-medium">Register here</Link>
          </div>
        </div>
      </div>
    </div>
  );
};
