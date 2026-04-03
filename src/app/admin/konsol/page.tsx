"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  type TipePs,
  type Playstation,
  getTipePs,
  getPlaystation,
  createPlaystation,
  updatePlaystation,
  deletePlaystation,
} from "@/lib/api";



type FormState = {
  id_tipe: string;
  nomor_ps: string;
  status_ps: Playstation["status_ps"];
};


const formatRupiah = (n: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);

const STATUS_CONFIG = {
  tersedia: { label: "Tersedia", color: "#4ade80", bg: "rgba(74,222,128,0.08)", border: "rgba(74,222,128,0.2)", dot: "#4ade80" },
  digunakan: { label: "Digunakan", color: "#fb923c", bg: "rgba(251,146,60,0.08)", border: "rgba(251,146,60,0.2)", dot: "#fb923c" },
  maintenance: { label: "Maintenance", color: "#facc15", bg: "rgba(250,204,21,0.08)", border: "rgba(250,204,21,0.2)", dot: "#facc15" },
};

type ModalMode = "tambah" | "edit" | null;
const emptyForm: FormState = {
  id_tipe: "",
  nomor_ps: "",
  status_ps: "tersedia", // ✅ HARUS literal, bukan string bebas
};

export default function PlaystationPage() {
  const router = useRouter();
  const [data, setData] = useState<Playstation[]>([]);
  const [tipeList, setTipeList] = useState<TipePs[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>("semua");
  const [filterTipe, setFilterTipe] = useState<string>("semua");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Playstation | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { router.push("/login"); return; }
    fetchAll();
  }, []);

  useEffect(() => {
  setCurrentPage(1);
}, [filterStatus, filterTipe, sortOrder, itemsPerPage]);



  const fetchAll = async () => {
    setLoading(true);
    try {
      const [psData, tipeData] = await Promise.all([getPlaystation(), getTipePs()]);
      setData(psData);
      setTipeList(tipeData);
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : "Gagal memuat data.", "error");
    } finally {
      setLoading(false);
    }
  };

  const showToast = (msg: string, type: "success" | "error") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const openTambah = () => {
    setForm({ ...emptyForm, id_tipe: tipeList[0] ? String(tipeList[0].id_tipe) : "" });
    setFormError(null);
    setEditId(null);
    setModalMode("tambah");
  };

  const openEdit = (item: Playstation) => {
    setForm({ id_tipe: String(item.id_tipe), nomor_ps: item.nomor_ps, status_ps: item.status_ps });
    setFormError(null);
    setEditId(item.id_ps);
    setModalMode("edit");
  };

  const closeModal = () => { setModalMode(null); setFormError(null); };

  const handleSubmit = async () => {
    setFormError(null);
    if (!form.id_tipe) { setFormError("Tipe PS wajib dipilih."); return; }
    if (!form.nomor_ps.trim()) { setFormError("Nomor PS wajib diisi."); return; }

    setSubmitting(true);
    try {
      const payload = { id_tipe: Number(form.id_tipe), nomor_ps: form.nomor_ps.trim(), status_ps: form.status_ps };
      if (modalMode === "tambah") {
        const created = await createPlaystation(payload);
        // Ambil tipe dari list lokal supaya bisa langsung tampil tanpa refetch
        created.tipe = tipeList.find(t => t.id_tipe === created.id_tipe);
        setData(prev => [...prev, created]);
        showToast("Unit PS berhasil ditambahkan.", "success");
      } else if (modalMode === "edit" && editId !== null) {
        const updated = await updatePlaystation(editId, payload);
        updated.tipe = tipeList.find(t => t.id_tipe === updated.id_tipe);
        setData(prev => prev.map(d => d.id_ps === editId ? updated : d));
        showToast("Unit PS berhasil diupdate.", "success");
      }
      closeModal();
    } catch (e: unknown) {
      setFormError(e instanceof Error ? e.message : "Terjadi kesalahan.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deletePlaystation(deleteTarget.id_ps);
      setData(prev => prev.filter(d => d.id_ps !== deleteTarget.id_ps));
      showToast("Unit PS berhasil dihapus.", "success");
      setDeleteTarget(null);
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : "Gagal menghapus.", "error");
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  };

  // Filter data berdasarkan status
    const filteredData = [...data]
  .filter((d) => filterStatus === "semua" || d.status_ps === filterStatus)
  .filter((d) => filterTipe === "semua" || String(d.id_tipe) === filterTipe)
  .sort((a, b) => {
    const compare = a.nomor_ps.localeCompare(b.nomor_ps, "id", {
      numeric: true,
      sensitivity: "base",
    });

    return sortOrder === "asc" ? compare : -compare;
  });

const totalPages = Math.max(1, Math.ceil(filteredData.length / itemsPerPage));
const startIndex = (currentPage - 1) * itemsPerPage;
const endIndex = startIndex + itemsPerPage;
const paginatedData = filteredData.slice(startIndex, endIndex);
  // Statistik ringkasan
  const stats = {
    total: data.length,
    tersedia: data.filter(d => d.status_ps === "tersedia").length,
    digunakan: data.filter(d => d.status_ps === "digunakan").length,
    maintenance: data.filter(d => d.status_ps === "maintenance").length,
  };
    useEffect(() => {
    if (currentPage > totalPages) {
        setCurrentPage(totalPages);
    }
    }, [currentPage, totalPages]);
  return (
    <div style={{ padding: "32px 40px", minHeight: "100vh" }}>

      {/* ===== TOAST ===== */}
      {toast && (
        <div style={{
          position: "fixed", top: 20, right: 24, zIndex: 200,
          padding: "12px 20px", borderRadius: 12,
          background: toast.type === "success" ? "rgba(74,222,128,0.12)" : "rgba(248,113,113,0.12)",
          border: `1px solid ${toast.type === "success" ? "rgba(74,222,128,0.3)" : "rgba(248,113,113,0.3)"}`,
          color: toast.type === "success" ? "#4ade80" : "#f87171",
          fontSize: 13.5, fontWeight: 500,
          boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
          display: "flex", alignItems: "center", gap: 8,
        }}>
          {toast.type === "success" ? "✓" : "✕"} {toast.msg}
        </div>
      )}

      {/* ===== HEADER ===== */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: "#f0eaff" }}>Unit PlayStation</h1>
          <p style={{ margin: "4px 0 0", fontSize: 13, color: "#9b8ec4" }}>
            Kelola semua unit PS dan status ketersediaannya
          </p>
        </div>
        <button
          onClick={openTambah}
          style={{
            display: "flex", alignItems: "center", gap: 8,
            padding: "10px 18px", borderRadius: 12,
            background: "linear-gradient(135deg, #5b2faa, #9f6ef5)",
            border: "none", color: "white",
            fontSize: 13.5, fontWeight: 600, cursor: "pointer",
            boxShadow: "0 4px 16px rgba(159,110,245,0.3)",
            transition: "opacity 0.15s",
          }}
          onMouseEnter={e => (e.currentTarget.style.opacity = "0.85")}
          onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
        >
          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path d="M12 5v14M5 12h14" strokeLinecap="round" />
          </svg>
          Tambah Unit PS
        </button>
      </div>

      {/* ===== STAT CARDS ===== */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 24 }}>
        {[
          { label: "Total Unit", value: stats.total, color: "#9f6ef5", bg: "rgba(159,110,245,0.08)", border: "rgba(159,110,245,0.2)" },
          { label: "Tersedia", value: stats.tersedia, color: "#4ade80", bg: "rgba(74,222,128,0.08)", border: "rgba(74,222,128,0.2)" },
          { label: "Digunakan", value: stats.digunakan, color: "#fb923c", bg: "rgba(251,146,60,0.08)", border: "rgba(251,146,60,0.2)" },
          { label: "Maintenance", value: stats.maintenance, color: "#facc15", bg: "rgba(250,204,21,0.08)", border: "rgba(250,204,21,0.2)" },
        ].map(s => (
          <div key={s.label} style={{
            padding: "16px 20px", borderRadius: 14,
            background: s.bg, border: `1px solid ${s.border}`,
          }}>
            <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: "#9b8ec4", letterSpacing: "0.05em", textTransform: "uppercase" }}>{s.label}</p>
            <p style={{ margin: "6px 0 0", fontSize: 28, fontWeight: 700, color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* ===== FILTER STATUS ===== */}
     <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 20, alignItems: "center" }}>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {["semua", "tersedia", "digunakan", "maintenance"].map((s) => (
            <button
                key={s}
                onClick={() => setFilterStatus(s)}
                style={{
                padding: "7px 16px",
                borderRadius: 10,
                fontSize: 13,
                fontWeight: 500,
                cursor: "pointer",
                transition: "all 0.15s",
                border: "1px solid",
                background: filterStatus === s ? "rgba(159,110,245,0.2)" : "transparent",
                borderColor: filterStatus === s ? "rgba(159,110,245,0.5)" : "rgba(159,110,245,0.15)",
                color: filterStatus === s ? "#c9aff5" : "#9b8ec4",
                textTransform: "capitalize",
                }}
            >
                {s === "semua"
                ? `Semua (${stats.total})`
                : s === "tersedia"
                ? `Tersedia (${stats.tersedia})`
                : s === "digunakan"
                ? `Digunakan (${stats.digunakan})`
                : `Maintenance (${stats.maintenance})`}
            </button>
            ))}
        </div>

        <select
            value={filterTipe}
            onChange={(e) => setFilterTipe(e.target.value)}
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
            <option value="semua" style={{ background: "#1e1040" }}>
            Semua Tipe PS
            </option>
            {tipeList.map((t) => (
            <option key={t.id_tipe} value={String(t.id_tipe)} style={{ background: "#1e1040" }}>
                {t.nama_tipe}
            </option>
            ))}
        </select>

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
            <option value="asc" style={{ background: "#1e1040" }}>
            Nomor PS ASC
            </option>
            <option value="desc" style={{ background: "#1e1040" }}>
            Nomor PS DESC
            </option>
        </select>
        </div>

      {/* ===== TABEL ===== */}
      <div style={{
        borderRadius: 16,
        border: "1px solid rgba(159,110,245,0.15)",
        background: "#160d2e",
        overflow: "hidden",
      }}>
        {loading ? (
          <div style={{ padding: "48px 0", textAlign: "center", color: "#9b8ec4" }}>
            <div style={{
              width: 32, height: 32,
              border: "2px solid rgba(159,110,245,0.2)",
              borderTop: "2px solid #9f6ef5",
              borderRadius: "50%",
              animation: "spin 0.8s linear infinite",
              margin: "0 auto 12px",
            }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            Memuat data...
          </div>
        ) : filteredData.length === 0 ? (
          <div style={{ padding: "56px 0", textAlign: "center" }}>
            <div style={{
              width: 56, height: 56, borderRadius: 16,
              background: "rgba(159,110,245,0.1)",
              border: "1px solid rgba(159,110,245,0.2)",
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 14px",
            }}>
              {/* PS controller icon */}
              <svg width="26" height="26" fill="none" stroke="#9f6ef5" strokeWidth="1.6" viewBox="0 0 24 24">
                <path d="M6 12h4M8 10v4" strokeLinecap="round"/>
                <circle cx="16" cy="11" r="0.8" fill="#9f6ef5"/>
                <circle cx="18" cy="13" r="0.8" fill="#9f6ef5"/>
                <path d="M5 7.5C3.5 8 2 9.5 2 12s1 5 3 6l1.5-3M19 7.5c1.5.5 3 2 3 4.5s-1 5-3 6l-1.5-3" strokeLinecap="round"/>
                <path d="M5 7.5h14" strokeLinecap="round"/>
              </svg>
            </div>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "#f0eaff" }}>
              {filterStatus === "semua" ? "Belum ada unit PS" : `Tidak ada unit PS dengan status "${filterStatus}"`}
            </p>
            <p style={{ margin: "4px 0 0", fontSize: 13, color: "#9b8ec4" }}>
              {filterStatus === "semua" ? 'Klik "Tambah Unit PS" untuk mulai menambahkan.' : "Coba pilih filter lain."}
            </p>
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(159,110,245,0.15)" }}>
                {["No", "Nomor PS", "Tipe", "Harga / Jam", "Status", "Aksi"].map(h => (
                  <th key={h} style={{
                    padding: "14px 20px", textAlign: "left",
                    fontSize: 11, fontWeight: 600, letterSpacing: "0.06em",
                    textTransform: "uppercase", color: "#9b8ec4",
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginatedData.map((item, i) => {
                const statusCfg = STATUS_CONFIG[item.status_ps];
                const isDipakai = item.status_ps === "digunakan";
                return (
                  <tr
                    key={item.id_ps}
                    style={{
                      borderBottom: i < paginatedData.length - 1 ? "1px solid rgba(159,110,245,0.08)" : "none",
                      transition: "background 0.15s",
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = "rgba(159,110,245,0.05)")}
                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                  >
                    {/* No */}
                    <td style={{ padding: "16px 20px", fontSize: 13, color: "#9b8ec4" }}>
                    {startIndex + i + 1}
                    </td>

                    {/* Nomor PS */}
                    <td style={{ padding: "16px 20px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{
                          width: 34, height: 34, borderRadius: 10,
                          background: "rgba(159,110,245,0.12)",
                          border: "1px solid rgba(159,110,245,0.2)",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          flexShrink: 0,
                        }}>
                          <svg width="15" height="15" fill="none" stroke="#9f6ef5" strokeWidth="1.8" viewBox="0 0 24 24">
                            <path d="M6 12h4M8 10v4" strokeLinecap="round"/>
                            <circle cx="16" cy="11" r="1" fill="#9f6ef5"/>
                            <circle cx="18" cy="13" r="1" fill="#9f6ef5"/>
                          </svg>
                        </div>
                        <span style={{ fontSize: 14, fontWeight: 600, color: "#f0eaff" }}>{item.nomor_ps}</span>
                      </div>
                    </td>

                    {/* Tipe */}
                    <td style={{ padding: "16px 20px" }}>
                      <span style={{
                        display: "inline-block",
                        padding: "4px 12px", borderRadius: 8,
                        background: "rgba(159,110,245,0.08)",
                        border: "1px solid rgba(159,110,245,0.2)",
                        fontSize: 13, color: "#a47de8",
                      }}>
                        {item.tipe?.nama_tipe ?? "-"}
                      </span>
                    </td>

                    {/* Harga */}
                    <td style={{ padding: "16px 20px" }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: "#c9aff5" }}>
                        {item.tipe ? formatRupiah(item.tipe.harga_sewa) : "-"}
                      </span>
                    </td>

                    {/* Status */}
                    <td style={{ padding: "16px 20px" }}>
                      <span style={{
                        display: "inline-flex", alignItems: "center", gap: 6,
                        padding: "5px 12px", borderRadius: 8,
                        background: statusCfg.bg,
                        border: `1px solid ${statusCfg.border}`,
                        fontSize: 12.5, fontWeight: 600, color: statusCfg.color,
                      }}>
                        <span style={{
                          width: 6, height: 6, borderRadius: "50%",
                          background: statusCfg.dot,
                          boxShadow: `0 0 6px ${statusCfg.dot}`,
                        }} />
                        {statusCfg.label}
                      </span>
                    </td>

                    {/* Aksi */}
                    <td style={{ padding: "16px 20px" }}>
                      <div style={{ display: "flex", gap: 8 }}>
                        {/* Edit */}
                        <button
                          onClick={() => openEdit(item)}
                          style={{
                            display: "flex", alignItems: "center", gap: 6,
                            padding: "7px 14px", borderRadius: 8,
                            background: "rgba(159,110,245,0.1)",
                            border: "1px solid rgba(159,110,245,0.25)",
                            color: "#a47de8", fontSize: 12.5, fontWeight: 500,
                            cursor: "pointer", transition: "all 0.15s",
                          }}
                          onMouseEnter={e => (e.currentTarget.style.background = "rgba(159,110,245,0.2)")}
                          onMouseLeave={e => (e.currentTarget.style.background = "rgba(159,110,245,0.1)")}
                        >
                          <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                          Edit
                        </button>

                        {/* Hapus - disabled jika sedang digunakan */}
                        <button
                          onClick={() => !isDipakai && setDeleteTarget(item)}
                          disabled={isDipakai}
                          title={isDipakai ? "Tidak bisa dihapus, unit sedang digunakan" : ""}
                          style={{
                            display: "flex", alignItems: "center", gap: 6,
                            padding: "7px 14px", borderRadius: 8,
                            background: isDipakai ? "rgba(255,255,255,0.03)" : "rgba(248,113,113,0.08)",
                            border: isDipakai ? "1px solid rgba(255,255,255,0.1)" : "1px solid rgba(248,113,113,0.2)",
                            color: isDipakai ? "#555" : "#f87171",
                            fontSize: 12.5, fontWeight: 500,
                            cursor: isDipakai ? "not-allowed" : "pointer",
                            transition: "all 0.15s",
                            opacity: isDipakai ? 0.5 : 1,
                          }}
                          onMouseEnter={e => { if (!isDipakai) e.currentTarget.style.background = "rgba(248,113,113,0.18)"; }}
                          onMouseLeave={e => { if (!isDipakai) e.currentTarget.style.background = "rgba(248,113,113,0.08)"; }}
                        >
                          <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                          Hapus
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
          <option key={n} value={n} style={{ background: "#1e1040" }}>
            {n}
          </option>
        ))}
      </select>
      <span style={{ fontSize: 13, color: "#9b8ec4" }}>data / halaman</span>
    </div>

    <div style={{ fontSize: 13, color: "#9b8ec4" }}>
      Menampilkan {filteredData.length === 0 ? 0 : startIndex + 1} -{" "}
      {Math.min(endIndex, filteredData.length)} dari {filteredData.length} data
    </div>

    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <button
        onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
        disabled={currentPage === 1}
        style={{
          padding: "8px 12px",
          borderRadius: 10,
          border: "1px solid rgba(159,110,245,0.25)",
          background: currentPage === 1 ? "rgba(255,255,255,0.03)" : "transparent",
          color: currentPage === 1 ? "#666" : "#c9aff5",
          cursor: currentPage === 1 ? "not-allowed" : "pointer",
        }}
      >
        Prev
      </button>

      <span style={{ fontSize: 13, color: "#f0eaff", minWidth: 90, textAlign: "center" }}>
        Halaman {currentPage} / {totalPages}
      </span>

      <button
        onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
        disabled={currentPage === totalPages}
        style={{
          padding: "8px 12px",
          borderRadius: 10,
          border: "1px solid rgba(159,110,245,0.25)",
          background: currentPage === totalPages ? "rgba(255,255,255,0.03)" : "transparent",
          color: currentPage === totalPages ? "#666" : "#c9aff5",
          cursor: currentPage === totalPages ? "not-allowed" : "pointer",
        }}
      >
        Next
      </button>
    </div>
  </div>
)}
      

      {/* ===== MODAL TAMBAH / EDIT ===== */}
      {modalMode && (
        <div
          onClick={closeModal}
          style={{
            position: "fixed", inset: 0, zIndex: 100,
            display: "flex", alignItems: "center", justifyContent: "center",
            background: "rgba(0,0,0,0.65)", backdropFilter: "blur(6px)",
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: "#1e1040",
              border: "1px solid rgba(159,110,245,0.25)",
              borderRadius: 20, padding: "28px",
              width: 420, boxShadow: "0 24px 60px rgba(0,0,0,0.5)",
            }}
          >
            <h2 style={{ margin: "0 0 20px", fontSize: 16, fontWeight: 700, color: "#f0eaff" }}>
              {modalMode === "tambah" ? "Tambah Unit PS" : "Edit Unit PS"}
            </h2>

            {formError && (
              <div style={{
                padding: "10px 14px", borderRadius: 10, marginBottom: 16,
                background: "rgba(248,113,113,0.1)",
                border: "1px solid rgba(248,113,113,0.25)",
                color: "#f87171", fontSize: 13,
              }}>
                {formError}
              </div>
            )}

            {/* Tipe PS */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#9b8ec4", marginBottom: 7, letterSpacing: "0.04em" }}>
                TIPE PS
              </label>
              <select
                value={form.id_tipe}
                onChange={e => setForm({ ...form, id_tipe: e.target.value })}
                style={{
                  width: "100%", padding: "10px 14px",
                  borderRadius: 10, fontSize: 14,
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(159,110,245,0.2)",
                  color: "#f0eaff", outline: "none",
                  boxSizing: "border-box",
                  cursor: "pointer",
                  appearance: "none",
                }}
                onFocus={e => (e.target.style.borderColor = "rgba(159,110,245,0.6)")}
                onBlur={e => (e.target.style.borderColor = "rgba(159,110,245,0.2)")}
              >
                <option value="" disabled style={{ background: "#1e1040" }}>Pilih tipe PS...</option>
                {tipeList.map(t => (
                  <option key={t.id_tipe} value={t.id_tipe} style={{ background: "#1e1040" }}>
                    {t.nama_tipe} — {formatRupiah(t.harga_sewa)}/jam
                  </option>
                ))}
              </select>
            </div>

            {/* Nomor PS */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#9b8ec4", marginBottom: 7, letterSpacing: "0.04em" }}>
                NOMOR / NAMA UNIT
              </label>
              <input
                type="text"
                placeholder="cth: PS-01, Unit A..."
                value={form.nomor_ps}
                onChange={e => setForm({ ...form, nomor_ps: e.target.value })}
                style={{
                  width: "100%", padding: "10px 14px",
                  borderRadius: 10, fontSize: 14,
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(159,110,245,0.2)",
                  color: "#f0eaff", outline: "none",
                  boxSizing: "border-box",
                  transition: "border-color 0.15s",
                }}
                onFocus={e => (e.target.style.borderColor = "rgba(159,110,245,0.6)")}
                onBlur={e => (e.target.style.borderColor = "rgba(159,110,245,0.2)")}
              />
            </div>

            {/* Status */}
            <div style={{ marginBottom: 24 }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#9b8ec4", marginBottom: 10, letterSpacing: "0.04em" }}>
                STATUS
              </label>
              <div style={{ display: "flex", gap: 8 }}>
                {(["tersedia", "digunakan", "maintenance"] as const).map(s => {
                  const cfg = STATUS_CONFIG[s];
                  const isSelected = form.status_ps === s;
                  return (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setForm({ ...form, status_ps: s })}
                      style={{
                        flex: 1, padding: "9px 0",
                        borderRadius: 10, fontSize: 12.5, fontWeight: 600,
                        cursor: "pointer", transition: "all 0.15s",
                        border: `1px solid ${isSelected ? cfg.border : "rgba(159,110,245,0.15)"}`,
                        background: isSelected ? cfg.bg : "transparent",
                        color: isSelected ? cfg.color : "#9b8ec4",
                      }}
                    >
                      {cfg.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={closeModal}
                style={{
                  flex: 1, padding: "11px 0", borderRadius: 10,
                  border: "1px solid rgba(159,110,245,0.25)",
                  background: "transparent", color: "#c9aff5",
                  fontSize: 13.5, fontWeight: 600, cursor: "pointer",
                }}
                onMouseEnter={e => (e.currentTarget.style.background = "rgba(159,110,245,0.1)")}
                onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
              >
                Batal
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                style={{
                  flex: 1, padding: "11px 0", borderRadius: 10,
                  background: "linear-gradient(135deg, #5b2faa, #9f6ef5)",
                  border: "none", color: "white",
                  fontSize: 13.5, fontWeight: 600,
                  cursor: submitting ? "not-allowed" : "pointer",
                  opacity: submitting ? 0.6 : 1,
                }}
              >
                {submitting ? "Menyimpan..." : modalMode === "tambah" ? "Tambahkan" : "Simpan"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== MODAL HAPUS ===== */}
      {deleteTarget && (
        <div
          onClick={() => !deleting && setDeleteTarget(null)}
          style={{
            position: "fixed", inset: 0, zIndex: 100,
            display: "flex", alignItems: "center", justifyContent: "center",
            background: "rgba(0,0,0,0.65)", backdropFilter: "blur(6px)",
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: "#1e1040",
              border: "1px solid rgba(159,110,245,0.25)",
              borderRadius: 20, padding: "28px",
              width: 340, boxShadow: "0 24px 60px rgba(0,0,0,0.5)",
            }}
          >
            <div style={{
              width: 48, height: 48, borderRadius: 14,
              background: "rgba(248,113,113,0.1)",
              border: "1px solid rgba(248,113,113,0.2)",
              display: "flex", alignItems: "center", justifyContent: "center",
              marginBottom: 16,
            }}>
              <svg width="22" height="22" fill="none" stroke="#f87171" strokeWidth="1.8" viewBox="0 0 24 24">
                <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h2 style={{ margin: "0 0 6px", fontSize: 16, fontWeight: 700, color: "#f0eaff" }}>Hapus Unit PS</h2>
            <p style={{ margin: "0 0 6px", fontSize: 13.5, color: "#9b8ec4", lineHeight: 1.6 }}>
              Yakin ingin menghapus unit{" "}
              <span style={{ color: "#f0eaff", fontWeight: 600 }}>"{deleteTarget.nomor_ps}"</span>?
            </p>
            <p style={{ margin: "0 0 24px", fontSize: 12.5, color: "#f87171" }}>
              Unit tidak bisa dihapus jika sedang dalam status "Digunakan".
            </p>
            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
                style={{
                  flex: 1, padding: "10px 0", borderRadius: 10,
                  border: "1px solid rgba(159,110,245,0.25)",
                  background: "transparent", color: "#c9aff5",
                  fontSize: 13.5, fontWeight: 600, cursor: "pointer",
                }}
                onMouseEnter={e => (e.currentTarget.style.background = "rgba(159,110,245,0.1)")}
                onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
              >
                Batal
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                style={{
                  flex: 1, padding: "10px 0", borderRadius: 10,
                  border: "1px solid rgba(248,113,113,0.3)",
                  background: "rgba(248,113,113,0.15)", color: "#f87171",
                  fontSize: 13.5, fontWeight: 600,
                  cursor: deleting ? "not-allowed" : "pointer",
                  opacity: deleting ? 0.6 : 1,
                }}
                onMouseEnter={e => { if (!deleting) e.currentTarget.style.background = "rgba(248,113,113,0.25)"; }}
                onMouseLeave={e => { if (!deleting) e.currentTarget.style.background = "rgba(248,113,113,0.15)"; }}
              >
                {deleting ? "Menghapus..." : "Ya, Hapus"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    
  );

  
}