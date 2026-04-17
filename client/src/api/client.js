const API_URL = import.meta.env.VITE_API_URL;

/**
 * Configured fetch wrapper. Replaces Axios.
 * Automatically attaches JWT token and handles JSON.
 */
const api = async (path, options = {}) => {
  const token = localStorage.getItem('token');
  
  const headers = { ...options.headers };
  
  // Only set Content-Type to JSON if body is not FormData
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });

  // Handle 401 globally — expired token
  if (res.status === 401) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
    throw new Error('Session expired');
  }

  // Handle 402 globally — insufficient credits
  if (res.status === 402) {
    window.location.href = '/credits';
    throw new Error('Insufficient credits');
  }

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    const error = new Error(data?.error || 'Something went wrong');
    error.status = res.status;
    error.data = data;
    throw error;
  }

  return data;
};

export default api;
