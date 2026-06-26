const splitInstructionSegments = (text = "") => {
  const value = String(text || "");
  const parts = [];
  let depth = 0;
  let start = 0;

  for (let index = 0; index < value.length; index += 1) {
    const char = value[index];
    if (char === "(") depth += 1;
    if (char === ")") depth = Math.max(0, depth - 1);

    if (char === "," && depth === 0) {
      const raw = value.slice(start, index);
      const leading = raw.match(/^\s*/)?.[0] || "";
      const trailing = raw.match(/\s*$/)?.[0] || "";
      const body = raw.trim();
      if (body) parts.push({ leading, body, trailing, separator: value[index] });
      start = index + 1;
    }
  }

  const raw = value.slice(start);
  const leading = raw.match(/^\s*/)?.[0] || "";
  const trailing = raw.match(/\s*$/)?.[0] || "";
  const body = raw.trim();
  if (body) parts.push({ leading, body, trailing, separator: "" });

  return parts;
};

export default function InstructionHighlighter({ text, selectedIndex, onSelect, color }) {
  const parts = splitInstructionSegments(text);

  if (!parts.length) {
    return <span>{text}</span>;
  }

  return (
    <span>
      {parts.map((part, index) => {
        const selected = selectedIndex === index;
        return (
          <span key={`${part.body}-${index}`}>
            {part.leading}
            <button
              type="button"
              onClick={() => onSelect(index)}
              style={{
                display: "inline",
                border: "none",
                borderRadius: 8,
                padding: "0 2px",
                margin: 0,
                background: selected ? `linear-gradient(135deg, ${color.bg}, ${color.light})` : "transparent",
                color: selected ? "#fff" : "var(--k-text)",
                font: "inherit",
                lineHeight: "inherit",
                cursor: "pointer",
                boxShadow: selected ? `0 0 0 2px ${color.bg}55, 0 0 18px ${color.bg}55` : "none",
                textDecoration: selected ? "none" : "none",
                textUnderlineOffset: 3,
              }}
            >
              {part.body}
            </button>
            {part.trailing}
            {part.separator}
          </span>
        );
      })}
    </span>
  );
}
