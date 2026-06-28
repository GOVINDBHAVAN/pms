import axios from 'axios';

const BASE = '/api/v1/cycles';

function hdrs() {
  const t = localStorage.getItem('pms_token');
  return t ? { Authorization: `Bearer ${t}` } : {};
}

export async function getCycles() {
  const { data } = await axios.get(BASE, { headers: hdrs() });
  return data;
}

export async function getActiveCycle() {
  const { data } = await axios.get(`${BASE}/active`, { headers: hdrs() });
  return data;
}

export async function getCycle(id) {
  const { data } = await axios.get(`${BASE}/${id}`, { headers: hdrs() });
  return data;
}

export async function createCycle(payload) {
  const { data } = await axios.post(BASE, payload, { headers: hdrs() });
  return data;
}

export async function updateCycle(id, payload) {
  const { data } = await axios.put(`${BASE}/${id}`, payload, { headers: hdrs() });
  return data;
}

export async function advanceCycle(id) {
  const { data } = await axios.post(`${BASE}/${id}/advance`, {}, { headers: hdrs() });
  return data;
}
