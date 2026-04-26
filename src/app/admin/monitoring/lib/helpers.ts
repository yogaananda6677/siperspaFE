import type { MonitoringDetailProduk, MonitoringDetailSewa, MonitoringPlaystation, MonitoringTransaksi } from "@/lib/api";

export const STATUS_CONFIG = {
  tersedia: {
    label: "Tersedia",
    tone: "success",
    border: "rgba(74, 222, 128, 0.28)",
    bg: "rgba(74, 222, 128, 0.10)",
    glow: "0 12px 28px rgba(0,0,0,0.18)",
    color: "#4ade80",
  },
  digunakan: {
    label: "Digunakan",
    tone: "warning",
    border: "rgba(245, 158, 11, 0.28)",
    bg: "rgba(245, 158, 11, 0.10)",
    glow: "0 12px 28px rgba(0,0,0,0.18)",
    color: "#f59e0b",
  },
  maintenance: {
    label: "Maintenance",
    tone: "danger",
    border: "rgba(248, 113, 113, 0.28)",
    bg: "rgba(248, 113, 113, 0.10)",
    glow: "0 12px 28px rgba(0,0,0,0.18)",
    color: "#f87171",
  },
} as const;


export function printReceipt(transaksi: MonitoringTransaksi) {
  const popup = window.open("", "_blank", "width=420,height=700");
  if (!popup) return;

  popup.document.open();
  popup.document.write(buildReceiptHtml(transaksi));
  popup.document.close();
  popup.focus();
}

export function findActiveSewaForPs(
  transaksi?: MonitoringTransaksi | null,
  idPs?: number | null
): MonitoringDetailSewa | null {
  if (!transaksi || !idPs) return null;
  return transaksi.detail_sewa.find((item) => Number(item.id_ps) === Number(idPs)) ?? null;
}

export function getDetailSewaKey(item: MonitoringDetailSewa, index: number) {
  return `${item.id_dt_booking ?? index}-${item.id_ps ?? "ps"}-${item.jam_mulai ?? "mulai"}`;
}

export function getDetailProdukKey(item: MonitoringDetailProduk, index: number) {
  return `${item.id_detail_produk ?? index}-${item.id_produk ?? "produk"}`;
}

export function formatRupiah(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

/**
 * Laravel kirim string tanpa timezone: 2026-04-12 21:29:00
 * Ini HARUS dibaca sebagai waktu lokal, bukan UTC.
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

export function getRemainingMs(jamSelesai?: string | null, nowTick = Date.now()) {
  const end = parseLaravelDateTime(jamSelesai)?.getTime();
  if (!end) return 0;
  return Math.max(0, end - nowTick);
}

export function getCountdownText(jamSelesai?: string | null, nowTick = Date.now()) {
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

export function isExpired(jamSelesai?: string | null, nowTick = Date.now()) {
  return getRemainingMs(jamSelesai, nowTick) <= 0;
}

export function hitungSubtotalSewaTampil(hargaPerJam: number, durasiMenit: number) {
  return Math.round((hargaPerJam / 60) * durasiMenit);
}

export function getTotalSewa(transaksi?: MonitoringTransaksi | null) {
  return Number(
    transaksi?.detail_sewa?.reduce((sum, item) => sum + Number(item.subtotal || 0), 0) || 0
  );
}

export function getTotalProduk(transaksi?: MonitoringTransaksi | null) {
  return Number(
    transaksi?.detail_produk?.reduce((sum, item) => sum + Number(item.subtotal || 0), 0) || 0
  );
}

export function getTotalTransaksiCalculated(transaksi?: MonitoringTransaksi | null) {
  return getTotalSewa(transaksi) + getTotalProduk(transaksi);
}

export function getNormalizedStatusBayarLocal(transaksi?: MonitoringTransaksi | null) {
  const raw = transaksi?.pembayaran?.status_bayar ?? "";
  const value = raw.toString().trim().toLowerCase();

  if (!value) return "belum bayar";
  if (["paid", "success", "settlement", "capture", "lunas"].includes(value)) return "lunas";
  if (["menuggu", "pending", "menunggu", "belum bayar"].includes(value)) return "belum bayar";
  if (["menunggu_validasi", "menunggu_verifikasi"].includes(value)) return "menunggu validasi";
  return value;
}

export function getSudahDibayar(transaksi?: MonitoringTransaksi | null) {
  const normalized = getNormalizedStatusBayarLocal(transaksi);
  if (normalized === "lunas") {
    return Number(transaksi?.pembayaran?.total_bayar || getTotalTransaksiCalculated(transaksi));
  }
  return Number(transaksi?.pembayaran?.total_bayar || 0);
}

export function canBayarTransaksiLocal(transaksi?: MonitoringTransaksi | null) {
  if (!transaksi) return false;
  const normalized = getNormalizedStatusBayarLocal(transaksi);
  const status = (transaksi.status_transaksi || "").toLowerCase();
  if (["selesai", "dibatalkan", "ditolak"].includes(status)) return false;
  return normalized !== "lunas";
}

export function canSelesaikanTransaksiLocal(transaksi?: MonitoringTransaksi | null) {
  if (!transaksi) return false;
  const normalized = getNormalizedStatusBayarLocal(transaksi);
  const status = (transaksi.status_transaksi || "").toLowerCase();
  return status === "aktif" && normalized === "lunas";
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}


export function formatDateTimeLocal(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

export function toLaravelDateTime(value: string) {
  if (!value) return "";
  return value.replace("T", " ") + ":00";
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

  const pembayaran = transaksi.pembayaran ?? null;
  const metodeBayar = pembayaran?.metode_pembayaran ?? "-";
  const statusBayar = pembayaran?.status_bayar ?? "-";
  const totalBayar = Number(pembayaran?.total_bayar || 0);
  const kembalian = Number(pembayaran?.kembalian || 0);
  const waktuBayar = pembayaran?.waktu_bayar
    ? formatDateTime(pembayaran.waktu_bayar)
    : "-";

  const sewaRows =
    transaksi.detail_sewa.length > 0
      ? transaksi.detail_sewa
          .map((item) => {
            const durasiMenit = getDurasiMenit(item);
            const durasi = formatDurasiMenit(durasiMenit);
            const namaPs = item.playstation?.nomor_ps ?? "-";
            const tipe = item.playstation?.tipe?.nama_tipe ?? item.tipe_ps ?? "-";
            const hargaPerJam = Number(item.harga_perjam || 0);

            return `
              <tr>
                <td>${escapeHtml(namaPs)}</td>
                <td>${escapeHtml(tipe)}</td>
                <td style="text-align:right">${escapeHtml(formatRupiah(hargaPerJam))}</td>
                <td style="text-align:center">${escapeHtml(durasi)}</td>
                <td style="text-align:right">${escapeHtml(
                  formatRupiah(Number(item.subtotal || 0))
                )}</td>
              </tr>
            `;
          })
          .join("")
      : `
          <tr>
            <td colspan="5" style="text-align:center;color:#777">Tidak ada item sewa</td>
          </tr>
        `;

  const produkRows =
    transaksi.detail_produk.length > 0
      ? transaksi.detail_produk
          .map((item) => {
            const nama = item.produk?.nama ?? "-";
            const hargaSatuan = Number(item.produk?.harga || 0);

            return `
              <tr>
                <td>${escapeHtml(nama)}</td>
                <td style="text-align:right">${escapeHtml(formatRupiah(hargaSatuan))}</td>
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
            <td colspan="4" style="text-align:center;color:#777">Tidak ada produk</td>
          </tr>
        `;

  return `
    <!doctype html>
    <html lang="id">
      <head>
        <meta charset="utf-8" />
        <title>Struk Transaksi #${transaksi.id_transaksi}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            font-size: 12px;
            color: #111;
            padding: 16px;
          }
          h1, h2 {
            margin: 0 0 8px;
          }
          .section {
            margin-top: 16px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 8px;
          }
          td, th {
            padding: 6px 4px;
            border-bottom: 1px solid #ddd;
            font-size: 12px;
          }
          .summary-row {
            display: flex;
            justify-content: space-between;
            margin-top: 6px;
          }
          .total {
            font-weight: bold;
            font-size: 13px;
          }
          .muted {
            color: #666;
          }
        </style>
      </head>
      <body onload="window.print()">
        <h1>Struk Rental PS</h1>
        <div>Tanggal Transaksi: ${escapeHtml(formatDateTime(transaksi.tanggal))}</div>
        <div>Pelanggan: ${escapeHtml(transaksi.user?.name ?? "-")}</div>
        <div>No. Transaksi: #${escapeHtml(String(transaksi.id_transaksi))}</div>

        <div class="section">
          <h2>Detail Sewa</h2>
          <table>
            <thead>
              <tr>
                <th align="left">PS</th>
                <th align="left">Tipe</th>
                <th align="right">Harga/Jam</th>
                <th align="center">Durasi</th>
                <th align="right">Subtotal</th>
              </tr>
            </thead>
            <tbody>${sewaRows}</tbody>
          </table>
        </div>

        <div class="section">
          <h2>Detail Produk</h2>
          <table>
            <thead>
              <tr>
                <th align="left">Produk</th>
                <th align="right">Harga</th>
                <th align="center">Qty</th>
                <th align="right">Subtotal</th>
              </tr>
            </thead>
            <tbody>${produkRows}</tbody>
          </table>
        </div>

        <div class="section">
          <div class="summary-row">
            <span>Total sewa</span>
            <span>${escapeHtml(formatRupiah(totalSewa))}</span>
          </div>
          <div class="summary-row">
            <span>Total produk</span>
            <span>${escapeHtml(formatRupiah(totalProduk))}</span>
          </div>
          <div class="summary-row total">
            <span>Grand total</span>
            <span>${escapeHtml(formatRupiah(Number(transaksi.total_harga || 0)))}</span>
          </div>
        </div>

        <div class="section">
          <h2>Pembayaran</h2>
          <div>Metode: ${escapeHtml(String(metodeBayar))}</div>
          <div>Status: ${escapeHtml(String(statusBayar))}</div>
          <div>Waktu bayar: ${escapeHtml(String(waktuBayar))}</div>
          <div>Total dibayar: ${escapeHtml(formatRupiah(totalBayar))}</div>
          <div>Kembalian: ${escapeHtml(formatRupiah(kembalian))}</div>
        </div>
      </body>
    </html>
  `;
}