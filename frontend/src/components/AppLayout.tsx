import React from 'react';
import { useAuth } from '../context/AuthContext';
import { LogOut, User as UserIcon, LayoutDashboard, Scale, FileText, CheckSquare, Settings } from 'lucide-react';
import { Link, useLocation, Outlet } from 'react-router-dom';

export const AppLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Instruments', path: '/instruments', icon: Scale },
    { name: 'Test Sessions', path: '/test-sessions', icon: CheckSquare },
    { name: 'Reports', path: '/reports', icon: FileText },
    ...(user?.role === 'ADMIN' ? [{ name: 'Settings', path: '/settings', icon: Settings }] : []),
  ];

  const getPageTitle = () => {
    if (location.pathname === '/dashboard') return 'Dashboard Overview';
    if (location.pathname.startsWith('/instruments/new')) return 'Register New Instrument';
    if (location.pathname.startsWith('/instruments')) return 'Instruments Registry';
    if (location.pathname.startsWith('/test-sessions')) return 'Test Sessions';
    if (location.pathname.startsWith('/reports')) return 'Reports';
    return 'Portal';
  };

  return (
    <div className="flex h-screen bg-background font-sans overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-surface border-r border-border flex flex-col justify-between shrink-0">
        <div>
          <div className="p-6 border-b border-border flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary rounded-md flex items-center justify-center shrink-0">
              <Scale className="text-white h-5 w-5" />
            </div>
            <div>
              <h1 className="font-serif font-semibold text-textPrimary text-sm leading-tight">Ministry of Consumer Affairs</h1>
              <p className="text-[10px] uppercase tracking-widest text-textSecondary mt-0.5">Legal Metrology</p>
            </div>
          </div>

          <nav className="p-4 space-y-1">
            {navItems.map((item) => {
              const isActive = location.pathname.startsWith(item.path);
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  className={`flex items-center space-x-3 px-3 py-2.5 rounded-md transition-colors text-sm font-medium ${
                    isActive 
                      ? 'bg-primary/10 text-primary' 
                      : 'text-textSecondary hover:bg-gray-50 hover:text-textPrimary'
                  }`}
                >
                  <Icon className={`h-5 w-5 ${isActive ? 'text-primary' : 'text-textSecondary'}`} />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="p-4 border-t border-border bg-gray-50/50">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center shrink-0">
              <UserIcon className="h-5 w-5 text-gray-500" />
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-medium text-textPrimary truncate">{user?.name}</p>
              <p className="text-xs text-textSecondary truncate">{user?.role}</p>
            </div>
          </div>
          <button 
            onClick={logout} 
            className="flex items-center space-x-2 text-sm text-fail hover:text-red-700 w-full px-2 py-1.5 rounded-md hover:bg-red-50 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            <span>Sign out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="h-16 bg-surface border-b border-border flex items-center px-8 shrink-0">
          <h2 className="text-lg font-serif font-medium text-textPrimary">{getPageTitle()}</h2>
        </header>

        <div className="flex-1 overflow-auto p-8 relative">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
