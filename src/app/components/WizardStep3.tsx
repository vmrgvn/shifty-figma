import { useState, useRef, useEffect } from "react";
import ReactDOM from "react-dom";
import { Plus, Trash2, ChevronDown, Clock3 } from "lucide-react";
import type { LanguageCode } from "./NavMenu";

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

function invalidTimeRange(from?: string, to?: string) {
  return !!from && !!to && to <= from;
}

export function hasInvalidShiftTimes(data: Step3Data) {
  return data.configs.some(config => config.shifts.some(shift => invalidTimeRange(shift.from, shift.to)));
}

// ─── Copy ─────────────────────────────────────────────────────────────────────
type S3Copy = {
  weekDays: readonly [string,string,string,string,string,string,string];
  dayPrefix: string; daySuffix: string;
  scheduleTitle: string; scheduleHow: string;
  everyday: string; byWeekday: string; customCycle: string;
  workdaysLabel: string; cycleHint: string;
  workDay: string; dayOff: string;
  shiftsTitle: string; shiftsDesc: string;
  rolesHintPre: string; rolesHintPost: string; stepLink: string;
  activeDaysLabel: string;
  shiftsLabel: string; shiftsEmpty: string;
  deleteGroup: string; addShift: string; addGroup: string;
  roleInShift: string; noRole: string; timeError: string;
};

const s3Copy: Record<LanguageCode, S3Copy> = {
  ru: {
    weekDays: ["Пн","Вт","Ср","Чт","Пт","Сб","Вс"],
    dayPrefix: "", daySuffix: "-й",
    scheduleTitle: "График работы", scheduleHow: "Как работает бизнес?",
    everyday: "Каждый день", byWeekday: "По дням недели", customCycle: "Свой цикл",
    workdaysLabel: "Рабочие дни",
    cycleHint: "Составьте чередование рабочих и выходных. Например: 2 рабочих → 2 выходных. Максимум — 7 дней.",
    workDay: "Рабочий день", dayOff: "Выходной день",
    shiftsTitle: "Смены",
    shiftsDesc: "Если в один блок выходят несколько должностей — добавьте отдельную смену для каждой роли.",
    rolesHintPre: "Можно назначать разные роли для смен. Добавьте роли на",
    rolesHintPost: ".", stepLink: "шаге 1",
    activeDaysLabel: "Дни, для которых действует эта группа смен",
    shiftsLabel: "Смены", shiftsEmpty: "Смен нет — добавьте первую",
    deleteGroup: "Удалить группу", addShift: "Добавить смену", addGroup: "Добавить группу смен",
    roleInShift: "Роль в смене…", noRole: "— без роли",
    timeError: "Время окончания должно быть позже начала",
  },
  en: {
    weekDays: ["Mo","Tu","We","Th","Fr","Sa","Su"],
    dayPrefix: "", daySuffix: "",
    scheduleTitle: "Work schedule", scheduleHow: "How does the business operate?",
    everyday: "Every day", byWeekday: "By day of week", customCycle: "Custom cycle",
    workdaysLabel: "Working days",
    cycleHint: "Build a pattern of working and off days. E.g.: 2 work → 2 off. Maximum 7 days total.",
    workDay: "Work day", dayOff: "Day off",
    shiftsTitle: "Shifts",
    shiftsDesc: "If multiple roles work in the same time block, add a separate shift for each role.",
    rolesHintPre: "You can assign different roles to shifts. Add roles in",
    rolesHintPost: ".", stepLink: "step 1",
    activeDaysLabel: "Days this shift group applies to",
    shiftsLabel: "Shifts", shiftsEmpty: "No shifts yet — add the first one",
    deleteGroup: "Delete group", addShift: "Add shift", addGroup: "Add shift group",
    roleInShift: "Shift role…", noRole: "— no role",
    timeError: "End time must be later than start time",
  },
  kk: {
    weekDays: ["Дс","Сс","Ср","Бс","Жм","Сб","Жк"],
    dayPrefix: "", daySuffix: "",
    scheduleTitle: "Жұмыс кестесі", scheduleHow: "Бизнес қалай жұмыс істейді?",
    everyday: "Күн сайын", byWeekday: "Апта күні бойынша", customCycle: "Өз цикл",
    workdaysLabel: "Жұмыс күндері",
    cycleHint: "Жұмыс және демалыс күндерінің кезектесуін жасаңыз. Мысалы: 2 жұмыс → 2 демалыс. Максимум — 7 күн.",
    workDay: "Жұмыс күні", dayOff: "Демалыс күні",
    shiftsTitle: "Ауысымдар",
    shiftsDesc: "Бір уақыт блогында бірнеше қызмет болса — әр рөлге жеке ауысым қосыңыз.",
    rolesHintPre: "Ауысымдарға әртүрлі рөлдер тағайындауға болады. Рөлдерді",
    rolesHintPost: "қосыңыз.", stepLink: "1-қадамда",
    activeDaysLabel: "Бұл ауысым тобы қолданылатын күндер",
    shiftsLabel: "Ауысымдар", shiftsEmpty: "Ауысым жоқ — бірінші қосыңыз",
    deleteGroup: "Топты жою", addShift: "Ауысым қосу", addGroup: "Ауысым тобын қосу",
    roleInShift: "Ауысымдағы рөл…", noRole: "— рөлсіз",
    timeError: "Аяқталу уақыты басталу уақытынан кейін болуы керек",
  },
  de: {
    weekDays: ["Mo","Di","Mi","Do","Fr","Sa","So"],
    dayPrefix: "", daySuffix: ".",
    scheduleTitle: "Arbeitsplan", scheduleHow: "Wie arbeitet das Unternehmen?",
    everyday: "Jeden Tag", byWeekday: "Nach Wochentag", customCycle: "Eigener Zyklus",
    workdaysLabel: "Arbeitstage",
    cycleHint: "Erstellen Sie ein Muster aus Arbeits- und freien Tagen. Bsp: 2 Arbeit → 2 frei. Max. 7 Tage.",
    workDay: "Arbeitstag", dayOff: "Freier Tag",
    shiftsTitle: "Schichten",
    shiftsDesc: "Wenn mehrere Rollen im selben Zeitblock arbeiten, fügen Sie für jede Rolle eine separate Schicht hinzu.",
    rolesHintPre: "Sie können Schichten verschiedene Rollen zuweisen. Fügen Sie Rollen in",
    rolesHintPost: "hinzu.", stepLink: "Schritt 1",
    activeDaysLabel: "Tage, für die diese Schichtgruppe gilt",
    shiftsLabel: "Schichten", shiftsEmpty: "Noch keine Schichten — erste hinzufügen",
    deleteGroup: "Gruppe löschen", addShift: "Schicht hinzufügen", addGroup: "Schichtgruppe hinzufügen",
    roleInShift: "Rolle in der Schicht…", noRole: "— ohne Rolle",
    timeError: "Endzeit muss nach Startzeit liegen",
  },
  fr: {
    weekDays: ["Lu","Ma","Me","Je","Ve","Sa","Di"],
    dayPrefix: "", daySuffix: "",
    scheduleTitle: "Horaire de travail", scheduleHow: "Comment l'entreprise fonctionne-t-elle ?",
    everyday: "Tous les jours", byWeekday: "Par jour de la semaine", customCycle: "Cycle personnalisé",
    workdaysLabel: "Jours ouvrables",
    cycleHint: "Construisez une alternance de jours de travail et de repos. Ex : 2 travail → 2 repos. Max 7 jours.",
    workDay: "Jour de travail", dayOff: "Jour de repos",
    shiftsTitle: "Shifts",
    shiftsDesc: "Si plusieurs rôles travaillent dans le même créneau, ajoutez un shift distinct pour chaque rôle.",
    rolesHintPre: "Vous pouvez attribuer différents rôles aux shifts. Ajoutez des rôles à",
    rolesHintPost: ".", stepLink: "l'étape 1",
    activeDaysLabel: "Jours auxquels ce groupe de shifts s'applique",
    shiftsLabel: "Shifts", shiftsEmpty: "Pas encore de shifts — ajoutez le premier",
    deleteGroup: "Supprimer le groupe", addShift: "Ajouter un shift", addGroup: "Ajouter un groupe de shifts",
    roleInShift: "Rôle du shift…", noRole: "— sans rôle",
    timeError: "L'heure de fin doit être après l'heure de début",
  },
  es: {
    weekDays: ["Lu","Ma","Mi","Ju","Vi","Sá","Do"],
    dayPrefix: "", daySuffix: "°",
    scheduleTitle: "Horario de trabajo", scheduleHow: "¿Cómo opera el negocio?",
    everyday: "Cada día", byWeekday: "Por día de la semana", customCycle: "Ciclo personalizado",
    workdaysLabel: "Días laborales",
    cycleHint: "Construye una alternancia de días laborales y libres. Ej: 2 trabajo → 2 libres. Máximo 7 días.",
    workDay: "Día laboral", dayOff: "Día libre",
    shiftsTitle: "Turnos",
    shiftsDesc: "Si varios roles trabajan en el mismo bloque horario, añade un turno separado para cada rol.",
    rolesHintPre: "Puedes asignar diferentes roles a los turnos. Añade roles en",
    rolesHintPost: ".", stepLink: "el paso 1",
    activeDaysLabel: "Días a los que aplica este grupo de turnos",
    shiftsLabel: "Turnos", shiftsEmpty: "Sin turnos aún — añade el primero",
    deleteGroup: "Eliminar grupo", addShift: "Añadir turno", addGroup: "Añadir grupo de turnos",
    roleInShift: "Rol del turno…", noRole: "— sin rol",
    timeError: "La hora de fin debe ser posterior a la de inicio",
  },
  it: {
    weekDays: ["Lu","Ma","Me","Gi","Ve","Sa","Do"],
    dayPrefix: "", daySuffix: "°",
    scheduleTitle: "Orario di lavoro", scheduleHow: "Come opera l'azienda?",
    everyday: "Ogni giorno", byWeekday: "Per giorno della settimana", customCycle: "Ciclo personalizzato",
    workdaysLabel: "Giorni lavorativi",
    cycleHint: "Crea un'alternanza di giorni lavorativi e di riposo. Es: 2 lavoro → 2 riposo. Max 7 giorni.",
    workDay: "Giorno lavorativo", dayOff: "Giorno di riposo",
    shiftsTitle: "Turni",
    shiftsDesc: "Se più ruoli lavorano nello stesso blocco orario, aggiungi un turno separato per ogni ruolo.",
    rolesHintPre: "Puoi assegnare ruoli diversi ai turni. Aggiungi ruoli al",
    rolesHintPost: ".", stepLink: "passo 1",
    activeDaysLabel: "Giorni a cui si applica questo gruppo di turni",
    shiftsLabel: "Turni", shiftsEmpty: "Ancora nessun turno — aggiungi il primo",
    deleteGroup: "Elimina gruppo", addShift: "Aggiungi turno", addGroup: "Aggiungi gruppo di turni",
    roleInShift: "Ruolo nel turno…", noRole: "— nessun ruolo",
    timeError: "L'ora di fine deve essere successiva all'ora di inizio",
  },
  pt: {
    weekDays: ["Seg","Ter","Qua","Qui","Sex","Sáb","Dom"],
    dayPrefix: "", daySuffix: "°",
    scheduleTitle: "Horário de trabalho", scheduleHow: "Como o negócio opera?",
    everyday: "Todos os dias", byWeekday: "Por dia da semana", customCycle: "Ciclo personalizado",
    workdaysLabel: "Dias úteis",
    cycleHint: "Crie uma alternância de dias úteis e de folga. Ex: 2 trabalho → 2 folga. Máximo 7 dias.",
    workDay: "Dia de trabalho", dayOff: "Dia de folga",
    shiftsTitle: "Turnos",
    shiftsDesc: "Se vários cargos trabalham no mesmo bloco, adicione um turno separado para cada função.",
    rolesHintPre: "Você pode atribuir diferentes funções aos turnos. Adicione funções na",
    rolesHintPost: ".", stepLink: "etapa 1",
    activeDaysLabel: "Dias em que este grupo de turnos se aplica",
    shiftsLabel: "Turnos", shiftsEmpty: "Ainda sem turnos — adicione o primeiro",
    deleteGroup: "Excluir grupo", addShift: "Adicionar turno", addGroup: "Adicionar grupo de turnos",
    roleInShift: "Função no turno…", noRole: "— sem função",
    timeError: "O horário de término deve ser posterior ao de início",
  },
  tr: {
    weekDays: ["Pzt","Sal","Çar","Per","Cum","Cmt","Paz"],
    dayPrefix: "", daySuffix: ".",
    scheduleTitle: "Çalışma planı", scheduleHow: "İşletme nasıl çalışıyor?",
    everyday: "Her gün", byWeekday: "Haftanın gününe göre", customCycle: "Özel döngü",
    workdaysLabel: "Çalışma günleri",
    cycleHint: "Çalışma ve tatil günlerini sıralayın. Örnek: 2 çalışma → 2 tatil. Maksimum 7 gün.",
    workDay: "Çalışma günü", dayOff: "Tatil günü",
    shiftsTitle: "Vardiyalar",
    shiftsDesc: "Aynı zaman dilimine birden fazla rol giriyorsa, her rol için ayrı bir vardiya ekleyin.",
    rolesHintPre: "Vardiyalara farklı roller atayabilirsiniz.",
    rolesHintPost: "de rol ekleyin.", stepLink: "1. Adım",
    activeDaysLabel: "Bu vardiya grubunun geçerli olduğu günler",
    shiftsLabel: "Vardiyalar", shiftsEmpty: "Henüz vardiya yok — ilkini ekleyin",
    deleteGroup: "Grubu sil", addShift: "Vardiya ekle", addGroup: "Vardiya grubu ekle",
    roleInShift: "Vardiya rolü…", noRole: "— rol yok",
    timeError: "Bitiş saati başlangıç saatinden sonra olmalı",
  },
  zh: {
    weekDays: ["周一","周二","周三","周四","周五","周六","周日"],
    dayPrefix: "第", daySuffix: "天",
    scheduleTitle: "工作计划", scheduleHow: "业务如何运营？",
    everyday: "每天", byWeekday: "按星期", customCycle: "自定义周期",
    workdaysLabel: "工作日",
    cycleHint: "设置工作日和休息日的交替规律。例如：2工作 → 2休息。最多7天。",
    workDay: "工作日", dayOff: "休息日",
    shiftsTitle: "班次",
    shiftsDesc: "如果同一时间段有多个职位，请为每个角色单独添加班次。",
    rolesHintPre: "您可以为班次分配不同角色。请在",
    rolesHintPost: "添加角色。", stepLink: "第1步",
    activeDaysLabel: "此班次组适用的日期",
    shiftsLabel: "班次", shiftsEmpty: "暂无班次 — 添加第一个",
    deleteGroup: "删除组", addShift: "添加班次", addGroup: "添加班次组",
    roleInShift: "班次角色…", noRole: "— 无角色",
    timeError: "结束时间必须晚于开始时间",
  },
  ja: {
    weekDays: ["月","火","水","木","金","土","日"],
    dayPrefix: "第", daySuffix: "日",
    scheduleTitle: "勤務スケジュール", scheduleHow: "事業はどのように運営されていますか？",
    everyday: "毎日", byWeekday: "曜日別", customCycle: "カスタムサイクル",
    workdaysLabel: "勤務日",
    cycleHint: "勤務日と休日のパターンを作成します。例: 2勤務 → 2休み。最大7日間。",
    workDay: "勤務日", dayOff: "休日",
    shiftsTitle: "シフト",
    shiftsDesc: "同じ時間帯に複数の役割がある場合、各役割に別々のシフトを追加してください。",
    rolesHintPre: "シフトに異なる役割を割り当てることができます。",
    rolesHintPost: "で役割を追加してください。", stepLink: "ステップ1",
    activeDaysLabel: "このシフトグループが適用される日",
    shiftsLabel: "シフト", shiftsEmpty: "シフトはまだありません — 最初のものを追加",
    deleteGroup: "グループを削除", addShift: "シフトを追加", addGroup: "シフトグループを追加",
    roleInShift: "シフトの役割…", noRole: "— 役割なし",
    timeError: "終了時刻は開始時刻より後にしてください",
  },
};

function getS3Copy(language?: LanguageCode): S3Copy {
  return s3Copy[language ?? "en"] ?? s3Copy.en;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
export function cycleTotal(c: CycleSeg[]) { return c.reduce((s, x) => s + x.days, 0); }

export function workIndices(mode: WorkMode, weekDays: number[], cycle: CycleSeg[]): number[] {
  if (mode === "daily") return [];
  if (mode === "weekly") return weekDays;
  let idx = 0, res: number[] = [];
  for (const s of cycle) { if (s.type === "work") for (let i = 0; i < s.days; i++) res.push(idx + i); idx += s.days; }
  return res;
}

function dayLabel(mode: WorkMode, i: number, sc: S3Copy) {
  return mode === "weekly" ? sc.weekDays[i] : `${sc.dayPrefix}${i + 1}${sc.daySuffix}`;
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
  return (
    <div style={{ borderLeft: `2px solid ${dark ? "rgba(168,85,247,0.4)" : "rgba(168,85,247,0.35)"}`, background: dark ? "rgba(168,85,247,0.06)" : "rgba(168,85,247,0.05)", borderRadius: "0 6px 6px 0", padding: "8px 12px" }}>
      <span style={{ color: dark ? "rgba(196,181,253,0.75)" : "rgba(91,33,182,0.65)", fontSize: "0.78rem", lineHeight: 1.6, fontFamily: "'DM Sans',sans-serif" }}>{text}</span>
    </div>
  );
}

function TimeInput({ value, onChange, dark }: { value: string; onChange: (v: string) => void; dark: boolean }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);
  const hourColRef = useRef<HTMLDivElement>(null);
  const minColRef = useRef<HTMLDivElement>(null);
  const tc = colors(dark);

  const parts = value ? value.split(":") : ["", ""];
  const hh = parts[0] ?? "";
  const mm = parts[1] ?? "";

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (!dropRef.current?.contains(e.target as Node) && !triggerRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    setTimeout(() => {
      if (hourColRef.current && hh) {
        const el = hourColRef.current.querySelector(`[data-v="${hh}"]`) as HTMLElement;
        el?.scrollIntoView({ block: "center" });
      }
      if (minColRef.current && mm) {
        const el = minColRef.current.querySelector(`[data-v="${mm}"]`) as HTMLElement;
        el?.scrollIntoView({ block: "center" });
      }
    }, 0);
  }, [open]);

  const handleOpen = () => {
    if (!triggerRef.current) return;
    const r = triggerRef.current.getBoundingClientRect();
    setPos({ top: r.bottom + 4, left: r.left });
    setOpen(v => !v);
  };

  const hours = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));
  const mins  = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, "0"));
  const dropBg = dark ? "#1a1730" : "#ffffff";
  const shadow = dark ? "0 20px 56px rgba(0,0,0,0.75), 0 0 0 1px rgba(255,255,255,0.06)" : "0 8px 32px rgba(0,0,0,0.13), 0 0 0 1px rgba(0,0,0,0.07)";
  const colStyle: React.CSSProperties = { width: 48, maxHeight: 200, overflowY: "auto", padding: "2px" };

  const itemBtn = (v: string, active: boolean, onClick: () => void, colKey: "h" | "m") => (
    <button key={v} data-v={v} onClick={onClick} style={{
      display: "block", width: "100%", padding: "5px 0", border: "none", cursor: "pointer",
      background: active ? "linear-gradient(135deg,#a855f7,#ec4899)" : "none",
      color: active ? "#fff" : (dark ? "#c4bde0" : "#6a6680"),
      fontSize: "0.82rem", fontFamily: "'DM Sans',sans-serif", textAlign: "center",
      borderRadius: "6px", transition: "background 0.1s",
    }}
      onMouseEnter={e => { if (!active) e.currentTarget.style.background = dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)"; }}
      onMouseLeave={e => { if (!active) e.currentTarget.style.background = "none"; }}
    >{v}</button>
  );

  return (
    <>
      <button ref={triggerRef} onClick={handleOpen} style={{
        background: tc.inputBg, border: `1.5px solid ${open ? "#a855f7" : tc.inputBorder}`,
        borderRadius: "8px", padding: "7px 10px", color: value ? tc.headline : tc.faint,
        fontSize: "0.85rem", fontFamily: "'DM Sans',sans-serif", outline: "none",
        transition: "border-color 0.18s", width: "96px", cursor: "pointer",
        display: "flex", alignItems: "center", justifyContent: "space-between", gap: "6px",
      }}>
        <span>{value || "--:--"}</span>
        <Clock3 size={12} strokeWidth={1.8} style={{ color: tc.iconMuted, flexShrink: 0 }} />
      </button>
      {open && typeof document !== "undefined" && ReactDOM.createPortal(
        <div ref={dropRef} style={{ position: "fixed", top: pos.top, left: pos.left, zIndex: 9999, background: dropBg, borderRadius: "10px", padding: "4px", boxShadow: shadow, display: "flex", gap: "2px" }}>
          <div ref={hourColRef} style={colStyle}>
            {hours.map(h => itemBtn(h, h === hh, () => { onChange(`${h}:${mm || "00"}`); }, "h"))}
          </div>
          <div style={{ width: 1, background: dark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.08)", margin: "4px 0" }} />
          <div ref={minColRef} style={colStyle}>
            {mins.map(m => itemBtn(m, m === mm, () => { onChange(`${hh || "00"}:${m}`); }, "m"))}
          </div>
        </div>,
        document.body
      )}
    </>
  );
}


function RoleDropdown({ value, onChange, roles, dark, sc }: {
  value: string; onChange: (v: string) => void; roles: string[]; dark: boolean; sc: S3Copy;
}) {
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
        <span>{value || sc.roleInShift}</span>
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
            >{sc.noRole}</button>
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
function CycleBuilder({ cycle, onChange, dark, sc }: {
  cycle: CycleSeg[]; onChange: (c: CycleSeg[]) => void; dark: boolean; sc: S3Copy;
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
      <Hint text={sc.cycleHint} dark={dark} />

      <div style={{ background: dark ? "rgba(168,85,247,0.04)" : "rgba(168,85,247,0.03)", border: `1px solid ${dark ? "rgba(168,85,247,0.14)" : "rgba(168,85,247,0.12)"}`, borderRadius: "10px", padding: "12px", display: "flex", flexDirection: "column", gap: "10px" }}>
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
                    {isWork ? sc.workDay : sc.dayOff}
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
            ><Plus size={12} strokeWidth={2.5} />{sc.workDay}</button>

            <button onClick={() => addSeg("off")} style={{
              display: "inline-flex", alignItems: "center", gap: "5px",
              padding: "7px 12px", borderRadius: "10px", border: "none", cursor: "pointer",
              background: offColor, outline: `1px solid ${offBorder}`,
              color: offText, fontSize: "0.78rem", fontWeight: 500,
              fontFamily: "'DM Sans',sans-serif", transition: "opacity 0.15s",
            }}
              onMouseEnter={e => (e.currentTarget.style.opacity = "0.75")}
              onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
            ><Plus size={12} strokeWidth={2.5} />{sc.dayOff}</button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Day toggles inside a shift config ───────────────────────────────────────
function ConfigDayToggles({ mode, weekDays, cycle, activeDays, onChange, dark, sc }: {
  mode: WorkMode; weekDays: number[]; cycle: CycleSeg[];
  activeDays: number[]; onChange: (d: number[]) => void; dark: boolean; sc: S3Copy;
}) {
  const tc = colors(dark);
  const total = mode === "custom" ? cycleTotal(cycle) : 7;
  const working = workIndices(mode, weekDays, cycle);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
      <Label text={sc.activeDaysLabel} dark={dark} />
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
            >{dayLabel(mode, i, sc)}</button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Shift row ────────────────────────────────────────────────────────────────
function ShiftRow({ shift, roles, onUpdate, onDelete, dark, sc }: {
  shift: Shift3; roles: string[];
  onUpdate: (patch: Partial<Shift3>) => void;
  onDelete: () => void; dark: boolean; sc: S3Copy;
}) {
  const tc = colors(dark);
  const hasRoles = roles.length > 0;
  const invalid = invalidTimeRange(shift.from, shift.to);
  return (
    <div style={{ marginBottom: "8px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
        <TimeInput value={shift.from} onChange={v => onUpdate({ from: v })} dark={dark} />
        <span style={{ color: invalid ? "#f87171" : tc.faint, fontSize: "0.8rem", flexShrink: 0 }}>→</span>
        <TimeInput value={shift.to} onChange={v => onUpdate({ to: v })} dark={dark} />
        {hasRoles && <RoleDropdown value={shift.role} onChange={v => onUpdate({ role: v })} roles={roles} dark={dark} sc={sc} />}
        <button onClick={onDelete} style={{
          background: "none", border: "none", cursor: "pointer", padding: "4px",
          color: tc.iconMuted, display: "flex", flexShrink: 0, borderRadius: "6px", transition: "color 0.15s",
        }}
          onMouseEnter={e => (e.currentTarget.style.color = "#f87171")}
          onMouseLeave={e => (e.currentTarget.style.color = tc.iconMuted)}
        ><Trash2 size={13} strokeWidth={1.8} /></button>
      </div>
      {invalid && (
        <div style={{
          marginTop: "5px", padding: "7px 9px", borderRadius: "8px",
          background: dark ? "rgba(248,113,113,0.08)" : "rgba(248,113,113,0.06)",
          border: "1px solid rgba(248,113,113,0.22)", color: "#f87171",
          fontSize: "0.72rem", lineHeight: 1.35,
        }}>
          {sc.timeError}
        </div>
      )}
    </div>
  );
}

// ─── Shift config block ───────────────────────────────────────────────────────
function ConfigBlock({ config, mode, weekDays, cycle, roles, onUpdate, onDelete, showDelete, dark, sc }: {
  config: ShiftConfig3; mode: WorkMode; weekDays: number[]; cycle: CycleSeg[];
  roles: string[]; onUpdate: (c: ShiftConfig3) => void;
  onDelete: () => void; showDelete: boolean; dark: boolean; sc: S3Copy;
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
          ><Trash2 size={12} strokeWidth={1.8} />{sc.deleteGroup}</button>
        </div>
      )}

      {mode !== "daily" && (
        <div style={{ marginBottom: "14px" }}>
          <ConfigDayToggles mode={mode} weekDays={weekDays} cycle={cycle} activeDays={config.activeDays} onChange={days => onUpdate({ ...config, activeDays: days })} dark={dark} sc={sc} />
        </div>
      )}

      <Label text={sc.shiftsLabel} dark={dark} />

      {config.shifts.length === 0 && (
        <p style={{ color: tc.faint, fontSize: "0.78rem", margin: "0 0 10px" }}>{sc.shiftsEmpty}</p>
      )}

      {config.shifts.map(shift => (
        <ShiftRow key={shift.id} shift={shift} roles={roles}
          onUpdate={patch => updateShift(shift.id, patch)}
          onDelete={() => deleteShift(shift.id)} dark={dark} sc={sc} />
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
      ><Plus size={13} strokeWidth={2} />{sc.addShift}</button>
    </div>
  );
}

// ─── Step 3: work mode only ───────────────────────────────────────────────────
export function StepThree({ data, onChange, dark, language }: {
  data: Step3Data; onChange: (d: Step3Data) => void; dark: boolean; language?: LanguageCode;
}) {
  const sc = getS3Copy(language);
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
        {sc.scheduleTitle}
      </p>

      <div style={{ flex: 1, overflowY: "auto", minHeight: 0, paddingRight: "2px" }}>
        <div style={{ marginBottom: "16px" }}>
          <Label text={sc.scheduleHow} dark={dark} />
          <Pills dark={dark} value={data.mode} onChange={v => setMode(v as WorkMode)} options={[
            { value: "daily",  label: sc.everyday },
            { value: "weekly", label: sc.byWeekday },
            { value: "custom", label: sc.customCycle },
          ]} />
        </div>

        {data.mode === "weekly" && (
          <div style={{ marginBottom: "8px" }}>
            <Label text={sc.workdaysLabel} dark={dark} />
            <div style={{ display: "flex", gap: "5px" }}>
              {sc.weekDays.map((d, i) => {
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
          <CycleBuilder cycle={data.cycle} onChange={setCycle} dark={dark} sc={sc} />
        )}
      </div>
    </div>
  );
}

// ─── Step 4: shifts ───────────────────────────────────────────────────────────
export function StepFour({ data, onChange, globalRoles, onGoToStep, dark, language }: {
  data: Step3Data; onChange: (d: Step3Data) => void;
  globalRoles: string[]; onGoToStep: (s: number) => void; dark: boolean; language?: LanguageCode;
}) {
  const sc = getS3Copy(language);
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
        {sc.shiftsTitle}
      </p>
      <div style={{ borderLeft: `2px solid ${dark ? "rgba(168,85,247,0.4)" : "rgba(168,85,247,0.35)"}`, background: dark ? "rgba(168,85,247,0.06)" : "rgba(168,85,247,0.05)", borderRadius: "0 6px 6px 0", padding: "8px 12px", marginBottom: "12px" }}>
        <span style={{ color: dark ? "rgba(196,181,253,0.75)" : "rgba(91,33,182,0.65)", fontSize: "0.78rem", lineHeight: 1.6, fontFamily: "'DM Sans',sans-serif" }}>{sc.shiftsDesc}</span>
      </div>

      {!hasRoles && (
        <div style={{ borderLeft: `2px solid ${dark ? "rgba(168,85,247,0.4)" : "rgba(168,85,247,0.35)"}`, background: dark ? "rgba(168,85,247,0.06)" : "rgba(168,85,247,0.05)", borderRadius: "0 6px 6px 0", padding: "8px 12px", marginBottom: "14px" }}>
          <span style={{ color: dark ? "rgba(196,181,253,0.75)" : "rgba(91,33,182,0.65)", fontSize: "0.78rem", lineHeight: 1.6, fontFamily: "'DM Sans',sans-serif" }}>
            {sc.rolesHintPre}{" "}
            <a onClick={() => onGoToStep(1)} style={{ color: dark ? "#c4b5fd" : "#7c3aed", cursor: "pointer", textDecoration: "none", fontWeight: 500 }}
              onMouseEnter={e => ((e.target as HTMLElement).style.textDecoration = "underline")}
              onMouseLeave={e => ((e.target as HTMLElement).style.textDecoration = "none")}
            >{sc.stepLink}</a>{sc.rolesHintPost}
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
            dark={dark} sc={sc}
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
          ><Plus size={14} strokeWidth={2} />{sc.addGroup}</button>
        )}
      </div>
    </div>
  );
}
