import { useState, useRef, useCallback } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────
type LoginPayload = { username: string; password: string };
type AuthResult = {
  success: boolean;
  role?: "Admin" | "Captain" | "Player" | "Guest";
  token?: string;
  message?: string;
};

// ─── SRS UC-1.1 constant ──────────────────────────────────────────────────────
const MAX_LOGIN_ATTEMPTS = 5;

// ─── Tailwind token helper (giữ nguyên màu từ Stitch) ────────────────────────
// primary: #E94560 | surface: #10141a | surface-container: #1c2026

// ─── Mock AuthBUS (thay bằng invoke Tauri / Axios khi có backend) ─────────────
async function authBusLogin(payload: LoginPayload): Promise<AuthResult> {
  await new Promise((r) => setTimeout(r, 900)); // simulate latency

  // TODO Sprint 2: thay bằng
  // const { invoke } = await import("@tauri-apps/api/tauri");
  // return invoke<AuthResult>("login", payload);
  //
  // Hoặc Axios:
  // const res = await axios.post("/api/auth/login", payload);
  // return res.data;

  if (payload.username === "admin" && payload.password === "admin") {
    return { success: true, role: "Admin", token: "mock-jwt-token" };
  }
  return { success: false, message: "Thông tin đăng nhập không chính xác." };
}

// ═════════════════════════════════════════════════════════════════════════════
export default function LoginPage() {
  // ─── Form state ───────────────────────────────────────────────────────────
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // ─── UI / feedback state ──────────────────────────────────────────────────
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [failCount, setFailCount] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [lang, setLang] = useState<"VI" | "EN">("VI");

  // ─── Shake animation ref ──────────────────────────────────────────────────
  const pwdWrapRef = useRef<HTMLDivElement>(null);

  const shakePassword = useCallback(() => {
    const el = pwdWrapRef.current;
    if (!el) return;
    el.classList.add("animate-shake");
    el.addEventListener("animationend", () => el.classList.remove("animate-shake"), { once: true });
  }, []);

  // ─── SRS UC-1.1: Xử lý đăng nhập ────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    // Validation trống
    if (!username.trim()) {
      setErrorMsg("Vui lòng nhập tên đăng nhập.");
      return;
    }
    if (!password) {
      setErrorMsg("Vui lòng nhập mật khẩu.");
      return;
    }

    setIsLoading(true);
    try {
      const result = await authBusLogin({ username: username.trim(), password });

      if (result.success) {
        // SRS UC-1.1 step 7: reset failCount, tạo session, chuyển Dashboard
        setFailCount(0);

        if (rememberMe) {
          localStorage.setItem("etms_saved_user", username.trim());
        }

        // TODO: Lưu JWT & chuyển hướng
        // useAuthStore.getState().login(result.token!, result.role!);
        // navigate("/dashboard");
        alert(`✅ Đăng nhập thành công! Role: ${result.role}\n(Chuyển Dashboard — tích hợp ở Sprint 2)`);

      } else {
        const newCount = failCount + 1;
        setFailCount(newCount);
        shakePassword();

        // SRS UC-1.1 step 6: khóa sau MAX_LOGIN_ATTEMPTS lần
        if (newCount >= MAX_LOGIN_ATTEMPTS) {
          setIsLocked(true);
          // TODO: gọi DAL UPDATE IsLocked=1 ở backend
          setErrorMsg(null);
        } else {
          const remain = MAX_LOGIN_ATTEMPTS - newCount;
          // SRS: KHÔNG tiết lộ field nào sai
          setErrorMsg(
            `${result.message ?? "Thông tin đăng nhập không chính xác."} Còn ${remain} lần thử.`
          );
        }
      }
    } catch {
      setErrorMsg("Lỗi kết nối. Vui lòng thử lại.");
    } finally {
      setIsLoading(false);
    }
  };

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className={isDarkMode ? "dark" : ""}>
      {/* ── GLOBAL STYLES (inline vì chưa có tailwind.config đơn vị dự án) ── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;600;700&family=Inter:wght@400;500;600&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@400,1&display=swap');

        .font-headline { font-family: 'Space Grotesk', sans-serif; }
        .font-body, .font-label { font-family: 'Inter', sans-serif; }
        .material-symbols-outlined {
          font-family: 'Material Symbols Outlined';
          font-variation-settings: 'FILL' 0, 'wght' 400;
          vertical-align: middle; line-height: 1;
        }
        .mesh-gradient-bg {
          background-color: #0a0e14;
          background-image:
            radial-gradient(at 0% 0%, hsla(348,78%,12%,1) 0, transparent 50%),
            radial-gradient(at 50% 0%, hsla(348,78%,8%,1) 0, transparent 50%),
            radial-gradient(at 100% 0%, hsla(348,78%,12%,1) 0, transparent 50%),
            radial-gradient(at 50% 100%, hsla(348,78%,10%,1) 0, transparent 50%);
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20%       { transform: translateX(-8px); }
          40%       { transform: translateX(8px); }
          60%       { transform: translateX(-5px); }
          80%       { transform: translateX(5px); }
        }
        .animate-shake { animation: shake 0.4s ease; }
      `}</style>

      <main className="min-h-screen flex flex-col md:flex-row overflow-hidden bg-[#0a0e14] text-[#dfe2eb]">

        {/* ══════════════════════════════════════════════════════════════════
            LEFT PANEL — Brand Identity (40%)
        ══════════════════════════════════════════════════════════════════ */}
        <section
          className="hidden md:flex md:w-[40%] bg-[#181c22] relative flex-col justify-between p-12 overflow-hidden"
          style={{ borderRight: "1px solid rgba(74,69,80,0.1)" }}
        >
          {/* Ambient glow */}
          <div className="absolute inset-0 opacity-20 pointer-events-none">
            <div
              className="absolute w-full h-full rounded-full"
              style={{
                top: "-10%", left: "-10%",
                background: "rgba(233,69,96,0.1)",
                filter: "blur(120px)",
              }}
            />
          </div>

          {/* Logo & Brand */}
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-2">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg"
                style={{
                  background: "linear-gradient(135deg, #E94560, #510d1a)",
                  boxShadow: "0 4px 20px rgba(233,69,96,0.2)",
                }}
              >
                <span className="material-symbols-outlined text-white text-3xl"
                  style={{ fontVariationSettings: "'FILL' 1" }}>
                  emoji_events
                </span>
              </div>
              <h1
                className="font-headline text-3xl font-bold tracking-tighter"
                style={{
                  background: "linear-gradient(90deg, #E94560, #ffb2b7)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                ETMS
              </h1>
            </div>
            <p className="font-headline text-lg font-medium leading-tight"
               style={{ color: "#ccc3d2" }}>
              Esports Tournament <br />Management System
            </p>
          </div>

          {/* Feature cards */}
          <div className="relative z-10 space-y-4">
            {[
              {
                icon: "sports_esports",
                title: "Hỗ trợ đa thể loại",
                desc: "Quản lý tập trung cho FPS, MOBA và Battle Royale.",
              },
              {
                icon: "account_tree",
                title: "Bracket thời gian thực",
                desc: "Cập nhật tự động tiến trình trận đấu và seeding.",
              },
              {
                icon: "devices",
                title: "Đa nền tảng",
                desc: "Chạy trên Windows / macOS / Linux qua Tauri v2.",
              },
            ].map((f) => (
              <div
                key={f.icon}
                className="flex items-start gap-4 p-4 rounded-xl"
                style={{
                  background: "rgba(38,42,49,0.5)",
                  backdropFilter: "blur(8px)",
                  border: "1px solid rgba(74,69,80,0.05)",
                }}
              >
                <span className="material-symbols-outlined mt-1" style={{ color: "#E94560" }}>
                  {f.icon}
                </span>
                <div>
                  <h3 className="font-headline font-semibold text-sm" style={{ color: "#dfe2eb" }}>
                    {f.title}
                  </h3>
                  <p className="text-xs mt-1" style={{ color: "#ccc3d2" }}>
                    {f.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Version footer */}
          <div className="relative z-10">
            <p className="text-xs font-label tracking-widest uppercase" style={{ color: "#958e9b", opacity: 0.5 }}>
              Version v4.0.0 Kinetic Command
            </p>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════════
            RIGHT PANEL — Login Form (60%)
        ══════════════════════════════════════════════════════════════════ */}
        <section className="flex-1 flex flex-col mesh-gradient-bg relative p-6 md:p-12">

          {/* Top Controls: Language + Theme */}
          <nav className="flex justify-end gap-3 items-center h-14">
            {/* Language switcher */}
            <div
              className="flex rounded-full p-1"
              style={{ background: "#1c2026", border: "1px solid rgba(74,69,80,0.1)" }}
            >
              {(["EN", "VI"] as const).map((l) => (
                <button
                  key={l}
                  onClick={() => setLang(l)}
                  className="px-3 py-1 text-xs font-bold font-label rounded-full transition-all"
                  style={{
                    background: lang === l ? "#E94560" : "transparent",
                    color: lang === l ? "#fff" : "#ccc3d2",
                  }}
                >
                  {l}
                </button>
              ))}
            </div>
            {/* Theme toggle */}
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="w-10 h-10 flex items-center justify-center rounded-full transition-colors"
              style={{
                background: "#1c2026",
                border: "1px solid rgba(74,69,80,0.1)",
                color: "#ccc3d2",
              }}
              title={isDarkMode ? "Chuyển sáng" : "Chuyển tối"}
            >
              <span className="material-symbols-outlined text-xl">
                {isDarkMode ? "light_mode" : "dark_mode"}
              </span>
            </button>
          </nav>

          {/* Login card */}
          <div className="flex-1 flex items-center justify-center">
            <div
              className="w-full max-w-[420px] p-8 md:p-10 rounded-2xl relative"
              style={{
                background: "rgba(28,32,38,0.4)",
                backdropFilter: "blur(24px)",
                border: "1px solid rgba(74,69,80,0.1)",
                boxShadow: "0 25px 50px rgba(0,0,0,0.4)",
              }}
            >
              {/* ── Locked overlay (SRS UC-1.1: khóa sau 5 lần) ─────────── */}
              {isLocked && (
                <div
                  className="absolute inset-0 rounded-2xl flex flex-col items-center justify-center gap-4 p-8 text-center z-10"
                  style={{ background: "rgba(10,14,20,0.92)", backdropFilter: "blur(8px)" }}
                >
                  <span className="material-symbols-outlined text-6xl" style={{ color: "#E94560", fontVariationSettings: "'FILL' 1" }}>
                    lock
                  </span>
                  <h3 className="font-headline text-xl font-bold" style={{ color: "#dfe2eb" }}>
                    Tài Khoản Tạm Khóa
                  </h3>
                  <p className="text-sm" style={{ color: "#ccc3d2" }}>
                    Bạn đã đăng nhập sai {MAX_LOGIN_ATTEMPTS} lần liên tiếp.
                    <br />Vui lòng liên hệ Admin để được mở khóa.
                  </p>
                </div>
              )}

              {/* Card header */}
              <header className="mb-8 text-center md:text-left">
                <h2 className="font-headline text-3xl font-bold tracking-tight mb-2" style={{ color: "#dfe2eb" }}>
                  {lang === "VI" ? "Đăng nhập hệ thống" : "Sign in to your account"}
                </h2>
                <p className="font-body text-sm" style={{ color: "#ccc3d2" }}>
                  {lang === "VI"
                    ? "Đăng nhập hệ thống quản lý giải đấu"
                    : "Log in to manage your tournament ecosystem"}
                </p>
              </header>

              {/* ── FORM ────────────────────────────────────────────────── */}
              <form onSubmit={handleSubmit} className="space-y-5" noValidate>

                {/* Username */}
                <div className="space-y-2">
                  <label className="text-xs font-bold font-label uppercase tracking-widest ml-1"
                         style={{ color: "#ccc3d2" }}>
                    {lang === "VI" ? "Tên đăng nhập" : "Username"}
                  </label>
                  <div className="group relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors"
                         style={{ color: username ? "#E94560" : "#958e9b" }}>
                      <span className="material-symbols-outlined text-xl">person</span>
                    </div>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") { (document.getElementById("pwd-input") as HTMLInputElement)?.focus(); } }}
                      placeholder={lang === "VI" ? "vd. administrator_01" : "e.g. administrator_01"}
                      maxLength={50}
                      disabled={isLocked}
                      className="w-full rounded-xl py-3.5 pl-11 pr-4 font-body text-sm transition-all outline-none"
                      style={{
                        background: "#0a0e14",
                        border: "1px solid rgba(74,69,80,0.2)",
                        color: "#dfe2eb",
                      }}
                      onFocus={(e) => { e.target.style.borderColor = "#E94560"; e.target.style.boxShadow = "0 0 0 2px rgba(233,69,96,0.2)"; }}
                      onBlur={(e)  => { e.target.style.borderColor = "rgba(74,69,80,0.2)"; e.target.style.boxShadow = "none"; }}
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="space-y-2">
                  <div className="flex justify-between items-end ml-1">
                    <label className="text-xs font-bold font-label uppercase tracking-widest"
                           style={{ color: "#ccc3d2" }}>
                      {lang === "VI" ? "Mật khẩu" : "Password"}
                    </label>
                    <button
                      type="button"
                      className="text-xs font-semibold transition-colors"
                      style={{ color: "#E94560" }}
                      onMouseEnter={(e) => ((e.target as HTMLElement).style.color = "#ffb2b7")}
                      onMouseLeave={(e) => ((e.target as HTMLElement).style.color = "#E94560")}
                      onClick={() => alert(lang === "VI"
                        ? "Vui lòng liên hệ Admin để được cấp lại mật khẩu."
                        : "Please contact Admin to reset your password.")}
                    >
                      {lang === "VI" ? "Quên mật khẩu?" : "Forgot?"}
                    </button>
                  </div>

                  <div className="group relative" ref={pwdWrapRef}>
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors"
                         style={{ color: password ? "#E94560" : "#958e9b" }}>
                      <span className="material-symbols-outlined text-xl">lock</span>
                    </div>
                    <input
                      id="pwd-input"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      maxLength={128}
                      disabled={isLocked}
                      className="w-full rounded-xl py-3.5 pl-11 pr-12 font-body text-sm transition-all outline-none"
                      style={{
                        background: "#0a0e14",
                        border: "1px solid rgba(74,69,80,0.2)",
                        color: "#dfe2eb",
                      }}
                      onFocus={(e) => { e.target.style.borderColor = "#E94560"; e.target.style.boxShadow = "0 0 0 2px rgba(233,69,96,0.2)"; }}
                      onBlur={(e)  => { e.target.style.borderColor = "rgba(74,69,80,0.2)"; e.target.style.boxShadow = "none"; }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center transition-colors"
                      style={{ color: showPassword ? "#E94560" : "#958e9b" }}
                      title={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                    >
                      <span className="material-symbols-outlined text-xl">
                        {showPassword ? "visibility_off" : "visibility"}
                      </span>
                    </button>
                  </div>
                </div>

                {/* Error message — SRS UC-1.1: không tiết lộ field nào sai */}
                {errorMsg && (
                  <div
                    className="flex items-center gap-2 p-3 rounded-xl text-sm font-body"
                    style={{ background: "rgba(233,69,96,0.1)", border: "1px solid rgba(233,69,96,0.2)", color: "#ffb2b7" }}
                    role="alert" aria-live="assertive"
                  >
                    <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1", color: "#E94560" }}>
                      warning
                    </span>
                    {errorMsg}
                  </div>
                )}

                {/* Remember me */}
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="remember"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-5 h-5 rounded"
                    style={{ accentColor: "#E94560" }}
                  />
                  <label htmlFor="remember" className="text-sm font-medium select-none cursor-pointer"
                         style={{ color: "#ccc3d2" }}>
                    {lang === "VI" ? "Ghi nhớ thiết bị này" : "Remember this device"}
                  </label>
                </div>

                {/* Login button */}
                <button
                  type="submit"
                  disabled={isLoading || isLocked}
                  className="w-full relative overflow-hidden font-headline font-bold py-4 rounded-xl transition-all"
                  style={{
                    background: isLoading || isLocked
                      ? "rgba(233,69,96,0.4)"
                      : "linear-gradient(90deg, #E94560, #510d1a)",
                    color: "#fff",
                    boxShadow: isLoading || isLocked ? "none" : "0 8px 24px rgba(233,69,96,0.2)",
                    cursor: isLoading || isLocked ? "not-allowed" : "pointer",
                  }}
                  onMouseEnter={(e) => {
                    if (!isLoading && !isLocked)
                      (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 8px 32px rgba(233,69,96,0.35)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 8px 24px rgba(233,69,96,0.2)";
                  }}
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="white" strokeWidth="4"/>
                        <path className="opacity-75" fill="white" d="M4 12a8 8 0 018-8v8H4z"/>
                      </svg>
                      {lang === "VI" ? "Đang xác thực..." : "Authenticating..."}
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      {lang === "VI" ? "Đăng nhập / Sign In" : "Sign In"}
                      <span className="material-symbols-outlined text-lg">login</span>
                    </span>
                  )}
                </button>
              </form>

              {/* Footer */}
              <footer className="mt-8 text-center">
                <p className="text-sm font-body" style={{ color: "#ccc3d2" }}>
                  {lang === "VI" ? "Chưa có tài khoản?" : "New to ETMS?"}{" "}
                  <a href="#" className="font-bold" style={{ color: "#E94560" }}
                     onMouseEnter={(e) => ((e.target as HTMLElement).style.textDecoration = "underline")}
                     onMouseLeave={(e) => ((e.target as HTMLElement).style.textDecoration = "none")}>
                    {lang === "VI" ? "Yêu cầu truy cập" : "Request access"}
                  </a>
                </p>
              </footer>
            </div>
          </div>

          {/* Mobile footer */}
          <div className="md:hidden mt-auto text-center py-4">
            <p className="text-xs font-label uppercase tracking-tighter" style={{ color: "#958e9b", opacity: 0.5 }}>
              Kinetic Command v4.0.0
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
