import { useState, useRef } from "react";

const MAX_ATTEMPTS = 5;

export default function LoginPageDark() {
  const [username, setUsername]   = useState("");
  const [password, setPassword]   = useState("");
  const [showPwd, setShowPwd]     = useState(false);
  const [remember, setRemember]   = useState(false);
  const [loading, setLoading]     = useState(false);
  const [errorMsg, setErrorMsg]   = useState<string | null>(null);
  const [failCount, setFailCount] = useState(0);
  const [locked, setLocked]       = useState(false);
  const [lang, setLang]           = useState<"EN" | "VI">("VI");
  const pwdRef = useRef<HTMLDivElement>(null);

  const shake = () => {
    const el = pwdRef.current;
    if (!el) return;
    el.style.animation = "none";
    void el.offsetHeight;
    el.style.animation = "shake 0.4s ease";
    setTimeout(() => { if (el) el.style.animation = ""; }, 400);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (locked) return;
    setErrorMsg(null);

    if (!username.trim()) { setErrorMsg(lang === "VI" ? "Vui lòng nhập tên đăng nhập." : "Please enter your username."); return; }
    if (!password)         { setErrorMsg(lang === "VI" ? "Vui lòng nhập mật khẩu."     : "Please enter your password.");  return; }

    setLoading(true);
    await new Promise((r) => setTimeout(r, 900));
    // TODO Sprint 2: const res = await axios.post("/api/auth/login", { username, password });
    const ok = username === "admin" && password === "admin";
    setLoading(false);

    if (ok) {
      setFailCount(0);
      alert("✅ Đăng nhập thành công!\n(Chuyển Dashboard — Sprint 2)");
    } else {
      const next = failCount + 1;
      setFailCount(next);
      shake();
      if (next >= MAX_ATTEMPTS) {
        setLocked(true);
      } else {
        const remain = MAX_ATTEMPTS - next;
        setErrorMsg(
          lang === "VI"
            ? `Thông tin đăng nhập không chính xác. Còn ${remain} lần thử.`
            : `Invalid credentials. ${remain} attempt(s) remaining.`
        );
      }
    }
  };

  /* ── colour tokens (from Stitch dark theme) ── */
  const c = {
    surface:          "#10141a",
    surfaceLow:       "#181c22",
    surfaceContainer: "#1c2026",
    surfaceHigh:      "#262a31",
    surfaceHighest:   "#31353c",
    onSurface:        "#dfe2eb",
    onSurfaceVar:     "#ccc3d2",
    outline:          "#958e9b",
    outlineVar:       "#4a4550",
    primary:          "#E94560",
    primaryContainer: "#510d1a",
    error:            "#ffb4ab",
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;600;700&family=Inter:wght@400;500;600&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@400,1&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html, body, #root { width: 100%; height: 100%; }

        .fn-headline { font-family: 'Space Grotesk', sans-serif; }
        .fn-body     { font-family: 'Inter', sans-serif; }
        .msymbol {
          font-family: 'Material Symbols Outlined';
          font-variation-settings: 'FILL' 0, 'wght' 400;
          vertical-align: middle; line-height: 1; display: inline-block;
          user-select: none;
        }
        /* Mesh gradient — right panel background */
        .mesh-bg {
          background-color: #0a0e14;
          background-image:
            radial-gradient(at 0%   0%,   hsla(348,78%,12%,1) 0, transparent 50%),
            radial-gradient(at 50%  0%,   hsla(348,78%,8%,1)  0, transparent 50%),
            radial-gradient(at 100% 0%,   hsla(348,78%,12%,1) 0, transparent 50%),
            radial-gradient(at 50%  100%, hsla(348,78%,10%,1) 0, transparent 50%);
        }
        /* Gradient button */
        .btn-gradient {
          background: linear-gradient(135deg, #E94560 0%, #510d1a 100%);
        }
        /* Shake */
        @keyframes shake {
          0%,100%{ transform:translateX(0);  }
          20%    { transform:translateX(-8px);}
          40%    { transform:translateX(8px); }
          60%    { transform:translateX(-5px);}
          80%    { transform:translateX(5px); }
        }
        /* Spinner */
        @keyframes spin { to { transform: rotate(360deg); } }
        /* Pulse dot */
        @keyframes pulse-dot {
          0%,100%{ opacity:1; }
          50%    { opacity:0.35; }
        }
        .pulse-dot { animation: pulse-dot 2s ease-in-out infinite; }

        /* Feature card hover */
        .feat-card { transition: border-color 0.25s; }
        .feat-card:hover { border-color: rgba(233,69,96,0.25) !important; }

        input:focus { outline: none; }
        a { text-decoration: none; }
      `}</style>

      <main className="fn-body" style={{
        minHeight: "100vh", width: "100%",
        display: "flex", overflow: "hidden",
        backgroundColor: c.surface, color: c.onSurface,
      }}>

        {/* ═══════════════════════════════════════════════════
            LEFT PANEL — Brand + Features (40%)
        ═══════════════════════════════════════════════════ */}
        <section style={{
          width: "40%", backgroundColor: c.surfaceLow,
          display: "flex", flexDirection: "column",
          padding: "48px", position: "relative", overflow: "hidden",
          borderRight: `1px solid rgba(74,69,80,0.1)`,
        }}>
          {/* Ambient glow */}
          <div style={{
            position: "absolute", top: "-10%", left: "-10%",
            width: "100%", height: "100%", borderRadius: "50%",
            background: "rgba(233,69,96,0.08)", filter: "blur(120px)",
            pointerEvents: "none", opacity: 0.8,
          }} />

          {/* ── NEXORA Brand ── */}
          <div style={{ position: "relative", zIndex: 10 }}>
            {/* Logo image — căn giữa */}
            <img
              src="/logo.png"
              alt="NEXORA Logo"
              style={{ width: "200px", objectFit: "contain", display: "block", margin: "0 auto" }}
            />
          </div>

          {/* ── Feature cards (middle — pushed by flex) ── */}
          <div style={{ position: "relative", zIndex: 10, marginTop: "auto", marginBottom: "auto" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {[
                {
                  icon: "sports_esports",
                  title: lang === "VI" ? "Hỗ trợ đa thể loại" : "Multi-game support",
                  desc:  lang === "VI"
                    ? "Quản lý tập trung cho FPS, MOBA và Battle Royale."
                    : "Centralized management for FPS, MOBA, and Battle Royale titles.",
                },
                {
                  icon: "account_tree",
                  title: lang === "VI" ? "Bracket thời gian thực" : "Real-time bracket",
                  desc:  lang === "VI"
                    ? "Cập nhật tự động tiến trình trận đấu và seeding."
                    : "Live updates with automated match progression and seeding.",
                },
                {
                  icon: "devices",
                  title: lang === "VI" ? "Đa nền tảng" : "Cross-platform",
                  desc:  lang === "VI"
                    ? "Chạy mọi nơi qua Tauri v2 — Windows, macOS, Linux."
                    : "Seamless sync across Windows, macOS, and Linux via Tauri v2.",
                },
              ].map((f) => (
                <div key={f.icon} className="feat-card" style={{
                  display: "flex", alignItems: "flex-start", gap: "16px",
                  padding: "16px", borderRadius: "12px",
                  background: "rgba(38,42,49,0.5)",
                  backdropFilter: "blur(8px)",
                  border: "1px solid rgba(74,69,80,0.08)",
                }}>
                  <span className="msymbol" style={{
                    color: c.primary, fontSize: "22px", marginTop: "2px", flexShrink: 0,
                  }}>{f.icon}</span>
                  <div>
                    <h3 className="fn-headline" style={{
                      fontWeight: 600, fontSize: "0.9rem", color: c.onSurface,
                    }}>{f.title}</h3>
                    <p style={{ fontSize: "0.8rem", color: c.onSurfaceVar, marginTop: "4px", lineHeight: 1.5 }}>
                      {f.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>


        </section>

        {/* ═══════════════════════════════════════════════════
            RIGHT PANEL — Login Form (60%)
        ═══════════════════════════════════════════════════ */}
        <section className="mesh-bg" style={{
          width: "60%",
          display: "flex", flexDirection: "column",
          position: "relative",
        }}>
          {/* Top bar: Language + Theme */}
          <nav style={{
            display: "flex", justifyContent: "flex-end",
            alignItems: "center", gap: "12px",
            padding: "24px 32px", height: "72px",
          }}>
            {/* Lang pill */}
            <div style={{
              display: "flex", padding: "4px",
              background: c.surfaceContainer, borderRadius: "9999px",
              border: `1px solid rgba(74,69,80,0.1)`,
            }}>
              {(["EN", "VI"] as const).map((l) => (
                <button key={l} onClick={() => setLang(l)} style={{
                  padding: "4px 12px", fontSize: "11px", fontWeight: 700,
                  borderRadius: "9999px", border: "none", cursor: "pointer",
                  background: lang === l ? c.primary : "transparent",
                  color: lang === l ? "#fff" : c.onSurfaceVar,
                  transition: "all 0.2s",
                }} className="fn-body">{l}</button>
              ))}
            </div>
            {/* Theme toggle */}
            <button style={{
              width: "40px", height: "40px", borderRadius: "50%",
              background: c.surfaceContainer, border: `1px solid rgba(74,69,80,0.1)`,
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", color: c.onSurfaceVar, transition: "color 0.2s",
            }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = c.primary)}
            onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = c.onSurfaceVar)}
            title={lang === "VI" ? "Chuyển chế độ sáng" : "Switch to light mode"}>
              <span className="msymbol" style={{ fontSize: "20px" }}>light_mode</span>
            </button>
          </nav>

          {/* Center — login card */}
          <div style={{
            flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
            padding: "24px",
          }}>
            <div style={{
              width: "100%", maxWidth: "420px",
              background: "rgba(28,32,38,0.5)",
              backdropFilter: "blur(24px)",
              borderRadius: "20px",
              border: "1px solid rgba(74,69,80,0.12)",
              boxShadow: "0 25px 60px rgba(0,0,0,0.5), 0 0 40px rgba(233,69,96,0.03)",
              padding: "40px",
              position: "relative",
            }}>

              {/* ── LOCKED overlay (SRS UC-1.1) ── */}
              {locked && (
                <div style={{
                  position: "absolute", inset: 0, borderRadius: "20px",
                  background: "rgba(10,14,20,0.93)",
                  backdropFilter: "blur(12px)",
                  display: "flex", flexDirection: "column",
                  alignItems: "center", justifyContent: "center",
                  gap: "14px", zIndex: 20, padding: "40px", textAlign: "center",
                }}>
                  <span className="msymbol" style={{
                    fontSize: "52px", color: c.primary,
                    fontVariationSettings: "'FILL' 1",
                  }}>lock</span>
                  <h3 className="fn-headline" style={{ fontSize: "1.25rem", fontWeight: 700, color: c.onSurface }}>
                    {lang === "VI" ? "Tài Khoản Tạm Khóa" : "Account Locked"}
                  </h3>
                  <p style={{ fontSize: "0.85rem", color: c.onSurfaceVar, lineHeight: 1.6 }}>
                    {lang === "VI"
                      ? `Đăng nhập sai ${MAX_ATTEMPTS} lần liên tiếp.\nVui lòng liên hệ Admin để được mở khóa.`
                      : `Too many failed attempts.\nPlease contact Admin to unlock.`}
                  </p>
                </div>
              )}

              {/* Card header */}
              <header style={{ marginBottom: "36px" }}>
                <h2 className="fn-headline" style={{
                  fontSize: "1.75rem", fontWeight: 700,
                  color: c.onSurface, letterSpacing: "-0.02em", marginBottom: "8px",
                }}>
                  {lang === "VI" ? "Đăng nhập hệ thống" : "Sign in to your account"}
                </h2>
                <p className="fn-body" style={{ color: c.onSurfaceVar, fontSize: "0.9rem" }}>
                  {lang === "VI"
                    ? "Đăng nhập hệ thống quản lý giải đấu"
                    : "Log in to manage your competitive ecosystem"}
                </p>
              </header>

              {/* ── FORM ── */}
              <form onSubmit={handleSubmit} noValidate style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

                {/* Username */}
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  <label style={{
                    fontSize: "11px", fontWeight: 700, textTransform: "uppercase",
                    letterSpacing: "0.12em", color: c.onSurfaceVar, paddingLeft: "4px",
                  }} className="fn-body">
                    {lang === "VI" ? "Tên đăng nhập" : "Username"}
                  </label>
                  <div style={{ position: "relative" }}>
                    <div style={{
                      position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)",
                      color: c.outline, pointerEvents: "none", transition: "color 0.2s",
                    }}>
                      <span className="msymbol" style={{ fontSize: "20px" }}>person</span>
                    </div>
                    <input
                      type="text" value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") document.getElementById("dark-pwd")?.focus(); }}
                      placeholder={lang === "VI" ? "vd. administrator_01" : "e.g. administrator_01"}
                      disabled={locked}
                      className="fn-body"
                      style={{
                        width: "100%",
                        background: "#0a0e14",
                        border: `1px solid rgba(74,69,80,0.25)`,
                        borderRadius: "12px",
                        padding: "14px 16px 14px 48px",
                        color: c.onSurface, fontSize: "0.9rem",
                        transition: "border-color 0.2s, box-shadow 0.2s",
                      }}
                      onFocus={(e) => { e.target.style.borderColor = c.primary; e.target.style.boxShadow = "0 0 0 3px rgba(233,69,96,0.18)"; }}
                      onBlur={(e)  => { e.target.style.borderColor = "rgba(74,69,80,0.25)"; e.target.style.boxShadow = "none"; }}
                    />
                  </div>
                </div>

                {/* Password */}
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0 4px" }}>
                    <label style={{
                      fontSize: "11px", fontWeight: 700, textTransform: "uppercase",
                      letterSpacing: "0.12em", color: c.onSurfaceVar,
                    }} className="fn-body">
                      {lang === "VI" ? "Mật khẩu" : "Password"}
                    </label>
                    <button type="button" className="fn-body"
                      onClick={() => alert(lang === "VI" ? "Liên hệ Admin để reset mật khẩu." : "Contact Admin to reset your password.")}
                      style={{
                        fontSize: "12px", fontWeight: 700, color: c.primary,
                        background: "none", border: "none", cursor: "pointer",
                        transition: "color 0.2s",
                      }}
                      onMouseEnter={(e) => ((e.target as HTMLElement).style.color = "#ffb2b7")}
                      onMouseLeave={(e) => ((e.target as HTMLElement).style.color = c.primary)}>
                      {lang === "VI" ? "Quên mật khẩu?" : "Forgot?"}
                    </button>
                  </div>

                  <div ref={pwdRef} style={{ position: "relative" }}>
                    <div style={{
                      position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)",
                      color: c.outline, pointerEvents: "none",
                    }}>
                      <span className="msymbol" style={{ fontSize: "20px" }}>lock</span>
                    </div>
                    <input
                      id="dark-pwd"
                      type={showPwd ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      disabled={locked}
                      className="fn-body"
                      style={{
                        width: "100%",
                        background: "#0a0e14",
                        border: `1px solid rgba(74,69,80,0.25)`,
                        borderRadius: "12px",
                        padding: "14px 48px 14px 48px",
                        color: c.onSurface, fontSize: "0.9rem",
                        transition: "border-color 0.2s, box-shadow 0.2s",
                      }}
                      onFocus={(e) => { e.target.style.borderColor = c.primary; e.target.style.boxShadow = "0 0 0 3px rgba(233,69,96,0.18)"; }}
                      onBlur={(e)  => { e.target.style.borderColor = "rgba(74,69,80,0.25)"; e.target.style.boxShadow = "none"; }}
                    />
                    <button type="button" onClick={() => setShowPwd(!showPwd)} style={{
                      position: "absolute", right: "14px", top: "50%", transform: "translateY(-50%)",
                      background: "none", border: "none", cursor: "pointer",
                      color: showPwd ? c.primary : c.outline,
                      display: "flex", alignItems: "center", transition: "color 0.2s",
                    }}>
                      <span className="msymbol" style={{ fontSize: "20px" }}>
                        {showPwd ? "visibility_off" : "visibility"}
                      </span>
                    </button>
                  </div>
                </div>

                {/* Error (SRS: không tiết lộ field nào sai) */}
                {errorMsg && (
                  <div className="fn-body" role="alert" style={{
                    padding: "12px 16px", borderRadius: "10px",
                    background: "rgba(233,69,96,0.1)", border: "1px solid rgba(233,69,96,0.2)",
                    color: "#ffb2b7", fontSize: "0.85rem",
                    display: "flex", alignItems: "center", gap: "8px",
                  }}>
                    <span className="msymbol" style={{ fontSize: "16px", color: c.primary, fontVariationSettings: "'FILL' 1", flexShrink: 0 }}>
                      warning
                    </span>
                    {errorMsg}
                  </div>
                )}

                {/* Remember me */}
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <input type="checkbox" id="dark-remember"
                    checked={remember} onChange={(e) => setRemember(e.target.checked)}
                    style={{ width: "18px", height: "18px", accentColor: c.primary, cursor: "pointer" }}
                  />
                  <label htmlFor="dark-remember" className="fn-body"
                    style={{ fontSize: "0.875rem", color: c.onSurfaceVar, cursor: "pointer" }}>
                    {lang === "VI" ? "Ghi nhớ thiết bị này" : "Remember this device"}
                  </label>
                </div>

                {/* Submit button */}
                <button type="submit" disabled={loading || locked}
                  className={`btn-gradient fn-headline`}
                  style={{
                    width: "100%", padding: "16px 24px",
                    color: "#fff", fontWeight: 700, fontSize: "1rem",
                    border: "none", borderRadius: "12px",
                    cursor: loading || locked ? "not-allowed" : "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: "10px",
                    boxShadow: "0 8px 24px rgba(233,69,96,0.2)",
                    opacity: loading || locked ? 0.55 : 1,
                    transition: "box-shadow 0.2s, transform 0.1s, opacity 0.2s",
                  }}
                  onMouseEnter={(e) => { if (!loading && !locked) { (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 12px 36px rgba(233,69,96,0.38)"; } }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 8px 24px rgba(233,69,96,0.2)"; }}
                  onMouseDown={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = "scale(0.98)"; }}
                  onMouseUp={(e)   => { (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)"; }}>
                  {loading ? (
                    <>
                      <svg style={{ width: "20px", height: "20px", animation: "spin 0.7s linear infinite", flexShrink: 0 }}
                        viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.3)" strokeWidth="3" />
                        <path d="M4 12a8 8 0 018-8" stroke="#fff" strokeWidth="3" strokeLinecap="round" />
                      </svg>
                      {lang === "VI" ? "Đang xác thực..." : "Authenticating..."}
                    </>
                  ) : (
                    <>
                      {lang === "VI" ? "Đăng nhập / Sign In" : "Sign In"}
                      <span className="msymbol" style={{ fontSize: "20px" }}>login</span>
                    </>
                  )}
                </button>
              </form>

              {/* Footer */}
              <footer style={{ marginTop: "28px", textAlign: "center" }}>
                <p className="fn-body" style={{ fontSize: "0.875rem", color: c.onSurfaceVar }}>
                  {lang === "VI" ? "Chưa có tài khoản? " : "New to NEXORA? "}
                  <a href="#" style={{ color: c.primary, fontWeight: 700 }}
                    onMouseEnter={(e) => ((e.target as HTMLAnchorElement).style.textDecoration = "underline")}
                    onMouseLeave={(e) => ((e.target as HTMLAnchorElement).style.textDecoration = "none")}>
                    {lang === "VI" ? "Yêu cầu truy cập" : "Request access"}
                  </a>
                </p>
              </footer>
            </div>
          </div>


        </section>
      </main>
    </>
  );
}
