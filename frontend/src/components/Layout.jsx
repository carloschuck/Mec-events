import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { 
  LayoutDashboard, 
  Calendar, 
  QrCode, 
  User, 
  LogOut,
  Menu,
  X,
  Users
} from 'lucide-react';
import { useState } from 'react';

const Layout = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navigation = [
    { name: 'Dashboard', to: '/dashboard', icon: LayoutDashboard },
    { name: 'Events', to: '/events', icon: Calendar },
    { name: 'Attendees', to: '/attendees', icon: Users },
    { name: 'Check-In', to: '/checkin', icon: QrCode },
  ];

  const NavLinkItem = ({ item }) => (
    <NavLink
      to={item.to}
      onClick={() => setMobileMenuOpen(false)}
      className={({ isActive }) =>
        `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
          isActive
            ? 'bg-primary-100 text-primary-700'
            : 'text-gray-700 hover:bg-gray-100'
        }`
      }
    >
      <item.icon className="w-5 h-5" />
      <span className="font-medium">{item.name}</span>
    </NavLink>
  );

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gray-50">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex md:flex-col w-64 bg-white border-r border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-primary-600">MEC Dashboard</h1>
          <p className="text-sm text-gray-600 mt-1">Event Management</p>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {navigation.map((item) => (
            <NavLinkItem key={item.name} item={item} />
          ))}
        </nav>

        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-primary-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
            </div>
          </div>
          
          <NavLink
            to="/profile"
            className="flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors mb-2"
          >
            <User className="w-5 h-5" />
            <span className="text-sm font-medium">Profile</span>
          </NavLink>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span className="text-sm font-medium">Logout</span>
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden bg-white border-b border-gray-200">
        <div className="flex items-center justify-between p-4">
          <h1 className="text-xl font-bold text-primary-600">MEC Dashboard</h1>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg hover:bg-gray-100"
          >
            {mobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="p-4 border-t border-gray-200">
            <nav className="space-y-2 mb-4">
              {navigation.map((item) => (
                <NavLinkItem key={item.name} item={item} />
              ))}
            </nav>
            
            <div className="pt-4 border-t border-gray-200">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-primary-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {user?.firstName} {user?.lastName}
                  </p>
                  <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
                </div>
              </div>
              
              <NavLink
                to="/profile"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors mb-2"
              >
                <User className="w-5 h-5" />
                <span className="text-sm font-medium">Profile</span>
              </NavLink>

              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <LogOut className="w-5 h-5" />
                <span className="text-sm font-medium">Logout</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="max-w-7xl mx-auto p-4 md:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Layout;

