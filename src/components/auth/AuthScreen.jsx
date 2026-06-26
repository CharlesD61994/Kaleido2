import { useState } from "react";
import { supabase } from "../../services/supabaseClient";
import { LOGO_SRC } from "../splash/SplashScreen";

export default function AuthScreen({ disabled = false }) {
  const [mode, setMode] = useState("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  const isSignup = mode === "signup";

  const submit = async (event) => {
    event.preventDefault();
    if (disabled || !supabase || busy) return;

    setBusy(true);
    setStatus("");

    const credentials = {
      email: email.trim(),
      password,
    };

    const { error } = isSignup
      ? await supabase.auth.signUp(credentials)
      : await supabase.auth.signInWithPassword(credentials);

    setBusy(false);

    if (error) {
      setStatus(error.message || "Connexion impossible.");
      return;
    }

    setStatus(isSignup ? "Compte créé. Vérifie tes courriels si Supabase demande une confirmation." : "Connexion réussie.");
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0D0D1A",
        color: "#F1F0EE",
        fontFamily: "'DM Sans', sans-serif",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 22,
      }}
    >
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=Syne:wght@700;800&display=swap'); * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; } input { font-size: 16px !important; }`}</style>
      <form
        onSubmit={submit}
        style={{
          width: "100%",
          maxWidth: 430,
          borderRadius: 26,
          background: "linear-gradient(135deg, rgba(30,30,50,0.98), rgba(20,20,36,0.96))",
          border: "1px solid rgba(255,255,255,0.10)",
          padding: 22,
          boxShadow: "0 24px 70px rgba(0,0,0,0.42), inset 0 1px 0 rgba(255,255,255,0.06)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 22 }}>
          <img src={LOGO_SRC} alt="Kaleido" style={{ width: 54, height: 54, borderRadius: "50%", objectFit: "cover", border: "2px solid #7C3AED55" }} />
          <div>
            <h1 style={{ margin: 0, fontFamily: "'Syne', sans-serif", fontSize: 26, letterSpacing: 0 }}>
              Kaleido
            </h1>
            <div style={{ color: "#A8A6B8", fontSize: 13, marginTop: 2 }}>
              {isSignup ? "Créer ton compte" : "Connexion à ton compte"}
            </div>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 18 }}>
          <button
            type="button"
            onClick={() => setMode("signin")}
            style={{
              border: mode === "signin" ? "1px solid #A78BFA66" : "1px solid rgba(255,255,255,0.08)",
              borderRadius: 14,
              background: mode === "signin" ? "rgba(167,139,250,0.18)" : "rgba(255,255,255,0.05)",
              color: "#F1F0EE",
              padding: "12px 10px",
              fontWeight: 800,
              cursor: "pointer",
            }}
          >
            Connexion
          </button>
          <button
            type="button"
            onClick={() => setMode("signup")}
            style={{
              border: mode === "signup" ? "1px solid #A78BFA66" : "1px solid rgba(255,255,255,0.08)",
              borderRadius: 14,
              background: mode === "signup" ? "rgba(167,139,250,0.18)" : "rgba(255,255,255,0.05)",
              color: "#F1F0EE",
              padding: "12px 10px",
              fontWeight: 800,
              cursor: "pointer",
            }}
          >
            Créer
          </button>
        </div>

        <label style={{ display: "block", color: "#A8A6B8", fontSize: 12, fontWeight: 800, marginBottom: 7 }}>
          Courriel
        </label>
        <input
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          type="email"
          autoComplete="email"
          required
          style={{
            width: "100%",
            border: "1.5px solid rgba(255,255,255,0.10)",
            borderRadius: 15,
            background: "rgba(13,13,26,0.72)",
            color: "#F1F0EE",
            padding: 14,
            outline: "none",
            marginBottom: 14,
          }}
        />

        <label style={{ display: "block", color: "#A8A6B8", fontSize: 12, fontWeight: 800, marginBottom: 7 }}>
          Mot de passe
        </label>
        <input
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          type="password"
          autoComplete={isSignup ? "new-password" : "current-password"}
          minLength={6}
          required
          style={{
            width: "100%",
            border: "1.5px solid rgba(255,255,255,0.10)",
            borderRadius: 15,
            background: "rgba(13,13,26,0.72)",
            color: "#F1F0EE",
            padding: 14,
            outline: "none",
            marginBottom: 18,
          }}
        />

        <button
          type="submit"
          disabled={disabled || busy}
          style={{
            width: "100%",
            border: "1px solid #A78BFA55",
            borderRadius: 16,
            background: "linear-gradient(135deg, #7C3AED, #EC4899)",
            color: "#fff",
            padding: "15px 14px",
            fontSize: 15,
            fontWeight: 900,
            cursor: busy ? "wait" : "pointer",
            opacity: disabled || busy ? 0.65 : 1,
            boxShadow: "0 16px 34px rgba(124,58,237,0.34)",
          }}
        >
          {busy ? "Un instant..." : isSignup ? "Créer mon compte" : "Me connecter"}
        </button>

        <div style={{ color: status.includes("impossible") || status.includes("Invalid") ? "#FCA5A5" : "#A8A6B8", fontSize: 12, lineHeight: 1.4, marginTop: 14, minHeight: 18 }}>
          {disabled ? "Supabase doit être configuré pour activer les comptes." : status}
        </div>
      </form>
    </div>
  );
}
