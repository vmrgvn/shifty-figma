# Shifty — Admin Dashboard Concept

## Overview

The admin dashboard is the personal account area for schedule administrators. It is reached after successful phone/OTP authentication and provides a central place to create, view, edit, and print work schedules.

---

## User Flow

```
Landing page
  └── "Войти" (nav) or "Создать аккаунт" (wizard done screen)
        └── Auth page (phone → OTP)
              └── Dashboard
                    ├── Schedule list / empty state
                    ├── Schedule detail
                    ├── Wizard (create / edit)
                    ├── Print view
                    ├── Employee wishes
                    └── Settings
```

### Schedule created before auth (draft import)

1. User builds a schedule in the public wizard on the landing page.
2. Wizard auto-saves all state to `localStorage` key `shifty-wizard-draft`.
3. User clicks "Создать аккаунт" at the end of the wizard → auth page opens.
4. After successful OTP → dashboard mounts.
5. On first mount the dashboard checks for `shifty-draft-imported` flag.
   - If absent: reads `shifty-wizard-draft`, converts it to a `DashboardSchedule`, saves to `shifty-schedules`, sets the flag.
   - If present: draft was already imported, skip.
6. The imported schedule appears in the list without duplication.

---

## Dashboard Sections

| Section | Route concept | Description |
|---------|--------------|-------------|
| Расписания | `/dashboard` | Schedule list, empty state, schedule detail |
| Пожелания | `/dashboard/wishes` | Employee time preference requests |
| Настройки | `/dashboard/settings` | Theme, language, security, account |

Navigation is state-based (no URL routing yet, consistent with the rest of the app).

---

## Data Storage (temporary frontend)

| Key | Type | Purpose |
|-----|------|---------|
| `shifty-wizard-draft` | JSON | Auto-saved wizard state; read by both wizard and dashboard |
| `shifty-schedules` | JSON array | Saved `DashboardSchedule` objects |
| `shifty-draft-imported` | "1" | Prevents re-importing the draft on subsequent logins |
| `shifty-theme` | "dark"/"light"/"system" | User theme preference |
| `shifty-language` | LanguageCode | User language preference |

### DashboardSchedule shape

```typescript
interface DashboardSchedule {
  id: string;           // unique, generated on save
  name: string;         // from wizard step 5 (scheduleName)
  createdAt: string;    // ISO date
  updatedAt: string;    // ISO date
  employees: { id: number; name: string; roles: string[] }[];
  globalRoles: string[];
  step3Data: Step3Data; // shift configurations
  step5Data: Step5Data; // breaks, days off, min rest
  status: "active" | "draft";
}
```

---

## Wizard Integration

The existing `<Wizard>` component is reused unchanged except for two optional props:

- `signUpLabel?: string` — overrides the "Создать аккаунт" button text. Dashboard passes `"Сохранить расписание"`.
- When `onSignUp` is called (generation complete, save button clicked):
  - Dashboard reads `shifty-wizard-draft`
  - Creates or updates a `DashboardSchedule`
  - Saves to `shifty-schedules`
  - Closes the wizard

Edit flow: before opening the wizard for an existing schedule, the dashboard writes the schedule's wizard data back to `shifty-wizard-draft` so the wizard pre-fills correctly.

---

## Components

| Component | File | Role |
|-----------|------|------|
| `Dashboard` | `Dashboard.tsx` | Root dashboard, manages all state |
| `SidebarNav` | `Dashboard.tsx` | Desktop left sidebar |
| `BottomNav` | `Dashboard.tsx` | Mobile bottom navigation |
| `EmptyState` | `Dashboard.tsx` | Shown when no schedules exist |
| `ScheduleCard` | `Dashboard.tsx` | Card in the schedule list |
| `ScheduleList` | `Dashboard.tsx` | Grid of `ScheduleCard`s |
| `ScheduleDetail` | `Dashboard.tsx` | Detailed view of a single schedule |
| `PrintView` | `Dashboard.tsx` | Full-screen print preview; calls `window.print()` |
| `WishesSection` | `Dashboard.tsx` | Employee preference requests (mock data) |
| `SettingsSection` | `Dashboard.tsx` | Theme/language/security/account settings |

---

## Future: Backend Integration

Replace localStorage calls with API calls by swapping these helper functions in `Dashboard.tsx`:

```typescript
// Currently reads from localStorage
function readSchedules(): DashboardSchedule[] { ... }
function saveSchedules(list: DashboardSchedule[]) { ... }
```

Replace with:
```typescript
async function fetchSchedules(userId: string): Promise<DashboardSchedule[]> { ... }
async function persistSchedule(s: DashboardSchedule): Promise<void> { ... }
```

The draft import logic and `IMPORTED_FLAG` can be removed once backend persistence is in place.

---

## Future: Employee Account

The employee dashboard will share the auth flow but render a different component after login (e.g. `<EmployeeDashboard>`). App.tsx will determine which dashboard to show based on the user's role returned by the auth API.

Key differences from admin:
- Read-only schedule view
- Submit preference requests (writes to `Пожелания`)
- No schedule creation or editing
- No employee management

---

## Responsive Layout

| Breakpoint | Layout |
|-----------|--------|
| ≥ 768 px | Left sidebar (232 px) + scrollable main content |
| < 768 px | Sticky top header + scrollable content + fixed bottom nav |

---

## Print

Clicking "Печать" on any schedule opens `<PrintView>` — a full-screen white overlay with a clean print-friendly layout. The toolbar is hidden via `@media print`. Clicking "Печать / PDF" calls `window.print()`; the browser handles paper size and PDF export.
