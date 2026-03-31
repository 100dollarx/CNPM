import { useState } from "react";
import LoginPage     from "./LoginPage";       // light kinetic red
import LoginPageDark from "./LoginPageDark";   // dark kinetic red

export default function App() {
  const [dark, setDark] = useState(true); // đổi thành false để xem light

  return (
    <>
      {/* Nút switch tạm thời để preview 2 trang */}
      <button
        onClick={() => setDark(!dark)}
        style={{
          position: "fixed", top: 12, left: "50%", transform: "translateX(-50%)",
          zIndex: 9999, padding: "6px 18px", borderRadius: "9999px",
          background: dark ? "#E94560" : "#191c20",
          color: "#fff", fontWeight: 700, fontSize: "12px",
          border: "none", cursor: "pointer", letterSpacing: "0.05em",
          boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
        }}
      >
        Xem: {dark ? "🌙 DARK" : "☀️ LIGHT"} — nhấn để đổi
      </button>

      {dark ? <LoginPageDark /> : <LoginPage />}
    </>
  );
}
