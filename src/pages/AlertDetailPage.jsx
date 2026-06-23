import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api';
import Navbar from '../components/Navbar';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import InitialsAvatar from '../components/InitialsAvatar';
import { useAuth } from '../context/AuthContext';
import { MAX_IMAGE_SIZE, uploadImage } from '../utils/uploadImage';

const MAX_SIGHTING_IMAGES = 3;

const AlertDetailPage = () => {
  const { id } = useParams();
  const { canManageAlerts, canSubmitSightings, canDeleteSightings } = useAuth();
  const [alert, setAlert] = useState(null);
  const [sightings, setSightings] = useState([]);
  const [form, setForm] = useState({ location_text: '', notes: '' });
  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [error, setError] = useState('');
  const [formError, setFormError] = useState('');

  const fetchData = async () => {
    try {
      const [alertRes, sightingsRes] = await Promise.all([
        api.get(`/api/alerts/${id}`),
        api.get('/api/sightings', { params: { alert_id: id } }),
      ]);
      setAlert(alertRes.data);
      setSightings(sightingsRes.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load alert');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const validate = () => {
    const newErrors = {};
    if (!form.location_text.trim()) newErrors.location_text = 'Location is required';
    if (imageFiles.length > MAX_SIGHTING_IMAGES) {
      newErrors.images = `You can upload at most ${MAX_SIGHTING_IMAGES} images`;
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleImageChange = (e) => {
    const selected = Array.from(e.target.files || []);
    e.target.value = '';

    if (!selected.length) return;

    const remaining = MAX_SIGHTING_IMAGES - imageFiles.length;
    if (remaining <= 0) {
      setErrors({ ...errors, images: `You can upload at most ${MAX_SIGHTING_IMAGES} images` });
      return;
    }

    const nextFiles = [];
    const nextPreviews = [];

    for (const file of selected.slice(0, remaining)) {
      if (!file.type.startsWith('image/')) {
        setErrors({ ...errors, images: 'Please select image files only' });
        return;
      }
      if (file.size > MAX_IMAGE_SIZE) {
        setErrors({ ...errors, images: 'Each image must be under 5MB' });
        return;
      }
      nextFiles.push(file);
      nextPreviews.push(URL.createObjectURL(file));
    }

    setErrors({ ...errors, images: '' });
    setImageFiles([...imageFiles, ...nextFiles]);
    setImagePreviews([...imagePreviews, ...nextPreviews]);
  };

  const removeImage = (index) => {
    URL.revokeObjectURL(imagePreviews[index]);
    setImageFiles(imageFiles.filter((_, i) => i !== index));
    setImagePreviews(imagePreviews.filter((_, i) => i !== index));
    setErrors({ ...errors, images: '' });
  };

  const resetSightingForm = () => {
    imagePreviews.forEach((url) => URL.revokeObjectURL(url));
    setForm({ location_text: '', notes: '' });
    setImageFiles([]);
    setImagePreviews([]);
    setErrors({});
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!validate()) return;

    setSubmitting(true);
    try {
      let imageUrls = [];

      if (imageFiles.length > 0) {
        setUploading(true);
        try {
          imageUrls = await Promise.all(imageFiles.map((file) => uploadImage(file)));
        } catch {
          setFormError('Image upload failed. Please try again.');
          return;
        } finally {
          setUploading(false);
        }
      }

      const { data } = await api.post('/api/sightings', {
        alert_id: id,
        location_text: form.location_text,
        notes: form.notes,
        image_urls: imageUrls,
      });
      setSightings([data, ...sightings]);
      resetSightingForm();
    } catch (err) {
      setFormError(err.response?.data?.error || 'Failed to add sighting');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResolve = async () => {
    if (!window.confirm('Mark this alert as resolved?')) return;
    setResolving(true);
    try {
      const { data } = await api.put(`/api/alerts/${id}`, { status: 'resolved' });
      setAlert(data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to resolve alert');
    } finally {
      setResolving(false);
    }
  };

  const handleDeleteSighting = async (sightingId) => {
    if (!window.confirm('Delete this sighting?')) return;
    try {
      await api.delete(`/api/sightings/${sightingId}`);
      setSightings(sightings.filter((s) => s.id !== sightingId));
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete sighting');
    }
  };

  const formatDate = (date) =>
    new Date(date).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

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

  if (error && !alert) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <ErrorMessage message={error} />
          <Link to="/alerts" className="text-blue-600 hover:underline mt-4 inline-block">
            Back to Alerts
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Link to="/alerts" className="text-sm text-blue-600 hover:underline mb-4 inline-block">
          &larr; Back to Alerts
        </Link>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <InitialsAvatar
                name={alert.patient?.name}
                photoUrl={alert.patient?.photo_url}
                size={64}
              />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {alert.patient?.name || 'Unknown Patient'}
                </h1>
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize mt-2 ${
                    alert.status === 'active'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-green-100 text-green-800'
                  }`}
                >
                  {alert.status}
                </span>
                <p className="text-gray-600 mt-2">
                  <span className="font-medium">Description:</span>{' '}
                  {alert.description || 'No description provided'}
                </p>
                <p className="text-gray-500 text-sm mt-1">
                  Alert created {formatDate(alert.created_at)}
                </p>
              </div>
            </div>
            {canManageAlerts && alert.status === 'active' && (
              <button
                onClick={handleResolve}
                disabled={resolving}
                className="flex items-center gap-2 shrink-0 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:opacity-50 transition-colors text-sm"
              >
                {resolving && <LoadingSpinner size="sm" />}
                Resolve Alert
              </button>
            )}
          </div>
        </div>

        <ErrorMessage message={error} />

        <div className="bg-white rounded-lg shadow mb-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Sightings</h2>
          </div>
          {sightings.length === 0 ? (
            <p className="px-6 py-8 text-gray-500 text-center">No sightings reported yet</p>
          ) : (
            <ul className="divide-y divide-gray-200">
              {sightings.map((sighting) => (
                <li key={sighting.id} className="px-6 py-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-gray-900">{sighting.location_text}</p>
                      {sighting.notes && (
                        <p className="text-gray-600 text-sm mt-1">{sighting.notes}</p>
                      )}
                      {sighting.image_urls?.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-3">
                          {sighting.image_urls.map((url, index) => (
                            <a
                              key={`${sighting.id}-${index}`}
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block"
                            >
                              <img
                                src={url}
                                alt={`Sighting ${index + 1}`}
                                className="h-20 w-20 rounded-md object-cover border border-gray-200 hover:opacity-90"
                              />
                            </a>
                          ))}
                        </div>
                      )}
                      <p className="text-gray-400 text-xs mt-1">
                        Reported by {sighting.reporter?.name || 'Unknown'} &middot;{' '}
                        {formatDate(sighting.created_at)}
                      </p>
                    </div>
                    {canDeleteSightings && (
                      <button
                        onClick={() => handleDeleteSighting(sighting.id)}
                        className="text-red-600 hover:underline text-sm shrink-0"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {alert.status === 'active' && canSubmitSightings && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Report a Sighting</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Location *
                </label>
                <input
                  value={form.location_text}
                  onChange={(e) => setForm({ ...form, location_text: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Where did you see them?"
                />
                {errors.location_text && (
                  <p className="mt-1 text-sm text-red-600">{errors.location_text}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Additional details..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Photos (optional, up to {MAX_SIGHTING_IMAGES})
                </label>
                <p className="text-xs text-gray-500 mb-2">
                  Upload images of the person or location where they were last seen.
                </p>
                {imagePreviews.length > 0 && (
                  <div className="flex flex-wrap gap-3 mb-3">
                    {imagePreviews.map((preview, index) => (
                      <div key={preview} className="relative">
                        <img
                          src={preview}
                          alt={`Upload preview ${index + 1}`}
                          className="h-20 w-20 rounded-md object-cover border border-gray-200"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-red-600 text-white text-xs leading-none hover:bg-red-700"
                          aria-label="Remove image"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                {imageFiles.length < MAX_SIGHTING_IMAGES && (
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageChange}
                    className="block w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                )}
                {errors.images && (
                  <p className="mt-1 text-sm text-red-600">{errors.images}</p>
                )}
              </div>
              <ErrorMessage message={formError} />
              <button
                type="submit"
                disabled={submitting || uploading}
                className="flex items-center gap-2 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {(submitting || uploading) && <LoadingSpinner size="sm" />}
                {uploading ? 'Uploading images...' : 'Submit Sighting'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default AlertDetailPage;
