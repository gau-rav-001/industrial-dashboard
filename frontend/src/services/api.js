import axios from 'axios';

// Use env variable in production, proxy in development
const API_BASE = process.env.REACT_APP_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE,
  timeout: 60000,
});

const retry = async (fn, retries = 3, delay = 1000) => {
  try {
    return await fn();
  } catch (err) {
    if (retries === 0) throw err;
    const isRetryable = !err.response || err.code === 'ECONNABORTED' || (err.response?.status >= 500);
    if (!isRetryable) throw err;
    await new Promise(res => setTimeout(res, delay));
    return retry(fn, retries - 1, delay * 1.5);
  }
};

api.interceptors.response.use(
  (res) => res.data,
  (err) => {
    const message = err.code === 'ECONNABORTED'
      ? 'Request timed out — server may be waking up, please wait...'
      : err.response?.data?.error || err.message || 'API Error';
    return Promise.reject(new Error(message));
  }
);

export const machineService = {
  getAll:     (params = {}) => retry(() => api.get('/machines', { params })),
  getById:    (id)          => retry(() => api.get(`/machines/${id}`)),
  getSummary: ()            => retry(() => api.get('/machines/status/summary')),
  getTrends:  (params = {}) => retry(() => api.get('/machines/analytics/trends', { params })),
};

export default api;
