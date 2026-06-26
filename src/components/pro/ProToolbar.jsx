import Icon from "../icons/Icon";

export const PRO_FILTERS = ["Tous", "En cours", "Terminés", "PDF", "Crochet", "Tricot"];

export default function ProToolbar({ search, activeFilter, onSearchChange, onFilterChange }) {
  return (
    <>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          background: "var(--k-surface)",
          borderRadius: 14,
          padding: "12px 14px",
          marginBottom: 8,
          border: "1px solid var(--k-border)",
        }}
      >
        <span style={{ color: "var(--k-muted-2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon name="search" size={16} color="var(--k-muted-2)" />
        </span>
        <input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Rechercher un projet..."
          style={{
            background: "none",
            border: "none",
            outline: "none",
            color: "var(--k-text)",
            flex: 1,
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 15,
          }}
        />
      </div>

      <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 2 }}>
        {PRO_FILTERS.map((filter) => (
          <button
            key={filter}
            onClick={() => onFilterChange(filter)}
            style={{
              padding: "5px 12px",
              borderRadius: 9999,
              border: `1px solid ${activeFilter === filter ? "#A78BFA" : "var(--k-border-strong)"}`,
              background: activeFilter === filter ? "#7C3AED33" : "none",
              color: activeFilter === filter ? "#A78BFA" : "var(--k-muted-2)",
              fontSize: 11,
              cursor: "pointer",
              whiteSpace: "nowrap",
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            {filter}
          </button>
        ))}
      </div>
    </>
  );
}
