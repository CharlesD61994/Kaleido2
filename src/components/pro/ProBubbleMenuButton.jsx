export default function ProBubbleMenuButton({ color, project, onMenuOpen }) {
  if (typeof onMenuOpen !== "function") return null;
  const isCompleted = project?.status === "termine";

  const resetPress = (target) => {
    target.style.transform = "translate(12%, -20%) scale(1)";
    target.style.boxShadow = "0 6px 14px rgba(0,0,0,0.35)";
    target.style.filter = "brightness(1)";
  };

  const press = (target, scale) => {
    target.style.transform = `translate(12%, -20%) scale(${scale})`;
    target.style.boxShadow = "0 4px 10px rgba(0,0,0,0.30)";
    target.style.filter = "brightness(1.04)";
  };

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onMenuOpen(project, e);
      }}
      onTouchStart={(e) => {
        e.stopPropagation();
        press(e.currentTarget, 0.92);
      }}
      onTouchEnd={(e) => resetPress(e.currentTarget)}
      onTouchCancel={(e) => resetPress(e.currentTarget)}
      onMouseDown={(e) => {
        e.stopPropagation();
        press(e.currentTarget, 0.94);
      }}
      onMouseUp={(e) => resetPress(e.currentTarget)}
      onMouseLeave={(e) => resetPress(e.currentTarget)}
      style={{
        position: "absolute",
        top: -6,
        right: -6,
        transform: "translate(12%, -20%)",
        width: 24,
        height: 24,
        borderRadius: "50%",
        background: isCompleted ? "linear-gradient(135deg, #403B4D, #242231)" : `linear-gradient(135deg, ${color.light}, ${color.bg})`,
        border: "2.5px solid #0D0D1A",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 11,
        fontStyle: "italic",
        fontWeight: 700,
        color: isCompleted ? "#9B95AA" : "#fff",
        boxShadow: isCompleted ? "0 4px 10px rgba(0,0,0,0.28)" : "0 6px 14px rgba(0,0,0,0.35)",
        transition: "transform 220ms cubic-bezier(0.22, 1, 0.36, 1), box-shadow 220ms cubic-bezier(0.22, 1, 0.36, 1), filter 220ms ease",
        zIndex: 10,
        padding: 0,
      }}
    >
      i
    </button>
  );
}
