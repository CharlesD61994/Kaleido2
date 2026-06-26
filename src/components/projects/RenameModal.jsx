import { useEffect, useRef, useState } from "react";
import { KALEIDOSCOPE_COLORS } from "../../constants/colors";

export default function RenameModal({ project, onConfirm, onClose }) {
const [val, setVal] = useState(project?.name || "");
const [cardTop, setCardTop] = useState(null);
const inputRef = useRef(null);
const cardRef = useRef(null);

useEffect(() => {
  if (!project) return;
  setVal(project?.name || "");
  const timer = setTimeout(() => {
    if (inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, 60);
  return () => clearTimeout(timer);
}, [project]);

useEffect(() => {
  if (!project) return;

  let rafId = 0;

  const updateCardTop = () => {
    cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(() => {
      const vv = window.visualViewport;
      const viewportTop = vv ? vv.offsetTop : 0;
      const viewportHeight = vv ? vv.height : window.innerHeight;
      const viewportWidth = vv ? vv.width : window.innerWidth;
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
}, [project, val]);

if (!project) return null;
const color = KALEIDOSCOPE_COLORS[project.colorIdx % KALEIDOSCOPE_COLORS.length];
return (
<div data-kaleido-modal-backdrop="true" style={{ position: "fixed", inset: 0, zIndex: 200, background: "var(--k-modal-backdrop)" }} onClick={onClose}>
<div
  style={{
    position: "fixed",
    top: cardTop ?? "18vh",
    left: "50%",
    transform: "translateX(-50%)",
    width: "calc(100% - 40px)",
    maxWidth: 340
  }}
>
<div
  ref={cardRef}
  onClick={e => e.stopPropagation()}
  data-kaleido-modal-card="true"
  style={{
    background: "var(--k-surface)",
    border: "1px solid var(--k-border)",
    borderRadius: 18,
    padding: 24,
    width: "100%",
    boxSizing: "border-box"
  }}
>
<h3 style={{ color: "var(--k-text)", fontFamily: "'DM Sans', sans-serif", margin: "0 0 16px" }}>Renommer le projet</h3>
<input ref={inputRef} autoFocus value={val} onFocus={e => e.target.select()} onChange={e => setVal(e.target.value)} onKeyDown={e => e.key === "Enter" && onConfirm(val)}
style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: `1px solid ${color.light}44`, background: "var(--k-field)", color: "var(--k-text)", fontSize: 16, outline: "none", boxSizing: "border-box" }} />
<div style={{ display: "flex", gap: 10, marginTop: 16, justifyContent: "flex-end", flexWrap: "wrap" }}>
<button onClick={onClose} style={{ padding: "12px 20px", minHeight: 44, borderRadius: 12, border: "1px solid var(--k-border-strong)", background: "none", color: "var(--k-muted)", cursor: "pointer", fontSize: 15 }}>Annuler</button>
<button onClick={() => onConfirm(val)} style={{ padding: "12px 20px", minHeight: 44, borderRadius: 12, border: "none", background: "linear-gradient(135deg, #7C3AED, #DB2777)", color: "#fff", cursor: "pointer", fontWeight: 600, fontSize: 15 }}>Confirmer</button>
</div>
</div>
</div>
</div>
);
}
