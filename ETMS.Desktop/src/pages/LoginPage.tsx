import { useState, useRef, useMemo } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";
import { useLang } from "../contexts/LangContext";
import { getTokens, NEXORA_GLOBAL_CSS } from "../theme";

const MAX_ATTEMPTS = 5;

type AuthMode = "login" | "register" | "forgot";

const MS = ({ icon, size = 20 }: { icon: string; size?: number }) => (
  <span style={{ fontSize: size, fontFamily: 'Material Symbols Outlined', fontVariationSettings: "'FILL' 0,'wght' 400", lineHeight: 1, userSelect: 'none', display: 'inline-block' }}>{icon}</span>
)

export default function LoginPage() {
  const { login } = useAuth();
  const { dark, toggle: toggleTheme } = useTheme();
  const { lang, toggle: toggleLang } = useLang();
  const c = getTokens(dark);
  const navigate = useNavigate();

  // ── Mode với animation ─────────────────────────────────────────────────────
  const [mode, setMode]           = useState<AuthMode>("login");
  const [animating, setAnimating] = useState(false);
  const [slideDir, setSlideDir]   = useState<"up" | "down">("up"); // up = đi lên (sang register), down = về login

  const switchMode = (next: AuthMode) => {
    if (animating || next === mode) return;
    // login < register/forgot về hierarchy: sang register/forgot thì slide lên, về login thì slide xuống
    const goingForward = next !== "login";
    setSlideDir(goingForward ? "up" : "down");
    setAnimating(true);
    // Reset errors
    setLError(null); setRError(null); setFErr(null); setFMsg(null);
    setTimeout(() => {
      setMode(next);
      setAnimating(false);
    }, 280);
  };

  // ── Login state ─────────────────────────────────────────────────────────────
  const [lUser, setLUser]     = useState("");
  const [lPass, setLPass]     = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [remember]            = useState(false);
  const [loading, setLoading] = useState(false);
  const [lError, setLError]   = useState<string | null>(null);
  const [failCount, setFailCount] = useState(0);
  const [locked, setLocked]   = useState(false);
  const pwdRef = useRef<HTMLDivElement>(null);

  // ── Register state ──────────────────────────────────────────────────────────
  const [rName, setRName]       = useState("");
  const [rEmail, setREmail]     = useState("");
  const [rUser, setRUser]       = useState("");
  const [rPass, setRPass]       = useState("");
  const [rCPass, setRCPass]     = useState("");
  const [rRole, setRRole]       = useState("Player");
  const [rShowP, setRShowP]     = useState(false);
  const [rLoading, setRLoading] = useState(false);
  const [rError, setRError]     = useState<string | null>(null);
  const [rSuccess, setRSuccess] = useState<string | null>(null);

  // ── Forgot state ────────────────────────────────────────────────────────────
  const [fEmail, setFEmail]     = useState("");
  const [fLoading, setFLoading] = useState(false);
  const [fMsg, setFMsg]         = useState<string | null>(null);
  const [fErr, setFErr]         = useState<string | null>(null);

  const shake = () => {
    const el = pwdRef.current;
    if (!el) return;
    el.style.animation = "none"; void el.offsetHeight;
    el.style.animation = "shake 0.4s ease";
    setTimeout(() => { if (el) el.style.animation = ""; }, 400);
  };

  // ── Login submit ─────────────────────────────────────────────────────────────
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (locked) return;
    setLError(null);
    if (!lUser.trim()) { setLError("Vui lòng nhập tên đăng nhập."); return; }
    if (!lPass)        { setLError("Vui lòng nhập mật khẩu."); return; }
    setLoading(true);
    const { ok, error: err, status } = await login(lUser.trim(), lPass);
    setLoading(false);
    if (ok) { setFailCount(0); navigate("/dashboard"); return; }
    shake();
    if (status === 403) {
      setLError(err ?? "Tài khoản chưa kích hoạt. Kiểm tra email của bạn.");
      return;
    }
    const next = failCount + 1; setFailCount(next);
    if (next >= MAX_ATTEMPTS) { setLocked(true); return; }
    setLError(err ?? `Sai thông tin. Còn ${MAX_ATTEMPTS - next} lần thử.`);
  };

  // ── Register submit ──────────────────────────────────────────────────────────
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRError(null);
    if (rPass !== rCPass) { setRError("Mật khẩu xác nhận không khớp."); return; }
    if (rPass.length < 6) { setRError("Mật khẩu phải ít nhất 6 ký tự."); return; }
    setRLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          Username: rUser.trim(), Password: rPass,
          FullName: rName.trim(), Email: rEmail.trim(), Role: rRole,
        }),
      });
      const data = await res.json();
      if (!res.ok) setRError(data.error ?? "Đăng ký thất bại.");
      else         setRSuccess(data.message ?? "Đăng ký thành công!");
    } catch {
      setRError("Không thể kết nối đến server.");
    } finally {
      setRLoading(false);
    }
  };

  // ── Forgot submit ────────────────────────────────────────────────────────────
  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    setFErr(null); setFMsg(null);
    if (!fEmail.trim()) { setFErr("Vui lòng nhập email."); return; }
    setFLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ Email: fEmail.trim() }),
      });
      const data = await res.json();
      if (res.ok) setFMsg(data.message ?? "Kiểm tra hộp thư email của bạn.");
      else        setFErr(data.error ?? "Có lỗi xảy ra.");
    } catch {
      setFErr("Không thể kết nối đến server.");
    } finally {
      setFLoading(false);
    }
  };

  const features = [
    { icon: "sports_esports", label: "Đa thể loại",              desc: "FPS · MOBA · Battle Royale · Fighting" },
    { icon: "account_tree",   label: "Bracket thời gian thực",   desc: "Cập nhật tự động, không độ trễ" },
    { icon: "shield",         label: "Bảo mật cao",              desc: "BCrypt + JWT · RBAC · Audit logs" },
  ];

  // ── Input & label shared styles ──────────────────────────────────────────────
  const inp: React.CSSProperties = {
    width: "100%", background: dark ? "#0D1117" : "#F8FAFC",
    border: `1px solid ${c.panelBorder}`, borderRadius: 8,
    padding: "10px 12px", color: c.onSurface, fontSize: "0.85rem",
    transition: "all 0.2s", boxSizing: "border-box",
  };
  const lbl: React.CSSProperties = {
    fontSize: "0.68rem", fontWeight: 700, textTransform: "uppercase",
    letterSpacing: "0.1em", color: c.onSurfaceVar,
  };

  // ── Animation keyframes ──────────────────────────────────────────────────────
  const slideCss = `
    html,body,#root{width:100%;height:100%;overflow:hidden;}
    .login-orb{position:absolute;border-radius:50%;filter:blur(100px);pointer-events:none;animation:float 6s ease-in-out infinite;}
    .feat-item{transition:all 0.2s;border:1px solid rgba(124,58,237,0.15);}
    .feat-item:hover{border-color:rgba(124,58,237,0.4);background:rgba(124,58,237,0.1)!important;transform:translateX(4px);}
    .login-input:focus{outline:none;border-color:rgba(124,58,237,0.8)!important;box-shadow:0 0 0 3px rgba(124,58,237,0.2)!important;}
    input[type=checkbox]{accent-color:#7C3AED;}

    /* Slide animations */
    @keyframes slideOutUp   { from{opacity:1;transform:translateY(0)}    to{opacity:0;transform:translateY(-28px)} }
    @keyframes slideOutDown { from{opacity:1;transform:translateY(0)}    to{opacity:0;transform:translateY(28px)} }
    @keyframes slideInUp    { from{opacity:0;transform:translateY(28px)} to{opacity:1;transform:translateY(0)} }
    @keyframes slideInDown  { from{opacity:0;transform:translateY(-28px)}to{opacity:1;transform:translateY(0)} }

    .slide-out-up   { animation: slideOutUp   0.28s ease forwards; }
    .slide-out-down { animation: slideOutDown 0.28s ease forwards; }
    .slide-in-up    { animation: slideInUp    0.28s ease forwards; }
    .slide-in-down  { animation: slideInDown  0.28s ease forwards; }

    .auth-link-btn{background:none;border:none;cursor:pointer;padding:0;font-size:0.82rem;font-weight:600;color:#A78BFA;text-decoration:underline;}
    .auth-link-btn:hover{color:#C4B5FD;}
    .register-scroller{overflow-y:auto;max-height:100%;padding-right:2px;}
    .register-scroller::-webkit-scrollbar{width:4px;}
    .register-scroller::-webkit-scrollbar-track{background:transparent;}
    .register-scroller::-webkit-scrollbar-thumb{background:rgba(124,58,237,0.3);border-radius:2px;}
    .nexora-select{-webkit-appearance:none;appearance:none;
      background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%236B7280' fill='none' stroke-width='2'/%3E%3C/svg%3E");
      background-repeat:no-repeat;background-position:right 12px center;}
    select option{background:#161B22;color:#E2E8F0;}
  `;

  // ── Container animation class ────────────────────────────────────────────────
  const formClass = animating
    ? (slideDir === "up" ? "slide-out-up" : "slide-out-down")
    : (slideDir === "up" ? "slide-in-up"  : "slide-in-down");

  // ── Right panel content ───────────────────────────────────────────────────────
  const renderForm = () => {
    // ── LOGIN ──
    if (mode === "login") return (
      <form onSubmit={handleLogin} noValidate style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        {/* Header */}
        <div style={{ marginBottom: 4 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <div style={{ width: 3, height: 24, borderRadius: 2, background: 'linear-gradient(180deg,#E94560,#7C3AED)' }} />
            <h2 style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: '1.6rem', fontWeight: 700, color: c.onSurface, letterSpacing: '0.02em', margin: 0 }}>Đăng Nhập</h2>
          </div>
          <p style={{ color: c.onSurfaceVar, fontSize: '0.875rem', margin: 0 }}>Truy cập hệ thống quản lý NEXORA</p>
        </div>

        {/* Username */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <label style={lbl}>Tên đăng nhập</label>
          <div style={{ position: "relative" }}>
            <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "#2D3748", fontSize: 18, fontFamily: "Material Symbols Outlined", fontVariationSettings: "'FILL' 0,'wght' 400", lineHeight: 1, pointerEvents: "none" }}>person</span>
            <input type="text" value={lUser} onChange={e => setLUser(e.target.value)}
              placeholder="vd. admin" disabled={locked} className="login-input"
              style={{ ...inp, paddingLeft: 44 }} />
          </div>
        </div>

        {/* Password */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <label style={lbl}>Mật khẩu</label>
          <div ref={pwdRef} style={{ position: "relative" }}>
            <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "#2D3748", fontSize: 18, fontFamily: "Material Symbols Outlined", fontVariationSettings: "'FILL' 0,'wght' 400", lineHeight: 1, pointerEvents: "none" }}>lock</span>
            <input type={showPwd ? "text" : "password"} value={lPass} onChange={e => setLPass(e.target.value)}
              placeholder="••••••••••••" disabled={locked} className="login-input"
              style={{ ...inp, paddingLeft: 44, paddingRight: 48 }} />
            <button type="button" onClick={() => setShowPwd(!showPwd)}
              style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: showPwd ? "#A78BFA" : "#2D3748", display: "flex", alignItems: "center", transition: "color 0.2s" }}>
              <MS icon={showPwd ? "visibility_off" : "visibility"} size={18} />
            </button>
          </div>
          <button type="button" onClick={() => switchMode("forgot")}
            style={{ alignSelf: "flex-end", background: "none", border: "none", cursor: "pointer", color: "#A78BFA", fontSize: "0.78rem", fontWeight: 600, padding: 0, textDecoration: "underline" }}>
            Quên mật khẩu?
          </button>
        </div>

        {/* Error */}
        {lError && (
          <div role="alert" style={{ padding: "11px 14px", borderRadius: 10, background: "rgba(252,129,129,0.08)", border: "1px solid rgba(252,129,129,0.25)", color: "#FC8181", fontSize: "0.85rem", display: "flex", alignItems: "center", gap: 8 }}>
            <MS icon="warning" size={16} />
            {lError}
          </div>
        )}

        {/* Lock / Submit */}
        {locked ? (
          <div style={{ padding: "16px", borderRadius: 12, background: "rgba(252,129,129,0.06)", border: "1px solid rgba(252,129,129,0.2)", textAlign: "center" }}>
            <span style={{ fontSize: 32 }}>🔒</span>
            <p style={{ color: "#FC8181", fontSize: "0.85rem", margin: "8px 0 0", lineHeight: 1.5 }}>
              Sai {MAX_ATTEMPTS} lần liên tiếp.<br />Liên hệ Admin để mở khóa.
            </p>
          </div>
        ) : (
          <button type="submit" disabled={loading} className="nexora-btn-primary"
            style={{ width: "100%", padding: "15px 24px", borderRadius: 12, fontSize: "1rem", fontFamily: "'Rajdhani',sans-serif", letterSpacing: "0.1em", display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
            {loading ? (
              <>
                <svg style={{ width: 20, height: 20, animation: "spin 0.7s linear infinite", flexShrink: 0 }} viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.25)" strokeWidth="3" />
                  <path d="M4 12a8 8 0 018-8" stroke="#fff" strokeWidth="3" strokeLinecap="round" />
                </svg>
                Đang xác thực...
              </>
            ) : (<>ĐĂNG NHẬP <MS icon="login" size={20} /></>)}
          </button>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <p style={{ textAlign: "center", fontSize: "0.82rem", color: c.onSurfaceVar, margin: 0 }}>
            Chưa có tài khoản?{" "}
            <button type="button" className="auth-link-btn" onClick={() => switchMode("register")}>
              Đăng ký ngay
            </button>
          </p>
          <p style={{ textAlign: "center", fontSize: "0.73rem", color: "#2D3748", margin: 0 }}>
            Tài khoản mặc định:{" "}
            <code style={{ color: "#A78BFA", fontFamily: "'JetBrains Mono',monospace", fontWeight: 600, background: "rgba(124,58,237,0.1)", padding: "2px 6px", borderRadius: 4 }}>admin / admin</code>
          </p>
        </div>
      </form>
    );

    // ── REGISTER ──
    if (mode === "register") {
      if (rSuccess) return (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: 16 }}>
          <div style={{ fontSize: 56 }}>📧</div>
          <h3 style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: "1.4rem", color: "#22D3EE", margin: 0 }}>Kiểm tra hộp thư!</h3>
          <p style={{ color: c.onSurfaceVar, lineHeight: 1.65, fontSize: "0.88rem", maxWidth: 300 }}>{rSuccess}</p>
          <div style={{ background: "rgba(34,211,238,0.08)", border: "1px solid rgba(34,211,238,0.2)", borderRadius: 10, padding: "12px 16px", fontSize: "0.8rem", color: "#06B6D4" }}>
            ⏰ Link kích hoạt có hiệu lực <strong>24 giờ</strong>. Kiểm tra cả <strong>Spam/Junk</strong>.
          </div>
          <button type="button" onClick={() => { setRSuccess(null); setRName(""); setREmail(""); setRUser(""); setRPass(""); setRCPass(""); switchMode("login"); }}
            className="nexora-btn-primary"
            style={{ padding: "11px 28px", borderRadius: 10, fontFamily: "'Rajdhani',sans-serif", letterSpacing: "0.08em" }}>
            Về Đăng Nhập
          </button>
        </div>
      );

      return (
        <div className="register-scroller">
          {/* Back + Header */}
          <button type="button" onClick={() => switchMode("login")}
            style={{ background: "none", border: "none", cursor: "pointer", color: "#A78BFA", fontSize: "0.8rem", fontWeight: 600, display: "flex", alignItems: "center", gap: 5, padding: 0, marginBottom: 16 }}>
            <MS icon="arrow_back" size={16} /> Quay lại đăng nhập
          </button>
          <div style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <div style={{ width: 3, height: 20, borderRadius: 2, background: 'linear-gradient(180deg,#E94560,#7C3AED)' }} />
              <h2 style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: "1.3rem", fontWeight: 700, color: c.onSurface, margin: 0 }}>Tạo Tài Khoản</h2>
            </div>
            <p style={{ color: c.onSurfaceVar, fontSize: "0.78rem", margin: 0 }}>Nhận email kích hoạt ngay sau khi đăng ký.</p>
          </div>

          <form onSubmit={handleRegister} noValidate style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <label style={lbl}>Họ và tên *</label>
                <input className="login-input" style={inp} type="text" placeholder="Nguyễn Văn A" value={rName} onChange={e => setRName(e.target.value)} required />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <label style={lbl}>Email *</label>
                <input className="login-input" style={inp} type="email" placeholder="you@gmail.com" value={rEmail} onChange={e => setREmail(e.target.value)} required />
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <label style={lbl}>Tên đăng nhập *</label>
                <input className="login-input" style={inp} type="text" placeholder="≥ 3 ký tự" value={rUser} onChange={e => setRUser(e.target.value)} required />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <label style={lbl}>Vai trò</label>
                <select className="login-input nexora-select" style={inp} value={rRole} onChange={e => setRRole(e.target.value)}>
                  <option value="Player">🎮 Player</option>
                  <option value="Captain">⚡ Captain</option>
                  <option value="Guest">👁 Guest</option>
                </select>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <label style={lbl}>Mật khẩu *</label>
                <div style={{ position: "relative" }}>
                  <input className="login-input" style={{ ...inp, paddingRight: 40 }} type={rShowP ? "text" : "password"} placeholder="≥ 6 ký tự" value={rPass} onChange={e => setRPass(e.target.value)} required />
                  <button type="button" onClick={() => setRShowP(!rShowP)} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: rShowP ? "#A78BFA" : "#2D3748", padding: 0 }}>
                    <MS icon={rShowP ? "visibility_off" : "visibility"} size={16} />
                  </button>
                </div>
                {/* Password strength bar + hints */}
                {rPass.length > 0 && (() => {
                  const p = rPass;
                  const checks = [
                    { ok: p.length >= 6,                     hint: "≥ 6 ký tự" },
                    { ok: /[A-Z]/.test(p) && /[a-z]/.test(p), hint: "Chữ hoa + thường" },
                    { ok: /[0-9]/.test(p),                    hint: "Có chữ số" },
                    { ok: /[^A-Za-z0-9]/.test(p),             hint: "Ký tự đặc biệt (!@#...)" },
                  ];
                  const passed = checks.filter(c => c.ok).length;
                  const lvl = passed <= 1 ? 0 : passed <= 2 ? 1 : passed <= 3 ? 2 : 3;
                  const cfg = [
                    { label: "Yếu",      color: "#FC8181" },
                    { label: "Trung bình", color: "#F6AD55" },
                    { label: "Tốt",      color: "#68D391" },
                    { label: "Mạnh",     color: "#48BB78" },
                  ][lvl];
                  return (
                    <div style={{ marginTop: 2 }}>
                      <div style={{ display: "flex", gap: 3, marginBottom: 3 }}>
                        {[0,1,2,3].map(i => (
                          <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, transition: "background 0.3s",
                            background: i <= lvl ? cfg.color : (dark ? "#2D3748" : "#E2E8F0") }} />
                        ))}
                      </div>
                      <p style={{ margin: "0 0 2px", fontSize: "0.65rem", color: cfg.color, fontWeight: 600 }}>{cfg.label}</p>
                      {passed < 4 && (
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "2px 8px" }}>
                          {checks.filter(c => !c.ok).map((c, i) => (
                            <span key={i} style={{ fontSize: "0.6rem", color: "#6B7280" }}>• {c.hint}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <label style={lbl}>Xác nhận MK *</label>
                <div style={{ position: "relative" }}>
                  <input className="login-input" type="password" placeholder="Nhập lại"
                    style={{ ...inp, paddingRight: 36,
                      borderColor: rCPass
                        ? (rPass === rCPass ? "rgba(72,187,120,0.7)" : "rgba(252,129,129,0.7)")
                        : (c.panelBorder as string)
                    }}
                    value={rCPass} onChange={e => setRCPass(e.target.value)} required />
                  {rCPass.length > 0 && (
                    <span style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
                      fontSize: 16, fontFamily: "Material Symbols Outlined", fontVariationSettings: "'FILL' 1,'wght' 400",
                      color: rPass === rCPass ? "#48BB78" : "#FC8181", lineHeight: 1, pointerEvents: "none" }}>
                      {rPass === rCPass ? "check_circle" : "cancel"}
                    </span>
                  )}
                </div>
                {rCPass.length > 0 && (
                  <p style={{ margin: 0, fontSize: "0.7rem", fontWeight: 600,
                    color: rPass === rCPass ? "#48BB78" : "#FC8181" }}>
                    {rPass === rCPass ? "✓ Mật khẩu khớp" : "✗ Chưa khớp"}
                  </p>
                )}
              </div>
            </div>

            {/* Error — LUÔN hiển thị trên nút, không bao giờ làm mất nút */}
            {rError && (
              <div role="alert" style={{ padding: "10px 14px", borderRadius: 9, background: "rgba(252,129,129,0.08)", border: "1px solid rgba(252,129,129,0.25)", color: "#FC8181", fontSize: "0.82rem", display: "flex", alignItems: "center", gap: 8 }}>
                <MS icon="warning" size={15} />{rError}
              </div>
            )}

            {/* Submit — KHÔNG bao giờ biến mất */}
            <button type="submit" disabled={rLoading} className="nexora-btn-primary"
              style={{ width: "100%", padding: "13px 24px", borderRadius: 12, fontSize: "0.95rem", fontFamily: "'Rajdhani',sans-serif", letterSpacing: "0.08em", display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
              {rLoading ? (
                <><svg style={{ width: 18, height: 18, animation: "spin 0.7s linear infinite" }} viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.25)" strokeWidth="3" />
                  <path d="M4 12a8 8 0 018-8" stroke="#fff" strokeWidth="3" strokeLinecap="round" />
                </svg>Đang gửi...</>
              ) : "ĐĂNG KÝ & GỬI EMAIL KÍCH HOẠT"}
            </button>

            <p style={{ textAlign: "center", fontSize: "0.8rem", color: c.onSurfaceVar, margin: 0 }}>
              Đã có tài khoản?{" "}
              <button type="button" className="auth-link-btn" onClick={() => switchMode("login")}>Đăng nhập</button>
            </p>
          </form>
        </div>
      );
    }

    // ── FORGOT ──
    return (
      <form onSubmit={handleForgot} noValidate style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <button type="button" onClick={() => switchMode("login")}
          style={{ background: "none", border: "none", cursor: "pointer", color: "#A78BFA", fontSize: "0.8rem", fontWeight: 600, display: "flex", alignItems: "center", gap: 5, padding: 0, alignSelf: "flex-start" }}>
          <MS icon="arrow_back" size={16} /> Quay lại đăng nhập
        </button>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <div style={{ width: 3, height: 22, borderRadius: 2, background: 'linear-gradient(180deg,#F59E0B,#EF4444)' }} />
            <h2 style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: "1.5rem", fontWeight: 700, color: c.onSurface, margin: 0 }}>Quên Mật Khẩu</h2>
          </div>
          <p style={{ color: c.onSurfaceVar, fontSize: "0.875rem", margin: 0 }}>Nhập email để nhận hướng dẫn đặt lại mật khẩu.</p>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <label style={lbl}>Địa chỉ email</label>
          <div style={{ position: "relative" }}>
            <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "#2D3748", fontSize: 18, fontFamily: "Material Symbols Outlined", fontVariationSettings: "'FILL' 0,'wght' 400", lineHeight: 1, pointerEvents: "none" }}>email</span>
            <input className="login-input" type="email" value={fEmail} onChange={e => setFEmail(e.target.value)}
              placeholder="you@gmail.com" style={{ ...inp, paddingLeft: 44 }} required />
          </div>
        </div>
        {fErr && <div role="alert" style={{ padding: "10px 14px", borderRadius: 9, background: "rgba(252,129,129,0.08)", border: "1px solid rgba(252,129,129,0.25)", color: "#FC8181", fontSize: "0.82rem", display: "flex", gap: 8 }}><MS icon="warning" size={15} />{fErr}</div>}
        {fMsg && <div style={{ padding: "10px 14px", borderRadius: 9, background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.25)", color: "#4ADE80", fontSize: "0.82rem", display: "flex", gap: 8 }}><MS icon="check_circle" size={15} />{fMsg}</div>}
        <button type="submit" disabled={fLoading} className="nexora-btn-primary"
          style={{ width: "100%", padding: "15px 24px", borderRadius: 12, fontSize: "0.95rem", fontFamily: "'Rajdhani',sans-serif", letterSpacing: "0.1em", display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
          {fLoading ? "Đang gửi..." : <><MS icon="send" size={18} />GỬI LIÊN KẾT</>}
        </button>
      </form>
    );
  };

  // ── RENDER ────────────────────────────────────────────────────────────────────
  return (
    <>
      <style>{NEXORA_GLOBAL_CSS}</style>
      <style>{slideCss}</style>

      {/* Top-right controls */}
      <div style={{ position: 'fixed', top: 16, right: 20, display: 'flex', alignItems: 'center', gap: 8, zIndex: 200 }}>
        <button onClick={toggleLang}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', background: dark ? 'rgba(22,27,34,0.85)' : 'rgba(255,255,255,0.9)', border: `1px solid ${c.panelBorder}`, borderRadius: 9, cursor: 'pointer', backdropFilter: 'blur(8px)', color: c.onSurface, transition: 'all 0.15s', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}
          onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(233,69,96,0.5)')}
          onMouseLeave={e => (e.currentTarget.style.borderColor = c.panelBorder)}>
          <span style={{ fontFamily: "'JetBrains Mono',monospace", fontWeight: 700, fontSize: '0.75rem', color: '#E94560' }}>{lang.toUpperCase()}</span>
          <span style={{ fontSize: '0.78rem', color: c.onSurfaceVar }}>{lang === 'vi' ? 'Tiếng Việt' : 'English'}</span>
        </button>
        <button onClick={toggleTheme}
          style={{ width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', background: dark ? 'rgba(22,27,34,0.85)' : 'rgba(255,255,255,0.9)', border: `1px solid ${c.panelBorder}`, borderRadius: 9, cursor: 'pointer', backdropFilter: 'blur(8px)', color: c.onSurface }}
          onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(233,69,96,0.5)')}
          onMouseLeave={e => (e.currentTarget.style.borderColor = c.panelBorder)}>
          <MS icon={dark ? 'light_mode' : 'dark_mode'} size={18} />
        </button>
      </div>

      <main style={{ minHeight: "100vh", width: "100%", display: "flex", overflow: "hidden", background: dark ? "#080A0F" : "#F1F3F8", color: c.onSurface }}>

        {/* LEFT PANEL — layout gốc giữ nguyên */}
        <section className="hex-grid" style={{ width: "42%", background: c.surface, display: "flex", flexDirection: "column", padding: "48px 40px", position: "relative", overflow: "hidden", borderRight: `1px solid ${c.panelBorder}` }}>
          <div className="login-orb" style={{ top: "-15%", left: "-20%", width: "60%", paddingBottom: "60%", background: "rgba(124,58,237,0.15)", animationDelay: "0s" }} />
          <div className="login-orb" style={{ bottom: "5%", right: "-15%", width: "50%", paddingBottom: "50%", background: "rgba(6,182,212,0.1)", animationDelay: "3s" }} />

          <div style={{ position: "relative", zIndex: 10, display: "flex", alignItems: "center", gap: 14 }}>
            <img src="/logo.png" alt="NEXORA" style={{ width: 64, height: 64, objectFit: "contain", filter: "drop-shadow(0 0 12px rgba(233,69,96,0.6))", animation: "float 6s ease-in-out infinite" }} />
            <div>
              <h1 style={{ fontFamily: "'Rajdhani',sans-serif", fontWeight: 700, fontSize: '1.75rem', letterSpacing: '0.15em', textTransform: 'uppercase', background: 'linear-gradient(135deg,#FF5C78,#E94560,#7C3AED)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', margin: 0 }}>NEXORA</h1>
              <p style={{ fontSize: '0.7rem', color: c.onSurfaceVar, letterSpacing: '0.12em', textTransform: 'uppercase', marginTop: 2 }}>Esports Tournament Platform</p>
            </div>
          </div>

          <div style={{ position: "relative", zIndex: 10, marginTop: "48px", marginBottom: "auto" }}>
            <h2 style={{ fontFamily: "'Rajdhani',sans-serif", fontWeight: 700, fontSize: '2rem', color: c.onSurface, lineHeight: 1.2, marginBottom: 12 }}>
              Quản lý giải đấu<br />
              <span style={{ background: 'linear-gradient(135deg,#FF5C78,#E94560,#7C3AED)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Esports chuyên nghiệp</span>
            </h2>
            <p style={{ color: c.onSurfaceVar, fontSize: '0.875rem', lineHeight: 1.7, marginBottom: '32px' }}>
              Hệ thống quản lý toàn diện: bracket, check-in, kết quả, khiếu nại — tất cả trong một nền tảng.
            </p>
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

          <div style={{ position: "relative", zIndex: 10, marginTop: "auto" }}>
            <p style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.15em', color: '#3A4358', fontFamily: "'JetBrains Mono',monospace" }}>NEXORA v1.0.0 — Built with Tauri v2 + React 18</p>
          </div>
        </section>

        {/* RIGHT PANEL */}
        <section style={{ width: "58%", display: "flex", flexDirection: "column", background: dark ? "#050811" : "#F8FAFC", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: "20%", right: "10%", width: "40%", paddingBottom: "40%", borderRadius: "50%", background: "rgba(124,58,237,0.06)", filter: "blur(80px)", pointerEvents: "none", animation: "float 8s ease-in-out infinite" }} />
          <div style={{ position: "absolute", bottom: "15%", left: "5%", width: "30%", paddingBottom: "30%", borderRadius: "50%", background: "rgba(6,182,212,0.05)", filter: "blur(60px)", pointerEvents: "none", animation: "float 10s ease-in-out infinite reverse" }} />

          {/* Card */}
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "32px" }}>
            <div style={{
              width: "100%", maxWidth: 520,
              background: dark ? "rgba(13,17,23,0.85)" : "rgba(255,255,255,0.9)", backdropFilter: "blur(24px)",
              borderRadius: 20, border: `1px solid ${c.panelBorder}`,
              boxShadow: dark ? "0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(124,58,237,0.08)" : "0 20px 40px rgba(0,0,0,0.05)",
              padding: mode === "register" ? "28px 36px" : "40px",
              display: "flex", flexDirection: "column",
              overflow: "visible",
            }}>
              {/* Animated form container */}
              <div className={formClass} style={{ flex: 1, overflow: mode === "register" ? "visible" : "visible", display: "flex", flexDirection: "column" }}>
                {renderForm()}
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
