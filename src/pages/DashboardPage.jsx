import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import Navbar from '../components/Navbar';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
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
    new Date(date).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
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

            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Active Alerts</h2>
              </div>
              {activeAlerts.length === 0 ? (
                <p className="px-6 py-8 text-gray-500 text-center">No active alerts</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 text-gray-600">
                      <tr>
                        <th className="px-6 py-3 text-left font-medium">Patient</th>
                        <th className="px-6 py-3 text-left font-medium">Last Seen</th>
                        <th className="px-6 py-3 text-left font-medium">Created</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {activeAlerts.map((alert) => (
                        <tr key={alert.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <Link
                              to={`/alerts/${alert.id}`}
                              className="text-blue-600 hover:underline font-medium"
                            >
                              {alert.patient?.name || 'Unknown'}
                            </Link>
                          </td>
                          <td className="px-6 py-4 text-gray-700">
                            {alert.last_seen_location || '—'}
                          </td>
                          <td className="px-6 py-4 text-gray-500">
                            {formatDate(alert.created_at)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
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
