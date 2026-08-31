export interface Customer {
  id: number;
  customer_ref: string;
  name: string;
  email: string;
  phone?: string;
  payment_method_masked: string;
  payment_method_type: string;
  lifetime_value: number;
  successful_transactions: number;
  failed_transactions: number;
  health_score: number;
  created_at: string;
}

export interface PaymentEvent {
  id: number;
  event_type: string;
  description: string;
  actor: string;
  payload_json?: string;
  created_at: string;
}

export interface RecoveryAction {
  id: number;
  action_type: string;
  executed_by: string;
  status: string;
  execution_details?: string;
  created_at: string;
}

export interface RecoveryWorkflow {
  id: number;
  workflow_ref: string;
  payment_id: number;
  trigger_reason: string;
  diagnosis?: string;
  strategy: string;
  current_step: string;
  next_action?: string;
  attempts: number;
  max_attempts: number;
  deadline_time?: string;
  status: 'ACTIVE' | 'WAITING' | 'PENDING_APPROVAL' | 'RESOLVED' | 'EXPIRED' | 'REJECTED' | 'CANCELLED';
  result_message?: string;
  created_at: string;
  updated_at?: string;
  actions?: RecoveryAction[];
}

export interface Payment {
  id: number;
  payment_ref: string;
  customer_id: number;
  amount: number;
  currency: string;
  status: 'FAILED' | 'IN_RECOVERY' | 'RECOVERED' | 'REQUIRES_APPROVAL' | 'LOST';
  failure_category: string;
  failure_code?: string;
  failure_reason?: string;
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  recovery_probability: number;
  ai_recommendation?: string;
  ai_diagnosis_summary?: string;
  ai_confidence?: number;
  created_at: string;
  updated_at?: string;
  recovered_at?: string;
  customer?: Customer;
  workflow?: RecoveryWorkflow;
  events?: PaymentEvent[];
}

export interface ApprovalRequest {
  id: number;
  approval_ref: string;
  payment_id: number;
  workflow_id: number;
  amount: number;
  customer_name: string;
  risk_level: string;
  ai_recommendation: string;
  ai_confidence: number;
  evidence_reason?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  decision_by?: string;
  decision_notes?: string;
  created_at: string;
  resolved_at?: string;
  payment?: Payment;
}

export interface AuditLog {
  id: number;
  timestamp: string;
  actor: string;
  event_type: string;
  payment_ref?: string;
  customer_ref?: string;
  amount?: number;
  decision: string;
  reason?: string;
  guardrail_result?: string;
  outcome_status: string;
  details_json?: string;
}

export interface RevenueRiskCategory {
  category_key: string;
  label: string;
  amount: number;
  affected_customers: number;
  recovery_probability: number;
  trend: string;
  status: string;
}

export interface LiveAiOperation {
  id: string;
  stage: 'DETECTING' | 'INVESTIGATING' | 'DECIDING' | 'EXECUTING' | 'MONITORING' | 'RESOLVED';
  message: string;
  sub_message?: string;
  timestamp: string;
  severity: 'info' | 'success' | 'warning' | 'danger';
}

export interface RevenueChartPoint {
  date: string;
  at_risk: number;
  recovered: number;
  failed_count: number;
  recovered_count: number;
}

export interface DashboardSummary {
  revenue_at_risk: number;
  estimated_recoverable: number;
  successfully_recovered: number;
  recovery_rate: number;
  active_workflows_count: number;
  pending_approvals_count: number;
  failed_incidents_count: number;
  recovered_incidents_count: number;
  risk_categories: RevenueRiskCategory[];
  revenue_trend: RevenueChartPoint[];
  live_operations: LiveAiOperation[];
}

export interface DemoScenarioResult {
  status: string;
  scenario: string;
  payment_ref: string;
  amount_recovered: number;
  customer: string;
  workflow_ref: string;
  ai_confidence: number;
  steps_completed: string[];
}
