"use client";

import { useEffect, useMemo, useState } from "react";
import {
  type TransaksiData,
  getTransaksis,
  getTransaksiById,
} from "@/lib/api";
import { printReceipt } from "../monitoring/lib/helpers";

const formatRupiah = (n: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(n);

const formatDate = (iso?: string | null) => {
  if (!iso) return "-";

  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatDateTime = (iso?: string | null) => {
  if (!iso) return "-";

  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleString("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  });
};

const getStatusStyle = (status?: string) => {
  switch ((status || "").toLowerCase()) {
    case "aktif":
      return {
        color: "#fb923c",
        bg: "rgba(251,146,60,0.12)",
        border: "rgba(251,146,60,0.25)",
        dot: "#fb923c",
      };
    case "selesai":
      return {
        color: "#4ade80",
        bg: "rgba(74,222,128,0.12)",
        border: "rgba(74,222,128,0.25)",
        dot: "#4ade80",
      };
    case "dibatalkan":
    case "batal":
      return {
        color: "#f87171",
        bg: "rgba(248,113,113,0.12)",
        border: "rgba(248,113,113,0.25)",
        dot: "#f87171",
      };
    default:
      return {
        color: "#c4b5fd",
        bg: "rgba(159,110,245,0.12)",
        border: "rgba(159,110,245,0.25)",
        dot: "#9f6ef5",
      };
  }
};

const getPaymentStyle = (status?: string) => {
  switch ((status || "").toLowerCase()) {
    case "lunas":
      return {
        color: "#4ade80",
        bg: "rgba(74,222,128,0.12)",
        border: "rgba(74,222,128,0.25)",
        dot: "#4ade80",
      };
    case "pending":
      return {
        color: "#facc15",
        bg: "rgba(250,204,21,0.12)",
        border: "rgba(250,204,21,0.25)",
        dot: "#facc15",
      };
    case "gagal":
      return {
        color: "#f87171",
        bg: "rgba(248,113,113,0.12)",
        border: "rgba(248,113,113,0.25)",
        dot: "#f87171",
      };
    default:
      return {
        color: "#9b8ec4",
        bg: "rgba(255,255,255,0.04)",
        border: "rgba(159,110,245,0.15)",
        dot: "#9b8ec4",
      };
  }
};

export default function KelolaTransaksiPage() {
  const [data, setData] = useState<TransaksiData[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"semua" | "aktif" | "selesai" | "dibatalkan">("semua");
  const [sortOrder, setSortOrder] = useState<"terbaru" | "terlama">("terbaru");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const [printingId, setPrintingId] = useState<number | null>(null);

  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    fetchAll();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter, sortOrder, itemsPerPage]);

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchAll = async () => {
    setLoading(true);
    try {
      const res = await getTransaksis();
      setData(res.data ?? []);
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Gagal memuat data transaksi", "error");
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = async (id: number) => {
    setPrintingId(id);
    try {
      const detail = await getTransaksiById(id);
      printReceipt(detail as any);
      showToast("Struk berhasil dibuka");
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Gagal mencetak struk", "error");
    } finally {
      setPrintingId(null);
    }
  };

  const filteredData = useMemo(() => {
    const keyword = search.toLowerCase();

    const rows = data.filter((item) => {
      const userName = item.user?.name?.toLowerCase() ?? "";
      const username = item.user?.username?.toLowerCase() ?? "";
      const email = item.user?.email?.toLowerCase() ?? "";
      const idText = String(item.id_transaksi);

      const matchSearch =
        !keyword ||
        idText.includes(keyword) ||
        userName.includes(keyword) ||
        username.includes(keyword) ||
        email.includes(keyword);

      const matchStatus =
        statusFilter === "semua" ||
        item.status_transaksi?.toLowerCase() === statusFilter;

      return matchSearch && matchStatus;
    });

    rows.sort((a, b) => {
      const aTime = new Date(a.tanggal).getTime();
      const bTime = new Date(b.tanggal).getTime();
      return sortOrder === "terbaru" ? bTime - aTime : aTime - bTime;
    });

    return rows;
  }, [data, search, statusFilter, sortOrder]);

  const totalPages = Math.max(1, Math.ceil(filteredData.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedData = filteredData.slice(startIndex, endIndex);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  const stats = useMemo(() => {
    const total = data.length;
    const aktif = data.filter((i) => i.status_transaksi === "aktif").length;
    const selesai = data.filter((i) => i.status_transaksi === "selesai").length;
    const totalOmzet = data
      .filter((i) => i.status_transaksi === "selesai")
      .reduce((sum, item) => sum + Number(item.total_harga || 0), 0);

    return { total, aktif, selesai, totalOmzet };
  }, [data]);

  return (
    <div style={{ padding: "32px 40px", minHeight: "100vh" }}>
      {toast && (
        <div
          style={{
            position: "fixed",
            top: 20,
            right: 24,
            zIndex: 200,
            padding: "12px 20px",
            borderRadius: 12,
            background:
              toast.type === "success"
                ? "rgba(74,222,128,0.12)"
                : "rgba(248,113,113,0.12)",
            border: `1px solid ${
              toast.type === "success"
                ? "rgba(74,222,128,0.3)"
                : "rgba(248,113,113,0.3)"
            }`,
            color: toast.type === "success" ? "#4ade80" : "#f87171",
            fontSize: 13.5,
            fontWeight: 500,
            boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          {toast.type === "success" ? "✓" : "✕"} {toast.msg}
        </div>
      )}

      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          marginBottom: 24,
        }}
      >
        <div>
          <h1
            style={{
              margin: 0,
              fontSize: 22,
              fontWeight: 700,
              color: "#f0eaff",
            }}
          >
            Kelola Transaksi
          </h1>
          <p
            style={{
              margin: "4px 0 0",
              fontSize: 13,
              color: "#9b8ec4",
            }}
          >
            Manajemen data transaksi rental dan cetak struk
          </p>
        </div>

        <button
          onClick={fetchAll}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "10px 18px",
            borderRadius: 12,
            background: "linear-gradient(135deg, #5b2faa, #9f6ef5)",
            border: "none",
            color: "white",
            fontSize: 13.5,
            fontWeight: 600,
            cursor: "pointer",
            boxShadow: "0 4px 16px rgba(159,110,245,0.3)",
          }}
        >
          Refresh
        </button>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 14,
          marginBottom: 24,
        }}
      >
        {[
          {
            label: "Total Transaksi",
            value: stats.total,
            color: "#9f6ef5",
            bg: "rgba(159,110,245,0.08)",
            border: "rgba(159,110,245,0.2)",
          },
          {
            label: "Aktif",
            value: stats.aktif,
            color: "#fb923c",
            bg: "rgba(251,146,60,0.08)",
            border: "rgba(251,146,60,0.2)",
          },
          {
            label: "Selesai",
            value: stats.selesai,
            color: "#4ade80",
            bg: "rgba(74,222,128,0.08)",
            border: "rgba(74,222,128,0.2)",
          },
          {
            label: "Omzet",
            value: formatRupiah(stats.totalOmzet),
            color: "#60a5fa",
            bg: "rgba(96,165,250,0.08)",
            border: "rgba(96,165,250,0.2)",
          },
        ].map((s) => (
          <div
            key={s.label}
            style={{
              padding: "16px 20px",
              borderRadius: 14,
              background: s.bg,
              border: `1px solid ${s.border}`,
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
              {s.label}
            </p>
            <p
              style={{
                margin: "6px 0 0",
                fontSize: typeof s.value === "string" ? 22 : 28,
                fontWeight: 700,
                color: s.color,
              }}
            >
              {s.value}
            </p>
          </div>
        ))}
      </div>

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 10,
          marginBottom: 20,
          alignItems: "center",
        }}
      >
        <div style={{ position: "relative", flex: "1 1 220px", minWidth: 180 }}>
          <svg
            width="14"
            height="14"
            fill="none"
            stroke="#9b8ec4"
            strokeWidth="2"
            viewBox="0 0 24 24"
            style={{
              position: "absolute",
              left: 12,
              top: "50%",
              transform: "translateY(-50%)",
              pointerEvents: "none",
            }}
          >
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" strokeLinecap="round" />
          </svg>

          <input
            type="text"
            placeholder="Cari ID transaksi / pelanggan..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: "100%",
              padding: "8px 12px 8px 36px",
              borderRadius: 10,
              fontSize: 13,
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(159,110,245,0.2)",
              color: "#f0eaff",
              outline: "none",
              boxSizing: "border-box",
            }}
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) =>
            setStatusFilter(e.target.value as "semua" | "aktif" | "selesai" | "dibatalkan")
          }
          style={selectStyle}
        >
          <option value="semua" style={{ background: "#1e1040" }}>
            Semua Status
          </option>
          <option value="aktif" style={{ background: "#1e1040" }}>
            Aktif
          </option>
          <option value="selesai" style={{ background: "#1e1040" }}>
            Selesai
          </option>
          <option value="dibatalkan" style={{ background: "#1e1040" }}>
            Dibatalkan
          </option>
        </select>

        <select
          value={sortOrder}
          onChange={(e) => setSortOrder(e.target.value as "terbaru" | "terlama")}
          style={selectStyle}
        >
          <option value="terbaru" style={{ background: "#1e1040" }}>
            Terbaru
          </option>
          <option value="terlama" style={{ background: "#1e1040" }}>
            Terlama
          </option>
        </select>
      </div>

      <div
        style={{
          borderRadius: 16,
          border: "1px solid rgba(159,110,245,0.15)",
          background: "#160d2e",
          overflow: "hidden",
        }}
      >
        {loading ? (
          <div style={{ padding: "48px 0", textAlign: "center", color: "#9b8ec4" }}>
            <div
              style={{
                width: 32,
                height: 32,
                border: "2px solid rgba(159,110,245,0.2)",
                borderTop: "2px solid #9f6ef5",
                borderRadius: "50%",
                animation: "spin 0.8s linear infinite",
                margin: "0 auto 12px",
              }}
            />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            Memuat data transaksi...
          </div>
        ) : filteredData.length === 0 ? (
          <div style={{ padding: "56px 0", textAlign: "center" }}>
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: 16,
                background: "rgba(159,110,245,0.1)",
                border: "1px solid rgba(159,110,245,0.2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 14px",
                color: "#9f6ef5",
                fontWeight: 700,
              }}
            >
              #
            </div>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "#f0eaff" }}>
              {search ? "Tidak ada transaksi ditemukan" : "Belum ada transaksi"}
            </p>
            <p style={{ margin: "4px 0 0", fontSize: 13, color: "#9b8ec4" }}>
              {search ? "Coba ubah kata kunci pencarian." : "Data transaksi akan muncul di sini."}
            </p>
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(159,110,245,0.15)" }}>
                {["No", "ID", "Pelanggan", "Tanggal", "Status", "Pembayaran", "Total", "Aksi"].map((h) => (
                  <th
                    key={h}
                    style={{
                      padding: "14px 20px",
                      textAlign: "left",
                      fontSize: 11,
                      fontWeight: 600,
                      letterSpacing: "0.06em",
                      textTransform: "uppercase",
                      color: "#9b8ec4",
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginatedData.map((item, i) => {
                const statusStyle = getStatusStyle(item.status_transaksi);
                const paymentStyle = getPaymentStyle(item.pembayaran?.status_bayar);

                return (
                  <tr
                    key={item.id_transaksi}
                    style={{
                      borderBottom:
                        i < paginatedData.length - 1
                          ? "1px solid rgba(159,110,245,0.08)"
                          : "none",
                      transition: "background 0.15s",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = "rgba(159,110,245,0.05)")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = "transparent")
                    }
                  >
                    <td style={tdStyle}>{startIndex + i + 1}</td>

                    <td style={tdStyle}>
                      <span style={{ color: "#f0eaff", fontWeight: 700 }}>
                        #{item.id_transaksi}
                      </span>
                    </td>

                    <td style={tdStyle}>
                      <div style={{ color: "#f0eaff", fontWeight: 600 }}>
                        {item.user?.name ?? "-"}
                      </div>
                      <div style={{ fontSize: 11.5, color: "#9b8ec4" }}>
                        @{item.user?.username ?? "-"}
                      </div>
                    </td>

                    <td style={tdStyle}>
                      <div style={{ color: "#c4b5fd" }}>{formatDate(item.tanggal)}</div>
                      <div style={{ fontSize: 11.5, color: "#9b8ec4" }}>
                        {formatDateTime(item.tanggal)}
                      </div>
                    </td>

                    <td style={tdStyle}>
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 6,
                          padding: "4px 12px",
                          borderRadius: 8,
                          background: statusStyle.bg,
                          border: `1px solid ${statusStyle.border}`,
                          fontSize: 12,
                          fontWeight: 600,
                          color: statusStyle.color,
                          textTransform: "capitalize",
                        }}
                      >
                        <span
                          style={{
                            width: 5,
                            height: 5,
                            borderRadius: "50%",
                            background: statusStyle.dot,
                          }}
                        />
                        {item.status_transaksi}
                      </span>
                    </td>

                    <td style={tdStyle}>
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 6,
                          padding: "4px 12px",
                          borderRadius: 8,
                          background: paymentStyle.bg,
                          border: `1px solid ${paymentStyle.border}`,
                          fontSize: 12,
                          fontWeight: 600,
                          color: paymentStyle.color,
                          textTransform: "capitalize",
                        }}
                      >
                        <span
                          style={{
                            width: 5,
                            height: 5,
                            borderRadius: "50%",
                            background: paymentStyle.dot,
                          }}
                        />
                        {item.pembayaran?.status_bayar ?? "belum ada"}
                      </span>
                    </td>

                    <td style={tdStyle}>
                      <span style={{ color: "#f0eaff", fontWeight: 700 }}>
                        {formatRupiah(Number(item.total_harga || 0))}
                      </span>
                    </td>

                    <td style={tdStyle}>
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        <button
                          onClick={() => handlePrint(item.id_transaksi)}
                          disabled={printingId === item.id_transaksi}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                            padding: "7px 14px",
                            borderRadius: 8,
                            background: "rgba(59,130,246,0.12)",
                            border: "1px solid rgba(59,130,246,0.25)",
                            color: "#93c5fd",
                            fontSize: 12.5,
                            fontWeight: 500,
                            cursor: "pointer",
                            opacity: printingId === item.id_transaksi ? 0.7 : 1,
                          }}
                        >
                          {printingId === item.id_transaksi ? "Memuat..." : "Cetak Struk"}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {!loading && filteredData.length > 0 && (
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12,
            marginTop: 16,
            flexWrap: "wrap",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 13, color: "#9b8ec4" }}>Tampilkan</span>
            <select
              value={itemsPerPage}
              onChange={(e) => setItemsPerPage(Number(e.target.value))}
              style={selectStyle}
            >
              {[5, 10, 20, 50].map((n) => (
                <option key={n} value={n} style={{ background: "#1e1040" }}>
                  {n}
                </option>
              ))}
            </select>
            <span style={{ fontSize: 13, color: "#9b8ec4" }}>data / halaman</span>
          </div>

          <div style={{ fontSize: 13, color: "#9b8ec4" }}>
            Menampilkan {filteredData.length === 0 ? 0 : startIndex + 1} –{" "}
            {Math.min(endIndex, filteredData.length)} dari {filteredData.length} data
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              style={pagerBtn(currentPage === 1)}
            >
              Prev
            </button>

            <span
              style={{
                fontSize: 13,
                color: "#f0eaff",
                minWidth: 90,
                textAlign: "center",
              }}
            >
              Halaman {currentPage} / {totalPages}
            </span>

            <button
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
              style={pagerBtn(currentPage === totalPages)}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const tdStyle: React.CSSProperties = {
  padding: "16px 20px",
  color: "#9b8ec4",
  fontSize: 13,
};

const selectStyle: React.CSSProperties = {
  padding: "8px 12px",
  borderRadius: 10,
  fontSize: 13,
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(159,110,245,0.2)",
  color: "#f0eaff",
  outline: "none",
  cursor: "pointer",
};

const pagerBtn = (disabled: boolean): React.CSSProperties => ({
  padding: "8px 12px",
  borderRadius: 10,
  border: "1px solid rgba(159,110,245,0.25)",
  background: disabled ? "rgba(255,255,255,0.03)" : "transparent",
  color: disabled ? "#666" : "#c9aff5",
  cursor: disabled ? "not-allowed" : "pointer",
});