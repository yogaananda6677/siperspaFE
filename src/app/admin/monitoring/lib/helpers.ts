import type { MonitoringDetailSewa, MonitoringTransaksi } from "@/lib/api";


export const STATUS_CONFIG = {
  tersedia: {
    label: "Tersedia",
    color: "#4ade80",
    bg: "rgba(74,222,128,0.08)",
    border: "rgba(74,222,128,0.2)",
    glow: "0 0 18px rgba(74,222,128,0.18)",
  },
  digunakan: {
    label: "Digunakan",
    color: "#fb923c",
    bg: "rgba(251,146,60,0.08)",
    border: "rgba(251,146,60,0.2)",
    glow: "0 0 18px rgba(251,146,60,0.18)",
  },
  maintenance: {
    label: "Maintenance",
    color: "#facc15",
    bg: "rgba(250,204,21,0.08)",
    border: "rgba(250,204,21,0.2)",
    glow: "0 0 18px rgba(250,204,21,0.18)",
  },
} as const;

export function toLaravelDateTime(localDateTime: string) {
  if (!localDateTime) return "";

  const [datePart, timePart = "00:00"] = localDateTime.split("T");
  const [hour = "00", minute = "00"] = timePart.split(":");

  return `${datePart} ${hour}:${minute}:00`;
}

export const formatRupiah = (n: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(n);

export const formatDateTimeLocal = (date = new Date()) => {
  const pad = (n: number) => String(n).padStart(2, "0");
  const y = date.getFullYear();
  const m = pad(date.getMonth() + 1);
  const d = pad(date.getDate());
  const hh = pad(date.getHours());
  const mm = pad(date.getMinutes());
  return `${y}-${m}-${d}T${hh}:${mm}`;
};

/**
 * Parser aman untuk format Laravel:
 * - 2026-04-11 21:30:00
 * - 2026-04-11T21:30
 * - 2026-04-11T21:30:00
 * - ISO string
 *
 * Format "YYYY-MM-DD HH:mm:ss" diperlakukan sebagai LOCAL TIME,
 * supaya tidak bergeser +7 jam di browser.
 */
export function parseLaravelDateTime(value?: string | null): Date | null {
  if (!value) return null;

  const raw = value.trim();
  const normalized = raw.replace("T", " ");

  const match = normalized.match(
    /^(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2})(?::(\d{2}))?$/
  );

  if (match) {
    const [, y, m, d, hh, mm, ss = "00"] = match;

    return new Date(
      Number(y),
      Number(m) - 1,
      Number(d),
      Number(hh),
      Number(mm),
      Number(ss)
    );
  }

  const fallback = new Date(raw);
  if (Number.isNaN(fallback.getTime())) return null;

  return fallback;
}

export const formatDateTime = (value?: string | null) => {
  const date = parseLaravelDateTime(value);
  if (!date) return "-";

  return date.toLocaleString("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  });
};

export function formatJam(value?: string | null) {
  const date = parseLaravelDateTime(value);
  if (!date) return "-";

  return date.toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatDurasiMenit(totalMinutes: number) {
  const jam = Math.floor(totalMinutes / 60);
  const menit = totalMinutes % 60;

  if (jam > 0 && menit > 0) return `${jam}j ${menit}m`;
  if (jam > 0) return `${jam}j`;
  return `${menit}m`;
}

export function getDurasiMenit(detail?: {
  durasi_menit?: number | null;
  durasi_jam?: number | null;
  jam_mulai?: string | null;
  jam_selesai?: string | null;
}) {
  if (!detail) return 0;

  if (typeof detail.durasi_menit === "number" && detail.durasi_menit > 0) {
    return detail.durasi_menit;
  }

  if (typeof detail.durasi_jam === "number" && detail.durasi_jam > 0) {
    return detail.durasi_jam * 60;
  }

  if (detail.jam_mulai && detail.jam_selesai) {
    const start = parseLaravelDateTime(detail.jam_mulai)?.getTime() ?? NaN;
    const end = parseLaravelDateTime(detail.jam_selesai)?.getTime() ?? NaN;

    if (!Number.isNaN(start) && !Number.isNaN(end) && end > start) {
      return Math.round((end - start) / 60000);
    }
  }

  return 0;
}

export function getRemainingMs(
  jamSelesai?: string | null,
  nowTick = Date.now()
) {
  const end = parseLaravelDateTime(jamSelesai)?.getTime();
  if (!end) return 0;
  return Math.max(0, end - nowTick);
}

export function getCountdownText(
  jamSelesai?: string | null,
  nowTick = Date.now()
) {
  const diffMs = getRemainingMs(jamSelesai, nowTick);

  if (diffMs <= 0) return "Waktu habis";

  const totalSeconds = Math.floor(diffMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) return `${hours}j ${minutes}m`;
  if (minutes > 0) return `${minutes}m ${seconds}d`;
  return `${seconds}d`;
}

export function isExpired(
  jamSelesai?: string | null,
  nowTick = Date.now()
) {
  return getRemainingMs(jamSelesai, nowTick) <= 0;
}

export function hitungSubtotalSewaTampil(
  hargaPerJam: number,
  durasiMenit: number
) {
  return Math.round((hargaPerJam / 60) * durasiMenit);
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function buildReceiptHtml(transaksi: MonitoringTransaksi) {
  const totalSewa = transaksi.detail_sewa.reduce(
    (sum, item) => sum + Number(item.subtotal || 0),
    0
  );
  const totalProduk = transaksi.detail_produk.reduce(
    (sum, item) => sum + Number(item.subtotal || 0),
    0
  );

  const sewaRows =
    transaksi.detail_sewa.length > 0
      ? transaksi.detail_sewa
          .map((item) => {
            const durasi = formatDurasiMenit(getDurasiMenit(item));
            const namaPs = item.playstation?.nomor_ps ?? "-";
            const tipe = item.playstation?.tipe?.nama_tipe ?? item.tipe_ps ?? "-";

            return `
              <tr>
                <td>${escapeHtml(namaPs)}</td>
                <td>${escapeHtml(tipe)}</td>
                <td>${escapeHtml(durasi)}</td>
                <td style="text-align:right">${escapeHtml(
                  formatRupiah(Number(item.subtotal || 0))
                )}</td>
              </tr>
            `;
          })
          .join("")
      : `
          <tr>
            <td colspan="4" style="text-align:center;color:#777">Tidak ada item sewa</td>
          </tr>
        `;

  const produkRows =
    transaksi.detail_produk.length > 0
      ? transaksi.detail_produk
          .map((item) => {
            const nama = item.produk?.nama ?? "-";
            return `
              <tr>
                <td>${escapeHtml(nama)}</td>
                <td style="text-align:center">${escapeHtml(String(item.qty))}</td>
                <td style="text-align:right">${escapeHtml(
                  formatRupiah(Number(item.subtotal || 0))
                )}</td>
              </tr>
            `;
          })
          .join("")
      : `
          <tr>
            <td colspan="3" style="text-align:center;color:#777">Tidak ada produk</td>
          </tr>
        `;

  return `
    <!doctype html>
    <html lang="id">
      <head>
        <meta charset="utf-8" />
        <title>Struk Transaksi #${transaksi.id_transaksi}</title>
      </head>
      <body onload="window.print()">
        <div>
          <h1>Struk Rental PS</h1>
          <div>Tanggal: ${escapeHtml(formatDateTime(transaksi.tanggal))}</div>
          <div>Pelanggan: ${escapeHtml(transaksi.user?.name ?? "-")}</div>

          <h2>Detail Sewa</h2>
          <table>
            <tbody>${sewaRows}</tbody>
          </table>

          <h2>Detail Produk</h2>
          <table>
            <tbody>${produkRows}</tbody>
          </table>

          <div>Total sewa: ${escapeHtml(formatRupiah(totalSewa))}</div>
          <div>Total produk: ${escapeHtml(formatRupiah(totalProduk))}</div>
          <div>Grand total: ${escapeHtml(
            formatRupiah(Number(transaksi.total_harga || 0))
          )}</div>
        </div>
      </body>
    </html>
  `;
}

export function printReceipt(transaksi: MonitoringTransaksi) {
  const popup = window.open("", "_blank", "width=420,height=700");
  if (!popup) return;

  popup.document.open();
  popup.document.write(buildReceiptHtml(transaksi));
  popup.document.close();
  popup.focus();
}

export function getDetailProdukKey(
  item: {
    id_detail_produk?: number | null;
    id_produk?: number | null;
    produk?: { nama?: string | null } | null;
    qty?: number | null;
    subtotal?: number | null;
  },
  index: number
) {
  return [
    item.id_detail_produk ?? "detail-produk",
    item.id_produk ?? "produk",
    item.produk?.nama ?? "tanpa-nama",
    item.qty ?? 0,
    item.subtotal ?? 0,
    index,
  ].join("-");
}

export function getDetailSewaKey(
  item: {
    id_dt_booking?: number | null;
    id_ps?: number | null;
    jam_mulai?: string | null;
    jam_selesai?: string | null;
  },
  index: number
) {
  return [
    item.id_dt_booking ?? "detail-sewa",
    item.id_ps ?? "ps",
    item.jam_mulai ?? "mulai",
    item.jam_selesai ?? "selesai",
    index,
  ].join("-");
}

export function findActiveSewaForPs(
  transaksi: MonitoringTransaksi | null | undefined,
  idPs: number
): MonitoringDetailSewa | undefined {
  return (
    transaksi?.detail_sewa?.find((detail) => detail.id_ps === idPs) ??
    transaksi?.detail_sewa?.[0]
  );
}