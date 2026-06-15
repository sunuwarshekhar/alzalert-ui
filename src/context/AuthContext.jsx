import { createContext, useContext, useState, useEffect, useMemo } from 'react';

const AuthContext = createContext(null);

export const getPermissions = (role) => {
  const isAdmin = role === 'admin';
  const isCaregiver = role === 'caregiver';
  const isCommunity = role === 'community';

  return {
    isAdmin,
    isCaregiver,
    isCommunity,
    canManagePatients: isAdmin || isCaregiver,
    canCreateAlerts: isAdmin || isCaregiver,
    canManageAlerts: isAdmin || isCaregiver,
    canViewAlerts: true,
    canSubmitSightings: isAdmin || isCaregiver || isCommunity,
    canManageUsers: isAdmin,
    canDeleteSightings: isAdmin || isCaregiver,
    canAccessPath(path) {
      if (path === '/users') return isAdmin;
      if (path.startsWith('/patients')) return isAdmin || isCaregiver;
      return true;
    },
  };
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  const permissions = useMemo(() => getPermissions(user?.role), [user?.role]);

  useEffect(() => {
    const storedToken = localStorage.getItem('alzalert_token');
    const storedUser = localStorage.getItem('alzalert_user');
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = (newToken, newUser) => {
    localStorage.setItem('alzalert_token', newToken);
    localStorage.setItem('alzalert_user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  };

  const logout = () => {
    localStorage.removeItem('alzalert_token');
    localStorage.removeItem('alzalert_user');
    setToken(null);
    setUser(null);
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        logout,
        isAuthenticated: !!token,
        loading,
        ...permissions,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
