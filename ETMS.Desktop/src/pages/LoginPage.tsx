import { useState, useRef } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";
import { useLang } from "../contexts/LangContext";
import { getTokens, NEXORA_GLOBAL_CSS } from "../theme";

const MAX_ATTEMPTS = 5;

const MS = ({ icon, size = 20 }: { icon: string; size?: number }) => (
  <span style={{ fontSize: size, fontFamily: 'Material Symbols Outlined', fontVariationSettings: "'FILL' 0,'wght' 400", lineHeight: 1, userSelect: 'none', display: 'inline-block' }}>{icon}</span>
)

export default function LoginPage() {
  const { login } = useAuth();
  const { dark, toggle: toggleTheme } = useTheme();
  const { lang, toggle: toggleLang } = useLang();
  const c = getTokens(dark);
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd]   = useState(false);
  const [remember, setRemember] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [failCount, setFailCount] = useState(0);
  const [locked, setLocked]     = useState(false);
  const pwdRef = useRef<HTMLDivElement>(null);

  const shake = () => {
    const el = pwdRef.current;
    if (!el) return;
    el.style.animation = "none"; void el.offsetHeight;
    el.style.animation = "shake 0.4s ease";
    setTimeout(() => { if (el) el.style.animation = ""; }, 400);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (locked) return;
    setErrorMsg(null);
    if (!username.trim()) { setErrorMsg("Vui lòng nhập tên đăng nhập."); return; }
    if (!password)        { setErrorMsg("Vui lòng nhập mật khẩu."); return; }
    setLoading(true);
    const { ok, error: err } = await login(username.trim(), password);
    setLoading(false);
    if (ok) { setFailCount(0); navigate("/dashboard"); return; }
    const next = failCount + 1; setFailCount(next); shake();
    if (next >= MAX_ATTEMPTS) { setLocked(true); return; }
    setErrorMsg(err ?? `Sai thông tin. Còn ${MAX_ATTEMPTS - next} lần thử.`);
  };

  const features = [
    { icon: "sports_esports", label: "Đa thể loại", desc: "FPS · MOBA · Battle Royale · Fighting" },
    { icon: "account_tree",   label: "Bracket thời gian thực", desc: "Cập nhật tự động, không độ trễ" },
    { icon: "shield",         label: "Bảo mật cao", desc: "BCrypt + JWT · RBAC · Audit logs" },
  ];

  return (
    <>
      <style>{NEXORA_GLOBAL_CSS}</style>

      {/* Top-right controls: lang + theme */}
      <div style={{ position: 'fixed', top: 16, right: 20, display: 'flex', alignItems: 'center', gap: 8, zIndex: 200 }}>
        <button onClick={toggleLang}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', background: dark ? 'rgba(22,27,34,0.85)' : 'rgba(255,255,255,0.9)', border: `1px solid ${c.panelBorder}`, borderRadius: 9, cursor: 'pointer', backdropFilter: 'blur(8px)', color: c.onSurface, transition: 'all 0.15s', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}
          onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(233,69,96,0.5)')}
          onMouseLeave={e => (e.currentTarget.style.borderColor = c.panelBorder)}>
          <span style={{ fontFamily: "'JetBrains Mono',monospace", fontWeight: 700, fontSize: '0.75rem', color: '#E94560' }}>{lang.toUpperCase()}</span>
          <span style={{ fontSize: '0.78rem', color: c.onSurfaceVar }}>{lang === 'vi' ? 'Tiếng Việt' : 'English'}</span>
        </button>
        <button onClick={toggleTheme}
          style={{ width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', background: dark ? 'rgba(22,27,34,0.85)' : 'rgba(255,255,255,0.9)', border: `1px solid ${c.panelBorder}`, borderRadius: 9, cursor: 'pointer', backdropFilter: 'blur(8px)', color: c.onSurface, transition: 'all 0.15s', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}
          onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(233,69,96,0.5)')}
          onMouseLeave={e => (e.currentTarget.style.borderColor = c.panelBorder)}>
          <MS icon={dark ? 'light_mode' : 'dark_mode'} size={18} />
        </button>
      </div>

      <style>{`
        html,body,#root{width:100%;height:100%;overflow:hidden;}
        .login-orb{position:absolute;border-radius:50%;filter:blur(100px);pointer-events:none;animation:float 6s ease-in-out infinite;}
        .feat-item{transition:all 0.2s;border:1px solid rgba(124,58,237,0.15);}
        .feat-item:hover{border-color:rgba(124,58,237,0.4);background:rgba(124,58,237,0.1)!important;transform:translateX(4px);}
        .login-input:focus{outline:none;border-color:rgba(124,58,237,0.8)!important;box-shadow:0 0 0 3px rgba(124,58,237,0.2)!important;}
        input[type=checkbox]{accent-color:#7C3AED;}
      `}</style>

      <main style={{ minHeight: "100vh", width: "100%", display: "flex", overflow: "hidden", background: dark ? "#080A0F" : "#F1F3F8", color: c.onSurface }}>

        {/* LEFT PANEL */}
        <section className="hex-grid" style={{ width: "42%", background: c.surface, display: "flex", flexDirection: "column", padding: "48px 40px", position: "relative", overflow: "hidden", borderRight: `1px solid ${c.panelBorder}` }}>
          {/* Orbs */}
          <div className="login-orb" style={{ top: "-15%", left: "-20%", width: "60%", paddingBottom: "60%", background: "rgba(124,58,237,0.15)", animationDelay: "0s" }} />
          <div className="login-orb" style={{ bottom: "5%", right: "-15%", width: "50%", paddingBottom: "50%", background: "rgba(6,182,212,0.1)", animationDelay: "3s" }} />

          {/* Logo */}
          <div style={{ position: "relative", zIndex: 10, display: "flex", alignItems: "center", gap: 14 }}>
            <img src="/logo.png" alt="NEXORA" style={{ width: 64, height: 64, objectFit: "contain", filter: "drop-shadow(0 0 12px rgba(233,69,96,0.6))", animation: "float 6s ease-in-out infinite" }} />
            <div>
              <h1 style={{ fontFamily: "'Rajdhani',sans-serif", fontWeight: 700, fontSize: '1.75rem', letterSpacing: '0.15em', textTransform: 'uppercase', background: 'linear-gradient(135deg,#FF5C78,#E94560,#7C3AED)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', margin: 0 }}>NEXORA</h1>
              <p style={{ fontSize: '0.7rem', color: c.onSurfaceVar, letterSpacing: '0.12em', textTransform: 'uppercase', marginTop: 2 }}>Esports Tournament Platform</p>
            </div>
          </div>

          {/* Tagline */}
          <div style={{ position: "relative", zIndex: 10, marginTop: "48px", marginBottom: "auto" }}>
            <h2 style={{ fontFamily: "'Rajdhani',sans-serif", fontWeight: 700, fontSize: '2rem', color: c.onSurface, lineHeight: 1.2, marginBottom: 12 }}>
              Quản lý giải đấu<br />
              <span style={{ background: 'linear-gradient(135deg,#FF5C78,#E94560,#7C3AED)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Esports chuyên nghiệp</span>
            </h2>
            <p style={{ color: c.onSurfaceVar, fontSize: '0.875rem', lineHeight: 1.7, marginBottom: '32px' }}>
              Hệ thống quản lý toàn diện: bracket, check-in, kết quả, khiếu nại — tất cả trong một nền tảng.
            </p>

            {/* Feature cards */}
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {features.map(f => (
                <div key={f.icon} className="feat-item" style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 16px", borderRadius: 12, background: dark ? "rgba(22,27,34,0.7)" : "rgba(255,255,255,0.5)", backdropFilter: "blur(8px)" }}>
                  <div style={{ width: 38, height: 38, borderRadius: 9, background: 'rgba(233,69,96,0.15)', border: '1px solid rgba(233,69,96,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span style={{ fontSize: 20, fontFamily: 'Material Symbols Outlined', fontVariationSettings: "'FILL' 0,'wght' 400", color: '#FF7F96', lineHeight: 1 }}>{f.icon}</span>
                  </div>
                  <div>
                    <p style={{ fontFamily: "'Rajdhani',sans-serif", fontWeight: 600, fontSize: '0.95rem', color: c.onSurface, margin: 0 }}>{f.label}</p>
                    <p style={{ fontSize: "0.78rem", color: c.onSurfaceVar, margin: "2px 0 0" }}>{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div style={{ position: "relative", zIndex: 10, marginTop: "auto" }}>
            <p style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.15em', color: '#3A4358', fontFamily: "'JetBrains Mono',monospace" }}>NEXORA v1.0.0 — Built with Tauri v2 + React 18</p>
          </div>
        </section>

        {/* RIGHT PANEL */}
        <section style={{ width: "58%", display: "flex", flexDirection: "column", background: dark ? "#050811" : "#F8FAFC", position: "relative", overflow: "hidden" }}>
          {/* Background orbs */}
          <div style={{ position: "absolute", top: "20%", right: "10%", width: "40%", paddingBottom: "40%", borderRadius: "50%", background: "rgba(124,58,237,0.06)", filter: "blur(80px)", pointerEvents: "none", animation: "float 8s ease-in-out infinite" }} />
          <div style={{ position: "absolute", bottom: "15%", left: "5%", width: "30%", paddingBottom: "30%", borderRadius: "50%", background: "rgba(6,182,212,0.05)", filter: "blur(60px)", pointerEvents: "none", animation: "float 10s ease-in-out infinite reverse" }} />

          {/* Login Card */}
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "32px" }}>
            <div style={{
              width: "100%", maxWidth: 440,
              background: dark ? "rgba(13,17,23,0.85)" : "rgba(255,255,255,0.9)", backdropFilter: "blur(24px)",
              borderRadius: 20, border: `1px solid ${c.panelBorder}`,
              boxShadow: dark ? "0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(124,58,237,0.08)" : "0 20px 40px rgba(0,0,0,0.05)",
              padding: "40px", position: "relative",
              animation: "slide-in 0.5s ease",
            }}>
              {/* Locked overlay */}
              {locked && (
                <div style={{ position: "absolute", inset: 0, borderRadius: 20, background: dark ? "rgba(5,8,17,0.95)" : "rgba(255,255,255,0.95)", backdropFilter: "blur(12px)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, zIndex: 20, padding: 40, textAlign: "center" }}>
                  <div style={{ width: 72, height: 72, borderRadius: 18, background: "rgba(252,129,129,0.1)", border: "1px solid rgba(252,129,129,0.3)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ fontSize: 36, fontFamily: "Material Symbols Outlined", fontVariationSettings: "'FILL' 1,'wght' 400", color: "#FC8181" }}>lock</span>
                  </div>
                  <h3 style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: "1.4rem", fontWeight: 700, color: c.onSurface }}>Tài Khoản Tạm Khóa</h3>
                  <p style={{ color: c.onSurfaceVar, fontSize: "0.875rem", lineHeight: 1.6 }}>Sai {MAX_ATTEMPTS} lần liên tiếp. Vui lòng liên hệ Admin để mở khóa.</p>
                </div>
              )}

              {/* Header */}
              <div style={{ marginBottom: 32 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <div style={{ width: 3, height: 24, borderRadius: 2, background: 'linear-gradient(180deg,#E94560,#7C3AED)' }} />
                <h2 style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: '1.6rem', fontWeight: 700, color: c.onSurface, letterSpacing: '0.02em', margin: 0 }}>Đăng Nhập</h2>
              </div>
              <p style={{ color: c.onSurfaceVar, fontSize: '0.875rem' }}>Truy cập hệ thống quản lý NEXORA</p>
              </div>

              <form onSubmit={handleSubmit} noValidate style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                {/* Username */}
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <label style={{ fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: c.onSurfaceVar }}>Tên đăng nhập</label>
                  <div style={{ position: "relative" }}>
                    <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "#2D3748", fontSize: 18, fontFamily: "Material Symbols Outlined", fontVariationSettings: "'FILL' 0,'wght' 400", lineHeight: 1, pointerEvents: "none" }}>person</span>
                    <input type="text" value={username} onChange={e => setUsername(e.target.value)}
                      placeholder="vd. admin" disabled={locked} className="login-input"
                      style={{ width: "100%", background: dark ? "#0D1117" : "#F8FAFC", border: `1px solid ${c.panelBorder}`, borderRadius: 10, padding: "13px 14px 13px 44px", color: c.onSurface, fontSize: "0.9rem", transition: "all 0.2s" }} />
                  </div>
                </div>

                {/* Password */}
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <label style={{ fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: c.onSurfaceVar }}>Mật khẩu</label>
                  <div ref={pwdRef} style={{ position: "relative" }}>
                    <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "#2D3748", fontSize: 18, fontFamily: "Material Symbols Outlined", fontVariationSettings: "'FILL' 0,'wght' 400", lineHeight: 1, pointerEvents: "none" }}>lock</span>
                    <input id="nexora-pwd" type={showPwd ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)}
                      placeholder="••••••••••••" disabled={locked} className="login-input"
                      style={{ width: "100%", background: dark ? "#0D1117" : "#F8FAFC", border: `1px solid ${c.panelBorder}`, borderRadius: 10, padding: "13px 48px", color: c.onSurface, fontSize: "0.9rem", transition: "all 0.2s" }} />
                    <button type="button" onClick={() => setShowPwd(!showPwd)} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: showPwd ? "#A78BFA" : "#2D3748", display: "flex", alignItems: "center", transition: "color 0.2s" }}>
                      <span style={{ fontSize: 18, fontFamily: "Material Symbols Outlined", fontVariationSettings: "'FILL' 0,'wght' 400", lineHeight: 1 }}>{showPwd ? "visibility_off" : "visibility"}</span>
                    </button>
                  </div>
                </div>

                {/* Error */}
                {errorMsg && (
                  <div role="alert" style={{ padding: "11px 14px", borderRadius: 10, background: "rgba(252,129,129,0.08)", border: "1px solid rgba(252,129,129,0.25)", color: "#FC8181", fontSize: "0.85rem", display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 16, fontFamily: "Material Symbols Outlined", fontVariationSettings: "'FILL' 1,'wght' 400", flexShrink: 0 }}>warning</span>
                    {errorMsg}
                  </div>
                )}

                {/* Remember */}
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <input type="checkbox" id="nexora-remember" checked={remember} onChange={e => setRemember(e.target.checked)} style={{ width: 16, height: 16, cursor: "pointer" }} />
                  <label htmlFor="nexora-remember" style={{ fontSize: "0.875rem", color: c.onSurfaceVar, cursor: "pointer" }}>Ghi nhớ thiết bị này</label>
                </div>

                {/* Submit */}
                <button type="submit" disabled={loading || locked} className="nexora-btn-primary"
                  style={{ width: "100%", padding: "15px 24px", borderRadius: 12, fontSize: "1rem", fontFamily: "'Rajdhani',sans-serif", letterSpacing: "0.1em", display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
                  {loading ? (
                    <>
                      <svg style={{ width: 20, height: 20, animation: "spin 0.7s linear infinite", flexShrink: 0 }} viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.25)" strokeWidth="3" />
                        <path d="M4 12a8 8 0 018-8" stroke="#fff" strokeWidth="3" strokeLinecap="round" />
                      </svg>
                      Đang xác thực...
                    </>
                  ) : (
                    <>
                      ĐĂNG NHẬP
                      <span style={{ fontSize: 20, fontFamily: "Material Symbols Outlined", fontVariationSettings: "'FILL' 0,'wght' 400" }}>login</span>
                    </>
                  )}
                </button>
              </form>

              {/* Footer hint */}
              <p style={{ marginTop: 24, textAlign: "center", fontSize: "0.8rem", color: "#2D3748" }}>
                Tài khoản mặc định:{" "}
                <code style={{ color: "#A78BFA", fontFamily: "'JetBrains Mono',monospace", fontWeight: 600, background: "rgba(124,58,237,0.1)", padding: "2px 6px", borderRadius: 4 }}>admin / admin</code>
              </p>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
