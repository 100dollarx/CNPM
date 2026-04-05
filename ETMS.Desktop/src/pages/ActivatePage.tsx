import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { useTheme } from "../contexts/ThemeContext";
import { getTokens, NEXORA_GLOBAL_CSS } from "../theme";

type State = "loading" | "success" | "error" | "invalid";


export default function ActivatePage() {
  const { dark } = useTheme();
  const c = getTokens(dark);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [state, setState] = useState<State>("loading");
  const [message, setMessage] = useState("");
  const [username, setUsername] = useState("");

  useEffect(() => {
    const token = searchParams.get("token");
    if (!token) { setState("invalid"); return; }

    // AbortController để cancel request cũ khi React Strict Mode gọi lại useEffect
    const controller = new AbortController();
    let ignore = false;

    fetch(`/api/auth/activate?token=${encodeURIComponent(token)}`, { signal: controller.signal })
      .then(async res => {
        if (ignore) return;
        const data = await res.json();
        if (res.ok) {
          setUsername(data.username ?? "");
          setMessage(data.message ?? "Tài khoản đã được kích hoạt thành công!");
          setState("success");
        } else {
          setMessage(data.error ?? "Link kích hoạt không hợp lệ hoặc đã hết hạn.");
          setState("error");
        }
      })
      .catch((err) => {
        if (ignore || err.name === 'AbortError') return;
        setMessage("Không thể kết nối đến server.");
        setState("error");
      });

    return () => { ignore = true; controller.abort(); };
  }, [searchParams]);

  const cardStyle: React.CSSProperties = {
    maxWidth: 440, width: "100%",
    background: dark ? "rgba(13,17,23,0.9)" : "rgba(255,255,255,0.95)",
    backdropFilter: "blur(24px)", borderRadius: 20,
    border: `1px solid ${c.panelBorder}`,
    boxShadow: dark ? "0 32px 80px rgba(0,0,0,0.5)" : "0 20px 40px rgba(0,0,0,0.06)",
    padding: "48px 40px", textAlign: "center", animation: "slide-in 0.4s ease",
  };

  return (
    <>
      <style>{NEXORA_GLOBAL_CSS}</style>
      <main style={{ minHeight: "100vh", display: "flex", alignItems: "center",
                     justifyContent: "center", background: dark ? "#080A0F" : "#F1F3F8", padding: 24 }}>
        <div style={cardStyle}>
          {state === "loading" && (
            <>
              <svg style={{ width: 48, height: 48, animation: "spin 0.8s linear infinite", margin: "0 auto 24px" }}
                   viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="rgba(124,58,237,0.2)" strokeWidth="3" />
                <path d="M4 12a8 8 0 018-8" stroke="#7C3AED" strokeWidth="3" strokeLinecap="round" />
              </svg>
              <p style={{ color: c.onSurfaceVar }}>Đang xác thực token...</p>
            </>
          )}

          {state === "success" && (
            <>
              <div style={{ fontSize: 64, marginBottom: 16 }}>✅</div>
              <h2 style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: "1.6rem", fontWeight: 700,
                           color: "#22D3EE", marginBottom: 12 }}>Kích Hoạt Thành Công!</h2>
              {username && (
                <p style={{ color: "#A78BFA", fontWeight: 600, marginBottom: 8 }}>
                  Chào mừng, <strong>{username}</strong>!
                </p>
              )}
              <p style={{ color: c.onSurfaceVar, lineHeight: 1.6, marginBottom: 28 }}>{message}</p>
              <button onClick={() => navigate("/login")} className="nexora-btn-primary"
                style={{ padding: "12px 32px", borderRadius: 10, fontSize: "0.95rem",
                         fontFamily: "'Rajdhani',sans-serif", letterSpacing: "0.08em" }}>
                Đăng Nhập Ngay
              </button>
            </>
          )}

          {(state === "error" || state === "invalid") && (
            <>
              <div style={{ fontSize: 64, marginBottom: 16 }}>❌</div>
              <h2 style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: "1.5rem", fontWeight: 700,
                           color: "#FC8181", marginBottom: 12 }}>Kích Hoạt Thất Bại</h2>
              <p style={{ color: c.onSurfaceVar, lineHeight: 1.6, marginBottom: 24 }}>{message}</p>
              <div style={{ background: "rgba(252,129,129,0.08)", border: "1px solid rgba(252,129,129,0.2)",
                            borderRadius: 10, padding: "12px 16px", marginBottom: 24,
                            fontSize: "0.85rem", color: "#FC8181" }}>
                💡 Link có hiệu lực <strong>24 giờ</strong>. Nếu hết hạn, liên hệ Admin để được cấp lại.
              </div>
              <button onClick={() => navigate("/login")}
                style={{ padding: "12px 32px", borderRadius: 10, fontSize: "0.9rem",
                         fontFamily: "'Rajdhani',sans-serif", background: "none",
                         border: `1px solid ${c.panelBorder}`, color: c.onSurface,
                         cursor: "pointer" }}>
                Về Trang Đăng Nhập
              </button>
            </>
          )}
        </div>
      </main>
    </>
  );
}
