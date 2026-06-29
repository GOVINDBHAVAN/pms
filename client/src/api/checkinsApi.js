import axios from 'axios';

const BASE = '/api/v1/checkins';

function hdrs() {
  const t = localStorage.getItem('pms_token');
  return t ? { Authorization: `Bearer ${t}` } : {};
}

export async function getCheckins(targetId) {
  const { data } = await axios.get(BASE, { headers: hdrs(), params: { target_id: targetId } });
  return data;
}

export async function getPendingCheckins() {
  const { data } = await axios.get(`${BASE}/pending`, { headers: hdrs() });
  return data;
}

export async function createCheckin(payload) {
  const { data } = await axios.post(BASE, payload, { headers: hdrs() });
  return data;
}

export async function acknowledgeCheckin(id) {
  const { data } = await axios.patch(`${BASE}/${id}/acknowledge`, {}, { headers: hdrs() });
  return data;
}
