import { useState, useRef } from "react";
import { Plus, X, Clock, CalendarX, Timer, Shuffle } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
export interface Break5    { id: number; from: string; to: string; }
export interface DayOff5   { id: number; date: string; }

export interface Step5Data {
  breaks:       Break5[];
  daysOff:      DayOff5[];
  minRestHours: number;
  periodic:     boolean;
}

export function defaultStep5(): Step5Data {
  return { breaks: [], daysOff: [], minRestHours: 8, periodic: true };
}

function invalidTimeRange(from?: string, to?: string) {
  return !!from && !!to && to <= from;
}

export function hasInvalidBreakTimes(data: Step5Data) {
  return data.breaks.some(item => invalidTimeRange(item.from, item.to));
}

// ─── Colors ───────────────────────────────────────────────────────────────────
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
    chipActiveFg:     dark ? "#c4b5fd" : "#7c3aed",
    chipActiveBorder: dark ? "rgba(168,85,247,0.3)" : "rgba(168,85,247,0.25)",
    divider:          dark ? "rgba(168,85,247,0.08)" : "rgba(168,85,247,0.08)",
    sectionBg:        dark ? "rgba(168,85,247,0.04)" : "rgba(168,85,247,0.02)",
    sectionBorder:    dark ? "rgba(168,85,247,0.1)" : "rgba(168,85,247,0.08)",
  };
}

// ─── Primitives ───────────────────────────────────────────────────────────────
function SectionTitle({ icon: Icon, title, desc, dark }: { icon: any; title: string; desc: string; dark: boolean }) {
  const tc = colors(dark);
  return (
    <div style={{ marginBottom: "12px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "7px", marginBottom: "4px" }}>
        <Icon size={14} strokeWidth={2} style={{ color: dark ? "#c4b5fd" : "#7c3aed" }} />
        <span style={{ color: tc.headline, fontWeight: 600, fontSize: "0.9rem", letterSpacing: "-0.02em" }}>{title}</span>
      </div>
      <p style={{ color: tc.sub, fontSize: "0.75rem", margin: 0, lineHeight: 1.55, paddingLeft: "21px" }}>{desc}</p>
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
        borderRadius: "8px", padding: "7px 10px", color: tc.headline,
        fontSize: "0.85rem", fontFamily: "'DM Sans',sans-serif",
        outline: "none", transition: "border-color 0.18s", width: "96px",
      }}
    />
  );
}

function Tag({ label, onDelete, dark }: { label: string; onDelete: () => void; dark: boolean }) {
  const tc = colors(dark);
  return (
    <div style={{
      display: "inline-flex", alignItems: "center", gap: "5px",
      padding: "4px 8px 4px 10px", borderRadius: "99px",
      background: tc.chipBg, border: `1px solid ${tc.chipActiveBorder}`,
      color: tc.chipActiveFg, fontSize: "0.78rem", fontWeight: 500,
    }}>
      {label}
      <button onClick={onDelete} style={{
        background: "none", border: "none", cursor: "pointer",
        padding: 0, color: tc.iconMuted, display: "flex", lineHeight: 1, transition: "color 0.15s",
      }}
        onMouseEnter={e => (e.currentTarget.style.color = "#f87171")}
        onMouseLeave={e => (e.currentTarget.style.color = tc.iconMuted)}
      ><X size={11} strokeWidth={2.5} /></button>
    </div>
  );
}

function AddRowBtn({ label, onClick, dark }: { label: string; onClick: () => void; dark: boolean }) {
  const tc = colors(dark);
  return (
    <button onClick={onClick} style={{
      display: "inline-flex", alignItems: "center", gap: "5px",
      background: "none", border: `1px dashed ${tc.inputBorder}`,
      borderRadius: "8px", padding: "6px 12px", cursor: "pointer",
      color: tc.sub, fontSize: "0.78rem", fontFamily: "'DM Sans',sans-serif",
      transition: "all 0.15s",
    }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = "#a855f7"; e.currentTarget.style.color = dark ? "#c4b5fd" : "#7c3aed"; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = tc.inputBorder; e.currentTarget.style.color = tc.sub; }}
    ><Plus size={12} strokeWidth={2.5} />{label}</button>
  );
}

function Section({ children, dark }: { children: React.ReactNode; dark: boolean }) {
  const tc = colors(dark);
  return (
    <div style={{
      padding: "14px", borderRadius: "12px",
      background: tc.sectionBg, border: `1px solid ${tc.sectionBorder}`,
      marginBottom: "12px",
    }}>{children}</div>
  );
}

// ─── Toggle ───────────────────────────────────────────────────────────────────
function Toggle({ value, onChange, dark }: { value: boolean; onChange: (v: boolean) => void; dark: boolean }) {
  const tc = colors(dark);
  return (
    <button onClick={() => onChange(!value)} style={{
      width: "40px", height: "22px", borderRadius: "99px", border: "none",
      background: value ? "linear-gradient(135deg,#a855f7,#ec4899)" : tc.chipBg,
      outline: value ? "none" : `1px solid ${tc.rowBorder}`,
      cursor: "pointer", position: "relative", flexShrink: 0,
      transition: "background 0.2s",
    }}>
      <span style={{
        position: "absolute", top: "3px",
        left: value ? "21px" : "3px",
        width: "16px", height: "16px", borderRadius: "50%",
        background: "#fff", transition: "left 0.2s",
        boxShadow: "0 1px 4px rgba(0,0,0,0.25)",
      }} />
    </button>
  );
}

// ─── Step 5 ───────────────────────────────────────────────────────────────────
export function StepFive({ data, onChange, scheduleName, onScheduleNameChange, scheduleCopy, dark }: {
  data: Step5Data; onChange: (d: Step5Data) => void;
  scheduleName: string; onScheduleNameChange: (v: string) => void;
  scheduleCopy?: {
    title: string;
    desc: string;
    placeholder: string;
    pageTitle: string;
    breaksTitle: string;
    breaksDesc: string;
    addBreak: string;
    daysOffTitle: string;
    daysOffDesc: string;
    addDay: string;
    restTitle: string;
    restDesc: string;
    hours: string;
    periodicTitle: string;
    periodicDesc: string;
    periodicOn: string;
    periodicOff: string;
    add: string;
    cancel: string;
    timeError: string;
  };
  dark: boolean;
}) {
  const [addingBreak, setAddingBreak]   = useState(false);
  const [breakFrom, setBreakFrom]       = useState("");
  const [breakTo, setBreakTo]           = useState("");
  const [addingDayOff, setAddingDayOff] = useState(false);
  const [dayOffDate, setDayOffDate]     = useState("");
  const nextId = useRef(500);
  const tc = colors(dark);
  const labels = scheduleCopy ?? {
    title: "Название расписания",
    desc: "Внутреннее название, чтобы потом проще найти это расписание.",
    placeholder: "Например, магазин на ул. Юности",
    pageTitle: "Общие настройки",
    breaksTitle: "Перерывы",
    breaksDesc: "Фиксированные промежутки, когда сотрудники не работают: обед, пересменка и другие паузы.",
    addBreak: "Добавить перерыв",
    daysOffTitle: "Нерабочие дни",
    daysOffDesc: "Праздники и другие дни, когда бизнес не работает. Смены на эти даты назначаться не будут.",
    addDay: "Добавить день",
    restTitle: "Минимальный отдых между сменами",
    restDesc: "Сколько часов сотрудник должен отдыхать между двумя сменами подряд.",
    hours: "часов",
    periodicTitle: "Периодичность смен",
    periodicDesc: "Ставить сотруднику смены в одно и то же время или распределять их случайно.",
    periodicOn: "Постоянное время смен",
    periodicOff: "Случайное распределение",
    add: "Добавить",
    cancel: "Отмена",
    timeError: "Время окончания должно быть позже начала",
  };

  const [focusedDate, setFocusedDate] = useState(false);
  const [focusedRest, setFocusedRest] = useState(false);
  const [focusedName, setFocusedName] = useState(false);
  const breakInvalid = invalidTimeRange(breakFrom, breakTo);

  const addBreak = () => {
    if (!breakFrom || !breakTo || breakInvalid) return;
    onChange({ ...data, breaks: [...data.breaks, { id: nextId.current++, from: breakFrom, to: breakTo }] });
    setBreakFrom(""); setBreakTo(""); setAddingBreak(false);
  };

  const addDayOff = () => {
    if (!dayOffDate) return;
    onChange({ ...data, daysOff: [...data.daysOff, { id: nextId.current++, date: dayOffDate }] });
    setDayOffDate(""); setAddingDayOff(false);
  };

  const fmtDate = (d: string) => {
    try { return new Date(d).toLocaleDateString("ru", { day: "numeric", month: "short" }); }
    catch { return d; }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", minHeight: 0 }}>
      <p style={{ color: tc.headline, fontWeight: 600, fontSize: "1.15rem", margin: "0 0 16px", letterSpacing: "-0.03em" }}>
        {labels.pageTitle}
      </p>

      <div style={{ flex: 1, overflowY: "auto", minHeight: 0, paddingRight: "2px" }}>
        <Section dark={dark}>
          <SectionTitle icon={Clock} title={labels.title} dark={dark}
            desc={labels.desc} />
          <input type="text" value={scheduleName} onChange={e => onScheduleNameChange(e.target.value)}
            onFocus={() => setFocusedName(true)} onBlur={() => setFocusedName(false)}
            placeholder={labels.placeholder}
            style={{
              width: "100%", background: tc.inputBg,
              border: `1.5px solid ${focusedName ? "#a855f7" : tc.inputBorder}`,
              borderRadius: "10px", padding: "11px 14px", color: tc.headline,
              fontSize: "0.9rem", fontFamily: "'DM Sans',sans-serif",
              outline: "none", transition: "border-color 0.18s", boxSizing: "border-box",
            }}
          />
        </Section>

        {/* Breaks */}
        <Section dark={dark}>
          <SectionTitle icon={Timer} title={labels.breaksTitle} dark={dark}
            desc={labels.breaksDesc} />

          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: data.breaks.length > 0 ? "10px" : "0" }}>
            {data.breaks.map(b => (
              <Tag key={b.id} label={`${b.from}–${b.to}`} dark={dark}
                onDelete={() => onChange({ ...data, breaks: data.breaks.filter(x => x.id !== b.id) })} />
            ))}
          </div>

          {addingBreak ? (
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                <TimeInput value={breakFrom} onChange={setBreakFrom} dark={dark} />
                <span style={{ color: breakInvalid ? "#f87171" : tc.faint, fontSize: "0.8rem" }}>→</span>
                <TimeInput value={breakTo}   onChange={setBreakTo}   dark={dark} />
                <button onClick={addBreak} style={{
                  padding: "7px 14px", borderRadius: "8px", border: "none", cursor: breakFrom && breakTo && !breakInvalid ? "pointer" : "default",
                  background: breakFrom && breakTo && !breakInvalid ? "linear-gradient(135deg,#a855f7,#ec4899)" : tc.chipBg,
                  color: breakFrom && breakTo && !breakInvalid ? "#fff" : tc.iconMuted,
                  fontSize: "0.8rem", fontWeight: 500, fontFamily: "'DM Sans',sans-serif",
                  transition: "all 0.15s",
                }}>{labels.add}</button>
                <button onClick={() => { setAddingBreak(false); setBreakFrom(""); setBreakTo(""); }} style={{
                  background: "none", border: "none", cursor: "pointer",
                  color: tc.iconMuted, fontSize: "0.8rem", fontFamily: "'DM Sans',sans-serif",
                }}>{labels.cancel}</button>
              </div>
              {breakInvalid && (
                <div style={{
                  marginTop: "8px",
                  padding: "7px 9px",
                  borderRadius: "8px",
                  background: dark ? "rgba(248,113,113,0.08)" : "rgba(248,113,113,0.06)",
                  border: "1px solid rgba(248,113,113,0.22)",
                  color: "#f87171",
                  fontSize: "0.72rem",
                  lineHeight: 1.35,
                }}>
                  {labels.timeError}
                </div>
              )}
            </div>
          ) : (
            <AddRowBtn label={labels.addBreak} onClick={() => setAddingBreak(true)} dark={dark} />
          )}
        </Section>

        {/* Days off */}
        <Section dark={dark}>
          <SectionTitle icon={CalendarX} title={labels.daysOffTitle} dark={dark}
            desc={labels.daysOffDesc} />

          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: data.daysOff.length > 0 ? "10px" : "0" }}>
            {data.daysOff.map(d => (
              <Tag key={d.id} label={fmtDate(d.date)} dark={dark}
                onDelete={() => onChange({ ...data, daysOff: data.daysOff.filter(x => x.id !== d.id) })} />
            ))}
          </div>

          {addingDayOff ? (
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <input type="date" value={dayOffDate} onChange={e => setDayOffDate(e.target.value)}
                onFocus={() => setFocusedDate(true)} onBlur={() => setFocusedDate(false)}
                style={{
                  background: tc.inputBg, border: `1.5px solid ${focusedDate ? "#a855f7" : tc.inputBorder}`,
                  borderRadius: "8px", padding: "7px 10px", color: tc.headline,
                  fontSize: "0.85rem", fontFamily: "'DM Sans',sans-serif", outline: "none",
                  transition: "border-color 0.18s",
                }}
              />
              <button onClick={addDayOff} style={{
                padding: "7px 14px", borderRadius: "8px", border: "none", cursor: "pointer",
                background: dayOffDate ? "linear-gradient(135deg,#a855f7,#ec4899)" : tc.chipBg,
                color: dayOffDate ? "#fff" : tc.iconMuted,
                fontSize: "0.8rem", fontWeight: 500, fontFamily: "'DM Sans',sans-serif", transition: "all 0.15s",
              }}>{labels.add}</button>
              <button onClick={() => { setAddingDayOff(false); setDayOffDate(""); }} style={{
                background: "none", border: "none", cursor: "pointer",
                color: tc.iconMuted, fontSize: "0.8rem", fontFamily: "'DM Sans',sans-serif",
              }}>{labels.cancel}</button>
            </div>
          ) : (
            <AddRowBtn label={labels.addDay} onClick={() => setAddingDayOff(true)} dark={dark} />
          )}
        </Section>

        {/* Min rest */}
        <Section dark={dark}>
          <SectionTitle icon={Clock} title={labels.restTitle} dark={dark}
            desc={labels.restDesc} />
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <input type="text" inputMode="numeric" value={data.minRestHours}
              onChange={e => { const v = parseInt(e.target.value); if (!isNaN(v) && v >= 0) onChange({ ...data, minRestHours: v }); }}
              onFocus={() => setFocusedRest(true)} onBlur={() => setFocusedRest(false)}
              style={{
                width: "64px", background: tc.inputBg,
                border: `1.5px solid ${focusedRest ? "#a855f7" : tc.inputBorder}`,
                borderRadius: "8px", padding: "7px 10px", color: tc.headline,
                fontSize: "0.9rem", fontWeight: 600, fontFamily: "'DM Sans',sans-serif",
                outline: "none", textAlign: "center", transition: "border-color 0.18s",
              }}
            />
            <span style={{ color: tc.sub, fontSize: "0.85rem" }}>{labels.hours}</span>
          </div>
        </Section>

        {/* Periodicity */}
        <Section dark={dark}>
          <SectionTitle icon={Shuffle} title={labels.periodicTitle} dark={dark}
            desc={labels.periodicDesc} />
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
            <span style={{ color: data.periodic ? tc.headline : tc.sub, fontSize: "0.85rem", fontWeight: data.periodic ? 500 : 400, transition: "all 0.2s" }}>
              {data.periodic ? labels.periodicOn : labels.periodicOff}
            </span>
            <Toggle value={data.periodic} onChange={v => onChange({ ...data, periodic: v })} dark={dark} />
          </div>
        </Section>

      </div>
    </div>
  );
}
