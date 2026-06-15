import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import PatientsPage from './pages/PatientsPage';
import PatientFormPage from './pages/PatientFormPage';
import AlertsPage from './pages/AlertsPage';
import AlertDetailPage from './pages/AlertDetailPage';
import UsersPage from './pages/UsersPage';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <DashboardPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/patients"
            element={
              <PrivateRoute>
                <PatientsPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/patients/new"
            element={
              <PrivateRoute>
                <PatientFormPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/patients/:id/edit"
            element={
              <PrivateRoute>
                <PatientFormPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/alerts"
            element={
              <PrivateRoute>
                <AlertsPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/alerts/:id"
            element={
              <PrivateRoute>
                <AlertDetailPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/users"
            element={
              <PrivateRoute>
                <UsersPage />
              </PrivateRoute>
            }
          />

          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
