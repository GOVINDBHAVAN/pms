import axios from 'axios';

const BASE = '/api/v1';

function getHeaders() {
  const token = localStorage.getItem('pms_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function login(email, password) {
  const { data } = await axios.post(`${BASE}/auth/login`, { email, password });
  return data;
}

export async function getMe() {
  const { data } = await axios.get(`${BASE}/auth/me`, { headers: getHeaders() });
  return data;
}

export async function logout() {
  await axios.post(`${BASE}/auth/logout`, {}, { headers: getHeaders() });
}
