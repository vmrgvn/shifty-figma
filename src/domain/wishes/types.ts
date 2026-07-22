import type { ID, ISODate, ISODateTime } from "../schedule/types";

export type WishType =
  | "unavailability"
  | "preferred_time"
  | "day_off"
  | "work_with"
  | "work_separately"
  | "avoid_shift"
  | "free_text";

export type WishStatus = "new" | "needs_review" | "included" | "partially_included" | "not_included";

export interface EmployeeWish {
  id: ID;
  employeeId: ID;
  employeeName: string;
  text: string;
  type: WishType;
  status: WishStatus;
  createdAt: ISODateTime;
  appliesFrom?: ISODate;
  appliesTo?: ISODate;
  parsedInterpretation?: {
    summary: string;
    strength: "soft" | "hard";
    weekdays?: number[];
    timeFrom?: string;
    timeTo?: string;
    targetEmployeeId?: ID;
  };
  outcome?: { summary: string; explanation: string };
  relatedScheduleIds: ID[];
}
