export type ID = string;
export type ISODate = string;
export type ISODateTime = string;

export type ScheduleStatus =
  | "draft"
  | "generating"
  | "needs_review"
  | "ready"
  | "published"
  | "archived"
  | "failed";

export type WorkPattern =
  | { type: "daily" }
  | { type: "weekly"; workingWeekdays: number[] }
  | { type: "cycle"; segments: Array<{ type: "work" | "off"; days: number }>; anchorDate?: ISODate };

export interface RoleDefinition {
  id: ID;
  name: string;
  color?: string;
}

export interface ShiftTemplate {
  id: ID;
  name: string;
  startTime: string;
  endTime: string;
  requiredRoleId?: ID | null;
  activeDays?: number[];
  sourceConfigId?: string;
}

export interface EmployeeAbsence {
  id: ID;
  type: "vacation" | "sick" | "other";
  dateFrom?: ISODate;
  dateTo?: ISODate;
  recurrence?: "once" | "weekly" | "monthly";
  onceDate?: ISODate;
  weekdays?: number[];
  monthDays?: number[];
  timeFrom?: string;
  timeTo?: string;
}

export interface TimePreference {
  id: ID;
  preference: "prefer" | "avoid";
  recurrence: "daily" | "weekly" | "monthly";
  weekdays?: number[];
  monthDays?: number[];
  timeFrom: string;
  timeTo: string;
  strength?: "soft" | "hard";
}

export interface TeammatePreference {
  id: ID;
  targetEmployeeId: ID;
  targetName?: string;
  preference: "with" | "without";
  strength?: "soft" | "hard";
}

export interface EmployeeInput {
  id: ID;
  name: string;
  roleIds: ID[];
  hiredOn?: ISODate | null;
  terminatedOn?: ISODate | null;
  absences: EmployeeAbsence[];
  timePreferences: TimePreference[];
  teammatePreferences: TeammatePreference[];
}

export interface BusinessRules {
  breaks: Array<{ id: ID; from: string; to: string }>;
  nonWorkingDates: ISODate[];
  minimumRestHours: number;
  preferStableShiftTimes: boolean;
}

export interface LegacyWizardSnapshot {
  step?: number;
  scheduleName?: string;
  employees?: unknown[];
  globalRoles?: string[];
  step3Data?: unknown;
  step5Data?: unknown;
}

export interface ScheduleDraft {
  schemaVersion: 1;
  id: ID;
  source: "public_wizard" | "dashboard";
  sourceDraftId?: ID;
  revision: number;
  name: string;
  period: { start: ISODate; end: ISODate; timezone: string };
  workPattern: WorkPattern;
  roles: RoleDefinition[];
  employees: EmployeeInput[];
  shiftTemplates: ShiftTemplate[];
  rules: BusinessRules;
  legacySnapshot?: LegacyWizardSnapshot;
  uiMeta?: { visitedEmployeeSections?: Record<string, string[]> };
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
}

export interface GenerationRequest {
  requestId: ID;
  draftId: ID;
  draftRevision: number;
  requestedAt: ISODateTime;
  locale: "ru";
  timezone: string;
  input: ScheduleDraft;
}

export interface EmployeeSnapshot {
  id: ID;
  name: string;
  roleIds: ID[];
  absences: EmployeeAbsence[];
}

export interface ScheduleAssignment {
  id: ID;
  date: ISODate;
  employeeId?: ID | null;
  shiftTemplateId: ID;
  roleId?: ID | null;
  startsAt: ISODateTime;
  endsAt: ISODateTime;
  state: "assigned" | "open" | "conflict" | "confirmed";
  issueIds: ID[];
  origin: "generated" | "manual";
  explanation?: string;
}

export interface ScheduleMetrics {
  qualityScore?: number;
  coveragePercent: number;
  coveredSlots: number;
  totalSlots: number;
  hardConstraintsSatisfied: number;
  hardConstraintsTotal: number;
  wishesSatisfied: number;
  wishesTotal: number;
  unresolvedIssueCount: number;
  employeeWorkload: Array<{
    employeeId: ID;
    totalHours: number;
    shiftCount: number;
    nightShiftCount: number;
  }>;
}

export interface IssueAction {
  id: string;
  label: string;
  target?: "assignment" | "employee" | "shift" | "wish" | "wizard";
}

export interface ScheduleIssue {
  id: ID;
  severity: "info" | "warning" | "error";
  type:
    | "uncovered_shift"
    | "missing_role"
    | "minimum_rest"
    | "employee_absence"
    | "overlap"
    | "unfulfilled_wish"
    | "workload_imbalance"
    | "other";
  title: string;
  description: string;
  date?: ISODate;
  employeeIds: ID[];
  assignmentIds: ID[];
  relatedWishId?: ID;
  resolutionActions: IssueAction[];
  resolved: boolean;
}

export interface WishOutcome {
  wishId: ID;
  employeeId: ID;
  outcome: "satisfied" | "partially_satisfied" | "not_satisfied" | "not_processed";
  summary: string;
  explanation: string;
  relatedAssignmentIds: ID[];
  relatedIssueIds: ID[];
}

export interface GeneratedSchedule {
  schemaVersion: 1;
  id: ID;
  draftId: ID;
  sourceDraftId?: ID;
  generationRequestId: ID;
  revision: number;
  status: ScheduleStatus;
  isDemoResult: boolean;
  name: string;
  period: { start: ISODate; end: ISODate; timezone: string };
  employees: EmployeeSnapshot[];
  roles: RoleDefinition[];
  shiftTemplates: ShiftTemplate[];
  assignments: ScheduleAssignment[];
  metrics: ScheduleMetrics;
  issues: ScheduleIssue[];
  wishOutcomes: WishOutcome[];
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
  publishedAt?: ISODateTime | null;
}

export interface UserCapabilities {
  canCreateSchedule: boolean;
  canEditSchedule: boolean;
  canPublishSchedule: boolean;
  canViewAllWishes: boolean;
  canManageWishes: boolean;
  canSubmitWish: boolean;
  canManageSettings: boolean;
}

export const DEFAULT_CAPABILITIES: UserCapabilities = {
  canCreateSchedule: true,
  canEditSchedule: true,
  canPublishSchedule: true,
  canViewAllWishes: true,
  canManageWishes: true,
  canSubmitWish: true,
  canManageSettings: true,
};
