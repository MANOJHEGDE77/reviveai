import axios from 'axios';
import {
  DashboardSummary,
  Payment,
  RecoveryWorkflow,
  RecoveryAction,
  ApprovalRequest,
  AuditLog,
  DemoScenarioResult,
  CustomIncidentInput
} from '../types';

const getBaseUrl = (): string => {
  const envUrl = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL;
  if (envUrl && typeof envUrl === 'string' && envUrl.trim().length > 0) {
    return envUrl.trim().replace(/\/+$/, '');
  }
  return '/api';
};

const api = axios.create({
  baseURL: getBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  // Attach correlation ID to every outbound request
  const correlationId = `req_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  config.headers['X-Correlation-ID'] = correlationId;

  // Attach JWT Bearer token if stored
  const token = localStorage.getItem('reviveai_token');
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
});

export const formatINR = (amount: number, compact = false): string => {
  if (amount === undefined || amount === null) return '₹0';
  if (compact) {
    if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(2)}Cr`;
    if (amount >= 100000) return `₹${(amount / 100000).toFixed(2)}L`;
    if (amount >= 1000) return `₹${(amount / 1000).toFixed(1)}K`;
    return `₹${amount.toFixed(0)}`;
  }
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
};

export const formatDateTime = (dateStr: string): string => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
};

export const apiClient = {
  // Dashboard
  getDashboardSummary: async (): Promise<DashboardSummary> => {
    const res = await api.get<DashboardSummary>('/dashboard/summary');
    return res.data;
  },

  // Incidents
  getIncidents: async (params?: { status?: string; risk_level?: string; search?: string }): Promise<Payment[]> => {
    const res = await api.get<Payment[]>('/incidents', { params });
    return res.data;
  },

  getIncidentDetail: async (id: number): Promise<Payment> => {
    const res = await api.get<Payment>(`/incidents/${id}`);
    return res.data;
  },

  investigateIncident: async (id: number): Promise<Payment> => {
    const res = await api.post<Payment>(`/incidents/${id}/investigate`);
    return res.data;
  },

  // Recovery Workflows
  getRecoveryWorkflows: async (status?: string): Promise<RecoveryWorkflow[]> => {
    const res = await api.get<RecoveryWorkflow[]>('/recovery', { params: { status } });
    return res.data;
  },

  // Auth & RBAC
  getCurrentOperator: async (): Promise<{ operator: any; roles_available: string[] }> => {
    const res = await api.get('/auth/me');
    return res.data;
  },

  switchRole: async (role: 'VIEWER' | 'OPERATOR' | 'RISK_LEAD' | 'ADMIN'): Promise<{ access_token: string; operator: any }> => {
    const res = await api.post(`/auth/switch-role?role=${role}`);
    if (res.data?.access_token) {
      localStorage.setItem('reviveai_token', res.data.access_token);
      localStorage.setItem('reviveai_role', role);
    }
    return res.data;
  },

  executeWorkflowAction: async (id: number): Promise<RecoveryAction> => {
    const idempotencyKey = `exec_${Date.now()}_wf${id}`;
    const res = await api.post<RecoveryAction>(`/recovery/${id}/execute`, {}, {
      headers: { 'Idempotency-Key': idempotencyKey }
    });
    return res.data;
  },

  // Approvals
  getApprovals: async (status?: string): Promise<ApprovalRequest[]> => {
    const res = await api.get<ApprovalRequest[]>('/approvals', { params: { status } });
    return res.data;
  },

  decideApproval: async (id: number, decision: 'APPROVE' | 'REJECT', operator_notes?: string): Promise<ApprovalRequest> => {
    const idempotencyKey = `appr_${Date.now()}_id${id}`;
    const res = await api.post<ApprovalRequest>(`/approvals/${id}/decision`, {
      decision,
      operator_notes,
    }, {
      headers: { 'Idempotency-Key': idempotencyKey }
    });
    return res.data;
  },

  // Audit
  getAuditLogs: async (params?: { actor?: string; event_type?: string; search?: string; limit?: number }): Promise<AuditLog[]> => {
    const res = await api.get<AuditLog[]>('/audit', { params });
    return res.data;
  },

  // Incidents
  createIncident: async (data: CustomIncidentInput): Promise<Payment> => {
    const res = await api.post<Payment>('/incidents', data);
    return res.data;
  },

  // Simulation
  triggerSimulation: async (data: CustomIncidentInput): Promise<Payment> => {
    const res = await api.post<Payment>('/simulation/trigger', data);
    return res.data;
  },

  resolvePayment: async (payment_id: number): Promise<Payment> => {
    const res = await api.post<Payment>(`/simulation/resolve/${payment_id}`);
    return res.data;
  },

  runDemoScenario: async (): Promise<DemoScenarioResult> => {
    const res = await api.post<DemoScenarioResult>('/simulation/demo-scenario');
    return res.data;
  },

  resetDatabase: async (): Promise<{ message: string }> => {
    const res = await api.post<{ message: string }>('/simulation/reset');
    return res.data;
  },
};
