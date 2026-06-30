import { FormEvent, useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { ArrowLeft, ArrowRight, Check, ChevronDown, RotateCcw, Search } from "lucide-react";
import { LanguageCode } from "./NavMenu";

interface AuthPageProps {
  dark: boolean;
  language: LanguageCode;
  onBack: () => void;
}

// ─── Country data ─────────────────────────────────────────────────────────────
// No emoji flags — they render as "RU"/"US" text on Windows, not images.
// Country code + dial is sufficient and looks intentional.

interface Country {
  code: string; // ISO 3166-1 alpha-2
  name: string;
  dial: string;
}

const COUNTRIES: Country[] = [
  // CIS / post-Soviet (primary market first)
  { code: "RU", name: "Россия",             dial: "+7"   },
  { code: "KZ", name: "Казахстан",          dial: "+7"   },
  { code: "UA", name: "Украина",            dial: "+380" },
  { code: "BY", name: "Беларусь",           dial: "+375" },
  { code: "UZ", name: "Узбекистан",         dial: "+998" },
  { code: "KG", name: "Кыргызстан",         dial: "+996" },
  { code: "TJ", name: "Таджикистан",        dial: "+992" },
  { code: "TM", name: "Туркменистан",       dial: "+993" },
  { code: "AZ", name: "Азербайджан",        dial: "+994" },
  { code: "GE", name: "Грузия",             dial: "+995" },
  { code: "AM", name: "Армения",            dial: "+374" },
  { code: "MD", name: "Молдова",            dial: "+373" },
  // Europe
  { code: "DE", name: "Германия",           dial: "+49"  },
  { code: "FR", name: "Франция",            dial: "+33"  },
  { code: "GB", name: "Великобритания",     dial: "+44"  },
  { code: "IT", name: "Италия",             dial: "+39"  },
  { code: "ES", name: "Испания",            dial: "+34"  },
  { code: "NL", name: "Нидерланды",         dial: "+31"  },
  { code: "PL", name: "Польша",             dial: "+48"  },
  { code: "SE", name: "Швеция",             dial: "+46"  },
  { code: "NO", name: "Норвегия",           dial: "+47"  },
  { code: "FI", name: "Финляндия",          dial: "+358" },
  { code: "PT", name: "Португалия",         dial: "+351" },
  { code: "AT", name: "Австрия",            dial: "+43"  },
  { code: "CH", name: "Швейцария",          dial: "+41"  },
  { code: "BE", name: "Бельгия",            dial: "+32"  },
  { code: "CZ", name: "Чехия",             dial: "+420" },
  { code: "RO", name: "Румыния",            dial: "+40"  },
  { code: "HU", name: "Венгрия",            dial: "+36"  },
  { code: "LT", name: "Литва",             dial: "+370" },
  { code: "LV", name: "Латвия",            dial: "+371" },
  { code: "EE", name: "Эстония",           dial: "+372" },
  // Americas
  { code: "US", name: "США",               dial: "+1"   },
  { code: "CA", name: "Канада",            dial: "+1"   },
  { code: "BR", name: "Бразилия",          dial: "+55"  },
  { code: "MX", name: "Мексика",           dial: "+52"  },
  // Middle East
  { code: "TR", name: "Турция",            dial: "+90"  },
  { code: "IL", name: "Израиль",           dial: "+972" },
  { code: "AE", name: "ОАЭ",              dial: "+971" },
  { code: "SA", name: "Саудовская Аравия", dial: "+966" },
  // Asia-Pacific
  { code: "CN", name: "Китай",            dial: "+86"  },
  { code: "JP", name: "Япония",           dial: "+81"  },
  { code: "KR", name: "Корея",            dial: "+82"  },
  { code: "IN", name: "Индия",            dial: "+91"  },
  { code: "AU", name: "Австралия",        dial: "+61"  },
  { code: "NZ", name: "Новая Зеландия",   dial: "+64"  },
];

const LOCALE_TO_CODE: Record<string, string> = {
  "ru": "RU", "ru-RU": "RU", "ru-KZ": "KZ", "ru-UA": "UA", "ru-BY": "BY",
  "kk": "KZ", "kk-KZ": "KZ",
  "uk": "UA", "uk-UA": "UA",
  "be": "BY", "be-BY": "BY",
  "uz": "UZ", "uz-UZ": "UZ",
  "ky": "KG", "ky-KG": "KG",
  "tg": "TJ", "tk": "TM",
  "az": "AZ", "az-AZ": "AZ",
  "ka": "GE", "ka-GE": "GE",
  "hy": "AM", "hy-AM": "AM",
  "ro": "MD",
  "en": "US", "en-US": "US", "en-GB": "GB", "en-AU": "AU", "en-CA": "CA",
  "de": "DE", "de-DE": "DE", "de-AT": "AT",
  "fr": "FR", "fr-FR": "FR",
  "it": "IT", "es": "ES", "nl": "NL", "pl": "PL",
  "sv": "SE", "no": "NO", "nb": "NO",
  "fi": "FI", "pt": "BR", "pt-BR": "BR", "pt-PT": "PT",
  "cs": "CZ", "tr": "TR", "tr-TR": "TR",
  "he": "IL", "ar": "AE",
  "zh": "CN", "ja": "JP", "ko": "KR", "hi": "IN",
};

function detectCountry(): Country {
  const lang = navigator.language ?? "ru";
  const code = LOCALE_TO_CODE[lang] ?? LOCALE_TO_CODE[lang.split("-")[0]] ?? "RU";
  return COUNTRIES.find(c => c.code === code) ?? COUNTRIES[0];
}

// ─── Palette ──────────────────────────────────────────────────────────────────

function palette(dark: boolean) {
  return {
    bg:         dark ? "#07070b"                : "#f9f7ff",
    text:       dark ? "#ece8ff"                : "#0d0820",
    sub:        dark ? "#7d7590"                : "#9489a8",
    border:     dark ? "rgba(168,85,247,0.13)"  : "rgba(168,85,247,0.15)",
    field:      dark ? "rgba(255,255,255,0.05)" : "rgba(15,10,30,0.04)",
    fieldFocus: dark ? "rgba(192,132,252,0.25)" : "rgba(168,85,247,0.18)",
    icon:       dark ? "#c4b5fd"                : "#7c3aed",
    codeBg:     dark ? "rgba(168,85,247,0.14)"  : "rgba(168,85,247,0.10)",
    sheet:      dark ? "#0f0d1a"                : "#ffffff",
    otpFilled:  dark ? "rgba(168,85,247,0.09)"  : "rgba(168,85,247,0.05)",
    otpBorder:  dark ? "rgba(168,85,247,0.38)"  : "rgba(168,85,247,0.32)",
  };
}

// ─── Component ────────────────────────────────────────────────────────────────

type Step = "phone" | "otp";

export function AuthPage({ dark, onBack }: AuthPageProps) {
  const [step,        setStep]        = useState<Step>("phone");
  const [country,     setCountry]     = useState<Country>(() => detectCountry());
  const [phone,       setPhone]       = useState("");
  const [showPicker,  setShowPicker]  = useState(false);
  const [pickerAnim,  setPickerAnim]  = useState(false);
  const [search,      setSearch]      = useState("");
  const [otpDigits,   setOtpDigits]   = useState<string[]>(Array(6).fill(""));
  const [focused,     setFocused]     = useState<string | null>(null);
  const [resendTimer, setResendTimer] = useState(0);
  const [otpError,    setOtpError]    = useState<string | null>(null);

  const otpRefs   = useRef<(HTMLInputElement | null)[]>([]);
  const searchRef = useRef<HTMLInputElement>(null);
  const activeRef = useRef<HTMLButtonElement | null>(null);
  const c = palette(dark);

  useEffect(() => {
    if (resendTimer <= 0) return;
    const id = setTimeout(() => setResendTimer(v => v - 1), 1000);
    return () => clearTimeout(id);
  }, [resendTimer]);

  useEffect(() => {
    if (!showPicker) return;
    const id = setTimeout(() => {
      searchRef.current?.focus();
      activeRef.current?.scrollIntoView({ block: "center" });
    }, 60);
    return () => clearTimeout(id);
  }, [showPicker]);

  useEffect(() => {
    if (!showPicker) return;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, [showPicker]);

  useEffect(() => {
    if (step !== "otp") return;
    const id = setTimeout(() => otpRefs.current[0]?.focus(), 80);
    return () => clearTimeout(id);
  }, [step]);

  // Auto-submit when all 6 digits are filled
  useEffect(() => {
    if (step !== "otp" || !otpDigits.every(d => d !== "")) return;
    const id = setTimeout(() => {
      if (otpDigits.join("") === "123456") {
        onBack();
      } else {
        setOtpError("Неверный код. Попробуйте ещё раз");
        setOtpDigits(Array(6).fill(""));
        setTimeout(() => otpRefs.current[0]?.focus(), 30);
      }
    }, 80);
    return () => clearTimeout(id);
  }, [otpDigits, step, onBack]);

  const filteredCountries = search
    ? COUNTRIES.filter(cnt =>
        cnt.name.toLowerCase().includes(search.toLowerCase()) ||
        cnt.dial.includes(search) ||
        cnt.code.toLowerCase().includes(search.toLowerCase())
      )
    : COUNTRIES;

  const phoneValid  = phone.replace(/\D/g, "").length >= 6;
  const otpComplete = otpDigits.every(d => d !== "");

  const submitPhone = (e: FormEvent) => {
    e.preventDefault();
    if (!phoneValid) return;
    setOtpDigits(Array(6).fill(""));
    setStep("otp");
    setResendTimer(60);
  };

  const submitOtp = (e: FormEvent) => {
    e.preventDefault();
    if (!otpComplete) return;
    if (otpDigits.join("") === "123456") {
      onBack();
    } else {
      setOtpError("Неверный код. Попробуйте ещё раз");
      setOtpDigits(Array(6).fill(""));
      setTimeout(() => otpRefs.current[0]?.focus(), 30);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    setOtpError(null);
    if (value.length > 1) {
      const digits = value.replace(/\D/g, "").slice(0, 6 - index);
      const next = [...otpDigits];
      for (let i = 0; i < digits.length; i++) next[index + i] = digits[i];
      setOtpDigits(next);
      otpRefs.current[Math.min(index + digits.length - 1, 5)]?.focus();
      return;
    }
    const digit = value.replace(/\D/g, "");
    const next = [...otpDigits]; next[index] = digit; setOtpDigits(next);
    if (digit && index < 5) otpRefs.current[index + 1]?.focus();
  };

  const openPicker = () => {
    setShowPicker(true);
    // Two RAFs: first renders the element, second starts the CSS transition
    requestAnimationFrame(() => requestAnimationFrame(() => setPickerAnim(true)));
  };

  const closePicker = () => {
    setPickerAnim(false);
    setTimeout(() => { setShowPicker(false); setSearch(""); }, 290);
  };

  const primaryBtn: CSSProperties = {
    width: "100%", height: "56px",
    display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "8px",
    border: "none", borderRadius: "14px",
    background: "linear-gradient(135deg, #a855f7 0%, #ec4899 100%)",
    color: "#fff", fontFamily: "inherit", fontSize: "1rem", fontWeight: 650,
    boxShadow: "0 6px 24px rgba(168,85,247,0.26)",
    transition: "opacity 0.15s",
  };

  return (
    <div style={{ minHeight: "100dvh", position: "relative", background: c.bg, color: c.text, fontFamily: "'DM Sans', sans-serif", display: "flex", flexDirection: "column" }}>

      <div style={{ position: "absolute", inset: 0, zIndex: 0, pointerEvents: "none", background: "radial-gradient(ellipse at 50% -5%, rgba(168,85,247,0.13), transparent 58%)" }} />

      {/* Back button lives outside <main> so it doesn't interfere with vertical centering */}
      {step === "otp" && (
        <div style={{ position: "relative", zIndex: 2, padding: "22px 24px 0", flexShrink: 0 }}>
          <button
            type="button"
            onClick={() => { setStep("phone"); setOtpDigits(Array(6).fill("")); setOtpError(null); }}
            style={{ display: "inline-flex", alignItems: "center", gap: "6px", border: "none", background: "transparent", color: c.sub, cursor: "pointer", fontFamily: "inherit", fontSize: "0.875rem", fontWeight: 500, padding: 0 }}
          >
            <ArrowLeft size={15} /> Изменить номер
          </button>
        </div>
      )}

      <main style={{ position: "relative", zIndex: 1, flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "32px 24px" }}>
        <div style={{ width: "min(400px, 100%)" }}>

          {/* ══════════ STEP 1 · PHONE ══════════ */}
          {step === "phone" && (
            <>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "12px", marginBottom: "36px" }}>
                <svg width="44" height="44" viewBox="0 0 26 26" fill="none" style={{ flexShrink: 0 }}>
                  <rect x="2" y="2" width="10" height="6" rx="2" fill="url(#as1)" />
                  <rect x="14" y="2" width="10" height="6" rx="2" fill="url(#as2)" opacity="0.5" />
                  <rect x="2" y="10" width="6" height="6" rx="2" fill="url(#as2)" opacity="0.7" />
                  <rect x="10" y="10" width="14" height="6" rx="2" fill="url(#as1)" />
                  <rect x="2" y="18" width="14" height="6" rx="2" fill="url(#as2)" opacity="0.6" />
                  <rect x="18" y="18" width="6" height="6" rx="2" fill="url(#as1)" opacity="0.4" />
                  <defs>
                    <linearGradient id="as1" x1="2" y1="2" x2="24" y2="24" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#c084fc" /><stop offset="1" stopColor="#a855f7" />
                    </linearGradient>
                    <linearGradient id="as2" x1="2" y1="2" x2="24" y2="24" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#e879f9" /><stop offset="1" stopColor="#ec4899" />
                    </linearGradient>
                  </defs>
                </svg>
                <span style={{ fontSize: "1.65rem", fontWeight: 600, letterSpacing: "-0.5px", color: c.text }}>Shifty</span>
              </div>

              <h1 style={{ margin: "0 0 8px", fontSize: "1.8rem", fontWeight: 700, letterSpacing: "-0.5px" }}>Вход в Shifty</h1>
              <p style={{ margin: "0 0 32px", color: c.sub, fontSize: "0.9rem", lineHeight: 1.55 }}>Введите номер телефона, чтобы продолжить</p>

              <form onSubmit={submitPhone} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 650, marginBottom: "9px", color: c.sub }}>Номер телефона</label>
                  <div style={{
                    display: "flex", height: "54px", borderRadius: "14px",
                    border: `1.5px solid ${focused === "phone" ? c.fieldFocus : c.border}`,
                    background: c.field, overflow: "hidden",
                    boxShadow: focused === "phone" ? "0 0 0 3px rgba(168,85,247,0.09)" : "none",
                    transition: "border-color 0.15s, box-shadow 0.15s",
                  }}>

                    {/* Country trigger — code badge + dial, no emoji (Windows-safe) */}
                    <button
                      type="button"
                      onClick={() => openPicker()}
                      onFocus={() => setFocused("phone")}
                      onBlur={() => setFocused(null)}
                      style={{
                        display: "flex", alignItems: "center", gap: "6px",
                        padding: "0 12px 0 14px",
                        border: "none", borderRight: `1px solid ${c.border}`,
                        background: "transparent", color: c.text,
                        cursor: "pointer", fontFamily: "inherit",
                        flexShrink: 0, whiteSpace: "nowrap",
                      }}
                    >
                      {/* Country code chip */}
                      <span style={{
                        display: "inline-flex", alignItems: "center",
                        padding: "2px 5px", borderRadius: "4px",
                        background: c.codeBg, color: c.icon,
                        fontSize: "0.62rem", fontWeight: 800, letterSpacing: "0.06em", lineHeight: 1.4,
                      }}>
                        {country.code}
                      </span>
                      {/* Dial code */}
                      <span style={{ fontSize: "0.92rem", fontWeight: 700 }}>{country.dial}</span>
                      <ChevronDown size={12} style={{ color: c.sub }} />
                    </button>

                    {/* Phone number input — no zero-format placeholder, clean hint text */}
                    <input
                      type="tel"
                      autoComplete="tel-national"
                      placeholder="Введите номер"
                      value={phone}
                      onChange={e => setPhone(e.target.value.replace(/[^\d\s\-()]/g, ""))}
                      onFocus={() => setFocused("phone")}
                      onBlur={() => setFocused(null)}
                      style={{
                        flex: 1, height: "100%", padding: "0 14px",
                        border: "none", background: "transparent", color: c.text,
                        outline: "none", fontFamily: "'DM Sans', sans-serif",
                        fontSize: "1rem", fontWeight: 500,
                      }}
                    />
                  </div>
                </div>

                <button
                  type="submit" disabled={!phoneValid}
                  style={{ ...primaryBtn, opacity: phoneValid ? 1 : 0.42, cursor: phoneValid ? "pointer" : "default" }}
                >
                  Продолжить <ArrowRight size={16} />
                </button>
              </form>
            </>
          )}

          {/* ══════════ STEP 2 · OTP ══════════ */}
          {step === "otp" && (
            <>
              <h1 style={{ margin: "0 0 8px", fontSize: "1.8rem", fontWeight: 700, letterSpacing: "-0.5px" }}>Введите код</h1>
              <p style={{ margin: "0 0 32px", color: c.sub, fontSize: "0.9rem", lineHeight: 1.55 }}>
                Мы отправили код на{" "}
                <span style={{ color: c.text, fontWeight: 600 }}>{country.dial} {phone}</span>
              </p>

              <form onSubmit={submitOtp} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <div style={{ display: "flex", gap: "8px" }}>
                  {otpDigits.map((digit, index) => (
                    <input
                      key={index}
                      ref={el => { otpRefs.current[index] = el; }}
                      type="text" inputMode="numeric" maxLength={6}
                      value={digit}
                      onChange={e => handleOtpChange(index, e.target.value)}
                      onKeyDown={e => {
                        if (e.key === "Backspace") {
                          e.preventDefault();
                          if (otpDigits[index]) {
                            const n = [...otpDigits]; n[index] = ""; setOtpDigits(n);
                          } else if (index > 0) {
                            const n = [...otpDigits]; n[index - 1] = ""; setOtpDigits(n);
                            otpRefs.current[index - 1]?.focus();
                          }
                        } else if (e.key === "ArrowLeft"  && index > 0) { otpRefs.current[index - 1]?.focus(); }
                          else if (e.key === "ArrowRight" && index < 5) { otpRefs.current[index + 1]?.focus(); }
                      }}
                      onFocus={() => setFocused(`otp-${index}`)}
                      onBlur={() => setFocused(null)}
                      style={{
                        flex: 1, minWidth: 0, width: 0, height: "58px", borderRadius: "13px",
                        border: `1.5px solid ${focused === `otp-${index}` ? c.fieldFocus : digit ? c.otpBorder : c.border}`,
                        background: digit ? c.otpFilled : c.field,
                        color: c.text, outline: "none", textAlign: "center",
                        fontFamily: "'DM Sans', sans-serif", fontSize: "1.4rem", fontWeight: 700,
                        caretColor: "transparent",
                        boxShadow: focused === `otp-${index}` ? "0 0 0 3px rgba(168,85,247,0.09)" : "none",
                        transition: "border-color 0.12s, background 0.12s, box-shadow 0.12s",
                      }}
                    />
                  ))}
                </div>
                  {otpError && (
                    <p style={{ margin: 0, color: "#f43f5e", fontSize: "0.83rem", fontWeight: 500, textAlign: "center" }}>
                      {otpError}
                    </p>
                  )}
                </div>

                <button
                  type="submit" disabled={!otpComplete}
                  style={{ ...primaryBtn, opacity: otpComplete ? 1 : 0.42, cursor: otpComplete ? "pointer" : "default" }}
                >
                  Войти <ArrowRight size={16} />
                </button>

                <div style={{ textAlign: "center" }}>
                  {resendTimer > 0 ? (
                    <span style={{ color: c.sub, fontSize: "0.85rem" }}>
                      Отправить ещё раз через {resendTimer} с
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setResendTimer(60)}
                      style={{ border: "none", background: "transparent", color: c.icon, cursor: "pointer", fontFamily: "inherit", fontSize: "0.875rem", fontWeight: 600, padding: 0, display: "inline-flex", alignItems: "center", gap: "6px" }}
                    >
                      <RotateCcw size={13} /> Отправить код ещё раз
                    </button>
                  )}
                </div>
              </form>
            </>
          )}

        </div>
      </main>

      {/* ══════════ COUNTRY PICKER ══════════ */}
      {showPicker && (
        <div
          style={{
            position: "fixed", inset: 0, zIndex: 50,
            display: "flex", alignItems: "center", justifyContent: "center",
            background: dark ? "rgba(7,7,11,0.72)" : "rgba(249,247,255,0.72)",
            backdropFilter: "blur(10px)",
            opacity: pickerAnim ? 1 : 0,
            transition: "opacity 0.2s ease",
          }}
          onClick={closePicker}
        >
          <div
            style={{
              width: "min(340px, 90vw)",
              height: "min(300px, 52vh)",
              display: "flex", flexDirection: "column",
              borderRadius: "16px",
              background: c.sheet,
              border: `1px solid ${c.border}`,
              boxShadow: dark ? "0 8px 80px rgba(0,0,0,0.60)" : "0 4px 60px rgba(48,32,80,0.14)",
              overflow: "hidden",
              transform: pickerAnim ? "scale(1) translateY(0)" : "scale(0.95) translateY(-10px)",
              opacity: pickerAnim ? 1 : 0,
              transition: "transform 0.2s cubic-bezier(0.34, 1.2, 0.64, 1), opacity 0.15s ease",
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Search */}
            <div style={{ flexShrink: 0, padding: "6px 16px 10px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "0 13px", height: "42px", borderRadius: "11px", border: `1px solid ${c.border}`, background: c.field }}>
                <Search size={14} style={{ color: c.sub, flexShrink: 0 }} />
                <input
                  ref={searchRef}
                  type="text" placeholder="Поиск страны..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  style={{ flex: 1, border: "none", background: "transparent", color: c.text, outline: "none", fontFamily: "'DM Sans', sans-serif", fontSize: "0.9rem" }}
                />
              </div>
            </div>

            {/* Scrollable list — minHeight:0 is required for flex children to scroll */}
            <div style={{ overflowY: "auto", flex: 1, minHeight: 0 }}>
              {filteredCountries.map(cnt => {
                const active = cnt.code === country.code;
                return (
                  <button
                    key={cnt.code}
                    ref={active ? activeRef : undefined}
                    type="button"
                    onClick={() => { setCountry(cnt); closePicker(); }}
                    style={{
                      width: "100%", display: "flex", alignItems: "center", gap: "12px",
                      padding: "11px 18px", border: "none",
                      background: active ? (dark ? "rgba(168,85,247,0.10)" : "rgba(168,85,247,0.07)") : "transparent",
                      color: c.text, cursor: "pointer", fontFamily: "inherit", textAlign: "left",
                    }}
                  >
                    {/* Country code chip in list */}
                    <span style={{
                      display: "inline-flex", alignItems: "center", justifyContent: "center",
                      width: "32px", padding: "2px 0", borderRadius: "4px",
                      background: active ? c.codeBg : (dark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)"),
                      color: active ? c.icon : c.sub,
                      fontSize: "0.6rem", fontWeight: 800, letterSpacing: "0.06em", lineHeight: 1.4,
                      flexShrink: 0,
                    }}>
                      {cnt.code}
                    </span>
                    <span style={{ flex: 1, fontSize: "0.92rem", fontWeight: active ? 650 : 450 }}>{cnt.name}</span>
                    <span style={{ fontSize: "0.87rem", color: active ? c.icon : c.sub, fontWeight: 600, flexShrink: 0 }}>{cnt.dial}</span>
                    {active && <Check size={14} style={{ color: c.icon, flexShrink: 0 }} />}
                  </button>
                );
              })}
              {filteredCountries.length === 0 && (
                <p style={{ margin: 0, padding: "32px 18px", textAlign: "center", color: c.sub, fontSize: "0.9rem" }}>Ничего не найдено</p>
              )}
              {/* Safe area bottom padding */}
              <div style={{ height: "max(env(safe-area-inset-bottom), 8px)" }} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
