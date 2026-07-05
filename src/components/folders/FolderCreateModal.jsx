import { useEffect, useRef, useState } from "react";
import { KALEIDOSCOPE_COLORS } from "../../constants/colors";

export default function FolderCreateModal({ sectionLabel = "cette section", onClose, onCreate }) {
  const [val, setVal] = useState("");
  const [cardTop, setCardTop] = useState(null);
  const inputRef = useRef(null);
  const cardRef = useRef(null);
  const color = KALEIDOSCOPE_COLORS[4 % KALEIDOSCOPE_COLORS.length];

  useEffect(() => {
    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 60);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    let rafId = 0;

    const updateCardTop = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        const vv = window.visualViewport;
        const viewportTop = vv ? vv.offsetTop : 0;
        const viewportHeight = vv ? vv.height : window.innerHeight;
        const cardHeight = cardRef.current?.offsetHeight || 0;
        const keyboardHeight = Math.max(0, window.innerHeight - viewportHeight - viewportTop);
        const isKeyboardOpen = keyboardHeight > 120;
        const topMargin = 24;
        const bottomMargin = 16;

        if (!cardHeight) {
          setCardTop(viewportTop + (isKeyboardOpen ? 40 : Math.max(topMargin, viewportHeight * 0.18)));
          return;
        }

        const centeredTop = viewportTop + Math.max(topMargin, (viewportHeight - cardHeight) / 2);
        const bottomAnchoredTop = viewportTop + viewportHeight - cardHeight - bottomMargin;
        const maxAllowedTop = viewportTop + viewportHeight - cardHeight - bottomMargin;

        const resolvedTop = isKeyboardOpen
          ? Math.max(topMargin, Math.min(bottomAnchoredTop, maxAllowedTop))
          : Math.max(topMargin, Math.min(centeredTop, maxAllowedTop));

        setCardTop(resolvedTop);
      });
    };

    updateCardTop();

    const vv = window.visualViewport;
    vv?.addEventListener("resize", updateCardTop);
    vv?.addEventListener("scroll", updateCardTop);
    window.addEventListener("resize", updateCardTop);

    return () => {
      cancelAnimationFrame(rafId);
      vv?.removeEventListener("resize", updateCardTop);
      vv?.removeEventListener("scroll", updateCardTop);
      window.removeEventListener("resize", updateCardTop);
    };
  }, [val]);

  const submit = () => {
    const cleanName = val.trim();
    if (!cleanName) return;
    onCreate?.(cleanName);
    setVal("");
  };

  return (
    <div data-kaleido-modal-backdrop="true" style={{ position: "fixed", inset: 0, zIndex: 200, background: "var(--k-modal-backdrop)" }} onClick={onClose}>
      <div
        style={{
          position: "fixed",
          top: cardTop ?? "18vh",
          left: "50%",
          transform: "translateX(-50%)",
          width: "calc(100% - 40px)",
          maxWidth: 340,
        }}
      >
        <div
          ref={cardRef}
          onClick={(event) => event.stopPropagation()}
          data-kaleido-modal-card="true"
          style={{
            background: "var(--k-surface)",
            border: "1px solid var(--k-border)",
            borderRadius: 18,
            padding: 24,
            width: "100%",
            boxSizing: "border-box",
          }}
        >
          <h3 style={{ color: "var(--k-text)", fontFamily: "'DM Sans', sans-serif", margin: "0 0 6px" }}>Nouveau dossier</h3>
          <div style={{ color: "var(--k-muted)", fontSize: 13, marginBottom: 16 }}>Dans {sectionLabel}</div>
          <input
            ref={inputRef}
            autoFocus
            value={val}
            onChange={(event) => setVal(event.target.value)}
            onKeyDown={(event) => { if (event.key === "Enter") submit(); }}
            placeholder="Nom du dossier"
            style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: `1px solid ${color.light}44`, background: "var(--k-field)", color: "var(--k-text)", fontSize: 16, outline: "none", boxSizing: "border-box" }}
          />
          <div style={{ display: "flex", gap: 10, marginTop: 16, justifyContent: "flex-end", flexWrap: "wrap" }}>
            <button onClick={onClose} style={{ padding: "12px 20px", minHeight: 44, borderRadius: 12, border: "1px solid var(--k-border-strong)", background: "none", color: "var(--k-muted)", cursor: "pointer", fontSize: 15 }}>Annuler</button>
            <button onClick={submit} disabled={!val.trim()} style={{ padding: "12px 20px", minHeight: 44, borderRadius: 12, border: "none", background: val.trim() ? "linear-gradient(135deg, #7C3AED, #DB2777)" : "var(--k-muted-fill)", color: "#fff", cursor: val.trim() ? "pointer" : "not-allowed", fontWeight: 600, fontSize: 15 }}>Confirmer</button>
          </div>
        </div>
      </div>
    </div>
  );
}
