import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import InitialsAvatar from '../components/InitialsAvatar';

const MAX_FILE_SIZE = 5 * 1024 * 1024;

const PatientFormPage = () => {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { canAccessPath, isAdmin } = useAuth();

  useEffect(() => {
    if (!canAccessPath('/patients')) {
      navigate('/dashboard');
    }
  }, [canAccessPath, navigate]);

  const [form, setForm] = useState({
    name: '',
    date_of_birth: '',
    medical_notes: '',
    photo_url: '',
    caregiver_id: '',
  });
  const [caregivers, setCaregivers] = useState([]);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [loading, setLoading] = useState(isEdit || isAdmin);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!isAdmin) {
      if (!isEdit) setLoading(false);
      return;
    }

    const fetchCaregivers = async () => {
      try {
        const { data } = await api.get('/api/users');
        setCaregivers(data.filter((u) => u.role === 'caregiver'));
      } catch (err) {
        setApiError(err.response?.data?.error || 'Failed to load caregivers');
      } finally {
        if (!isEdit) setLoading(false);
      }
    };

    fetchCaregivers();
  }, [isAdmin, isEdit]);

  useEffect(() => {
    if (!isEdit) return;

    const fetchPatient = async () => {
      try {
        const { data } = await api.get(`/api/patients/${id}`);
        setForm({
          name: data.name,
          date_of_birth: data.date_of_birth || '',
          medical_notes: data.medical_notes || '',
          photo_url: data.photo_url || '',
          caregiver_id: data.caregiver_id || '',
        });
      } catch (err) {
        setApiError(err.response?.data?.error || 'Failed to load patient');
      } finally {
        setLoading(false);
      }
    };

    fetchPatient();
  }, [id, isEdit]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (!selected) return;

    if (!selected.type.startsWith('image/')) {
      setErrors({ ...errors, file: 'Please select an image file' });
      return;
    }

    if (selected.size > MAX_FILE_SIZE) {
      setErrors({ ...errors, file: 'File must be under 5MB' });
      return;
    }

    setErrors({ ...errors, file: '' });
    setFile(selected);
    setPreview(URL.createObjectURL(selected));
  };

  const uploadPhoto = async () => {
    const { data } = await api.get('/api/upload/presign', {
      params: { filename: file.name, type: file.type },
    });

    if (data.method === 'POST') {
      const form = new FormData();
      form.append('file', file);
      await api.post(data.uploadUrl, form);
    } else {
      const response = await fetch(data.uploadUrl, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': file.type },
      });

      if (!response.ok) {
        throw new Error('Failed to upload photo');
      }
    }

    return data.fileUrl;
  };

  const validate = () => {
    const newErrors = {};
    if (!form.name.trim()) newErrors.name = 'Name is required';
    if (isAdmin && !form.caregiver_id) {
      newErrors.caregiver_id = 'Caregiver is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError('');
    if (!validate()) return;

    setSubmitting(true);
    try {
      let photoUrl = form.photo_url;

      if (file) {
        setUploading(true);
        try {
          photoUrl = await uploadPhoto();
        } catch {
          setApiError('Photo upload failed. Please try again.');
          return;
        } finally {
          setUploading(false);
        }
      }

      const payload = {
        name: form.name,
        date_of_birth: form.date_of_birth || null,
        medical_notes: form.medical_notes || null,
        photo_url: photoUrl || null,
      };

      if (isAdmin) {
        payload.caregiver_id = form.caregiver_id;
      }

      if (isEdit) {
        await api.put(`/api/patients/${id}`, payload);
      } else {
        await api.post('/api/patients', payload);
      }

      navigate('/patients');
    } catch (err) {
      setApiError(err.response?.data?.error || 'Failed to save patient');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex justify-center py-20">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    );
  }

  const displayPhoto = preview || form.photo_url;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">
          {isEdit ? 'Edit Patient' : 'Add Patient'}
        </h1>

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-4">
          {displayPhoto && (
            <div className="flex justify-center mb-4">
              <InitialsAvatar name={form.name} photoUrl={displayPhoto} size={80} />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
          </div>

          {isAdmin && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Caregiver *</label>
              <select
                name="caregiver_id"
                value={form.caregiver_id}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select a caregiver</option>
                {caregivers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              {errors.caregiver_id && (
                <p className="mt-1 text-sm text-red-600">{errors.caregiver_id}</p>
              )}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
            <input
              type="date"
              name="date_of_birth"
              value={form.date_of_birth}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Medical Notes</label>
            <textarea
              name="medical_notes"
              value={form.medical_notes}
              onChange={handleChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Photo</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            {errors.file && <p className="mt-1 text-sm text-red-600">{errors.file}</p>}
            {uploading && (
              <div className="mt-2 flex items-center gap-2 text-sm text-blue-600">
                <LoadingSpinner size="sm" />
                Uploading photo...
              </div>
            )}
          </div>

          <ErrorMessage message={apiError} />

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={submitting || uploading}
              className="flex items-center gap-2 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {(submitting || uploading) && <LoadingSpinner size="sm" />}
              {isEdit ? 'Update Patient' : 'Create Patient'}
            </button>
            <Link
              to="/patients"
              className="py-2 px-4 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PatientFormPage;
