import type { MonitoringStats as MonitoringStatsType } from "../lib/types";

export function MonitoringStats({ stats }: { stats: MonitoringStatsType }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
        gap: 14,
        marginBottom: 24,
      }}
    >
      {[
        {
          label: "Total Unit",
          value: stats.total,
          color: "#9f6ef5",
          bg: "rgba(159,110,245,0.08)",
          border: "rgba(159,110,245,0.2)",
        },
        {
          label: "Tersedia",
          value: stats.tersedia,
          color: "#4ade80",
          bg: "rgba(74,222,128,0.08)",
          border: "rgba(74,222,128,0.2)",
        },
        {
          label: "Digunakan",
          value: stats.digunakan,
          color: "#fb923c",
          bg: "rgba(251,146,60,0.08)",
          border: "rgba(251,146,60,0.2)",
        },
        {
          label: "Maintenance",
          value: stats.maintenance,
          color: "#facc15",
          bg: "rgba(250,204,21,0.08)",
          border: "rgba(250,204,21,0.2)",
        },
      ].map((item) => (
        <div
          key={item.label}
          style={{
            padding: "16px 20px",
            borderRadius: 14,
            background: item.bg,
            border: `1px solid ${item.border}`,
          }}
        >
          <p
            style={{
              margin: 0,
              fontSize: 12,
              fontWeight: 600,
              color: "#9b8ec4",
              letterSpacing: "0.05em",
              textTransform: "uppercase",
            }}
          >
            {item.label}
          </p>
          <p
            style={{
              margin: "6px 0 0",
              fontSize: 28,
              fontWeight: 700,
              color: item.color,
            }}
          >
            {item.value}
          </p>
        </div>
      ))}
    </div>
  );
}
