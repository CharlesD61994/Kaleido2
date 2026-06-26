import React from "react";
import Icon from "../icons/Icon";
import ProBubbleMenuButton from "./ProBubbleMenuButton";
import useProjectImage from "./useProjectImage";
import { KALEIDOSCOPE_COLORS } from "../../constants/colors";
import { computeProgress } from "../../services/progressStore";

const ProBubble = React.memo(function ProBubble({ project, unreadClientMessageCount = 0, onOpen, onMenuOpen }) {
  const color = KALEIDOSCOPE_COLORS[(project?.colorIdx || 0) % KALEIDOSCOPE_COLORS.length];
  const progress = computeProgress(project);
  const isCompleted = project?.status === "termine";
  const size = "clamp(96px, 28vw, 110px)";
  const resolvedImage = useProjectImage(project);
  const unreadLabel = unreadClientMessageCount > 99 ? "99+" : String(unreadClientMessageCount);

  const handleOpen = () => {
    if (typeof onOpen === "function") onOpen(project);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, padding: "10px 4px 14px" }}>
      <div style={{ position: "relative", width: size, height: size, overflow: "visible", isolation: "isolate" }}>
        <button onClick={handleOpen} style={{ position: "absolute", inset: 0, overflow: "visible", isolation: "isolate", background: "none", border: "none", padding: 0, cursor: "pointer" }}>
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: "100%",
              height: "100%",
              borderRadius: "50%",
              pointerEvents: "none",
              zIndex: 0,
              opacity: isCompleted ? 0.16 : 1,
              background: `radial-gradient(circle, ${color.bg}66 0%, ${color.bg}2A 40%, transparent 66%)`,
              boxShadow: isCompleted ? "none" : `0 0 10px ${color.bg}66, 0 0 22px ${color.bg}33`,
            }}
          />

          <div
            style={{
              width: "86%",
              height: "86%",
              borderRadius: "50%",
              background: `radial-gradient(circle at 35% 35%, ${color.light}38, ${color.bg}CC)`,
              boxShadow: isCompleted ? "0 2px 16px rgba(0,0,0,0.30), 0 0 0 1px rgba(255,255,255,0.06)" : `0 2px 21px rgba(0,0,0,0.20), 0 0 0 1px ${color.light}22, inset 0 1px 2px rgba(255,255,255,0.08)`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden",
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              zIndex: 1,
            }}
          >
            {resolvedImage ? (
              <img src={resolvedImage} alt={project?.name || "Projet"} loading="lazy" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%", display: "block", filter: isCompleted ? "grayscale(0.45) saturate(0.55) brightness(0.62)" : "none" }} />
            ) : (
              <span style={{ color: "#F8F7FF", display: "flex", alignItems: "center", justifyContent: "center", opacity: isCompleted ? 0.55 : 1 }}>
                <Icon name="yarn" size={36} />
              </span>
            )}
            {isCompleted ? <div style={{ position: "absolute", inset: 0, borderRadius: "50%", background: "rgba(5,5,12,0.42)", pointerEvents: "none" }} /> : null}
            {unreadClientMessageCount > 0 ? (
              <div
                aria-label={`${unreadClientMessageCount} message client non lu`}
                style={{
                  position: "absolute",
                  top: 0,
                  right: 0,
                  width: "54%",
                  height: "54%",
                  borderRadius: "0 50% 0 100%",
                  background: "#F43F5E",
                  borderLeft: "4px solid #171426",
                  borderBottom: "4px solid #171426",
                  boxShadow: "0 0 0 1px rgba(255,255,255,0.05), 0 0 20px rgba(244,63,94,0.62)",
                  color: "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: unreadClientMessageCount > 99 ? 13 : 19,
                  fontWeight: 900,
                  lineHeight: 1,
                  zIndex: 4,
                  pointerEvents: "none",
                }}
              >
                {unreadLabel}
              </div>
            ) : null}
          </div>

          <svg style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 2 }} viewBox="0 0 110 110">
            <circle cx="55" cy="55" r="51" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="5" />
            <circle
              cx="55"
              cy="55"
              r="51"
              fill="none"
              stroke={color.light}
              strokeWidth="5"
              strokeDasharray={2 * Math.PI * 51}
              strokeDashoffset={2 * Math.PI * 51 * (1 - progress / 100)}
              strokeLinecap="round"
              transform="rotate(-90 55 55)"
              style={{ opacity: isCompleted ? 0.34 : 1, transition: "stroke-dashoffset 0.56s cubic-bezier(0.22, 1, 0.36, 1)", filter: isCompleted ? "none" : `drop-shadow(0 0 4px ${color.light})` }}
            />
          </svg>
        </button>

        <ProBubbleMenuButton color={color} project={project} onMenuOpen={onMenuOpen} />
      </div>

      <button onClick={handleOpen} style={{ background: "none", border: "none", padding: 0, cursor: "pointer", textAlign: "center", width: size, maxWidth: 112 }}>
        <div style={{ color: isCompleted ? "#8F8A9D" : "#F1F0EE", fontSize: "clamp(10px, 2.8vw, 12px)", fontFamily: "'DM Sans', sans-serif", fontWeight: 500 }}>
          {project?.name || "Projet sans nom"}
        </div>
        {project?.client ? (
          <div style={{ color: color.light, fontSize: 10, marginTop: 1, fontFamily: "monospace" }}>
            {project.client}
          </div>
        ) : null}
      </button>
    </div>
  );
});

export default ProBubble;
