"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  type KategoriAduan,
  type PengaduanItem,
  type StatusPengaduan,
  deletePengaduan,
  getAdminPengaduanSelesai,
  getAdminPengaduans,
  updateStatusPengaduan,
} from "@/lib/api";

const kategoriLabel = (kategori: string) => {
  const map: Record<string, string> = {
    ps_rusak: "PS Rusak",
    pelayanan: "Pelayanan",
    kebersihan: "Kebersihan",
    pembayaran: "Pembayaran",
    fasilitas: "Fasilitas",
    lainnya: "Lainnya",
  };

  return map[kategori] ?? kategori;
};

const statusLabel = (status: string) => {
  const map: Record<string, string> = {
    pending: "Pending",
    proses: "Diproses",
    selesai: "Selesai",
    dibatalkan: "Dibatalkan",
  };

  return map[status] ?? status;
};

const statusColor = (status: string) => {
  switch (status) {
    case "pending":
      return {
        color: "#fbbf24",
        bg: "rgba(245,158,11,0.15)",
        border: "rgba(245,158,11,0.25)",
      };
    case "proses":
      return {
        color: "#60a5fa",
        bg: "rgba(96,165,250,0.13)",
        border: "rgba(96,165,250,0.25)",
      };
    case "selesai":
      return {
        color: "#4ade80",
        bg: "rgba(74,222,128,0.12)",
        border: "rgba(74,222,128,0.24)",
      };
    case "dibatalkan":
      return {
        color: "#f87171",
        bg: "rgba(248,113,113,0.12)",
        border: "rgba(248,113,113,0.24)",
      };
    default:
      return {
        color: "#c4b5fd",
        bg: "rgba(159,110,245,0.12)",
        border: "rgba(159,110,245,0.24)",
      };
  }
};

const formatDateTime = (iso?: string | null) => {
  if (!iso) return "-";

  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;

  return d.toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const initials = (name: string) =>
  name
    .split(" ")
    .map((word) => word[0])
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

type ToastState = {
  msg: string;
  type: "success" | "error" | "info";
} | null;

type StatusFilter = "aktif" | "pending" | "proses" | "selesai" | "dibatalkan" | "";

export default function AdminPengaduanPage() {
  const [data, setData] = useState<PengaduanItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submittingId, setSubmittingId] = useState<number | null>(null);

  const [toast, setToast] = useState<ToastState>(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("aktif");
  const [kategoriFilter, setKategoriFilter] = useState<KategoriAduan | "">("");
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");

  const [selected, setSelected] = useState<PengaduanItem | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [rejectNote, setRejectNote] = useState("");

  const showToast = useCallback(
    (msg: string, type: "success" | "error" | "info" = "success") => {
      setToast({ msg, type });
      window.setTimeout(() => setToast(null), 3500);
    },
    []
  );

  const fetchAll = useCallback(async () => {
    setLoading(true);

    try {
      const result =
        statusFilter === "selesai"
          ? await getAdminPengaduanSelesai({
              search,
              per_page: 100,
            })
          : await getAdminPengaduans({
              search,
              status: statusFilter || "aktif",
              kategori: kategoriFilter,
              per_page: 100,
            });

      setData(result.data ?? []);
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Gagal memuat pengaduan", "error");
    } finally {
      setLoading(false);
    }
  }, [kategoriFilter, search, showToast, statusFilter]);

  useEffect(() => {
    void fetchAll();
  }, [fetchAll]);

  const filteredData = useMemo(() => {
    return [...data].sort((a, b) => {
      const da = new Date(a.created_at).getTime();
      const db = new Date(b.created_at).getTime();

      return sortOrder === "desc" ? db - da : da - db;
    });
  }, [data, sortOrder]);

  const stats = useMemo(() => {
    return {
      total: data.length,
      pending: data.filter((item) => item.status_pengaduan === "pending").length,
      proses: data.filter((item) => item.status_pengaduan === "proses").length,
      selesai: data.filter((item) => item.status_pengaduan === "selesai").length,
      dibatalkan: data.filter((item) => item.status_pengaduan === "dibatalkan").length,
    };
  }, [data]);

  const shouldRemoveFromCurrentView = (updated: PengaduanItem) => {
    if (statusFilter === "aktif") {
      return updated.status_pengaduan === "selesai";
    }

    if (statusFilter === "selesai") {
      return updated.status_pengaduan !== "selesai";
    }

    if (statusFilter === "pending") {
      return updated.status_pengaduan !== "pending";
    }

    if (statusFilter === "proses") {
      return updated.status_pengaduan !== "proses";
    }

    if (statusFilter === "dibatalkan") {
      return updated.status_pengaduan !== "dibatalkan";
    }

    return false;
  };

  const updateLocalData = (updated: PengaduanItem) => {
    setData((prev) => {
      if (shouldRemoveFromCurrentView(updated)) {
        return prev.filter((item) => item.id !== updated.id);
      }

      return prev.map((item) => (item.id === updated.id ? updated : item));
    });

    setSelected((prev) => (prev?.id === updated.id ? updated : prev));
  };

  const handleQuickStatus = async (
    item: PengaduanItem,
    status: StatusPengaduan,
    catatanAdmin?: string | null
  ) => {
    setSubmittingId(item.id);

    try {
      const updated = await updateStatusPengaduan(item.id, {
        status_pengaduan: status,
        catatan_admin: catatanAdmin ?? item.catatan_admin ?? null,
      });

      updateLocalData(updated);

      const message =
        status === "proses"
          ? "Pengaduan berhasil diubah ke proses"
          : status === "selesai"
          ? "Pengaduan berhasil diselesaikan"
          : status === "dibatalkan"
          ? "Pengaduan berhasil ditolak / dibatalkan"
          : "Status pengaduan berhasil diperbarui";

      showToast(message, "success");

      if (status === "selesai" || status === "dibatalkan") {
        setShowDetailModal(false);
      }
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Gagal update status", "error");
    } finally {
      setSubmittingId(null);
    }
  };

  const openDetail = (item: PengaduanItem) => {
    setSelected(item);
    setShowDetailModal(true);
  };

  const openReject = (item: PengaduanItem) => {
    setSelected(item);
    setRejectNote(item.catatan_admin ?? "");
    setShowRejectModal(true);
  };

  const openDelete = (item: PengaduanItem) => {
    setSelected(item);
    setShowDeleteModal(true);
  };

  const handleReject = async () => {
    if (!selected) return;

    await handleQuickStatus(
      selected,
      "dibatalkan",
      rejectNote.trim() || "Pengaduan ditolak / dibatalkan oleh admin."
    );

    setShowRejectModal(false);
    setRejectNote("");
  };

  const handleDelete = async () => {
    if (!selected) return;

    setSubmittingId(selected.id);

    try {
      await deletePengaduan(selected.id);

      setData((prev) => prev.filter((item) => item.id !== selected.id));
      showToast("Pengaduan berhasil dihapus", "success");

      setShowDeleteModal(false);
      setShowDetailModal(false);
      setSelected(null);
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Gagal menghapus pengaduan", "error");
    } finally {
      setSubmittingId(null);
    }
  };

  return (
    <div style={{ padding: "32px 20px", minHeight: "100vh" }}>
      {toast && (
        <div style={toastStyle(toast.type)}>
          {toast.type === "success" ? "✓" : toast.type === "error" ? "✕" : "🔔"}{" "}
          {toast.msg}
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
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: "#f0eaff" }}>
            Kelola Pengaduan
          </h1>
          <p style={{ margin: "4px 0 0", fontSize: 13, color: "#9b8ec4" }}>
            Lihat detail aduan, proses, selesaikan, atau tolak aduan pelanggan.
          </p>
        </div>

        <button onClick={() => void fetchAll()} style={primaryBtn}>
          Refresh Data
        </button>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
          gap: 14,
          marginBottom: 24,
        }}
      >
        <StatCard label="Data Tampil" value={stats.total} color="#9f6ef5" />
        <StatCard label="Pending" value={stats.pending} color="#fbbf24" />
        <StatCard label="Proses" value={stats.proses} color="#60a5fa" />
        <StatCard label="Selesai" value={stats.selesai} color="#4ade80" />
        <StatCard label="Dibatalkan" value={stats.dibatalkan} color="#f87171" />
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
        <div style={{ position: "relative", flex: "1 1 260px", minWidth: 220 }}>
          <input
            type="text"
            placeholder="Cari nama, username, email, judul, isi pengaduan..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={inputStyle}
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
          style={selectStyle}
        >
          <option value="aktif" style={optionStyle}>
            Aduan Aktif
          </option>
          <option value="pending" style={optionStyle}>
            Pending
          </option>
          <option value="proses" style={optionStyle}>
            Proses
          </option>
          <option value="selesai" style={optionStyle}>
            Selesai
          </option>
          <option value="dibatalkan" style={optionStyle}>
            Dibatalkan
          </option>
        </select>

        <select
          value={kategoriFilter}
          onChange={(e) => setKategoriFilter(e.target.value as KategoriAduan | "")}
          style={selectStyle}
          disabled={statusFilter === "selesai"}
        >
          <option value="" style={optionStyle}>
            Semua Kategori
          </option>
          <option value="ps_rusak" style={optionStyle}>
            PS Rusak
          </option>
          <option value="pelayanan" style={optionStyle}>
            Pelayanan
          </option>
          <option value="kebersihan" style={optionStyle}>
            Kebersihan
          </option>
          <option value="pembayaran" style={optionStyle}>
            Pembayaran
          </option>
          <option value="fasilitas" style={optionStyle}>
            Fasilitas
          </option>
          <option value="lainnya" style={optionStyle}>
            Lainnya
          </option>
        </select>

        <select
          value={sortOrder}
          onChange={(e) => setSortOrder(e.target.value as "desc" | "asc")}
          style={selectStyle}
        >
          <option value="desc" style={optionStyle}>
            Terbaru
          </option>
          <option value="asc" style={optionStyle}>
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
          <div style={emptyState}>Memuat data pengaduan...</div>
        ) : filteredData.length === 0 ? (
          <div style={emptyState}>
            Tidak ada pengaduan untuk filter ini.
            {statusFilter !== "selesai" ? " Pilih filter Selesai untuk melihat aduan selesai." : ""}
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 1080 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(159,110,245,0.15)" }}>
                {["No", "Pengadu", "Aduan", "Kategori", "Status", "Tanggal", "Aksi"].map(
                  (head) => (
                    <th key={head} style={thStyle}>
                      {head}
                    </th>
                  )
                )}
              </tr>
            </thead>

            <tbody>
              {filteredData.map((item, index) => {
                const badge = statusColor(item.status_pengaduan);
                const isSubmitting = submittingId === item.id;

                const canProcess = item.status_pengaduan === "pending";
                const canFinish =
                  item.status_pengaduan === "pending" || item.status_pengaduan === "proses";
                const canReject =
                  item.status_pengaduan !== "selesai" &&
                  item.status_pengaduan !== "dibatalkan";

                return (
                  <tr
                    key={item.id}
                    style={{
                      borderBottom:
                        index < filteredData.length - 1
                          ? "1px solid rgba(159,110,245,0.08)"
                          : "none",
                    }}
                  >
                    <td style={tdMuted}>{index + 1}</td>

                    <td style={{ padding: "16px 20px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div
                          style={{
                            width: 36,
                            height: 36,
                            borderRadius: 10,
                            background: avatarColor(item.pengadu?.id_user ?? index),
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 12,
                            fontWeight: 700,
                            color: "white",
                            flexShrink: 0,
                          }}
                        >
                          {initials(item.pengadu?.name ?? "U")}
                        </div>

                        <div>
                          <div style={{ fontSize: 13.5, fontWeight: 600, color: "#f0eaff" }}>
                            {item.pengadu?.name ?? "-"}
                          </div>
                          <div style={{ fontSize: 11.5, color: "#9b8ec4" }}>
                            @{item.pengadu?.username ?? "-"}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td style={{ padding: "16px 20px" }}>
                      <div style={{ fontSize: 13.5, fontWeight: 600, color: "#f0eaff" }}>
                        {item.judul_pengaduan}
                      </div>
                      <div
                        style={{
                          marginTop: 4,
                          maxWidth: 320,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          fontSize: 12,
                          color: "#9b8ec4",
                        }}
                      >
                        {item.isi_pengaduan}
                      </div>
                    </td>

                    <td style={{ padding: "16px 20px", color: "#c4b5fd", fontSize: 13 }}>
                      {kategoriLabel(item.kategori_aduan)}
                    </td>

                    <td style={{ padding: "16px 20px" }}>
                      <span
                        style={{
                          display: "inline-flex",
                          padding: "4px 12px",
                          borderRadius: 8,
                          background: badge.bg,
                          border: `1px solid ${badge.border}`,
                          color: badge.color,
                          fontSize: 12,
                          fontWeight: 600,
                          whiteSpace: "nowrap",
                        }}
                      >
                        {statusLabel(item.status_pengaduan)}
                      </span>
                    </td>

                    <td style={tdMuted}>{formatDateTime(item.created_at)}</td>

                    <td style={{ padding: "16px 20px" }}>
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        <button
                          onClick={() => openDetail(item)}
                          disabled={isSubmitting}
                          style={actionBtn(
                            "#a47de8",
                            "rgba(159,110,245,0.1)",
                            "rgba(159,110,245,0.25)"
                          )}
                        >
                          Detail
                        </button>

                        {canProcess && (
                          <button
                            onClick={() => handleQuickStatus(item, "proses")}
                            disabled={isSubmitting}
                            style={actionBtn(
                              "#60a5fa",
                              "rgba(96,165,250,0.08)",
                              "rgba(96,165,250,0.2)"
                            )}
                          >
                            {isSubmitting ? "..." : "Proses"}
                          </button>
                        )}

                        {canFinish && (
                          <button
                            onClick={() => handleQuickStatus(item, "selesai")}
                            disabled={isSubmitting}
                            style={actionBtn(
                              "#4ade80",
                              "rgba(74,222,128,0.08)",
                              "rgba(74,222,128,0.2)"
                            )}
                          >
                            {isSubmitting ? "..." : "Selesai"}
                          </button>
                        )}

                        {canReject && (
                          <button
                            onClick={() => openReject(item)}
                            disabled={isSubmitting}
                            style={actionBtn(
                              "#f87171",
                              "rgba(248,113,113,0.08)",
                              "rgba(248,113,113,0.2)"
                            )}
                          >
                            Tolak
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {showDetailModal && selected && (
        <ResponsiveModalShell
          title={`Detail Pengaduan #${selected.id}`}
          onClose={() => setShowDetailModal(false)}
          width={900}
        >
          <DetailContent item={selected} />

          <div style={modalFooterStyle}>
            {selected.status_pengaduan === "pending" && (
              <button
                onClick={() => handleQuickStatus(selected, "proses")}
                disabled={submittingId === selected.id}
                style={blueModalBtn}
              >
                {submittingId === selected.id ? "Memproses..." : "Proses"}
              </button>
            )}

            {(selected.status_pengaduan === "pending" ||
              selected.status_pengaduan === "proses") && (
              <button
                onClick={() => handleQuickStatus(selected, "selesai")}
                disabled={submittingId === selected.id}
                style={successModalBtn}
              >
                {submittingId === selected.id ? "Menyimpan..." : "Selesai"}
              </button>
            )}

            {selected.status_pengaduan !== "selesai" &&
              selected.status_pengaduan !== "dibatalkan" && (
                <button
                  onClick={() => openReject(selected)}
                  disabled={submittingId === selected.id}
                  style={dangerModalBtn}
                >
                  Tolak / Batalkan
                </button>
              )}

            <button onClick={() => openDelete(selected)} style={secondaryModalBtn}>
              Hapus
            </button>
          </div>
        </ResponsiveModalShell>
      )}

      {showRejectModal && selected && (
        <ResponsiveModalShell
          title="Tolak / Batalkan Pengaduan"
          onClose={() => setShowRejectModal(false)}
          width={520}
        >
          <p style={{ margin: 0, fontSize: 13.5, color: "#9b8ec4", lineHeight: 1.7 }}>
            Pengaduan{" "}
            <strong style={{ color: "#f0eaff" }}>{selected.judul_pengaduan}</strong>{" "}
            akan diubah menjadi dibatalkan.
          </p>

          <div style={{ marginTop: 16 }}>
            <label style={labelStyle}>Catatan Admin</label>
            <textarea
              value={rejectNote}
              onChange={(e) => setRejectNote(e.target.value)}
              rows={5}
              placeholder="Contoh: Aduan ditolak karena data kurang jelas."
              style={{
                ...plainInputStyle,
                resize: "vertical",
                lineHeight: 1.6,
              }}
            />
          </div>

          <div style={modalFooterStyle}>
            <button onClick={() => setShowRejectModal(false)} style={secondaryModalBtn}>
              Batal
            </button>

            <button
              onClick={handleReject}
              disabled={submittingId === selected.id}
              style={{
                ...dangerModalBtn,
                opacity: submittingId === selected.id ? 0.6 : 1,
                cursor: submittingId === selected.id ? "not-allowed" : "pointer",
              }}
            >
              {submittingId === selected.id ? "Menyimpan..." : "Ya, Tolak"}
            </button>
          </div>
        </ResponsiveModalShell>
      )}

      {showDeleteModal && selected && (
        <ResponsiveModalShell
          title="Hapus Pengaduan"
          onClose={() => setShowDeleteModal(false)}
          width={480}
        >
          <p style={{ margin: 0, fontSize: 13.5, color: "#9b8ec4", lineHeight: 1.7 }}>
            Pengaduan{" "}
            <strong style={{ color: "#f0eaff" }}>{selected.judul_pengaduan}</strong>{" "}
            akan dihapus permanen.
          </p>

          <div style={modalFooterStyle}>
            <button onClick={() => setShowDeleteModal(false)} style={secondaryModalBtn}>
              Batal
            </button>

            <button
              onClick={handleDelete}
              disabled={submittingId === selected.id}
              style={{
                ...dangerModalBtn,
                opacity: submittingId === selected.id ? 0.6 : 1,
                cursor: submittingId === selected.id ? "not-allowed" : "pointer",
              }}
            >
              {submittingId === selected.id ? "Menghapus..." : "Ya, Hapus"}
            </button>
          </div>
        </ResponsiveModalShell>
      )}
    </div>
  );
}

function DetailContent({ item }: { item: PengaduanItem }) {
  const imageUrl = item.foto_bukti
    ? `http://192.168.40.147:8000/storage/${item.foto_bukti}`
    : null;

  return (
    <div style={{ display: "grid", gap: 18 }}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 14,
        }}
      >
        <InfoRow label="Pengadu" value={`${item.pengadu?.name ?? "-"} (@${item.pengadu?.username ?? "-"})`} />
        <InfoRow label="Email" value={item.pengadu?.email ?? "-"} />
        <InfoRow label="Kategori" value={kategoriLabel(item.kategori_aduan)} />
        <InfoRow label="Status" value={statusLabel(item.status_pengaduan)} />
        <InfoRow label="Admin Penangan" value={item.admin?.name ?? "Belum ditangani"} />
        <InfoRow label="Dibuat" value={formatDateTime(item.created_at)} />
        <InfoRow label="Ditangani Pada" value={formatDateTime(item.ditangani_pada)} />
        <InfoRow label="Selesai Pada" value={formatDateTime(item.diselesaikan_pada)} />
      </div>

      <InfoBox title="Judul Pengaduan" value={item.judul_pengaduan} />
      <InfoBox title="Isi Pengaduan" value={item.isi_pengaduan} />
      <InfoBox title="Catatan Admin" value={item.catatan_admin || "Belum ada catatan admin."} />

      {imageUrl && (
        <div>
          <div style={sectionTitle}>Foto Bukti</div>
          <img
            src={imageUrl}
            alt="Foto bukti pengaduan"
            style={{
              width: "100%",
              maxHeight: 420,
              objectFit: "cover",
              borderRadius: 14,
              border: "1px solid rgba(159,110,245,0.18)",
            }}
          />
        </div>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div
      style={{
        padding: "16px 20px",
        borderRadius: 14,
        background: "rgba(159,110,245,0.08)",
        border: "1px solid rgba(159,110,245,0.2)",
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
        {label}
      </p>
      <p
        style={{
          margin: "6px 0 0",
          fontSize: 28,
          fontWeight: 700,
          color,
        }}
      >
        {value}
      </p>
    </div>
  );
}

function InfoBox({ title, value }: { title: string; value: string }) {
  return (
    <div>
      <div style={sectionTitle}>{title}</div>
      <div
        style={{
          padding: "12px 14px",
          borderRadius: 12,
          border: "1px solid rgba(159,110,245,0.15)",
          background: "rgba(255,255,255,0.03)",
          fontSize: 13.5,
          color: "#c9aff5",
          lineHeight: 1.7,
        }}
      >
        {value}
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
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
      <div style={{ fontSize: 13.5, color: "#f0eaff", fontWeight: 600, lineHeight: 1.6 }}>
        {value}
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
        zIndex: 200,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(0,0,0,0.65)",
        backdropFilter: "blur(6px)",
        padding: 16,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#1e1040",
          border: "1px solid rgba(159,110,245,0.25)",
          borderRadius: 20,
          width: `min(${width}px, 96vw)`,
          maxHeight: "88vh",
          overflow: "hidden",
          boxShadow: "0 24px 60px rgba(0,0,0,0.5)",
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
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#f0eaff" }}>
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

        <div style={{ padding: 20, overflowY: "auto" }}>{children}</div>
      </div>
    </div>
  );
}

const emptyState: React.CSSProperties = {
  padding: "56px 20px",
  textAlign: "center",
  color: "#9b8ec4",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: 10,
  fontSize: 13,
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(159,110,245,0.2)",
  color: "#f0eaff",
  outline: "none",
  boxSizing: "border-box",
};

const plainInputStyle: React.CSSProperties = {
  width: "100%",
  padding: "11px 12px",
  borderRadius: 10,
  fontSize: 13,
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(159,110,245,0.2)",
  color: "#f0eaff",
  outline: "none",
  boxSizing: "border-box",
};

const selectStyle: React.CSSProperties = {
  padding: "9px 12px",
  borderRadius: 10,
  fontSize: 13,
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(159,110,245,0.2)",
  color: "#f0eaff",
  outline: "none",
  cursor: "pointer",
};

const optionStyle: React.CSSProperties = {
  background: "#1e1040",
};

const thStyle: React.CSSProperties = {
  padding: "14px 20px",
  textAlign: "left",
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: "0.06em",
  textTransform: "uppercase",
  color: "#9b8ec4",
  whiteSpace: "nowrap",
};

const tdMuted: React.CSSProperties = {
  padding: "16px 20px",
  fontSize: 13,
  color: "#9b8ec4",
  whiteSpace: "nowrap",
};

const primaryBtn: React.CSSProperties = {
  padding: "10px 14px",
  borderRadius: 10,
  border: "none",
  background: "linear-gradient(135deg, #5b2faa, #9f6ef5)",
  color: "white",
  fontSize: 12.5,
  fontWeight: 600,
  cursor: "pointer",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  marginBottom: 8,
  fontSize: 12.5,
  color: "#c4b5fd",
  fontWeight: 600,
};

const sectionTitle: React.CSSProperties = {
  marginBottom: 10,
  fontSize: 13,
  fontWeight: 700,
  color: "#c4b5fd",
};

const modalFooterStyle: React.CSSProperties = {
  display: "flex",
  gap: 10,
  marginTop: 20,
  flexWrap: "wrap",
  justifyContent: "flex-end",
};

const secondaryModalBtn: React.CSSProperties = {
  minWidth: 120,
  padding: "11px 16px",
  borderRadius: 10,
  border: "1px solid rgba(159,110,245,0.25)",
  background: "transparent",
  color: "#c9aff5",
  fontSize: 13.5,
  fontWeight: 600,
  cursor: "pointer",
};

const blueModalBtn: React.CSSProperties = {
  minWidth: 120,
  padding: "11px 16px",
  borderRadius: 10,
  border: "1px solid rgba(96,165,250,0.3)",
  background: "rgba(96,165,250,0.15)",
  color: "#60a5fa",
  fontSize: 13.5,
  fontWeight: 600,
  cursor: "pointer",
};

const successModalBtn: React.CSSProperties = {
  minWidth: 120,
  padding: "11px 16px",
  borderRadius: 10,
  border: "1px solid rgba(74,222,128,0.3)",
  background: "rgba(74,222,128,0.15)",
  color: "#4ade80",
  fontSize: 13.5,
  fontWeight: 600,
  cursor: "pointer",
};

const dangerModalBtn: React.CSSProperties = {
  minWidth: 120,
  padding: "11px 16px",
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
    whiteSpace: "nowrap",
  };
}

function toastStyle(type: "success" | "error" | "info"): React.CSSProperties {
  return {
    position: "fixed",
    top: 20,
    right: 20,
    zIndex: 300,
    maxWidth: "min(92vw, 420px)",
    padding: "12px 16px",
    borderRadius: 12,
    background:
      type === "success"
        ? "rgba(74,222,128,0.12)"
        : type === "error"
        ? "rgba(248,113,113,0.12)"
        : "rgba(96,165,250,0.12)",
    border: `1px solid ${
      type === "success"
        ? "rgba(74,222,128,0.3)"
        : type === "error"
        ? "rgba(248,113,113,0.3)"
        : "rgba(96,165,250,0.3)"
    }`,
    color: type === "success" ? "#4ade80" : type === "error" ? "#f87171" : "#60a5fa",
    fontSize: 13.5,
    fontWeight: 500,
    boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
  };
}