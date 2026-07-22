import type { ScheduleDraft } from "./types";

export interface DraftValidationIssue {
  code: "no_employees" | "no_shifts" | "incomplete_shift" | "invalid_period" | "missing_role";
  message: string;
  shiftTemplateId?: string;
  roleId?: string;
}

export function validateScheduleDraft(draft: ScheduleDraft): DraftValidationIssue[] {
  const issues: DraftValidationIssue[] = [];
  if (!draft.employees.length) issues.push({ code: "no_employees", message: "Добавьте хотя бы одного сотрудника." });
  if (!draft.shiftTemplates.length) issues.push({ code: "no_shifts", message: "Добавьте хотя бы одну смену." });
  if (draft.period.end < draft.period.start) issues.push({ code: "invalid_period", message: "Дата окончания расписания должна быть позже даты начала." });

  for (const shift of draft.shiftTemplates) {
    if (!shift.startTime || !shift.endTime) {
      issues.push({ code: "incomplete_shift", shiftTemplateId: shift.id, message: `Укажите время начала и окончания смены «${shift.name}».` });
    }
    if (!shift.requiredRoleId) continue;
    const role = draft.roles.find(item => item.id === shift.requiredRoleId);
    if (!draft.employees.some(employee => employee.roleIds.includes(shift.requiredRoleId!))) {
      issues.push({
        code: "missing_role",
        shiftTemplateId: shift.id,
        roleId: shift.requiredRoleId,
        message: `Для смены «${shift.name}» указана роль «${role?.name ?? "Без названия"}», но среди сотрудников нет ни одного сотрудника с этой ролью. Назначьте роль сотруднику, измените роль у смены или уберите ограничение.`,
      });
    }
  }
  return issues;
}
