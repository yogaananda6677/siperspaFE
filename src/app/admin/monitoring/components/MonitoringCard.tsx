import type { MonitoringPlaystation } from "@/lib/api";
import { findActiveSewaForPs, getCountdownText, isExpired, STATUS_CONFIG } from "../lib/helpers";

export function MonitoringCard({
  item,
  nowTick,
  onOpen,
}: {
  item: MonitoringPlaystation;
  nowTick: number;
  onOpen: (item: MonitoringPlaystation) => void;
}) {
  const cfg = STATUS_CONFIG[item.status_ps];
  const sewaAktif = findActiveSewaForPs(item.active_transaksi, item.id_ps);

  return (
    <button
      onClick={() => onOpen(item)}
      style={{
        textAlign: "left",
        padding: "18px 16px",
        borderRadius: 18,
        border: `1px solid ${cfg.border}`,
        background: cfg.bg,
        boxShadow: cfg.glow,
        cursor: "pointer",
        transition: "transform 0.15s ease, border-color 0.15s ease",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-3px)";
        e.currentTarget.style.borderColor = cfg.color;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.borderColor = cfg.border;
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 10,
        }}
      >
        <span
          style={{
            fontSize: 12,
            fontWeight: 700,
            color: cfg.color,
            textTransform: "uppercase",
            letterSpacing: "0.04em",
          }}
        >
          {cfg.label}
        </span>
        <span style={{ fontSize: 20 }}>🎮</span>
      </div>

      <div style={{ fontSize: 18, fontWeight: 700, color: "#f0eaff" }}>{item.nomor_ps}</div>

      <div style={{ fontSize: 12.5, color: "#b9a8e9", marginTop: 4 }}>
        {item.tipe?.nama_tipe ?? "-"}
      </div>

      <div style={{ marginTop: 12, fontSize: 12, color: "#9b8ec4" }}>
        {item.status_ps === "maintenance"
          ? "Sedang maintenance"
          : item.status_ps === "tersedia"
            ? "Siap dipakai"
            : sewaAktif?.jam_selesai
              ? isExpired(sewaAktif.jam_selesai, nowTick)
                ? "Waktu habis - pilih aksi"
                : `Sisa ${getCountdownText(sewaAktif.jam_selesai, nowTick)}`
              : item.active_transaksi
                ? `Ref Transaksi #${item.active_transaksi.id_transaksi}`
                : "Sedang digunakan"}
      </div>
    </button>
  );
}
