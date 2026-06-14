import { useState, useEffect, useRef, RefObject } from "react";
import { StepThree, StepFour, Step3Data, defaultStep3 } from "./WizardStep3";
import { StepFive, Step5Data, defaultStep5 } from "./WizardStep5";
import { motion, AnimatePresence } from "motion/react";
import {
  X, Plus, Trash2, Tag, CalendarOff, CalendarRange,
  Clock3, Users2, UserRound, ChevronLeft, Search, Check,
  Stethoscope, Umbrella, Calendar, ThumbsUp, ThumbsDown,
} from "lucide-react";

// ─── Color tokens ─────────────────────────────────────────────────────────────
function colors(dark: boolean) {
  return {
    headline:    dark ? "#f0ecff" : "#0f0a1e",
    sub:         dark ? "#c4bde0" : "#a89ec0",
    faint:       dark ? "#9b94b8" : "#d4cce8",
    inputBg:     dark ? "#0e0c18" : "#faf8ff",
    inputBorder: dark ? "rgba(168,85,247,0.2)" : "rgba(168,85,247,0.25)",
    rowBorder:   dark ? "rgba(168,85,247,0.1)" : "rgba(168,85,247,0.1)",
    iconMuted:   dark ? "#a09ab8" : "#c4b8d8",
    divider:     dark ? "rgba(168,85,247,0.08)" : "rgba(168,85,247,0.08)",
    chipBg:      dark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)",
    chipActiveBg:dark ? "rgba(168,85,247,0.14)" : "rgba(168,85,247,0.09)",
    chipActiveFg:dark ? "#c4b5fd" : "#7c3aed",
    chipActiveBorder: dark ? "rgba(168,85,247,0.3)" : "rgba(168,85,247,0.25)",
    formBg:      dark ? "rgba(168,85,247,0.05)" : "rgba(168,85,247,0.03)",
    formBorder:  dark ? "rgba(168,85,247,0.12)" : "rgba(168,85,247,0.12)",
    hoverBg:     dark ? "rgba(168,85,247,0.06)" : "rgba(168,85,247,0.04)",
  };
}

// ─── Avatar ───────────────────────────────────────────────────────────────────
const GRADIENTS = [
  ["#7c3aed","#4c1d95"],["#db2777","#831843"],["#0891b2","#164e63"],
  ["#059669","#064e3b"],["#d97706","#78350f"],["#dc2626","#7f1d1d"],
  ["#7c3aed","#be185d"],["#0284c7","#065f46"],["#9333ea","#0e7490"],
  ["#be185d","#7c3aed"],["#0f766e","#1e40af"],["#b45309","#92400e"],
  ["#6d28d9","#1e3a8a"],["#be123c","#9f1239"],["#0369a1","#1d4ed8"],
  ["#047857","#0f4c3a"],["#c2410c","#7c2d12"],["#7e22ce","#4a044e"],
  ["#0c4a6e","#134e4a"],["#92400e","#451a03"],
];
function avatarColors(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  const [a, b] = GRADIENTS[Math.abs(h) % GRADIENTS.length];
  return `linear-gradient(135deg, ${a}, ${b})`;
}
function initials(name: string) {
  return name.trim().split(/\s+/).map(w => w[0]).join("").slice(0, 2).toUpperCase();
}
function Avatar({ name, size = 32 }: { name: string; size?: number }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%", background: avatarColors(name),
      flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 0.022 + "rem", fontWeight: 700, color: "#fff", letterSpacing: "0.03em",
    }}>{initials(name)}</div>
  );
}

// ─── Data types ───────────────────────────────────────────────────────────────
interface Absence {
  id: number;
  type: "sick" | "vacation" | "other";
  dateFrom?: string; dateTo?: string;
  repeat?: "once" | "weekly" | "monthly";
  onceDate?: string;
  weekDays?: number[]; monthDays?: number[];
  timeFrom?: string; timeTo?: string;
}

interface TimePreference {
  id: number;
  prefer: "prefer" | "avoid";
  repeat: "daily" | "weekly" | "monthly";
  weekDays?: number[]; monthDays?: number[];
  timeFrom: string; timeTo: string;
}

interface SocialPref {
  id: number;
  targetEmpId: number;
  targetName: string;
  type: "with" | "without";
}

interface EmpData {
  id: number; name: string;
  roles: string[];
  absences: Absence[];
  hired: string; fired: string;
  timePrefs: TimePreference[];
  socialPrefs: SocialPref[];
}

const ACTIONS = [
  { key: "roles",       icon: Tag,           label: "Роли" },
  { key: "absences",    icon: CalendarOff,   label: "Отсутствия" },
  { key: "dates",       icon: CalendarRange, label: "Найм / увольнение" },
  { key: "timePrefs",   icon: Clock3,        label: "Время" },
  { key: "socialPrefs", icon: Users2,        label: "Команда" },
];

function hasData(emp: EmpData, key: string) {
  if (key === "roles")       return (emp.roles?.length ?? 0) > 0;
  if (key === "absences")    return (emp.absences?.length ?? 0) > 0;
  if (key === "dates")       return !!emp.hired || !!emp.fired;
  if (key === "timePrefs")   return (emp.timePrefs?.length ?? 0) > 0;
  if (key === "socialPrefs") return (emp.socialPrefs?.length ?? 0) > 0;
  return false;
}

const TOTAL_STEPS = 5;

// ─── Shared UI primitives ────────────────────────────────────────────────────
function ProgressBar({ step, total }: { step: number; total: number }) {
  return (
    <div style={{ display: "flex", gap: "6px" }}>
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} style={{
          flex: 1, height: "3px", borderRadius: "99px",
          background: i < step ? "linear-gradient(90deg,#a855f7,#ec4899)" : "rgba(168,85,247,0.15)",
          transition: "background 0.3s",
        }} />
      ))}
    </div>
  );
}

function PanelHeader({ emp, label, dark }: { emp: EmpData; label: string; dark: boolean }) {
  const tc = colors(dark);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
      <Avatar name={emp.name} size={34} />
      <div>
        <p style={{ color: tc.headline, fontWeight: 600, fontSize: "1rem", margin: 0, letterSpacing: "-0.02em" }}>{emp.name}</p>
        <p style={{ color: tc.sub, fontSize: "0.75rem", margin: 0 }}>{label}</p>
      </div>
    </div>
  );
}

function Desc({ text, dark }: { text: string; dark: boolean }) {
  const tc = colors(dark);
  return <p style={{ color: tc.sub, fontSize: "0.8rem", lineHeight: 1.6, margin: "0 0 16px" }}>{text}</p>;
}

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
            padding: "6px 14px", borderRadius: "99px", border: "none", cursor: "pointer",
            background: active ? "linear-gradient(135deg,#a855f7,#ec4899)" : tc.chipBg,
            color: active ? "#fff" : tc.sub, fontSize: "0.8rem", fontWeight: 500,
            fontFamily: "'DM Sans',sans-serif", transition: "all 0.15s",
            boxShadow: active ? "0 2px 10px rgba(168,85,247,0.3)" : "none",
            outline: active ? "none" : `1px solid ${tc.rowBorder}`,
          }}>{o.label}</button>
        );
      })}
    </div>
  );
}

const WEEK_DAYS = ["Пн","Вт","Ср","Чт","Пт","Сб","Вс"];
function WeekDayPicker({ value, onChange, dark }: { value: number[]; onChange: (v: number[]) => void; dark: boolean }) {
  const tc = colors(dark);
  return (
    <div style={{ display: "flex", gap: "5px" }}>
      {WEEK_DAYS.map((d, i) => {
        const active = value.includes(i);
        return (
          <button key={i} onClick={() => onChange(active ? value.filter(x => x !== i) : [...value, i])} style={{
            width: "34px", height: "34px", borderRadius: "50%", border: "none", cursor: "pointer",
            background: active ? "linear-gradient(135deg,#a855f7,#ec4899)" : tc.chipBg,
            color: active ? "#fff" : tc.sub, fontSize: "0.72rem", fontWeight: 600,
            fontFamily: "'DM Sans',sans-serif", transition: "all 0.15s",
            outline: active ? "none" : `1px solid ${tc.rowBorder}`,
            boxShadow: active ? "0 2px 8px rgba(168,85,247,0.3)" : "none",
          }}>{d}</button>
        );
      })}
    </div>
  );
}

function MonthDayTagInput({ value, onChange, dark }: { value: number[]; onChange: (v: number[]) => void; dark: boolean }) {
  const [input, setInput] = useState("");
  const [focused, setFocused] = useState(false);
  const tc = colors(dark);

  const add = () => {
    const d = parseInt(input, 10);
    if (!isNaN(d) && d >= 1 && d <= 31 && !value.includes(d)) onChange([...value].concat(d).sort((a, b) => a - b));
    setInput("");
  };

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", alignItems: "center" }}>
      {value.map(d => (
        <div key={d} style={{
          display: "inline-flex", alignItems: "center", gap: "4px",
          padding: "4px 10px", borderRadius: "99px",
          background: "linear-gradient(135deg,rgba(168,85,247,0.18),rgba(236,72,153,0.12))",
          border: `1px solid ${dark ? "rgba(168,85,247,0.35)" : "rgba(168,85,247,0.3)"}`,
          color: dark ? "#c4b5fd" : "#7c3aed", fontSize: "0.8rem", fontWeight: 600,
        }}>
          {d}
          <button onClick={() => onChange(value.filter(x => x !== d))} style={{
            background: "none", border: "none", cursor: "pointer", padding: "0 0 0 2px",
            color: dark ? "#c4bde0" : "#a89ec0", display: "flex", lineHeight: 1,
          }}>
            <X size={11} strokeWidth={2.5} />
          </button>
        </div>
      ))}
      <div style={{
        display: "inline-flex", alignItems: "center",
        background: dark ? "rgba(168,85,247,0.06)" : "rgba(168,85,247,0.04)",
        border: `1px solid ${dark ? "rgba(168,85,247,0.2)" : "rgba(168,85,247,0.18)"}`,
        borderRadius: "99px", overflow: "hidden",
      }}>
        <div style={{ position: "relative", width: "52px" }}>
          <input
            value={input} type="text" inputMode="numeric" pattern="[0-9]*"
            onChange={e => setInput(e.target.value.replace(/\D/g, ""))}
            onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
            onKeyDown={e => { if (e.key === "Enter") add(); }}
            style={{
              width: "100%", background: "transparent", border: "none",
              padding: "5px 6px", color: dark ? "#c4b5fd" : "#7c3aed",
              fontSize: "0.8rem", fontWeight: 600, fontFamily: "'DM Sans',sans-serif",
              outline: "none", textAlign: "center",
            }}
          />
          {!input && !focused && (
            <span style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none", color: dark ? "rgba(196,181,253,0.4)" : "rgba(124,58,237,0.35)", fontSize: "0.72rem" }}>день</span>
          )}
        </div>
        <div style={{ width: "1px", height: "14px", background: dark ? "rgba(168,85,247,0.35)" : "rgba(168,85,247,0.3)", flexShrink: 0 }} />
        <button onClick={add} style={{
          background: "none", border: "none", cursor: "pointer",
          padding: "5px 9px", display: "flex", alignItems: "center",
          color: dark ? "#c4b5fd" : "#7c3aed", transition: "opacity 0.15s",
        }}
          onMouseEnter={e => (e.currentTarget.style.opacity = "0.6")}
          onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
        >
          <Plus size={13} strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
}

function StyledInput({ value, onChange, type = "text", placeholder, dark, style }: {
  value: string; onChange: (v: string) => void;
  type?: string; placeholder?: string; dark: boolean; style?: React.CSSProperties;
}) {
  const [focused, setFocused] = useState(false);
  const tc = colors(dark);
  return (
    <input type={type} value={value} placeholder={placeholder}
      onChange={e => onChange(e.target.value)}
      onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
      style={{
        background: tc.inputBg, border: `1.5px solid ${focused ? "#a855f7" : tc.inputBorder}`,
        borderRadius: "10px", padding: "11px 14px", color: tc.headline,
        fontSize: "0.9rem", fontFamily: "'DM Sans',sans-serif",
        outline: "none", transition: "border-color 0.18s", boxSizing: "border-box",
        ...style,
      }}
    />
  );
}

function AddBtn({ label, onClick, dark }: { label: string; onClick: () => void; dark: boolean }) {
  const tc = colors(dark);
  return (
    <button onClick={onClick} style={{
      display: "inline-flex", alignItems: "center", gap: "6px",
      background: "none", border: `1.5px dashed ${tc.inputBorder}`,
      borderRadius: "10px", padding: "10px 14px", cursor: "pointer",
      color: tc.sub, fontSize: "0.85rem", fontFamily: "'DM Sans',sans-serif",
      width: "100%", justifyContent: "center", transition: "all 0.15s",
    }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = "#a855f7"; e.currentTarget.style.color = dark ? "#c4b5fd" : "#7c3aed"; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = tc.inputBorder; e.currentTarget.style.color = tc.sub; }}
    >
      <Plus size={14} strokeWidth={2} />{label}
    </button>
  );
}

function ItemRow({ label, sub, onDelete, dark }: { label: string; sub?: string; onDelete: () => void; dark: boolean }) {
  const tc = colors(dark);
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: "10px",
      padding: "9px 10px", borderRadius: "10px",
      border: `1px solid ${tc.rowBorder}`, marginBottom: "6px",
    }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ color: tc.headline, fontSize: "0.85rem", fontWeight: 500, margin: 0 }}>{label}</p>
        {sub && <p style={{ color: tc.sub, fontSize: "0.75rem", margin: "2px 0 0" }}>{sub}</p>}
      </div>
      <button onClick={onDelete} style={{
        background: "none", border: "none", cursor: "pointer", padding: "4px",
        color: tc.iconMuted, display: "flex", borderRadius: "6px", transition: "color 0.15s", flexShrink: 0,
      }}
        onMouseEnter={e => (e.currentTarget.style.color = "#f87171")}
        onMouseLeave={e => (e.currentTarget.style.color = tc.iconMuted)}
      ><Trash2 size={13} strokeWidth={1.8} /></button>
    </div>
  );
}

function FormBox({ children, dark }: { children: React.ReactNode; dark: boolean }) {
  const tc = colors(dark);
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
      style={{
        background: tc.formBg, border: `1px solid ${tc.formBorder}`,
        borderRadius: "12px", padding: "14px", display: "flex",
        flexDirection: "column", gap: "12px", marginBottom: "12px",
      }}
    >{children}</motion.div>
  );
}

function Label({ text, dark }: { text: string; dark: boolean }) {
  return <p style={{ color: colors(dark).sub, fontSize: "0.75rem", margin: "0 0 4px", fontWeight: 500, letterSpacing: "0.02em" }}>{text}</p>;
}

function SaveBtn({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{
      padding: "10px 20px", borderRadius: "10px", border: "none", cursor: "pointer",
      background: "linear-gradient(135deg,#a855f7,#ec4899)",
      color: "#fff", fontSize: "0.875rem", fontWeight: 500,
      fontFamily: "'DM Sans',sans-serif", alignSelf: "flex-end",
      boxShadow: "0 3px 12px rgba(168,85,247,0.3)", transition: "all 0.15s",
    }}
      onMouseEnter={e => { e.currentTarget.style.filter = "brightness(1.07)"; }}
      onMouseLeave={e => { e.currentTarget.style.filter = "brightness(1)"; }}
    >{label}</button>
  );
}

// ─── Roles panel ──────────────────────────────────────────────────────────────
function RolesPanel({ emp, globalRoles, onToggleRole, onAddRole, dark }: {
  emp: EmpData; globalRoles: string[];
  onToggleRole: (empId: number, role: string) => void;
  onAddRole: (role: string) => void; dark: boolean;
}) {
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const tc = colors(dark);
  useEffect(() => { setTimeout(() => searchRef.current?.focus(), 150); }, []);

  const q = query.trim().toLowerCase();
  const filtered = globalRoles.filter(r => r.toLowerCase().includes(q));
  const exactMatch = globalRoles.some(r => r.toLowerCase() === q);
  const showAdd = q.length > 0 && !exactMatch;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", minHeight: 0 }}>
      <PanelHeader emp={emp} label="Роли" dark={dark} />

      <div style={{ position: "relative", marginBottom: "10px" }}>
        <Search size={14} strokeWidth={1.8} style={{ position: "absolute", left: "13px", top: "50%", transform: "translateY(-50%)", color: focused ? "#a855f7" : tc.iconMuted, pointerEvents: "none", transition: "color 0.18s" }} />
        <input ref={searchRef} value={query} onChange={e => setQuery(e.target.value)}
          onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
          placeholder="Поиск или новая роль…"
          style={{
            width: "100%", background: tc.inputBg, border: `1.5px solid ${focused ? "#a855f7" : tc.inputBorder}`,
            borderRadius: "10px", padding: "11px 14px 11px 36px", color: tc.headline,
            fontSize: "0.9rem", fontFamily: "'DM Sans',sans-serif", outline: "none",
            transition: "border-color 0.18s", boxSizing: "border-box",
          }}
        />
      </div>

      <div style={{ flex: 1, overflowY: "auto", minHeight: 0 }}>
        {globalRoles.length === 0 && !showAdd && (
          <div style={{ textAlign: "center", padding: "28px 0" }}>
            <Tag size={28} strokeWidth={1.2} style={{ color: tc.faint, display: "block", margin: "0 auto 10px" }} />
            <p style={{ color: tc.sub, fontSize: "0.85rem", margin: "0 0 6px", fontWeight: 500 }}>Ролей пока нет</p>
            <p style={{ color: tc.faint, fontSize: "0.78rem", margin: "0 auto", maxWidth: "260px", lineHeight: 1.55 }}>
              Роли помогают учитывать квалификацию при составлении расписания — например, бармен не заменит повара, а стажер не может работать без старшего сотрудника
            </p>
          </div>
        )}
        <AnimatePresence initial={false}>
          {filtered.map(role => {
            const active = emp.roles.includes(role);
            return (
              <motion.button key={role} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                onClick={() => onToggleRole(emp.id, role)}
                style={{ display: "flex", alignItems: "center", gap: "12px", width: "100%", padding: "10px", borderRadius: "10px", background: "none", border: "none", cursor: "pointer", fontFamily: "'DM Sans',sans-serif", transition: "background 0.12s", marginBottom: "2px" }}
                onMouseEnter={e => (e.currentTarget.style.background = colors(dark).hoverBg)}
                onMouseLeave={e => (e.currentTarget.style.background = "none")}
              >
                <div style={{ width: "18px", height: "18px", borderRadius: "5px", flexShrink: 0, background: active ? "linear-gradient(135deg,#a855f7,#ec4899)" : "transparent", border: `1.5px solid ${active ? "transparent" : colors(dark).inputBorder}`, display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.15s" }}>
                  {active && <Check size={11} strokeWidth={3} color="#fff" />}
                </div>
                <span style={{ color: active ? (dark ? "#c4b5fd" : "#7c3aed") : colors(dark).headline, fontSize: "0.9rem", fontWeight: active ? 500 : 400, flex: 1, textAlign: "left" }}>{role}</span>
              </motion.button>
            );
          })}
        </AnimatePresence>
        {showAdd && (
          <motion.button initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
            onClick={() => { onAddRole(query.trim()); onToggleRole(emp.id, query.trim()); setQuery(""); }}
            style={{ display: "flex", alignItems: "center", gap: "12px", width: "100%", padding: "10px", borderRadius: "10px", background: "none", border: "none", cursor: "pointer", fontFamily: "'DM Sans',sans-serif", transition: "background 0.12s", marginTop: filtered.length > 0 ? "4px" : 0, borderTop: filtered.length > 0 ? `1px solid ${colors(dark).divider}` : "none", paddingTop: filtered.length > 0 ? "12px" : "10px" }}
            onMouseEnter={e => (e.currentTarget.style.background = colors(dark).hoverBg)}
            onMouseLeave={e => (e.currentTarget.style.background = "none")}
          >
            <div style={{ width: "18px", height: "18px", borderRadius: "5px", flexShrink: 0, background: dark ? "rgba(168,85,247,0.15)" : "rgba(168,85,247,0.1)", border: `1.5px solid ${dark ? "rgba(168,85,247,0.3)" : "rgba(168,85,247,0.25)"}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Plus size={11} strokeWidth={2.5} style={{ color: "#a855f7" }} />
            </div>
            <span style={{ fontSize: "0.9rem", color: dark ? "#c4b5fd" : "#7c3aed", fontWeight: 500 }}>Добавить роль «{query.trim()}»</span>
          </motion.button>
        )}
      </div>
    </div>
  );
}

// ─── Absences panel ───────────────────────────────────────────────────────────
function absenceLabel(a: Absence) {
  const fmt = (d?: string) => d ? new Date(d).toLocaleDateString("ru", { day: "numeric", month: "short" }) : "—";
  const days = WEEK_DAYS;
  if (a.type === "sick")     return { main: "Больничный", sub: `${fmt(a.dateFrom)} — ${fmt(a.dateTo)}` };
  if (a.type === "vacation") return { main: "Отпуск",     sub: `${fmt(a.dateFrom)} — ${fmt(a.dateTo)}` };
  if (a.repeat === "once")    return { main: "Разовое отсутствие", sub: `${fmt(a.onceDate)}${a.timeFrom ? `, ${a.timeFrom}–${a.timeTo}` : ""}` };
  if (a.repeat === "weekly")  return { main: "Еженедельно", sub: `${(a.weekDays || []).map(i => days[i]).join(", ")}${a.timeFrom ? ` ${a.timeFrom}–${a.timeTo}` : ""}` };
  if (a.repeat === "monthly") return { main: "Ежемесячно", sub: `${(a.monthDays || []).join(", ")} числа${a.timeFrom ? ` ${a.timeFrom}–${a.timeTo}` : ""}` };
  return { main: "Отсутствие", sub: "" };
}

function AbsencesPanel({ emp, onUpdate, dark }: {
  emp: EmpData; onUpdate: (a: Absence[]) => void; dark: boolean;
}) {
  const [showForm, setShowForm] = useState(false);
  const [type, setType]       = useState<"sick"|"vacation"|"other">("sick");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo]     = useState("");
  const [repeat, setRepeat]     = useState<"once"|"weekly"|"monthly">("once");
  const [weekDays, setWeekDays] = useState<number[]>([]);
  const [monthDays, setMonthDays] = useState<number[]>([]);
  const [onceDate, setOnceDate] = useState("");
  const [timeFrom, setTimeFrom] = useState("");
  const [timeTo, setTimeTo]     = useState("");
  const tc = colors(dark);
  let nextId = useRef(100);

  const reset = () => { setType("sick"); setDateFrom(""); setDateTo(""); setRepeat("once"); setWeekDays([]); setMonthDays([]); setOnceDate(""); setTimeFrom(""); setTimeTo(""); setShowForm(false); };

  const canAdd = type === "sick" || type === "vacation"
    ? (!!dateFrom && !!dateTo)
    : repeat === "once" ? !!onceDate
    : repeat === "weekly" ? weekDays.length > 0
    : monthDays.length > 0;

  const handleAdd = () => {
    if (!canAdd) return;
    const a: Absence = { id: nextId.current++, type, dateFrom, dateTo, repeat, onceDate, weekDays, monthDays, timeFrom: timeFrom || undefined, timeTo: timeTo || undefined };
    onUpdate([...emp.absences, a]); reset();
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", minHeight: 0 }}>
      <PanelHeader emp={emp} label="Отсутствия" dark={dark} />

      <div style={{ flex: 1, overflowY: "auto", minHeight: 0 }}>
        {emp.absences.length === 0 && !showForm && (
          <div style={{ textAlign: "center", padding: "16px 0 20px" }}>
            <CalendarOff size={28} strokeWidth={1.2} style={{ color: tc.faint, display: "block", margin: "0 auto 10px" }} />
            <p style={{ color: tc.sub, fontSize: "0.85rem", margin: "0 0 6px", fontWeight: 500 }}>Нет отсутствий</p>
            <p style={{ color: tc.faint, fontSize: "0.78rem", margin: "0 auto 16px", maxWidth: "260px", lineHeight: 1.55 }}>
              Добавьте отпуск, больничный или регулярное отсутствие. Например, ежедневное отсутствие по утрам.
            </p>
          </div>
        )}

        <AnimatePresence initial={false}>
          {emp.absences.map(a => {
            const { main, sub } = absenceLabel(a);
            return <ItemRow key={a.id} label={main} sub={sub} dark={dark} onDelete={() => onUpdate(emp.absences.filter(x => x.id !== a.id))} />;
          })}
        </AnimatePresence>

        <AnimatePresence>
          {showForm && (
            <FormBox dark={dark}>
              <div>
                <Label text="Тип отсутствия" dark={dark} />
                <Pills dark={dark} value={type} onChange={v => setType(v as any)}
                  options={[{ value: "sick", label: "Больничный" }, { value: "vacation", label: "Отпуск" }, { value: "other", label: "Другое" }]} />
              </div>

              {(type === "sick" || type === "vacation") && (
                <div style={{ display: "flex", gap: "8px" }}>
                  <div style={{ flex: 1 }}>
                    <Label text="С" dark={dark} />
                    <StyledInput type="date" value={dateFrom} onChange={setDateFrom} dark={dark} style={{ width: "100%" }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <Label text="По" dark={dark} />
                    <StyledInput type="date" value={dateTo} onChange={setDateTo} dark={dark} style={{ width: "100%" }} />
                  </div>
                </div>
              )}

              {type === "other" && (
                <>
                  <div>
                    <Label text="Повторение" dark={dark} />
                    <Pills dark={dark} value={repeat} onChange={v => setRepeat(v as any)}
                      options={[{ value: "once", label: "Разово" }, { value: "weekly", label: "Еженедельно" }, { value: "monthly", label: "Ежемесячно" }]} />
                  </div>
                  {repeat === "once" && (
                    <div>
                      <Label text="Дата" dark={dark} />
                      <StyledInput type="date" value={onceDate} onChange={setOnceDate} dark={dark} style={{ width: "100%" }} />
                    </div>
                  )}
                  {repeat === "weekly" && (
                    <div>
                      <Label text="Дни недели" dark={dark} />
                      <WeekDayPicker value={weekDays} onChange={setWeekDays} dark={dark} />
                    </div>
                  )}
                  {repeat === "monthly" && (
                    <div>
                      <Label text="Числа месяца" dark={dark} />
                      <MonthDayTagInput value={monthDays} onChange={setMonthDays} dark={dark} />
                    </div>
                  )}
                  <div style={{ display: "flex", gap: "8px" }}>
                    <div style={{ flex: 1 }}>
                      <Label text="Время с (необязательно)" dark={dark} />
                      <StyledInput type="time" value={timeFrom} onChange={setTimeFrom} dark={dark} style={{ width: "100%" }} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <Label text="Время по" dark={dark} />
                      <StyledInput type="time" value={timeTo} onChange={setTimeTo} dark={dark} style={{ width: "100%" }} />
                    </div>
                  </div>
                </>
              )}

              <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                <button onClick={reset} style={{ padding: "9px 16px", borderRadius: "10px", border: `1px solid ${tc.inputBorder}`, background: "none", color: tc.sub, fontSize: "0.85rem", cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}>Отмена</button>
                <SaveBtn label="Добавить" onClick={handleAdd} />
              </div>
            </FormBox>
          )}
        </AnimatePresence>

        {!showForm && <AddBtn label="Добавить отсутствие" onClick={() => setShowForm(true)} dark={dark} />}
      </div>
    </div>
  );
}

// ─── Hire / fire dates panel ──────────────────────────────────────────────────
function HireDatesPanel({ emp, onUpdate, dark }: {
  emp: EmpData; onUpdate: (hired: string, fired: string) => void; dark: boolean;
}) {
  const tc = colors(dark);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <PanelHeader emp={emp} label="Найм и увольнение" dark={dark} />
      <Desc text="Необязательная информация, но она позволит корректнее составить расписание и не назначить смену уволенному или ещё не вышедшему сотруднику." dark={dark} />
      <div>
        <Label text="Дата найма" dark={dark} />
        <StyledInput type="date" value={emp.hired} onChange={v => onUpdate(v, emp.fired)} dark={dark} style={{ width: "100%" }} />
      </div>
      <div>
        <Label text="Дата увольнения" dark={dark} />
        <StyledInput type="date" value={emp.fired} onChange={v => onUpdate(emp.hired, v)} dark={dark} style={{ width: "100%" }} />
      </div>
    </div>
  );
}

// ─── Time preferences panel ───────────────────────────────────────────────────
function timePrefsLabel(p: TimePreference) {
  const main = p.prefer === "prefer" ? "Удобно" : "Неудобно";
  const time = `${p.timeFrom}–${p.timeTo}`;
  if (p.repeat === "daily")   return { main, sub: `Каждый день, ${time}` };
  if (p.repeat === "weekly")  return { main, sub: `${(p.weekDays || []).map(i => WEEK_DAYS[i]).join(", ")}, ${time}` };
  if (p.repeat === "monthly") return { main, sub: `${(p.monthDays || []).join(", ")} числа, ${time}` };
  return { main, sub: time };
}

function TimePrefsPanel({ emp, onUpdate, dark }: {
  emp: EmpData; onUpdate: (p: TimePreference[]) => void; dark: boolean;
}) {
  const [showForm, setShowForm] = useState(false);
  const [prefer, setPrefer] = useState<"prefer"|"avoid">("prefer");
  const [repeat, setRepeat] = useState<"daily"|"weekly"|"monthly">("daily");
  const [weekDays, setWeekDays] = useState<number[]>([]);
  const [monthDays, setMonthDays] = useState<number[]>([]);
  const [timeFrom, setTimeFrom] = useState("");
  const [timeTo, setTimeTo] = useState("");
  const tc = colors(dark);
  const nextId = useRef(200);

  const reset = () => { setPrefer("prefer"); setRepeat("daily"); setWeekDays([]); setMonthDays([]); setTimeFrom(""); setTimeTo(""); setShowForm(false); };

  const canAdd = !!timeFrom && !!timeTo && (repeat === "daily" || (repeat === "weekly" && weekDays.length > 0) || (repeat === "monthly" && monthDays.length > 0));

  const handleAdd = () => {
    if (!canAdd) return;
    const p: TimePreference = { id: nextId.current++, prefer, repeat, weekDays, monthDays, timeFrom, timeTo };
    onUpdate([...emp.timePrefs, p]); reset();
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", minHeight: 0 }}>
      <PanelHeader emp={emp} label="Временные предпочтения" dark={dark} />

      <div style={{ flex: 1, overflowY: "auto", minHeight: 0 }}>
        {emp.timePrefs.length === 0 && !showForm && (
          <div style={{ textAlign: "center", padding: "16px 0 20px" }}>
            <Clock3 size={28} strokeWidth={1.2} style={{ color: tc.faint, display: "block", margin: "0 auto 10px" }} />
            <p style={{ color: tc.sub, fontSize: "0.85rem", margin: "0 0 6px", fontWeight: 500 }}>Предпочтений нет</p>
            <p style={{ color: tc.faint, fontSize: "0.78rem", margin: "0 auto 16px", maxWidth: "260px", lineHeight: 1.55 }}>
              Укажите, когда сотруднику удобно или неудобно работать. Постараемся учесть при генерации — но это мягкое условие, не жёсткое.
            </p>
          </div>
        )}

        <AnimatePresence initial={false}>
          {emp.timePrefs.map(p => {
            const { main, sub } = timePrefsLabel(p);
            return <ItemRow key={p.id} label={main} sub={sub} dark={dark} onDelete={() => onUpdate(emp.timePrefs.filter(x => x.id !== p.id))} />;
          })}
        </AnimatePresence>

        <AnimatePresence>
          {showForm && (
            <FormBox dark={dark}>
              <div>
                <Label text="Тип" dark={dark} />
                <Pills dark={dark} value={prefer} onChange={v => setPrefer(v as any)}
                  options={[{ value: "prefer", label: "Удобно работать" }, { value: "avoid", label: "Неудобно работать" }]} />
              </div>
              <div>
                <Label text="Повторение" dark={dark} />
                <Pills dark={dark} value={repeat} onChange={v => setRepeat(v as any)}
                  options={[{ value: "daily", label: "Каждый день" }, { value: "weekly", label: "По дням недели" }, { value: "monthly", label: "По дням месяца" }]} />
              </div>
              {repeat === "weekly" && (
                <div>
                  <Label text="Дни недели" dark={dark} />
                  <WeekDayPicker value={weekDays} onChange={setWeekDays} dark={dark} />
                </div>
              )}
              {repeat === "monthly" && (
                <div>
                  <Label text="Числа месяца" dark={dark} />
                  <MonthDayTagInput value={monthDays} onChange={setMonthDays} dark={dark} />
                </div>
              )}
              <div style={{ display: "flex", gap: "8px" }}>
                <div style={{ flex: 1 }}>
                  <Label text="С" dark={dark} />
                  <StyledInput type="time" value={timeFrom} onChange={setTimeFrom} dark={dark} style={{ width: "100%" }} />
                </div>
                <div style={{ flex: 1 }}>
                  <Label text="По" dark={dark} />
                  <StyledInput type="time" value={timeTo} onChange={setTimeTo} dark={dark} style={{ width: "100%" }} />
                </div>
              </div>
              <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                <button onClick={reset} style={{ padding: "9px 16px", borderRadius: "10px", border: `1px solid ${colors(dark).inputBorder}`, background: "none", color: colors(dark).sub, fontSize: "0.85rem", cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}>Отмена</button>
                <SaveBtn label="Добавить" onClick={handleAdd} />
              </div>
            </FormBox>
          )}
        </AnimatePresence>

        {!showForm && <AddBtn label="Добавить предпочтение" onClick={() => setShowForm(true)} dark={dark} />}
      </div>
    </div>
  );
}

// ─── Social preferences panel ─────────────────────────────────────────────────
function SocialPrefsPanel({ emp, allEmployees, onUpdate, dark }: {
  emp: EmpData; allEmployees: EmpData[];
  onUpdate: (p: SocialPref[]) => void; dark: boolean;
}) {
  const tc = colors(dark);
  const others = allEmployees.filter(e => e.id !== emp.id);
  const nextId = useRef(300);

  const getPref = (targetId: number) => emp.socialPrefs.find(p => p.targetEmpId === targetId);

  const setType = (targetEmp: EmpData, type: "with" | "without" | null) => {
    const without = emp.socialPrefs.filter(p => p.targetEmpId !== targetEmp.id);
    if (!type) { onUpdate(without); return; }
    onUpdate([...without, { id: nextId.current++, targetEmpId: targetEmp.id, targetName: targetEmp.name, type }]);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", minHeight: 0 }}>
      <PanelHeader emp={emp} label="Социальные предпочтения" dark={dark} />
      <Desc text="Укажите, с кем сотрудник хочет или не хочет работать в смену. Постараемся учесть при составлении расписания, но это мягкое условие." dark={dark} />

      <div style={{ flex: 1, overflowY: "auto", minHeight: 0 }}>
        {others.length === 0 ? (
          <div style={{ textAlign: "center", padding: "20px 0" }}>
            <Users2 size={28} strokeWidth={1.2} style={{ color: tc.faint, display: "block", margin: "0 auto 10px" }} />
            <p style={{ color: tc.sub, fontSize: "0.85rem", margin: "0 0 4px", fontWeight: 500 }}>Нет других сотрудников</p>
            <p style={{ color: tc.faint, fontSize: "0.78rem", margin: 0, lineHeight: 1.55 }}>Добавьте ещё одного сотрудника, чтобы настроить предпочтения</p>
          </div>
        ) : others.map(other => {
          const pref = getPref(other.id);
          const isWith    = pref?.type === "with";
          const isWithout = pref?.type === "without";
          const btnBase = { padding: "6px 12px", borderRadius: "99px", border: "none", cursor: "pointer", fontSize: "0.75rem", fontWeight: 500, fontFamily: "'DM Sans',sans-serif", transition: "all 0.15s", display: "inline-flex", alignItems: "center", gap: "4px" };

          return (
            <div key={other.id} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "9px 10px", borderRadius: "10px", border: `1px solid ${tc.rowBorder}`, marginBottom: "6px" }}>
              <Avatar name={other.name} size={30} />
              <span style={{ flex: 1, color: tc.headline, fontSize: "0.88rem", fontWeight: 500 }}>{other.name}</span>
              <div style={{ display: "flex", gap: "5px" }}>
                <button onClick={() => setType(other, isWith ? null : "with")} style={{ ...btnBase, background: isWith ? "linear-gradient(135deg,#10b981,#047857)" : tc.chipBg, color: isWith ? "#fff" : tc.sub, outline: isWith ? "none" : `1px solid ${tc.rowBorder}`, boxShadow: isWith ? "0 2px 8px rgba(16,185,129,0.3)" : "none" }}>
                  <ThumbsUp size={11} strokeWidth={2} /> Вместе
                </button>
                <button onClick={() => setType(other, isWithout ? null : "without")} style={{ ...btnBase, background: isWithout ? "linear-gradient(135deg,#ef4444,#b91c1c)" : tc.chipBg, color: isWithout ? "#fff" : tc.sub, outline: isWithout ? "none" : `1px solid ${tc.rowBorder}`, boxShadow: isWithout ? "0 2px 8px rgba(239,68,68,0.3)" : "none" }}>
                  <ThumbsDown size={11} strokeWidth={2} /> Раздельно
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Step 1 ───────────────────────────────────────────────────────────────────
function StepOne({ name, onChange, inputRef, dark }: { name: string; onChange: (v: string) => void; inputRef: RefObject<HTMLInputElement>; dark: boolean }) {
  const [focused, setFocused] = useState(false);
  const tc = colors(dark);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      <div style={{ marginBottom: "8px" }}>
        <p style={{ color: tc.headline, fontSize: "1.5rem", fontWeight: 400, margin: "0 0 6px", letterSpacing: "-0.04em", lineHeight: 1.2 }}>
          Пара шагов до готового расписания
        </p>
        <p style={{ color: tc.sub, fontSize: "0.82rem", margin: 0, lineHeight: 1.6 }}>
          Расскажите о команде — Shifty сгенерирует расписание с учётом всех условий
        </p>
      </div>
      <p style={{ color: tc.headline, fontWeight: 600, fontSize: "1.15rem", margin: "0 0 4px", letterSpacing: "-0.03em" }}>Название расписания</p>
      <input ref={inputRef} value={name} onChange={e => onChange(e.target.value)}
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        placeholder="Например, магазин на ул. Юности"
        style={{ width: "100%", background: tc.inputBg, border: `1.5px solid ${focused ? "#a855f7" : tc.inputBorder}`, borderRadius: "10px", padding: "13px 16px", color: tc.headline, fontSize: "0.95rem", fontFamily: "'DM Sans',sans-serif", outline: "none", transition: "border-color 0.18s", boxSizing: "border-box" }}
      />
    </div>
  );
}

// ─── Employee row ─────────────────────────────────────────────────────────────
function EmployeeRow({ emp, dark, onDelete, onChipClick }: { emp: EmpData; dark: boolean; onDelete: () => void; onChipClick: (key: string) => void }) {
  const tc = colors(dark);
  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -12 }} transition={{ duration: 0.18 }}
      style={{ display: "flex", flexDirection: "column", gap: "8px", padding: "10px", borderRadius: "10px", border: `1px solid ${tc.rowBorder}`, marginBottom: "6px" }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <Avatar name={emp.name} size={32} />
        <span style={{ flex: 1, color: tc.headline, fontSize: "0.9rem", fontWeight: 500, letterSpacing: "-0.01em" }}>{emp.name}</span>
        <button onClick={onDelete} style={{ background: "none", border: "none", cursor: "pointer", padding: "4px", borderRadius: "6px", display: "flex", color: tc.iconMuted, transition: "color 0.15s", flexShrink: 0 }}
          onMouseEnter={e => (e.currentTarget.style.color = "#f87171")} onMouseLeave={e => (e.currentTarget.style.color = tc.iconMuted)}
        ><Trash2 size={13} strokeWidth={1.8} /></button>
      </div>
      <div style={{ display: "flex", gap: "5px", flexWrap: "wrap" }}>
        {ACTIONS.map(({ key, icon: Icon, label }) => {
          const active = hasData(emp, key);
          return (
            <button key={key} onClick={() => onChipClick(key)} style={{
              display: "inline-flex", alignItems: "center", gap: "5px",
              padding: "4px 10px", borderRadius: "99px", cursor: "pointer",
              background: active ? tc.chipActiveBg : tc.chipBg,
              border: `1px solid ${active ? tc.chipActiveBorder : tc.rowBorder}`,
              color: active ? tc.chipActiveFg : (dark ? "#c4bde0" : "#8878aa"),
              fontSize: "0.72rem", fontWeight: 500, fontFamily: "'DM Sans',sans-serif",
              transition: "all 0.15s", whiteSpace: "nowrap",
            }}
              onMouseEnter={e => { e.currentTarget.style.background = tc.chipActiveBg; e.currentTarget.style.borderColor = tc.chipActiveBorder; e.currentTarget.style.color = tc.chipActiveFg; }}
              onMouseLeave={e => { e.currentTarget.style.background = active ? tc.chipActiveBg : tc.chipBg; e.currentTarget.style.borderColor = active ? tc.chipActiveBorder : tc.rowBorder; e.currentTarget.style.color = active ? tc.chipActiveFg : (dark ? "#c4bde0" : "#8878aa"); }}
            >
              <Icon size={11} strokeWidth={1.8} />{label}
            </button>
          );
        })}
      </div>
    </motion.div>
  );
}

// ─── Step 2 ───────────────────────────────────────────────────────────────────
function StepTwo({ employees, globalRoles, onAdd, onDelete, onToggleRole, onAddRole, onUpdateEmp, dark, editing, setEditing }: {
  employees: EmpData[]; globalRoles: string[];
  onAdd: (name: string) => void; onDelete: (id: number) => void;
  onToggleRole: (empId: number, role: string) => void;
  onAddRole: (role: string) => void;
  onUpdateEmp: (id: number, patch: Partial<EmpData>) => void;
  dark: boolean;
  editing: { empId: number; feature: string } | null;
  setEditing: (v: { empId: number; feature: string } | null) => void;
}) {
  const [inputVal, setInputVal] = useState("");
  const [focused, setFocused] = useState(false);
  const addRef = useRef<HTMLInputElement>(null);
  const tc = colors(dark);

  const handleAdd = () => { const t = inputVal.trim(); if (!t) return; onAdd(t); setInputVal(""); addRef.current?.focus(); };
  const editingEmp = editing ? employees.find(e => e.id === editing.empId) : null;

  const renderFeature = () => {
    if (!editingEmp) return null;
    if (editing!.feature === "roles")       return <RolesPanel emp={editingEmp} globalRoles={globalRoles} onToggleRole={onToggleRole} onAddRole={onAddRole} dark={dark} />;
    if (editing!.feature === "absences")    return <AbsencesPanel emp={editingEmp} onUpdate={a => onUpdateEmp(editingEmp.id, { absences: a })} dark={dark} />;
    if (editing!.feature === "dates")       return <HireDatesPanel emp={editingEmp} onUpdate={(h, f) => onUpdateEmp(editingEmp.id, { hired: h, fired: f })} dark={dark} />;
    if (editing!.feature === "timePrefs")   return <TimePrefsPanel emp={editingEmp} onUpdate={p => onUpdateEmp(editingEmp.id, { timePrefs: p })} dark={dark} />;
    if (editing!.feature === "socialPrefs") return <SocialPrefsPanel emp={editingEmp} allEmployees={employees} onUpdate={p => onUpdateEmp(editingEmp.id, { socialPrefs: p })} dark={dark} />;
    return null;
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", minHeight: 0 }}>
      <AnimatePresence mode="wait">
        {editing && editingEmp ? (
          <motion.div key="feature" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 24 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            style={{ display: "flex", flexDirection: "column", height: "100%", minHeight: 0, flex: 1 }}
          >
            {renderFeature()}
          </motion.div>
        ) : (
          <motion.div key="list" initial={{ opacity: 0, x: -24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            style={{ display: "flex", flexDirection: "column", gap: "14px", height: "100%", minHeight: 0, flex: 1 }}
          >
            <p style={{ color: tc.headline, fontWeight: 600, fontSize: "1.15rem", margin: 0, letterSpacing: "-0.03em" }}>Сотрудники</p>
            <div style={{ display: "flex", gap: "8px" }}>
              <input ref={addRef} value={inputVal} onChange={e => setInputVal(e.target.value)}
                onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
                onKeyDown={e => { if (e.key === "Enter") handleAdd(); }}
                placeholder="Имя сотрудника"
                style={{ flex: 1, background: tc.inputBg, border: `1.5px solid ${focused ? "#a855f7" : tc.inputBorder}`, borderRadius: "10px", padding: "13px 16px", color: tc.headline, fontSize: "0.95rem", fontFamily: "'DM Sans',sans-serif", outline: "none", transition: "border-color 0.18s", boxSizing: "border-box" }}
              />
              <button onClick={handleAdd} style={{ background: inputVal.trim() ? "linear-gradient(135deg,#a855f7,#ec4899)" : (dark ? "rgba(168,85,247,0.08)" : "rgba(168,85,247,0.06)"), border: `1.5px solid ${inputVal.trim() ? "transparent" : tc.inputBorder}`, borderRadius: "10px", cursor: inputVal.trim() ? "pointer" : "default", padding: "0 16px", display: "flex", alignItems: "center", color: inputVal.trim() ? "#fff" : tc.iconMuted, transition: "all 0.18s", flexShrink: 0 }}>
                <Plus size={18} strokeWidth={2} />
              </button>
            </div>
            <div style={{ flex: 1, overflowY: "auto", minHeight: 0 }}>
              <AnimatePresence>
                {employees.length === 0 ? (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ textAlign: "center", padding: "28px 0 16px" }}>
                    <UserRound size={32} strokeWidth={1.2} style={{ color: tc.faint, display: "block", margin: "0 auto 10px" }} />
                    <p style={{ color: tc.sub, fontSize: "0.85rem", margin: "0 0 3px", fontWeight: 500 }}>Пока никого нет</p>
                    <p style={{ color: tc.faint, fontSize: "0.78rem", margin: 0 }}>Добавьте первого сотрудника выше</p>
                  </motion.div>
                ) : employees.map(emp => (
                  <EmployeeRow key={emp.id} emp={emp} dark={dark}
                    onDelete={() => onDelete(emp.id)}
                    onChipClick={key => setEditing({ empId: emp.id, feature: key })}
                  />
                ))}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Wizard shell ─────────────────────────────────────────────────────────────
interface WizardProps { open: boolean; onClose: () => void; dark: boolean; }

export function Wizard({ open, onClose, dark }: WizardProps) {
  const [step, setStep]           = useState(1);
  const [scheduleName, setScheduleName] = useState("");
  const [employees, setEmployees] = useState<EmpData[]>([]);
  const [globalRoles, setGlobalRoles] = useState<string[]>([]);
  const [nextId, setNextId]       = useState(1);
  const [step3Data, setStep3Data] = useState<Step3Data>(defaultStep3());
  const [step5Data, setStep5Data] = useState<Step5Data>(defaultStep5());
  const [editing, setEditing]     = useState<{ empId: number; feature: string } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const hasName = scheduleName.trim().length > 0;

  useEffect(() => {
    if (open) { setStep(1); setScheduleName(""); setEmployees([]); setGlobalRoles([]); setEditing(null); setStep3Data(defaultStep3()); setStep5Data(defaultStep5()); setTimeout(() => inputRef.current?.focus(), 300); }
  }, [open]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", h); return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  const addEmployee = (name: string) => {
    setEmployees(p => [...p, { id: nextId, name, roles: [], absences: [], hired: "", fired: "", timePrefs: [], socialPrefs: [] }]);
    setNextId(n => n + 1);
  };

  const toggleRole = (empId: number, role: string) => {
    setEmployees(p => p.map(e => e.id !== empId ? e : { ...e, roles: e.roles.includes(role) ? e.roles.filter(r => r !== role) : [...e.roles, role] }));
  };

  const updateEmp = (id: number, patch: Partial<EmpData>) => {
    setEmployees(p => p.map(e => e.id !== id ? e : { ...e, ...patch }));
  };

  const bg        = dark ? "#111018" : "#ffffff";
  const border    = dark ? "rgba(168,85,247,0.12)" : "rgba(168,85,247,0.14)";
  const stepLabel = dark ? "#c4bde0" : "#a89ec0";
  const overlayBg = dark ? "rgba(0,0,0,0.65)" : "rgba(15,10,30,0.35)";

  const inFeature   = step === 2 && editing !== null;
  const editingEmp  = inFeature ? employees.find(e => e.id === editing!.empId) : null;
  const featureHasData = editingEmp ? hasData(editingEmp, editing!.feature) : false;
  const btnDisabled = inFeature && editing!.feature === "roles" && !featureHasData;

  const featureLabels: Record<string, string> = { roles: "Сохранить роли", absences: "Сохранить", dates: "Готово", timePrefs: "Сохранить", socialPrefs: "Сохранить" };
  const rightBtnLabel = inFeature
    ? (featureLabels[editing!.feature] ?? "Сохранить")
    : step === 5 ? "Составить расписание"
    : step === 1 && !hasName ? "Продолжить без названия"
    : "Продолжить";

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} onClick={onClose}
            style={{ position: "fixed", inset: 0, background: overlayBg, backdropFilter: "blur(6px)", zIndex: 50 }} />

          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 24 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            onClick={e => e.stopPropagation()} className="wizard-modal"
            style={{ position: "fixed", zIndex: 51, background: bg, display: "flex", flexDirection: "column", boxSizing: "border-box", top: 0, left: 0, right: 0, bottom: 0, borderRadius: 0, padding: "28px 24px 36px" }}
          >
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
              <span style={{ color: stepLabel, fontSize: "0.78rem", letterSpacing: "0.04em" }}>Шаг {step}/{TOTAL_STEPS}</span>
              <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", padding: "4px", color: stepLabel, display: "flex" }}><X size={16} /></button>
            </div>

            <div style={{ marginBottom: "32px" }}><ProgressBar step={step} total={TOTAL_STEPS} /></div>

            {/* Content */}
            <div style={{ flex: 1, minHeight: 0, overflow: "hidden", display: "flex", flexDirection: "column" }}>
              <AnimatePresence mode="wait">
                <motion.div key={step} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }}
                  transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                  style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}
                >
                  {step === 1 && <StepOne name={scheduleName} onChange={setScheduleName} inputRef={inputRef} dark={dark} />}
                  {step === 2 && (
                    <StepTwo employees={employees} globalRoles={globalRoles}
                      onAdd={addEmployee} onDelete={id => setEmployees(p => p.filter(e => e.id !== id))}
                      onToggleRole={toggleRole} onAddRole={r => setGlobalRoles(p => p.includes(r) ? p : [...p, r])}
                      onUpdateEmp={updateEmp} dark={dark} editing={editing} setEditing={setEditing}
                    />
                  )}
                  {step === 3 && <StepThree data={step3Data} onChange={setStep3Data} dark={dark} />}
                  {step === 4 && <StepFour data={step3Data} onChange={setStep3Data} globalRoles={globalRoles} onGoToStep={setStep} dark={dark} />}
                  {step === 5 && <StepFive data={step5Data} onChange={setStep5Data} dark={dark} />}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Footer */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: "20px" }}>
              <a onClick={() => inFeature ? setEditing(null) : step > 1 ? setStep(s => s - 1) : undefined}
                style={{ display: "inline-flex", alignItems: "center", gap: "3px", color: inFeature ? (dark ? "#c4b5fd" : "#7c3aed") : stepLabel, fontSize: "0.875rem", cursor: step > 1 || inFeature ? "pointer" : "default", textDecoration: "none", transition: "opacity 0.15s", visibility: step > 1 || inFeature ? "visible" : "hidden" }}
                onMouseEnter={e => ((e.currentTarget as HTMLElement).style.opacity = "0.7")}
                onMouseLeave={e => ((e.currentTarget as HTMLElement).style.opacity = "1")}
              >
                {(step > 1 || inFeature) && <ChevronLeft size={14} strokeWidth={2.5} />}
                {inFeature ? "К списку сотрудников" : "Назад"}
              </a>

              <button disabled={btnDisabled}
                onClick={() => {
                  if (inFeature) { setEditing(null); return; }
                  if (step === 5) { alert("Иди нахуй, открываешь excel и составляешь ручками"); return; }
                  setStep(s => Math.min(s + 1, TOTAL_STEPS));
                }}
                style={{ display: "inline-flex", alignItems: "center", padding: "13px 16px", borderRadius: "10px", background: btnDisabled ? (dark ? "rgba(168,85,247,0.12)" : "rgba(168,85,247,0.08)") : "linear-gradient(135deg,#a855f7 0%,#ec4899 100%)", color: btnDisabled ? (dark ? "#4a4468" : "#c4b8d8") : "#fff", fontSize: "0.95rem", fontWeight: 500, border: "none", cursor: btnDisabled ? "default" : "pointer", fontFamily: "'DM Sans',sans-serif", boxShadow: btnDisabled ? "none" : "0 4px 20px rgba(168,85,247,0.3)", transition: "all 0.18s ease", whiteSpace: "nowrap" }}
                onMouseEnter={e => { if (!btnDisabled) { e.currentTarget.style.filter = "brightness(1.07)"; e.currentTarget.style.boxShadow = "0 6px 28px rgba(168,85,247,0.45)"; } }}
                onMouseLeave={e => { e.currentTarget.style.filter = "brightness(1)"; e.currentTarget.style.boxShadow = btnDisabled ? "none" : "0 4px 20px rgba(168,85,247,0.3)"; }}
              >{rightBtnLabel}</button>
            </div>
          </motion.div>

          <style>{`
            @media (min-width: 768px) {
              .wizard-modal {
                top: 50% !important; left: 50% !important;
                right: auto !important; bottom: auto !important;
                transform: translate(-50%, -50%) !important;
                width: 540px !important; max-height: 88vh !important;
                border-radius: 20px !important; padding: 32px !important;
                border: 1px solid ${border};
                box-shadow: ${dark ? "0 24px 80px rgba(0,0,0,0.6)" : "0 24px 80px rgba(15,10,30,0.16)"};
              }
            }
          `}</style>
        </>
      )}
    </AnimatePresence>
  );
}
