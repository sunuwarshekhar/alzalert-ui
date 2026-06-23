import api from '../api';

export const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

export const uploadImage = async (file) => {
  const { data } = await api.get('/api/upload/presign', {
    params: { filename: file.name, type: file.type },
  });

  if (data.method === 'POST') {
    const formData = new FormData();
    formData.append('file', file);
    await api.post(data.uploadUrl, formData);
  } else {
    const response = await fetch(data.uploadUrl, {
      method: 'PUT',
      body: file,
      headers: { 'Content-Type': file.type },
    });

    if (!response.ok) {
      throw new Error('Failed to upload image');
    }
  }

  return data.fileUrl;
};
