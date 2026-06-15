import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import Navbar from '../components/Navbar';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import { useAuth } from '../context/AuthContext';

const StatusBadge = ({ status }) => (
  <span
    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
      status === 'active' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
    }`}
  >
    {status}
  </span>
);

const AlertsPage = () => {
  const { canCreateAlerts } = useAuth();
  const [alerts, setAlerts] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ patient_id: '', last_seen_location: '' });
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const requests = [api.get('/api/alerts')];
        if (canCreateAlerts) {
          requests.push(api.get('/api/patients'));
        }
        const [alertsRes, patientsRes] = await Promise.all(requests);
        setAlerts(alertsRes.data);
        if (patientsRes) setPatients(patientsRes.data);
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to load alerts');
      } finally {
        setLoading(false);
      }
    };

    fetchAlerts();
  }, [canCreateAlerts]);

  const formatDate = (date) =>
    new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

  const validate = () => {
    const newErrors = {};
    if (!form.patient_id) newErrors.patient_id = 'Patient is required';
    if (!form.last_seen_location.trim()) newErrors.last_seen_location = 'Last seen location is required';
    setFormErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCreateAlert = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      const { data } = await api.post('/api/alerts', form);
      setAlerts([data, ...alerts]);
      setForm({ patient_id: '', last_seen_location: '' });
      setShowForm(false);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create alert');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Alerts</h1>
          {canCreateAlerts && (
            <button
              onClick={() => setShowForm(!showForm)}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              {showForm ? 'Cancel' : 'Create Alert'}
            </button>
          )}
        </div>

        {showForm && canCreateAlerts && (
          <form
            onSubmit={handleCreateAlert}
            className="bg-white rounded-lg shadow p-6 mb-6 space-y-4"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Patient *</label>
                <select
                  value={form.patient_id}
                  onChange={(e) => setForm({ ...form, patient_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select a patient</option>
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
                {formErrors.patient_id && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.patient_id}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Last Seen Location *
                </label>
                <input
                  value={form.last_seen_location}
                  onChange={(e) => setForm({ ...form, last_seen_location: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. Thamel, Kathmandu"
                />
                {formErrors.last_seen_location && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.last_seen_location}</p>
                )}
              </div>
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {submitting && <LoadingSpinner size="sm" />}
              Create Alert
            </button>
          </form>
        )}

        {loading && (
          <div className="flex justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        )}

        <ErrorMessage message={error} />

        {!loading && !error && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            {alerts.length === 0 ? (
              <p className="px-6 py-8 text-gray-500 text-center">No alerts found</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-gray-600">
                    <tr>
                      <th className="px-6 py-3 text-left font-medium">Patient</th>
                      <th className="px-6 py-3 text-left font-medium">Status</th>
                      <th className="px-6 py-3 text-left font-medium">Last Seen</th>
                      <th className="px-6 py-3 text-left font-medium">Created</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {alerts.map((alert) => (
                      <tr key={alert.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <Link
                            to={`/alerts/${alert.id}`}
                            className="text-blue-600 hover:underline font-medium"
                          >
                            {alert.patient?.name || 'Unknown'}
                          </Link>
                        </td>
                        <td className="px-6 py-4">
                          <StatusBadge status={alert.status} />
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
        )}
      </div>
    </div>
  );
};

export default AlertsPage;
