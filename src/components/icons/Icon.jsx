export default function Icon({ name, size = 20, stroke = 1.9, color = "currentColor", style = {} }) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: color,
    strokeWidth: stroke,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    style,
    "aria-hidden": true,
  };

  switch (name) {
    case "library":
      return (
        <svg {...common}>
          <rect x="4" y="4" width="6.5" height="6.5" rx="1.5" />
          <rect x="13.5" y="4" width="6.5" height="6.5" rx="1.5" />
          <rect x="4" y="13.5" width="6.5" height="6.5" rx="1.5" />
          <rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.5" />
        </svg>
      );
    case "book":
      return (
        <svg {...common}>
          <path d="M6.5 5.5A2.5 2.5 0 0 1 9 3h8.5v17H9a2.5 2.5 0 0 0-2.5 2" />
          <path d="M6.5 5.5v15" />
          <path d="M9.5 7.5h5.5" />
          <path d="M9.5 11h5.5" />
        </svg>
      );
    case "bookOpen":
      return (
        <svg {...common}>
          <path d="M12 6.5c-1.5-1.2-3.4-1.8-5.5-1.8H4.5V18h2c2.1 0 4 .6 5.5 1.8" />
          <path d="M12 6.5c1.5-1.2 3.4-1.8 5.5-1.8h2V18h-2c-2.1 0-4 .6-5.5 1.8" />
          <path d="M12 6.5V19.8" />
        </svg>
      );
    case "settings":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="3.2" />
          <path d="M19.4 15a1 1 0 0 0 .2 1.1l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1 1 0 0 0-1.1-.2 1 1 0 0 0-.6.9V20a2 2 0 1 1-4 0v-.2a1 1 0 0 0-.7-.9 1 1 0 0 0-1.1.2l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1 1 0 0 0 .2-1.1 1 1 0 0 0-.9-.6H4a2 2 0 1 1 0-4h.2a1 1 0 0 0 .9-.7 1 1 0 0 0-.2-1.1l-.1-.1a2 2 0 0 1 2.8-2.8l.1.1a1 1 0 0 0 1.1.2 1 1 0 0 0 .6-.9V4a2 2 0 1 1 4 0v.2a1 1 0 0 0 .7.9 1 1 0 0 0 1.1-.2l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1 1 0 0 0-.2 1.1 1 1 0 0 0 .9.6h.2a2 2 0 1 1 0 4h-.2a1 1 0 0 0-.9.7Z" />
        </svg>
      );
    case "search":
      return (
        <svg {...common}>
          <circle cx="11" cy="11" r="6.5" />
          <path d="m16 16 4 4" />
        </svg>
      );
    case "edit":
      return (
        <svg {...common}>
          <path d="M12 20h9" />
          <path d="M16.5 3.5a2.1 2.1 0 1 1 3 3L8 18l-4 1 1-4 11.5-11.5Z" />
        </svg>
      );
    case "image":
      return (
        <svg {...common}>
          <rect x="3.5" y="5" width="17" height="14" rx="2.5" />
          <circle cx="9" cy="10" r="1.3" />
          <path d="m20.5 16-4.5-4.5L7 20" />
        </svg>
      );
    case "trash":
      return (
        <svg {...common}>
          <path d="M3 6h18" />
          <path d="M8 6V4.8A1.8 1.8 0 0 1 9.8 3h4.4A1.8 1.8 0 0 1 16 4.8V6" />
          <path d="M6 6l1 14a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-14" />
          <path d="M10 10v7" />
          <path d="M14 10v7" />
        </svg>
      );
    case "yarn":
      return (
        <svg {...common}>
          <circle cx="12" cy="11.5" r="6.8" />
          <path d="M7.8 8.8c1.1-.9 2.6-1.4 4.2-1.4 1.8 0 3.4.6 4.5 1.7" />
          <path d="M6.8 11.7c1.4-1.2 3.2-1.9 5.2-1.9 2 0 3.7.7 5.1 2" />
          <path d="M7.6 14.7c1.2-.8 2.7-1.3 4.4-1.3 1.7 0 3.2.4 4.5 1.3" />
          <path d="M8 18.2c1.2-.7 2.5-1 4-1" />
          <path d="M5.6 17.9c1.9.1 3.5.9 4.9 2.6" />
        </svg>
      );
    case "note":
      return (
        <svg {...common}>
          <path d="M7 3.5h7l4 4V20a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 6 20V5A1.5 1.5 0 0 1 7.5 3.5Z" />
          <path d="M14 3.5V8h4" />
          <path d="M9 12h6" />
          <path d="M9 15.5h6" />
        </svg>
      );
    case "file":
      return (
        <svg {...common}>
          <path d="M8 3.5h6l4 4V20a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 6 20V5A1.5 1.5 0 0 1 7.5 3.5Z" />
          <path d="M14 3.5V8h4" />
        </svg>
      );
    case "checkCircle":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="8.5" />
          <path d="m8.7 12 2.2 2.3 4.5-4.8" />
        </svg>
      );
    case "square":
      return (
        <svg {...common}>
          <rect x="4.5" y="4.5" width="15" height="15" rx="3" />
        </svg>
      );
    case "download":
      return (
        <svg {...common}>
          <path d="M12 3v12" />
          <path d="M7 10l5 5 5-5" />
          <path d="M5 21h14" />
        </svg>
      );
    case "upload":
      return (
        <svg {...common}>
          <path d="M12 21V9" />
          <path d="M17 14l-5-5-5 5" />
          <path d="M5 3h14" />
        </svg>
      );
    case "sparkles":
      return (
        <svg {...common}>
          <path d="m12 3 1.1 3.3L16.5 7.5l-3.4 1.2L12 12l-1.1-3.3L7.5 7.5l3.4-1.2L12 3Z" />
          <path d="m18.5 13.5.7 2.1 2.1.7-2.1.7-.7 2.1-.7-2.1-2.1-.7 2.1-.7.7-2.1Z" />
          <path d="m5.5 14.5.7 2.1 2.1.7-2.1.7-.7 2.1-.7-2.1-2.1-.7 2.1-.7.7-2.1Z" />
        </svg>
      );
    case "grid":
      return (
        <svg {...common}>
          <rect x="4" y="4" width="6.5" height="6.5" rx="1.5" />
          <rect x="13.5" y="4" width="6.5" height="6.5" rx="1.5" />
          <rect x="4" y="13.5" width="6.5" height="6.5" rx="1.5" />
          <rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.5" />
        </svg>
      );
    case "projects":
      return (
        <svg {...common}>
          <rect x="4.5" y="5" width="11" height="14" rx="2.2" />
          <path d="M8 9h4" />
          <path d="M8 12.5h4.5" />
          <path d="M16.5 8.5h3" />
          <path d="M16.5 12h3" />
          <path d="M16.5 15.5h3" />
        </svg>
      );
    case "client":
      return (
        <svg {...common}>
          <circle cx="12" cy="8" r="3.2" />
          <path d="M5.5 20.5a6.5 6.5 0 0 1 13 0" />
        </svg>
      );
    case "chart":
      return (
        <svg {...common}>
          <path d="M5 19.5h14" />
          <path d="M7.5 16V11" />
          <path d="M12 16V7.5" />
          <path d="M16.5 16v-5" />
        </svg>
      );
    case "checkBadge":
      return (
        <svg {...common}>
          <path d="M12 3.5 9.8 5 7 4.6l-.8 2.7L4 9l1.5 2.4-.2 2.8 2.7.8L9.7 17l2.3 1.5 2.3-1.5 2.7.4.8-2.7L20 15l-.4-2.7L21 9.9l-2.1-1.6-.8-2.7-2.8.4L12 3.5Z" />
          <path d="m9.3 12 1.7 1.8 3.7-4" />
        </svg>
      );
    case "camera":
      return (
        <svg {...common}>
          <path d="M4.5 8.5h3l1.2-2h6.6l1.2 2h3a1.8 1.8 0 0 1 1.8 1.8v7.2a1.8 1.8 0 0 1-1.8 1.8h-15a1.8 1.8 0 0 1-1.8-1.8v-7.2A1.8 1.8 0 0 1 4.5 8.5Z" />
          <circle cx="12" cy="13" r="3.2" />
        </svg>
      );
    case "undo":
      return (
        <svg {...common}>
          <path d="M9 9 5.5 12.5 9 16" />
          <path d="M6 12.5h7a4.5 4.5 0 1 1 0 9h-2.5" />
        </svg>
      );
    case "alert":
      return (
        <svg {...common}>
          <path d="M12 4 4.5 18h15L12 4Z" />
          <path d="M12 9v4.5" />
          <path d="M12 17h.01" />
        </svg>
      );
    default:
      return null;
  }
}
