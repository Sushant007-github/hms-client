import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: HomeIcon, roles: ['Admin', 'Doctor', 'Receptionist'] },
  { path: '/patients', label: 'Patients', icon: UsersIcon, roles: ['Admin', 'Doctor', 'Receptionist'] },
  { path: '/billing', label: 'Billing', icon: ReceiptIcon, roles: ['Admin', 'Receptionist'] },
  { path: '/staff', label: 'Staff', icon: BadgeIcon, roles: ['Admin'] },
  { path: '/attendance', label: 'Attendance', icon: CalendarIcon, roles: ['Admin'] },
];

function HomeIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  );
}
function UsersIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}
function ReceiptIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" />
    </svg>
  );
}
function BadgeIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
    </svg>
  );
}
function CalendarIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  );
}

export default function Sidebar({ collapsed, setCollapsed }) {
  const { user, hasRole } = useAuth();
  const location = useLocation();

  const visibleItems = navItems.filter(item => item.roles.includes(user?.role));

  return (
    <div className={`fixed left-0 top-0 h-screen bg-white border-r border-gray-100 shadow-sidebar z-30 flex flex-col transition-all duration-300 ${collapsed ? 'w-20' : 'w-64'}`}>
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-gray-100">
        <div className="flex-shrink-0 w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
        </div>
        {!collapsed && (
          <div>
            <p className="font-bold text-gray-900 text-lg leading-tight">MediCore</p>
            <p className="text-xs text-blue-600 font-medium">HMS v1.0</p>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="ml-auto p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={collapsed ? "M13 5l7 7-7 7M5 5l7 7-7 7" : "M11 19l-7-7 7-7m8 14l-7-7 7-7"} />
          </svg>
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {!collapsed && (
          <p className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">Main Menu</p>
        )}
        {visibleItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname.startsWith(item.path);
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={`nav-link ${isActive ? 'nav-link-active' : 'nav-link-inactive'} ${collapsed ? 'justify-center px-2' : ''}`}
              title={collapsed ? item.label : ''}
            >
              <Icon />
              {!collapsed && <span>{item.label}</span>}
              {!collapsed && isActive && (
                <span className="ml-auto w-1.5 h-1.5 bg-blue-300 rounded-full" />
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* User info at bottom */}
      {!collapsed && user && (
        <div className="p-4 border-t border-gray-100">
          <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
              {user.name?.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">{user.name}</p>
              <span className="inline-block px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                {user.role}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
