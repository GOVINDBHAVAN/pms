import axios from 'axios';

const BASE = '/api/v1/employees';

function hdrs() {
  const t = localStorage.getItem('pms_token');
  return t ? { Authorization: `Bearer ${t}` } : {};
}

export async function getEmployees(params = {}) {
  const { data } = await axios.get(BASE, { params, headers: hdrs() });
  return data;
}

export async function getEmployee(id) {
  const { data } = await axios.get(`${BASE}/${id}`, { headers: hdrs() });
  return data;
}

export async function createEmployee(payload) {
  const { data } = await axios.post(BASE, payload, { headers: hdrs() });
  return data;
}

export async function updateEmployee(id, payload) {
  const { data } = await axios.put(`${BASE}/${id}`, payload, { headers: hdrs() });
  return data;
}

export async function getHierarchyChain(id) {
  const { data } = await axios.get(`${BASE}/${id}/hierarchy-chain`, { headers: hdrs() });
  return data;
}

export async function getDirectReportees(id) {
  const { data } = await axios.get(`${BASE}/${id}/direct-reportees`, { headers: hdrs() });
  return data;
}

export async function getFullReportees(id) {
  const { data } = await axios.get(`${BASE}/${id}/reportees`, { headers: hdrs() });
  return data;
}
