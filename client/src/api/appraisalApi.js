import axios from 'axios';

const BASE = '/api/v1/appraisal';

function hdrs() {
  const t = localStorage.getItem('pms_token');
  return t ? { Authorization: `Bearer ${t}` } : {};
}

// GET /appraisal/cycles/:cycleId/self
// Returns { cycle, targets, orgSettings } for the self-appraisal page.
export async function getSelfAppraisal(cycleId) {
  const { data } = await axios.get(`${BASE}/cycles/${cycleId}/self`, { headers: hdrs() });
  return data;
}

// POST /appraisal/cycles/:cycleId/targets/:id/self-rate
// Save self_rating, self_comment, actual_value for one target.
export async function selfRate(cycleId, targetId, payload) {
  const { data } = await axios.post(
    `${BASE}/cycles/${cycleId}/targets/${targetId}/self-rate`,
    payload,
    { headers: hdrs() }
  );
  return data;
}

// GET /appraisal/cycles/:cycleId/team
// Returns { cycle, orgSettings, reportees: [{ employee, targets, priorSummary }] }
export async function getTeamAppraisal(cycleId) {
  const { data } = await axios.get(`${BASE}/cycles/${cycleId}/team`, { headers: hdrs() });
  return data;
}

// POST /appraisal/cycles/:cycleId/employees/:empId/targets/:targetId/manager-rate
// Save manager_rating and manager_comment for one of a direct report's targets.
export async function managerRate(cycleId, empId, targetId, payload) {
  const { data } = await axios.post(
    `${BASE}/cycles/${cycleId}/employees/${empId}/targets/${targetId}/manager-rate`,
    payload,
    { headers: hdrs() }
  );
  return data;
}
