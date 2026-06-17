import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Check, ChevronDown, Menu, Moon, Sun, Monitor } from "lucide-react";

export type ThemeMode = "system" | "dark" | "light";

export type LanguageCode =
  | "ru"
  | "en"
  | "kk"
  | "de"
  | "fr"
  | "es"
  | "it"
  | "pt"
  | "tr"
  | "zh"
  | "ja";

interface NavMenuProps {
  dark: boolean;
  theme: ThemeMode;
  language: LanguageCode;
  onThemeChange: (theme: ThemeMode) => void;
  onLanguageChange: (language: LanguageCode) => void;
}

const LANGS: { code: LanguageCode; label: string; native: string; flag: string }[] = [
  { code: "ru", label: "Russian", native: "Русский", flag: "🇷🇺" },
  { code: "en", label: "English", native: "English", flag: "🇺🇸" },
  { code: "kk", label: "Kazakh", native: "Қазақша", flag: "🇰🇿" },
  { code: "de", label: "German", native: "Deutsch", flag: "🇩🇪" },
  { code: "fr", label: "French", native: "Français", flag: "🇫🇷" },
  { code: "es", label: "Spanish", native: "Español", flag: "🇪🇸" },
  { code: "it", label: "Italian", native: "Italiano", flag: "🇮🇹" },
  { code: "pt", label: "Portuguese", native: "Português", flag: "🇵🇹" },
  { code: "tr", label: "Turkish", native: "Türkçe", flag: "🇹🇷" },
  { code: "zh", label: "Chinese", native: "中文", flag: "🇨🇳" },
  { code: "ja", label: "Japanese", native: "日本語", flag: "🇯🇵" },
];

const THEMES: { key: ThemeMode; label: string; Icon: typeof Sun }[] = [
  { key: "dark",   label: "тёмная",    Icon: Moon    },
  { key: "light",  label: "светлая",   Icon: Sun     },
  { key: "system", label: "системная", Icon: Monitor },
];

export function NavMenu({
  dark,
  theme,
  language,
  onThemeChange,
  onLanguageChange,
}: NavMenuProps) {
  const [open, setOpen] = useState(false);
  const [languageOpen, setLanguageOpen] = useState(false);
  const [hovered, setHovered] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const activeLang = LANGS.find((item) => item.code === language) ?? LANGS[0];

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        setOpen(false);
        setLanguageOpen(false);
      }
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        setLanguageOpen(false);
      }
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const color = {
    trigger: dark ? "#9d95b7" : "#8f84aa",
    triggerBg: dark ? "rgba(255,255,255,0.045)" : "rgba(255,255,255,0.68)",
    triggerBorder: dark ? "rgba(255,255,255,0.08)" : "rgba(168,85,247,0.13)",
    panel:
      dark
        ? "linear-gradient(180deg, rgba(20,18,30,0.96), rgba(12,12,18,0.97))"
        : "linear-gradient(180deg, rgba(255,255,255,0.94), rgba(250,248,255,0.97))",
    border: dark ? "rgba(255,255,255,0.09)" : "rgba(168,85,247,0.16)",
    text: dark ? "#f0ecff" : "#171026",
    sub: dark ? "#8f87a6" : "#7a728e",
    muted: dark ? "#6e6684" : "#aaa0bf",
    field: dark ? "rgba(255,255,255,0.055)" : "rgba(15,10,30,0.045)",
    fieldHover: dark ? "rgba(168,85,247,0.13)" : "rgba(168,85,247,0.08)",
    active: dark ? "rgba(192,132,252,0.16)" : "rgba(168,85,247,0.10)",
    activeBorder: dark ? "rgba(192,132,252,0.28)" : "rgba(168,85,247,0.22)",
    accent: dark ? "#d8c8ff" : "#7c3aed",
  };


  return (
    <div ref={menuRef} style={{ position: "relative", zIndex: 5000 }}>
      <button
        type="button"
        aria-label={open ? "Закрыть меню" : "Открыть меню"}
        aria-expanded={open}
        onClick={() => {
          setOpen((value) => !value);
          setLanguageOpen(false);
        }}
        onMouseEnter={() => setHovered("trigger")}
        onMouseLeave={() => setHovered(null)}
        style={{
          width: "36px",
          height: "36px",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: "9px",
          border: "none",
          background: "transparent",
          color: open || hovered === "trigger" ? color.accent : color.trigger,
          boxShadow: "none",
          cursor: "pointer",
          outline: "none",
          transition: "color 0.16s ease",
        }}
      >
        <Menu size={18} strokeWidth={2} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.96 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            style={{
              position: "absolute",
              right: 0,
              top: "calc(100% + 12px)",
              width: "min(320px, calc(100vw - 32px))",
              padding: "12px",
              borderRadius: "18px",
              border: `1px solid ${color.border}`,
              background: color.panel,
              boxShadow: dark
                ? "0 30px 80px rgba(0,0,0,0.58), 0 0 0 1px rgba(168,85,247,0.04)"
                : "0 24px 70px rgba(48,32,80,0.16), 0 0 0 1px rgba(255,255,255,0.7) inset",
              transformOrigin: "top right",
              zIndex: 5001,
              fontFamily: "'DM Sans', sans-serif",
              color: color.text,
              backdropFilter: "blur(22px)",
              WebkitBackdropFilter: "blur(22px)",
            }}
          >
            <button
              type="button"
              onMouseEnter={() => setHovered("login")}
              onMouseLeave={() => setHovered(null)}
              style={{
                width: "100%",
                height: "46px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "12px",
                padding: "0 13px",
                borderRadius: "12px",
                border: "1px solid rgba(168,85,247,0.38)",
                background: "linear-gradient(135deg, #a855f7 0%, #ec4899 100%)",
                color: "#fff",
                cursor: "pointer",
                fontFamily: "inherit",
                fontSize: "0.92rem",
                fontWeight: 600,
                boxShadow: dark
                  ? "0 12px 34px rgba(168,85,247,0.26)"
                  : "0 12px 30px rgba(168,85,247,0.22)",
                filter: hovered === "login" ? "brightness(1.07)" : "brightness(1)",
                transform: hovered === "login" ? "translateY(-1px)" : "translateY(0)",
                transition: "filter 0.16s ease, transform 0.16s ease, box-shadow 0.16s ease",
              }}
            >
              <span style={{ flex: 1, textAlign: "center" }}>Войти</span>
            </button>

            <section style={{ marginTop: "16px" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: "8px",
                  padding: "0 2px",
                }}
              >
                <span style={{ color: color.text, fontSize: "0.82rem", fontWeight: 600 }}>
                  Язык
                </span>
              </div>

              <div
                style={{
                  position: "relative",
                  zIndex: 5002,
                }}
              >
                <button
                  type="button"
                  aria-haspopup="listbox"
                  aria-expanded={languageOpen}
                  onClick={() => setLanguageOpen((value) => !value)}
                  onMouseEnter={() => setHovered("language-trigger")}
                  onMouseLeave={() => setHovered(null)}
                  style={{
                    width: "100%",
                    minHeight: "46px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "12px",
                    borderRadius: "12px",
                    border: `1px solid ${
                      languageOpen || hovered === "language-trigger" ? color.activeBorder : "transparent"
                    }`,
                    background:
                      languageOpen || hovered === "language-trigger" ? color.fieldHover : color.field,
                    color: color.text,
                    cursor: "pointer",
                    padding: "0 13px",
                    fontFamily: "inherit",
                    transition: "background 0.16s ease, border 0.16s ease",
                  }}
                >
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
                    <span style={{ flex: "0 0 auto", fontSize: "1.05rem", lineHeight: 1 }}>
                      {activeLang.flag}
                    </span>
                    <span
                      style={{
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        fontSize: "0.92rem",
                        fontWeight: 600,
                      }}
                    >
                      {activeLang.native}
                    </span>
                  </span>
                  <ChevronDown
                    size={16}
                    strokeWidth={2}
                    style={{
                      flex: "0 0 auto",
                      color: color.sub,
                      transform: languageOpen ? "rotate(180deg)" : "rotate(0deg)",
                      transition: "transform 0.16s ease",
                    }}
                  />
                </button>

                <AnimatePresence>
                  {languageOpen && (
                    <motion.div
                      role="listbox"
                      initial={{ opacity: 0, y: -6, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -6, scale: 0.98 }}
                      transition={{ duration: 0.14 }}
                      style={{
                        position: "absolute",
                        left: 0,
                        right: 0,
                        top: "calc(100% + 6px)",
                        maxHeight: "220px",
                        overflowY: "auto",
                        padding: "6px",
                        borderRadius: "13px",
                        border: `1px solid ${color.border}`,
                        background: dark ? "rgba(17,16,24,0.98)" : "rgba(255,255,255,0.98)",
                        boxShadow: dark
                          ? "0 18px 46px rgba(0,0,0,0.46)"
                          : "0 18px 46px rgba(48,32,80,0.18)",
                        zIndex: 5003,
                      }}
                    >
                      {LANGS.map((item) => {
                        const active = item.code === language;
                        const rowHovered = hovered === `lang-${item.code}`;

                        return (
                          <button
                            type="button"
                            role="option"
                            aria-selected={active}
                            key={item.code}
                            onClick={() => {
                              onLanguageChange(item.code);
                              setLanguageOpen(false);
                            }}
                            onMouseEnter={() => setHovered(`lang-${item.code}`)}
                            onMouseLeave={() => setHovered(null)}
                            style={{
                              width: "100%",
                              minHeight: "38px",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              gap: "10px",
                              padding: "0 10px",
                              border: "none",
                              borderRadius: "9px",
                              background: active
                                ? color.active
                                : rowHovered
                                  ? color.fieldHover
                                  : "transparent",
                              color: active || rowHovered ? color.accent : color.text,
                              cursor: "pointer",
                              fontFamily: "inherit",
                              fontSize: "0.86rem",
                              fontWeight: active ? 600 : 500,
                              textAlign: "left",
                              transition: "background 0.14s ease, color 0.14s ease",
                            }}
                          >
                            <span
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "10px",
                                minWidth: 0,
                                overflow: "hidden",
                              }}
                            >
                              <span style={{ flex: "0 0 auto", fontSize: "1rem", lineHeight: 1 }}>
                                {item.flag}
                              </span>
                              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                {item.native}
                              </span>
                            </span>
                            {active && <Check size={14} strokeWidth={2.2} />}
                          </button>
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

            </section>

            <section style={{ marginTop: "16px" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: "8px",
                  padding: "0 2px",
                }}
              >
                <span style={{ color: color.text, fontSize: "0.82rem", fontWeight: 600 }}>
                  Тема
                </span>
              </div>

              <div
                style={{
                  position: "relative",
                  height: "88px",
                  borderRadius: "16px",
                  overflow: "hidden",
                  background: dark ? "rgba(255,255,255,0.045)" : "rgba(15,10,30,0.04)",
                }}
              >
                {THEMES.map(({ key, label, Icon }) => {
                  const active = theme === key;
                  const index = THEMES.findIndex((item) => item.key === key);

                  return (
                    <button
                      type="button"
                      key={key}
                      onClick={() => onThemeChange(key)}
                      onMouseEnter={() => setHovered(`theme-${key}`)}
                      onMouseLeave={() => setHovered(null)}
                      style={{
                        position: "absolute",
                        left: `${16 + index * 34}%`,
                        top: "14px",
                        width: "68px",
                        height: "62px",
                        marginLeft: "-34px",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "flex-start",
                        gap: "8px",
                        padding: "0",
                        borderRadius: "14px",
                        border: "none",
                        background: "transparent",
                        color: active || hovered === `theme-${key}` ? color.accent : color.text,
                        cursor: "pointer",
                        fontFamily: "inherit",
                        fontSize: "0.72rem",
                        fontWeight: active ? 700 : 500,
                        transition: "color 0.16s ease",
                      }}
                    >
                      <span
                        style={{
                          width: "32px",
                          height: "32px",
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          borderRadius: "999px",
                          background: active
                            ? "#a855f7"
                            : dark
                              ? "rgba(255,255,255,0.08)"
                              : "rgba(255,255,255,0.72)",
                          boxShadow: active
                            ? dark
                              ? "0 12px 30px rgba(168,85,247,0.32)"
                              : "0 12px 26px rgba(168,85,247,0.22)"
                            : "none",
                          transition: "background 0.16s ease, box-shadow 0.16s ease",
                        }}
                      >
                        <Icon
                          size={15}
                          strokeWidth={active ? 2.2 : 1.8}
                          color={active ? "#fff" : hovered === `theme-${key}` ? color.accent : color.sub}
                        />
                      </span>
                      <span style={{ maxWidth: "64px", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
