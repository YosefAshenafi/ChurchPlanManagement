export type Role = 'admin' | 'elder' | 'ministry_leader';

export interface User {
  id: number;
  username: string;
  email: string;
  full_name_am: string;
  role: Role;
  ministry: Ministry | null;
  is_active: boolean;
}

export interface Ministry {
  id: number;
  name_am: string;
  name_en: string;
  slug: string;
  is_active: boolean;
}

export interface FiscalYear {
  id: number;
  label: string;
  starts_on: string;
  ends_on: string;
  is_current: boolean;
  plan_window_open: boolean;
}

export interface PlanActivity {
  id?: number;
  order: number;
  description: string;
}

export interface PlanOutput {
  id?: number;
  order: number;
  description: string;
  measure: string;
  quantity: string;
  activities: PlanActivity[];
}

export interface PlanGoal {
  id?: number;
  order: number;
  title: string;
  description: string;
  outputs: PlanOutput[];
}

export interface BudgetLine {
  id?: number;
  goal?: number;
  row_number: number;
  description: string;
  measure: string;
  quantity: number | null;
  unit_price: number | null;
  total_price?: number;
  note: string;
}

export interface BudgetAllocation {
  id?: number;
  goal: number;
  requested_total: number;
  q1_budget: number;
  q2_budget: number;
  q3_budget: number;
  q4_budget: number;
  note: string;
}

export interface ScheduleEntry {
  id?: number;
  goal: number;
  activity_description: string;
  q1: boolean;
  q2: boolean;
  q3: boolean;
  q4: boolean;
}

export interface PlanRisk {
  id?: number;
  order: number;
  risk: string;
  mitigation: string;
}

export type PlanStatus = 'draft' | 'submitted' | 'approved' | 'returned';

export interface Plan {
  id: number;
  ministry: number;
  ministry_name: string;
  fiscal_year: number;
  fiscal_year_label: string;
  status: PlanStatus;
  introduction: string;
  general_objective: string;
  assumptions: string;
  monitoring_evaluation: string;
  review_comment: string;
  submitted_at: string | null;
  reviewed_at: string | null;
  last_saved_at: string;
  goals: PlanGoal[];
  budget_lines: BudgetLine[];
  budget_allocations: BudgetAllocation[];
  schedule_entries: ScheduleEntry[];
  risks: PlanRisk[];
}

export type ReportStatus = 'locked' | 'open' | 'draft' | 'submitted';

export interface ReportActivityProgress {
  id?: number;
  goal: number;
  activity_description: string;
  planned: string;
  completed_percent: number;
  note: string;
  is_carried_over: boolean;
}

export interface ReportBudgetUtilization {
  id?: number;
  goal: number;
  approved_budget: number;
  used_budget: number;
  used_percent?: number;
  note: string;
}

export interface CarriedOverTask {
  id?: number;
  description: string;
  note: string;
}

export interface NextQuarterPlan {
  id?: number;
  order: number;
  description: string;
}

export interface QuarterlyReport {
  id: number;
  plan: number;
  ministry_name: string;
  fiscal_year_label: string;
  quarter: 1 | 2 | 3 | 4;
  status: ReportStatus;
  introduction: string;
  quantitative_results: string;
  unplanned_activities: string;
  challenges: string;
  best_practices: string;
  prayer_topics: string;
  submitted_at: string | null;
  last_saved_at: string;
  activity_progress: ReportActivityProgress[];
  budget_utilization: ReportBudgetUtilization[];
  carried_over_tasks: CarriedOverTask[];
  next_quarter_plans: NextQuarterPlan[];
}

export interface ReportWindow {
  id: number;
  fiscal_year: number;
  fiscal_year_label: string;
  ministry: number;
  ministry_name: string;
  quarter: 1 | 2 | 3 | 4;
  is_open: boolean;
  opened_at: string | null;
}

export interface TokenPair {
  access: string;
  refresh: string;
}

export interface ApiError {
  detail?: string;
  [key: string]: unknown;
}
