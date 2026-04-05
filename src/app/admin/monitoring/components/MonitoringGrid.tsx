import type { MonitoringPlaystation } from "@/lib/api";
import { MonitoringCard } from "./MonitoringCard";

export function MonitoringGrid({
  loading,
  items,
  nowTick,
  onOpen,
}: {
  loading: boolean;
  items: MonitoringPlaystation[];
  nowTick: number;
  onOpen: (item: MonitoringPlaystation) => void;
}) {
  if (loading) {
    return (
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
          gap: 16,
        }}
      >
        {Array.from({ length: 8 }).map((_, idx) => (
          <div
            key={idx}
            style={{
              minHeight: 142,
              borderRadius: 18,
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(159,110,245,0.12)",
            }}
          />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div
        style={{
          padding: "60px 0",
          textAlign: "center",
          border: "1px solid rgba(159,110,245,0.15)",
          borderRadius: 16,
          background: "#160d2e",
          color: "#9b8ec4",
        }}
      >
        Tidak ada data monitoring ditemukan.
      </div>
    );
  }

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
        gap: 16,
      }}
    >
      {items.map((item) => (
        <MonitoringCard key={item.id_ps} item={item} nowTick={nowTick} onOpen={onOpen} />
      ))}
    </div>
  );
}
