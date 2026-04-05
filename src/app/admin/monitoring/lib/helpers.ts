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

export const formatDateTime = (value?: string | null) => {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleString("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  });
};

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
    const start = new Date(detail.jam_mulai).getTime();
    const end = new Date(detail.jam_selesai).getTime();
    if (!Number.isNaN(start) && !Number.isNaN(end) && end > start) {
      return Math.round((end - start) / 60000);
    }
  }
  return 0;
}

export function getCountdownText(jamSelesai?: string | null, nowTick = Date.now()) {
  if (!jamSelesai) return "Waktu tidak tersedia";

  const end = new Date(jamSelesai).getTime();
  if (Number.isNaN(end)) return "Waktu tidak valid";

  const diffMs = end - nowTick;

  if (diffMs <= 0) return "Waktu habis";

  const totalSeconds = Math.floor(diffMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) return `${hours}j ${minutes}m ${seconds}d`;
  return `${minutes}m ${seconds}d`;
}

export function isExpired(jamSelesai?: string | null, nowTick = Date.now()) {
  if (!jamSelesai) return false;
  const end = new Date(jamSelesai).getTime();
  if (Number.isNaN(end)) return false;
  return end <= nowTick;
}

export function hitungSubtotalSewaTampil(hargaPerJam: number, durasiMenit: number) {
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
        <style>
          * { box-sizing: border-box; }
          body {
            font-family: Arial, Helvetica, sans-serif;
            padding: 16px;
            color: #111;
          }
          .wrap {
            max-width: 420px;
            margin: 0 auto;
          }
          .center { text-align: center; }
          .muted { color: #666; font-size: 12px; }
          h1 {
            font-size: 20px;
            margin: 0 0 8px;
          }
          h2 {
            font-size: 15px;
            margin: 18px 0 8px;
            border-bottom: 1px dashed #999;
            padding-bottom: 6px;
          }
          .info {
            display: grid;
            grid-template-columns: 120px 1fr;
            row-gap: 6px;
            column-gap: 8px;
            font-size: 13px;
            margin-top: 12px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            font-size: 13px;
          }
          th, td {
            padding: 8px 4px;
            border-bottom: 1px dashed #bbb;
            vertical-align: top;
          }
          th {
            text-align: left;
          }
          .total {
            margin-top: 12px;
            font-size: 14px;
          }
          .total-row {
            display: flex;
            justify-content: space-between;
            padding: 6px 0;
          }
          .grand {
            font-size: 16px;
            font-weight: 700;
            border-top: 1px solid #111;
            margin-top: 8px;
            padding-top: 8px;
          }
          .footer {
            margin-top: 18px;
            text-align: center;
            font-size: 12px;
            color: #666;
          }
          @media print {
            body { padding: 0; }
          }
        </style>
      </head>
      <body onload="window.print()">
        <div class="wrap">
          <div class="center">
            <h1>Struk Rental PS</h1>
            <div class="muted">Monitoring PlayStation</div>
          </div>

          <div class="info">
            <div>No. Transaksi</div><div>: #${escapeHtml(String(
              transaksi.id_transaksi
            ))}</div>
            <div>Tanggal</div><div>: ${escapeHtml(formatDateTime(transaksi.tanggal))}</div>
            <div>Pelanggan</div><div>: ${escapeHtml(transaksi.user?.name ?? "-")}</div>
            <div>Username</div><div>: ${escapeHtml(transaksi.user?.username ?? "-")}</div>
            <div>Status</div><div>: ${escapeHtml(transaksi.status_transaksi)}</div>
          </div>

          <h2>Detail Sewa</h2>
          <table>
            <thead>
              <tr>
                <th>PS</th>
                <th>Tipe</th>
                <th>Durasi</th>
                <th style="text-align:right">Subtotal</th>
              </tr>
            </thead>
            <tbody>${sewaRows}</tbody>
          </table>

          <h2>Detail Produk</h2>
          <table>
            <thead>
              <tr>
                <th>Produk</th>
                <th style="text-align:center">Qty</th>
                <th style="text-align:right">Subtotal</th>
              </tr>
            </thead>
            <tbody>${produkRows}</tbody>
          </table>

          <div class="total">
            <div class="total-row">
              <span>Total sewa</span>
              <strong>${escapeHtml(formatRupiah(totalSewa))}</strong>
            </div>
            <div class="total-row">
              <span>Total produk</span>
              <strong>${escapeHtml(formatRupiah(totalProduk))}</strong>
            </div>
            <div class="total-row grand">
              <span>Grand total</span>
              <strong>${escapeHtml(
                formatRupiah(Number(transaksi.total_harga || 0))
              )}</strong>
            </div>
          </div>

          <div class="footer">
            Terima kasih sudah menggunakan layanan rental kami.
          </div>
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

