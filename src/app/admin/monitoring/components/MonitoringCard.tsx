import type { MonitoringPlaystation } from "@/lib/api";
import {
  findActiveSewaForPs,
  formatJam,
  getCountdownText,
  isExpired,
  STATUS_CONFIG,
} from "../lib/helpers";

function normalizePaymentStatus(status?: string | null) {
  const value = (status ?? "").toString().trim().toLowerCase();

  if (!value) return "belum_ada";
  if (value === "paid" || value === "success") return "lunas";
  if (value === "pending") return "menunggu";
  if (value === "menuggu") return "menunggu";
  if (value === "menunggu_validasi") return "menunggu_validasi";

  return value;
}

function getPaymentBadge(status?: string | null) {
  const normalized = normalizePaymentStatus(status);

  switch (normalized) {
    case "lunas":
      return {
        label: "LUNAS",
        color: "#4ade80",
        bg: "rgba(74,222,128,0.12)",
        border: "rgba(74,222,128,0.22)",
      };
    case "menunggu_validasi":
      return {
        label: "VALIDASI CASH",
        color: "#fb923c",
        bg: "rgba(251,146,60,0.12)",
        border: "rgba(251,146,60,0.22)",
      };
    case "menunggu":
      return {
        label: "BELUM LUNAS",
        color: "#facc15",
        bg: "rgba(250,204,21,0.12)",
        border: "rgba(250,204,21,0.22)",
      };
    case "gagal":
      return {
        label: "GAGAL",
        color: "#f87171",
        bg: "rgba(248,113,113,0.12)",
        border: "rgba(248,113,113,0.22)",
      };
    default:
      return {
        label: "BELUM ADA",
        color: "#9b8ec4",
        bg: "rgba(255,255,255,0.04)",
        border: "rgba(159,110,245,0.15)",
      };
  }
}

function getTransaksiBadge(status?: string | null) {
  const value = (status ?? "").toString().trim().toLowerCase();

  switch (value) {
    case "aktif":
      return {
        label: "TRANSAKSI AKTIF",
        color: "#fb923c",
        bg: "rgba(251,146,60,0.12)",
        border: "rgba(251,146,60,0.22)",
      };
    case "waiting":
      return {
        label: "MENUNGGU BOOKING",
        color: "#facc15",
        bg: "rgba(250,204,21,0.12)",
        border: "rgba(250,204,21,0.22)",
      };
    case "dijadwalkan":
      return {
        label: "BOOKING",
        color: "#60a5fa",
        bg: "rgba(96,165,250,0.12)",
        border: "rgba(96,165,250,0.22)",
      };
    case "selesai":
      return {
        label: "SELESAI",
        color: "#4ade80",
        bg: "rgba(74,222,128,0.12)",
        border: "rgba(74,222,128,0.22)",
      };
    case "batal":
    case "dibatalkan":
      return {
        label: "BATAL",
        color: "#f87171",
        bg: "rgba(248,113,113,0.12)",
        border: "rgba(248,113,113,0.22)",
      };
    default:
      return null;
  }
}

function getRemainingMs(jamSelesai?: string | null, nowTick?: number) {
  if (!jamSelesai || !nowTick) return null;
  const end = new Date(jamSelesai).getTime();
  if (Number.isNaN(end)) return null;
  return end - nowTick;
}

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
  const transaksi = item.active_transaksi;
  const sewaAktif = findActiveSewaForPs(transaksi, item.id_ps);

  const transaksiStatus = (transaksi?.status_transaksi ?? "").toString().trim().toLowerCase();
  const paymentStatus = normalizePaymentStatus(transaksi?.pembayaran?.status_bayar);
  const transaksiBadge = getTransaksiBadge(transaksi?.status_transaksi);
  const paymentBadge = getPaymentBadge(transaksi?.pembayaran?.status_bayar);

  const expired = !!sewaAktif?.jam_selesai && isExpired(sewaAktif.jam_selesai, nowTick);
  const remainingMs = getRemainingMs(sewaAktif?.jam_selesai, nowTick);
  const isH30Lock =
    item.status_ps === "digunakan" &&
    !expired &&
    remainingMs !== null &&
    remainingMs > 0 &&
    remainingMs <= 30 * 60 * 1000;

  let subtitle = "Sedang digunakan";
  let footer = "";
  let highlightText = "";

  if (item.status_ps === "maintenance") {
    subtitle = "Unit sedang maintenance";
    footer = "Tidak tersedia untuk transaksi";
    highlightText = "Perlu penanganan teknis";
  } else if (item.status_ps === "tersedia") {
    subtitle = "Siap dipakai";
    footer = "Bisa langsung dibuat transaksi";
    highlightText = "Unit kosong";
  } else if (transaksiStatus === "waiting") {
    subtitle = "Booking masuk, menunggu persetujuan admin";
    footer = transaksi ? `Ref Transaksi #${transaksi.id_transaksi}` : "Booking pending";
    highlightText = "Belum aktif";
  } else if (transaksiStatus === "dijadwalkan") {
    subtitle = "Sudah dibooking untuk sesi berikutnya";
    footer = sewaAktif?.jam_mulai ? `Mulai ${formatJam(sewaAktif.jam_mulai)}` : "Booking terjadwal";
    highlightText = "Booked";
  } else if (item.status_ps === "digunakan" && sewaAktif?.jam_selesai) {
    if (expired) {
      subtitle = "Waktu habis - pilih aksi";
      footer = `Berakhir ${formatJam(sewaAktif.jam_selesai)}`;
      highlightText = "Segera selesaikan / perpanjang";
    } else if (isH30Lock) {
      subtitle = "H-30 menit • transaksi dikunci";
      footer = `Berakhir ${formatJam(sewaAktif.jam_selesai)}`;
      highlightText = "Reservasi sudah dibuka";
    } else {
      subtitle = `Sisa ${getCountdownText(sewaAktif.jam_selesai, nowTick)}`;
      footer = `Berakhir ${formatJam(sewaAktif.jam_selesai)}`;
      highlightText =
        paymentStatus === "lunas"
          ? "Pembayaran aman"
          : paymentStatus === "menunggu_validasi"
          ? "Cash menunggu validasi"
          : "Cek pembayaran";
    }
  } else if (transaksi) {
    subtitle = `Ref Transaksi #${transaksi.id_transaksi}`;
    footer = "Sedang digunakan";
    highlightText = "Transaksi berjalan";
  }

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
          alignItems: "flex-start",
          justifyContent: "space-between",
          marginBottom: 10,
          gap: 10,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
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

          {transaksiBadge ? (
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                padding: "4px 8px",
                borderRadius: 999,
                background: transaksiBadge.bg,
                border: `1px solid ${transaksiBadge.border}`,
                color: transaksiBadge.color,
                fontSize: 10.5,
                fontWeight: 700,
                width: "fit-content",
              }}
            >
              {transaksiBadge.label}
            </span>
          ) : null}
        </div>

        <span style={{ fontSize: 20 }}>🎮</span>
      </div>

      <div style={{ fontSize: 18, fontWeight: 700, color: "#f0eaff" }}>
        {item.nomor_ps}
      </div>

      <div style={{ fontSize: 12.5, color: "#b9a8e9", marginTop: 4 }}>
        {item.tipe?.nama_tipe ?? "-"}
      </div>

      {transaksi ? (
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 8,
            marginTop: 12,
          }}
        >
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              padding: "4px 8px",
              borderRadius: 999,
              background: paymentBadge.bg,
              border: `1px solid ${paymentBadge.border}`,
              color: paymentBadge.color,
              fontSize: 10.5,
              fontWeight: 700,
            }}
          >
            {paymentBadge.label}
          </span>

          {isH30Lock ? (
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                padding: "4px 8px",
                borderRadius: 999,
                background: "rgba(250,204,21,0.12)",
                border: "1px solid rgba(250,204,21,0.22)",
                color: "#facc15",
                fontSize: 10.5,
                fontWeight: 700,
              }}
            >
              H-30 LOCK
            </span>
          ) : null}
        </div>
      ) : null}

      <div
        style={{
          marginTop: 12,
          fontSize: 13,
          color: "#cbbbf9",
          fontWeight: 600,
          lineHeight: 1.5,
        }}
      >
        {subtitle}
      </div>

      {highlightText ? (
        <div
          style={{
            marginTop: 8,
            fontSize: 12,
            color: "#f0d78a",
            fontWeight: 600,
          }}
        >
          {highlightText}
        </div>
      ) : null}

      {footer ? (
        <div style={{ marginTop: 6, fontSize: 12, color: "#9b8ec4" }}>
          {footer}
        </div>
      ) : null}
    </button>
  );
}