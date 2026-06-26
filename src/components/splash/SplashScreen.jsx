import React from "react";

export const LOGO_SRC = "/kaleido-logo.jpg";

export default function SplashScreen({ fading }) {
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 9999,
      background: "#0D0D1A",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      gap: 20,
      opacity: fading ? 0 : 1,
      transition: "opacity 0.4s ease",
    }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&display=swap'); @keyframes splashPulse { 0%,100% { transform: scale(1); } 50% { transform: scale(1.06); } } @keyframes splashGlow { 0%,100% { box-shadow: 0 0 30px #7C3AED88; } 50% { box-shadow: 0 0 60px #7C3AED, 0 0 80px #EC489966; } } .splash-logo { animation: splashPulse 1.8s ease-in-out infinite, splashGlow 1.8s ease-in-out infinite; }`}</style>
      <img
        className="splash-logo"
        src={LOGO_SRC}
        alt="Kaleido"
        style={{ width: 96, height: 96, borderRadius: "50%", objectFit: "cover", border: "3px solid #7C3AED44" }}
        onError={(event) => { event.target.style.display = "none"; }}
      />
      <span style={{
        fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 36,
        background: "linear-gradient(135deg, #A78BFA, #F472B6)",
        WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent"
      }}>Kaleido</span>
      <div style={{
        width: 40, height: 3, borderRadius: 2,
        background: "linear-gradient(90deg, #7C3AED, #EC4899)",
        animation: "splashPulse 1.8s ease-in-out infinite"
      }} />
    </div>
  );
}
