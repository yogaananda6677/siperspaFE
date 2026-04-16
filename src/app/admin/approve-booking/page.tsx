"use client";

import { useEffect, useMemo, useState } from "react";
import {
  type ApprovalBookingItem,
  approveBooking,
  getWaitingBookings,
  rejectBooking,
} from "@/lib/api";

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

const formatTime = (iso?: string | null) => {
  if (!iso) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatRupiah = (n: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(n);

const initials = (name: string) =>
  name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

const AVATAR_COLORS = [
  "linear-gradient(135deg,#6366f1,#a855f7)",
  "linear-gradient(135deg,#0ea5e9,#6366f1)",
  "linear-gradient(135deg,#f59e0b,#ef4444)",
  "linear-gradient(135deg,#10b981,#0ea5e9)",
  "linear-gradient(135deg,#ec4899,#a855f7)",
];

const avatarColor = (id: number) => AVATAR_COLORS[id % AVATAR_COLORS.length];

export default function ApproveBookingPage() {
  const [data, setData] = useState<ApprovalBookingItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const [selected, setSelected] = useState<ApprovalBookingItem | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);

  const [submittingApprove, setSubmittingApprove] = useState(false);
  const [submittingReject, setSubmittingReject] = useState(false);

  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    void fetchAll();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, sortOrder, itemsPerPage]);

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchAll = async () => {
    setLoading(true);
    try {
      const rows = await getWaitingBookings();
      setData(rows);
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Gagal memuat booking", "error");
    } finally {
      setLoading(false);
    }
  };

  const openDetail = (item: ApprovalBookingItem) => {
    setSelected(item);
    setShowDetailModal(true);
  };

  const openApprove = (item: ApprovalBookingItem) => {
    setSelected(item);
    setShowApproveModal(true);
  };

  const openReject = (item: ApprovalBookingItem) => {
    setSelected(item);
    setShowRejectModal(true);
  };

  const handleApprove = async () => {
    if (!selected) return;
    setSubmittingApprove(true);
    try {
      const updated = await approveBooking(selected.id_transaksi);
      setData((prev) => prev.filter((x) => x.id_transaksi !== updated.id_transaksi));
      showToast("Booking berhasil di-approve");
      setShowApproveModal(false);
      setShowDetailModal(false);
      setSelected(null);
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Gagal approve booking", "error");
    } finally {
      setSubmittingApprove(false);
    }
  };

  const handleReject = async () => {
    if (!selected) return;
    setSubmittingReject(true);
    try {
      await rejectBooking(selected.id_transaksi);
      setData((prev) => prev.filter((x) => x.id_transaksi !== selected.id_transaksi));
      showToast("Booking berhasil ditolak");
      setShowRejectModal(false);
      setShowDetailModal(false);
      setSelected(null);
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Gagal menolak booking", "error");
    } finally {
      setSubmittingReject(false);
    }
  };

  const filteredData = useMemo(() => {
    return [...data]
      .filter((item) => {
        const keyword = search.toLowerCase();
        const userName = item.user?.name?.toLowerCase() ?? "";
        const username = item.user?.username?.toLowerCase() ?? "";
        const email = item.user?.email?.toLowerCase() ?? "";
        const psName =
          item.detail_sewa?.[0]?.playstation?.nomor_ps?.toLowerCase() ?? "";

        return (
          !keyword ||
          userName.includes(keyword) ||
          username.includes(keyword) ||
          email.includes(keyword) ||
          psName.includes(keyword) ||
          String(item.id_transaksi).includes(keyword)
        );
      })
      .sort((a, b) => {
        const da = new Date(a.tanggal).getTime();
        const db = new Date(b.tanggal).getTime();
        return sortOrder === "asc" ? da - db : db - da;
      });
  }, [data, search, sortOrder]);

  const totalPages = Math.max(1, Math.ceil(filteredData.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedData = filteredData.slice(startIndex, endIndex);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  const stats = {
    totalWaiting: data.length,
    totalSewa: data.filter((x) => (x.detail_sewa?.length ?? 0) > 0).length,
    totalProduk: data.filter((x) => (x.detail_produk?.length ?? 0) > 0).length,
  };

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
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: "#f0eaff" }}>
            Approve Booking Pelanggan
          </h1>
          <p style={{ margin: "4px 0 0", fontSize: 13, color: "#9b8ec4" }}>
            Kelola booking dari aplikasi yang menunggu persetujuan admin
          </p>
        </div>
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
            label: "Total Waiting",
            value: stats.totalWaiting,
            color: "#f59e0b",
            bg: "rgba(245,158,11,0.08)",
            border: "rgba(245,158,11,0.2)",
          },
          {
            label: "Booking Sewa",
            value: stats.totalSewa,
            color: "#9f6ef5",
            bg: "rgba(159,110,245,0.08)",
            border: "rgba(159,110,245,0.2)",
          },
          {
            label: "Booking Produk",
            value: stats.totalProduk,
            color: "#4ade80",
            bg: "rgba(74,222,128,0.08)",
            border: "rgba(74,222,128,0.2)",
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
        <div style={{ position: "relative", flex: "1 1 220px", minWidth: 180 }}>
          <input
            type="text"
            placeholder="Cari nama, username, email, PS, ID transaksi..."
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
        </div>

        <select
          value={sortOrder}
          onChange={(e) => setSortOrder(e.target.value as "asc" | "desc")}
          style={{
            padding: "8px 12px",
            borderRadius: 10,
            fontSize: 13,
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(159,110,245,0.2)",
            color: "#f0eaff",
            outline: "none",
            cursor: "pointer",
          }}
        >
          <option value="desc" style={{ background: "#1e1040" }}>Terbaru</option>
          <option value="asc" style={{ background: "#1e1040" }}>Terlama</option>
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
            Memuat data...
          </div>
        ) : filteredData.length === 0 ? (
          <div style={{ padding: "56px 0", textAlign: "center", color: "#9b8ec4" }}>
            Tidak ada booking waiting.
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(159,110,245,0.15)" }}>
                {["No", "Pelanggan", "PS", "Tanggal", "Status", "Total", "Aksi"].map((h) => (
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
                const ps = item.detail_sewa?.[0]?.playstation;
                return (
                  <tr
                    key={item.id_transaksi}
                    style={{
                      borderBottom:
                        i < paginatedData.length - 1
                          ? "1px solid rgba(159,110,245,0.08)"
                          : "none",
                    }}
                  >
                    <td style={{ padding: "16px 20px", fontSize: 13, color: "#9b8ec4" }}>
                      {startIndex + i + 1}
                    </td>

                    <td style={{ padding: "16px 20px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div
                          style={{
                            width: 36,
                            height: 36,
                            borderRadius: 10,
                            background: avatarColor(item.user?.id_user ?? i),
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 12,
                            fontWeight: 700,
                            color: "white",
                            flexShrink: 0,
                          }}
                        >
                          {initials(item.user?.name ?? "U")}
                        </div>
                        <div>
                          <div style={{ fontSize: 13.5, fontWeight: 600, color: "#f0eaff" }}>
                            {item.user?.name ?? "-"}
                          </div>
                          <div style={{ fontSize: 11.5, color: "#9b8ec4" }}>
                            @{item.user?.username ?? "-"}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td style={{ padding: "16px 20px", color: "#c4b5fd", fontSize: 13 }}>
                      {ps ? `${ps.nomor_ps} • ${ps.tipe?.nama_tipe ?? "-"}` : "Produk saja"}
                    </td>

                    <td style={{ padding: "16px 20px", color: "#9b8ec4", fontSize: 13 }}>
                      {formatDate(item.tanggal)}
                    </td>

                    <td style={{ padding: "16px 20px" }}>
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 6,
                          padding: "4px 12px",
                          borderRadius: 8,
                          background: "rgba(245,158,11,0.15)",
                          border: "1px solid rgba(245,158,11,0.25)",
                          fontSize: 12,
                          fontWeight: 600,
                          color: "#fbbf24",
                        }}
                      >
                        Waiting
                      </span>
                    </td>

                    <td style={{ padding: "16px 20px", color: "#f0eaff", fontSize: 13, fontWeight: 600 }}>
                      {formatRupiah(Number(item.total_harga || 0))}
                    </td>

                    <td style={{ padding: "16px 20px" }}>
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        <button onClick={() => openDetail(item)} style={actionBtn("#a47de8", "rgba(159,110,245,0.1)", "rgba(159,110,245,0.25)")}>
                          Detail
                        </button>
                        <button onClick={() => openApprove(item)} style={actionBtn("#4ade80", "rgba(74,222,128,0.08)", "rgba(74,222,128,0.2)")}>
                          Approve
                        </button>
                        <button onClick={() => openReject(item)} style={actionBtn("#f87171", "rgba(248,113,113,0.08)", "rgba(248,113,113,0.2)")}>
                          Reject
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
              style={{
                padding: "8px 12px",
                borderRadius: 10,
                fontSize: 13,
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(159,110,245,0.2)",
                color: "#f0eaff",
                outline: "none",
                cursor: "pointer",
              }}
            >
              {[5, 10, 20, 50].map((n) => (
                <option key={n} value={n} style={{ background: "#1e1040" }}>{n}</option>
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

            <span style={{ fontSize: 13, color: "#f0eaff", minWidth: 90, textAlign: "center" }}>
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

      {showDetailModal && selected && (
        <ModalShell title={`Detail Booking #${selected.id_transaksi}`} onClose={() => setShowDetailModal(false)}>
          <DetailContent item={selected} />

          <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
            <button
              onClick={() => {
                setShowDetailModal(false);
                setShowApproveModal(true);
              }}
              style={primaryModalBtn}
            >
              Approve
            </button>
            <button
              onClick={() => {
                setShowDetailModal(false);
                setShowRejectModal(true);
              }}
              style={dangerModalBtn}
            >
              Reject
            </button>
          </div>
        </ModalShell>
      )}

      {showApproveModal && selected && (
        <ModalShell title="Approve Booking" onClose={() => !submittingApprove && setShowApproveModal(false)}>
          <p style={{ margin: 0, fontSize: 13.5, color: "#9b8ec4", lineHeight: 1.7 }}>
            Booking dari <strong style={{ color: "#f0eaff" }}>{selected.user?.name ?? "-"}</strong> akan diubah menjadi
            transaksi aktif.
          </p>

          <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
            <button
              onClick={() => setShowApproveModal(false)}
              disabled={submittingApprove}
              style={secondaryModalBtn}
            >
              Batal
            </button>
            <button
              onClick={handleApprove}
              disabled={submittingApprove}
              style={{
                ...primaryModalBtn,
                opacity: submittingApprove ? 0.6 : 1,
                cursor: submittingApprove ? "not-allowed" : "pointer",
              }}
            >
              {submittingApprove ? "Memproses..." : "Ya, Approve"}
            </button>
          </div>
        </ModalShell>
      )}

      {showRejectModal && selected && (
        <ModalShell title="Reject Booking" onClose={() => !submittingReject && setShowRejectModal(false)}>
          <p style={{ margin: 0, fontSize: 13.5, color: "#9b8ec4", lineHeight: 1.7 }}>
            Booking dari <strong style={{ color: "#f0eaff" }}>{selected.user?.name ?? "-"}</strong> akan ditolak.
          </p>

          <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
            <button
              onClick={() => setShowRejectModal(false)}
              disabled={submittingReject}
              style={secondaryModalBtn}
            >
              Batal
            </button>
            <button
              onClick={handleReject}
              disabled={submittingReject}
              style={{
                ...dangerModalBtn,
                opacity: submittingReject ? 0.6 : 1,
                cursor: submittingReject ? "not-allowed" : "pointer",
              }}
            >
              {submittingReject ? "Memproses..." : "Ya, Reject"}
            </button>
          </div>
        </ModalShell>
      )}
    </div>
  );
}

function DetailContent({ item }: { item: ApprovalBookingItem }) {
  return (
    <div style={{ display: "grid", gap: 16 }}>
      <InfoRow label="Pelanggan" value={`${item.user?.name ?? "-"} (@${item.user?.username ?? "-"})`} />
      <InfoRow label="Email" value={item.user?.email ?? "-"} />
      <InfoRow label="Tanggal Booking" value={formatDate(item.tanggal)} />
      <InfoRow label="Sumber" value={item.sumber_transaksi} />
      <InfoRow label="Status" value={item.status_transaksi} />
      <InfoRow label="Total" value={formatRupiah(Number(item.total_harga || 0))} />

      <div>
        <div style={sectionTitle}>Detail Sewa</div>
        {item.detail_sewa?.length ? (
          <div style={{ display: "grid", gap: 10 }}>
            {item.detail_sewa.map((sewa) => (
              <div key={sewa.id_dt_booking} style={detailCard}>
                <div style={{ fontWeight: 700, color: "#f0eaff" }}>
                  {sewa.playstation?.nomor_ps ?? "-"} • {sewa.playstation?.tipe?.nama_tipe ?? "-"}
                </div>
                <div style={detailText}>Mulai: {formatTime(sewa.jam_mulai)}</div>
                <div style={detailText}>Selesai: {formatTime(sewa.jam_selesai)}</div>
                <div style={detailText}>Durasi: {sewa.durasi_menit ?? 0} menit</div>
              </div>
            ))}
          </div>
        ) : (
          <div style={emptyMini}>Tidak ada item sewa</div>
        )}
      </div>

      <div>
        <div style={sectionTitle}>Detail Produk</div>
        {item.detail_produk?.length ? (
          <div style={{ display: "grid", gap: 10 }}>
            {item.detail_produk.map((produk, index) => {
            const uniqueKey =
                produk.id_detail_produk ??
                `${produk.produk?.id_produk ?? "produk"}-${index}`;

            return (
                <div key={uniqueKey} style={detailCard}>
                <div style={{ fontWeight: 700, color: "#f0eaff" }}>
                    {produk.produk?.nama ?? "-"}
                </div>
                </div>
            );
            })}
          </div>
        ) : (
          <div style={emptyMini}>Tidak ada produk</div>
        )}
      </div>
    </div>
  );
}

function ModalShell({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      onClick={(e) => e.target === e.currentTarget && onClose()}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(0,0,0,0.65)",
        backdropFilter: "blur(6px)",
        padding: 20,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#1e1040",
          border: "1px solid rgba(159,110,245,0.25)",
          borderRadius: 20,
          padding: "28px",
          width: 520,
          maxWidth: "100%",
          boxShadow: "0 24px 60px rgba(0,0,0,0.5)",
        }}
      >
        <h2 style={{ margin: "0 0 20px", fontSize: 16, fontWeight: 700, color: "#f0eaff" }}>
          {title}
        </h2>
        {children}
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={{ fontSize: 12, color: "#9b8ec4", marginBottom: 4 }}>{label}</div>
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

const detailCard: React.CSSProperties = {
  padding: "12px 14px",
  borderRadius: 12,
  border: "1px solid rgba(159,110,245,0.15)",
  background: "rgba(255,255,255,0.03)",
};

const detailText: React.CSSProperties = {
  marginTop: 4,
  fontSize: 12.5,
  color: "#9b8ec4",
};

const emptyMini: React.CSSProperties = {
  padding: "12px 14px",
  borderRadius: 12,
  color: "#9b8ec4",
  background: "rgba(255,255,255,0.03)",
};

const primaryModalBtn: React.CSSProperties = {
  flex: 1,
  padding: "11px 0",
  borderRadius: 10,
  background: "linear-gradient(135deg, #5b2faa, #9f6ef5)",
  border: "none",
  color: "white",
  fontSize: 13.5,
  fontWeight: 600,
  cursor: "pointer",
};

const secondaryModalBtn: React.CSSProperties = {
  flex: 1,
  padding: "11px 0",
  borderRadius: 10,
  border: "1px solid rgba(159,110,245,0.25)",
  background: "transparent",
  color: "#c9aff5",
  fontSize: 13.5,
  fontWeight: 600,
  cursor: "pointer",
};

const dangerModalBtn: React.CSSProperties = {
  flex: 1,
  padding: "11px 0",
  borderRadius: 10,
  border: "1px solid rgba(248,113,113,0.3)",
  background: "rgba(248,113,113,0.15)",
  color: "#f87171",
  fontSize: 13.5,
  fontWeight: 600,
  cursor: "pointer",
};

function actionBtn(color: string, bg: string, border: string): React.CSSProperties {
  return {
    display: "flex",
    alignItems: "center",
    gap: 6,
    padding: "7px 14px",
    borderRadius: 8,
    background: bg,
    border: `1px solid ${border}`,
    color,
    fontSize: 12.5,
    fontWeight: 500,
    cursor: "pointer",
  };
}

function pagerBtn(disabled: boolean): React.CSSProperties {
  return {
    padding: "8px 12px",
    borderRadius: 10,
    border: "1px solid rgba(159,110,245,0.25)",
    background: disabled ? "rgba(255,255,255,0.03)" : "transparent",
    color: disabled ? "#666" : "#c9aff5",
    cursor: disabled ? "not-allowed" : "pointer",
  };
}