import axios from 'axios';

export const api = axios.create({
  baseURL: '/api',
});

// Add request interceptor to include auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid, redirect to login
      localStorage.removeItem('auth_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export async function getRefs() {
  const { data } = await api.get('/products/refs/all');
  return data;
}

export async function createProduct(body: any) {
  try {
    console.log('API: Creating product with data:', body);
    const { data } = await api.post('/products', body);
    console.log('API: Product created successfully:', data);
    return data;
  } catch (error) {
    console.error('API: Error creating product:', error);
    throw error;
  }
}

export async function listProducts(q?: string) {
  const { data } = await api.get('/products', { params: { q } });
  return data;
}

export async function createVideo(body: any) {
  const { data } = await api.post('/videos', body);
  return data;
}

export async function listVideos(status?: string) {
  const { data } = await api.get('/videos', { params: { status } });
  return data;
}

export async function listScripts(params: any) {
  const { data } = await api.get('/scripts', { params });
  return data;
}

export async function updateScript(id: number, body: any) {
  const { data } = await api.put(`/scripts/${id}`, body);
  return data;
}

export async function deleteScript(id: number) {
  const { data } = await api.delete(`/scripts/${id}`);
  return data;
}

export async function listPublished() {
  const { data } = await api.get('/published-videos');
  return data;
}

export async function upsertAnalytics(body: any) {
  const { data } = await api.post('/analytics/upsert', body);
  return data;
}

export async function getAnalytics() {
  const { data } = await api.get('/analytics');
  return data;
}

export const webhook = axios.create({ baseURL: '/webhook' });

export async function saveVideoReferences(videoId: number, ids: number[]) {
  const { data } = await api.put(`/video-references/${videoId}`, { reference_product_ids: ids });
  return data;
}

export async function uploadImages(files: FileList) {
  const formData = new FormData();
  Array.from(files).forEach(file => {
    formData.append('images', file);
  });
  
  const { data } = await api.post('/upload/images', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return data;
}


