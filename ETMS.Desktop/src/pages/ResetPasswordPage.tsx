import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router";

const MS = ({ icon, size = 20 }: { icon: string; size?: number }) => (
  <span style={{ fontFamily: "Material Symbols Outlined", fontSize: size, fontVariationSettings: "'FILL' 0,'wght' 400", lineHeight: 1, userSelect: "none" }}>{icon}</span>
);

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [password, setPassword]   = useState("");
  const [confirm, setConfirm]     = useState("");
  const [showPwd, setShowPwd]     = useState(false);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState<string | null>(null);
  const [success, setSuccess]     = useState<string | null>(null);

  const token = searchParams.get("token");

  useEffect(() => {
    if (!token) setError("Link đặt lại mật khẩu không hợp lệ.");
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < 6) { setError("Mật khẩu phải có ít nhất 6 ký tự."); return; }
    if (password !== confirm) { setError("Mật khẩu xác nhận không khớp."); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ Token: token, NewPassword: password }),
      });
      const data = await res.json();
      if (res.ok) setSuccess(data.message ?? "Đặt lại mật khẩu thành công!");
      else        setError(data.error ?? "Có lỗi xảy ra.");
    } catch {
      setError("Không thể kết nối đến server.");
    } finally {
      setLoading(false);
    }
  };

  const card: React.CSSProperties = {
    minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
    background: "#0d1117", fontFamily: "'Segoe UI', sans-serif",
  };
  const box: React.CSSProperties = {
    background: "linear-gradient(145deg, #161b22 0%, #1c2128 100%)",
    border: "1px solid #30363d", borderRadius: 20, padding: "48px 40px",
    width: 420, maxWidth: "90vw", textAlign: "center",
    boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
  };
  const inp: React.CSSProperties = {
    width: "100%", background: "#0D1117", border: "1px solid #30363d", borderRadius: 10,
    padding: "14px 44px 14px 16px", color: "#E2E8F0", fontSize: "0.9rem",
    outline: "none", boxSizing: "border-box",
  };

  return (
    <div style={card}>
      <div style={box}>
        {success ? (
          <>
            <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
            <h2 style={{ color: "#4ADE80", fontFamily: "'Rajdhani',sans-serif", fontSize: "1.5rem", margin: "0 0 12px" }}>
              Đặt Lại Thành Công
            </h2>
            <p style={{ color: "#8b949e", fontSize: "0.9rem", marginBottom: 24 }}>{success}</p>
            <button onClick={() => navigate("/login")}
              className="nexora-btn-primary"
              style={{ padding: "14px 32px", borderRadius: 12, fontSize: "0.95rem", fontFamily: "'Rajdhani',sans-serif", letterSpacing: "0.1em" }}>
              Về Trang Đăng Nhập
            </button>
          </>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div>
              <div style={{ fontSize: 48, marginBottom: 8 }}>🔑</div>
              <h2 style={{ color: "#E2E8F0", fontFamily: "'Rajdhani',sans-serif", fontSize: "1.5rem", margin: "0 0 8px" }}>
                Đặt Lại Mật Khẩu
              </h2>
              <p style={{ color: "#8b949e", fontSize: "0.875rem", margin: 0 }}>Nhập mật khẩu mới cho tài khoản của bạn.</p>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 8, textAlign: "left" }}>
              <label style={{ color: "#A78BFA", fontSize: "0.75rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                Mật khẩu mới
              </label>
              <div style={{ position: "relative" }}>
                <input type={showPwd ? "text" : "password"} value={password}
                  onChange={e => setPassword(e.target.value)} placeholder="Ít nhất 6 ký tự"
                  style={inp} required />
                <button type="button" onClick={() => setShowPwd(!showPwd)}
                  style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#8b949e" }}>
                  <MS icon={showPwd ? "visibility_off" : "visibility"} size={18} />
                </button>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 8, textAlign: "left" }}>
              <label style={{ color: "#A78BFA", fontSize: "0.75rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                Xác nhận mật khẩu
              </label>
              <input type={showPwd ? "text" : "password"} value={confirm}
                onChange={e => setConfirm(e.target.value)} placeholder="Nhập lại mật khẩu"
                style={inp} required />
            </div>

            {error && (
              <div style={{ padding: "10px 14px", borderRadius: 9, background: "rgba(252,129,129,0.08)", border: "1px solid rgba(252,129,129,0.25)", color: "#FC8181", fontSize: "0.82rem", display: "flex", gap: 8 }}>
                <MS icon="warning" size={15} />{error}
              </div>
            )}

            <button type="submit" disabled={loading || !token}
              className="nexora-btn-primary"
              style={{ width: "100%", padding: "15px 24px", borderRadius: 12, fontSize: "0.95rem", fontFamily: "'Rajdhani',sans-serif", letterSpacing: "0.1em", display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
              {loading ? "Đang xử lý..." : <><MS icon="lock_reset" size={18} />ĐẶT LẠI MẬT KHẨU</>}
            </button>

            <button type="button" onClick={() => navigate("/login")}
              style={{ background: "none", border: "1px solid #30363d", borderRadius: 10, padding: "12px", color: "#8b949e", cursor: "pointer", fontSize: "0.85rem" }}>
              Về Trang Đăng Nhập
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
