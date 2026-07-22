# Shifty Control Room: frontend architecture

Control Room remains a frontend-only MVP. It does not call a backend and does not pretend that the local generator, authentication or natural-language interpretation are production services.

## Boundaries

- `src/domain/schedule` contains typed schedule contracts, wizard adapters and human-readable validation.
- `src/domain/wishes` contains the employee-wish contract.
- `src/data/engine` exposes `ScheduleEngine`; `MockScheduleEngine` is the deterministic local implementation that can later be replaced by an API adapter.
- `src/data/repositories/localAppRepository.ts` is the only application boundary that accesses `localStorage`. It owns versioned state, legacy migration, demo seeding and the public-wizard handoff.
- `src/data/fixtures` contains clearly labelled demo data.
- `src/app/control-room` contains the responsive shell, pages and schedule inspection components.

## Persistence and future backend

The versioned local root is `shifty.app.v1`. Drafts and generated schedules are stored separately and linked by IDs/revisions. A public wizard result is staged and imported idempotently after demo authentication. Replacing local persistence later should require repository implementations, not page rewrites; replacing generation should require another `ScheduleEngine` implementation.

## Product rules kept in the domain

Roles are optional for both employees and shifts. A role conflict exists only when a shift explicitly requires a role and no employee has it. Overnight shifts are valid when their end time is earlier than their start time.
