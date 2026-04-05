import { useState } from "react";
import { useNavigate } from "react-router";
import { useTheme } from "../contexts/ThemeContext";
import { getTokens, NEXORA_GLOBAL_CSS } from "../theme";


export default function RegisterPage() {
  const { dark } = useTheme();
  const c = getTokens(dark);
  const navigate = useNavigate();

  const [form, setForm] = useState({
    username: "", password: "", confirmPwd: "",
    fullName: "", email: "", role: "Player"
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError]   = useState<string | null>(null);
  const [showPwd, setShowPwd] = useState(false);

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (form.password !== form.confirmPwd) {
      setError("Mật khẩu xác nhận không khớp."); return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          Username: form.username.trim(),
          Password: form.password,
          FullName: form.fullName.trim(),
          Email:    form.email.trim(),
          Role:     form.role,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Đăng ký thất bại."); return;
      }
      setSuccess(data.message ?? "Đăng ký thành công! Kiểm tra email để kích hoạt tài khoản.");
    } catch {
      setError("Không thể kết nối đến server.");
    } finally {
      setLoading(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: "100%", background: dark ? "#0D1117" : "#F8FAFC",
    border: `1px solid ${c.panelBorder}`, borderRadius: 10,
    padding: "12px 14px", color: c.onSurface, fontSize: "0.9rem",
    transition: "all 0.2s", boxSizing: "border-box",
  };

  if (success) {
    return (
      <>
        <style>{NEXORA_GLOBAL_CSS}</style>
        <main style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
                       background: dark ? "#080A0F" : "#F1F3F8", padding: 24 }}>
          <div style={{ maxWidth: 480, width: "100%", background: dark ? "rgba(13,17,23,0.9)" : "#fff",
                        borderRadius: 20, border: `1px solid ${c.panelBorder}`, padding: 48, textAlign: "center",
                        animation: "slide-in 0.4s ease" }}>
            <div style={{ fontSize: 64, marginBottom: 16 }}>📧</div>
            <h2 style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: "1.6rem", fontWeight: 700,
                         color: "#22D3EE", marginBottom: 16 }}>Kiểm tra hộp thư!</h2>
            <p style={{ color: c.onSurfaceVar, lineHeight: 1.7, marginBottom: 24 }}>{success}</p>
            <div style={{ background: "rgba(34,211,238,0.08)", border: "1px solid rgba(34,211,238,0.25)",
                          borderRadius: 10, padding: "14px 18px", marginBottom: 28, fontSize: "0.85rem", color: "#06B6D4" }}>
              ⏰ Link kích hoạt có hiệu lực <strong>24 giờ</strong>. Kiểm tra cả <strong>Spam/Junk</strong>.
            </div>
            <button onClick={() => navigate("/login")} className="nexora-btn-primary"
              style={{ padding: "12px 32px", borderRadius: 10, fontSize: "0.95rem",
                       fontFamily: "'Rajdhani',sans-serif", letterSpacing: "0.08em" }}>
              Quay lại Đăng Nhập
            </button>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <style>{NEXORA_GLOBAL_CSS}</style>
      <main style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
                     background: dark ? "#080A0F" : "#F1F3F8", padding: 24 }}>
        <div style={{ width: "100%", maxWidth: 480,
                      background: dark ? "rgba(13,17,23,0.9)" : "rgba(255,255,255,0.95)",
                      backdropFilter: "blur(24px)", borderRadius: 20,
                      border: `1px solid ${c.panelBorder}`,
                      boxShadow: dark ? "0 32px 80px rgba(0,0,0,0.5)" : "0 20px 40px rgba(0,0,0,0.06)",
                      padding: "40px", animation: "slide-in 0.4s ease" }}>

          {/* Header */}
          <div style={{ marginBottom: 32 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <div style={{ width: 3, height: 24, borderRadius: 2, background: "linear-gradient(180deg,#E94560,#7C3AED)" }} />
              <h1 style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: "1.6rem", fontWeight: 700,
                           color: c.onSurface, margin: 0 }}>Đăng Ký Tài Khoản</h1>
            </div>
            <p style={{ color: c.onSurfaceVar, fontSize: "0.875rem" }}>
              Tham gia hệ thống Nexora ETMS — nhận email kích hoạt ngay sau khi đăng ký.
            </p>
          </div>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            {/* FullName */}
            <div>
              <label style={{ display: "block", fontSize: "0.72rem", fontWeight: 700,
                              textTransform: "uppercase", letterSpacing: "0.1em",
                              color: c.onSurfaceVar, marginBottom: 6 }}>Họ và tên *</label>
              <input className="login-input" style={inputStyle} type="text"
                     placeholder="Nguyễn Văn A" value={form.fullName} onChange={set("fullName")} required />
            </div>

            {/* Email */}
            <div>
              <label style={{ display: "block", fontSize: "0.72rem", fontWeight: 700,
                              textTransform: "uppercase", letterSpacing: "0.1em",
                              color: c.onSurfaceVar, marginBottom: 6 }}>Email *</label>
              <input className="login-input" style={inputStyle} type="email"
                     placeholder="example@gmail.com" value={form.email} onChange={set("email")} required />
            </div>

            {/* Username */}
            <div>
              <label style={{ display: "block", fontSize: "0.72rem", fontWeight: 700,
                              textTransform: "uppercase", letterSpacing: "0.1em",
                              color: c.onSurfaceVar, marginBottom: 6 }}>Tên đăng nhập *</label>
              <input className="login-input" style={inputStyle} type="text"
                     placeholder="ít nhất 3 ký tự" value={form.username} onChange={set("username")} required />
            </div>

            {/* Password */}
            <div>
              <label style={{ display: "block", fontSize: "0.72rem", fontWeight: 700,
                              textTransform: "uppercase", letterSpacing: "0.1em",
                              color: c.onSurfaceVar, marginBottom: 6 }}>Mật khẩu *</label>
              <div style={{ position: "relative" }}>
                <input className="login-input"
                       style={{ ...inputStyle, paddingRight: 48 }}
                       type={showPwd ? "text" : "password"}
                       placeholder="ít nhất 6 ký tự" value={form.password} onChange={set("password")} required />
                <button type="button" onClick={() => setShowPwd(!showPwd)}
                  style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
                           background: "none", border: "none", cursor: "pointer",
                           color: showPwd ? "#A78BFA" : "#64748b", padding: 0 }}>
                  <span style={{ fontSize: 18, fontFamily: "Material Symbols Outlined",
                                 fontVariationSettings: "'FILL' 0,'wght' 400", lineHeight: 1 }}>
                    {showPwd ? "visibility_off" : "visibility"}
                  </span>
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label style={{ display: "block", fontSize: "0.72rem", fontWeight: 700,
                              textTransform: "uppercase", letterSpacing: "0.1em",
                              color: c.onSurfaceVar, marginBottom: 6 }}>Xác nhận mật khẩu *</label>
              <input className="login-input" style={inputStyle} type="password"
                     placeholder="nhập lại mật khẩu" value={form.confirmPwd} onChange={set("confirmPwd")} required />
            </div>

            {/* Role */}
            <div>
              <label style={{ display: "block", fontSize: "0.72rem", fontWeight: 700,
                              textTransform: "uppercase", letterSpacing: "0.1em",
                              color: c.onSurfaceVar, marginBottom: 6 }}>Vai trò</label>
              <select value={form.role} onChange={set("role")}
                style={{ ...inputStyle, cursor: "pointer", appearance: "none",
                         backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%236B7280' fill='none' strokeWidth='2'/%3E%3C/svg%3E")`,
                         backgroundRepeat: "no-repeat", backgroundPosition: "right 14px center" }}>
                <option value="Player">🎮 Player (Tuyển thủ)</option>
                <option value="Captain">⚡ Captain (Đội trưởng)</option>
                <option value="Guest">👁 Guest (Khán giả)</option>
              </select>
            </div>

            {/* Error */}
            {error && (
              <div role="alert" style={{ padding: "11px 14px", borderRadius: 10,
                                        background: "rgba(252,129,129,0.08)",
                                        border: "1px solid rgba(252,129,129,0.25)",
                                        color: "#FC8181", fontSize: "0.85rem",
                                        display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 16, fontFamily: "Material Symbols Outlined",
                               fontVariationSettings: "'FILL' 1,'wght' 400" }}>warning</span>
                {error}
              </div>
            )}

            {/* Submit */}
            <button type="submit" disabled={loading} className="nexora-btn-primary"
              style={{ width: "100%", padding: "14px 24px", borderRadius: 12,
                       fontSize: "1rem", fontFamily: "'Rajdhani',sans-serif",
                       letterSpacing: "0.08em", display: "flex", alignItems: "center",
                       justifyContent: "center", gap: 10, marginTop: 4 }}>
              {loading ? "Đang gửi..." : "ĐĂNG KÝ & GỬI EMAIL KÍCH HOẠT"}
            </button>

            {/* Login link */}
            <p style={{ textAlign: "center", fontSize: "0.85rem", color: c.onSurfaceVar, margin: 0 }}>
              Đã có tài khoản?{" "}
              <button type="button" onClick={() => navigate("/login")}
                style={{ background: "none", border: "none", color: "#A78BFA",
                         cursor: "pointer", fontSize: "0.85rem", fontWeight: 600,
                         textDecoration: "underline" }}>
                Đăng nhập ngay
              </button>
            </p>
          </form>
        </div>
      </main>
    </>
  );
}
