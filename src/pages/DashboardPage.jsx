import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import Navbar from '../components/Navbar';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import InitialsAvatar from '../components/InitialsAvatar';
import { useAuth } from '../context/AuthContext';

const DashboardPage = () => {
  const { canManagePatients } = useAuth();
  const [patients, setPatients] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [sightings, setSightings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const requests = [api.get('/api/alerts')];
        if (canManagePatients) {
          requests.unshift(api.get('/api/patients'));
        }

        const results = await Promise.all(requests);
        const patientsRes = canManagePatients ? results[0] : { data: [] };
        const alertsRes = canManagePatients ? results[1] : results[0];

        setPatients(patientsRes.data);
        setAlerts(alertsRes.data);

        const activeAlerts = alertsRes.data.filter((a) => a.status === 'active');
        const sightingPromises = activeAlerts.map((a) =>
          api.get('/api/sightings', { params: { alert_id: a.id } }).catch(() => ({ data: [] }))
        );
        const sightingResults = await Promise.all(sightingPromises);
        setSightings(sightingResults.flatMap((r) => r.data));
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [canManagePatients]);

  const activeAlerts = alerts.filter((a) => a.status === 'active');
  const today = new Date().toDateString();
  const sightingsToday = sightings.filter(
    (s) => new Date(s.created_at).toDateString() === today
  ).length;

  const formatDate = (date) =>
    new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>

        {loading && (
          <div className="flex justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        )}

        <ErrorMessage message={error} />

        {!loading && !error && (
          <>
            <div className={`grid grid-cols-1 gap-6 mb-8 ${canManagePatients ? 'md:grid-cols-3' : 'md:grid-cols-2'}`}>
              {canManagePatients && (
                <div className="bg-white rounded-lg shadow p-6">
                  <p className="text-sm text-gray-500">Total Patients</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{patients.length}</p>
                </div>
              )}
              <div className="bg-white rounded-lg shadow p-6">
                <p className="text-sm text-gray-500">Active Alerts</p>
                <p className="text-3xl font-bold text-red-600 mt-1">{activeAlerts.length}</p>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <p className="text-sm text-gray-500">Sightings Today</p>
                <p className="text-3xl font-bold text-blue-600 mt-1">{sightingsToday}</p>
              </div>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Active Alerts</h2>
              {activeAlerts.length === 0 ? (
                <div className="bg-white rounded-lg shadow px-6 py-8">
                  <p className="text-gray-500 text-center">No active alerts</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {activeAlerts.map((alert) => (
                    <Link
                      key={alert.id}
                      to={`/alerts/${alert.id}`}
                      className="bg-white rounded-lg shadow hover:shadow-md transition-shadow p-5 flex flex-col"
                    >
                      <div className="flex items-start gap-4">
                        <InitialsAvatar
                          name={alert.patient?.name}
                          photoUrl={alert.patient?.photo_url}
                          size={64}
                        />
                        <div className="min-w-0 flex-1">
                          <h3 className="text-lg font-semibold text-gray-900 truncate">
                            {alert.patient?.name || 'Unknown'}
                          </h3>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize mt-1 bg-red-100 text-red-800">
                            active
                          </span>
                        </div>
                      </div>
                      {alert.description && (
                        <p className="mt-3 text-sm text-gray-600 line-clamp-3">{alert.description}</p>
                      )}
                      <p className="mt-auto pt-3 text-xs text-gray-500">
                        Created {formatDate(alert.created_at)}
                      </p>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;
