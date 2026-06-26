import React, { useEffect, useState } from "react";
import Icon from "../icons/Icon";
import { KALEIDOSCOPE_COLORS } from "../../constants/colors";
import { getCachedImage, loadImage } from "../../services/mediaStore";
import { getProjectCachedImage, getProjectDirectImage } from "../../utils/projectImages";

const ProjectBubble = React.memo(function ProjectBubble({ project, onMenuOpen, onProjectClick, mode }) {
const color = KALEIDOSCOPE_COLORS[project.colorIdx % KALEIDOSCOPE_COLORS.length];
const isLibrary = mode === "library";
const libraryBubbleSize = "clamp(96px, 28vw, 110px)";
const size = libraryBubbleSize;
const [resolvedImage, setResolvedImage] = useState(() => getProjectCachedImage(project));
const isCompleted = !isLibrary && (
  project?.status === "termine"
);

useEffect(() => {
let cancelled = false;
const directImage = getProjectDirectImage(project);
if (directImage) {
  setResolvedImage(directImage);
  return;
}
const imageId = project?.image?.imageId;
const previewId = project?.image?.previewId;
const cachedPreview = getCachedImage(previewId);
if (cachedPreview) {
  setResolvedImage(cachedPreview);
  return;
}
const cachedImage = getCachedImage(imageId);
if (cachedImage) {
  setResolvedImage(cachedImage);
  return;
}
if (previewId) {
  loadImage(previewId).then((data) => {
    if (!cancelled && data) setResolvedImage(data);
  });
  return () => { cancelled = true; };
}
if (!imageId) {
  setResolvedImage(null);
  return;
}
loadImage(imageId).then((data) => {
  if (!cancelled) setResolvedImage(data || null);
});
return () => { cancelled = true; };
}, [project?.image]);
const glowOpacity = isCompleted ? 0.16 : 1;
const glowNear = 10;
const glowFar = 22;
const ringShadow = isLibrary ? 8 : 5;
const bubbleLift = isLibrary ? 3 : 2;
const progress = (typeof project?.rang === "number" && typeof project?.total === "number" && project.total > 0)
  ? Math.max(0, Math.min(100, Math.round((project.rang / project.total) * 100)))
  : (typeof project?.progress === "number" ? Math.max(0, Math.min(100, Math.round(project.progress))) : 0);
return (
<div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, padding: isLibrary ? "12px 4px 14px" : "8px 4px 8px", cursor: "default" }}>
  <div style={{ position: "relative", width: size, height: size, overflow: "visible", isolation: "isolate" }}>
    <div
      style={{ position: "absolute", inset: 0, transition: "transform 220ms cubic-bezier(0.22, 1, 0.36, 1), filter 220ms ease", filter: "saturate(1.02)" }}
      onClick={() => onProjectClick && onProjectClick(project)}
      onTouchStart={(e) => { e.currentTarget.style.transform = "scale(0.94) translateY(3px)"; e.currentTarget.style.filter = "saturate(1.1) brightness(1.07)"; }}
      onTouchEnd={(e) => { e.currentTarget.style.transform = "scale(1) translateY(0)"; e.currentTarget.style.filter = "saturate(1.02)"; }}
      onTouchCancel={(e) => { e.currentTarget.style.transform = "scale(1) translateY(0)"; e.currentTarget.style.filter = "saturate(1.02)"; }}
      onMouseDown={(e) => { e.currentTarget.style.transform = "scale(0.944) translateY(3px)"; e.currentTarget.style.filter = "saturate(1.1) brightness(1.07)"; }}
      onMouseUp={(e) => { e.currentTarget.style.transform = "scale(1) translateY(0)"; e.currentTarget.style.filter = "saturate(1.02)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1) translateY(0)"; e.currentTarget.style.filter = "saturate(1.02)"; }}
    >
      <div style={{ position: "relative", width: size, height: size, overflow: "visible", isolation: "isolate" }}>
        <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: "100%", height: "100%", borderRadius: "50%", pointerEvents: "none", zIndex: 0, opacity: glowOpacity, background: `radial-gradient(circle, ${color.bg}66 0%, ${color.bg}2A 40%, transparent 66%)`, boxShadow: isCompleted ? "none" : `0 0 ${glowNear}px ${color.bg}66, 0 0 ${glowFar}px ${color.bg}33`, willChange: "transform, opacity, box-shadow" }} />
        <div style={{ width: isLibrary ? "88%" : "86%", height: isLibrary ? "88%" : "86%", borderRadius: "50%", background: isLibrary ? "linear-gradient(180deg, rgba(255,255,255,0.14), rgba(255,255,255,0.04))" : `radial-gradient(circle at 35% 35%, ${color.light}38, ${color.bg}CC)`, boxShadow: isLibrary ? `0 ${bubbleLift}px ${18 + ringShadow}px rgba(0,0,0,0.24), 0 0 0 1.5px rgba(255,255,255,0.16), inset 0 1px 0 rgba(255,255,255,0.26), inset 0 -16px 24px rgba(0,0,0,0.1)` : `0 2px 21px rgba(0,0,0,0.20), 0 0 0 1px ${color.light}22, inset 0 1px 2px rgba(255,255,255,0.08)`, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", transition: "transform 220ms cubic-bezier(0.22, 1, 0.36, 1), box-shadow 220ms cubic-bezier(0.22, 1, 0.36, 1)", willChange: "transform, box-shadow", zIndex: 1, backdropFilter: isLibrary ? "blur(10px)" : "none" }}>
          {resolvedImage ? <img src={resolvedImage} alt={project.name} loading="lazy" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%", display: "block", filter: isCompleted ? "grayscale(0.45) saturate(0.55) brightness(0.62)" : isLibrary ? "saturate(1.02) contrast(1.03)" : "none" }} /> : <span style={{ color: "#F8F7FF", display: "flex", alignItems: "center", justifyContent: "center", opacity: isCompleted ? 0.55 : 1 }}><Icon name="yarn" size={36} color="#F8F7FF" /></span>}
          {isCompleted && <div style={{ position: "absolute", inset: 0, borderRadius: "50%", background: "rgba(5,5,12,0.42)", pointerEvents: "none" }} />}
          {isLibrary && <div style={{ position: "absolute", inset: 0, borderRadius: "50%", background: "linear-gradient(180deg, rgba(255,255,255,0.18), rgba(255,255,255,0.03) 36%, rgba(255,255,255,0) 56%)", pointerEvents: "none" }} />}
        </div>
        {!isLibrary && (
          <svg style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 2 }} viewBox="0 0 110 110">
            <circle cx="55" cy="55" r="51" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="5" />
            <circle cx="55" cy="55" r="51" fill="none" stroke={color.light} strokeWidth="5"
              strokeDasharray={2 * Math.PI * 51}
              strokeDashoffset={2 * Math.PI * 51 * (1 - progress / 100)}
              strokeLinecap="round" transform="rotate(-90 55 55)"
              style={{ opacity: isCompleted ? 0.34 : 1, transition: "stroke-dashoffset 0.56s cubic-bezier(0.22, 1, 0.36, 1)", filter: isCompleted ? "none" : `drop-shadow(0 0 4px ${color.light})` }} />
          </svg>
        )}
      </div>
    </div>
    {onMenuOpen && <button onClick={(e) => { e.stopPropagation(); onMenuOpen(project, e); }}
      style={{ position: "absolute", top: isLibrary ? -6 : -6, right: isLibrary ? -6 : -6, transform: "translate(12%, -20%)", width: 24, height: 24, borderRadius: "50%", background: isCompleted ? "linear-gradient(135deg, #403B4D, #242231)" : `linear-gradient(135deg, ${color.light}, ${color.bg})`, border: "2.5px solid #0D0D1A", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontStyle: "italic", fontWeight: 700, color: isCompleted ? "#9B95AA" : "#fff", boxShadow: isCompleted ? "0 4px 10px rgba(0,0,0,0.28)" : "0 6px 14px rgba(0,0,0,0.35)", animation: isCompleted ? "none" : "infoBob 2.6s ease-in-out infinite", transition: "transform 220ms cubic-bezier(0.22, 1, 0.36, 1), box-shadow 220ms cubic-bezier(0.22, 1, 0.36, 1), filter 220ms ease", zIndex: 10 }}
      onTouchStart={(e) => { e.stopPropagation(); e.currentTarget.style.transform = "translate(12%, -20%) scale(0.92)"; e.currentTarget.style.boxShadow = "0 4px 10px rgba(0,0,0,0.30)"; e.currentTarget.style.filter = "brightness(1.04)"; }}
      onTouchEnd={(e) => { e.currentTarget.style.transform = "translate(12%, -20%) scale(1)"; e.currentTarget.style.boxShadow = "0 6px 14px rgba(0,0,0,0.35)"; e.currentTarget.style.filter = "brightness(1)"; }}
      onTouchCancel={(e) => { e.currentTarget.style.transform = "translate(12%, -20%) scale(1)"; e.currentTarget.style.boxShadow = "0 6px 14px rgba(0,0,0,0.35)"; e.currentTarget.style.filter = "brightness(1)"; }}
      onMouseDown={(e) => { e.stopPropagation(); e.currentTarget.style.transform = "translate(12%, -20%) scale(0.94)"; e.currentTarget.style.boxShadow = "0 4px 10px rgba(0,0,0,0.30)"; e.currentTarget.style.filter = "brightness(1.04)"; }}
      onMouseUp={(e) => { e.currentTarget.style.transform = "translate(12%, -20%) scale(1)"; e.currentTarget.style.boxShadow = "0 6px 14px rgba(0,0,0,0.35)"; e.currentTarget.style.filter = "brightness(1)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.transform = "translate(12%, -20%) scale(1)"; e.currentTarget.style.boxShadow = "0 6px 14px rgba(0,0,0,0.35)"; e.currentTarget.style.filter = "brightness(1)"; }}>i</button>}
  </div>
  <div
    style={{ textAlign: "center", width: size, maxWidth: 112, transition: "transform 220ms cubic-bezier(0.22, 1, 0.36, 1), filter 220ms ease", filter: "saturate(1.02)" }}
    onClick={() => onProjectClick && onProjectClick(project)}
    onTouchStart={(e) => { e.currentTarget.style.transform = "scale(0.94) translateY(3px)"; e.currentTarget.style.filter = "saturate(1.1) brightness(1.07)"; }}
    onTouchEnd={(e) => { e.currentTarget.style.transform = "scale(1) translateY(0)"; e.currentTarget.style.filter = "saturate(1.02)"; }}
    onTouchCancel={(e) => { e.currentTarget.style.transform = "scale(1) translateY(0)"; e.currentTarget.style.filter = "saturate(1.02)"; }}
    onMouseDown={(e) => { e.currentTarget.style.transform = "scale(0.944) translateY(3px)"; e.currentTarget.style.filter = "saturate(1.1) brightness(1.07)"; }}
    onMouseUp={(e) => { e.currentTarget.style.transform = "scale(1) translateY(0)"; e.currentTarget.style.filter = "saturate(1.02)"; }}
    onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1) translateY(0)"; e.currentTarget.style.filter = "saturate(1.02)"; }}
  >
    <div style={{ color: isCompleted ? "#8F8A9D" : "#F1F0EE", fontSize: "clamp(10px, 2.8vw, 12px)", fontFamily: "'DM Sans', sans-serif", fontWeight: isLibrary ? 500 : 500, letterSpacing: isLibrary ? "-0.01em" : "normal", textShadow: isLibrary ? "0 1px 12px rgba(0,0,0,0.28)" : "none" }}>{project.name}</div>
    {mode === "pro" && project.client && <div style={{ color: color.light, fontSize: 10, marginTop: 1, fontFamily: "monospace" }}>{project.client}</div>}
  </div>
</div>
);
});


export default ProjectBubble;
