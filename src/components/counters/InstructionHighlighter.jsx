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

const protectInstructionUnits = (value = "") => (
  String(value).replace(/\b(\d+)\s+([A-Za-zÀ-ÿ][\wÀ-ÿ.]*)/g, "$1\u00A0$2")
);

export default function InstructionHighlighter({ text, selectedIndex, onSelect, color }) {
  const accent = color || { bg: "#7C3AED", light: "#A78BFA" };
  const lines = String(text || "").split(/\r?\n/).map((line) => splitInstructionSegments(line));
  const hasParts = lines.some((line) => line.length > 0);

  if (!hasParts) {
    return <span>{text}</span>;
  }

  let segmentIndex = -1;

  return (
    <span style={{ display: "block" }}>
      {lines.map((parts, lineIndex) => (
        <span key={`line-${lineIndex}`} style={{ display: "block", minHeight: parts.length ? "auto" : "1em" }}>
          {parts.map((part, partIndex) => {
            segmentIndex += 1;
            const currentIndex = segmentIndex;
            const selected = selectedIndex === currentIndex;
            const keepTogether = Boolean(part.separator);
            return (
              <span key={`${part.body}-${lineIndex}-${partIndex}`} style={{ display: keepTogether ? "inline-block" : "inline", whiteSpace: keepTogether ? "nowrap" : "normal", overflowWrap: "normal", wordBreak: "normal" }}>
                {part.leading ? <span style={{ whiteSpace: "pre" }}>{part.leading}</span> : null}
                <span
                  onClick={() => onSelect(currentIndex)}
                  style={{
                    display: "inline",
                    borderRadius: 7,
                    padding: "0 3px 1px",
                    margin: 0,
                    background: selected ? `linear-gradient(135deg, ${accent.bg}, ${accent.light})` : "transparent",
                    color: selected ? "#fff" : "var(--k-text)",
                    font: "inherit",
                    lineHeight: "inherit",
                    whiteSpace: keepTogether ? "nowrap" : "normal",
                    overflowWrap: "normal",
                    wordBreak: "normal",
                    cursor: "pointer",
                    boxShadow: "none",
                    textDecoration: "none",
                    WebkitTapHighlightColor: "transparent",
                  }}
                >
                  {protectInstructionUnits(part.body)}
                  {part.separator}
                </span>
                {part.trailing ? <span style={{ whiteSpace: "pre" }}>{part.trailing}</span> : null}
              </span>
            );
          })}
        </span>
      ))}
    </span>
  );
}
