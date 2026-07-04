import React from "react";
import Icon from "../icons/Icon";
import ProjectBubble from "../projects/ProjectBubble";
import ProBubble from "../pro/ProBubble";
import { IOS_TOP_PADDING } from "../../styles/layout";

export default function FolderView({
  folder,
  items = [],
  mode = "personal",
  onBack,
  onItemOpen,
  onItemMenuOpen,
}) {
  const isPro = mode === "pro";

  return (
    <div style={{ background: "var(--k-bg)", color: "var(--k-text)", minHeight: "100vh", fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ padding: `${IOS_TOP_PADDING} 20px 16px`, background: "var(--k-header-gradient)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button data-kaleido-back-button="true" onClick={onBack} style={{ background: "var(--k-surface-2)", border: "1px solid var(--k-control-border)", borderRadius: 10, width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", color: "#A78BFA", cursor: "pointer", flexShrink: 0 }}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 20, color: "var(--k-text)", display: "inline-flex", alignItems: "center", gap: 8 }}>
            <Icon name="folder" size={24} color="#A78BFA" />
            {folder?.name || "Dossier"}
          </span>
        </div>
      </div>
      <div style={{ padding: "18px 16px 116px" }}>
        {items.length === 0 ? (
          <div style={{ textAlign: "center", color: "var(--k-muted-2)", padding: "54px 20px", fontSize: 14 }}>Ce dossier est vide</div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 112px)", rowGap: 16, columnGap: 14, justifyContent: "start", justifyItems: "center", alignItems: "start", width: "100%", maxWidth: 364, margin: "0 auto", transform: "translateX(-4px)" }}>
            {items.map((item) => (
              <div key={item.id}>
                {isPro ? (
                  <ProBubble project={item} onOpen={onItemOpen} onMenuOpen={onItemMenuOpen} />
                ) : (
                  <ProjectBubble project={item} onProjectClick={onItemOpen} onMenuOpen={onItemMenuOpen} mode={mode === "library" ? "library" : mode} />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
