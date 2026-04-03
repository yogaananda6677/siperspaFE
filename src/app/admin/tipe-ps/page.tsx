"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  getTipePs,
  createTipePs,
  updateTipePs,
  deleteTipePs,
  type TipePs,
} from "@/lib/api";

const formatRupiah = (n: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(n);

type ModalMode = "tambah" | "edit" | null;

const emptyForm = { nama_tipe: "", harga_sewa: "" };

export default function TipePsPage() {
  const router = useRouter();
  const [data, setData] = useState<TipePs[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<TipePs | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { router.push("/login"); return; }
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const result = await getTipePs();
      setData(result);
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
    setForm(emptyForm);
    setFormError(null);
    setEditId(null);
    setModalMode("tambah");
  };

  const openEdit = (item: TipePs) => {
    setForm({ nama_tipe: item.nama_tipe, harga_sewa: String(item.harga_sewa) });
    setFormError(null);
    setEditId(item.id_tipe);
    setModalMode("edit");
  };

  const closeModal = () => {
    setModalMode(null);
    setFormError(null);
  };

  const handleSubmit = async () => {
    setFormError(null);
    if (!form.nama_tipe.trim()) { setFormError("Nama tipe wajib diisi."); return; }
    if (!form.harga_sewa || isNaN(Number(form.harga_sewa))) { setFormError("Harga sewa harus berupa angka."); return; }

    setSubmitting(true);
    try {
      const payload = { nama_tipe: form.nama_tipe.trim(), harga_sewa: Number(form.harga_sewa) };
      if (modalMode === "tambah") {
        const created = await createTipePs(payload);
        setData((prev) => [...prev, created]);
        showToast("Tipe PS berhasil ditambahkan.", "success");
      } else if (modalMode === "edit" && editId !== null) {
        const updated = await updateTipePs(editId, payload);
        setData((prev) => prev.map((d) => (d.id_tipe === editId ? updated : d)));
        showToast("Tipe PS berhasil diupdate.", "success");
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
      await deleteTipePs(deleteTarget.id_tipe);
      setData((prev) => prev.filter((d) => d.id_tipe !== deleteTarget.id_tipe));
      showToast("Tipe PS berhasil dihapus.", "success");
      setDeleteTarget(null);
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : "Gagal menghapus.", "error");
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  };

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
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 28 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: "#f0eaff" }}>Tipe PS</h1>
          <p style={{ margin: "4px 0 0", fontSize: 13, color: "#9b8ec4" }}>
            Kelola tipe PlayStation dan harga sewanya
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
          onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.85")}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
        >
          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path d="M12 5v14M5 12h14" strokeLinecap="round" />
          </svg>
          Tambah Tipe
        </button>
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
        ) : data.length === 0 ? (
          <div style={{ padding: "56px 0", textAlign: "center" }}>
            <div style={{
              width: 56, height: 56, borderRadius: 16,
              background: "rgba(159,110,245,0.1)",
              border: "1px solid rgba(159,110,245,0.2)",
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 14px",
            }}>
              <svg width="24" height="24" fill="none" stroke="#9f6ef5" strokeWidth="1.8" viewBox="0 0 24 24">
                <rect x="2" y="6" width="20" height="12" rx="3" />
                <path d="M8 12h4M10 10v4" strokeLinecap="round" />
              </svg>
            </div>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "#f0eaff" }}>Belum ada tipe PS</p>
            <p style={{ margin: "4px 0 0", fontSize: 13, color: "#9b8ec4" }}>Klik "Tambah Tipe" untuk mulai menambahkan.</p>
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(159,110,245,0.15)" }}>
                {["No", "Nama Tipe", "Harga Sewa / Jam", "Unit Terdaftar", "Aksi"].map((h) => (
                  <th key={h} style={{
                    padding: "14px 20px", textAlign: "left",
                    fontSize: 11, fontWeight: 600, letterSpacing: "0.06em",
                    textTransform: "uppercase", color: "#9b8ec4",
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((item, i) => {
                const isUsed = (item.playstation_count ?? 0) > 0;
                return (
                  <tr
                    key={item.id_tipe}
                    style={{
                      borderBottom: i < data.length - 1 ? "1px solid rgba(159,110,245,0.08)" : "none",
                      transition: "background 0.15s",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(159,110,245,0.05)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    <td style={{ padding: "16px 20px", fontSize: 13, color: "#9b8ec4" }}>{i + 1}</td>
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
                            <rect x="2" y="6" width="20" height="12" rx="3" />
                            <path d="M8 12h4M10 10v4" strokeLinecap="round" />
                          </svg>
                        </div>
                        <span style={{ fontSize: 14, fontWeight: 600, color: "#f0eaff" }}>{item.nama_tipe}</span>
                      </div>
                    </td>
                    <td style={{ padding: "16px 20px" }}>
                      <span style={{
                        display: "inline-block",
                        padding: "4px 12px", borderRadius: 8,
                        background: "rgba(74,222,128,0.08)",
                        border: "1px solid rgba(74,222,128,0.2)",
                        fontSize: 13, fontWeight: 600, color: "#4ade80",
                      }}>
                        {formatRupiah(item.harga_sewa)}
                      </span>
                    </td>
                    <td style={{ padding: "16px 20px" }}>
                      <span style={{
                        display: "inline-flex", alignItems: "center", gap: 5,
                        padding: "4px 12px", borderRadius: 8,
                        background: "rgba(159,110,245,0.08)",
                        border: "1px solid rgba(159,110,245,0.2)",
                        fontSize: 13, color: "#a47de8",
                      }}>
                        {item.playstation_count ?? 0} unit
                      </span>
                    </td>
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
                          onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(159,110,245,0.2)")}
                          onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(159,110,245,0.1)")}
                        >
                          <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                          Edit
                        </button>
                        {/* Hapus - Ditambahkan logika disabled jika sudah digunakan */}
                        <button
                          onClick={() => !isUsed && setDeleteTarget(item)}
                          disabled={isUsed}
                          title={isUsed ? "Tipe ini tidak bisa dihapus karena masih digunakan oleh unit PS" : ""}
                          style={{
                            display: "flex", alignItems: "center", gap: 6,
                            padding: "7px 14px", borderRadius: 8,
                            background: isUsed ? "rgba(255,255,255,0.03)" : "rgba(248,113,113,0.08)",
                            border: isUsed ? "1px solid rgba(255,255,255,0.1)" : "1px solid rgba(248,113,113,0.2)",
                            color: isUsed ? "#555" : "#f87171", 
                            fontSize: 12.5, fontWeight: 500,
                            cursor: isUsed ? "not-allowed" : "pointer", 
                            transition: "all 0.15s",
                            opacity: isUsed ? 0.6 : 1,
                          }}
                          onMouseEnter={(e) => {
                            if (!isUsed) e.currentTarget.style.background = "rgba(248,113,113,0.18)";
                          }}
                          onMouseLeave={(e) => {
                            if (!isUsed) e.currentTarget.style.background = "rgba(248,113,113,0.08)";
                          }}
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
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#1e1040",
              border: "1px solid rgba(159,110,245,0.25)",
              borderRadius: 20, padding: "28px",
              width: 400, boxShadow: "0 24px 60px rgba(0,0,0,0.5)",
            }}
          >
            <h2 style={{ margin: "0 0 20px", fontSize: 16, fontWeight: 700, color: "#f0eaff" }}>
              {modalMode === "tambah" ? "Tambah Tipe PS" : "Edit Tipe PS"}
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

            {/* Nama Tipe */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#9b8ec4", marginBottom: 7, letterSpacing: "0.04em" }}>
                NAMA TIPE
              </label>
              <input
                type="text"
                placeholder="cth: PS4, PS5 Pro..."
                value={form.nama_tipe}
                onChange={(e) => setForm({ ...form, nama_tipe: e.target.value })}
                style={{
                  width: "100%", padding: "10px 14px",
                  borderRadius: 10, fontSize: 14,
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(159,110,245,0.2)",
                  color: "#f0eaff", outline: "none",
                  boxSizing: "border-box",
                  transition: "border-color 0.15s",
                }}
                onFocus={(e) => (e.target.style.borderColor = "rgba(159,110,245,0.6)")}
                onBlur={(e) => (e.target.style.borderColor = "rgba(159,110,245,0.2)")}
              />
            </div>

            {/* Harga Sewa */}
            <div style={{ marginBottom: 24 }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#9b8ec4", marginBottom: 7, letterSpacing: "0.04em" }}>
                HARGA SEWA / JAM (Rp)
              </label>
              <input
                type="number"
                placeholder="cth: 8000"
                value={form.harga_sewa}
                onChange={(e) => setForm({ ...form, harga_sewa: e.target.value })}
                min={0}
                style={{
                  width: "100%", padding: "10px 14px",
                  borderRadius: 10, fontSize: 14,
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(159,110,245,0.2)",
                  color: "#f0eaff", outline: "none",
                  boxSizing: "border-box",
                  transition: "border-color 0.15s",
                }}
                onFocus={(e) => (e.target.style.borderColor = "rgba(159,110,245,0.6)")}
                onBlur={(e) => (e.target.style.borderColor = "rgba(159,110,245,0.2)")}
              />
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
                onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(159,110,245,0.1)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
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
            onClick={(e) => e.stopPropagation()}
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
            <h2 style={{ margin: "0 0 6px", fontSize: 16, fontWeight: 700, color: "#f0eaff" }}>Hapus Tipe PS</h2>
            <p style={{ margin: "0 0 6px", fontSize: 13.5, color: "#9b8ec4", lineHeight: 1.6 }}>
              Yakin ingin menghapus tipe{" "}
              <span style={{ color: "#f0eaff", fontWeight: 600 }}>"{deleteTarget.nama_tipe}"</span>?
            </p>
            <p style={{ margin: "0 0 24px", fontSize: 12.5, color: "#f87171" }}>
              Tipe tidak bisa dihapus jika masih ada unit PS yang terdaftar.
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
                onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(159,110,245,0.1)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
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
                onMouseEnter={(e) => { if (!deleting) e.currentTarget.style.background = "rgba(248,113,113,0.25)"; }}
                onMouseLeave={(e) => { if (!deleting) e.currentTarget.style.background = "rgba(248,113,113,0.15)"; }}
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