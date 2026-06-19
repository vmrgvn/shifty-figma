import { FormEvent, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Eye, EyeOff, LockKeyhole, Mail, ShieldCheck } from "lucide-react";
import { LanguageCode } from "./NavMenu";

interface AuthPageProps {
  dark: boolean;
  language: LanguageCode;
  onBack: () => void;
}

const authCopy: Record<LanguageCode, {
  title: string;
  subtitle: string;
  email: string;
  password: string;
  passwordPlaceholder: string;
  remember: string;
  forgot: string;
  submit: string;
  divider: string;
  noAccount: string;
  create: string;
  back: string;
}> = {
  ru: { title: "Вход в Shifty", subtitle: "Вернитесь к расписаниям, командам и настройкам смен.", email: "Email", password: "Пароль", passwordPlaceholder: "Ваш пароль", remember: "Запомнить меня", forgot: "Забыли пароль?", submit: "Войти", divider: "или по email", noAccount: "Нет аккаунта?", create: "Создать", back: "Назад" },
  en: { title: "Sign in to Shifty", subtitle: "Return to schedules, teams, and shift settings.", email: "Email", password: "Password", passwordPlaceholder: "Your password", remember: "Remember me", forgot: "Forgot password?", submit: "Sign in", divider: "or use email", noAccount: "No account?", create: "Create one", back: "Back" },
  kk: { title: "Shifty жүйесіне кіру", subtitle: "Кестелерге, командаларға және ауысым баптауларына оралыңыз.", email: "Email", password: "Құпиясөз", passwordPlaceholder: "Құпиясөзіңіз", remember: "Мені есте сақтау", forgot: "Құпиясөзді ұмыттыңыз ба?", submit: "Кіру", divider: "немесе email арқылы", noAccount: "Аккаунт жоқ па?", create: "Құру", back: "Артқа" },
  de: { title: "Bei Shifty anmelden", subtitle: "Zurück zu Dienstplänen, Teams und Schichteinstellungen.", email: "Email", password: "Passwort", passwordPlaceholder: "Dein Passwort", remember: "Angemeldet bleiben", forgot: "Passwort vergessen?", submit: "Anmelden", divider: "oder per Email", noAccount: "Kein Konto?", create: "Erstellen", back: "Zurück" },
  fr: { title: "Connexion à Shifty", subtitle: "Retrouvez vos plannings, équipes et réglages de shifts.", email: "Email", password: "Mot de passe", passwordPlaceholder: "Votre mot de passe", remember: "Se souvenir de moi", forgot: "Mot de passe oublié ?", submit: "Se connecter", divider: "ou par email", noAccount: "Pas de compte ?", create: "Créer", back: "Retour" },
  es: { title: "Entrar en Shifty", subtitle: "Vuelve a horarios, equipos y ajustes de turnos.", email: "Email", password: "Contraseña", passwordPlaceholder: "Tu contraseña", remember: "Recordarme", forgot: "¿Olvidaste la contraseña?", submit: "Entrar", divider: "o con email", noAccount: "¿Sin cuenta?", create: "Crear", back: "Atrás" },
  it: { title: "Accedi a Shifty", subtitle: "Torna a calendari, team e impostazioni dei turni.", email: "Email", password: "Password", passwordPlaceholder: "La tua password", remember: "Ricordami", forgot: "Password dimenticata?", submit: "Accedi", divider: "oppure via email", noAccount: "Nessun account?", create: "Crea", back: "Indietro" },
  pt: { title: "Entrar no Shifty", subtitle: "Volte para escalas, equipes e configurações de turnos.", email: "Email", password: "Senha", passwordPlaceholder: "Sua senha", remember: "Lembrar de mim", forgot: "Esqueceu a senha?", submit: "Entrar", divider: "ou por email", noAccount: "Sem conta?", create: "Criar", back: "Voltar" },
  tr: { title: "Shifty'ye giriş", subtitle: "Planlara, ekiplere ve vardiya ayarlarına dönün.", email: "Email", password: "Şifre", passwordPlaceholder: "Şifreniz", remember: "Beni hatırla", forgot: "Şifrenizi mi unuttunuz?", submit: "Giriş yap", divider: "veya email ile", noAccount: "Hesabınız yok mu?", create: "Oluştur", back: "Geri" },
  zh: { title: "登录 Shifty", subtitle: "回到排班、团队和班次设置。", email: "Email", password: "密码", passwordPlaceholder: "你的密码", remember: "记住我", forgot: "忘记密码？", submit: "登录", divider: "或使用 email", noAccount: "没有账号？", create: "创建", back: "返回" },
  ja: { title: "Shifty にログイン", subtitle: "シフト表、チーム、シフト設定に戻ります。", email: "Email", password: "パスワード", passwordPlaceholder: "パスワード", remember: "ログイン状態を保持", forgot: "パスワードを忘れましたか？", submit: "ログイン", divider: "または email", noAccount: "アカウントがありませんか？", create: "作成", back: "戻る" },
};

const socialProviders = [
  { label: "Google", mark: "G" },
  { label: "Microsoft", mark: "M" },
  { label: "Apple", mark: "A" },
];

function palette(dark: boolean) {
  return {
    bg: dark ? "#08080c" : "#faf8ff",
    panel: dark ? "rgba(20,18,30,0.78)" : "rgba(255,255,255,0.78)",
    border: dark ? "rgba(168,85,247,0.14)" : "rgba(168,85,247,0.16)",
    text: dark ? "#f0ecff" : "#0f0a1e",
    sub: dark ? "#a8a3be" : "#756d8c",
    faint: dark ? "#6f6884" : "#b5abc8",
    field: dark ? "rgba(255,255,255,0.055)" : "rgba(15,10,30,0.045)",
    fieldFocus: dark ? "rgba(192,132,252,0.36)" : "rgba(168,85,247,0.30)",
    icon: dark ? "#c4b5fd" : "#7c3aed",
  };
}

export function AuthPage({ dark, language, onBack }: AuthPageProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [focused, setFocused] = useState<string | null>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const c = palette(dark);
  const t = authCopy[language] ?? authCopy.en;

  const submit = (event: FormEvent<HTMLFormElement>) => event.preventDefault();
  const inputStyle = (name: string) => ({
    width: "100%",
    height: "46px",
    padding: name === "password" ? "0 44px 0 42px" : "0 14px 0 42px",
    borderRadius: "12px",
    border: `1px solid ${focused === name ? c.fieldFocus : c.border}`,
    background: c.field,
    color: c.text,
    outline: "none",
    fontFamily: "'DM Sans', sans-serif",
    fontSize: "0.92rem",
    fontWeight: 500,
    boxSizing: "border-box" as const,
    boxShadow: focused === name ? "0 0 0 3px rgba(168,85,247,0.08)" : "none",
  });

  return (
    <div style={{ minHeight: "100dvh", background: c.bg, color: c.text, fontFamily: "'DM Sans', sans-serif", display: "flex", flexDirection: "column" }}>
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none", background: "radial-gradient(ellipse at 50% 0%, rgba(168,85,247,0.18), rgba(236,72,153,0.07) 42%, transparent 72%)" }} />
      <header style={{ position: "relative", zIndex: 1, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px clamp(20px, 5vw, 56px)" }}>
        <button onClick={onBack} style={{ display: "inline-flex", alignItems: "center", gap: "8px", border: "none", background: "transparent", color: c.sub, cursor: "pointer", fontFamily: "inherit", fontSize: "0.9rem" }}>
          <ArrowLeft size={16} /> {t.back}
        </button>
        <span style={{ color: c.text, fontSize: "1.05rem", fontWeight: 600 }}>Shifty</span>
      </header>
      <main style={{ position: "relative", zIndex: 1, flex: 1, display: "grid", placeItems: "center", padding: "24px 16px 48px" }}>
        <section style={{ width: "min(440px, 100%)", padding: "26px", borderRadius: "20px", border: `1px solid ${c.border}`, background: c.panel, backdropFilter: "blur(18px)", boxShadow: dark ? "0 30px 90px rgba(0,0,0,0.58)" : "0 28px 80px rgba(48,32,80,0.16)", boxSizing: "border-box" }}>
          <div style={{ width: "38px", height: "38px", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "12px", background: "linear-gradient(135deg, #a855f7 0%, #ec4899 100%)", color: "#fff", marginBottom: "14px" }}>
            <ShieldCheck size={18} />
          </div>
          <h1 style={{ margin: 0, fontSize: "1.65rem", lineHeight: 1.1, fontWeight: 650, letterSpacing: 0 }}>{t.title}</h1>
          <p style={{ margin: "8px 0 22px", color: c.sub, fontSize: "0.9rem", lineHeight: 1.55 }}>{t.subtitle}</p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: "8px" }}>
            {socialProviders.map(provider => (
              <button key={provider.label} type="button" style={{ minWidth: 0, height: "44px", borderRadius: "12px", border: `1px solid ${c.border}`, background: c.field, color: c.text, cursor: "pointer", fontFamily: "inherit", fontSize: "0.83rem", fontWeight: 650 }}>
                {provider.mark} <span>{provider.label}</span>
              </button>
            ))}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", margin: "22px 0 18px" }}>
            <span style={{ flex: 1, height: "1px", background: c.border }} />
            <span style={{ color: c.faint, fontSize: "0.74rem", fontWeight: 600 }}>{t.divider}</span>
            <span style={{ flex: 1, height: "1px", background: c.border }} />
          </div>
          <form onSubmit={submit}>
            <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 650, marginBottom: "7px" }}>{t.email}</label>
            <div style={{ position: "relative" }}>
              <Mail size={16} style={{ position: "absolute", left: "14px", top: "15px", color: focused === "email" ? c.icon : c.sub }} />
              <input ref={emailRef} type="email" autoComplete="email" placeholder="you@company.com" onFocus={() => setFocused("email")} onBlur={() => setFocused(null)} style={inputStyle("email")} />
            </div>
            <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 650, margin: "14px 0 7px" }}>{t.password}</label>
            <div style={{ position: "relative" }}>
              <LockKeyhole size={16} style={{ position: "absolute", left: "14px", top: "15px", color: focused === "password" ? c.icon : c.sub }} />
              <input type={showPassword ? "text" : "password"} autoComplete="current-password" placeholder={t.passwordPlaceholder} onFocus={() => setFocused("password")} onBlur={() => setFocused(null)} style={inputStyle("password")} />
              <button type="button" onClick={() => setShowPassword(v => !v)} style={{ position: "absolute", right: "10px", top: "9px", width: "28px", height: "28px", border: "none", background: "transparent", color: c.sub, cursor: "pointer" }}>
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px", marginTop: "14px" }}>
              <label style={{ display: "inline-flex", alignItems: "center", gap: "8px", color: c.sub, fontSize: "0.8rem", cursor: "pointer" }}>
                <input type="checkbox" style={{ accentColor: "#a855f7" }} /> {t.remember}
              </label>
              <button type="button" style={{ border: "none", background: "transparent", padding: 0, color: c.icon, cursor: "pointer", fontFamily: "inherit", fontSize: "0.8rem", fontWeight: 650 }}>{t.forgot}</button>
            </div>
            <button type="submit" style={{ width: "100%", height: "48px", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "8px", marginTop: "20px", border: "1px solid rgba(168,85,247,0.36)", borderRadius: "12px", background: "linear-gradient(135deg, #a855f7 0%, #ec4899 100%)", color: "#fff", cursor: "pointer", fontFamily: "inherit", fontSize: "0.94rem", fontWeight: 650 }}>
              {t.submit}<ArrowRight size={15} />
            </button>
          </form>
          <p style={{ margin: "18px 0 0", color: c.sub, textAlign: "center", fontSize: "0.82rem" }}>
            {t.noAccount} <button type="button" style={{ border: "none", background: "transparent", padding: 0, color: c.icon, cursor: "pointer", fontFamily: "inherit", fontSize: "0.82rem", fontWeight: 700 }}>{t.create}</button>
          </p>
        </section>
      </main>
    </div>
  );
}
