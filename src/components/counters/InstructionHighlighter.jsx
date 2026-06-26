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
  const lines = String(text || "").split(/\r?\n/).map((line) => splitInstructionSegments(line));
  const hasParts = lines.some((line) => line.length > 0);

  if (!hasParts) {
    return <span>{text}</span>;
  }

  let segmentIndex = -1;

  return (
    <span style={{ display: "block" }}>
      {lines.map((parts, lineIndex) => (
        <span key={`line-${lineIndex}`} style={{ display: "block", minHeight: parts.length ? "auto" : "1.5em" }}>
          {parts.map((part, partIndex) => {
            segmentIndex += 1;
            const currentIndex = segmentIndex;
            const selected = selectedIndex === currentIndex;
            return (
              <span key={`${part.body}-${lineIndex}-${partIndex}`} style={{ display: "inline-flex", alignItems: "baseline", whiteSpace: "nowrap" }}>
                {part.leading ? <span style={{ whiteSpace: "pre" }}>{part.leading}</span> : null}
                <button
                  type="button"
                  onClick={() => onSelect(currentIndex)}
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
                    whiteSpace: "nowrap",
                    cursor: "pointer",
                    boxShadow: selected ? `0 0 0 2px ${color.bg}55, 0 0 18px ${color.bg}55` : "none",
                    textDecoration: "none",
                    textUnderlineOffset: 3,
                  }}
                >
                  {part.body}
                </button>
                {part.trailing ? <span style={{ whiteSpace: "pre" }}>{part.trailing}</span> : null}
                {part.separator}
              </span>
            );
          })}
        </span>
      ))}
    </span>
  );
}
