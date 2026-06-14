import { useState, useRef, useEffect } from "react";
import { Plus, Trash2, ChevronDown, AlertCircle } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
export type WorkMode = "daily" | "weekly" | "custom";

export interface CycleSeg     { id: number; type: "work" | "off"; days: number; }
export interface Shift3       { id: number; from: string; to: string; role: string; }
export interface ShiftConfig3 { id: number; activeDays: number[]; shifts: Shift3[]; }

export interface Step3Data {
  mode: WorkMode;
  weekDays: number[];
  cycle: CycleSeg[];
  configs: ShiftConfig3[];
}

export function defaultStep3(): Step3Data {
  return { mode: "daily", weekDays: [0,1,2,3,4], cycle: [], configs: [{ id: 1, activeDays: [], shifts: [] }] };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const WEEK = ["Пн","Вт","Ср","Чт","Пт","Сб","Вс"];

export function cycleTotal(c: CycleSeg[]) { return c.reduce((s, x) => s + x.days, 0); }

export function workIndices(mode: WorkMode, weekDays: number[], cycle: CycleSeg[]): number[] {
  if (mode === "daily") return [];
  if (mode === "weekly") return weekDays;
  let idx = 0, res: number[] = [];
  for (const s of cycle) { if (s.type === "work") for (let i = 0; i < s.days; i++) res.push(idx + i); idx += s.days; }
  return res;
}

function dayLabel(mode: WorkMode, i: number) {
  return mode === "weekly" ? WEEK[i] : `${i + 1}-й`;
}

function colors(dark: boolean) {
  return {
    headline:         dark ? "#f0ecff" : "#0f0a1e",
    sub:              dark ? "#c4bde0" : "#a89ec0",
    faint:            dark ? "#9b94b8" : "#d4cce8",
    inputBg:          dark ? "#0e0c18" : "#faf8ff",
    inputBorder:      dark ? "rgba(168,85,247,0.2)" : "rgba(168,85,247,0.25)",
    rowBorder:        dark ? "rgba(168,85,247,0.1)" : "rgba(168,85,247,0.1)",
    iconMuted:        dark ? "#a09ab8" : "#c4b8d8",
    chipBg:           dark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)",
    chipActiveBg:     dark ? "rgba(168,85,247,0.14)" : "rgba(168,85,247,0.09)",
    chipActiveFg:     dark ? "#c4b5fd" : "#7c3aed",
    chipActiveBorder: dark ? "rgba(168,85,247,0.3)" : "rgba(168,85,247,0.25)",
    formBg:           dark ? "rgba(168,85,247,0.05)" : "rgba(168,85,247,0.03)",
    formBorder:       dark ? "rgba(168,85,247,0.12)" : "rgba(168,85,247,0.12)",
    divider:          dark ? "rgba(168,85,247,0.08)" : "rgba(168,85,247,0.08)",
  };
}

// ─── Primitives ───────────────────────────────────────────────────────────────
function Pills({ options, value, onChange, dark }: {
  options: { value: string; label: string }[];
  value: string; onChange: (v: string) => void; dark: boolean;
}) {
  const tc = colors(dark);
  return (
    <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
      {options.map(o => {
        const active = o.value === value;
        return (
          <button key={o.value} onClick={() => onChange(o.value)} style={{
            padding: "6px 14px", borderRadius: "99px", cursor: "pointer",
            background: active ? "linear-gradient(135deg,#a855f7,#ec4899)" : tc.chipBg,
            color: active ? "#fff" : tc.sub, fontSize: "0.8rem", fontWeight: 500,
            fontFamily: "'DM Sans',sans-serif", transition: "all 0.15s",
            boxShadow: active ? "0 2px 10px rgba(168,85,247,0.3)" : "none",
            outline: active ? "none" : `1px solid ${tc.rowBorder}`, border: "none",
          }}>{o.label}</button>
        );
      })}
    </div>
  );
}

function Label({ text, dark }: { text: string; dark: boolean }) {
  return <p style={{ color: colors(dark).sub, fontSize: "0.75rem", margin: "0 0 6px", fontWeight: 500, letterSpacing: "0.02em" }}>{text}</p>;
}

function Hint({ text, dark }: { text: string; dark: boolean }) {
  const tc = colors(dark);
  return (
    <div style={{ display: "flex", gap: "6px", alignItems: "flex-start", padding: "8px 10px", borderRadius: "8px", background: tc.chipBg, border: `1px solid ${tc.rowBorder}` }}>
      <AlertCircle size={13} strokeWidth={1.8} style={{ color: tc.iconMuted, flexShrink: 0, marginTop: "1px" }} />
      <span style={{ color: tc.sub, fontSize: "0.75rem", lineHeight: 1.5 }}>{text}</span>
    </div>
  );
}

function TimeInput({ value, onChange, dark }: { value: string; onChange: (v: string) => void; dark: boolean }) {
  const [focused, setFocused] = useState(false);
  const tc = colors(dark);
  return (
    <input type="time" value={value} onChange={e => onChange(e.target.value)}
      onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
      style={{
        background: tc.inputBg, border: `1.5px solid ${focused ? "#a855f7" : tc.inputBorder}`,
        borderRadius: "8px", padding: "8px 10px", color: tc.headline,
        fontSize: "0.85rem", fontFamily: "'DM Sans',sans-serif", outline: "none",
        transition: "border-color 0.18s", width: "100px",
      }}
    />
  );
}

function RoleDropdown({ value, onChange, roles, dark }: { value: string; onChange: (v: string) => void; roles: string[]; dark: boolean }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const tc = colors(dark);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const dropBg     = dark ? "#1a1825" : "#fff";
  const dropBorder = dark ? "rgba(168,85,247,0.18)" : "rgba(168,85,247,0.18)";
  const hoverBg    = dark ? "rgba(168,85,247,0.08)" : "rgba(168,85,247,0.06)";

  return (
    <div ref={ref} style={{ position: "relative", flex: 1 }}>
      <button onClick={() => setOpen(v => !v)} style={{
        width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
        background: tc.inputBg, border: `1.5px solid ${open ? "#a855f7" : tc.inputBorder}`,
        borderRadius: "8px", padding: "8px 10px", color: value ? tc.headline : tc.sub,
        fontSize: "0.85rem", fontFamily: "'DM Sans',sans-serif", cursor: "pointer",
        transition: "border-color 0.18s", outline: "none",
      }}>
        <span>{value || "Роль в смене…"}</span>
        <ChevronDown size={13} strokeWidth={2} style={{ color: tc.iconMuted, flexShrink: 0, transform: open ? "rotate(180deg)" : "none", transition: "transform 0.15s" }} />
      </button>

      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, zIndex: 200,
          background: dropBg, border: `1px solid ${dropBorder}`,
          borderRadius: "10px", padding: "4px",
          boxShadow: dark ? "0 8px 32px rgba(0,0,0,0.5)" : "0 8px 24px rgba(15,10,30,0.14)",
        }}>
          {value && (
            <button onClick={() => { onChange(""); setOpen(false); }} style={{
              display: "block", width: "100%", textAlign: "left", padding: "8px 10px",
              background: "none", border: "none", borderRadius: "7px", cursor: "pointer",
              color: tc.sub, fontSize: "0.82rem", fontFamily: "'DM Sans',sans-serif", transition: "background 0.12s",
            }}
              onMouseEnter={e => (e.currentTarget.style.background = hoverBg)}
              onMouseLeave={e => (e.currentTarget.style.background = "none")}
            >— без роли</button>
          )}
          {roles.map(r => (
            <button key={r} onClick={() => { onChange(r); setOpen(false); }} style={{
              display: "block", width: "100%", textAlign: "left", padding: "8px 10px",
              background: r === value ? (dark ? "rgba(168,85,247,0.12)" : "rgba(168,85,247,0.08)") : "none",
              border: "none", borderRadius: "7px", cursor: "pointer",
              color: r === value ? (dark ? "#c4b5fd" : "#7c3aed") : tc.headline,
              fontSize: "0.85rem", fontFamily: "'DM Sans',sans-serif",
              fontWeight: r === value ? 500 : 400, transition: "background 0.12s",
            }}
              onMouseEnter={e => { if (r !== value) e.currentTarget.style.background = hoverBg; }}
              onMouseLeave={e => { if (r !== value) e.currentTarget.style.background = "none"; }}
            >{r}</button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Cycle builder ────────────────────────────────────────────────────────────
function CycleBuilder({ cycle, onChange, dark }: {
  cycle: CycleSeg[]; onChange: (c: CycleSeg[]) => void; dark: boolean;
}) {
  const tc = colors(dark);
  const total = cycleTotal(cycle);
  const nextId = useRef(1000);

  const addSeg = (type: "work" | "off") => {
    if (total >= 7) return;
    onChange([...cycle, { id: nextId.current++, type, days: 1 }]);
  };


  const deleteSeg = (id: number) => onChange(cycle.filter(s => s.id !== id));

  const workColor  = dark ? "rgba(16,185,129,0.18)" : "rgba(16,185,129,0.1)";
  const workBorder = dark ? "rgba(16,185,129,0.35)"  : "rgba(16,185,129,0.3)";
  const workText   = dark ? "#6ee7b7" : "#047857";
  const offColor   = dark ? "rgba(100,100,120,0.15)" : "rgba(100,100,120,0.08)";
  const offBorder  = dark ? "rgba(100,100,120,0.3)"  : "rgba(100,100,120,0.2)";
  const offText    = tc.sub;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      <Hint text="Составьте чередование рабочих и выходных дней. Например: 2 рабочих → 2 выходных. Максимум — 7 дней суммарно." dark={dark} />

      {/* Segments */}
      {cycle.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", alignItems: "center" }}>
          {cycle.map(seg => {
            const isWork = seg.type === "work";
            return (
              <div key={seg.id} style={{
                display: "inline-flex", alignItems: "center", gap: "6px",
                padding: "5px 8px 5px 12px", borderRadius: "10px",
                background: isWork ? workColor : offColor,
                border: `1px solid ${isWork ? workBorder : offBorder}`,
              }}>
                <span style={{ color: isWork ? workText : offText, fontSize: "0.75rem", fontWeight: 600 }}>
                  {isWork ? "Рабочий день" : "Выходной день"}
                </span>
                <button onClick={() => deleteSeg(seg.id)} style={{
                  background: "none", border: "none", cursor: "pointer", padding: "0 0 0 2px",
                  color: tc.iconMuted, display: "flex", lineHeight: 1, fontSize: "0.75rem",
                }}>✕</button>
              </div>
            );
          })}
        </div>
      )}

      {/* Add buttons */}
      {total < 7 && (
        <div style={{ display: "flex", gap: "6px" }}>
          <button onClick={() => addSeg("work")} style={{
            display: "inline-flex", alignItems: "center", gap: "5px",
            padding: "7px 12px", borderRadius: "10px", border: "none", cursor: "pointer",
            background: workColor, outline: `1px solid ${workBorder}`,
            color: workText, fontSize: "0.78rem", fontWeight: 500,
            fontFamily: "'DM Sans',sans-serif", transition: "opacity 0.15s",
          }}
            onMouseEnter={e => (e.currentTarget.style.opacity = "0.75")}
            onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
          ><Plus size={12} strokeWidth={2.5} />Рабочий день</button>

          <button onClick={() => addSeg("off")} style={{
            display: "inline-flex", alignItems: "center", gap: "5px",
            padding: "7px 12px", borderRadius: "10px", border: "none", cursor: "pointer",
            background: offColor, outline: `1px solid ${offBorder}`,
            color: offText, fontSize: "0.78rem", fontWeight: 500,
            fontFamily: "'DM Sans',sans-serif", transition: "opacity 0.15s",
          }}
            onMouseEnter={e => (e.currentTarget.style.opacity = "0.75")}
            onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
          ><Plus size={12} strokeWidth={2.5} />Выходной день</button>
        </div>
      )}
    </div>
  );
}

// ─── Day toggles inside a shift config ───────────────────────────────────────
function ConfigDayToggles({ mode, weekDays, cycle, activeDays, onChange, dark }: {
  mode: WorkMode; weekDays: number[]; cycle: CycleSeg[];
  activeDays: number[]; onChange: (d: number[]) => void; dark: boolean;
}) {
  const tc = colors(dark);
  const total = mode === "custom" ? cycleTotal(cycle) : 7;
  const working = workIndices(mode, weekDays, cycle);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
      <Label text="Дни, для которых действует эта группа смен" dark={dark} />
      <div style={{ display: "flex", gap: "5px", flexWrap: "wrap" }}>
        {Array.from({ length: total }, (_, i) => {
          const isWork = working.includes(i);
          const isActive = activeDays.includes(i);
          return (
            <button key={i} disabled={!isWork}
              onClick={() => onChange(isActive ? activeDays.filter(d => d !== i) : [...activeDays, i])}
              style={{
                minWidth: "34px", height: "34px", padding: "0 8px", borderRadius: "8px",
                border: "none", cursor: isWork ? "pointer" : "default",
                background: isActive ? "linear-gradient(135deg,#a855f7,#ec4899)" : (isWork ? tc.chipBg : "transparent"),
                color: isActive ? "#fff" : (isWork ? tc.sub : tc.faint),
                fontSize: "0.72rem", fontWeight: 600, fontFamily: "'DM Sans',sans-serif",
                outline: isActive ? "none" : `1px solid ${isWork ? tc.rowBorder : tc.divider}`,
                opacity: isWork ? 1 : 0.4, transition: "all 0.15s",
                boxShadow: isActive ? "0 2px 8px rgba(168,85,247,0.3)" : "none",
              }}
            >{dayLabel(mode, i)}</button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Shift row ────────────────────────────────────────────────────────────────
function ShiftRow({ shift, roles, onUpdate, onDelete, dark }: {
  shift: Shift3; roles: string[];
  onUpdate: (patch: Partial<Shift3>) => void;
  onDelete: () => void; dark: boolean;
}) {
  const tc = colors(dark);
  const hasRoles = roles.length > 0;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
      <TimeInput value={shift.from} onChange={v => onUpdate({ from: v })} dark={dark} />
      <span style={{ color: tc.faint, fontSize: "0.8rem", flexShrink: 0 }}>→</span>
      <TimeInput value={shift.to} onChange={v => onUpdate({ to: v })} dark={dark} />
      {hasRoles && <RoleDropdown value={shift.role} onChange={v => onUpdate({ role: v })} roles={roles} dark={dark} />}
      <button onClick={onDelete} style={{
        background: "none", border: "none", cursor: "pointer", padding: "4px",
        color: tc.iconMuted, display: "flex", flexShrink: 0, borderRadius: "6px", transition: "color 0.15s",
      }}
        onMouseEnter={e => (e.currentTarget.style.color = "#f87171")}
        onMouseLeave={e => (e.currentTarget.style.color = tc.iconMuted)}
      ><Trash2 size={13} strokeWidth={1.8} /></button>
    </div>
  );
}

// ─── Shift config block ───────────────────────────────────────────────────────
function ConfigBlock({ config, mode, weekDays, cycle, roles, onUpdate, onDelete, showDelete, dark }: {
  config: ShiftConfig3; mode: WorkMode; weekDays: number[]; cycle: CycleSeg[];
  roles: string[]; onUpdate: (c: ShiftConfig3) => void;
  onDelete: () => void; showDelete: boolean; dark: boolean;
}) {
  const tc = colors(dark);
  const nextShiftId = useRef(10000);

  const addShift    = () => onUpdate({ ...config, shifts: [...config.shifts, { id: nextShiftId.current++, from: "", to: "", role: "" }] });
  const updateShift = (id: number, patch: Partial<Shift3>) => onUpdate({ ...config, shifts: config.shifts.map(s => s.id === id ? { ...s, ...patch } : s) });
  const deleteShift = (id: number) => onUpdate({ ...config, shifts: config.shifts.filter(s => s.id !== id) });

  return (
    <div style={{ background: tc.formBg, border: `1px solid ${tc.formBorder}`, borderRadius: "12px", padding: "14px", marginBottom: "10px" }}>
      {showDelete && (
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "10px" }}>
          <button onClick={onDelete} style={{ background: "none", border: "none", cursor: "pointer", color: tc.iconMuted, fontSize: "0.75rem", fontFamily: "'DM Sans',sans-serif", display: "flex", alignItems: "center", gap: "4px", padding: 0, transition: "color 0.15s" }}
            onMouseEnter={e => (e.currentTarget.style.color = "#f87171")}
            onMouseLeave={e => (e.currentTarget.style.color = tc.iconMuted)}
          ><Trash2 size={12} strokeWidth={1.8} />Удалить группу</button>
        </div>
      )}

      {mode !== "daily" && (
        <div style={{ marginBottom: "14px" }}>
          <ConfigDayToggles mode={mode} weekDays={weekDays} cycle={cycle} activeDays={config.activeDays} onChange={days => onUpdate({ ...config, activeDays: days })} dark={dark} />
        </div>
      )}

      <Label text="Смены" dark={dark} />

      {config.shifts.length === 0 && (
        <p style={{ color: tc.faint, fontSize: "0.78rem", margin: "0 0 10px" }}>Смен пока нет — добавьте первую</p>
      )}

      {config.shifts.map(shift => (
        <ShiftRow key={shift.id} shift={shift} roles={roles}
          onUpdate={patch => updateShift(shift.id, patch)}
          onDelete={() => deleteShift(shift.id)} dark={dark} />
      ))}

      <button onClick={addShift} style={{
        display: "inline-flex", alignItems: "center", gap: "5px",
        background: "none", border: `1px dashed ${tc.inputBorder}`,
        borderRadius: "8px", padding: "7px 12px", cursor: "pointer",
        color: tc.sub, fontSize: "0.8rem", fontFamily: "'DM Sans',sans-serif",
        width: "100%", justifyContent: "center", marginTop: "2px", transition: "all 0.15s",
      }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = "#a855f7"; e.currentTarget.style.color = dark ? "#c4b5fd" : "#7c3aed"; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = tc.inputBorder; e.currentTarget.style.color = tc.sub; }}
      ><Plus size={13} strokeWidth={2} />Добавить смену</button>
    </div>
  );
}

// ─── Step 3: work mode only ───────────────────────────────────────────────────
export function StepThree({ data, onChange, dark }: {
  data: Step3Data; onChange: (d: Step3Data) => void; dark: boolean;
}) {
  const tc = colors(dark);

  const setMode = (mode: WorkMode) => {
    const workDays = workIndices(mode, data.weekDays, data.cycle);
    onChange({ ...data, mode, configs: data.configs.map(c => ({ ...c, activeDays: workDays })) });
  };

  const setWeekDays = (weekDays: number[]) => {
    const workDays = workIndices("weekly", weekDays, []);
    onChange({ ...data, weekDays, configs: data.configs.map(c => ({ ...c, activeDays: workDays })) });
  };

  const setCycle = (cycle: CycleSeg[]) => {
    const workDays = workIndices("custom", [], cycle);
    onChange({ ...data, cycle, configs: data.configs.map(c => ({ ...c, activeDays: workDays })) });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", minHeight: 0 }}>
      <p style={{ color: tc.headline, fontWeight: 600, fontSize: "1.15rem", margin: "0 0 16px", letterSpacing: "-0.03em" }}>
        График работы
      </p>

      <div style={{ flex: 1, overflowY: "auto", minHeight: 0, paddingRight: "2px" }}>
        <div style={{ marginBottom: "16px" }}>
          <Label text="Как работает бизнес?" dark={dark} />
          <Pills dark={dark} value={data.mode} onChange={v => setMode(v as WorkMode)} options={[
            { value: "daily",  label: "Каждый день" },
            { value: "weekly", label: "По дням недели" },
            { value: "custom", label: "Свой цикл" },
          ]} />
        </div>

        {data.mode === "weekly" && (
          <div style={{ marginBottom: "8px" }}>
            <Label text="Рабочие дни" dark={dark} />
            <div style={{ display: "flex", gap: "5px" }}>
              {WEEK.map((d, i) => {
                const active = data.weekDays.includes(i);
                return (
                  <button key={i}
                    onClick={() => setWeekDays(active ? data.weekDays.filter(x => x !== i) : [...data.weekDays, i])}
                    style={{
                      width: "34px", height: "34px", borderRadius: "50%", border: "none", cursor: "pointer",
                      background: active ? "linear-gradient(135deg,#a855f7,#ec4899)" : tc.chipBg,
                      color: active ? "#fff" : tc.sub, fontSize: "0.72rem", fontWeight: 600,
                      fontFamily: "'DM Sans',sans-serif", transition: "all 0.15s",
                      outline: active ? "none" : `1px solid ${tc.rowBorder}`,
                      boxShadow: active ? "0 2px 8px rgba(168,85,247,0.3)" : "none",
                    }}
                  >{d}</button>
                );
              })}
            </div>
          </div>
        )}

        {data.mode === "custom" && (
          <CycleBuilder cycle={data.cycle} onChange={setCycle} dark={dark} />
        )}
      </div>
    </div>
  );
}

// ─── Step 4: shifts ───────────────────────────────────────────────────────────
export function StepFour({ data, onChange, globalRoles, onGoToStep, dark }: {
  data: Step3Data; onChange: (d: Step3Data) => void;
  globalRoles: string[]; onGoToStep: (s: number) => void; dark: boolean;
}) {
  const tc = colors(dark);
  const nextCfgId = useRef(100);
  const hasRoles = globalRoles.length > 0;

  const updateConfig = (id: number, cfg: ShiftConfig3) =>
    onChange({ ...data, configs: data.configs.map(c => c.id === id ? cfg : c) });
  const deleteConfig = (id: number) =>
    onChange({ ...data, configs: data.configs.filter(c => c.id !== id) });
  const addConfig = () => {
    const workDays = workIndices(data.mode, data.weekDays, data.cycle);
    onChange({ ...data, configs: [...data.configs, { id: nextCfgId.current++, activeDays: workDays, shifts: [] }] });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", minHeight: 0 }}>
      <p style={{ color: tc.headline, fontWeight: 600, fontSize: "1.15rem", margin: "0 0 6px", letterSpacing: "-0.03em" }}>
        Смены
      </p>
      <p style={{ color: tc.sub, fontSize: "0.8rem", margin: "0 0 12px", lineHeight: 1.55 }}>
        Если в один временной блок выходят несколько должностей — добавьте отдельную смену для каждой роли.
      </p>

      {!hasRoles && (
        <div style={{ display: "flex", gap: "8px", alignItems: "flex-start", padding: "10px 12px", borderRadius: "10px", background: tc.chipBg, border: `1px solid ${tc.rowBorder}`, marginBottom: "14px" }}>
          <AlertCircle size={14} strokeWidth={1.8} style={{ color: tc.iconMuted, flexShrink: 0, marginTop: "1px" }} />
          <span style={{ color: tc.sub, fontSize: "0.78rem", lineHeight: 1.6 }}>
            Вы можете назначать разные роли для смен. Для этого добавьте роли сотрудникам на{" "}
            <a onClick={() => onGoToStep(2)} style={{ color: dark ? "#c4b5fd" : "#7c3aed", cursor: "pointer", textDecoration: "none", fontWeight: 500 }}
              onMouseEnter={e => ((e.target as HTMLElement).style.textDecoration = "underline")}
              onMouseLeave={e => ((e.target as HTMLElement).style.textDecoration = "none")}
            >шаге 2</a>.
          </span>
        </div>
      )}

      <div style={{ flex: 1, overflowY: "auto", minHeight: 0, paddingRight: "2px" }}>
        {data.configs.map(cfg => (
          <ConfigBlock key={cfg.id} config={cfg} mode={data.mode}
            weekDays={data.weekDays} cycle={data.cycle} roles={globalRoles}
            onUpdate={c => updateConfig(cfg.id, c)}
            onDelete={() => deleteConfig(cfg.id)}
            showDelete={data.configs.length > 1}
            dark={dark}
          />
        ))}

        {data.mode !== "daily" && (
          <button onClick={addConfig} style={{
            display: "inline-flex", alignItems: "center", gap: "6px",
            background: "none", border: `1.5px dashed ${tc.inputBorder}`,
            borderRadius: "10px", padding: "10px 14px", cursor: "pointer",
            color: tc.sub, fontSize: "0.85rem", fontFamily: "'DM Sans',sans-serif",
            width: "100%", justifyContent: "center", transition: "all 0.15s",
          }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = "#a855f7"; e.currentTarget.style.color = dark ? "#c4b5fd" : "#7c3aed"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = tc.inputBorder; e.currentTarget.style.color = tc.sub; }}
          ><Plus size={14} strokeWidth={2} />Добавить группу смен</button>
        )}
      </div>
    </div>
  );
}
