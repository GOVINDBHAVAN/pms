import axios from 'axios';

const BASE = '/api/v1/targets';

function hdrs() {
  const t = localStorage.getItem('pms_token');
  return t ? { Authorization: `Bearer ${t}` } : {};
}

export async function getTargets(params = {}) {
  const { data } = await axios.get(BASE, { headers: hdrs(), params });
  return data;
}

export async function getTarget(id) {
  const { data } = await axios.get(`${BASE}/${id}`, { headers: hdrs() });
  return data;
}

export async function getCascadeContext(cycleId) {
  const { data } = await axios.get(`${BASE}/cascade-context`, {
    headers: hdrs(),
    params: { cycle_id: cycleId },
  });
  return data;
}

export async function getManagerView(cycleId) {
  const { data } = await axios.get(`${BASE}/manager-view`, {
    headers: hdrs(),
    params: { cycle_id: cycleId },
  });
  return data;
}

export async function getLibrary(type) {
  const { data } = await axios.get(`${BASE}/library`, {
    headers: hdrs(),
    params: type ? { type } : {},
  });
  return data;
}

export async function createTarget(payload) {
  const { data } = await axios.post(BASE, payload, { headers: hdrs() });
  return data;
}

export async function updateTarget(id, payload) {
  const { data } = await axios.put(`${BASE}/${id}`, payload, { headers: hdrs() });
  return data;
}

export async function deleteTarget(id) {
  const { data } = await axios.delete(`${BASE}/${id}`, { headers: hdrs() });
  return data;
}

export async function submitTarget(id) {
  const { data } = await axios.post(`${BASE}/${id}/submit`, {}, { headers: hdrs() });
  return data;
}

export async function submitAllTargets(cycleId) {
  const { data } = await axios.post(`${BASE}/submit-all`, { cycle_id: cycleId }, { headers: hdrs() });
  return data;
}

export async function approveTarget(id, payload = {}) {
  const { data } = await axios.post(`${BASE}/${id}/approve`, payload, { headers: hdrs() });
  return data;
}

export async function rejectTarget(id, rejectionNote) {
  const { data } = await axios.post(`${BASE}/${id}/reject`, { rejection_note: rejectionNote }, { headers: hdrs() });
  return data;
}

export async function linkTarget(id, parentTargetId) {
  const { data } = await axios.post(`${BASE}/${id}/link`, { parent_target_id: parentTargetId }, { headers: hdrs() });
  return data;
}
