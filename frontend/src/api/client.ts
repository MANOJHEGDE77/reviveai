import axios from 'axios';
import {
  DashboardSummary,
  Payment,
  RecoveryWorkflow,
  RecoveryAction,
  ApprovalRequest,
  AuditLog,
  DemoScenarioResult
} from '../types';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
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

  executeWorkflowAction: async (id: number): Promise<RecoveryAction> => {
    const res = await api.post<RecoveryAction>(`/recovery/${id}/execute`);
    return res.data;
  },

  // Approvals
  getApprovals: async (status?: string): Promise<ApprovalRequest[]> => {
    const res = await api.get<ApprovalRequest[]>('/approvals', { params: { status } });
    return res.data;
  },

  decideApproval: async (id: number, decision: 'APPROVE' | 'REJECT', operator_notes?: string): Promise<ApprovalRequest> => {
    const res = await api.post<ApprovalRequest>(`/approvals/${id}/decision`, {
      decision,
      operator_notes,
      decision_by: 'Risk Lead (SecOps)',
    });
    return res.data;
  },

  // Audit
  getAuditLogs: async (params?: { actor?: string; event_type?: string; search?: string; limit?: number }): Promise<AuditLog[]> => {
    const res = await api.get<AuditLog[]>('/audit', { params });
    return res.data;
  },

  // Simulation
  triggerSimulation: async (data: {
    customer_name?: string;
    amount: number;
    failure_category: string;
    failure_reason?: string;
    payment_method_type?: string;
    auto_execute?: boolean;
  }): Promise<Payment> => {
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
