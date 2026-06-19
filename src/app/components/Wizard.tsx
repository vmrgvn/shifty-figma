import { useState, useEffect, useRef } from "react";
import { StepThree, StepFour, Step3Data, defaultStep3, hasInvalidShiftTimes } from "./WizardStep3";
import { StepFive, Step5Data, defaultStep5, hasInvalidBreakTimes } from "./WizardStep5";
import { motion, AnimatePresence } from "motion/react";
import {
  X, Plus, Trash2, Tag, CalendarOff, CalendarRange,
  Clock3, Users2, UserRound, ChevronLeft, Search, Check,
  Stethoscope, Umbrella, Calendar, ThumbsUp, ThumbsDown, AlertCircle,
} from "lucide-react";
import type { LanguageCode } from "./NavMenu";

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

function invalidTimeRange(from?: string, to?: string) {
  return !!from && !!to && to <= from;
}

function employeeProblems(emp: EmpData, t = wizardCopy.ru.employeeProblems) {
  const problems: string[] = [];
  if (emp.roles.length === 0) problems.push(t.noRole);
  if (emp.hired && emp.fired && emp.fired < emp.hired) problems.push(t.firedBeforeHired);
  if (emp.absences.some(a => a.dateFrom && a.dateTo && a.dateTo < a.dateFrom)) problems.push(t.absenceDates);
  if (emp.absences.some(a => invalidTimeRange(a.timeFrom, a.timeTo))) problems.push(t.absenceTime);
  if (emp.timePrefs.some(p => invalidTimeRange(p.timeFrom, p.timeTo))) problems.push(t.preferenceTime);
  return problems;
}

function hasEmployeeValidationErrors(employees: EmpData[]) {
  return employees.some(emp => {
    const roleOnly = emp.roles.length === 0 && employeeProblems(emp).length === 1;
    return employeeProblems(emp).length > 0 && !roleOnly;
  });
}

function hasUnassignedEmployees(employees: EmpData[]) {
  return employees.some(emp => emp.roles.length === 0);
}

function hasAnyShift(data: Step3Data) {
  return data.configs.some(config => config.shifts.length > 0);
}

function cloneEmployee(emp: EmpData): EmpData {
  return {
    ...emp,
    roles: [...emp.roles],
    absences: emp.absences.map(a => ({
      ...a,
      weekDays: a.weekDays ? [...a.weekDays] : undefined,
      monthDays: a.monthDays ? [...a.monthDays] : undefined,
    })),
    timePrefs: emp.timePrefs.map(p => ({
      ...p,
      weekDays: p.weekDays ? [...p.weekDays] : undefined,
      monthDays: p.monthDays ? [...p.monthDays] : undefined,
    })),
    socialPrefs: emp.socialPrefs.map(p => ({ ...p })),
  };
}

const TOTAL_STEPS = 6;

const wizardCopy: Record<LanguageCode, {
  step: string;
  back: string;
  continue: string;
  generate: string;
  done: string;
  generationTitle: string;
  generationText: string;
  ok: string;
  validation: {
    employees: string;
    roles: string;
    shifts: string;
    shiftTime: string;
    breakTime: string;
    employeeRoles: string;
    employeeSettings: string;
  };
  employeeProblems: {
    noRole: string;
    firedBeforeHired: string;
    absenceDates: string;
    absenceTime: string;
    preferenceTime: string;
  };
  employeeConfig: {
    title: string;
    desc: string;
    empty: string;
  };
  actions: {
    roles: string;
    absences: string;
    dates: string;
    timePrefs: string;
    socialPrefs: string;
  };
  schedule: {
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
}> = {
  ru: {
    step: "Шаг",
    back: "Назад",
    continue: "Продолжить",
    generate: "Составить расписание",
    done: "Готово",
    generationTitle: "AI составляет расписание",
    generationText: "Мы приняли данные. Сейчас всё посчитаем, подберём смены и скоро покажем результат.",
    ok: "Понятно",
    validation: {
      employees: "Добавьте хотя бы одного сотрудника.",
      roles: "Добавьте хотя бы одну роль.",
      shifts: "Добавьте хотя бы одну смену.",
      shiftTime: "Исправьте время смен: окончание должно быть позже начала.",
      breakTime: "Исправьте время перерывов: окончание должно быть позже начала.",
      employeeRoles: "Назначьте роли всем сотрудникам.",
      employeeSettings: "Исправьте ошибки в настройках сотрудников.",
    },
    employeeProblems: {
      noRole: "нет роли",
      firedBeforeHired: "дата увольнения раньше найма",
      absenceDates: "ошибка в датах отсутствия",
      absenceTime: "ошибка во времени отсутствия",
      preferenceTime: "ошибка во времени предпочтений",
    },
    employeeConfig: {
      title: "Настройка сотрудников",
      desc: "Выберите сотрудника и настройте роли, даты, отсутствия, предпочтения и командные правила.",
      empty: "Сначала добавьте сотрудников",
    },
    actions: {
      roles: "Роли",
      absences: "Отсутствия",
      dates: "Найм / увольнение",
      timePrefs: "Время",
      socialPrefs: "Команда",
    },
    schedule: {
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
    },
  },
  en: {
    step: "Step",
    back: "Back",
    continue: "Continue",
    generate: "Build schedule",
    done: "Done",
    generationTitle: "AI is building the schedule",
    generationText: "We have accepted the data. Now we will calculate everything, match shifts, and show the result soon.",
    ok: "Got it",
    validation: {
      employees: "Add at least one employee.",
      roles: "Add at least one role.",
      shifts: "Add at least one shift.",
      shiftTime: "Fix shift times: the end time must be later than the start time.",
      breakTime: "Fix break times: the end time must be later than the start time.",
      employeeRoles: "Assign roles to all employees.",
      employeeSettings: "Fix errors in employee settings.",
    },
    employeeProblems: {
      noRole: "no role",
      firedBeforeHired: "termination date is before hire date",
      absenceDates: "absence date error",
      absenceTime: "absence time error",
      preferenceTime: "preference time error",
    },
    employeeConfig: {
      title: "Employee setup",
      desc: "Choose an employee and configure roles, dates, absences, preferences, and team rules.",
      empty: "Add employees first",
    },
    actions: {
      roles: "Roles",
      absences: "Absences",
      dates: "Hire / termination",
      timePrefs: "Time",
      socialPrefs: "Team",
    },
    schedule: {
      title: "Schedule name",
      desc: "Internal name so you can find this schedule later.",
      placeholder: "For example, Downtown store",
      pageTitle: "General settings",
      breaksTitle: "Breaks",
      breaksDesc: "Fixed periods when employees are not working, such as lunch or handover breaks.",
      addBreak: "Add break",
      daysOffTitle: "Non-working days",
      daysOffDesc: "Holidays and other days when the business is closed. Shifts will not be assigned on these dates.",
      addDay: "Add day",
      restTitle: "Minimum rest between shifts",
      restDesc: "How many hours an employee must rest between two consecutive shifts.",
      hours: "hours",
      periodicTitle: "Shift regularity",
      periodicDesc: "Try to place employees at the same time or distribute shifts randomly.",
      periodicOn: "Consistent shift time",
      periodicOff: "Random distribution",
      add: "Add",
      cancel: "Cancel",
      timeError: "The end time must be later than the start time",
    },
  },
  kk: {
    step: "Қадам",
    back: "Артқа",
    continue: "Жалғастыру",
    generate: "Кесте құру",
    done: "Дайын",
    generationTitle: "AI кестені құрып жатыр",
    generationText: "Деректер қабылданды. Қазір бәрін есептеп, ауысымдарды таңдап, нәтижені жақында көрсетеміз.",
    ok: "Түсінікті",
    validation: {
      employees: "Кемінде бір қызметкер қосыңыз.",
      roles: "Кемінде бір рөл қосыңыз.",
      shifts: "Кемінде бір ауысым қосыңыз.",
      shiftTime: "Ауысым уақытын түзетіңіз: аяқталуы басталуынан кейін болуы керек.",
      breakTime: "Үзіліс уақытын түзетіңіз: аяқталуы басталуынан кейін болуы керек.",
      employeeRoles: "Барлық қызметкерлерге рөл тағайындаңыз.",
      employeeSettings: "Қызметкер баптауларындағы қателерді түзетіңіз.",
    },
    employeeProblems: {
      noRole: "рөл жоқ",
      firedBeforeHired: "жұмыстан шығу күні қабылдану күнінен бұрын",
      absenceDates: "болмау күндерінде қате",
      absenceTime: "болмау уақытында қате",
      preferenceTime: "қалау уақытында қате",
    },
    employeeConfig: {
      title: "Қызметкерлерді баптау",
      desc: "Қызметкерді таңдап, рөлдерді, күндерді, болмауларды, қалауларды және команда ережелерін баптаңыз.",
      empty: "Алдымен қызметкерлерді қосыңыз",
    },
    actions: {
      roles: "Рөлдер",
      absences: "Болмаулар",
      dates: "Қабылдау / шығару",
      timePrefs: "Уақыт",
      socialPrefs: "Команда",
    },
    schedule: {
      title: "Кесте атауы",
      desc: "Кейін бұл кестені оңай табу үшін ішкі атау.",
      placeholder: "Мысалы, орталық дүкен",
      pageTitle: "Жалпы баптаулар",
      breaksTitle: "Үзілістер",
      breaksDesc: "Қызметкерлер жұмыс істемейтін тұрақты уақыт аралықтары: түскі ас, ауысым арасы және басқа үзілістер.",
      addBreak: "Үзіліс қосу",
      daysOffTitle: "Жұмыс емес күндер",
      daysOffDesc: "Бизнес жұмыс істемейтін мерекелер және басқа күндер. Бұл күндерге ауысым қойылмайды.",
      addDay: "Күн қосу",
      restTitle: "Ауысымдар арасындағы ең аз демалыс",
      restDesc: "Қызметкер екі ауысым арасында қанша сағат демалуы керек.",
      hours: "сағат",
      periodicTitle: "Ауысым тұрақтылығы",
      periodicDesc: "Ауысымдарды бір уақытта қою немесе кездейсоқ бөлу.",
      periodicOn: "Тұрақты ауысым уақыты",
      periodicOff: "Кездейсоқ бөлу",
      add: "Қосу",
      cancel: "Бас тарту",
      timeError: "Аяқталу уақыты басталуынан кейін болуы керек",
    },
  },
  de: {
    step: "Schritt",
    back: "Zurück",
    continue: "Weiter",
    generate: "Plan erstellen",
    done: "Fertig",
    generationTitle: "AI erstellt den Plan",
    generationText: "Die Daten sind übernommen. Wir berechnen alles, wählen Schichten aus und zeigen bald das Ergebnis.",
    ok: "Verstanden",
    validation: {
      employees: "Fügen Sie mindestens einen Mitarbeiter hinzu.",
      roles: "Fügen Sie mindestens eine Rolle hinzu.",
      shifts: "Fügen Sie mindestens eine Schicht hinzu.",
      shiftTime: "Korrigieren Sie die Schichtzeiten: Ende muss nach Beginn liegen.",
      breakTime: "Korrigieren Sie die Pausenzeiten: Ende muss nach Beginn liegen.",
      employeeRoles: "Weisen Sie allen Mitarbeitern Rollen zu.",
      employeeSettings: "Korrigieren Sie Fehler in den Mitarbeitereinstellungen.",
    },
    employeeProblems: {
      noRole: "keine Rolle",
      firedBeforeHired: "Austrittsdatum liegt vor Einstellungsdatum",
      absenceDates: "Fehler bei Abwesenheitsdaten",
      absenceTime: "Fehler bei Abwesenheitszeit",
      preferenceTime: "Fehler bei Wunschzeiten",
    },
    employeeConfig: {
      title: "Mitarbeiter einrichten",
      desc: "Wählen Sie einen Mitarbeiter und konfigurieren Sie Rollen, Daten, Abwesenheiten, Wünsche und Teamregeln.",
      empty: "Fügen Sie zuerst Mitarbeiter hinzu",
    },
    actions: {
      roles: "Rollen",
      absences: "Abwesenheiten",
      dates: "Eintritt / Austritt",
      timePrefs: "Zeit",
      socialPrefs: "Team",
    },
    schedule: {
      title: "Planname",
      desc: "Interner Name, damit Sie diesen Plan später leichter finden.",
      placeholder: "Zum Beispiel Filiale Innenstadt",
      pageTitle: "Allgemeine Einstellungen",
      breaksTitle: "Pausen",
      breaksDesc: "Feste Zeiten, in denen Mitarbeiter nicht arbeiten, etwa Mittagspause oder Übergabe.",
      addBreak: "Pause hinzufügen",
      daysOffTitle: "Arbeitsfreie Tage",
      daysOffDesc: "Feiertage und andere Tage, an denen der Betrieb geschlossen ist. An diesen Tagen werden keine Schichten geplant.",
      addDay: "Tag hinzufügen",
      restTitle: "Mindestruhe zwischen Schichten",
      restDesc: "Wie viele Stunden ein Mitarbeiter zwischen zwei Schichten ruhen muss.",
      hours: "Stunden",
      periodicTitle: "Schichtregelmäßigkeit",
      periodicDesc: "Mitarbeiter möglichst zur gleichen Zeit einplanen oder Schichten zufällig verteilen.",
      periodicOn: "Konstante Schichtzeit",
      periodicOff: "Zufällige Verteilung",
      add: "Hinzufügen",
      cancel: "Abbrechen",
      timeError: "Die Endzeit muss später als die Startzeit sein",
    },
  },
  fr: {
    step: "Étape",
    back: "Retour",
    continue: "Continuer",
    generate: "Créer le planning",
    done: "Terminé",
    generationTitle: "L'AI crée le planning",
    generationText: "Les données sont prises en compte. Nous allons tout calculer, choisir les shifts et afficher bientôt le résultat.",
    ok: "Compris",
    validation: {
      employees: "Ajoutez au moins un employé.",
      roles: "Ajoutez au moins un rôle.",
      shifts: "Ajoutez au moins un shift.",
      shiftTime: "Corrigez les horaires: l'heure de fin doit être après le début.",
      breakTime: "Corrigez les pauses: l'heure de fin doit être après le début.",
      employeeRoles: "Attribuez des rôles à tous les employés.",
      employeeSettings: "Corrigez les erreurs dans les paramètres des employés.",
    },
    employeeProblems: {
      noRole: "aucun rôle",
      firedBeforeHired: "date de départ avant date d'embauche",
      absenceDates: "erreur de dates d'absence",
      absenceTime: "erreur d'heure d'absence",
      preferenceTime: "erreur d'heure de préférence",
    },
    employeeConfig: {
      title: "Configuration employés",
      desc: "Choisissez un employé et configurez rôles, dates, absences, préférences et règles d'équipe.",
      empty: "Ajoutez d'abord des employés",
    },
    actions: {
      roles: "Rôles",
      absences: "Absences",
      dates: "Embauche / départ",
      timePrefs: "Temps",
      socialPrefs: "Équipe",
    },
    schedule: {
      title: "Nom du planning",
      desc: "Nom interne pour retrouver ce planning plus facilement.",
      placeholder: "Par exemple, boutique centre-ville",
      pageTitle: "Réglages généraux",
      breaksTitle: "Pauses",
      breaksDesc: "Périodes fixes où les employés ne travaillent pas, comme le déjeuner ou les changements d'équipe.",
      addBreak: "Ajouter une pause",
      daysOffTitle: "Jours non travaillés",
      daysOffDesc: "Jours fériés et autres jours de fermeture. Aucun shift ne sera assigné à ces dates.",
      addDay: "Ajouter un jour",
      restTitle: "Repos minimum entre shifts",
      restDesc: "Nombre d'heures de repos entre deux shifts consécutifs.",
      hours: "heures",
      periodicTitle: "Régularité des shifts",
      periodicDesc: "Placer les employés aux mêmes horaires ou répartir les shifts aléatoirement.",
      periodicOn: "Horaire de shift fixe",
      periodicOff: "Répartition aléatoire",
      add: "Ajouter",
      cancel: "Annuler",
      timeError: "L'heure de fin doit être après l'heure de début",
    },
  },
  es: {
    step: "Paso",
    back: "Atrás",
    continue: "Continuar",
    generate: "Crear horario",
    done: "Listo",
    generationTitle: "La AI está creando el horario",
    generationText: "Hemos recibido los datos. Ahora calcularemos todo, elegiremos turnos y mostraremos el resultado pronto.",
    ok: "Entendido",
    validation: {
      employees: "Añade al menos un empleado.",
      roles: "Añade al menos un rol.",
      shifts: "Añade al menos un turno.",
      shiftTime: "Corrige las horas del turno: la hora de fin debe ser posterior al inicio.",
      breakTime: "Corrige las pausas: la hora de fin debe ser posterior al inicio.",
      employeeRoles: "Asigna roles a todos los empleados.",
      employeeSettings: "Corrige los errores en los ajustes de empleados.",
    },
    employeeProblems: {
      noRole: "sin rol",
      firedBeforeHired: "fecha de baja anterior a la contratación",
      absenceDates: "error en fechas de ausencia",
      absenceTime: "error en hora de ausencia",
      preferenceTime: "error en hora de preferencia",
    },
    employeeConfig: {
      title: "Configuración de empleados",
      desc: "Elige un empleado y configura roles, fechas, ausencias, preferencias y reglas de equipo.",
      empty: "Añade empleados primero",
    },
    actions: {
      roles: "Roles",
      absences: "Ausencias",
      dates: "Alta / baja",
      timePrefs: "Tiempo",
      socialPrefs: "Equipo",
    },
    schedule: {
      title: "Nombre del horario",
      desc: "Nombre interno para encontrar este horario más tarde.",
      placeholder: "Por ejemplo, tienda centro",
      pageTitle: "Ajustes generales",
      breaksTitle: "Descansos",
      breaksDesc: "Periodos fijos en los que los empleados no trabajan, como comida o cambio de turno.",
      addBreak: "Añadir descanso",
      daysOffTitle: "Días no laborables",
      daysOffDesc: "Festivos y otros días en los que el negocio no trabaja. No se asignarán turnos en esas fechas.",
      addDay: "Añadir día",
      restTitle: "Descanso mínimo entre turnos",
      restDesc: "Cuántas horas debe descansar un empleado entre dos turnos seguidos.",
      hours: "horas",
      periodicTitle: "Regularidad de turnos",
      periodicDesc: "Intentar poner turnos a la misma hora o distribuirlos al azar.",
      periodicOn: "Hora de turno constante",
      periodicOff: "Distribución aleatoria",
      add: "Añadir",
      cancel: "Cancelar",
      timeError: "La hora de fin debe ser posterior a la hora de inicio",
    },
  },
  it: {
    step: "Passo",
    back: "Indietro",
    continue: "Continua",
    generate: "Crea calendario",
    done: "Fatto",
    generationTitle: "L'AI sta creando il calendario",
    generationText: "Abbiamo ricevuto i dati. Ora calcoliamo tutto, abbiniamo i turni e mostreremo presto il risultato.",
    ok: "Capito",
    validation: {
      employees: "Aggiungi almeno un dipendente.",
      roles: "Aggiungi almeno un ruolo.",
      shifts: "Aggiungi almeno un turno.",
      shiftTime: "Correggi gli orari del turno: la fine deve essere dopo l'inizio.",
      breakTime: "Correggi le pause: la fine deve essere dopo l'inizio.",
      employeeRoles: "Assegna ruoli a tutti i dipendenti.",
      employeeSettings: "Correggi gli errori nelle impostazioni dei dipendenti.",
    },
    employeeProblems: {
      noRole: "nessun ruolo",
      firedBeforeHired: "data di uscita prima dell'assunzione",
      absenceDates: "errore nelle date di assenza",
      absenceTime: "errore nell'orario di assenza",
      preferenceTime: "errore nell'orario preferito",
    },
    employeeConfig: {
      title: "Impostazione dipendenti",
      desc: "Scegli un dipendente e configura ruoli, date, assenze, preferenze e regole del team.",
      empty: "Aggiungi prima i dipendenti",
    },
    actions: {
      roles: "Ruoli",
      absences: "Assenze",
      dates: "Assunzione / uscita",
      timePrefs: "Tempo",
      socialPrefs: "Team",
    },
    schedule: {
      title: "Nome calendario",
      desc: "Nome interno per trovare più facilmente questo calendario.",
      placeholder: "Per esempio, negozio centro",
      pageTitle: "Impostazioni generali",
      breaksTitle: "Pause",
      breaksDesc: "Intervalli fissi in cui i dipendenti non lavorano, come pranzo o cambio turno.",
      addBreak: "Aggiungi pausa",
      daysOffTitle: "Giorni non lavorativi",
      daysOffDesc: "Festività e altri giorni in cui l'attività è chiusa. Non verranno assegnati turni.",
      addDay: "Aggiungi giorno",
      restTitle: "Riposo minimo tra turni",
      restDesc: "Quante ore deve riposare un dipendente tra due turni consecutivi.",
      hours: "ore",
      periodicTitle: "Regolarità turni",
      periodicDesc: "Mettere i dipendenti allo stesso orario o distribuire i turni casualmente.",
      periodicOn: "Orario turno costante",
      periodicOff: "Distribuzione casuale",
      add: "Aggiungi",
      cancel: "Annulla",
      timeError: "L'orario di fine deve essere dopo l'inizio",
    },
  },
  pt: {
    step: "Etapa",
    back: "Voltar",
    continue: "Continuar",
    generate: "Criar escala",
    done: "Concluir",
    generationTitle: "A AI está criando a escala",
    generationText: "Recebemos os dados. Agora vamos calcular tudo, combinar turnos e mostrar o resultado em breve.",
    ok: "Entendi",
    validation: {
      employees: "Adicione pelo menos um funcionário.",
      roles: "Adicione pelo menos uma função.",
      shifts: "Adicione pelo menos um turno.",
      shiftTime: "Corrija os horários do turno: o fim deve ser depois do início.",
      breakTime: "Corrija os intervalos: o fim deve ser depois do início.",
      employeeRoles: "Atribua funções a todos os funcionários.",
      employeeSettings: "Corrija os erros nas configurações dos funcionários.",
    },
    employeeProblems: {
      noRole: "sem função",
      firedBeforeHired: "data de desligamento antes da contratação",
      absenceDates: "erro nas datas de ausência",
      absenceTime: "erro no horário de ausência",
      preferenceTime: "erro no horário de preferência",
    },
    employeeConfig: {
      title: "Configuração de funcionários",
      desc: "Escolha um funcionário e configure funções, datas, ausências, preferências e regras da equipe.",
      empty: "Adicione funcionários primeiro",
    },
    actions: {
      roles: "Funções",
      absences: "Ausências",
      dates: "Contratação / saída",
      timePrefs: "Tempo",
      socialPrefs: "Equipe",
    },
    schedule: {
      title: "Nome da escala",
      desc: "Nome interno para encontrar esta escala depois.",
      placeholder: "Por exemplo, loja central",
      pageTitle: "Configurações gerais",
      breaksTitle: "Intervalos",
      breaksDesc: "Períodos fixos em que funcionários não trabalham, como almoço ou troca de turno.",
      addBreak: "Adicionar intervalo",
      daysOffTitle: "Dias não úteis",
      daysOffDesc: "Feriados e outros dias em que o negócio fica fechado. Turnos não serão atribuídos nessas datas.",
      addDay: "Adicionar dia",
      restTitle: "Descanso mínimo entre turnos",
      restDesc: "Quantas horas o funcionário deve descansar entre dois turnos seguidos.",
      hours: "horas",
      periodicTitle: "Regularidade dos turnos",
      periodicDesc: "Tentar manter o mesmo horário ou distribuir turnos aleatoriamente.",
      periodicOn: "Horário de turno constante",
      periodicOff: "Distribuição aleatória",
      add: "Adicionar",
      cancel: "Cancelar",
      timeError: "O horário de fim deve ser depois do início",
    },
  },
  tr: {
    step: "Adım",
    back: "Geri",
    continue: "Devam",
    generate: "Plan oluştur",
    done: "Tamam",
    generationTitle: "AI planı oluşturuyor",
    generationText: "Verileri aldık. Şimdi her şeyi hesaplayıp vardiyaları eşleştireceğiz ve sonucu yakında göstereceğiz.",
    ok: "Anladım",
    validation: {
      employees: "En az bir çalışan ekleyin.",
      roles: "En az bir rol ekleyin.",
      shifts: "En az bir vardiya ekleyin.",
      shiftTime: "Vardiya saatlerini düzeltin: bitiş başlangıçtan sonra olmalı.",
      breakTime: "Mola saatlerini düzeltin: bitiş başlangıçtan sonra olmalı.",
      employeeRoles: "Tüm çalışanlara rol atayın.",
      employeeSettings: "Çalışan ayarlarındaki hataları düzeltin.",
    },
    employeeProblems: {
      noRole: "rol yok",
      firedBeforeHired: "çıkış tarihi işe girişten önce",
      absenceDates: "devamsızlık tarihi hatası",
      absenceTime: "devamsızlık saati hatası",
      preferenceTime: "tercih saati hatası",
    },
    employeeConfig: {
      title: "Çalışan ayarları",
      desc: "Çalışanı seçin; rolleri, tarihleri, devamsızlıkları, tercihleri ve ekip kurallarını ayarlayın.",
      empty: "Önce çalışan ekleyin",
    },
    actions: {
      roles: "Roller",
      absences: "Devamsızlıklar",
      dates: "İşe giriş / çıkış",
      timePrefs: "Zaman",
      socialPrefs: "Ekip",
    },
    schedule: {
      title: "Plan adı",
      desc: "Bu planı sonra kolay bulmak için dahili ad.",
      placeholder: "Örneğin, merkez mağaza",
      pageTitle: "Genel ayarlar",
      breaksTitle: "Molalar",
      breaksDesc: "Çalışanların çalışmadığı sabit aralıklar: öğle molası, vardiya geçişi ve diğer molalar.",
      addBreak: "Mola ekle",
      daysOffTitle: "Çalışılmayan günler",
      daysOffDesc: "İşletmenin kapalı olduğu tatiller ve diğer günler. Bu tarihlere vardiya atanmaz.",
      addDay: "Gün ekle",
      restTitle: "Vardiyalar arası minimum dinlenme",
      restDesc: "Çalışanın iki vardiya arasında kaç saat dinlenmesi gerektiği.",
      hours: "saat",
      periodicTitle: "Vardiya düzeni",
      periodicDesc: "Çalışanları aynı saate koymaya çalış veya vardiyaları rastgele dağıt.",
      periodicOn: "Sabit vardiya saati",
      periodicOff: "Rastgele dağıtım",
      add: "Ekle",
      cancel: "İptal",
      timeError: "Bitiş saati başlangıçtan sonra olmalı",
    },
  },
  zh: {
    step: "步骤",
    back: "返回",
    continue: "继续",
    generate: "生成排班",
    done: "完成",
    generationTitle: "AI 正在生成排班",
    generationText: "数据已接收。我们会计算规则、匹配班次，并很快显示结果。",
    ok: "知道了",
    validation: {
      employees: "请至少添加一名员工。",
      roles: "请至少添加一个角色。",
      shifts: "请至少添加一个班次。",
      shiftTime: "请修正班次时间：结束时间必须晚于开始时间。",
      breakTime: "请修正休息时间：结束时间必须晚于开始时间。",
      employeeRoles: "请为所有员工分配角色。",
      employeeSettings: "请修正员工设置中的错误。",
    },
    employeeProblems: {
      noRole: "没有角色",
      firedBeforeHired: "离职日期早于入职日期",
      absenceDates: "缺勤日期错误",
      absenceTime: "缺勤时间错误",
      preferenceTime: "偏好时间错误",
    },
    employeeConfig: {
      title: "员工设置",
      desc: "选择员工并配置角色、日期、缺勤、偏好和团队规则。",
      empty: "请先添加员工",
    },
    actions: {
      roles: "角色",
      absences: "缺勤",
      dates: "入职 / 离职",
      timePrefs: "时间",
      socialPrefs: "团队",
    },
    schedule: {
      title: "排班名称",
      desc: "内部名称，方便以后找到这份排班。",
      placeholder: "例如，市中心门店",
      pageTitle: "通用设置",
      breaksTitle: "休息",
      breaksDesc: "员工不工作的固定时间段，例如午餐或交接班。",
      addBreak: "添加休息",
      daysOffTitle: "非工作日",
      daysOffDesc: "节假日和其他停业日期。这些日期不会安排班次。",
      addDay: "添加日期",
      restTitle: "班次间最短休息",
      restDesc: "员工连续两个班次之间必须休息的小时数。",
      hours: "小时",
      periodicTitle: "班次规律",
      periodicDesc: "尽量安排固定时间，或随机分配班次。",
      periodicOn: "固定班次时间",
      periodicOff: "随机分配",
      add: "添加",
      cancel: "取消",
      timeError: "结束时间必须晚于开始时间",
    },
  },
  ja: {
    step: "ステップ",
    back: "戻る",
    continue: "続ける",
    generate: "シフトを作成",
    done: "完了",
    generationTitle: "AI がシフトを作成中",
    generationText: "データを受け取りました。これから計算し、シフトを割り当て、まもなく結果を表示します。",
    ok: "了解",
    validation: {
      employees: "従業員を少なくとも1人追加してください。",
      roles: "役割を少なくとも1つ追加してください。",
      shifts: "シフトを少なくとも1つ追加してください。",
      shiftTime: "シフト時間を修正してください。終了時刻は開始時刻より後にする必要があります。",
      breakTime: "休憩時間を修正してください。終了時刻は開始時刻より後にする必要があります。",
      employeeRoles: "すべての従業員に役割を割り当ててください。",
      employeeSettings: "従業員設定のエラーを修正してください。",
    },
    employeeProblems: {
      noRole: "役割なし",
      firedBeforeHired: "退職日が入社日より前です",
      absenceDates: "不在日のエラー",
      absenceTime: "不在時間のエラー",
      preferenceTime: "希望時間のエラー",
    },
    employeeConfig: {
      title: "従業員設定",
      desc: "従業員を選び、役割、日付、不在、希望、チームルールを設定します。",
      empty: "先に従業員を追加してください",
    },
    actions: {
      roles: "役割",
      absences: "不在",
      dates: "入社 / 退職",
      timePrefs: "時間",
      socialPrefs: "チーム",
    },
    schedule: {
      title: "シフト名",
      desc: "後で見つけやすくするための内部名です。",
      placeholder: "例: 中央店",
      pageTitle: "一般設定",
      breaksTitle: "休憩",
      breaksDesc: "昼休みや引き継ぎなど、従業員が働かない固定時間です。",
      addBreak: "休憩を追加",
      daysOffTitle: "非営業日",
      daysOffDesc: "祝日など営業しない日です。この日にはシフトを割り当てません。",
      addDay: "日付を追加",
      restTitle: "シフト間の最短休息",
      restDesc: "連続する2つのシフトの間に必要な休息時間です。",
      hours: "時間",
      periodicTitle: "シフトの規則性",
      periodicDesc: "同じ時間に配置するか、シフトをランダムに分配します。",
      periodicOn: "固定シフト時間",
      periodicOff: "ランダム分配",
      add: "追加",
      cancel: "キャンセル",
      timeError: "終了時刻は開始時刻より後にしてください",
    },
  },
};

const wizardStepCopy: Record<LanguageCode, {
  employeesTitle: string;
  employeePlaceholder: string;
  employeesEmpty: string;
  employeesHint: string;
  rolesTitle: string;
  rolePlaceholder: string;
  rolesEmpty: string;
  rolesHint: string;
}> = {
  ru: {
    employeesTitle: "Сотрудники",
    employeePlaceholder: "Имя сотрудника",
    employeesEmpty: "Пока никого нет",
    employeesHint: "Добавьте первого сотрудника выше",
    rolesTitle: "Роли",
    rolePlaceholder: "Например, менеджер",
    rolesEmpty: "Ролей пока нет",
    rolesHint: "Создайте каталог ролей для смен и сотрудников",
  },
  en: {
    employeesTitle: "Employees",
    employeePlaceholder: "Employee name",
    employeesEmpty: "No one yet",
    employeesHint: "Add the first employee above",
    rolesTitle: "Roles",
    rolePlaceholder: "For example, manager",
    rolesEmpty: "No roles yet",
    rolesHint: "Create a role catalog for shifts and employees",
  },
  kk: {
    employeesTitle: "Қызметкерлер",
    employeePlaceholder: "Қызметкер аты",
    employeesEmpty: "Әзірге ешкім жоқ",
    employeesHint: "Бірінші қызметкерді жоғарыда қосыңыз",
    rolesTitle: "Рөлдер",
    rolePlaceholder: "Мысалы, менеджер",
    rolesEmpty: "Әзірге рөл жоқ",
    rolesHint: "Ауысымдар мен қызметкерлер үшін рөлдер каталогын жасаңыз",
  },
  de: {
    employeesTitle: "Mitarbeiter",
    employeePlaceholder: "Name des Mitarbeiters",
    employeesEmpty: "Noch niemand",
    employeesHint: "Fügen Sie oben den ersten Mitarbeiter hinzu",
    rolesTitle: "Rollen",
    rolePlaceholder: "Zum Beispiel Manager",
    rolesEmpty: "Noch keine Rollen",
    rolesHint: "Erstellen Sie einen Rollenkatalog für Schichten und Mitarbeiter",
  },
  fr: {
    employeesTitle: "Employés",
    employeePlaceholder: "Nom de l'employé",
    employeesEmpty: "Personne pour l'instant",
    employeesHint: "Ajoutez le premier employé ci-dessus",
    rolesTitle: "Rôles",
    rolePlaceholder: "Par exemple, manager",
    rolesEmpty: "Aucun rôle",
    rolesHint: "Créez un catalogue de rôles pour les shifts et employés",
  },
  es: {
    employeesTitle: "Empleados",
    employeePlaceholder: "Nombre del empleado",
    employeesEmpty: "Aún no hay nadie",
    employeesHint: "Añade el primer empleado arriba",
    rolesTitle: "Roles",
    rolePlaceholder: "Por ejemplo, gerente",
    rolesEmpty: "Aún no hay roles",
    rolesHint: "Crea un catálogo de roles para turnos y empleados",
  },
  it: {
    employeesTitle: "Dipendenti",
    employeePlaceholder: "Nome dipendente",
    employeesEmpty: "Ancora nessuno",
    employeesHint: "Aggiungi il primo dipendente sopra",
    rolesTitle: "Ruoli",
    rolePlaceholder: "Per esempio, manager",
    rolesEmpty: "Ancora nessun ruolo",
    rolesHint: "Crea un catalogo ruoli per turni e dipendenti",
  },
  pt: {
    employeesTitle: "Funcionários",
    employeePlaceholder: "Nome do funcionário",
    employeesEmpty: "Ainda não há ninguém",
    employeesHint: "Adicione o primeiro funcionário acima",
    rolesTitle: "Funções",
    rolePlaceholder: "Por exemplo, gerente",
    rolesEmpty: "Ainda não há funções",
    rolesHint: "Crie um catálogo de funções para turnos e funcionários",
  },
  tr: {
    employeesTitle: "Çalışanlar",
    employeePlaceholder: "Çalışan adı",
    employeesEmpty: "Henüz kimse yok",
    employeesHint: "İlk çalışanı yukarıdan ekleyin",
    rolesTitle: "Roller",
    rolePlaceholder: "Örneğin, yönetici",
    rolesEmpty: "Henüz rol yok",
    rolesHint: "Vardiyalar ve çalışanlar için rol kataloğu oluşturun",
  },
  zh: {
    employeesTitle: "员工",
    employeePlaceholder: "员工姓名",
    employeesEmpty: "还没有员工",
    employeesHint: "在上方添加第一名员工",
    rolesTitle: "角色",
    rolePlaceholder: "例如，经理",
    rolesEmpty: "还没有角色",
    rolesHint: "为班次和员工创建角色目录",
  },
  ja: {
    employeesTitle: "従業員",
    employeePlaceholder: "従業員名",
    employeesEmpty: "まだ誰もいません",
    employeesHint: "上で最初の従業員を追加してください",
    rolesTitle: "役割",
    rolePlaceholder: "例: マネージャー",
    rolesEmpty: "役割はまだありません",
    rolesHint: "シフトと従業員用の役割カタログを作成します",
  },
};

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
  onAddRole?: (role: string) => void; dark: boolean;
}) {
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const tc = colors(dark);
  useEffect(() => { setTimeout(() => searchRef.current?.focus(), 150); }, []);

  const q = query.trim().toLowerCase();
  const filtered = globalRoles.filter(r => r.toLowerCase().includes(q));
  const exactMatch = globalRoles.some(r => r.toLowerCase() === q);
  const showAdd = !!onAddRole && q.length > 0 && !exactMatch;

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
            onClick={() => { onAddRole?.(query.trim()); onToggleRole(emp.id, query.trim()); setQuery(""); }}
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
  const [submitted, setSubmitted] = useState(false);
  const tc = colors(dark);
  let nextId = useRef(100);

  const reset = () => { setType("sick"); setDateFrom(""); setDateTo(""); setRepeat("once"); setWeekDays([]); setMonthDays([]); setOnceDate(""); setTimeFrom(""); setTimeTo(""); setSubmitted(false); setShowForm(false); };
  const dateInvalid = (type === "sick" || type === "vacation") && !!dateFrom && !!dateTo && dateTo < dateFrom;
  const timeInvalid = invalidTimeRange(timeFrom, timeTo);

  const canAdd = type === "sick" || type === "vacation"
    ? (!!dateFrom && !!dateTo && !dateInvalid)
    : repeat === "once" ? !!onceDate
    : repeat === "weekly" ? weekDays.length > 0
    : monthDays.length > 0;

  const handleAdd = () => {
    setSubmitted(true);
    if (!canAdd || timeInvalid) return;
    const a: Absence = { id: nextId.current++, type, dateFrom, dateTo, repeat, onceDate, weekDays, monthDays, timeFrom: timeFrom || undefined, timeTo: timeTo || undefined };
    onUpdate([...emp.absences, a]); reset();
  };
  const missingMessage = submitted && !canAdd && !dateInvalid
    ? "Заполните обязательные поля для отсутствия."
    : "";

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
              {dateInvalid && <p style={{ color: "#f87171", fontSize: "0.72rem", margin: "-4px 0 0", lineHeight: 1.4 }}>Дата окончания не может быть раньше начала</p>}

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
                {timeInvalid && <p style={{ color: "#f87171", fontSize: "0.72rem", margin: "-4px 0 0", lineHeight: 1.4 }}>Время окончания должно быть позже начала</p>}
                </>
              )}
              {missingMessage && (
                <p style={{ color: "#f87171", fontSize: "0.72rem", margin: "-4px 0 0", lineHeight: 1.4 }}>
                  {missingMessage}
                </p>
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
  const invalid = !!emp.hired && !!emp.fired && emp.fired < emp.hired;
  const [saved, setSaved] = useState(false);
  const save = () => {
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1200);
  };
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
      {invalid && <p style={{ color: "#f87171", fontSize: "0.72rem", margin: "-6px 0 0", lineHeight: 1.4 }}>Дата увольнения не может быть раньше даты найма</p>}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px" }}>
        <span style={{ color: saved ? (dark ? "#6ee7b7" : "#047857") : tc.faint, fontSize: "0.78rem" }}>
          {saved ? "Сохранено" : "Даты сохраняются в карточке сотрудника"}
        </span>
        <SaveBtn label="Сохранить" onClick={save} />
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
  const [submitted, setSubmitted] = useState(false);
  const tc = colors(dark);
  const nextId = useRef(200);

  const reset = () => { setPrefer("prefer"); setRepeat("daily"); setWeekDays([]); setMonthDays([]); setTimeFrom(""); setTimeTo(""); setSubmitted(false); setShowForm(false); };
  const timeInvalid = invalidTimeRange(timeFrom, timeTo);

  const canAdd = !!timeFrom && !!timeTo && !timeInvalid && (repeat === "daily" || (repeat === "weekly" && weekDays.length > 0) || (repeat === "monthly" && monthDays.length > 0));

  const handleAdd = () => {
    setSubmitted(true);
    if (!canAdd) return;
    const p: TimePreference = { id: nextId.current++, prefer, repeat, weekDays, monthDays, timeFrom, timeTo };
    onUpdate([...emp.timePrefs, p]); reset();
  };
  const missingMessage = submitted && !canAdd && !timeInvalid
    ? "Заполните время и выбранные дни."
    : "";

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
              {timeInvalid && <p style={{ color: "#f87171", fontSize: "0.72rem", margin: "-4px 0 0", lineHeight: 1.4 }}>Время окончания должно быть позже начала</p>}
              {missingMessage && <p style={{ color: "#f87171", fontSize: "0.72rem", margin: "-4px 0 0", lineHeight: 1.4 }}>{missingMessage}</p>}
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
function SimpleEmployeeRow({ emp, dark, onDelete }: { emp: EmpData; dark: boolean; onDelete: () => void }) {
  const tc = colors(dark);
  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -12 }} transition={{ duration: 0.18 }}
      style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px", borderRadius: "10px", border: `1px solid ${tc.rowBorder}`, marginBottom: "6px" }}
    >
      <Avatar name={emp.name} size={32} />
      <span style={{ flex: 1, color: tc.headline, fontSize: "0.9rem", fontWeight: 500, letterSpacing: "-0.01em" }}>{emp.name}</span>
      <button onClick={onDelete} style={{ background: "none", border: "none", cursor: "pointer", padding: "4px", borderRadius: "6px", display: "flex", color: tc.iconMuted, transition: "color 0.15s", flexShrink: 0 }}
        onMouseEnter={e => (e.currentTarget.style.color = "#f87171")} onMouseLeave={e => (e.currentTarget.style.color = tc.iconMuted)}
      ><Trash2 size={13} strokeWidth={1.8} /></button>
    </motion.div>
  );
}

function StepEmployees({ employees, onAdd, onDelete, dark, copy }: {
  employees: EmpData[];
  onAdd: (name: string) => void;
  onDelete: (id: number) => void;
  dark: boolean;
  copy: typeof wizardStepCopy.ru;
}) {
  const [inputVal, setInputVal] = useState("");
  const [focused, setFocused] = useState(false);
  const addRef = useRef<HTMLInputElement>(null);
  const tc = colors(dark);
  const handleAdd = () => { const t = inputVal.trim(); if (!t) return; onAdd(t); setInputVal(""); addRef.current?.focus(); };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "14px", height: "100%", minHeight: 0 }}>
      <p style={{ color: tc.headline, fontWeight: 600, fontSize: "1.15rem", margin: 0, letterSpacing: "-0.03em" }}>{copy.employeesTitle}</p>
      <div style={{ display: "flex", gap: "8px" }}>
        <input ref={addRef} value={inputVal} onChange={e => setInputVal(e.target.value)}
          onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
          onKeyDown={e => { if (e.key === "Enter") handleAdd(); }}
          placeholder={copy.employeePlaceholder}
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
              <p style={{ color: tc.sub, fontSize: "0.85rem", margin: "0 0 3px", fontWeight: 500 }}>{copy.employeesEmpty}</p>
              <p style={{ color: tc.faint, fontSize: "0.78rem", margin: 0 }}>{copy.employeesHint}</p>
            </motion.div>
          ) : employees.map(emp => (
            <SimpleEmployeeRow key={emp.id} emp={emp} dark={dark} onDelete={() => onDelete(emp.id)} />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

function StepRoles({ roles, onAdd, onRename, onDelete, dark, copy }: {
  roles: string[];
  onAdd: (role: string) => void;
  onRename: (from: string, to: string) => void;
  onDelete: (role: string) => void;
  dark: boolean;
  copy: typeof wizardStepCopy.ru;
}) {
  const [inputVal, setInputVal] = useState("");
  const [focused, setFocused] = useState(false);
  const [editingRole, setEditingRole] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState("");
  const tc = colors(dark);
  const addRole = () => { const value = inputVal.trim(); if (!value) return; onAdd(value); setInputVal(""); };
  const saveRename = () => {
    if (!editingRole) return;
    const value = editingValue.trim();
    if (value) onRename(editingRole, value);
    setEditingRole(null);
    setEditingValue("");
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "14px", height: "100%", minHeight: 0 }}>
      <p style={{ color: tc.headline, fontWeight: 600, fontSize: "1.15rem", margin: 0, letterSpacing: "-0.03em" }}>{copy.rolesTitle}</p>
      <div style={{ display: "flex", gap: "8px" }}>
        <input value={inputVal} onChange={e => setInputVal(e.target.value)}
          onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
          onKeyDown={e => { if (e.key === "Enter") addRole(); }}
          placeholder={copy.rolePlaceholder}
          style={{ flex: 1, background: tc.inputBg, border: `1.5px solid ${focused ? "#a855f7" : tc.inputBorder}`, borderRadius: "10px", padding: "13px 16px", color: tc.headline, fontSize: "0.95rem", fontFamily: "'DM Sans',sans-serif", outline: "none", transition: "border-color 0.18s", boxSizing: "border-box" }}
        />
        <button onClick={addRole} style={{ background: inputVal.trim() ? "linear-gradient(135deg,#a855f7,#ec4899)" : (dark ? "rgba(168,85,247,0.08)" : "rgba(168,85,247,0.06)"), border: `1.5px solid ${inputVal.trim() ? "transparent" : tc.inputBorder}`, borderRadius: "10px", cursor: inputVal.trim() ? "pointer" : "default", padding: "0 16px", display: "flex", alignItems: "center", color: inputVal.trim() ? "#fff" : tc.iconMuted, transition: "all 0.18s", flexShrink: 0 }}>
          <Plus size={18} strokeWidth={2} />
        </button>
      </div>
      <div style={{ flex: 1, overflowY: "auto", minHeight: 0 }}>
        {roles.length === 0 ? (
          <div style={{ textAlign: "center", padding: "28px 0" }}>
            <Tag size={32} strokeWidth={1.2} style={{ color: tc.faint, display: "block", margin: "0 auto 10px" }} />
            <p style={{ color: tc.sub, fontSize: "0.85rem", margin: "0 0 3px", fontWeight: 500 }}>{copy.rolesEmpty}</p>
            <p style={{ color: tc.faint, fontSize: "0.78rem", margin: 0 }}>{copy.rolesHint}</p>
          </div>
        ) : roles.map(role => (
          <div key={role} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px", borderRadius: "10px", border: `1px solid ${tc.rowBorder}`, marginBottom: "6px" }}>
            <Tag size={15} strokeWidth={1.8} style={{ color: dark ? "#c4b5fd" : "#7c3aed", flexShrink: 0 }} />
            {editingRole === role ? (
              <input value={editingValue} onChange={e => setEditingValue(e.target.value)} onKeyDown={e => { if (e.key === "Enter") saveRename(); if (e.key === "Escape") setEditingRole(null); }}
                autoFocus
                style={{ flex: 1, minWidth: 0, background: tc.inputBg, border: `1.5px solid #a855f7`, borderRadius: "8px", padding: "8px 10px", color: tc.headline, fontSize: "0.88rem", fontFamily: "'DM Sans',sans-serif", outline: "none", boxSizing: "border-box" }}
              />
            ) : (
              <button onClick={() => { setEditingRole(role); setEditingValue(role); }} style={{ flex: 1, minWidth: 0, background: "none", border: "none", padding: 0, color: tc.headline, fontSize: "0.9rem", fontWeight: 500, fontFamily: "'DM Sans',sans-serif", textAlign: "left", cursor: "pointer" }}>{role}</button>
            )}
            {editingRole === role && <button onClick={saveRename} style={{ background: "none", border: "none", cursor: "pointer", padding: "4px", color: dark ? "#c4b5fd" : "#7c3aed", display: "flex" }}><Check size={14} strokeWidth={2.2} /></button>}
            <button onClick={() => onDelete(role)} style={{ background: "none", border: "none", cursor: "pointer", padding: "4px", color: tc.iconMuted, display: "flex", borderRadius: "6px", transition: "color 0.15s", flexShrink: 0 }}
              onMouseEnter={e => (e.currentTarget.style.color = "#f87171")} onMouseLeave={e => (e.currentTarget.style.color = tc.iconMuted)}
            ><Trash2 size={13} strokeWidth={1.8} /></button>
          </div>
        ))}
      </div>
    </div>
  );
}

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
function EmployeeConfigRow({ emp, dark, onFeatureClick, showProblems, copy }: {
  emp: EmpData;
  dark: boolean;
  onFeatureClick: (key: string) => void;
  showProblems: boolean;
  copy: typeof wizardCopy.ru;
}) {
  const tc = colors(dark);
  const problems = showProblems ? employeeProblems(emp, copy.employeeProblems) : [];
  const complete = problems.length === 0;
  return (
    <div style={{
      display: "flex", flexDirection: "column", gap: "8px", width: "100%",
      padding: "10px", borderRadius: "10px", border: `1px solid ${complete ? tc.rowBorder : "rgba(248,113,113,0.35)"}`,
      marginBottom: "6px", background: complete ? "transparent" : (dark ? "rgba(248,113,113,0.06)" : "rgba(248,113,113,0.045)"),
      fontFamily: "'DM Sans',sans-serif", textAlign: "left",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <Avatar name={emp.name} size={32} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ color: tc.headline, fontSize: "0.9rem", fontWeight: 500, margin: 0 }}>{emp.name}</p>
          {!complete && <p style={{ color: "#f87171", fontSize: "0.72rem", margin: "2px 0 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{problems.join(", ")}</p>}
        </div>
        <span style={{ color: complete ? (dark ? "#6ee7b7" : "#047857") : "#f59e0b", fontSize: "0.9rem", fontWeight: 700 }}>
          {complete ? "✓" : "⚠"}
        </span>
      </div>
      <div style={{ display: "flex", gap: "5px", flexWrap: "wrap" }}>
        {ACTIONS.map(({ key, icon: Icon, label }) => {
          const active = hasData(emp, key);
          const actionLabel = copy.actions[key as keyof typeof copy.actions] ?? label;
          return (
            <button key={key} onClick={() => onFeatureClick(key)} style={{
              display: "inline-flex", alignItems: "center", gap: "5px",
              padding: "4px 10px", borderRadius: "99px", cursor: "pointer",
              background: active ? tc.chipActiveBg : tc.chipBg,
              border: `1px solid ${active ? tc.chipActiveBorder : tc.rowBorder}`,
              color: active ? tc.chipActiveFg : (dark ? "#c4bde0" : "#8878aa"),
              fontSize: "0.72rem", fontWeight: 500, fontFamily: "'DM Sans',sans-serif",
              transition: "all 0.15s", whiteSpace: "nowrap",
            }}>
              <Icon size={11} strokeWidth={1.8} />{actionLabel}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function StepEmployeeConfig({ employees, globalRoles, onAddRole, onUpdateEmp, dark, editing, setEditing, showProblems, copy }: {
  employees: EmpData[];
  globalRoles: string[];
  onAddRole: (role: string) => void;
  onUpdateEmp: (id: number, patch: Partial<EmpData>) => void;
  dark: boolean;
  editing: { empId: number; feature: string } | null;
  setEditing: (v: { empId: number; feature: string } | null) => void;
  showProblems: boolean;
  copy: typeof wizardCopy.ru;
}) {
  const tc = colors(dark);
  const [draftEmp, setDraftEmp] = useState<EmpData | null>(null);
  const editingEmp = editing ? employees.find(e => e.id === editing.empId) : null;
  const activeEmp = draftEmp ?? editingEmp;

  const openFeature = (emp: EmpData, feature: string) => {
    setDraftEmp(cloneEmployee(emp));
    setEditing({ empId: emp.id, feature });
  };

  const closeDraft = () => {
    setEditing(null);
    setDraftEmp(null);
  };

  const saveDraft = () => {
    if (draftEmp) onUpdateEmp(draftEmp.id, draftEmp);
    closeDraft();
  };

  const updateDraft = (patch: Partial<EmpData>) => {
    setDraftEmp(prev => prev ? { ...prev, ...patch } : prev);
  };

  const toggleDraftRole = (empId: number, role: string) => {
    setDraftEmp(prev => {
      if (!prev || prev.id !== empId) return prev;
      return { ...prev, roles: prev.roles.includes(role) ? prev.roles.filter(r => r !== role) : [...prev.roles, role] };
    });
  };

  const renderFeature = () => {
    if (!activeEmp) return null;
    if (editing!.feature === "roles")       return <RolesPanel emp={activeEmp} globalRoles={globalRoles} onToggleRole={toggleDraftRole} onAddRole={onAddRole} dark={dark} />;
    if (editing!.feature === "absences")    return <AbsencesPanel emp={activeEmp} onUpdate={a => updateDraft({ absences: a })} dark={dark} />;
    if (editing!.feature === "dates")       return <HireDatesPanel emp={activeEmp} onUpdate={(h, f) => updateDraft({ hired: h, fired: f })} dark={dark} />;
    if (editing!.feature === "timePrefs")   return <TimePrefsPanel emp={activeEmp} onUpdate={p => updateDraft({ timePrefs: p })} dark={dark} />;
    if (editing!.feature === "socialPrefs") return <SocialPrefsPanel emp={activeEmp} allEmployees={employees} onUpdate={p => updateDraft({ socialPrefs: p })} dark={dark} />;
    return null;
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", minHeight: 0 }}>
      <p style={{ color: tc.headline, fontWeight: 600, fontSize: "1.15rem", margin: "0 0 6px", letterSpacing: "-0.03em" }}>{copy.employeeConfig.title}</p>
      <p style={{ color: tc.sub, fontSize: "0.8rem", margin: "0 0 12px", lineHeight: 1.55 }}>
        {copy.employeeConfig.desc}
      </p>
      <div style={{ flex: 1, overflowY: "auto", minHeight: 0 }}>
        {employees.length === 0 ? (
          <div style={{ textAlign: "center", padding: "28px 0" }}>
            <UserRound size={32} strokeWidth={1.2} style={{ color: tc.faint, display: "block", margin: "0 auto 10px" }} />
            <p style={{ color: tc.sub, fontSize: "0.85rem", margin: 0 }}>{copy.employeeConfig.empty}</p>
          </div>
        ) : employees.map(emp => (
          <EmployeeConfigRow
            key={emp.id}
            emp={emp}
            dark={dark}
            onFeatureClick={feature => openFeature(emp, feature)}
            showProblems={showProblems}
            copy={copy}
          />
        ))}
      </div>
      <AnimatePresence>
        {editing && editingEmp && activeEmp && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.16 }}
              onClick={closeDraft}
              style={{
                position: "fixed",
                inset: 0,
                background: dark ? "rgba(0,0,0,0.34)" : "rgba(15,10,30,0.18)",
                backdropFilter: "blur(3px)",
                zIndex: 62,
              }}
            />
            <motion.div
              initial={{ opacity: 0, x: "-50%", y: "calc(-50% + 18px)", scale: 0.98 }}
              animate={{ opacity: 1, x: "-50%", y: "-50%", scale: 1 }}
              exit={{ opacity: 0, x: "-50%", y: "calc(-50% + 18px)", scale: 0.98 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              onClick={e => e.stopPropagation()}
              style={{
                position: "fixed",
                left: "50%",
                top: "50%",
                zIndex: 63,
                width: "min(500px, calc(100vw - 20px))",
                height: "min(660px, calc(100dvh - 20px))",
                display: "flex",
                flexDirection: "column",
                boxSizing: "border-box",
                padding: "22px 22px 18px",
                borderRadius: "18px",
                border: `1px solid ${tc.formBorder}`,
                background: dark ? "#111018" : "#ffffff",
                boxShadow: dark ? "0 24px 80px rgba(0,0,0,0.62)" : "0 24px 70px rgba(15,10,30,0.18)",
              }}
            >
              <button
                onClick={closeDraft}
                style={{
                  position: "absolute",
                  right: "16px",
                  top: "14px",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: "4px",
                  color: tc.iconMuted,
                  display: "flex",
                  zIndex: 1,
                }}
              >
                <X size={16} />
              </button>
              <div style={{ flex: 1, minHeight: 0, overflowY: "auto", display: "flex", flexDirection: "column", paddingRight: "2px" }}>
                {renderFeature()}
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", paddingTop: "14px", flex: "0 0 auto" }}>
                <button
                  onClick={saveDraft}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    minWidth: "112px",
                    padding: "11px 16px",
                    borderRadius: "10px",
                    border: "none",
                    background: "linear-gradient(135deg,#a855f7,#ec4899)",
                    color: "#fff",
                    cursor: "pointer",
                    fontSize: "0.9rem",
                    fontWeight: 600,
                    fontFamily: "'DM Sans',sans-serif",
                    boxShadow: "0 4px 18px rgba(168,85,247,0.28)",
                  }}
                >
                  {copy.done}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

interface WizardProps { open: boolean; onClose: () => void; dark: boolean; language: LanguageCode; }

export function Wizard({ open, onClose, dark, language }: WizardProps) {
  const [step, setStep]           = useState(1);
  const [scheduleName, setScheduleName] = useState("");
  const [employees, setEmployees] = useState<EmpData[]>([]);
  const [globalRoles, setGlobalRoles] = useState<string[]>([]);
  const [nextId, setNextId]       = useState(1);
  const [step3Data, setStep3Data] = useState<Step3Data>(defaultStep3());
  const [step5Data, setStep5Data] = useState<Step5Data>(defaultStep5());
  const [editing, setEditing]     = useState<{ empId: number; feature: string } | null>(null);
  const [generationOpen, setGenerationOpen] = useState(false);
  const [continueAttempted, setContinueAttempted] = useState(false);

  const copy = wizardCopy[language] ?? wizardCopy.ru;
  const stepCopy = wizardStepCopy[language] ?? wizardStepCopy.ru;

  useEffect(() => {
    if (open) {
      setEditing(null);
      setGenerationOpen(false);
      setContinueAttempted(false);
    }
  }, [open]);

  useEffect(() => {
    setContinueAttempted(false);
  }, [step]);

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

  const addRole = (role: string) => {
    setGlobalRoles(p => p.some(r => r.toLowerCase() === role.toLowerCase()) ? p : [...p, role]);
  };

  const renameRole = (from: string, to: string) => {
    if (from === to) return;
    setGlobalRoles(p => p.map(r => r === from ? to : r));
    setEmployees(p => p.map(e => ({ ...e, roles: e.roles.map(r => r === from ? to : r) })));
    setStep3Data(p => ({ ...p, configs: p.configs.map(c => ({ ...c, shifts: c.shifts.map(s => s.role === from ? { ...s, role: to } : s) })) }));
  };

  const deleteRole = (role: string) => {
    setGlobalRoles(p => p.filter(r => r !== role));
    setEmployees(p => p.map(e => ({ ...e, roles: e.roles.filter(r => r !== role) })));
    setStep3Data(p => ({ ...p, configs: p.configs.map(c => ({ ...c, shifts: c.shifts.map(s => s.role === role ? { ...s, role: "" } : s) })) }));
  };

  const updateEmp = (id: number, patch: Partial<EmpData>) => {
    setEmployees(p => p.map(e => e.id !== id ? e : { ...e, ...patch }));
  };

  const bg        = dark ? "#111018" : "#ffffff";
  const border    = dark ? "rgba(168,85,247,0.12)" : "rgba(168,85,247,0.14)";
  const stepLabel = dark ? "#c4bde0" : "#a89ec0";
  const overlayBg = dark ? "rgba(0,0,0,0.65)" : "rgba(15,10,30,0.35)";

  const inFeature   = false;
  const editingEmp  = inFeature ? employees.find(e => e.id === editing!.empId) : null;
  const featureHasData = editingEmp ? hasData(editingEmp, editing!.feature) : false;
  const btnDisabled = inFeature && editing!.feature === "roles" && !featureHasData;
  const featureLabels: Record<string, string> = { roles: copy.done, absences: copy.done, dates: copy.done, timePrefs: copy.done, socialPrefs: copy.done };
  const rightBtnLabel = inFeature
    ? (featureLabels[editing!.feature] ?? copy.done)
    : step === 6 ? copy.generate
    : copy.continue;
  const validationMessage =
    step === 1 && employees.length === 0 ? copy.validation.employees
    : step === 2 && globalRoles.length === 0 ? copy.validation.roles
    : step === 4 && !hasAnyShift(step3Data) ? copy.validation.shifts
    : step === 4 && hasInvalidShiftTimes(step3Data) ? copy.validation.shiftTime
    : step === 5 && hasInvalidBreakTimes(step5Data) ? copy.validation.breakTime
    : step === 6 && hasUnassignedEmployees(employees) ? copy.validation.employeeRoles
    : step === 6 && hasEmployeeValidationErrors(employees) ? copy.validation.employeeSettings
    : "";
  const showValidationMessage = continueAttempted && !!validationMessage;

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
              <span style={{ color: stepLabel, fontSize: "0.78rem", letterSpacing: "0.04em" }}>{copy.step} {step}/{TOTAL_STEPS}</span>
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
                  {step === 1 && (
                    <StepEmployees employees={employees}
                      onAdd={addEmployee} onDelete={id => setEmployees(p => p.filter(e => e.id !== id))}
                      dark={dark}
                      copy={stepCopy}
                    />
                  )}
                  {step === 2 && <StepRoles roles={globalRoles} onAdd={addRole} onRename={renameRole} onDelete={deleteRole} dark={dark} copy={stepCopy} />}
                  {step === 3 && <StepThree data={step3Data} onChange={setStep3Data} dark={dark} />}
                  {step === 4 && <StepFour data={step3Data} onChange={setStep3Data} globalRoles={globalRoles} onGoToStep={setStep} dark={dark} />}
                  {step === 5 && <StepFive data={step5Data} onChange={setStep5Data} scheduleName={scheduleName} onScheduleNameChange={setScheduleName} scheduleCopy={copy.schedule} dark={dark} />}
                  {step === 6 && (
                    <StepEmployeeConfig employees={employees} globalRoles={globalRoles}
                      onAddRole={addRole} onUpdateEmp={updateEmp}
                      dark={dark} editing={editing} setEditing={setEditing}
                      showProblems={continueAttempted && step === 6}
                      copy={copy}
                    />
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Footer */}
            <div style={{ paddingTop: "20px" }}>
              {showValidationMessage && (
                <div style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "8px",
                  padding: "10px 12px",
                  borderRadius: "10px",
                  marginBottom: "12px",
                  background: dark ? "rgba(248,113,113,0.08)" : "rgba(248,113,113,0.06)",
                  border: "1px solid rgba(248,113,113,0.24)",
                  color: "#f87171",
                  fontSize: "0.78rem",
                  lineHeight: 1.45,
                }}>
                  <AlertCircle size={14} strokeWidth={1.9} style={{ flex: "0 0 auto", marginTop: "1px" }} />
                  <span>{validationMessage}</span>
                </div>
              )}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <a onClick={() => inFeature ? setEditing(null) : step > 1 ? setStep(s => s - 1) : undefined}
                  style={{ display: "inline-flex", alignItems: "center", gap: "3px", color: inFeature ? (dark ? "#c4b5fd" : "#7c3aed") : stepLabel, fontSize: "0.875rem", cursor: step > 1 || inFeature ? "pointer" : "default", textDecoration: "none", transition: "opacity 0.15s", visibility: step > 1 || inFeature ? "visible" : "hidden" }}
                  onMouseEnter={e => ((e.currentTarget as HTMLElement).style.opacity = "0.7")}
                  onMouseLeave={e => ((e.currentTarget as HTMLElement).style.opacity = "1")}
                >
                  {(step > 1 || inFeature) && <ChevronLeft size={14} strokeWidth={2.5} />}
                  {copy.back}
                </a>

                <button disabled={btnDisabled}
                  onClick={() => {
                    if (inFeature) { setEditing(null); return; }
                    if (validationMessage) { setContinueAttempted(true); return; }
                    if (step === 6) {
                      setGenerationOpen(true);
                      return;
                    }
                    setStep(s => Math.min(s + 1, TOTAL_STEPS));
                  }}
                  style={{ display: "inline-flex", alignItems: "center", padding: "13px 16px", borderRadius: "10px", background: btnDisabled ? (dark ? "rgba(168,85,247,0.12)" : "rgba(168,85,247,0.08)") : "linear-gradient(135deg,#a855f7 0%,#ec4899 100%)", color: btnDisabled ? (dark ? "#4a4468" : "#c4b8d8") : "#fff", fontSize: "0.95rem", fontWeight: 500, border: "none", cursor: btnDisabled ? "default" : "pointer", fontFamily: "'DM Sans',sans-serif", boxShadow: btnDisabled ? "none" : "0 4px 20px rgba(168,85,247,0.3)", transition: "all 0.18s ease", whiteSpace: "nowrap" }}
                  onMouseEnter={e => { if (!btnDisabled) { e.currentTarget.style.filter = "brightness(1.07)"; e.currentTarget.style.boxShadow = "0 6px 28px rgba(168,85,247,0.45)"; } }}
                  onMouseLeave={e => { e.currentTarget.style.filter = "brightness(1)"; e.currentTarget.style.boxShadow = btnDisabled ? "none" : "0 4px 20px rgba(168,85,247,0.3)"; }}
                >{rightBtnLabel}</button>
              </div>
            </div>

            <AnimatePresence>
              {generationOpen && (
                <>
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.16 }}
                    onClick={() => setGenerationOpen(false)}
                    style={{
                      position: "fixed",
                      inset: 0,
                      background: dark ? "rgba(0,0,0,0.36)" : "rgba(15,10,30,0.18)",
                      backdropFilter: "blur(3px)",
                      zIndex: 70,
                    }}
                  />
                  <motion.div
                    initial={{ opacity: 0, x: "-50%", y: "calc(-50% + 18px)", scale: 0.98 }}
                    animate={{ opacity: 1, x: "-50%", y: "-50%", scale: 1 }}
                    exit={{ opacity: 0, x: "-50%", y: "calc(-50% + 18px)", scale: 0.98 }}
                    transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                    style={{
                      position: "fixed",
                      left: "50%",
                      top: "50%",
                      zIndex: 71,
                      width: "min(360px, calc(100vw - 32px))",
                      padding: "24px",
                      borderRadius: "18px",
                      border: `1px solid ${border}`,
                      background: dark ? "#111018" : "#ffffff",
                      boxShadow: dark ? "0 24px 80px rgba(0,0,0,0.62)" : "0 24px 70px rgba(15,10,30,0.18)",
                      textAlign: "center",
                    }}
                  >
                    <div style={{
                      width: "42px",
                      height: "42px",
                      margin: "0 auto 14px",
                      borderRadius: "14px",
                      background: "linear-gradient(135deg,#a855f7,#ec4899)",
                      boxShadow: "0 12px 30px rgba(168,85,247,0.32)",
                    }} />
                    <p style={{ color: dark ? "#f0ecff" : "#0f0a1e", fontSize: "1.08rem", fontWeight: 650, margin: "0 0 8px", letterSpacing: "-0.02em" }}>
                      {copy.generationTitle}
                    </p>
                    <p style={{ color: stepLabel, fontSize: "0.82rem", lineHeight: 1.6, margin: "0 0 18px" }}>
                      {copy.generationText}
                    </p>
                    <button
                      onClick={() => setGenerationOpen(false)}
                      style={{
                        width: "100%",
                        padding: "11px 14px",
                        borderRadius: "10px",
                        border: "none",
                        background: "linear-gradient(135deg,#a855f7,#ec4899)",
                        color: "#fff",
                        cursor: "pointer",
                        fontFamily: "'DM Sans',sans-serif",
                        fontSize: "0.9rem",
                        fontWeight: 600,
                      }}
                    >
                      {copy.ok}
                    </button>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
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
