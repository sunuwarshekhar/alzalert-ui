import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api';
import Navbar from '../components/Navbar';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import InitialsAvatar from '../components/InitialsAvatar';
import { useAuth } from '../context/AuthContext';

const PatientsPage = () => {
  const { canManagePatients, canAccessPath } = useAuth();
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!canAccessPath('/patients')) {
      navigate('/dashboard');
      return;
    }

    const fetchPatients = async () => {
      try {
        const { data } = await api.get('/api/patients');
        setPatients(data);
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to load patients');
      } finally {
        setLoading(false);
      }
    };

    fetchPatients();
  }, [canAccessPath, navigate]);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this patient?')) return;
    try {
      await api.delete(`/api/patients/${id}`);
      setPatients(patients.filter((p) => p.id !== id));
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete patient');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Patients</h1>
          {canManagePatients && (
            <Link
              to="/patients/new"
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              Add Patient
            </Link>
          )}
        </div>

        {loading && (
          <div className="flex justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        )}

        <ErrorMessage message={error} />

        {!loading && !error && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            {patients.length === 0 ? (
              <p className="px-6 py-8 text-gray-500 text-center">No patients found</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-gray-600">
                    <tr>
                      <th className="px-6 py-3 text-left font-medium">Photo</th>
                      <th className="px-6 py-3 text-left font-medium">Name</th>
                      <th className="px-6 py-3 text-left font-medium">Date of Birth</th>
                      <th className="px-6 py-3 text-left font-medium">Caregiver</th>
                      {canManagePatients && (
                        <th className="px-6 py-3 text-left font-medium">Actions</th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {patients.map((patient) => (
                      <tr key={patient.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <InitialsAvatar
                            name={patient.name}
                            photoUrl={patient.photo_url}
                            size={40}
                          />
                        </td>
                        <td className="px-6 py-4 font-medium text-gray-900">{patient.name}</td>
                        <td className="px-6 py-4 text-gray-700">
                          {patient.date_of_birth || '—'}
                        </td>
                        <td className="px-6 py-4 text-gray-700">
                          {patient.caregiver?.name || '—'}
                        </td>
                        {canManagePatients && (
                          <td className="px-6 py-4">
                            <div className="flex gap-3">
                              <Link
                                to={`/patients/${patient.id}/edit`}
                                className="text-blue-600 hover:underline"
                              >
                                Edit
                              </Link>
                              <button
                                onClick={() => handleDelete(patient.id)}
                                className="text-red-600 hover:underline"
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        )}
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

export default PatientsPage;
