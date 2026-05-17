import axios from 'axios';

const API_BACKEND = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'https://viper-xmd-backend.up.railway.app';

const api = axios.create({
  baseURL: API_BACKEND,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const generatePairing = async (phoneNumber, sessionId) => {
  const response = await api.post('/api/pairing/generate', { phoneNumber, sessionId });
  return response.data;
};

export const checkPairingStatus = async (sessionId) => {
  const response = await api.get(`/api/pairing/status/${sessionId}`);
  return response.data;
};

export const getSession = async (sessionId) => {
  const response = await api.get(`/api/sessions/${sessionId}`);
  return response.data;
};

export const deleteSession = async (sessionId) => {
  const response = await api.delete(`/api/sessions/${sessionId}`);
  return response.data;
};

export const regenerateSession = async (sessionId) => {
  const response = await api.post(`/api/sessions/regenerate/${sessionId}`);
  return response.data;
};

export default api;
