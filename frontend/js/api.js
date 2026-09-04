const BASE_URL = window.location.origin.includes('localhost') || window.location.origin.includes('127.0.0.1')
  ? `${window.location.origin}/api`
  : 'http://localhost:8000/api';

window.PayFixorAPI = {
  async getOverviewKPIs() {
    const res = await fetch(`${BASE_URL}/analytics/overview`);
    if (!res.ok) throw new Error('Failed to fetch overview KPIs');
    return res.json();
  },

  async getAgentActivity() {
    const res = await fetch(`${BASE_URL}/analytics/agent-activity`);
    if (!res.ok) throw new Error('Failed to fetch agent activity');
    return res.json();
  },

  async getAuditLogs(params = {}) {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${BASE_URL}/analytics/audit-logs?${query}`);
    if (!res.ok) throw new Error('Failed to fetch audit logs');
    return res.json();
  },

  async getPolicies() {
    const res = await fetch(`${BASE_URL}/analytics/policies`);
    if (!res.ok) throw new Error('Failed to fetch policies');
    return res.json();
  },

  async updatePolicy(name, data) {
    const res = await fetch(`${BASE_URL}/analytics/policies/${name}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to update policy');
    return res.json();
  },

  async getIncidents(status = null) {
    const url = status ? `${BASE_URL}/incidents/?status=${status}` : `${BASE_URL}/incidents/`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch incidents');
    return res.json();
  },

  async getIncidentDetails(incidentId) {
    const res = await fetch(`${BASE_URL}/incidents/${incidentId}`);
    if (!res.ok) throw new Error('Failed to fetch incident details');
    return res.json();
  },

  async scanIncidents(lookbackHours = 12, minSampleSize = 15) {
    const res = await fetch(`${BASE_URL}/incidents/scan?lookback_hours=${lookbackHours}&min_sample_size=${minSampleSize}`, {
      method: 'POST'
    });
    if (!res.ok) throw new Error('Failed to run incident scan');
    return res.json();
  },

  async investigateIncident(incidentId) {
    const res = await fetch(`${BASE_URL}/incidents/${incidentId}/investigate`, {
      method: 'POST'
    });
    if (!res.ok) throw new Error('Failed to run AI investigation');
    return res.json();
  },

  async updateIncidentStatus(incidentId, status, notes = '') {
    const res = await fetch(`${BASE_URL}/incidents/${incidentId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, notes })
    });
    if (!res.ok) throw new Error('Failed to update incident status');
    return res.json();
  },

  async triggerRecoveryBatch(incidentId, forceOverride = false) {
    const res = await fetch(`${BASE_URL}/recovery/trigger-batch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ incident_id: incidentId, force_override_policy: forceOverride })
    });
    if (!res.ok) throw new Error('Failed to trigger recovery batch');
    return res.json();
  },

  async listRecoveryActions(incidentId = null, status = null) {
    let url = `${BASE_URL}/recovery/actions?limit=200`;
    if (incidentId) url += `&incident_id=${incidentId}`;
    if (status) url += `&status=${status}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch recovery actions');
    return res.json();
  },

  async getExperimentResults(incidentId) {
    const res = await fetch(`${BASE_URL}/recovery/experiments/${incidentId}`);
    if (!res.ok) throw new Error('Failed to fetch experiment results');
    return res.json();
  },

  async simulateCustomerRecovery(actionId) {
    const res = await fetch(`${BASE_URL}/recovery/simulate-customer-recovery/${actionId}`, {
      method: 'POST'
    });
    if (!res.ok) throw new Error('Failed to simulate customer recovery');
    return res.json();
  },

  async listPayments(limit = 100) {
    const res = await fetch(`${BASE_URL}/payments/?limit=${limit}`);
    if (!res.ok) throw new Error('Failed to fetch payments');
    return res.json();
  },

  async listCustomers(complaintStatus = null) {
    const url = complaintStatus ? `${BASE_URL}/payments/customers?complaint_status=${complaintStatus}` : `${BASE_URL}/payments/customers`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch customers');
    return res.json();
  },

  async updateCustomerStatus(customerId, status, reason = '') {
    const res = await fetch(`${BASE_URL}/payments/customers/${customerId}/status?status=${status}&reason=${encodeURIComponent(reason)}`, {
      method: 'PATCH'
    });
    if (!res.ok) throw new Error('Failed to update customer status');
    return res.json();
  },

  async seedSyntheticData(params = {}) {
    const res = await fetch(`${BASE_URL}/payments/seed-synthetic`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        num_transactions: params.num_transactions || 500,
        inject_incident: params.inject_incident !== false,
        incident_segment: params.incident_segment || 'UPI + Bank_X',
        degradation_multiplier: params.degradation_multiplier || 4.0
      })
    });
    if (!res.ok) throw new Error('Failed to seed synthetic transactions');
    return res.json();
  }
};
