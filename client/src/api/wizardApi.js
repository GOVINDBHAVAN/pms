import axios from 'axios';

const BASE = '/api/v1/wizard';

function getHeaders() {
  const token = localStorage.getItem('pms_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function startWizard(payload) {
  const { data } = await axios.post(`${BASE}/start`, payload);
  return data;
}

export async function getWizardStatus() {
  const { data } = await axios.get(`${BASE}/status`, { headers: getHeaders() });
  return data;
}

export async function saveStep(stepName, stepData) {
  const { data } = await axios.post(`${BASE}/step/${stepName}`, stepData, { headers: getHeaders() });
  return data;
}

export async function getStep(stepName) {
  const { data } = await axios.get(`${BASE}/step/${stepName}`, { headers: getHeaders() });
  return data;
}

export async function importEmployees(file) {
  const form = new FormData();
  form.append('file', file);
  const { data } = await axios.post(`${BASE}/import-employees`, form, {
    headers: { ...getHeaders(), 'Content-Type': 'multipart/form-data' },
  });
  return data;
}

export async function completeWizard() {
  const { data } = await axios.post(`${BASE}/complete`, {}, { headers: getHeaders() });
  return data;
}

export async function getPresets() {
  const { data } = await axios.get(`${BASE}/presets`);
  return data;
}
