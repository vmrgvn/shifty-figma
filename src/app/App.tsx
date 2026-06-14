import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { ArrowRight } from "lucide-react";
import { Wizard } from "./components/Wizard";

const themes = {
  dark: {
    bg: "#08080c",
    headline: "#f0ecff",
    sub: "#a8a3be",
    navText: "#0f0a1e",
    login: "#8b849e",
    loginHover: "#c4b5fd",
    footer: "#4a4460",
    hint: "#6b6080",
    glow: "radial-gradient(ellipse at 50% 0%, rgba(168,85,247,0.22) 0%, rgba(236,72,153,0.10) 40%, transparent 70%)",
  },
  light: {
    bg: "#faf8ff",
    headline: "#0f0a1e",
    sub: "#6a6680",
    navText: "#0f0a1e",
    login: "#a096b8",
    loginHover: "#7c3aed",
    footer: "#c8bedd",
    hint: "#bdb0d4",
    glow: "radial-gradient(ellipse at 50% 0%, rgba(168,85,247,0.10) 0%, rgba(236,72,153,0.05) 40%, transparent 70%)",
  },
};

export default function App() {
  const [dark, setDark] = useState(() =>
    window.matchMedia("(prefers-color-scheme: dark)").matches
  );
  const [wizardOpen, setWizardOpen] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e: MediaQueryListEvent) => setDark(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const t = dark ? themes.dark : themes.light;

  return (
    <div
      className="relative flex flex-col"
      style={{ fontFamily: "'DM Sans', sans-serif", background: t.bg, minHeight: "100dvh", transition: "background 0.3s" }}
    >
      {/* Noise (dark only) */}
      {dark && (
        <svg className="absolute inset-0 w-full h-full opacity-[0.025] pointer-events-none" style={{ zIndex: 1 }}>
          <filter id="noise">
            <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" />
            <feColorMatrix type="saturate" values="0" />
          </filter>
          <rect width="100%" height="100%" filter="url(#noise)" />
        </svg>
      )}

      {/* Glow */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: "-120px",
          left: "50%",
          transform: "translateX(-50%)",
          width: "min(900px, 120vw)",
          height: "600px",
          background: t.glow,
          zIndex: 0,
        }}
      />

      {/* Nav */}
      <nav className="relative flex items-center justify-between px-6 md:px-14 py-5" style={{ zIndex: 10 }}>
        <div className="flex items-center gap-2.5">
          <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
            <rect x="2" y="2" width="10" height="6" rx="2" fill="url(#s1)" />
            <rect x="14" y="2" width="10" height="6" rx="2" fill="url(#s2)" opacity="0.5" />
            <rect x="2" y="10" width="6" height="6" rx="2" fill="url(#s2)" opacity="0.7" />
            <rect x="10" y="10" width="14" height="6" rx="2" fill="url(#s1)" />
            <rect x="2" y="18" width="14" height="6" rx="2" fill="url(#s2)" opacity="0.6" />
            <rect x="18" y="18" width="6" height="6" rx="2" fill="url(#s1)" opacity="0.4" />
            <defs>
              <linearGradient id="s1" x1="2" y1="2" x2="24" y2="24" gradientUnits="userSpaceOnUse">
                <stop stopColor="#c084fc" />
                <stop offset="1" stopColor="#a855f7" />
              </linearGradient>
              <linearGradient id="s2" x1="2" y1="2" x2="24" y2="24" gradientUnits="userSpaceOnUse">
                <stop stopColor="#e879f9" />
                <stop offset="1" stopColor="#ec4899" />
              </linearGradient>
            </defs>
          </svg>
          <span style={{ fontSize: "1.05rem", fontWeight: 500, letterSpacing: "-0.02em", color: t.navText }}>
            Shifty
          </span>
        </div>

        <a
          href="#"
          style={{ color: t.login, fontSize: "0.875rem", textDecoration: "none", transition: "color 0.15s" }}
          onMouseEnter={(e) => ((e.target as HTMLElement).style.color = t.loginHover)}
          onMouseLeave={(e) => ((e.target as HTMLElement).style.color = t.login)}
        >
          Войти
        </a>
      </nav>

      {/* Hero */}
      <main
        className="relative flex-1 flex flex-col items-center justify-center px-6 text-center"
        style={{ zIndex: 10, paddingTop: "clamp(2rem, 8vw, 5rem)", paddingBottom: "clamp(3rem, 8vw, 5rem)" }}
      >
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.07, ease: [0.16, 1, 0.3, 1] }}
          style={{ maxWidth: "820px", width: "100%" }}
        >
          <h1
            style={{
              fontFamily: "'Instrument Serif', Georgia, serif",
              fontWeight: 400,
              fontSize: "clamp(2.4rem, 8vw, 5rem)",
              lineHeight: 1.07,
              letterSpacing: "-0.025em",
              color: t.headline,
              margin: 0,
              transition: "color 0.3s",
            }}
          >
            Создайте расписание,{" "}
            <span
              style={{
                fontStyle: "italic",
                background: "linear-gradient(120deg, #c084fc 0%, #ec4899 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              пока не остыл кофе
            </span>
          </h1>
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
          style={{
            color: t.sub,
            fontSize: "clamp(0.95rem, 2.5vw, 1.05rem)",
            maxWidth: "560px",
            marginTop: "1.5rem",
            lineHeight: 1.7,
            fontWeight: 300,
            transition: "color 0.3s",
          }}
        >
          Минимум настроек, максимум учета. Shifty учитывает ограничения и автоматически генерирует смены с учётом всех условий и пожеланий команды. Создайте первое расписание за пару минут.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.23, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col items-center mt-10"
          style={{ gap: "11px" }}
        >
          <button
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "14px 32px",
              borderRadius: "10px",
              background: "linear-gradient(135deg, #a855f7 0%, #ec4899 100%)",
              color: "#fff",
              fontSize: "0.95rem",
              fontWeight: 500,
              letterSpacing: "-0.01em",
              border: "none",
              cursor: "pointer",
              boxShadow: dark
                ? "0 0 0 1px rgba(168,85,247,0.3), 0 8px 32px rgba(168,85,247,0.25)"
                : "0 0 0 1px rgba(168,85,247,0.2), 0 8px 24px rgba(168,85,247,0.18)",
              transition: "all 0.18s ease",
              fontFamily: "inherit",
              whiteSpace: "nowrap",
            }}
            onClick={() => setWizardOpen(true)}
            onMouseEnter={(e) => {
              const el = e.currentTarget;
              el.style.boxShadow = "0 0 0 1px rgba(168,85,247,0.5), 0 12px 40px rgba(168,85,247,0.4)";
              el.style.transform = "translateY(-1px)";
              el.style.filter = "brightness(1.06)";
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget;
              el.style.boxShadow = dark
                ? "0 0 0 1px rgba(168,85,247,0.3), 0 8px 32px rgba(168,85,247,0.25)"
                : "0 0 0 1px rgba(168,85,247,0.2), 0 8px 24px rgba(168,85,247,0.18)";
              el.style.transform = "translateY(0)";
              el.style.filter = "brightness(1)";
            }}
          >
            Попробовать
            <ArrowRight size={15} strokeWidth={2} />
          </button>
          <span style={{ color: t.hint, fontSize: "0.78rem", fontWeight: 400, letterSpacing: "0.01em", transition: "color 0.3s" }}>
            Бесплатно и без регистрации
          </span>
        </motion.div>
      </main>

      <Wizard open={wizardOpen} onClose={() => setWizardOpen(false)} dark={dark} />

      {/* Footer */}
      <div
        className="relative text-center py-4"
        style={{ zIndex: 10, color: t.footer, fontSize: "0.72rem", letterSpacing: "0.02em", transition: "color 0.3s" }}
      >
        © 2026 Shifty
      </div>
    </div>
  );
}
