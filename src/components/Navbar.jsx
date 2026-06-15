import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const navLinks = [
  { path: '/dashboard', label: 'Dashboard' },
  { path: '/patients', label: 'Patients' },
  { path: '/alerts', label: 'Alerts' },
  { path: '/users', label: 'Users' },
];

const roleBadgeColor = {
  admin: 'bg-purple-100 text-purple-800',
  caregiver: 'bg-blue-100 text-blue-800',
  community: 'bg-green-100 text-green-800',
};

const Navbar = () => {
  const { user, logout, canAccessPath } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const visibleLinks = navLinks.filter((link) => canAccessPath(link.path));

  return (
    <nav className="bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-8">
            <Link to="/dashboard" className="text-xl font-bold text-blue-600">
              AlzAlert
            </Link>
            <div className="flex gap-4">
              {visibleLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className="text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-700">{user?.name}</span>
            <span
              className={`text-xs font-medium px-2 py-1 rounded-full capitalize ${roleBadgeColor[user?.role] || 'bg-gray-100 text-gray-800'}`}
            >
              {user?.role}
            </span>
            <button
              onClick={handleLogout}
              className="text-sm font-medium text-gray-600 hover:text-red-600 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
