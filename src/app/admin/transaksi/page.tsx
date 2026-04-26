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
  }).format(Number(n || 0));

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

const getNormalizedPaymentStatus = (status?: string | null) => {
  const value = (status ?? "").toString().trim().toLowerCase();

  if (!value) return "belum ada";
  if (value === "paid" || value === "success") return "lunas";
  if (value === "menuggu") return "menunggu";
  if (value === "pending") return "menunggu";
  if (value === "menunggu_validasi") return "menunggu validasi";
  return value;
};

const isLunas = (status?: string | null) =>
  getNormalizedPaymentStatus(status) === "lunas";

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
    case "waiting":
      return {
        color: "#facc15",
        bg: "rgba(250,204,21,0.12)",
        border: "rgba(250,204,21,0.25)",
        dot: "#facc15",
      };
    case "dijadwalkan":
      return {
        color: "#60a5fa",
        bg: "rgba(96,165,250,0.12)",
        border: "rgba(96,165,250,0.25)",
        dot: "#60a5fa",
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
  const normalized = getNormalizedPaymentStatus(status);

  switch (normalized) {
    case "lunas":
      return {
        color: "#4ade80",
        bg: "rgba(74,222,128,0.12)",
        border: "rgba(74,222,128,0.25)",
        dot: "#4ade80",
      };
    case "menunggu":
      return {
        color: "#facc15",
        bg: "rgba(250,204,21,0.12)",
        border: "rgba(250,204,21,0.25)",
        dot: "#facc15",
      };
    case "menunggu validasi":
      return {
        color: "#fb923c",
        bg: "rgba(251,146,60,0.12)",
        border: "rgba(251,146,60,0.25)",
        dot: "#fb923c",
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

type PeriodFilter = "semua" | "hari_ini" | "minggu_ini" | "bulan_ini";
type DetailModalState = {
  loading: boolean;
  data: TransaksiData | null;
  id: number | null;
};

export default function KelolaTransaksiPage() {
  const [data, setData] = useState<TransaksiData[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [statusTransaksiFilter, setStatusTransaksiFilter] = useState<
    "semua" | "aktif" | "selesai" | "batal" | "waiting" | "dijadwalkan"
  >("semua");
  const [statusPembayaranFilter, setStatusPembayaranFilter] = useState<
    "semua" | "lunas" | "menunggu" | "menunggu_validasi" | "gagal" | "belum_ada"
  >("semua");
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>("bulan_ini");
  const [sortOrder, setSortOrder] = useState<"terbaru" | "terlama">("terbaru");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const [printingId, setPrintingId] = useState<number | null>(null);
  const [detailModal, setDetailModal] = useState<DetailModalState>({
    loading: false,
    data: null,
    id: null,
  });

  const [toast, setToast] = useState<{
    msg: string;
    type: "success" | "error";
  } | null>(null);

  useEffect(() => {
    void fetchAll();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [
    search,
    statusTransaksiFilter,
    statusPembayaranFilter,
    periodFilter,
    sortOrder,
    itemsPerPage,
  ]);

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
      showToast(
        e instanceof Error ? e.message : "Gagal memuat data transaksi",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = async (id: number, paymentStatus?: string | null) => {
    if (!isLunas(paymentStatus)) {
      showToast("Struk hanya bisa dicetak jika pembayaran sudah lunas.", "error");
      return;
    }

    setPrintingId(id);
    try {
      const detail = await getTransaksiById(id);
      printReceipt(detail as any);
      showToast("Struk berhasil dibuka");
    } catch (e) {
      showToast(
        e instanceof Error ? e.message : "Gagal mencetak struk",
        "error"
      );
    } finally {
      setPrintingId(null);
    }
  };

  const openDetail = async (id: number) => {
    setDetailModal({
      loading: true,
      data: null,
      id,
    });

    try {
      const detail = await getTransaksiById(id);
      setDetailModal({
        loading: false,
        data: detail as any,
        id,
      });
    } catch (e) {
      setDetailModal({
        loading: false,
        data: null,
        id: null,
      });
      showToast(
        e instanceof Error ? e.message : "Gagal memuat detail transaksi",
        "error"
      );
    }
  };

  const closeDetail = () => {
    setDetailModal({
      loading: false,
      data: null,
      id: null,
    });
  };

  const filteredData = useMemo(() => {
    const keyword = search.toLowerCase();

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(startOfToday);
    const day = startOfWeek.getDay();
    const mondayOffset = day === 0 ? -6 : 1 - day;
    startOfWeek.setDate(startOfWeek.getDate() + mondayOffset);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const rows = data.filter((item) => {
      const userName = item.user?.name?.toLowerCase() ?? "";
      const username = item.user?.username?.toLowerCase() ?? "";
      const email = item.user?.email?.toLowerCase() ?? "";
      const idText = String(item.id_transaksi);
      const transaksiStatus = (item.status_transaksi ?? "").toLowerCase();
      const pembayaranStatus = getNormalizedPaymentStatus(item.pembayaran?.status_bayar);
      const tanggal = item.tanggal ? new Date(item.tanggal) : null;

      const matchSearch =
        !keyword ||
        idText.includes(keyword) ||
        userName.includes(keyword) ||
        username.includes(keyword) ||
        email.includes(keyword);

      const matchStatusTransaksi =
        statusTransaksiFilter === "semua" ||
        transaksiStatus === statusTransaksiFilter;

      const matchStatusPembayaran =
        statusPembayaranFilter === "semua" ||
        (statusPembayaranFilter === "belum_ada"
          ? pembayaranStatus === "belum ada"
          : statusPembayaranFilter === "menunggu_validasi"
          ? pembayaranStatus === "menunggu validasi"
          : pembayaranStatus === statusPembayaranFilter);

      const matchPeriod =
        periodFilter === "semua" ||
        !tanggal ||
        (periodFilter === "hari_ini" && tanggal >= startOfToday) ||
        (periodFilter === "minggu_ini" && tanggal >= startOfWeek) ||
        (periodFilter === "bulan_ini" && tanggal >= startOfMonth);

      return (
        matchSearch &&
        matchStatusTransaksi &&
        matchStatusPembayaran &&
        matchPeriod
      );
    });

    rows.sort((a, b) => {
      const aTime = new Date(a.tanggal).getTime();
      const bTime = new Date(b.tanggal).getTime();
      return sortOrder === "terbaru" ? bTime - aTime : aTime - bTime;
    });

    return rows;
  }, [
    data,
    search,
    statusTransaksiFilter,
    statusPembayaranFilter,
    periodFilter,
    sortOrder,
  ]);

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
    const belumLunas = data.filter(
      (i) => !isLunas(i.pembayaran?.status_bayar)
    ).length;

    return { total, aktif, selesai, belumLunas };
  }, [data]);

  return (
    <div style={{ padding: "32px 24px", minHeight: "100vh" }}>
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
          gap: 16,
          flexWrap: "wrap",
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
            Manajemen data transaksi, cek detail, dan cetak struk jika pembayaran sudah lunas
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
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
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
            label: "Transaksi Aktif",
            value: stats.aktif,
            color: "#fb923c",
            bg: "rgba(251,146,60,0.08)",
            border: "rgba(251,146,60,0.2)",
          },
          {
            label: "Transaksi Selesai",
            value: stats.selesai,
            color: "#4ade80",
            bg: "rgba(74,222,128,0.08)",
            border: "rgba(74,222,128,0.2)",
          },
          {
            label: "Belum Lunas",
            value: stats.belumLunas,
            color: "#facc15",
            bg: "rgba(250,204,21,0.08)",
            border: "rgba(250,204,21,0.2)",
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
                fontSize: 28,
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
        <div style={{ position: "relative", flex: "1 1 240px", minWidth: 200 }}>
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
          value={statusTransaksiFilter}
          onChange={(e) =>
            setStatusTransaksiFilter(
              e.target.value as
                | "semua"
                | "aktif"
                | "selesai"
                | "batal"
                | "waiting"
                | "dijadwalkan"
            )
          }
          style={selectStyle}
        >
          <option value="semua" style={{ background: "#1e1040" }}>
            Semua Transaksi
          </option>
          <option value="aktif" style={{ background: "#1e1040" }}>
            Aktif
          </option>
          <option value="selesai" style={{ background: "#1e1040" }}>
            Selesai
          </option>
          <option value="waiting" style={{ background: "#1e1040" }}>
            Waiting
          </option>
          <option value="dijadwalkan" style={{ background: "#1e1040" }}>
            Dijadwalkan
          </option>
          <option value="batal" style={{ background: "#1e1040" }}>
            Batal
          </option>
        </select>

        <select
          value={statusPembayaranFilter}
          onChange={(e) =>
            setStatusPembayaranFilter(
              e.target.value as
                | "semua"
                | "lunas"
                | "menunggu"
                | "menunggu_validasi"
                | "gagal"
                | "belum_ada"
            )
          }
          style={selectStyle}
        >
          <option value="semua" style={{ background: "#1e1040" }}>
            Semua Pembayaran
          </option>
          <option value="lunas" style={{ background: "#1e1040" }}>
            Lunas
          </option>
          <option value="menunggu" style={{ background: "#1e1040" }}>
            Menunggu
          </option>
          <option value="menunggu_validasi" style={{ background: "#1e1040" }}>
            Menunggu Validasi
          </option>
          <option value="gagal" style={{ background: "#1e1040" }}>
            Gagal
          </option>
          <option value="belum_ada" style={{ background: "#1e1040" }}>
            Belum Ada
          </option>
        </select>

        <select
          value={periodFilter}
          onChange={(e) => setPeriodFilter(e.target.value as PeriodFilter)}
          style={selectStyle}
        >
          <option value="semua" style={{ background: "#1e1040" }}>
            Semua Waktu
          </option>
          <option value="hari_ini" style={{ background: "#1e1040" }}>
            Hari Ini
          </option>
          <option value="minggu_ini" style={{ background: "#1e1040" }}>
            Minggu Ini
          </option>
          <option value="bulan_ini" style={{ background: "#1e1040" }}>
            Bulan Ini
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
          overflowX: "auto",
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
          <table style={{ width: "100%", minWidth: 1080, borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(159,110,245,0.15)" }}>
                {[
                  "No",
                  "ID",
                  "Pelanggan",
                  "Tanggal",
                  "Status Transaksi",
                  "Status Pembayaran",
                  "Total",
                  "Aksi",
                ].map((h) => (
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
                const normalizedPaymentStatus = getNormalizedPaymentStatus(
                  item.pembayaran?.status_bayar
                );
                const paymentStyle = getPaymentStyle(item.pembayaran?.status_bayar);
                const printable = isLunas(item.pembayaran?.status_bayar);

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
                        {normalizedPaymentStatus}
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
                          onClick={() => void openDetail(item.id_transaksi)}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                            padding: "7px 14px",
                            borderRadius: 8,
                            background: "rgba(159,110,245,0.12)",
                            border: "1px solid rgba(159,110,245,0.25)",
                            color: "#c4b5fd",
                            fontSize: 12.5,
                            fontWeight: 500,
                            cursor: "pointer",
                          }}
                        >
                          Detail
                        </button>

                        <button
                          onClick={() =>
                            void handlePrint(item.id_transaksi, item.pembayaran?.status_bayar)
                          }
                          disabled={printingId === item.id_transaksi || !printable}
                          title={
                            printable
                              ? "Cetak struk"
                              : "Struk hanya bisa dicetak jika pembayaran lunas"
                          }
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                            padding: "7px 14px",
                            borderRadius: 8,
                            background: printable
                              ? "rgba(59,130,246,0.12)"
                              : "rgba(255,255,255,0.04)",
                            border: printable
                              ? "1px solid rgba(59,130,246,0.25)"
                              : "1px solid rgba(159,110,245,0.12)",
                            color: printable ? "#93c5fd" : "#6b7280",
                            fontSize: 12.5,
                            fontWeight: 500,
                            cursor:
                              printingId === item.id_transaksi || !printable
                                ? "not-allowed"
                                : "pointer",
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

      {(detailModal.loading || detailModal.data) && (
        <ResponsiveModalShell
          title={
            detailModal.loading
              ? "Memuat Detail Transaksi"
              : `Detail Transaksi #${detailModal.data?.id_transaksi ?? ""}`
          }
          onClose={closeDetail}
          width={920}
        >
          {detailModal.loading ? (
            <div style={{ padding: "24px 0", textAlign: "center", color: "#9b8ec4" }}>
              Memuat detail transaksi...
            </div>
          ) : detailModal.data ? (
            <DetailTransaksiContent
              item={detailModal.data}
              printingId={printingId}
              onPrint={() =>
                void handlePrint(
                  detailModal.data!.id_transaksi,
                  detailModal.data!.pembayaran?.status_bayar
                )
              }
              onClose={closeDetail}
            />
          ) : null}
        </ResponsiveModalShell>
      )}
    </div>
  );
}

function DetailTransaksiContent({
  item,
  printingId,
  onPrint,
  onClose,
}: {
  item: TransaksiData;
  printingId: number | null;
  onPrint: () => void;
  onClose: () => void;
}) {
  const normalizedPayment = getNormalizedPaymentStatus(item.pembayaran?.status_bayar);
  const printable = isLunas(item.pembayaran?.status_bayar);

  return (
    <div style={{ display: "grid", gap: 18 }}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 12,
        }}
      >
        <InfoBox label="Pelanggan" value={item.user?.name ?? "-"} />
        <InfoBox label="Username" value={`@${item.user?.username ?? "-"}`} />
        <InfoBox label="Tanggal" value={formatDateTime(item.tanggal)} />
        <InfoBox label="Status Transaksi" value={item.status_transaksi ?? "-"} />
        <InfoBox label="Status Pembayaran" value={normalizedPayment} />
        <InfoBox label="Total" value={formatRupiah(Number(item.total_harga || 0))} />
      </div>

      <div>
        <div style={sectionTitle}>Detail Sewa</div>
        {(item.detail_sewa?.length ?? 0) > 0 ? (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: 12,
              marginTop: 10,
            }}
          >
            {item.detail_sewa?.map((sewa, index) => {
              const uniqueKey =
                sewa.id_dt_booking ?? `${sewa.id_ps ?? "ps"}-${index}`;

              return (
                <div key={uniqueKey} style={detailCardStyle}>
                  <div style={{ color: "#f0eaff", fontWeight: 700 }}>
                    {sewa.playstation?.nomor_ps ?? "PS"} •{" "}
                    {sewa.playstation?.tipe?.nama_tipe ?? sewa.tipe_ps ?? "-"}
                  </div>
                  <div style={detailTextStyle}>Mulai: {formatDateTime(sewa.jam_mulai)}</div>
                  <div style={detailTextStyle}>Selesai: {formatDateTime(sewa.jam_selesai)}</div>
                  <div style={detailTextStyle}>
                    Harga/jam: {formatRupiah(Number(sewa.harga_perjam || 0))}
                  </div>
                  <div style={detailTextStyle}>
                    Subtotal: {formatRupiah(Number(sewa.subtotal || 0))}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div style={emptyBoxStyle}>Tidak ada detail sewa</div>
        )}
      </div>

      <div>
        <div style={sectionTitle}>Detail Produk</div>
        {(item.detail_produk?.length ?? 0) > 0 ? (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: 12,
              marginTop: 10,
            }}
          >
            {item.detail_produk?.map((produk, index) => {
              const uniqueKey =
                produk.id_detail_produk ??
                `${produk.produk?.id_produk ?? "produk"}-${index}`;

              return (
                <div key={uniqueKey} style={detailCardStyle}>
                  <div style={{ color: "#f0eaff", fontWeight: 700 }}>
                    {produk.produk?.nama ?? "-"}
                  </div>
                  <div style={detailTextStyle}>Qty: {produk.qty ?? 0}</div>
                  <div style={detailTextStyle}>
                    Harga: {formatRupiah(Number(produk.produk?.harga ?? 0))}
                  </div>
                  <div style={detailTextStyle}>
                    Subtotal: {formatRupiah(Number(produk.subtotal || 0))}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div style={emptyBoxStyle}>Tidak ada detail produk</div>
        )}
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          gap: 10,
          flexWrap: "wrap",
          marginTop: 8,
        }}
      >
        <button onClick={onClose} style={secondaryBtnStyle}>
          Tutup
        </button>
        <button
          onClick={onPrint}
          disabled={printingId === item.id_transaksi || !printable}
          style={{
            ...primaryBtnStyle,
            opacity: printingId === item.id_transaksi || !printable ? 0.6 : 1,
            cursor:
              printingId === item.id_transaksi || !printable
                ? "not-allowed"
                : "pointer",
          }}
          title={
            printable
              ? "Cetak struk"
              : "Struk hanya bisa dicetak jika pembayaran sudah lunas"
          }
        >
          {printingId === item.id_transaksi ? "Memuat..." : "Cetak Struk"}
        </button>
      </div>
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

function InfoBox({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        padding: "12px 14px",
        borderRadius: 12,
        border: "1px solid rgba(159,110,245,0.15)",
        background: "rgba(255,255,255,0.03)",
      }}
    >
      <div style={{ fontSize: 12, color: "#9b8ec4", marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 13.5, color: "#f0eaff", fontWeight: 600 }}>{value}</div>
    </div>
  );
}

const sectionTitle: React.CSSProperties = {
  marginBottom: 10,
  fontSize: 13,
  fontWeight: 700,
  color: "#c4b5fd",
};

const detailCardStyle: React.CSSProperties = {
  padding: "12px 14px",
  borderRadius: 12,
  border: "1px solid rgba(159,110,245,0.15)",
  background: "rgba(255,255,255,0.03)",
};

const detailTextStyle: React.CSSProperties = {
  marginTop: 6,
  fontSize: 12.5,
  color: "#9b8ec4",
};

const emptyBoxStyle: React.CSSProperties = {
  padding: "12px 14px",
  borderRadius: 12,
  color: "#9b8ec4",
  background: "rgba(255,255,255,0.03)",
};

const primaryBtnStyle: React.CSSProperties = {
  minWidth: 140,
  padding: "11px 16px",
  borderRadius: 12,
  border: "none",
  background: "linear-gradient(135deg, #6d4bc3, #8b5cf6)",
  color: "white",
  fontSize: 13.5,
  fontWeight: 800,
};

const secondaryBtnStyle: React.CSSProperties = {
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