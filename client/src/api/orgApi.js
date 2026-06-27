import axios from 'axios';

const BASE = '/api/v1/org';

function getHeaders() {
  const token = localStorage.getItem('pms_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function getOrgSettings() {
  const { data } = await axios.get(`${BASE}/settings`, { headers: getHeaders() });
  return data;
}

export async function updateOrgSettings(payload) {
  const { data } = await axios.put(`${BASE}/settings`, payload, { headers: getHeaders() });
  return data;
}

export async function getFrameworkPresets() {
  const { data } = await axios.get(`${BASE}/framework-presets`, { headers: getHeaders() });
  return data;
}

export async function getGrades() {
  const { data } = await axios.get(`${BASE}/grades`, { headers: getHeaders() });
  return data;
}

export async function getDepartments() {
  const { data } = await axios.get(`${BASE}/departments`, { headers: getHeaders() });
  return data;
}

export async function getLibrary() {
  const { data } = await axios.get(`${BASE}/library`, { headers: getHeaders() });
  return data;
}
