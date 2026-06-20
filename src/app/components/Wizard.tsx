import { useState, useEffect, useRef } from "react";
import { StepThree, StepFour, Step3Data, defaultStep3, hasInvalidShiftTimes } from "./WizardStep3";
import { StepFive, Step5Data, defaultStep5, hasInvalidBreakTimes } from "./WizardStep5";
import { motion, AnimatePresence } from "motion/react";
import {
  X, Plus, Trash2, Tag, CalendarOff, CalendarRange,
  Clock3, Users2, UserRound, ChevronLeft, Search, Check, House,
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
  startHint: string;
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
    startHint: "Добавьте первого сотрудника, чтобы составить расписание",
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
    startHint: "Add your first employee to build a schedule",
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
    startHint: "Кесте жасау үшін бірінші қызметкерді қосыңыз",
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
    startHint: "Fügen Sie den ersten Mitarbeiter hinzu, um einen Dienstplan zu erstellen",
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
    startHint: "Ajoutez votre premier employé pour créer un planning",
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
    startHint: "Añade tu primer empleado para crear un horario",
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
    startHint: "Aggiungi il primo dipendente per creare un calendario",
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
    startHint: "Adicione o primeiro funcionário para criar uma escala",
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
    startHint: "Plan oluşturmak için ilk çalışanı ekleyin",
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
    startHint: "添加第一名员工以开始编排排班计划",
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
    startHint: "スケジュールを作成するために最初の従業員を追加してください",
  },
};

// ─── Generation-done copy ─────────────────────────────────────────────────────
const genCopy: Record<LanguageCode, { done: string; doneText: string; signUp: string; download: string }> = {
  ru:  { done: "Готово! Расписание составлено",   doneText: "Создайте аккаунт, чтобы редактировать и поделиться. Или скачайте файл прямо сейчас.",        signUp: "Создать аккаунт", download: "Скачать Excel-файл"         },
  en:  { done: "Done! Schedule is ready",          doneText: "Create an account to edit and share. Or download the file right now.",                        signUp: "Create account",  download: "Download Excel file"        },
  kk:  { done: "Дайын! Кесте құрылды",            doneText: "Өңдеу және бөлісу үшін аккаунт жасаңыз. Немесе файлды қазір жүктеңіз.",                     signUp: "Аккаунт жасау",   download: "Excel файлын жүктеу"          },
  de:  { done: "Fertig! Dienstplan erstellt",      doneText: "Erstellen Sie ein Konto zum Bearbeiten und Teilen. Oder laden Sie die Datei jetzt herunter.", signUp: "Konto erstellen", download: "Excel-Datei herunterladen"  },
  fr:  { done: "Prêt ! Planning créé",       doneText: "Créez un compte pour modifier et partager. Ou téléchargez le fichier maintenant.",            signUp: "Créer un compte", download: "Télécharger le fichier Excel"},
  es:  { done: "¡Listo! Horario creado",          doneText: "Crea una cuenta para editar y compartir. O descarga el archivo ahora.",                       signUp: "Crear cuenta",    download: "Descargar archivo Excel"    },
  it:  { done: "Fatto! Calendario creato",        doneText: "Crea un account per modificare e condividere. O scarica subito il file.",                     signUp: "Crea account",    download: "Scarica file Excel"         },
  pt:  { done: "Pronto! Escala criada",           doneText: "Crie uma conta para editar e compartilhar. Ou baixe o arquivo agora.",                        signUp: "Criar conta",     download: "Baixar arquivo Excel"       },
  tr:  { done: "Hazır! Plan oluşturuldu",         doneText: "Düzenlemek ve paylaşmak için hesap oluşturun. Ya da dosyayı hemen indirin.",                  signUp: "Hesap oluştur",   download: "Excel dosyasını indir"          },
  zh:  { done: "完成！排班已生成",                 doneText: "创建账号以编辑和分享。或者立即下载文件。",                                                    signUp: "创建账号",        download: "下载 Excel 文件"             },
  ja:  { done: "完了！シフト表が作成されました",   doneText: "編集・共有するにはアカウントを作成してください。または今すぐファイルをダウンロード。",        signUp: "アカウント作成",  download: "Excel ファイルをダウンロード" },
};

// ─── Step title copy ──────────────────────────────────────────────────────────
const stepTitlesCopy: Record<LanguageCode, [string, string, string, string]> = {
  ru: ["Сотрудники",    "Расписание",   "Смены",      "Настройки"    ],
  en: ["Employees",     "Schedule",     "Shifts",     "Settings"     ],
  kk: ["Қызметкерлер", "Кесте",        "Ауысымдар",  "Баптаулар"    ],
  de: ["Mitarbeiter",   "Dienstplan",   "Schichten",  "Einstellungen"],
  fr: ["Employés",      "Planning",     "Shifts",     "Paramètres"   ],
  es: ["Empleados",     "Horario",      "Turnos",     "Ajustes"      ],
  it: ["Dipendenti",    "Calendario",   "Turni",      "Impostazioni" ],
  pt: ["Funcionários",  "Escala",       "Turnos",     "Configurações"],
  tr: ["Çalışanlar",    "Plan",         "Vardiyalar", "Ayarlar"      ],
  zh: ["员工",          "排班计划",     "班次",       "设置"         ],
  ja: ["従業員",        "スケジュール", "シフト",     "設定"         ],
};

// ─── Panel copy (RolesPanel translations) ────────────────────────────────────
const rolePanelCopy: Record<LanguageCode, { search: string; emptyTitle: string; emptyHint: string; addRole: string }> = {
  ru: { search: "Поиск или новая роль…",    emptyTitle: "Ролей пока нет",      emptyHint: "Роли помогают учитывать квалификацию при составлении расписания",          addRole: "Добавить роль"   },
  en: { search: "Search or add a role…",    emptyTitle: "No roles yet",        emptyHint: "Roles help match qualifications when building the schedule",                addRole: "Add role"        },
  kk: { search: "Іздеу немесе жаңа рөл…",  emptyTitle: "Рөл жоқ",            emptyHint: "Рөлдер кесте құру кезінде біліктілікті ескеруге көмектеседі",              addRole: "Рөл қосу"       },
  de: { search: "Suchen oder neue Rolle…",  emptyTitle: "Noch keine Rollen",   emptyHint: "Rollen helfen, Qualifikationen bei der Planerstellung zu berücksichtigen", addRole: "Rolle hinzufügen"},
  fr: { search: "Rechercher ou nouveau rôle…", emptyTitle: "Aucun rôle",       emptyHint: "Les rôles aident à tenir compte des qualifications dans le planning",      addRole: "Ajouter un rôle" },
  es: { search: "Buscar o nuevo rol…",       emptyTitle: "Sin roles aún",      emptyHint: "Los roles ayudan a considerar las cualificaciones al crear el horario",    addRole: "Añadir rol"      },
  it: { search: "Cerca o nuovo ruolo…",      emptyTitle: "Ancora nessun ruolo",emptyHint: "I ruoli aiutano a considerare le qualifiche nella pianificazione",         addRole: "Aggiungi ruolo"  },
  pt: { search: "Pesquisar ou nova função…", emptyTitle: "Sem funções ainda",  emptyHint: "As funções ajudam a considerar qualificações na criação da escala",        addRole: "Adicionar função"},
  tr: { search: "Ara veya yeni rol…",        emptyTitle: "Henüz rol yok",      emptyHint: "Roller, plan oluştururken nitelikleri dikkate almaya yardımcı olur",       addRole: "Rol ekle"        },
  zh: { search: "搜索或添加新角色…",         emptyTitle: "还没有角色",          emptyHint: "角色有助于在生成排班时考虑资质",                                            addRole: "添加角色"        },
  ja: { search: "検索または新しい役割…",     emptyTitle: "役割はまだありません",emptyHint: "役割はシフト作成時の資格考慮に役立ちます",                                 addRole: "役割を追加"      },
};

// ─── Panel copy (full) ───────────────────────────────────────────────────────
type PanelCopy = {
  weekDays: readonly [string,string,string,string,string,string,string];
  noAbsences: string; noAbsencesHint: string;
  absenceType: string;
  sick: string; vacation: string; other: string;
  dateFrom: string; dateTo: string; dateError: string;
  repeat: string;
  once: string; weekly: string; monthly: string;
  date: string; weekdays: string; monthdays: string;
  timeFromOpt: string; timeTo: string; timeError: string;
  missingAbsence: string;
  cancel: string; add: string; addAbsence: string;
  sickLabel: string; vacationLabel: string;
  singleAbsence: string; weeklyLabel: string; monthlyLabel: string; absenceGeneric: string;
  numbersSuffix: string;
  hireDateDesc: string; hireDate: string; termDate: string;
  termBeforeHireError: string; savedOk: string; datesSavedInfo: string; save: string;
  noPrefs: string; noPrefsHint: string;
  timeType: string; preferWork: string; avoidWork: string;
  repeatLabel: string; daily: string; byWeekday: string; byMonthday: string;
  prefer: string; avoid: string; missingTimePref: string; addPref: string;
  socialDesc: string; noOthers: string; noOthersHint: string;
  together: string; separate: string;
};

const panelCopyRec: Record<LanguageCode, PanelCopy> = {
  ru: {
    weekDays: ["Пн","Вт","Ср","Чт","Пт","Сб","Вс"],
    noAbsences: "Нет отсутствий", noAbsencesHint: "Добавьте отпуск, больничный или регулярное отсутствие. Например, ежедневное отсутствие по утрам.",
    absenceType: "Тип отсутствия", sick: "Больничный", vacation: "Отпуск", other: "Другое",
    dateFrom: "С", dateTo: "По", dateError: "Дата окончания не может быть раньше начала",
    repeat: "Повторение", once: "Разово", weekly: "Еженедельно", monthly: "Ежемесячно",
    date: "Дата", weekdays: "Дни недели", monthdays: "Числа месяца",
    timeFromOpt: "Время с (необязательно)", timeTo: "Время по", timeError: "Время окончания должно быть позже начала",
    missingAbsence: "Заполните обязательные поля для отсутствия.", cancel: "Отмена", add: "Добавить", addAbsence: "Добавить отсутствие",
    sickLabel: "Больничный", vacationLabel: "Отпуск",
    singleAbsence: "Разовое отсутствие", weeklyLabel: "Еженедельно", monthlyLabel: "Ежемесячно", absenceGeneric: "Отсутствие", numbersSuffix: " числа",
    hireDateDesc: "Необязательная информация, но она позволит корректнее составить расписание и не назначить смену уволенному или ещё не вышедшему сотруднику.",
    hireDate: "Дата найма", termDate: "Дата увольнения",
    termBeforeHireError: "Дата увольнения не может быть раньше даты найма",
    savedOk: "Сохранено", datesSavedInfo: "Даты сохраняются в карточке сотрудника", save: "Сохранить",
    noPrefs: "Предпочтений нет", noPrefsHint: "Укажите, когда сотруднику удобно или неудобно работать. Постараемся учесть при генерации — но это мягкое условие, не жёсткое.",
    timeType: "Тип", preferWork: "Удобно работать", avoidWork: "Неудобно работать",
    repeatLabel: "Повторение", daily: "Каждый день", byWeekday: "По дням недели", byMonthday: "По дням месяца",
    prefer: "Удобно", avoid: "Неудобно", missingTimePref: "Заполните время и выбранные дни.", addPref: "Добавить предпочтение",
    socialDesc: "Укажите, с кем сотрудник хочет или не хочет работать в смену. Постараемся учесть при составлении расписания, но это мягкое условие.",
    noOthers: "Нет других сотрудников", noOthersHint: "Добавьте ещё одного сотрудника, чтобы настроить предпочтения",
    together: "Вместе", separate: "Раздельно",
  },
  en: {
    weekDays: ["Mo","Tu","We","Th","Fr","Sa","Su"],
    noAbsences: "No absences", noAbsencesHint: "Add vacation, sick leave, or a recurring absence. For example, daily absences in the morning.",
    absenceType: "Absence type", sick: "Sick leave", vacation: "Vacation", other: "Other",
    dateFrom: "From", dateTo: "To", dateError: "End date cannot be before start date",
    repeat: "Repeat", once: "Once", weekly: "Weekly", monthly: "Monthly",
    date: "Date", weekdays: "Weekdays", monthdays: "Days of month",
    timeFromOpt: "From (optional)", timeTo: "To", timeError: "End time must be later than start time",
    missingAbsence: "Fill in the required fields for this absence.", cancel: "Cancel", add: "Add", addAbsence: "Add absence",
    sickLabel: "Sick leave", vacationLabel: "Vacation",
    singleAbsence: "Single absence", weeklyLabel: "Weekly", monthlyLabel: "Monthly", absenceGeneric: "Absence", numbersSuffix: "",
    hireDateDesc: "Optional info, but helps build a more accurate schedule and avoids assigning shifts to employees who haven't started or have already left.",
    hireDate: "Hire date", termDate: "Termination date",
    termBeforeHireError: "Termination date cannot be before hire date",
    savedOk: "Saved", datesSavedInfo: "Dates are saved in the employee card", save: "Save",
    noPrefs: "No preferences", noPrefsHint: "Specify when the employee prefers or avoids working. We'll do our best to accommodate — soft constraint.",
    timeType: "Type", preferWork: "Prefer to work", avoidWork: "Prefer not to work",
    repeatLabel: "Repeat", daily: "Every day", byWeekday: "By day of week", byMonthday: "By day of month",
    prefer: "Prefer", avoid: "Avoid", missingTimePref: "Fill in the time and selected days.", addPref: "Add preference",
    socialDesc: "Specify who the employee wants or doesn't want to work with. We'll try to accommodate — soft constraint.",
    noOthers: "No other employees", noOthersHint: "Add another employee to configure preferences",
    together: "Together", separate: "Separate",
  },
  kk: {
    weekDays: ["Дс","Сс","Ср","Бс","Жм","Сб","Жк"],
    noAbsences: "Болмаулар жоқ", noAbsencesHint: "Демалыс, ауырып қалу немесе үнемі болмауды қосыңыз.",
    absenceType: "Болмау түрі", sick: "Науқастану", vacation: "Демалыс", other: "Басқа",
    dateFrom: "Бастап", dateTo: "Дейін", dateError: "Аяқталу күні басталу күнінен бұрын болмауы керек",
    repeat: "Қайталану", once: "Бірреттік", weekly: "Апта сайын", monthly: "Ай сайын",
    date: "Күні", weekdays: "Апта күндері", monthdays: "Айдың күндері",
    timeFromOpt: "Бастап (міндетті емес)", timeTo: "Дейін", timeError: "Аяқталу уақыты басталу уақытынан кейін болуы керек",
    missingAbsence: "Болмау үшін міндетті өрістерді толтырыңыз.", cancel: "Бас тарту", add: "Қосу", addAbsence: "Болмау қосу",
    sickLabel: "Науқастану", vacationLabel: "Демалыс",
    singleAbsence: "Бірреттік болмау", weeklyLabel: "Апта сайын", monthlyLabel: "Ай сайын", absenceGeneric: "Болмау", numbersSuffix: "",
    hireDateDesc: "Міндетті емес ақпарат, бірақ кестені дәлірек құруға және жұмысқа шықпаған немесе жұмыстан шыққан қызметкерге ауысым тағайындамауға көмектеседі.",
    hireDate: "Жалдану күні", termDate: "Жұмыстан шығу күні",
    termBeforeHireError: "Жұмыстан шығу күні жалдану күнінен бұрын болмауы керек",
    savedOk: "Сақталды", datesSavedInfo: "Күндер қызметкер картасында сақталады", save: "Сақтау",
    noPrefs: "Артықшылықтар жоқ", noPrefsHint: "Қызметкерге қашан ыңғайлы немесе ыңғайсыз болатынын көрсетіңіз.",
    timeType: "Түрі", preferWork: "Жұмыс істеуге ыңғайлы", avoidWork: "Жұмыс істеуге ыңғайсыз",
    repeatLabel: "Қайталану", daily: "Күн сайын", byWeekday: "Апта күні бойынша", byMonthday: "Ай күні бойынша",
    prefer: "Ыңғайлы", avoid: "Ыңғайсыз", missingTimePref: "Уақытты және таңдалған күндерді толтырыңыз.", addPref: "Артықшылық қосу",
    socialDesc: "Қызметкер кіммен бірге немесе бөлек жұмыс істегісі келетінін көрсетіңіз.",
    noOthers: "Басқа қызметкерлер жоқ", noOthersHint: "Артықшылықтарды баптау үшін басқа қызметкер қосыңыз",
    together: "Бірге", separate: "Бөлек",
  },
  de: {
    weekDays: ["Mo","Di","Mi","Do","Fr","Sa","So"],
    noAbsences: "Keine Abwesenheiten", noAbsencesHint: "Fügen Sie Urlaub, Krankheit oder wiederkehrende Abwesenheiten hinzu.",
    absenceType: "Abwesenheitstyp", sick: "Krankmeldung", vacation: "Urlaub", other: "Sonstiges",
    dateFrom: "Von", dateTo: "Bis", dateError: "Enddatum darf nicht vor dem Startdatum liegen",
    repeat: "Wiederholung", once: "Einmalig", weekly: "Wöchentlich", monthly: "Monatlich",
    date: "Datum", weekdays: "Wochentage", monthdays: "Monatstage",
    timeFromOpt: "Von (optional)", timeTo: "Bis", timeError: "Endzeit muss nach Startzeit liegen",
    missingAbsence: "Füllen Sie die Pflichtfelder für diese Abwesenheit aus.", cancel: "Abbrechen", add: "Hinzufügen", addAbsence: "Abwesenheit hinzufügen",
    sickLabel: "Krankmeldung", vacationLabel: "Urlaub",
    singleAbsence: "Einmalige Abwesenheit", weeklyLabel: "Wöchentlich", monthlyLabel: "Monatlich", absenceGeneric: "Abwesenheit", numbersSuffix: ".",
    hireDateDesc: "Optionale Angabe, hilft aber, den Dienstplan genauer zu erstellen und Schichten nicht für ausgeschiedene oder noch nicht eingestiegene Mitarbeiter einzuplanen.",
    hireDate: "Einstellungsdatum", termDate: "Kündigungsdatum",
    termBeforeHireError: "Kündigungsdatum darf nicht vor dem Einstellungsdatum liegen",
    savedOk: "Gespeichert", datesSavedInfo: "Datumsangaben werden in der Mitarbeiterkarte gespeichert", save: "Speichern",
    noPrefs: "Keine Präferenzen", noPrefsHint: "Geben Sie an, wann der Mitarbeiter gern oder ungern arbeitet. Wir berücksichtigen dies als weiches Kriterium.",
    timeType: "Typ", preferWork: "Arbeit bevorzugt", avoidWork: "Arbeit vermieden",
    repeatLabel: "Wiederholung", daily: "Jeden Tag", byWeekday: "Nach Wochentag", byMonthday: "Nach Monatstag",
    prefer: "Bevorzugt", avoid: "Vermieden", missingTimePref: "Bitte Zeit und ausgewählte Tage angeben.", addPref: "Präferenz hinzufügen",
    socialDesc: "Geben Sie an, mit wem der Mitarbeiter zusammenarbeiten möchte oder nicht. Weiches Kriterium.",
    noOthers: "Keine anderen Mitarbeiter", noOthersHint: "Fügen Sie einen weiteren Mitarbeiter hinzu, um Präferenzen zu konfigurieren",
    together: "Zusammen", separate: "Getrennt",
  },
  fr: {
    weekDays: ["Lu","Ma","Me","Je","Ve","Sa","Di"],
    noAbsences: "Pas d'absences", noAbsencesHint: "Ajoutez des congés, arrêts maladie ou absences récurrentes.",
    absenceType: "Type d'absence", sick: "Arrêt maladie", vacation: "Congés", other: "Autre",
    dateFrom: "Du", dateTo: "Au", dateError: "La date de fin ne peut pas être antérieure à la date de début",
    repeat: "Répétition", once: "Unique", weekly: "Hebdomadaire", monthly: "Mensuel",
    date: "Date", weekdays: "Jours de la semaine", monthdays: "Jours du mois",
    timeFromOpt: "De (optionnel)", timeTo: "À", timeError: "L'heure de fin doit être après l'heure de début",
    missingAbsence: "Remplissez les champs obligatoires pour cette absence.", cancel: "Annuler", add: "Ajouter", addAbsence: "Ajouter une absence",
    sickLabel: "Arrêt maladie", vacationLabel: "Congés",
    singleAbsence: "Absence unique", weeklyLabel: "Hebdomadaire", monthlyLabel: "Mensuel", absenceGeneric: "Absence", numbersSuffix: "",
    hireDateDesc: "Information optionnelle, permet d'établir un planning plus précis et d'éviter d'assigner des shifts à des employés qui n'ont pas encore commencé ou qui sont partis.",
    hireDate: "Date d'embauche", termDate: "Date de départ",
    termBeforeHireError: "La date de départ ne peut pas être antérieure à la date d'embauche",
    savedOk: "Enregistré", datesSavedInfo: "Les dates sont enregistrées dans la fiche employé", save: "Enregistrer",
    noPrefs: "Pas de préférences", noPrefsHint: "Indiquez quand l'employé préfère ou évite de travailler. Condition flexible.",
    timeType: "Type", preferWork: "Préfère travailler", avoidWork: "Évite de travailler",
    repeatLabel: "Répétition", daily: "Tous les jours", byWeekday: "Par jour de la semaine", byMonthday: "Par jour du mois",
    prefer: "Préfère", avoid: "Évite", missingTimePref: "Remplissez l'heure et les jours sélectionnés.", addPref: "Ajouter une préférence",
    socialDesc: "Indiquez avec qui l'employé souhaite ou non travailler. Condition flexible.",
    noOthers: "Pas d'autres employés", noOthersHint: "Ajoutez un autre employé pour configurer les préférences",
    together: "Ensemble", separate: "Séparé",
  },
  es: {
    weekDays: ["Lu","Ma","Mi","Ju","Vi","Sá","Do"],
    noAbsences: "Sin ausencias", noAbsencesHint: "Añade vacaciones, bajas por enfermedad o ausencias recurrentes.",
    absenceType: "Tipo de ausencia", sick: "Baja por enfermedad", vacation: "Vacaciones", other: "Otro",
    dateFrom: "Desde", dateTo: "Hasta", dateError: "La fecha de fin no puede ser anterior a la de inicio",
    repeat: "Repetición", once: "Una vez", weekly: "Semanal", monthly: "Mensual",
    date: "Fecha", weekdays: "Días de la semana", monthdays: "Días del mes",
    timeFromOpt: "Desde (opcional)", timeTo: "Hasta", timeError: "La hora de fin debe ser posterior a la de inicio",
    missingAbsence: "Completa los campos obligatorios para esta ausencia.", cancel: "Cancelar", add: "Añadir", addAbsence: "Añadir ausencia",
    sickLabel: "Baja por enfermedad", vacationLabel: "Vacaciones",
    singleAbsence: "Ausencia única", weeklyLabel: "Semanal", monthlyLabel: "Mensual", absenceGeneric: "Ausencia", numbersSuffix: "",
    hireDateDesc: "Información opcional, pero ayuda a crear un horario más preciso y a evitar asignar turnos a empleados que aún no han comenzado o que ya se han ido.",
    hireDate: "Fecha de contratación", termDate: "Fecha de baja",
    termBeforeHireError: "La fecha de baja no puede ser anterior a la de contratación",
    savedOk: "Guardado", datesSavedInfo: "Las fechas se guardan en la ficha del empleado", save: "Guardar",
    noPrefs: "Sin preferencias", noPrefsHint: "Indica cuándo el empleado prefiere o evita trabajar. Condición flexible.",
    timeType: "Tipo", preferWork: "Prefiere trabajar", avoidWork: "Evita trabajar",
    repeatLabel: "Repetición", daily: "Cada día", byWeekday: "Por día de la semana", byMonthday: "Por día del mes",
    prefer: "Prefiere", avoid: "Evita", missingTimePref: "Completa el horario y los días seleccionados.", addPref: "Añadir preferencia",
    socialDesc: "Indica con quién el empleado quiere o no quiere trabajar. Condición flexible.",
    noOthers: "No hay otros empleados", noOthersHint: "Añade otro empleado para configurar preferencias",
    together: "Juntos", separate: "Separados",
  },
  it: {
    weekDays: ["Lu","Ma","Me","Gi","Ve","Sa","Do"],
    noAbsences: "Nessuna assenza", noAbsencesHint: "Aggiungi ferie, malattia o assenze ricorrenti.",
    absenceType: "Tipo di assenza", sick: "Malattia", vacation: "Ferie", other: "Altro",
    dateFrom: "Dal", dateTo: "Al", dateError: "La data di fine non può essere antecedente a quella di inizio",
    repeat: "Ripetizione", once: "Una volta", weekly: "Settimanale", monthly: "Mensile",
    date: "Data", weekdays: "Giorni della settimana", monthdays: "Giorni del mese",
    timeFromOpt: "Dalle (opzionale)", timeTo: "Alle", timeError: "L'ora di fine deve essere successiva all'ora di inizio",
    missingAbsence: "Compila i campi obbligatori per questa assenza.", cancel: "Annulla", add: "Aggiungi", addAbsence: "Aggiungi assenza",
    sickLabel: "Malattia", vacationLabel: "Ferie",
    singleAbsence: "Assenza singola", weeklyLabel: "Settimanale", monthlyLabel: "Mensile", absenceGeneric: "Assenza", numbersSuffix: "",
    hireDateDesc: "Informazione opzionale, ma aiuta a creare un calendario più preciso e ad evitare turni per dipendenti non ancora iniziati o già usciti.",
    hireDate: "Data di assunzione", termDate: "Data di fine rapporto",
    termBeforeHireError: "La data di fine non può essere antecedente alla data di assunzione",
    savedOk: "Salvato", datesSavedInfo: "Le date vengono salvate nella scheda del dipendente", save: "Salva",
    noPrefs: "Nessuna preferenza", noPrefsHint: "Indica quando il dipendente preferisce o evita di lavorare. Vincolo flessibile.",
    timeType: "Tipo", preferWork: "Preferisce lavorare", avoidWork: "Evita di lavorare",
    repeatLabel: "Ripetizione", daily: "Ogni giorno", byWeekday: "Per giorno della settimana", byMonthday: "Per giorno del mese",
    prefer: "Preferisce", avoid: "Evita", missingTimePref: "Compila l'orario e i giorni selezionati.", addPref: "Aggiungi preferenza",
    socialDesc: "Indica con chi il dipendente vuole o non vuole lavorare. Vincolo flessibile.",
    noOthers: "Nessun altro dipendente", noOthersHint: "Aggiungi un altro dipendente per configurare le preferenze",
    together: "Insieme", separate: "Separato",
  },
  pt: {
    weekDays: ["Seg","Ter","Qua","Qui","Sex","Sáb","Dom"],
    noAbsences: "Sem ausências", noAbsencesHint: "Adicione férias, atestados ou ausências recorrentes.",
    absenceType: "Tipo de ausência", sick: "Atestado médico", vacation: "Férias", other: "Outro",
    dateFrom: "De", dateTo: "Até", dateError: "A data de término não pode ser anterior à de início",
    repeat: "Repetição", once: "Uma vez", weekly: "Semanal", monthly: "Mensal",
    date: "Data", weekdays: "Dias da semana", monthdays: "Dias do mês",
    timeFromOpt: "De (opcional)", timeTo: "Até", timeError: "O horário de término deve ser posterior ao de início",
    missingAbsence: "Preencha os campos obrigatórios para esta ausência.", cancel: "Cancelar", add: "Adicionar", addAbsence: "Adicionar ausência",
    sickLabel: "Atestado médico", vacationLabel: "Férias",
    singleAbsence: "Ausência única", weeklyLabel: "Semanal", monthlyLabel: "Mensal", absenceGeneric: "Ausência", numbersSuffix: "",
    hireDateDesc: "Informação opcional, mas ajuda a criar uma escala mais precisa e a evitar atribuir turnos a funcionários que ainda não começaram ou já saíram.",
    hireDate: "Data de contratação", termDate: "Data de demissão",
    termBeforeHireError: "A data de demissão não pode ser anterior à de contratação",
    savedOk: "Salvo", datesSavedInfo: "As datas são salvas no perfil do funcionário", save: "Salvar",
    noPrefs: "Sem preferências", noPrefsHint: "Indique quando o funcionário prefere ou evita trabalhar. Condição flexível.",
    timeType: "Tipo", preferWork: "Prefere trabalhar", avoidWork: "Evita trabalhar",
    repeatLabel: "Repetição", daily: "Todo dia", byWeekday: "Por dia da semana", byMonthday: "Por dia do mês",
    prefer: "Prefere", avoid: "Evita", missingTimePref: "Preencha o horário e os dias selecionados.", addPref: "Adicionar preferência",
    socialDesc: "Indique com quem o funcionário quer ou não quer trabalhar. Condição flexível.",
    noOthers: "Nenhum outro funcionário", noOthersHint: "Adicione outro funcionário para configurar preferências",
    together: "Juntos", separate: "Separados",
  },
  tr: {
    weekDays: ["Pzt","Sal","Çar","Per","Cum","Cmt","Paz"],
    noAbsences: "Devamsızlık yok", noAbsencesHint: "İzin, hastalık veya düzenli devamsızlık ekleyin.",
    absenceType: "Devamsızlık türü", sick: "Hastalık izni", vacation: "Tatil", other: "Diğer",
    dateFrom: "Başlangıç", dateTo: "Bitiş", dateError: "Bitiş tarihi başlangıç tarihinden önce olamaz",
    repeat: "Tekrarlama", once: "Bir kez", weekly: "Haftalık", monthly: "Aylık",
    date: "Tarih", weekdays: "Haftanın günleri", monthdays: "Ayın günleri",
    timeFromOpt: "Başlangıç (isteğe bağlı)", timeTo: "Bitiş", timeError: "Bitiş saati başlangıç saatinden sonra olmalı",
    missingAbsence: "Bu devamsızlık için zorunlu alanları doldurun.", cancel: "İptal", add: "Ekle", addAbsence: "Devamsızlık ekle",
    sickLabel: "Hastalık izni", vacationLabel: "Tatil",
    singleAbsence: "Tek seferlik devamsızlık", weeklyLabel: "Haftalık", monthlyLabel: "Aylık", absenceGeneric: "Devamsızlık", numbersSuffix: ".",
    hireDateDesc: "İsteğe bağlı bilgi, ancak daha doğru bir plan oluşturmaya ve henüz başlamamış veya ayrılmış çalışanlara vardiya atamaktan kaçınmaya yardımcı olur.",
    hireDate: "İşe başlama tarihi", termDate: "İşten çıkış tarihi",
    termBeforeHireError: "İşten çıkış tarihi işe başlama tarihinden önce olamaz",
    savedOk: "Kaydedildi", datesSavedInfo: "Tarihler çalışan kartında kaydedilir", save: "Kaydet",
    noPrefs: "Tercih yok", noPrefsHint: "Çalışanın ne zaman çalışmayı tercih ettiğini veya etmediğini belirtin. Esnek kural.",
    timeType: "Tür", preferWork: "Çalışmayı tercih eder", avoidWork: "Çalışmaktan kaçınır",
    repeatLabel: "Tekrarlama", daily: "Her gün", byWeekday: "Haftanın gününe göre", byMonthday: "Ayın gününe göre",
    prefer: "Tercih eder", avoid: "Kaçınır", missingTimePref: "Saati ve seçili günleri doldurun.", addPref: "Tercih ekle",
    socialDesc: "Çalışanın kimlerle çalışmak istediğini veya istemediğini belirtin. Esnek kural.",
    noOthers: "Başka çalışan yok", noOthersHint: "Tercihleri yapılandırmak için başka bir çalışan ekleyin",
    together: "Birlikte", separate: "Ayrı",
  },
  zh: {
    weekDays: ["周一","周二","周三","周四","周五","周六","周日"],
    noAbsences: "无缺勤记录", noAbsencesHint: "添加假期、病假或定期缺勤记录。",
    absenceType: "缺勤类型", sick: "病假", vacation: "年假", other: "其他",
    dateFrom: "开始", dateTo: "结束", dateError: "结束日期不能早于开始日期",
    repeat: "重复", once: "一次", weekly: "每周", monthly: "每月",
    date: "日期", weekdays: "星期", monthdays: "月份日期",
    timeFromOpt: "从（可选）", timeTo: "至", timeError: "结束时间必须晚于开始时间",
    missingAbsence: "请填写此缺勤的必填字段。", cancel: "取消", add: "添加", addAbsence: "添加缺勤",
    sickLabel: "病假", vacationLabel: "年假",
    singleAbsence: "单次缺勤", weeklyLabel: "每周", monthlyLabel: "每月", absenceGeneric: "缺勤", numbersSuffix: "日",
    hireDateDesc: "可选信息，但有助于更准确地制定排班，避免为尚未入职或已离职的员工安排班次。",
    hireDate: "入职日期", termDate: "离职日期",
    termBeforeHireError: "离职日期不能早于入职日期",
    savedOk: "已保存", datesSavedInfo: "日期保存在员工卡中", save: "保存",
    noPrefs: "无偏好", noPrefsHint: "指定员工希望或不希望工作的时间。软约束。",
    timeType: "类型", preferWork: "偏好工作", avoidWork: "避免工作",
    repeatLabel: "重复", daily: "每天", byWeekday: "按星期", byMonthday: "按月份日期",
    prefer: "偏好", avoid: "避免", missingTimePref: "请填写时间和所选日期。", addPref: "添加偏好",
    socialDesc: "指定员工希望或不希望与谁一起工作。软约束。",
    noOthers: "没有其他员工", noOthersHint: "添加另一位员工以配置偏好",
    together: "一起", separate: "分开",
  },
  ja: {
    weekDays: ["月","火","水","木","金","土","日"],
    noAbsences: "欠勤なし", noAbsencesHint: "休暇、病欠、または定期的な欠勤を追加してください。",
    absenceType: "欠勤タイプ", sick: "病欠", vacation: "休暇", other: "その他",
    dateFrom: "開始", dateTo: "終了", dateError: "終了日は開始日より後にしてください",
    repeat: "繰り返し", once: "1回のみ", weekly: "毎週", monthly: "毎月",
    date: "日付", weekdays: "曜日", monthdays: "月の日付",
    timeFromOpt: "開始（任意）", timeTo: "終了", timeError: "終了時刻は開始時刻より後にしてください",
    missingAbsence: "この欠勤の必須項目を入力してください。", cancel: "キャンセル", add: "追加", addAbsence: "欠勤を追加",
    sickLabel: "病欠", vacationLabel: "休暇",
    singleAbsence: "単回欠勤", weeklyLabel: "毎週", monthlyLabel: "毎月", absenceGeneric: "欠勤", numbersSuffix: "日",
    hireDateDesc: "任意情報ですが、スケジュールをより正確に作成し、まだ入社していない、またはすでに退職した従業員にシフトを割り当てないために役立ちます。",
    hireDate: "採用日", termDate: "退職日",
    termBeforeHireError: "退職日は採用日より後にしてください",
    savedOk: "保存しました", datesSavedInfo: "日付は従業員カードに保存されます", save: "保存",
    noPrefs: "希望なし", noPrefsHint: "従業員が働きやすい/避けたい時間を指定してください。ソフト制約として考慮されます。",
    timeType: "タイプ", preferWork: "働きやすい", avoidWork: "避けたい",
    repeatLabel: "繰り返し", daily: "毎日", byWeekday: "曜日別", byMonthday: "日付別",
    prefer: "好む", avoid: "避ける", missingTimePref: "時間と選択した日を入力してください。", addPref: "希望を追加",
    socialDesc: "従業員が一緒に、または別々に働きたい相手を指定してください。ソフト制約です。",
    noOthers: "他の従業員なし", noOthersHint: "希望を設定するには別の従業員を追加してください",
    together: "一緒", separate: "別々",
  },
};

// ─── Shared UI primitives ────────────────────────────────────────────────────
function ProgressBar({ step, total, stepNames, onStepClick }: {
  step: number; total: number; stepNames: [string, string, string, string];
  onStepClick: (s: number) => void;
}) {
  return (
    <div style={{ display: "flex", gap: "8px" }}>
      {Array.from({ length: total }).map((_, i) => {
        const completed = i + 1 < step;
        const clickable = completed;
        return (
          <div key={i} onClick={() => clickable && onStepClick(i + 1)}
            style={{ flex: 1, display: "flex", flexDirection: "column", gap: "5px", cursor: clickable ? "pointer" : "default" }}>
            <div style={{ height: "3px", borderRadius: "99px", background: i < step ? "linear-gradient(90deg,#a855f7,#ec4899)" : "rgba(168,85,247,0.15)", transition: "background 0.3s", opacity: clickable ? 1 : 1 }} />
            <span style={{ fontSize: "0.63rem", fontWeight: i + 1 === step ? 600 : 400, color: i + 1 === step ? "#a855f7" : completed ? "rgba(168,85,247,0.6)" : "rgba(168,85,247,0.35)", letterSpacing: "0.01em", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", transition: "color 0.3s", textDecoration: clickable ? "underline" : "none", textDecorationColor: "rgba(168,85,247,0.3)" }}>
              {stepNames[i]}
            </span>
          </div>
        );
      })}
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
function RolesPanel({ emp, globalRoles, onToggleRole, onAddRole, dark, label, pCopy }: {
  emp: EmpData; globalRoles: string[];
  onToggleRole: (empId: number, role: string) => void;
  onAddRole?: (role: string) => void; dark: boolean;
  label?: string; pCopy?: typeof rolePanelCopy.en;
}) {
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const tc = colors(dark);
  const pc = pCopy ?? rolePanelCopy.en;
  useEffect(() => { setTimeout(() => searchRef.current?.focus(), 150); }, []);

  const q = query.trim().toLowerCase();
  const filtered = globalRoles.filter(r => r.toLowerCase().includes(q));
  const exactMatch = globalRoles.some(r => r.toLowerCase() === q);
  const showAdd = !!onAddRole && q.length > 0 && !exactMatch;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", minHeight: 0 }}>
      <PanelHeader emp={emp} label={label ?? pc.emptyTitle} dark={dark} />

      <div style={{ position: "relative", marginBottom: "10px" }}>
        <Search size={14} strokeWidth={1.8} style={{ position: "absolute", left: "13px", top: "50%", transform: "translateY(-50%)", color: focused ? "#a855f7" : tc.iconMuted, pointerEvents: "none", transition: "color 0.18s" }} />
        <input ref={searchRef} value={query} onChange={e => setQuery(e.target.value)}
          onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
          placeholder={pc.search}
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
            <p style={{ color: tc.sub, fontSize: "0.85rem", margin: "0 0 6px", fontWeight: 500 }}>{pc.emptyTitle}</p>
            <p style={{ color: tc.faint, fontSize: "0.78rem", margin: "0 auto", maxWidth: "260px", lineHeight: 1.55 }}>{pc.emptyHint}</p>
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
            <span style={{ fontSize: "0.9rem", color: dark ? "#c4b5fd" : "#7c3aed", fontWeight: 500 }}>{pc.addRole} «{query.trim()}»</span>
          </motion.button>
        )}
      </div>
    </div>
  );
}

// ─── Absences panel ───────────────────────────────────────────────────────────
function absenceLabel(a: Absence, pc: PanelCopy) {
  const fmt = (d?: string) => d ? new Date(d).toLocaleDateString("ru", { day: "numeric", month: "short" }) : "—";
  const days = pc.weekDays;
  if (a.type === "sick")     return { main: pc.sickLabel,     sub: `${fmt(a.dateFrom)} — ${fmt(a.dateTo)}` };
  if (a.type === "vacation") return { main: pc.vacationLabel, sub: `${fmt(a.dateFrom)} — ${fmt(a.dateTo)}` };
  if (a.repeat === "once")    return { main: pc.singleAbsence, sub: `${fmt(a.onceDate)}${a.timeFrom ? `, ${a.timeFrom}–${a.timeTo}` : ""}` };
  if (a.repeat === "weekly")  return { main: pc.weeklyLabel,   sub: `${(a.weekDays || []).map(i => days[i]).join(", ")}${a.timeFrom ? ` ${a.timeFrom}–${a.timeTo}` : ""}` };
  if (a.repeat === "monthly") return { main: pc.monthlyLabel,  sub: `${(a.monthDays || []).join(", ")}${pc.numbersSuffix}${a.timeFrom ? ` ${a.timeFrom}–${a.timeTo}` : ""}` };
  return { main: pc.absenceGeneric, sub: "" };
}

function AbsencesPanel({ emp, onUpdate, dark, label, pc }: {
  emp: EmpData; onUpdate: (a: Absence[]) => void; dark: boolean; label?: string; pc?: PanelCopy;
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
  const pcp = pc ?? panelCopyRec.en;
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
  const missingMessage = submitted && !canAdd && !dateInvalid ? pcp.missingAbsence : "";

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", minHeight: 0 }}>
      <PanelHeader emp={emp} label={label ?? pcp.addAbsence} dark={dark} />

      <div style={{ flex: 1, overflowY: "auto", minHeight: 0 }}>
        {emp.absences.length === 0 && !showForm && (
          <div style={{ textAlign: "center", padding: "16px 0 20px" }}>
            <CalendarOff size={28} strokeWidth={1.2} style={{ color: tc.faint, display: "block", margin: "0 auto 10px" }} />
            <p style={{ color: tc.sub, fontSize: "0.85rem", margin: "0 0 6px", fontWeight: 500 }}>{pcp.noAbsences}</p>
            <p style={{ color: tc.faint, fontSize: "0.78rem", margin: "0 auto 16px", maxWidth: "260px", lineHeight: 1.55 }}>
              {pcp.noAbsencesHint}
            </p>
          </div>
        )}

        <AnimatePresence initial={false}>
          {emp.absences.map(a => {
            const { main, sub } = absenceLabel(a, pcp);
            return <ItemRow key={a.id} label={main} sub={sub} dark={dark} onDelete={() => onUpdate(emp.absences.filter(x => x.id !== a.id))} />;
          })}
        </AnimatePresence>

        <AnimatePresence>
          {showForm && (
            <FormBox dark={dark}>
              <div>
                <Label text={pcp.absenceType} dark={dark} />
                <Pills dark={dark} value={type} onChange={v => setType(v as any)}
                  options={[{ value: "sick", label: pcp.sick }, { value: "vacation", label: pcp.vacation }, { value: "other", label: pcp.other }]} />
              </div>

              {(type === "sick" || type === "vacation") && (
                <div style={{ display: "flex", gap: "8px" }}>
                  <div style={{ flex: 1 }}>
                    <Label text={pcp.dateFrom} dark={dark} />
                    <StyledInput type="date" value={dateFrom} onChange={setDateFrom} dark={dark} style={{ width: "100%" }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <Label text={pcp.dateTo} dark={dark} />
                    <StyledInput type="date" value={dateTo} onChange={setDateTo} dark={dark} style={{ width: "100%" }} />
                  </div>
                </div>
              )}
              {dateInvalid && <p style={{ color: "#f87171", fontSize: "0.72rem", margin: "-4px 0 0", lineHeight: 1.4 }}>{pcp.dateError}</p>}

              {type === "other" && (
                <>
                  <div>
                    <Label text={pcp.repeat} dark={dark} />
                    <Pills dark={dark} value={repeat} onChange={v => setRepeat(v as any)}
                      options={[{ value: "once", label: pcp.once }, { value: "weekly", label: pcp.weekly }, { value: "monthly", label: pcp.monthly }]} />
                  </div>
                  {repeat === "once" && (
                    <div>
                      <Label text={pcp.date} dark={dark} />
                      <StyledInput type="date" value={onceDate} onChange={setOnceDate} dark={dark} style={{ width: "100%" }} />
                    </div>
                  )}
                  {repeat === "weekly" && (
                    <div>
                      <Label text={pcp.weekdays} dark={dark} />
                      <WeekDayPicker value={weekDays} onChange={setWeekDays} dark={dark} />
                    </div>
                  )}
                  {repeat === "monthly" && (
                    <div>
                      <Label text={pcp.monthdays} dark={dark} />
                      <MonthDayTagInput value={monthDays} onChange={setMonthDays} dark={dark} />
                    </div>
                  )}
                  <div style={{ display: "flex", gap: "8px" }}>
                    <div style={{ flex: 1 }}>
                      <Label text={pcp.timeFromOpt} dark={dark} />
                      <StyledInput type="time" value={timeFrom} onChange={setTimeFrom} dark={dark} style={{ width: "100%" }} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <Label text={pcp.timeTo} dark={dark} />
                      <StyledInput type="time" value={timeTo} onChange={setTimeTo} dark={dark} style={{ width: "100%" }} />
                  </div>
                </div>
                {timeInvalid && <p style={{ color: "#f87171", fontSize: "0.72rem", margin: "-4px 0 0", lineHeight: 1.4 }}>{pcp.timeError}</p>}
                </>
              )}
              {missingMessage && (
                <p style={{ color: "#f87171", fontSize: "0.72rem", margin: "-4px 0 0", lineHeight: 1.4 }}>
                  {missingMessage}
                </p>
              )}

              <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                <button onClick={reset} style={{ padding: "9px 16px", borderRadius: "10px", border: `1px solid ${tc.inputBorder}`, background: "none", color: tc.sub, fontSize: "0.85rem", cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}>{pcp.cancel}</button>
                <SaveBtn label={pcp.add} onClick={handleAdd} />
              </div>
            </FormBox>
          )}
        </AnimatePresence>

        {!showForm && <AddBtn label={pcp.addAbsence} onClick={() => setShowForm(true)} dark={dark} />}
      </div>
    </div>
  );
}

// ─── Hire / fire dates panel ──────────────────────────────────────────────────
function HireDatesPanel({ emp, onUpdate, dark, label, pc }: {
  emp: EmpData; onUpdate: (hired: string, fired: string) => void; dark: boolean; label?: string; pc?: PanelCopy;
}) {
  const tc = colors(dark);
  const pcp = pc ?? panelCopyRec.en;
  const invalid = !!emp.hired && !!emp.fired && emp.fired < emp.hired;
  const [saved, setSaved] = useState(false);
  const save = () => {
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1200);
  };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <PanelHeader emp={emp} label={label ?? pcp.hireDate} dark={dark} />
      <Desc text={pcp.hireDateDesc} dark={dark} />
      <div>
        <Label text={pcp.hireDate} dark={dark} />
        <StyledInput type="date" value={emp.hired} onChange={v => onUpdate(v, emp.fired)} dark={dark} style={{ width: "100%" }} />
      </div>
      <div>
        <Label text={pcp.termDate} dark={dark} />
        <StyledInput type="date" value={emp.fired} onChange={v => onUpdate(emp.hired, v)} dark={dark} style={{ width: "100%" }} />
      </div>
      {invalid && <p style={{ color: "#f87171", fontSize: "0.72rem", margin: "-6px 0 0", lineHeight: 1.4 }}>{pcp.termBeforeHireError}</p>}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px" }}>
        <span style={{ color: saved ? (dark ? "#6ee7b7" : "#047857") : tc.faint, fontSize: "0.78rem" }}>
          {saved ? pcp.savedOk : pcp.datesSavedInfo}
        </span>
        <SaveBtn label={pcp.save} onClick={save} />
      </div>
    </div>
  );
}

// ─── Time preferences panel ───────────────────────────────────────────────────
function timePrefsLabel(p: TimePreference, pc: PanelCopy) {
  const main = p.prefer === "prefer" ? pc.prefer : pc.avoid;
  const time = `${p.timeFrom}–${p.timeTo}`;
  if (p.repeat === "daily")   return { main, sub: `${pc.daily}, ${time}` };
  if (p.repeat === "weekly")  return { main, sub: `${(p.weekDays || []).map(i => pc.weekDays[i]).join(", ")}, ${time}` };
  if (p.repeat === "monthly") return { main, sub: `${(p.monthDays || []).join(", ")}${pc.numbersSuffix}, ${time}` };
  return { main, sub: time };
}

function TimePrefsPanel({ emp, onUpdate, dark, label, pc }: {
  emp: EmpData; onUpdate: (p: TimePreference[]) => void; dark: boolean; label?: string; pc?: PanelCopy;
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
  const pcp = pc ?? panelCopyRec.en;
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
  const missingMessage = submitted && !canAdd && !timeInvalid ? pcp.missingTimePref : "";

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", minHeight: 0 }}>
      <PanelHeader emp={emp} label={label ?? pcp.addPref} dark={dark} />

      <div style={{ flex: 1, overflowY: "auto", minHeight: 0 }}>
        {emp.timePrefs.length === 0 && !showForm && (
          <div style={{ textAlign: "center", padding: "16px 0 20px" }}>
            <Clock3 size={28} strokeWidth={1.2} style={{ color: tc.faint, display: "block", margin: "0 auto 10px" }} />
            <p style={{ color: tc.sub, fontSize: "0.85rem", margin: "0 0 6px", fontWeight: 500 }}>{pcp.noPrefs}</p>
            <p style={{ color: tc.faint, fontSize: "0.78rem", margin: "0 auto 16px", maxWidth: "260px", lineHeight: 1.55 }}>
              {pcp.noPrefsHint}
            </p>
          </div>
        )}

        <AnimatePresence initial={false}>
          {emp.timePrefs.map(p => {
            const { main, sub } = timePrefsLabel(p, pcp);
            return <ItemRow key={p.id} label={main} sub={sub} dark={dark} onDelete={() => onUpdate(emp.timePrefs.filter(x => x.id !== p.id))} />;
          })}
        </AnimatePresence>

        <AnimatePresence>
          {showForm && (
            <FormBox dark={dark}>
              <div>
                <Label text={pcp.timeType} dark={dark} />
                <Pills dark={dark} value={prefer} onChange={v => setPrefer(v as any)}
                  options={[{ value: "prefer", label: pcp.preferWork }, { value: "avoid", label: pcp.avoidWork }]} />
              </div>
              <div>
                <Label text={pcp.repeatLabel} dark={dark} />
                <Pills dark={dark} value={repeat} onChange={v => setRepeat(v as any)}
                  options={[{ value: "daily", label: pcp.daily }, { value: "weekly", label: pcp.byWeekday }, { value: "monthly", label: pcp.byMonthday }]} />
              </div>
              {repeat === "weekly" && (
                <div>
                  <Label text={pcp.weekdays} dark={dark} />
                  <WeekDayPicker value={weekDays} onChange={setWeekDays} dark={dark} />
                </div>
              )}
              {repeat === "monthly" && (
                <div>
                  <Label text={pcp.monthdays} dark={dark} />
                  <MonthDayTagInput value={monthDays} onChange={setMonthDays} dark={dark} />
                </div>
              )}
              <div style={{ display: "flex", gap: "8px" }}>
                <div style={{ flex: 1 }}>
                  <Label text={pcp.dateFrom} dark={dark} />
                  <StyledInput type="time" value={timeFrom} onChange={setTimeFrom} dark={dark} style={{ width: "100%" }} />
                </div>
                <div style={{ flex: 1 }}>
                  <Label text={pcp.dateTo} dark={dark} />
                  <StyledInput type="time" value={timeTo} onChange={setTimeTo} dark={dark} style={{ width: "100%" }} />
                </div>
              </div>
              {timeInvalid && <p style={{ color: "#f87171", fontSize: "0.72rem", margin: "-4px 0 0", lineHeight: 1.4 }}>{pcp.timeError}</p>}
              {missingMessage && <p style={{ color: "#f87171", fontSize: "0.72rem", margin: "-4px 0 0", lineHeight: 1.4 }}>{missingMessage}</p>}
              <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                <button onClick={reset} style={{ padding: "9px 16px", borderRadius: "10px", border: `1px solid ${colors(dark).inputBorder}`, background: "none", color: colors(dark).sub, fontSize: "0.85rem", cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}>{pcp.cancel}</button>
                <SaveBtn label={pcp.add} onClick={handleAdd} />
              </div>
            </FormBox>
          )}
        </AnimatePresence>

        {!showForm && <AddBtn label={pcp.addPref} onClick={() => setShowForm(true)} dark={dark} />}
      </div>
    </div>
  );
}

// ─── Social preferences panel ─────────────────────────────────────────────────
function SocialPrefsPanel({ emp, allEmployees, onUpdate, dark, label, pc }: {
  emp: EmpData; allEmployees: EmpData[];
  onUpdate: (p: SocialPref[]) => void; dark: boolean; label?: string; pc?: PanelCopy;
}) {
  const tc = colors(dark);
  const pcp = pc ?? panelCopyRec.en;
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
      <PanelHeader emp={emp} label={label ?? pcp.together} dark={dark} />
      <Desc text={pcp.socialDesc} dark={dark} />

      <div style={{ flex: 1, overflowY: "auto", minHeight: 0 }}>
        {others.length === 0 ? (
          <div style={{ textAlign: "center", padding: "20px 0" }}>
            <Users2 size={28} strokeWidth={1.2} style={{ color: tc.faint, display: "block", margin: "0 auto 10px" }} />
            <p style={{ color: tc.sub, fontSize: "0.85rem", margin: "0 0 4px", fontWeight: 500 }}>{pcp.noOthers}</p>
            <p style={{ color: tc.faint, fontSize: "0.78rem", margin: 0, lineHeight: 1.55 }}>{pcp.noOthersHint}</p>
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
                  <ThumbsUp size={11} strokeWidth={2} /> {pcp.together}
                </button>
                <button onClick={() => setType(other, isWithout ? null : "without")} style={{ ...btnBase, background: isWithout ? "linear-gradient(135deg,#ef4444,#b91c1c)" : tc.chipBg, color: isWithout ? "#fff" : tc.sub, outline: isWithout ? "none" : `1px solid ${tc.rowBorder}`, boxShadow: isWithout ? "0 2px 8px rgba(239,68,68,0.3)" : "none" }}>
                  <ThumbsDown size={11} strokeWidth={2} /> {pcp.separate}
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

// ─── Step 1: Team ────────────────────────────────────────────────────────────
function EmpTeamRow({ emp, isSelected, onSelect, dark }: {
  emp: EmpData; isSelected: boolean;
  onSelect: () => void;
  dark: boolean;
}) {
  const tc = colors(dark);
  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -12 }} transition={{ duration: 0.18 }}
      onClick={onSelect}
      style={{
        display: "flex", alignItems: "center", gap: "10px",
        padding: "8px 10px", borderRadius: "10px", marginBottom: "2px",
        cursor: "pointer",
        background: isSelected ? (dark ? "rgba(168,85,247,0.12)" : "rgba(168,85,247,0.08)") : "transparent",
        border: `1px solid ${isSelected ? (dark ? "rgba(168,85,247,0.22)" : "rgba(168,85,247,0.16)") : "transparent"}`,
        transition: "background 0.15s, border-color 0.15s",
      }}
    >
      <Avatar name={emp.name} size={32} />
      <span style={{ flex: 1, color: tc.headline, fontSize: "0.9rem", fontWeight: 500, letterSpacing: "-0.01em" }}>{emp.name}</span>
    </motion.div>
  );
}

function StepTeam({ employees, globalRoles, onAddEmployee, onDeleteEmployee, onAddRole, onRenameRole, onDeleteRole, onUpdateEmp, dark, copy, stepCopy, panelsCopy, panelCopy2 }: {
  employees: EmpData[]; globalRoles: string[];
  onAddEmployee: (name: string) => void; onDeleteEmployee: (id: number) => void;
  onAddRole: (role: string) => void; onRenameRole: (from: string, to: string) => void;
  onDeleteRole: (role: string) => void;
  onUpdateEmp: (id: number, patch: Partial<EmpData>) => void;
  dark: boolean; copy: typeof wizardCopy.ru; stepCopy: typeof wizardStepCopy.ru;
  panelsCopy: typeof rolePanelCopy.en; panelCopy2: PanelCopy;
}) {
  const [empInput, setEmpInput] = useState("");
  const [empFocused, setEmpFocused] = useState(false);
  const [selectedEmpId, setSelectedEmpId] = useState<number | null>(null);
  const [popupFeature, setPopupFeature] = useState<string | null>(null);
  const [draftEmp, setDraftEmp] = useState<EmpData | null>(null);
  const [pendingSelect, setPendingSelect] = useState(false);
  const [isMobile, setIsMobile] = useState(() => window.matchMedia("(max-width: 639px)").matches);
  const empRef = useRef<HTMLInputElement>(null);
  const prevLenRef = useRef(0);
  const tc = colors(dark);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 639px)");
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  useEffect(() => {
    if (pendingSelect && employees.length > prevLenRef.current && employees.length > 0) {
      const newest = employees[employees.length - 1];
      setSelectedEmpId(newest.id);
      setDraftEmp(cloneEmployee(newest));
      setPendingSelect(false);
    }
    prevLenRef.current = employees.length;
  }, [employees, pendingSelect]);

  const handleAddEmp = () => {
    const t = empInput.trim();
    if (!t) return;
    if (draftEmp) onUpdateEmp(draftEmp.id, draftEmp);
    onAddEmployee(t);
    setEmpInput("");
    setPendingSelect(true);
    empRef.current?.focus();
  };

  const selectEmp = (empId: number) => {
    if (draftEmp) onUpdateEmp(draftEmp.id, draftEmp);
    const emp = employees.find(e => e.id === empId);
    if (emp) setDraftEmp(cloneEmployee(emp));
    setSelectedEmpId(empId);
  };
  const closePopup = () => { if (draftEmp) onUpdateEmp(draftEmp.id, draftEmp); setPopupFeature(null); };
  const saveAndClose = () => {
    if (draftEmp) onUpdateEmp(draftEmp.id, draftEmp);
    setDraftEmp(null); setSelectedEmpId(null); setPopupFeature(null);
  };
  const updateDraft = (patch: Partial<EmpData>) => setDraftEmp(prev => prev ? { ...prev, ...patch } : prev);
  const toggleDraftRole = (empId: number, role: string) => {
    setDraftEmp(prev => {
      if (!prev || prev.id !== empId) return prev;
      return { ...prev, roles: prev.roles.includes(role) ? prev.roles.filter(r => r !== role) : [...prev.roles, role] };
    });
  };

  const actionLabels: Record<string, string> = {
    roles: copy.actions.roles, absences: copy.actions.absences,
    dates: copy.actions.dates, timePrefs: copy.actions.timePrefs, socialPrefs: copy.actions.socialPrefs,
  };

  const activeEmp = draftEmp ?? (selectedEmpId !== null ? employees.find(e => e.id === selectedEmpId) : null);

  const renderEmpPanel = () => {
    if (!activeEmp) return null;
    const settings = [
      { key: "roles",       label: actionLabels.roles,       desc: activeEmp.roles.length > 0 ? activeEmp.roles.join(", ") : "Роль не назначена",        btnLabel: activeEmp.roles.length > 0 ? "Изменить" : "Назначить"  },
      { key: "absences",    label: actionLabels.absences,    desc: activeEmp.absences.length > 0 ? `${activeEmp.absences.length} записей` : "Нет записей", btnLabel: activeEmp.absences.length > 0 ? "Изменить" : "Добавить"  },
      { key: "dates",       label: actionLabels.dates,       desc: activeEmp.hired ? `С ${activeEmp.hired}` : "Не указано",                               btnLabel: activeEmp.hired ? "Изменить" : "Указать"                },
      { key: "timePrefs",   label: actionLabels.timePrefs,   desc: activeEmp.timePrefs.length > 0 ? "Настроено" : "Не настроено",                         btnLabel: activeEmp.timePrefs.length > 0 ? "Изменить" : "Настроить" },
      { key: "socialPrefs", label: actionLabels.socialPrefs, desc: activeEmp.socialPrefs.length > 0 ? "Настроено" : "Не настроено",                       btnLabel: activeEmp.socialPrefs.length > 0 ? "Изменить" : "Настроить" },
    ];
    return (
      <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
        <p style={{ margin: "0 0 20px", fontSize: "1.05rem", fontWeight: 650, color: tc.headline, letterSpacing: "-0.025em" }}>{activeEmp.name}</p>
        <div style={{ flex: 1, overflowY: "auto", minHeight: 0 }}>
          {settings.map(({ key, label, desc, btnLabel }) => (
            <div key={key} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "9px 0" }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: "0 0 2px", fontSize: "0.9rem", fontWeight: 600, color: tc.headline, letterSpacing: "-0.01em" }}>{label}</p>
                <p style={{ margin: 0, fontSize: "0.78rem", color: tc.sub, lineHeight: 1.35, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{desc}</p>
              </div>
              <button onClick={() => setPopupFeature(key)} style={{ flexShrink: 0, padding: "6px 14px", borderRadius: "8px", border: "none", background: "linear-gradient(135deg,#a855f7,#ec4899)", color: "#fff", fontSize: "0.76rem", fontWeight: 500, cursor: "pointer", fontFamily: "'DM Sans',sans-serif", whiteSpace: "nowrap" }}>
                {btnLabel}
              </button>
            </div>
          ))}
        </div>
        <div style={{ paddingTop: "14px", flexShrink: 0 }}>
          <button
            onClick={() => { if (draftEmp) onUpdateEmp(draftEmp.id, draftEmp); onDeleteEmployee(activeEmp.id); setSelectedEmpId(null); setDraftEmp(null); setPopupFeature(null); }}
            style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "none", border: `1px solid ${dark ? "rgba(248,113,113,0.22)" : "rgba(248,113,113,0.18)"}`, borderRadius: "8px", padding: "7px 14px", cursor: "pointer", color: dark ? "#fca5a5" : "#ef4444", fontSize: "0.78rem", fontFamily: "'DM Sans',sans-serif" }}
          >
            <Trash2 size={12} strokeWidth={1.9} />Удалить сотрудника
          </button>
        </div>
      </div>
    );
  };

  const renderPopup = () => {
    if (!popupFeature || !activeEmp) return null;
    const popupContent = (
      <>
        {popupFeature === "roles"       && <RolesPanel emp={activeEmp} globalRoles={globalRoles} onToggleRole={toggleDraftRole} onAddRole={onAddRole} dark={dark} label={actionLabels.roles} pCopy={panelsCopy} />}
        {popupFeature === "absences"    && <AbsencesPanel emp={activeEmp} onUpdate={a => updateDraft({ absences: a })} dark={dark} label={actionLabels.absences} pc={panelCopy2} />}
        {popupFeature === "dates"       && <HireDatesPanel emp={activeEmp} onUpdate={(h, f) => updateDraft({ hired: h, fired: f })} dark={dark} label={actionLabels.dates} pc={panelCopy2} />}
        {popupFeature === "timePrefs"   && <TimePrefsPanel emp={activeEmp} onUpdate={p => updateDraft({ timePrefs: p })} dark={dark} label={actionLabels.timePrefs} pc={panelCopy2} />}
        {popupFeature === "socialPrefs" && <SocialPrefsPanel emp={activeEmp} allEmployees={employees} onUpdate={p => updateDraft({ socialPrefs: p })} dark={dark} label={actionLabels.socialPrefs} pc={panelCopy2} />}
      </>
    );
    if (isMobile) {
      return (
        <>
          <motion.div key="popup-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
            onClick={closePopup}
            style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,0.48)", backdropFilter: "blur(2px)" }}
          />
          <motion.div key="popup-sheet" initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 32, stiffness: 320 }}
            style={{ position: "fixed", bottom: 0, left: 0, right: 0, height: "78dvh", borderRadius: "20px 20px 0 0", background: dark ? "#14121e" : "#ffffff", borderTop: `1px solid ${tc.rowBorder}`, zIndex: 201, display: "flex", flexDirection: "column", overflow: "hidden" }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 20px 10px", flexShrink: 0 }}>
              <div style={{ width: "36px", height: "4px", borderRadius: "2px", background: tc.faint, position: "absolute", top: "10px", left: "50%", transform: "translateX(-50%)" }} />
              <p style={{ margin: "16px 0 0", color: tc.headline, fontWeight: 600, fontSize: "0.9rem", letterSpacing: "-0.01em" }}>{actionLabels[popupFeature] ?? popupFeature}</p>
              <button onClick={closePopup} style={{ marginTop: "16px", background: "none", border: "none", cursor: "pointer", padding: "4px", color: tc.sub, display: "flex", alignItems: "center" }}><X size={16} strokeWidth={2} /></button>
            </div>
            <div style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: "8px 20px 16px" }}>{popupContent}</div>
            <div style={{ padding: "12px 20px 24px", flexShrink: 0, display: "flex", justifyContent: "flex-end" }}>
              <button onClick={closePopup} style={{ padding: "10px 24px", borderRadius: "10px", border: "none", cursor: "pointer", background: "linear-gradient(135deg,#a855f7,#ec4899)", color: "#fff", fontSize: "0.875rem", fontWeight: 600, fontFamily: "'DM Sans',sans-serif" }}>{copy.done}</button>
            </div>
          </motion.div>
        </>
      );
    }
    return (
      <>
        <motion.div key="popup-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}
          onClick={closePopup}
          style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,0.4)", backdropFilter: "blur(3px)" }}
        />
        <motion.div key="popup-panel" initial={{ opacity: 0, scale: 0.96, y: 8 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96, y: 6 }} transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
          style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: "min(480px, calc(100vw - 32px))", maxHeight: "80dvh", background: dark ? "#14121e" : "#ffffff", borderRadius: "16px", border: `1px solid ${tc.rowBorder}`, boxShadow: dark ? "0 24px 80px rgba(0,0,0,0.6)" : "0 24px 64px rgba(0,0,0,0.13)", zIndex: 201, display: "flex", flexDirection: "column", overflow: "hidden" }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px 14px", borderBottom: `1px solid ${tc.rowBorder}`, flexShrink: 0 }}>
            <p style={{ margin: 0, color: tc.headline, fontWeight: 600, fontSize: "0.92rem", letterSpacing: "-0.01em" }}>{actionLabels[popupFeature] ?? popupFeature}</p>
            <button onClick={closePopup} style={{ background: "none", border: "none", cursor: "pointer", padding: "4px", color: tc.sub, display: "flex", alignItems: "center" }}><X size={16} strokeWidth={2} /></button>
          </div>
          <div style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: "16px 20px" }}>{popupContent}</div>
          <div style={{ padding: "14px 20px", borderTop: `1px solid ${tc.rowBorder}`, flexShrink: 0, display: "flex", justifyContent: "flex-end" }}>
            <button onClick={closePopup} style={{ padding: "9px 22px", borderRadius: "10px", border: "none", cursor: "pointer", background: "linear-gradient(135deg,#a855f7,#ec4899)", color: "#fff", fontSize: "0.875rem", fontWeight: 600, fontFamily: "'DM Sans',sans-serif", boxShadow: "0 3px 12px rgba(168,85,247,0.28)" }}>{copy.done}</button>
          </div>
        </motion.div>
      </>
    );
  };

  const renderRolesPanel = () => (
    <div style={{ flex: 1, minHeight: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
      {employees.length === 0 && (
        <div style={{ textAlign: "center", padding: "24px 32px", maxWidth: "260px" }}>
          <UserRound size={32} strokeWidth={1.1} style={{ color: tc.faint, display: "block", margin: "0 auto 12px" }} />
          <p style={{ color: tc.sub, fontSize: "0.85rem", margin: 0, lineHeight: 1.5 }}>{stepCopy.startHint}</p>
        </div>
      )}
    </div>
  );

  const renderRightPanel = () => {
    if (!selectedEmpId || !activeEmp) return renderRolesPanel();
    return renderEmpPanel();
  };

  const sheetOpen = selectedEmpId !== null;
  const sheetTitle = activeEmp?.name ?? "";

  const empListSection = (
    <div style={{ flex: 1, overflowY: "auto", minHeight: 0 }}>
      <AnimatePresence>
        {employees.map(emp => (
          <EmpTeamRow key={emp.id} emp={draftEmp?.id === emp.id ? draftEmp : emp}
            isSelected={selectedEmpId === emp.id}
            onSelect={() => selectEmp(emp.id)}
            dark={dark}
          />
        ))}
      </AnimatePresence>
    </div>
  );

  const empInputSection = (
    <div style={{ display: "flex", gap: "6px" }}>
      <input ref={empRef} value={empInput} onChange={e => setEmpInput(e.target.value)}
        onFocus={() => setEmpFocused(true)} onBlur={() => setEmpFocused(false)}
        onKeyDown={e => { if (e.key === "Enter") handleAddEmp(); }}
        placeholder={stepCopy.employeePlaceholder}
        style={{ flex: 1, background: tc.inputBg, border: `1.5px solid ${empFocused ? "#a855f7" : tc.inputBorder}`, borderRadius: "10px", padding: "11px 14px", color: tc.headline, fontSize: "0.9rem", fontFamily: "'DM Sans',sans-serif", outline: "none", transition: "border-color 0.18s", boxSizing: "border-box" as const }}
      />
      <button onClick={handleAddEmp} style={{ background: empInput.trim() ? "linear-gradient(135deg,#a855f7,#ec4899)" : (dark ? "rgba(168,85,247,0.08)" : "rgba(168,85,247,0.06)"), border: `1.5px solid ${empInput.trim() ? "transparent" : tc.inputBorder}`, borderRadius: "10px", cursor: empInput.trim() ? "pointer" : "default", padding: "0 14px", display: "flex", alignItems: "center", color: empInput.trim() ? "#fff" : tc.iconMuted, transition: "all 0.18s", flexShrink: 0 }}>
        <Plus size={16} strokeWidth={2} />
      </button>
    </div>
  );

  if (isMobile) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "10px", height: "100%", minHeight: 0 }}>
        {empInputSection}
        {empListSection}

        <AnimatePresence>
          {sheetOpen && (
            <>
              <motion.div key="backdrop"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                onClick={saveAndClose}
                style={{ position: "fixed", inset: 0, zIndex: 99, background: "rgba(0,0,0,0.48)", backdropFilter: "blur(2px)" }}
              />
              <motion.div key="sheet"
                initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 32, stiffness: 320 }}
                style={{
                  position: "fixed", bottom: 0, left: 0, right: 0,
                  height: "78dvh", borderRadius: "20px 20px 0 0",
                  background: dark ? "#14121e" : "#ffffff",
                  borderTop: `1px solid ${tc.rowBorder}`,
                  zIndex: 100, display: "flex", flexDirection: "column", overflow: "hidden",
                }}
              >
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "12px 20px 4px", flexShrink: 0 }}>
                  <div style={{ width: "36px", height: "4px", borderRadius: "2px", background: tc.faint, marginBottom: "12px" }} />
                  <p style={{ margin: 0, color: tc.headline, fontWeight: 600, fontSize: "0.9rem", letterSpacing: "-0.01em", alignSelf: "flex-start" }}>{sheetTitle}</p>
                </div>
                <div style={{ flex: 1, minHeight: 0, padding: "12px 20px 24px", display: "flex", flexDirection: "column" }}>
                  {renderEmpPanel()}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
        <AnimatePresence>{renderPopup()}</AnimatePresence>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", gap: "20px", height: "100%", minHeight: 0 }}>
      {/* Left: employees */}
      <div style={{ flex: "0 0 min(52%, 340px)", minWidth: 0, display: "flex", flexDirection: "column", gap: "10px", minHeight: 0 }}>
        {empInputSection}
        {empListSection}
      </div>

      {/* Right: emp panel or empty state */}
      <div style={{ flex: 1, minWidth: 0, minHeight: 0, display: "flex", flexDirection: "column" }}>
        <AnimatePresence mode="wait">
          <motion.div key={selectedEmpId ?? "empty"}
            initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.16 }}
            style={{ flex: 1, display: "flex", flexDirection: "column" }}
          >
            {renderRightPanel()}
          </motion.div>
        </AnimatePresence>
      </div>
      <AnimatePresence>{renderPopup()}</AnimatePresence>
    </div>
  );
}

// ─── Legacy Step 2 (kept for reference) ──────────────────────────────────────
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

const TOTAL_STEPS = 4;

interface WizardProps { dark: boolean; language: LanguageCode; onBack: () => void; onSignUp?: () => void; }

const DRAFT_KEY = "shifty-wizard-draft";
function readDraft(): Record<string, unknown> {
  try { return JSON.parse(localStorage.getItem(DRAFT_KEY) ?? "null") ?? {}; } catch { return {}; }
}

export function Wizard({ dark, language, onBack, onSignUp }: WizardProps) {
  const [step, setStep]           = useState<number>(() => { const d = readDraft(); return typeof d.step === "number" ? d.step : 1; });
  const [scheduleName, setScheduleName] = useState<string>(() => (readDraft().scheduleName as string) ?? "");
  const [employees, setEmployees] = useState<EmpData[]>(() => (readDraft().employees as EmpData[]) ?? []);
  const [globalRoles, setGlobalRoles] = useState<string[]>(() => (readDraft().globalRoles as string[]) ?? []);
  const [nextId, setNextId]       = useState<number>(() => {
    const emps = (readDraft().employees as EmpData[]) ?? [];
    return emps.reduce((m, e) => Math.max(m, e.id), 0) + 1;
  });
  const [step3Data, setStep3Data] = useState<Step3Data>(() => (readDraft().step3Data as Step3Data) ?? defaultStep3());
  const [step5Data, setStep5Data] = useState<Step5Data>(() => (readDraft().step5Data as Step5Data) ?? defaultStep5());
  const [generationOpen, setGenerationOpen] = useState(false);
  const [generationPhase, setGenerationPhase] = useState<"loading" | "done">("loading");
  const [continueAttempted, setContinueAttempted] = useState(false);

  const copy = wizardCopy[language] ?? wizardCopy.ru;
  const stepCopy = wizardStepCopy[language] ?? wizardStepCopy.ru;
  const genC = genCopy[language] ?? genCopy.en;
  const stepTitles = stepTitlesCopy[language] ?? stepTitlesCopy.en;

  useEffect(() => { setContinueAttempted(false); }, [step]);

  useEffect(() => {
    try { localStorage.setItem(DRAFT_KEY, JSON.stringify({ step, employees, globalRoles, scheduleName, step3Data, step5Data })); }
    catch {}
  }, [step, employees, globalRoles, scheduleName, step3Data, step5Data]);

  useEffect(() => {
    if (!generationOpen || generationPhase !== "loading") return;
    const t = setTimeout(() => setGenerationPhase("done"), 5000);
    return () => clearTimeout(t);
  }, [generationOpen, generationPhase]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === "Escape") { if (generationOpen) setGenerationOpen(false); else onBack(); }
    };
    window.addEventListener("keydown", h); return () => window.removeEventListener("keydown", h);
  }, [onBack, generationOpen]);

  const addEmployee = (name: string) => {
    setEmployees(p => [...p, { id: nextId, name, roles: [], absences: [], hired: "", fired: "", timePrefs: [], socialPrefs: [] }]);
    setNextId(n => n + 1);
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

  const bg     = dark ? "#08080c" : "#faf8ff";
  const border = dark ? "rgba(168,85,247,0.12)" : "rgba(168,85,247,0.14)";
  const stepLabel = dark ? "#c4bde0" : "#a89ec0";

  const validationMessage =
    step === 1 && employees.length === 0 ? copy.validation.employees
    : step === 1 && globalRoles.length === 0 ? copy.validation.roles
    : step === 1 && hasUnassignedEmployees(employees) ? copy.validation.employeeRoles
    : step === 3 && !hasAnyShift(step3Data) ? copy.validation.shifts
    : step === 3 && hasInvalidShiftTimes(step3Data) ? copy.validation.shiftTime
    : step === 4 && hasInvalidBreakTimes(step5Data) ? copy.validation.breakTime
    : "";
  const showValidationMessage = continueAttempted && !!validationMessage;

  const rightBtnLabel = step === TOTAL_STEPS ? copy.generate : copy.continue;

  return (
    <div style={{ minHeight: "100dvh", background: bg, fontFamily: "'DM Sans',sans-serif", display: "flex", flexDirection: "column" }}>
      {/* Step indicator: ring + "Шаг N/4" */}
      <div style={{ position: "relative", zIndex: 10, padding: "16px clamp(16px, 5vw, 48px) 0", display: "flex", alignItems: "center", gap: "9px" }}>
        {/* Circular progress ring */}
        <svg width="20" height="20" viewBox="0 0 20 20" style={{ flexShrink: 0 }}>
          <defs>
            <linearGradient id="progGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#c084fc" />
              <stop offset="100%" stopColor="#ec4899" />
            </linearGradient>
          </defs>
          <circle cx="10" cy="10" r="7.5" fill="none"
            stroke={dark ? "rgba(168,85,247,0.15)" : "rgba(168,85,247,0.12)"}
            strokeWidth="2" />
          <motion.circle cx="10" cy="10" r="7.5" fill="none"
            stroke="url(#progGrad)"
            strokeWidth="2"
            strokeLinecap="round"
            transform="rotate(-90 10 10)"
            initial={{ strokeDasharray: `0 ${2 * Math.PI * 7.5}` }}
            animate={{ strokeDasharray: `${(step / TOTAL_STEPS) * 2 * Math.PI * 7.5} ${2 * Math.PI * 7.5}` }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
          />
        </svg>

        {/* Step counter — muted, no bold */}
        <span style={{ fontSize: "0.8rem", fontWeight: 400, color: dark ? "rgba(196,189,224,0.5)" : "rgba(168,158,192,0.6)", letterSpacing: "0.01em" }}>
          {copy.step} {step}/{TOTAL_STEPS}
        </span>
      </div>

      {/* Step heading */}
      <div style={{ position: "relative", zIndex: 10, padding: "14px clamp(16px, 5vw, 48px) 16px" }}>
        <AnimatePresence mode="wait">
          <motion.h2 key={step} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.22 }}
            style={{ margin: 0, fontSize: "clamp(1.25rem, 3vw, 1.55rem)", fontWeight: 650, letterSpacing: "-0.028em", color: dark ? "#f0ecff" : "#0f0a1e" }}
          >{stepTitles[step - 1]}</motion.h2>
        </AnimatePresence>
      </div>

      {/* Content */}
      <main style={{ position: "relative", zIndex: 10, flex: 1, minHeight: 0, display: "flex", flexDirection: "column", padding: "0 clamp(16px, 5vw, 48px)", overflow: "hidden" }}>
        <AnimatePresence mode="wait">
          <motion.div key={step} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", maxWidth: step === 1 ? "10040px" : "700px", width: "100%", margin: step === 1 ? "0" : "0 auto", alignSelf: step === 1 ? "flex-start" : "center" }}
          >
            {step === 1 && (
              <StepTeam
                employees={employees} globalRoles={globalRoles}
                onAddEmployee={addEmployee} onDeleteEmployee={id => setEmployees(p => p.filter(e => e.id !== id))}
                onAddRole={addRole} onRenameRole={renameRole} onDeleteRole={deleteRole}
                onUpdateEmp={(id, patch) => setEmployees(p => p.map(e => e.id !== id ? e : { ...e, ...patch }))}
                dark={dark} copy={copy} stepCopy={stepCopy}
                panelsCopy={rolePanelCopy[language] ?? rolePanelCopy.en}
                panelCopy2={panelCopyRec[language] ?? panelCopyRec.en}
              />
            )}
            {step === 2 && <StepThree data={step3Data} onChange={setStep3Data} dark={dark} language={language} />}
            {step === 3 && <StepFour data={step3Data} onChange={setStep3Data} globalRoles={globalRoles} onGoToStep={setStep} dark={dark} language={language} />}
            {step === 4 && <StepFive data={step5Data} onChange={setStep5Data} scheduleName={scheduleName} onScheduleNameChange={setScheduleName} scheduleCopy={copy.schedule} dark={dark} />}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer style={{ position: "relative", zIndex: 10, padding: "16px clamp(16px, 5vw, 48px) clamp(24px, 5vw, 40px)" }}>
        {showValidationMessage && (
          <div style={{ display: "flex", alignItems: "flex-start", gap: "8px", padding: "10px 12px", borderRadius: "10px", marginBottom: "12px", background: dark ? "rgba(248,113,113,0.08)" : "rgba(248,113,113,0.06)", border: "1px solid rgba(248,113,113,0.24)", color: "#f87171", fontSize: "0.78rem", lineHeight: 1.45 }}>
            <AlertCircle size={14} strokeWidth={1.9} style={{ flex: "0 0 auto", marginTop: "1px" }} />
            <span>{validationMessage}</span>
          </div>
        )}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <a onClick={() => step > 1 ? setStep(s => s - 1) : onBack()}
            style={{ display: "inline-flex", alignItems: "center", gap: "3px", color: stepLabel, fontSize: "0.875rem", cursor: "pointer", textDecoration: "none", transition: "opacity 0.15s", visibility: step > 1 ? "visible" : "hidden" }}
            onMouseEnter={e => ((e.currentTarget as HTMLElement).style.opacity = "0.7")}
            onMouseLeave={e => ((e.currentTarget as HTMLElement).style.opacity = "1")}
          >
            <ChevronLeft size={14} strokeWidth={2.5} />{stepTitles[step - 2]}
          </a>
          <button
            onClick={() => {
              if (validationMessage) { setContinueAttempted(true); return; }
              if (step === TOTAL_STEPS) { setGenerationPhase("loading"); setGenerationOpen(true); return; }
              setStep(s => s + 1);
            }}
            style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "13px 22px", borderRadius: "10px", background: "linear-gradient(135deg,#a855f7 0%,#ec4899 100%)", color: "#fff", fontSize: "0.95rem", fontWeight: 500, border: "none", cursor: "pointer", fontFamily: "'DM Sans',sans-serif", boxShadow: "0 4px 20px rgba(168,85,247,0.3)", transition: "all 0.18s ease", whiteSpace: "nowrap" }}
            onMouseEnter={e => { e.currentTarget.style.filter = "brightness(1.07)"; e.currentTarget.style.boxShadow = "0 6px 28px rgba(168,85,247,0.45)"; }}
            onMouseLeave={e => { e.currentTarget.style.filter = "brightness(1)"; e.currentTarget.style.boxShadow = "0 4px 20px rgba(168,85,247,0.3)"; }}
          >{rightBtnLabel}</button>
        </div>
      </footer>

      {/* Generation dialog */}
      <AnimatePresence>
        {generationOpen && (
          <>
            {/* Backdrop — only dismiss when done */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
              onClick={() => generationPhase === "done" && setGenerationOpen(false)}
              style={{ position: "fixed", inset: 0, background: dark ? "rgba(0,0,0,0.58)" : "rgba(15,10,30,0.3)", backdropFilter: "blur(6px)", zIndex: 70, cursor: generationPhase === "done" ? "pointer" : "default" }}
            />
            <motion.div
              initial={{ opacity: 0, x: "-50%", y: "calc(-50% + 22px)", scale: 0.96 }}
              animate={{ opacity: 1, x: "-50%", y: "-50%", scale: 1 }}
              exit={{ opacity: 0, x: "-50%", y: "calc(-50% + 22px)", scale: 0.96 }}
              transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
              style={{ position: "fixed", left: "50%", top: "50%", zIndex: 71, width: "min(400px, calc(100vw - 32px))", borderRadius: "22px", border: `1px solid ${border}`, background: dark ? "#0f0d1a" : "#ffffff", boxShadow: dark ? "0 32px 100px rgba(0,0,0,0.7)" : "0 28px 80px rgba(15,10,30,0.18)", overflow: "hidden" }}
            >
              <AnimatePresence mode="wait">
                {generationPhase === "loading" ? (
                  <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}
                    style={{ padding: "36px 28px 32px", textAlign: "center" }}
                  >
                    {/* Spinning ring */}
                    <div style={{ position: "relative", width: 72, height: 72, margin: "0 auto 24px" }}>
                      <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.4, repeat: Infinity, ease: "linear" }}
                        style={{ position: "absolute", inset: 0, borderRadius: "50%", background: "conic-gradient(from 0deg, #a855f7 0%, #ec4899 40%, transparent 70%)" }}
                      />
                      <div style={{ position: "absolute", inset: "5px", borderRadius: "50%", background: dark ? "#0f0d1a" : "#ffffff", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <div style={{ width: 26, height: 26, borderRadius: "8px", background: "linear-gradient(135deg,#a855f7,#ec4899)" }} />
                      </div>
                    </div>
                    <p style={{ color: dark ? "#f0ecff" : "#0f0a1e", fontSize: "1.1rem", fontWeight: 650, margin: "0 0 8px", letterSpacing: "-0.02em" }}>{copy.generationTitle}</p>
                    <p style={{ color: stepLabel, fontSize: "0.82rem", lineHeight: 1.65, margin: "0 0 20px" }}>{copy.generationText}</p>
                    {/* Bouncing dots */}
                    <div style={{ display: "flex", gap: "7px", justifyContent: "center" }}>
                      {[0, 0.18, 0.36].map((delay, i) => (
                        <motion.div key={i} animate={{ y: [0, -8, 0], opacity: [0.4, 1, 0.4] }}
                          transition={{ duration: 0.9, repeat: Infinity, delay, ease: "easeInOut" }}
                          style={{ width: 7, height: 7, borderRadius: "50%", background: "linear-gradient(135deg,#a855f7,#ec4899)" }}
                        />
                      ))}
                    </div>
                  </motion.div>
                ) : (
                  <motion.div key="done" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                    style={{ padding: "36px 28px 28px", textAlign: "center" }}
                  >
                    {/* Checkmark */}
                    <motion.div initial={{ scale: 0, rotate: -20 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", damping: 14, stiffness: 260 }}
                      style={{ width: 60, height: 60, margin: "0 auto 18px", borderRadius: "50%", background: "linear-gradient(135deg,#a855f7,#ec4899)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 12px 36px rgba(168,85,247,0.42)" }}
                    >
                      <Check size={26} color="#fff" strokeWidth={2.5} />
                    </motion.div>
                    <p style={{ color: dark ? "#f0ecff" : "#0f0a1e", fontSize: "1.15rem", fontWeight: 650, margin: "0 0 8px", letterSpacing: "-0.025em" }}>{genC.done}</p>
                    <p style={{ color: stepLabel, fontSize: "0.82rem", lineHeight: 1.65, margin: "0 0 22px" }}>{genC.doneText}</p>
                    {/* Sign up CTA */}
                    <button onClick={() => { setGenerationOpen(false); if (onSignUp) onSignUp(); else onBack(); }}
                      style={{ width: "100%", padding: "13px 16px", borderRadius: "12px", border: "none", background: "linear-gradient(135deg,#a855f7,#ec4899)", color: "#fff", cursor: "pointer", fontFamily: "'DM Sans',sans-serif", fontSize: "0.95rem", fontWeight: 650, marginBottom: "10px", boxShadow: "0 6px 22px rgba(168,85,247,0.36)", letterSpacing: "-0.01em" }}
                    >{genC.signUp}</button>
                    {/* Download button */}
                    <button onClick={() => setGenerationOpen(false)}
                      style={{ width: "100%", padding: "11px 8px", borderRadius: "12px", border: `1px solid ${border}`, background: dark ? "rgba(168,85,247,0.07)" : "rgba(168,85,247,0.05)", color: dark ? "#c4b5fd" : "#7c3aed", cursor: "pointer", fontFamily: "'DM Sans',sans-serif", fontSize: "0.84rem", fontWeight: 600, letterSpacing: "-0.01em", transition: "all 0.15s" }}
                      onMouseEnter={e => { e.currentTarget.style.background = dark ? "rgba(168,85,247,0.14)" : "rgba(168,85,247,0.1)"; }}
                      onMouseLeave={e => { e.currentTarget.style.background = dark ? "rgba(168,85,247,0.07)" : "rgba(168,85,247,0.05)"; }}
                    >{genC.download}</button>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
