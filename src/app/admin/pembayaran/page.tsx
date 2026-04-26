"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  getCashPendingPayments,
  konfirmasiCashPembayaran,
  type CashPendingItem,
} from "@/lib/api";

const formatRupiah = (n: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(Number(n || 0));

const formatDate = (iso?: string | null) => {
  if (!iso) return "-";
  return new Date(iso).toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

type ReceiptState = {
  message: string;
  data: CashPendingItem;
} | null;

const pageWrap: React.CSSProperties = {
  padding: "32px 20px",
  minHeight: "100vh",
  background:
    "radial-gradient(circle at top, rgba(109,75,195,0.16), transparent 30%), #0f0820",
};

const panelStyle: React.CSSProperties = {
  borderRadius: 20,
  border: "1px solid rgba(159,110,245,0.15)",
  background: "#160d2e",
  overflow: "hidden",
  boxShadow: "0 18px 40px rgba(0,0,0,0.28)",
};

const detailCard: React.CSSProperties = {
  borderRadius: 14,
  padding: 14,
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(159,110,245,0.12)",
};

const sectionTitle: React.CSSProperties = {
  margin: 0,
  color: "#f0eaff",
  fontSize: 15,
  fontWeight: 700,
};

const sectionSub: React.CSSProperties = {
  margin: "6px 0 0",
  color: "#9b8ec4",
  fontSize: 13,
  lineHeight: 1.7,
};

type ToastState = {
  msg: string;
  type: "success" | "error" | "info";
} | null;

export default function PembayaranCashPage() {
  const [data, setData] = useState<CashPendingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<CashPendingItem | null>(null);
  const [receipt, setReceipt] = useState<ReceiptState>(null);
  const [nominal, setNominal] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<ToastState>(null);

  const prevIdsRef = useRef<Set<number>>(new Set());
  const firstLoadRef = useRef(true);

  const showToast = useCallback(
    (msg: string, type: "success" | "error" | "info" = "success") => {
      setToast({ msg, type });
      window.setTimeout(() => setToast(null), 3200);
    },
    []
  );

  const requestNotificationPermission = useCallback(() => {
    if (typeof window === "undefined") return;
    if (!("Notification" in window)) return;
    if (Notification.permission === "default") {
      void Notification.requestPermission();
    }
  }, []);

  const sendBrowserNotification = useCallback((title: string, body: string) => {
    if (typeof window === "undefined") return;
    if (!("Notification" in window)) return;
    if (Notification.permission !== "granted") return;

    new Notification(title, {
      body,
      icon: "/favicon.ico",
    });
  }, []);

  const processIncomingPayments = useCallback(
    (rows: CashPendingItem[]) => {
      const currentIds = new Set(rows.map((x) => x.id_transaksi));
      const prevIds = prevIdsRef.current;

      if (!firstLoadRef.current) {
        const newRows = rows.filter((x) => !prevIds.has(x.id_transaksi));

        if (newRows.length > 0) {
          const latest = newRows[0];
          const customer = latest.user?.name ?? "Pelanggan";
          const ps =
            latest.detail_sewa?.[0]?.playstation?.nomor_ps ?? "Produk / Transaksi";

          showToast(
            newRows.length === 1
              ? `Pembayaran cash baru • ${customer} - ${ps}`
              : `${newRows.length} pembayaran cash baru menunggu validasi`,
            "info"
          );

          sendBrowserNotification(
            "Pembayaran cash baru",
            newRows.length === 1
              ? `${customer} menunggu validasi pembayaran cash untuk ${ps}`
              : `${newRows.length} pembayaran cash baru menunggu validasi`
          );
        }
      }

      prevIdsRef.current = currentIds;
      firstLoadRef.current = false;
    },
    [sendBrowserNotification, showToast]
  );

  const fetchAll = useCallback(
    async (silent = false) => {
      if (!silent) setLoading(true);

      try {
        const rows = await getCashPendingPayments();
        setData(rows);
        processIncomingPayments(rows);
      } catch (e) {
        if (!silent) {
          showToast(
            e instanceof Error ? e.message : "Gagal memuat data pembayaran cash",
            "error"
          );
        }
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [processIncomingPayments, showToast]
  );

  useEffect(() => {
    requestNotificationPermission();
    void fetchAll(false);

    const interval = window.setInterval(() => {
      void fetchAll(true);
    }, 15000);

    const handleFocus = () => {
      void fetchAll(true);
    };

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        void fetchAll(true);
      }
    };

    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [fetchAll, requestNotificationPermission]);

  const selectedTagihan = Number(selected?.total_harga || 0);
  const selectedNominal = Number(nominal || 0);
  const selectedKembalian =
    selectedNominal > 0 ? Math.max(0, selectedNominal - selectedTagihan) : 0;

  const handleKonfirmasi = async () => {
    if (!selected) return;

    const totalBayar = Number(nominal);
    if (!totalBayar || totalBayar < 0) {
      showToast("Nominal pembayaran harus diisi.", "error");
      return;
    }

    if (totalBayar < Number(selected.total_harga || 0)) {
      showToast("Nominal bayar kurang dari total tagihan.", "error");
      return;
    }

    try {
      setSubmitting(true);
      const result = await konfirmasiCashPembayaran(selected.id_transaksi, {
        total_bayar: totalBayar,
      });

      setData((prev) =>
        prev.filter((item) => item.id_transaksi !== selected.id_transaksi)
      );
      prevIdsRef.current.delete(selected.id_transaksi);

      setReceipt({
        message: result.message || "Pembayaran cash berhasil dikonfirmasi.",
        data: result.data,
      });
      setSelected(null);
      setNominal("");
      showToast(result.message || "Pembayaran cash berhasil dikonfirmasi.");
    } catch (e) {
      showToast(
        e instanceof Error ? e.message : "Gagal konfirmasi pembayaran cash",
        "error"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const rows = useMemo(() => data, [data]);

  return (
    <div style={pageWrap}>
      {toast && (
        <div
          style={{
            position: "fixed",
            top: 20,
            right: 20,
            zIndex: 300,
            maxWidth: "min(92vw, 420px)",
            padding: "12px 16px",
            borderRadius: 12,
            background:
              toast.type === "success"
                ? "rgba(74,222,128,0.12)"
                : toast.type === "error"
                ? "rgba(248,113,113,0.12)"
                : "rgba(96,165,250,0.12)",
            border: `1px solid ${
              toast.type === "success"
                ? "rgba(74,222,128,0.3)"
                : toast.type === "error"
                ? "rgba(248,113,113,0.3)"
                : "rgba(96,165,250,0.3)"
            }`,
            color:
              toast.type === "success"
                ? "#4ade80"
                : toast.type === "error"
                ? "#f87171"
                : "#60a5fa",
            fontSize: 13.5,
            fontWeight: 500,
            boxShadow: "0 8px 20px rgba(0,0,0,0.25)",
          }}
        >
          {toast.type === "success"
            ? "✓"
            : toast.type === "error"
            ? "✕"
            : "🔔"}{" "}
          {toast.msg}
        </div>
      )}

      <div
        style={{
          marginBottom: 24,
          display: "flex",
          justifyContent: "space-between",
          gap: 16,
          flexWrap: "wrap",
          alignItems: "flex-start",
        }}
      >
        <div>
          <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800, color: "#f0eaff" }}>
            Konfirmasi Pembayaran Cash
          </h1>
          <p style={{ margin: "8px 0 0", color: "#9b8ec4", fontSize: 13.5 }}>
            Kelola pembayaran cash pelanggan, input nominal diterima, dan tampilkan hasil akhir
            seperti struk.
          </p>
        </div>

        <button
          onClick={() => requestNotificationPermission()}
          style={{
            padding: "10px 14px",
            borderRadius: 10,
            border: "1px solid rgba(159,110,245,0.25)",
            background: "rgba(255,255,255,0.04)",
            color: "#c9aff5",
            fontSize: 12.5,
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          Aktifkan Notifikasi Browser
        </button>
      </div>

      <div style={panelStyle}>
        {loading ? (
          <div style={{ padding: "52px 0", textAlign: "center", color: "#9b8ec4" }}>
            Memuat data...
          </div>
        ) : rows.length === 0 ? (
          <div style={{ padding: "60px 0", textAlign: "center", color: "#9b8ec4" }}>
            Tidak ada pembayaran cash yang menunggu.
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", minWidth: 900, borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(159,110,245,0.15)" }}>
                  {["ID", "Pelanggan", "PS", "Tanggal", "Tagihan", "Status", "Aksi"].map((h) => (
                    <th
                      key={h}
                      style={{
                        padding: "14px 20px",
                        textAlign: "left",
                        fontSize: 11,
                        fontWeight: 700,
                        letterSpacing: "0.06em",
                        textTransform: "uppercase",
                        color: "#9b8ec4",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((item) => {
                  const ps = item.detail_sewa?.[0]?.playstation;
                  return (
                    <tr
                      key={item.id_transaksi}
                      style={{ borderBottom: "1px solid rgba(159,110,245,0.08)" }}
                    >
                      <td style={{ padding: "16px 20px", color: "#f0eaff", fontWeight: 700 }}>
                        #{item.id_transaksi}
                      </td>
                      <td style={{ padding: "16px 20px", color: "#f0eaff" }}>
                        <div>{item.user?.name ?? "-"}</div>
                        <div style={{ fontSize: 12, color: "#9b8ec4" }}>
                          @{item.user?.username ?? "-"}
                        </div>
                      </td>
                      <td style={{ padding: "16px 20px", color: "#c4b5fd" }}>
                        {ps ? `${ps.nomor_ps} • ${ps.tipe?.nama_tipe ?? "-"}` : "Produk saja"}
                      </td>
                      <td style={{ padding: "16px 20px", color: "#9b8ec4" }}>
                        {formatDate(item.tanggal)}
                      </td>
                      <td
                        style={{
                          padding: "16px 20px",
                          color: "#f0eaff",
                          fontWeight: 700,
                          whiteSpace: "nowrap",
                        }}
                      >
                        {formatRupiah(Number(item.total_harga || 0))}
                      </td>
                      <td style={{ padding: "16px 20px" }}>
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            padding: "4px 12px",
                            borderRadius: 999,
                            background: "rgba(245,158,11,0.15)",
                            border: "1px solid rgba(245,158,11,0.25)",
                            fontSize: 12,
                            fontWeight: 700,
                            color: "#fbbf24",
                            whiteSpace: "nowrap",
                          }}
                        >
                          Menunggu Validasi
                        </span>
                      </td>
                      <td style={{ padding: "16px 20px" }}>
                        <button
                          onClick={() => setSelected(item)}
                          style={{
                            padding: "8px 14px",
                            borderRadius: 10,
                            border: "1px solid rgba(74,222,128,0.25)",
                            background: "rgba(74,222,128,0.08)",
                            color: "#4ade80",
                            fontSize: 12.5,
                            fontWeight: 700,
                            cursor: "pointer",
                          }}
                        >
                          Konfirmasi
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selected && (
        <ResponsiveModalShell
          title="Konfirmasi Pembayaran Cash"
          onClose={() => !submitting && setSelected(null)}
          width={760}
        >
          <p style={sectionSub}>
            Admin akan mencatat pembayaran cash dari{" "}
            <strong style={{ color: "#f0eaff" }}>{selected.user?.name ?? "-"}</strong>.
          </p>

          <div
            style={{
              marginTop: 18,
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              gap: 12,
            }}
          >
            <div style={detailCard}>
              <div style={{ color: "#9b8ec4", fontSize: 12 }}>ID Transaksi</div>
              <div style={{ color: "#f0eaff", fontWeight: 800, marginTop: 4 }}>
                #{selected.id_transaksi}
              </div>
            </div>
            <div style={detailCard}>
              <div style={{ color: "#9b8ec4", fontSize: 12 }}>Pelanggan</div>
              <div style={{ color: "#f0eaff", fontWeight: 700, marginTop: 4 }}>
                {selected.user?.name ?? "-"}
              </div>
            </div>
            <div style={detailCard}>
              <div style={{ color: "#9b8ec4", fontSize: 12 }}>Tagihan</div>
              <div style={{ color: "#f0eaff", fontWeight: 800, marginTop: 4 }}>
                {formatRupiah(Number(selected.total_harga || 0))}
              </div>
            </div>
          </div>

          <div style={{ marginTop: 20 }}>
            <div style={sectionTitle}>Detail Transaksi</div>
            <div
              style={{
                display: "grid",
                gap: 10,
                marginTop: 10,
                gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              }}
            >
              {(selected.detail_sewa ?? []).length > 0 ? (
                selected.detail_sewa?.map((sewa, index) => {
                  const uniqueKey =
                    sewa.id_dt_booking ?? `${sewa.id_ps ?? "ps"}-${index}`;

                  return (
                    <div key={uniqueKey} style={detailCard}>
                      <div style={{ color: "#f0eaff", fontWeight: 700 }}>
                        {sewa.playstation?.nomor_ps ?? "PS"} •{" "}
                        {sewa.playstation?.tipe?.nama_tipe ?? "-"}
                      </div>
                      <div style={{ color: "#9b8ec4", fontSize: 13, marginTop: 6 }}>
                        Mulai: {formatDate(sewa.jam_mulai)}
                      </div>
                      <div style={{ color: "#9b8ec4", fontSize: 13, marginTop: 4 }}>
                        Selesai: {formatDate(sewa.jam_selesai)}
                      </div>
                      <div style={{ color: "#9b8ec4", fontSize: 13, marginTop: 4 }}>
                        Durasi: {sewa.durasi_menit ?? 0} menit
                      </div>
                    </div>
                  );
                })
              ) : (
                <div style={detailCard}>
                  <div style={{ color: "#9b8ec4", fontSize: 13 }}>Tidak ada detail sewa</div>
                </div>
              )}
            </div>
          </div>

          {(selected.detail_produk?.length ?? 0) > 0 && (
            <div style={{ marginTop: 20 }}>
              <div style={sectionTitle}>Detail Produk</div>
              <div
                style={{
                  display: "grid",
                  gap: 10,
                  marginTop: 10,
                  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                }}
              >
                {selected.detail_produk?.map((produk, index) => {
                  const uniqueKey =
                    produk.id_dt_produk ??
                    `${produk.produk?.id_produk ?? "produk"}-${index}`;

                  return (
                    <div key={uniqueKey} style={detailCard}>
                      <div style={{ color: "#f0eaff", fontWeight: 700 }}>
                        {produk.produk?.nama ?? "-"}
                      </div>
                      <div style={{ color: "#9b8ec4", fontSize: 13, marginTop: 6 }}>
                        Qty: {produk.qty ?? 0}
                      </div>
                      <div style={{ color: "#9b8ec4", fontSize: 13, marginTop: 4 }}>
                        Harga: {formatRupiah(Number(produk.produk?.harga ?? 0))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <label
            style={{
              display: "block",
              marginTop: 22,
              marginBottom: 8,
              color: "#c4b5fd",
              fontSize: 13,
              fontWeight: 700,
            }}
          >
            Nominal bayar diterima
          </label>

          <input
            type="number"
            value={nominal}
            onChange={(e) => setNominal(e.target.value)}
            placeholder="Masukkan nominal bayar"
            style={{
              width: "100%",
              padding: "12px 14px",
              borderRadius: 12,
              border: "1px solid rgba(159,110,245,0.2)",
              background: "rgba(255,255,255,0.04)",
              color: "#f0eaff",
              outline: "none",
              boxSizing: "border-box",
              fontSize: 14,
            }}
          />

          <div
            style={{
              marginTop: 14,
              borderRadius: 16,
              background:
                "linear-gradient(135deg, rgba(109,75,195,0.18), rgba(34,197,94,0.08))",
              border: "1px solid rgba(159,110,245,0.18)",
              padding: 16,
            }}
          >
            <div style={{ color: "#c4b5fd", fontSize: 12, fontWeight: 700 }}>
              Ringkasan Pembayaran
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginTop: 10,
                color: "#f0eaff",
                fontSize: 14,
              }}
            >
              <span>Total Tagihan</span>
              <strong>{formatRupiah(selectedTagihan)}</strong>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginTop: 8,
                color: "#f0eaff",
                fontSize: 14,
              }}
            >
              <span>Uang Diterima</span>
              <strong>{formatRupiah(selectedNominal)}</strong>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginTop: 8,
                color: "#4ade80",
                fontSize: 15,
                fontWeight: 800,
              }}
            >
              <span>Kembalian</span>
              <span>{formatRupiah(selectedKembalian)}</span>
            </div>
          </div>

          <div style={modalFooterStyle}>
            <button
              onClick={() => setSelected(null)}
              disabled={submitting}
              style={secondaryModalBtn}
            >
              Batal
            </button>

            <button
              onClick={handleKonfirmasi}
              disabled={submitting}
              style={{
                ...successModalBtn,
                opacity: submitting ? 0.6 : 1,
                cursor: submitting ? "not-allowed" : "pointer",
              }}
            >
              {submitting ? "Memproses..." : "Konfirmasi Pembayaran"}
            </button>
          </div>
        </ResponsiveModalShell>
      )}

      {receipt && (
        <ResponsiveModalShell
          title="Struk Pembayaran Cash"
          onClose={() => setReceipt(null)}
          width={860}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 16,
              flexWrap: "wrap",
            }}
          >
            <div>
              <div style={{ color: "#4ade80", fontSize: 13, fontWeight: 800 }}>
                PEMBAYARAN BERHASIL
              </div>
              <p style={sectionSub}>{receipt.message}</p>
            </div>

            <div
              style={{
                width: 54,
                height: 54,
                borderRadius: "50%",
                display: "grid",
                placeItems: "center",
                background: "rgba(74,222,128,0.14)",
                color: "#4ade80",
                fontSize: 24,
                fontWeight: 900,
                flexShrink: 0,
              }}
            >
              ✓
            </div>
          </div>

          <div
            style={{
              marginTop: 18,
              borderRadius: 18,
              padding: 18,
              background:
                "linear-gradient(135deg, rgba(74,222,128,0.12), rgba(109,75,195,0.12))",
              border: "1px solid rgba(74,222,128,0.2)",
            }}
          >
            <div style={{ color: "#9b8ec4", fontSize: 12, fontWeight: 700 }}>KEMBALIAN</div>
            <div style={{ marginTop: 8, color: "#4ade80", fontSize: 30, fontWeight: 900 }}>
              {formatRupiah(Number(receipt.data.pembayaran?.kembalian ?? 0))}
            </div>
            <div style={{ marginTop: 8, color: "#c4b5fd", fontSize: 13 }}>
              Uang diterima:{" "}
              <strong style={{ color: "#f0eaff" }}>
                {formatRupiah(Number(receipt.data.pembayaran?.total_bayar ?? 0))}
              </strong>
            </div>
          </div>

          <div
            style={{
              marginTop: 18,
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              gap: 12,
            }}
          >
            <div style={detailCard}>
              <div style={{ color: "#9b8ec4", fontSize: 12 }}>ID Transaksi</div>
              <div style={{ color: "#f0eaff", fontWeight: 800, marginTop: 4 }}>
                #{receipt.data.id_transaksi}
              </div>
            </div>
            <div style={detailCard}>
              <div style={{ color: "#9b8ec4", fontSize: 12 }}>Waktu Bayar</div>
              <div style={{ color: "#f0eaff", fontWeight: 700, marginTop: 4 }}>
                {formatDate(receipt.data.pembayaran?.waktu_bayar)}
              </div>
            </div>
            <div style={detailCard}>
              <div style={{ color: "#9b8ec4", fontSize: 12 }}>Pelanggan</div>
              <div style={{ color: "#f0eaff", fontWeight: 700, marginTop: 4 }}>
                {receipt.data.user?.name ?? "-"}
              </div>
              <div style={{ color: "#9b8ec4", fontSize: 12, marginTop: 4 }}>
                @{receipt.data.user?.username ?? "-"}
              </div>
            </div>
            <div style={detailCard}>
              <div style={{ color: "#9b8ec4", fontSize: 12 }}>Metode</div>
              <div style={{ color: "#f0eaff", fontWeight: 700, marginTop: 4 }}>
                {(receipt.data.pembayaran?.metode_pembayaran ?? "cash").toUpperCase()}
              </div>
            </div>
          </div>

          <div style={{ marginTop: 20 }}>
            <div style={sectionTitle}>Ringkasan Pembayaran</div>
            <div style={{ display: "grid", gap: 10, marginTop: 12 }}>
              <div style={detailCard}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    color: "#f0eaff",
                    fontSize: 14,
                  }}
                >
                  <span>Total Tagihan</span>
                  <strong>{formatRupiah(Number(receipt.data.total_harga || 0))}</strong>
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    color: "#f0eaff",
                    fontSize: 14,
                    marginTop: 8,
                  }}
                >
                  <span>Total Bayar</span>
                  <strong>
                    {formatRupiah(Number(receipt.data.pembayaran?.total_bayar ?? 0))}
                  </strong>
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    color: "#4ade80",
                    fontSize: 15,
                    marginTop: 8,
                    fontWeight: 800,
                  }}
                >
                  <span>Kembalian</span>
                  <span>{formatRupiah(Number(receipt.data.pembayaran?.kembalian ?? 0))}</span>
                </div>
              </div>
            </div>
          </div>

          <div style={{ marginTop: 20 }}>
            <div style={sectionTitle}>Detail Sewa</div>
            <div
              style={{
                display: "grid",
                gap: 10,
                marginTop: 12,
                gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              }}
            >
              {(receipt.data.detail_sewa ?? []).length > 0 ? (
                receipt.data.detail_sewa?.map((sewa, index) => {
                  const uniqueKey =
                    sewa.id_dt_booking ?? `${sewa.id_ps ?? "ps"}-${index}`;

                  return (
                    <div key={uniqueKey} style={detailCard}>
                      <div style={{ color: "#f0eaff", fontWeight: 700 }}>
                        {sewa.playstation?.nomor_ps ?? "PS"} •{" "}
                        {sewa.playstation?.tipe?.nama_tipe ?? "-"}
                      </div>
                      <div style={{ color: "#9b8ec4", fontSize: 13, marginTop: 6 }}>
                        Mulai: {formatDate(sewa.jam_mulai)}
                      </div>
                      <div style={{ color: "#9b8ec4", fontSize: 13, marginTop: 4 }}>
                        Selesai: {formatDate(sewa.jam_selesai)}
                      </div>
                      <div style={{ color: "#9b8ec4", fontSize: 13, marginTop: 4 }}>
                        Durasi: {sewa.durasi_menit ?? 0} menit
                      </div>
                    </div>
                  );
                })
              ) : (
                <div style={detailCard}>
                  <div style={{ color: "#9b8ec4", fontSize: 13 }}>Tidak ada detail sewa</div>
                </div>
              )}
            </div>
          </div>

          {(receipt.data.detail_produk?.length ?? 0) > 0 && (
            <div style={{ marginTop: 20 }}>
              <div style={sectionTitle}>Detail Produk</div>
              <div
                style={{
                  display: "grid",
                  gap: 10,
                  marginTop: 12,
                  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                }}
              >
                {receipt.data.detail_produk?.map((produk, index) => {
                  const uniqueKey =
                    produk.id_dt_produk ??
                    `${produk.produk?.id_produk ?? "produk"}-${index}`;

                  return (
                    <div key={uniqueKey} style={detailCard}>
                      <div style={{ color: "#f0eaff", fontWeight: 700 }}>
                        {produk.produk?.nama ?? "-"}
                      </div>
                      <div style={{ color: "#9b8ec4", fontSize: 13, marginTop: 6 }}>
                        Qty: {produk.qty ?? 0}
                      </div>
                      <div style={{ color: "#9b8ec4", fontSize: 13, marginTop: 4 }}>
                        Harga: {formatRupiah(Number(produk.produk?.harga ?? 0))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div style={modalFooterStyle}>
            <button onClick={() => setReceipt(null)} style={primaryModalBtn}>
              Tutup Struk
            </button>
          </div>
        </ResponsiveModalShell>
      )}
    </div>
  );
}

function ResponsiveModalShell({
  title,
  onClose,
  children,
  width = 720,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  width?: number;
}) {
  return (
    <div
      onClick={(e) => e.target === e.currentTarget && onClose()}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 240,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(0,0,0,0.68)",
        backdropFilter: "blur(8px)",
        padding: 16,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: `min(${width}px, 96vw)`,
          maxHeight: "88vh",
          overflow: "hidden",
          background: "#1e1040",
          border: "1px solid rgba(159,110,245,0.25)",
          borderRadius: 20,
          boxShadow: "0 22px 40px rgba(0,0,0,0.35)",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            padding: "20px 20px 16px",
            borderBottom: "1px solid rgba(159,110,245,0.14)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          <h2 style={{ margin: 0, color: "#f0eaff", fontSize: 20, fontWeight: 800 }}>
            {title}
          </h2>

          <button
            onClick={onClose}
            style={{
              width: 34,
              height: 34,
              borderRadius: 10,
              border: "1px solid rgba(159,110,245,0.18)",
              background: "rgba(255,255,255,0.04)",
              color: "#c9aff5",
              fontSize: 18,
              cursor: "pointer",
            }}
          >
            ×
          </button>
        </div>

        <div
          style={{
            padding: 20,
            overflowY: "auto",
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

const modalFooterStyle: React.CSSProperties = {
  display: "flex",
  gap: 10,
  marginTop: 22,
  flexWrap: "wrap",
  justifyContent: "flex-end",
};

const primaryModalBtn: React.CSSProperties = {
  minWidth: 140,
  padding: "11px 16px",
  borderRadius: 12,
  border: "none",
  background: "linear-gradient(135deg, #6d4bc3, #8b5cf6)",
  color: "white",
  fontSize: 13.5,
  fontWeight: 800,
  cursor: "pointer",
};

const secondaryModalBtn: React.CSSProperties = {
  minWidth: 120,
  padding: "11px 16px",
  borderRadius: 12,
  border: "1px solid rgba(159,110,245,0.25)",
  background: "transparent",
  color: "#c9aff5",
  fontSize: 13.5,
  fontWeight: 700,
  cursor: "pointer",
};

const successModalBtn: React.CSSProperties = {
  minWidth: 160,
  padding: "11px 16px",
  borderRadius: 12,
  border: "none",
  background: "linear-gradient(135deg, #16a34a, #22c55e)",
  color: "white",
  fontSize: 13.5,
  fontWeight: 800,
  cursor: "pointer",
};