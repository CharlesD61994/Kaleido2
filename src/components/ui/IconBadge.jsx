import Icon from "../icons/Icon";

export default function IconBadge({ name, size = 18, tone = "violet", background, color, badgeSize = 44 }) {
  const tones = {
    violet: { background: "linear-gradient(135deg, #7C3AED, #A78BFA)", color: "#fff" },
    pink: { background: "linear-gradient(135deg, #DB2777, #F472B6)", color: "#fff" },
    blue: { background: "linear-gradient(135deg, #0891B2, #22D3EE)", color: "#fff" },
    green: { background: "linear-gradient(135deg, #059669, #34D399)", color: "#fff" },
    amber: { background: "linear-gradient(135deg, #D97706, #FCD34D)", color: "#fff" },
    slate: { background: "linear-gradient(135deg, #2A2A3E, #4C4C6A)", color: "#fff" },
  };
  const resolved = tones[tone] || tones.violet;

  return (
    <div style={{
      width: badgeSize,
      height: badgeSize,
      borderRadius: 12,
      background: background || resolved.background,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0,
      boxShadow: "inset 0 1px 0 rgba(255,255,255,0.12), 0 10px 24px rgba(0,0,0,0.22)",
    }}>
      <Icon name={name} size={size} color={color || resolved.color} />
    </div>
  );
}
