import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AppLayout } from './components/AppLayout';
import { Login } from './pages/Login';
import { Signup } from './pages/Signup';
import { Dashboard } from './pages/Dashboard';
import { InstrumentList } from './pages/InstrumentList';
import { InstrumentForm } from './pages/InstrumentForm';
import { TestSessionList } from './pages/TestSessionList';
import { TestSessionFlow } from './pages/TestSessionFlow';
import { SupervisorReview } from './pages/SupervisorReview';
import { Reports } from './pages/Reports';
import { InstrumentDetail } from './pages/InstrumentDetail';
import { TestSessionDetail } from './pages/TestSessionDetail';
function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          
          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              
              {/* Instrument routes - Only Officer and Admin can register */}
              <Route path="/instruments" element={<InstrumentList />} />
              <Route path="/instruments/:id" element={<InstrumentDetail />} />
              <Route element={<ProtectedRoute allowedRoles={['OFFICER', 'ADMIN']} />}>
                <Route path="/instruments/new" element={<InstrumentForm />} />
              </Route>

              {/* Test Session routes */}
              <Route path="/test-sessions" element={<TestSessionList />} />
              <Route element={<ProtectedRoute allowedRoles={['OFFICER', 'ADMIN']} />}>
                <Route path="/test-sessions/new" element={<TestSessionFlow />} />
              </Route>
              <Route path="/test-sessions/:id" element={<TestSessionDetail />} />
              <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
                <Route path="/test-sessions/:id/review" element={<SupervisorReview />} />
              </Route>

              {/* Dummy route for Manufacturer only to test role guards */}
              <Route element={<ProtectedRoute allowedRoles={['MANUFACTURER']} />}>
                <Route path="/manufacturer-only" element={<div>Manufacturer Only Page</div>} />
              </Route>
              
              <Route path="/reports" element={<Reports />} />

              
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
            </Route>
          </Route>
          
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
