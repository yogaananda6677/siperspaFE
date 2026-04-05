"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  type Produk,
  getProduk,
  createProduk,
  updateProduk,
  deleteProduk,
  updateStockProduk,
} from "@/lib/api";

// ─── Types ───────────────────────────────────────────────────────────────────
type FormState = {
  nama: string;
  jenis: string;
  harga: string;
  stock: string;
};

type ModalMode = "tambah" | "edit" | null;
type StockModal = { produk: Produk; aksi: "tambah" | "kurangi" } | null;

// ─── Utils ───────────────────────────────────────────────────────────────────
const formatRupiah = (n: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(n);

const JENIS_CONFIG: Record<string, { color: string; bg: string; border: string; icon: string }> = {
  minuman: {
    color: "#38bdf8",
    bg: "rgba(56,189,248,0.08)",
    border: "rgba(56,189,248,0.2)",
    icon: "🥤",
  },
  makanan: {
    color: "#fb923c",
    bg: "rgba(251,146,60,0.08)",
    border: "rgba(251,146,60,0.2)",
    icon: "🍔",
  },
  snack: {
    color: "#f472b6",
    bg: "rgba(244,114,182,0.08)",
    border: "rgba(244,114,182,0.2)",
    icon: "🍿",
  },
};

const getJenisCfg = (jenis: string) =>
  JENIS_CONFIG[jenis.toLowerCase()] ?? {
    color: "#a47de8",
    bg: "rgba(159,110,245,0.08)",
    border: "rgba(159,110,245,0.2)",
    icon: "📦",
  };

const stockColor = (stock: number) => {
  if (stock === 0) return "#f87171";
  if (stock <= 5) return "#facc15";
  return "#4ade80";
};

const emptyForm: FormState = { nama: "", jenis: "", harga: "", stock: "" };

// ─── Component ───────────────────────────────────────────────────────────────
export default function ProdukPage() {
  const router = useRouter();
  const [data, setData] = useState<Produk[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterJenis, setFilterJenis] = useState("semua");
  const [filterTersedia, setFilterTersedia] = useState(false);
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState<"nama" | "harga" | "stock">("nama");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<Produk | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [stockModal, setStockModal] = useState<StockModal>(null);
  const [stockJumlah, setStockJumlah] = useState("1");
  const [stockSubmitting, setStockSubmitting] = useState(false);
  const [stockError, setStockError] = useState<string | null>(null);

  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { router.push("/login"); return; }
    fetchAll();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [filterJenis, filterTersedia, search, sortField, sortOrder, itemsPerPage]);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const res = await getProduk();
      setData(res);
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

  // ── Modal Tambah/Edit ──
  const openTambah = () => {
    setForm(emptyForm);
    setFormError(null);
    setEditId(null);
    setModalMode("tambah");
  };

  const openEdit = (item: Produk) => {
    console.log("item edit:", item);
    setForm({
      nama: item.nama,
      jenis: item.jenis,
      harga: String(item.harga),
      stock: String(item.stock),
    });
    setFormError(null);
    setEditId(item.id_produk);
    setModalMode("edit");
  };

  const closeModal = () => { setModalMode(null); setFormError(null); };

  const handleSubmit = async () => {
    setFormError(null);
    if (!form.nama.trim()) { setFormError("Nama produk wajib diisi."); return; }
    if (!form.jenis.trim()) { setFormError("Jenis produk wajib diisi."); return; }
    if (!form.harga || isNaN(Number(form.harga)) || Number(form.harga) < 0) {
      setFormError("Harga tidak valid."); return;
    }
    if (!form.stock || isNaN(Number(form.stock)) || Number(form.stock) < 0) {
      setFormError("Stock tidak valid."); return;
    }

    setSubmitting(true);
    try {
      const payload = {
        nama: form.nama.trim(),
        jenis: form.jenis.trim().toLowerCase(),
        harga: Number(form.harga),
        stock: Number(form.stock),
      };
      if (modalMode === "tambah") {
        const created = await createProduk(payload);
        setData(prev => [...prev, created]);
        showToast("Produk berhasil ditambahkan.", "success");
      } else if (modalMode === "edit" && editId !== null) {
        const updated = await updateProduk(editId, payload);
        setData(prev => prev.map(d => d.id_produk === editId ? updated : d));
        showToast("Produk berhasil diupdate.", "success");
      }
      closeModal();
    } catch (e: unknown) {
      setFormError(e instanceof Error ? e.message : "Terjadi kesalahan.");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Modal Hapus ──
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteProduk(deleteTarget.id_produk);
      setData(prev => prev.filter(d => d.id_produk !== deleteTarget.id_produk));
      showToast("Produk berhasil dihapus.", "success");
      setDeleteTarget(null);
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : "Gagal menghapus.", "error");
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  };

  // ── Modal Stock ──
  const openStockModal = (produk: Produk, aksi: "tambah" | "kurangi") => {
    setStockModal({ produk, aksi });
    setStockJumlah("1");
    setStockError(null);
  };

  const handleUpdateStock = async () => {
    if (!stockModal) return;
    const jumlah = Number(stockJumlah);
    if (!jumlah || jumlah < 1) { setStockError("Jumlah harus minimal 1."); return; }

    setStockSubmitting(true);
    try {
      const result = await updateStockProduk(stockModal.produk.id_produk, {
        aksi: stockModal.aksi,
        jumlah,
      });
      setData(prev =>
        prev.map(d =>
          d.id_produk === stockModal.produk.id_produk ? { ...d, stock: result.stock_saat_ini } : d
        )
      );
      showToast(
        stockModal.aksi === "tambah"
          ? `Stock ditambah ${jumlah}.`
          : `Stock dikurangi ${jumlah}.`,
        "success"
      );
      setStockModal(null);
    } catch (e: unknown) {
      setStockError(e instanceof Error ? e.message : "Gagal update stock.");
    } finally {
      setStockSubmitting(false);
    }
  };

  // ── Filter & Sort ──
  const jenisOptions = Array.from(new Set(data.map(d => d.jenis.toLowerCase())));

  const filteredData = [...data]
    .filter(d => filterJenis === "semua" || d.jenis.toLowerCase() === filterJenis)
    .filter(d => !filterTersedia || d.stock > 0)
    .filter(d =>
      !search ||
      d.nama.toLowerCase().includes(search.toLowerCase()) ||
      d.jenis.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      let cmp = 0;
      if (sortField === "nama") cmp = a.nama.localeCompare(b.nama, "id");
      else if (sortField === "harga") cmp = a.harga - b.harga;
      else if (sortField === "stock") cmp = a.stock - b.stock;
      return sortOrder === "asc" ? cmp : -cmp;
    });

  const totalPages = Math.max(1, Math.ceil(filteredData.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = filteredData.slice(startIndex, startIndex + itemsPerPage);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  const stats = {
    total: data.length,
    tersedia: data.filter(d => d.stock > 0).length,
    habis: data.filter(d => d.stock === 0).length,
    totalNilai: data.reduce((sum, d) => sum + d.harga * d.stock, 0),
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "10px 14px",
    borderRadius: 10,
    fontSize: 14,
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(159,110,245,0.2)",
    color: "#f0eaff",
    outline: "none",
    boxSizing: "border-box",
    transition: "border-color 0.15s",
  };

  return (
    <div style={{ padding: "32px 40px", minHeight: "100vh" }}>

      {/* ── Toast ── */}
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

      {/* ── Header ── */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: "#f0eaff" }}>Kelola Produk</h1>
          <p style={{ margin: "4px 0 0", fontSize: 13, color: "#9b8ec4" }}>
            Manajemen produk, harga, dan stok tersedia
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
          Tambah Produk
        </button>
      </div>

      {/* ── Stat Cards ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 24 }}>
        {[
          { label: "Total Produk", value: stats.total, color: "#9f6ef5", bg: "rgba(159,110,245,0.08)", border: "rgba(159,110,245,0.2)", isText: false },
          { label: "Tersedia", value: stats.tersedia, color: "#4ade80", bg: "rgba(74,222,128,0.08)", border: "rgba(74,222,128,0.2)", isText: false },
          { label: "Stok Habis", value: stats.habis, color: "#f87171", bg: "rgba(248,113,113,0.08)", border: "rgba(248,113,113,0.2)", isText: false },
          { label: "Total Nilai Stok", value: formatRupiah(stats.totalNilai), color: "#facc15", bg: "rgba(250,204,21,0.08)", border: "rgba(250,204,21,0.2)", isText: true },
        ].map(s => (
          <div key={s.label} style={{ padding: "16px 20px", borderRadius: 14, background: s.bg, border: `1px solid ${s.border}` }}>
            <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: "#9b8ec4", letterSpacing: "0.05em", textTransform: "uppercase" }}>{s.label}</p>
            <p style={{ margin: "6px 0 0", fontSize: s.isText ? 18 : 28, fontWeight: 700, color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* ── Filters ── */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 20, alignItems: "center" }}>
        <div style={{ position: "relative", flex: "1 1 200px", minWidth: 180 }}>
          <svg width="14" height="14" fill="none" stroke="#9b8ec4" strokeWidth="2" viewBox="0 0 24 24"
            style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}>
            <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" strokeLinecap="round" />
          </svg>
          <input
            type="text" placeholder="Cari produk..."
            value={search} onChange={e => setSearch(e.target.value)}
            style={{ width: "100%", padding: "8px 12px 8px 36px", borderRadius: 10, fontSize: 13, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(159,110,245,0.2)", color: "#f0eaff", outline: "none", boxSizing: "border-box" }}
          />
        </div>

        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {["semua", ...jenisOptions].map(j => (
            <button key={j} onClick={() => setFilterJenis(j)} style={{
              padding: "7px 14px", borderRadius: 10, fontSize: 13, fontWeight: 500, cursor: "pointer",
              border: "1px solid",
              background: filterJenis === j ? "rgba(159,110,245,0.2)" : "transparent",
              borderColor: filterJenis === j ? "rgba(159,110,245,0.5)" : "rgba(159,110,245,0.15)",
              color: filterJenis === j ? "#c9aff5" : "#9b8ec4",
              textTransform: "capitalize", transition: "all 0.15s",
            }}>
              {j === "semua" ? "Semua" : `${getJenisCfg(j).icon} ${j}`}
            </button>
          ))}
        </div>

        <button onClick={() => setFilterTersedia(v => !v)} style={{
          padding: "7px 14px", borderRadius: 10, fontSize: 13, fontWeight: 500, cursor: "pointer",
          border: "1px solid",
          background: filterTersedia ? "rgba(74,222,128,0.15)" : "transparent",
          borderColor: filterTersedia ? "rgba(74,222,128,0.4)" : "rgba(159,110,245,0.15)",
          color: filterTersedia ? "#4ade80" : "#9b8ec4",
          transition: "all 0.15s",
        }}>
          {filterTersedia ? "✓ " : ""}Tersedia Saja
        </button>

        <select
          value={`${sortField}-${sortOrder}`}
          onChange={e => {
            const [f, o] = e.target.value.split("-");
            setSortField(f as "nama" | "harga" | "stock");
            setSortOrder(o as "asc" | "desc");
          }}
          style={{ padding: "8px 12px", borderRadius: 10, fontSize: 13, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(159,110,245,0.2)", color: "#f0eaff", outline: "none", cursor: "pointer" }}
        >
          {[["nama-asc","Nama A-Z"],["nama-desc","Nama Z-A"],["harga-asc","Harga Termurah"],["harga-desc","Harga Termahal"],["stock-asc","Stok Terendah"],["stock-desc","Stok Terbanyak"]].map(([val, label]) => (
            <option key={val} value={val} style={{ background: "#1e1040" }}>{label}</option>
          ))}
        </select>
      </div>

      {/* ── Table ── */}
      <div style={{ borderRadius: 16, border: "1px solid rgba(159,110,245,0.15)", background: "#160d2e", overflow: "hidden" }}>
        {loading ? (
          <div style={{ padding: "48px 0", textAlign: "center", color: "#9b8ec4" }}>
            <div style={{ width: 32, height: 32, border: "2px solid rgba(159,110,245,0.2)", borderTop: "2px solid #9f6ef5", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 12px" }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            Memuat data...
          </div>
        ) : filteredData.length === 0 ? (
          <div style={{ padding: "56px 0", textAlign: "center" }}>
            <div style={{ width: 56, height: 56, borderRadius: 16, background: "rgba(159,110,245,0.1)", border: "1px solid rgba(159,110,245,0.2)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px", fontSize: 24 }}>📦</div>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "#f0eaff" }}>
              {search || filterJenis !== "semua" || filterTersedia ? "Tidak ada produk ditemukan" : "Belum ada produk"}
            </p>
            <p style={{ margin: "4px 0 0", fontSize: 13, color: "#9b8ec4" }}>
              {search || filterJenis !== "semua" || filterTersedia ? "Coba ubah filter pencarian." : 'Klik "Tambah Produk" untuk mulai.'}
            </p>
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(159,110,245,0.15)" }}>
                {["No", "Produk", "Jenis", "Harga", "Stok", "Aksi"].map(h => (
                  <th key={h} style={{ padding: "14px 20px", textAlign: "left", fontSize: 11, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: "#9b8ec4" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginatedData.map((item, i) => {
                const jenisCfg = getJenisCfg(item.jenis);
                return (
                  <tr key={item.id_produk}
                    style={{ borderBottom: i < paginatedData.length - 1 ? "1px solid rgba(159,110,245,0.08)" : "none", transition: "background 0.15s" }}
                    onMouseEnter={e => (e.currentTarget.style.background = "rgba(159,110,245,0.05)")}
                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                  >
                    <td style={{ padding: "16px 20px", fontSize: 13, color: "#9b8ec4" }}>{startIndex + i + 1}</td>

                    <td style={{ padding: "16px 20px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ width: 36, height: 36, borderRadius: 10, background: jenisCfg.bg, border: `1px solid ${jenisCfg.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17, flexShrink: 0 }}>{jenisCfg.icon}</div>
                        <span style={{ fontSize: 14, fontWeight: 600, color: "#f0eaff" }}>{item.nama}</span>
                      </div>
                    </td>

                    <td style={{ padding: "16px 20px" }}>
                      <span style={{ display: "inline-block", padding: "4px 12px", borderRadius: 8, background: jenisCfg.bg, border: `1px solid ${jenisCfg.border}`, fontSize: 12.5, color: jenisCfg.color, fontWeight: 600, textTransform: "capitalize" }}>
                        {item.jenis}
                      </span>
                    </td>

                    <td style={{ padding: "16px 20px" }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: "#c9aff5" }}>{formatRupiah(item.harga)}</span>
                    </td>

                    <td style={{ padding: "16px 20px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: 14, fontWeight: 700, color: stockColor(item.stock), minWidth: 24 }}>{item.stock}</span>
                        <div style={{ display: "flex", gap: 4 }}>
                          <button onClick={() => openStockModal(item, "tambah")} title="Tambah stok"
                            style={{ width: 24, height: 24, borderRadius: 6, border: "1px solid rgba(74,222,128,0.3)", background: "rgba(74,222,128,0.08)", color: "#4ade80", fontSize: 14, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.15s" }}
                            onMouseEnter={e => (e.currentTarget.style.background = "rgba(74,222,128,0.2)")}
                            onMouseLeave={e => (e.currentTarget.style.background = "rgba(74,222,128,0.08)")}
                          >+</button>
                          <button onClick={() => item.stock > 0 && openStockModal(item, "kurangi")} disabled={item.stock === 0} title="Kurangi stok"
                            style={{ width: 24, height: 24, borderRadius: 6, border: item.stock === 0 ? "1px solid rgba(255,255,255,0.08)" : "1px solid rgba(248,113,113,0.3)", background: item.stock === 0 ? "rgba(255,255,255,0.03)" : "rgba(248,113,113,0.08)", color: item.stock === 0 ? "#444" : "#f87171", fontSize: 14, fontWeight: 700, cursor: item.stock === 0 ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.15s" }}
                            onMouseEnter={e => { if (item.stock > 0) e.currentTarget.style.background = "rgba(248,113,113,0.2)"; }}
                            onMouseLeave={e => { if (item.stock > 0) e.currentTarget.style.background = "rgba(248,113,113,0.08)"; }}
                          >−</button>
                        </div>
                      </div>
                    </td>

                    <td style={{ padding: "16px 20px" }}>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button onClick={() => openEdit(item)}
                          style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 8, background: "rgba(159,110,245,0.1)", border: "1px solid rgba(159,110,245,0.25)", color: "#a47de8", fontSize: 12.5, fontWeight: 500, cursor: "pointer", transition: "all 0.15s" }}
                          onMouseEnter={e => (e.currentTarget.style.background = "rgba(159,110,245,0.2)")}
                          onMouseLeave={e => (e.currentTarget.style.background = "rgba(159,110,245,0.1)")}
                        >
                          <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                          Edit
                        </button>
                        <button onClick={() => setDeleteTarget(item)}
                          style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 8, background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.2)", color: "#f87171", fontSize: 12.5, fontWeight: 500, cursor: "pointer", transition: "all 0.15s" }}
                          onMouseEnter={e => (e.currentTarget.style.background = "rgba(248,113,113,0.18)")}
                          onMouseLeave={e => (e.currentTarget.style.background = "rgba(248,113,113,0.08)")}
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

      {/* ── Pagination ── */}
      {!loading && filteredData.length > 0 && (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginTop: 16, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 13, color: "#9b8ec4" }}>Tampilkan</span>
            <select value={itemsPerPage} onChange={e => setItemsPerPage(Number(e.target.value))}
              style={{ padding: "8px 12px", borderRadius: 10, fontSize: 13, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(159,110,245,0.2)", color: "#f0eaff", outline: "none", cursor: "pointer" }}>
              {[5, 10, 20, 50].map(n => <option key={n} value={n} style={{ background: "#1e1040" }}>{n}</option>)}
            </select>
            <span style={{ fontSize: 13, color: "#9b8ec4" }}>data / halaman</span>
          </div>
          <div style={{ fontSize: 13, color: "#9b8ec4" }}>
            Menampilkan {filteredData.length === 0 ? 0 : startIndex + 1}–{Math.min(startIndex + itemsPerPage, filteredData.length)} dari {filteredData.length} data
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} disabled={currentPage === 1}
              style={{ padding: "8px 12px", borderRadius: 10, border: "1px solid rgba(159,110,245,0.25)", background: currentPage === 1 ? "rgba(255,255,255,0.03)" : "transparent", color: currentPage === 1 ? "#666" : "#c9aff5", cursor: currentPage === 1 ? "not-allowed" : "pointer" }}>Prev</button>
            <span style={{ fontSize: 13, color: "#f0eaff", minWidth: 90, textAlign: "center" }}>Halaman {currentPage} / {totalPages}</span>
            <button onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages}
              style={{ padding: "8px 12px", borderRadius: 10, border: "1px solid rgba(159,110,245,0.25)", background: currentPage === totalPages ? "rgba(255,255,255,0.03)" : "transparent", color: currentPage === totalPages ? "#666" : "#c9aff5", cursor: currentPage === totalPages ? "not-allowed" : "pointer" }}>Next</button>
          </div>
        </div>
      )}

      {/* ── Modal Tambah/Edit ── */}
      {modalMode && (
        <div onClick={closeModal} style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.65)", backdropFilter: "blur(6px)" }}>
          <div onClick={e => e.stopPropagation()} style={{ background: "#1e1040", border: "1px solid rgba(159,110,245,0.25)", borderRadius: 20, padding: "28px", width: 440, boxShadow: "0 24px 60px rgba(0,0,0,0.5)" }}>
            <h2 style={{ margin: "0 0 20px", fontSize: 16, fontWeight: 700, color: "#f0eaff" }}>
              {modalMode === "tambah" ? "Tambah Produk" : "Edit Produk"}
            </h2>
            {formError && (
              <div style={{ padding: "10px 14px", borderRadius: 10, marginBottom: 16, background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.25)", color: "#f87171", fontSize: 13 }}>{formError}</div>
            )}
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#9b8ec4", marginBottom: 7, letterSpacing: "0.04em" }}>NAMA PRODUK</label>
              <input type="text" placeholder="cth: Es Teh, Indomie Goreng..." value={form.nama} onChange={e => setForm({ ...form, nama: e.target.value })} style={inputStyle}
                onFocus={e => (e.target.style.borderColor = "rgba(159,110,245,0.6)")} onBlur={e => (e.target.style.borderColor = "rgba(159,110,245,0.2)")} />
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#9b8ec4", marginBottom: 7, letterSpacing: "0.04em" }}>JENIS</label>
              <div style={{ display: "flex", gap: 6, marginBottom: 8, flexWrap: "wrap" }}>
                {["minuman", "makanan", "snack"].map(j => {
                  const cfg = getJenisCfg(j);
                  const sel = form.jenis === j;
                  return (
                    <button key={j} type="button" onClick={() => setForm({ ...form, jenis: j })} style={{
                      padding: "7px 14px", borderRadius: 8, fontSize: 12.5, fontWeight: 600, cursor: "pointer",
                      border: `1px solid ${sel ? cfg.border : "rgba(159,110,245,0.15)"}`,
                      background: sel ? cfg.bg : "transparent", color: sel ? cfg.color : "#9b8ec4", transition: "all 0.15s",
                    }}>{cfg.icon} {j}</button>
                  );
                })}
              </div>
              <input type="text" placeholder="Atau ketik jenis lainnya..." value={form.jenis} onChange={e => setForm({ ...form, jenis: e.target.value })} style={{ ...inputStyle, fontSize: 13 }}
                onFocus={e => (e.target.style.borderColor = "rgba(159,110,245,0.6)")} onBlur={e => (e.target.style.borderColor = "rgba(159,110,245,0.2)")} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 24 }}>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#9b8ec4", marginBottom: 7, letterSpacing: "0.04em" }}>HARGA (Rp)</label>
                <input type="number" min="0" placeholder="cth: 5000" value={form.harga} onChange={e => setForm({ ...form, harga: e.target.value })} style={inputStyle}
                  onFocus={e => (e.target.style.borderColor = "rgba(159,110,245,0.6)")} onBlur={e => (e.target.style.borderColor = "rgba(159,110,245,0.2)")} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#9b8ec4", marginBottom: 7, letterSpacing: "0.04em" }}>STOK AWAL</label>
                <input type="number" min="0" placeholder="cth: 20" value={form.stock} onChange={e => setForm({ ...form, stock: e.target.value })} style={inputStyle}
                  onFocus={e => (e.target.style.borderColor = "rgba(159,110,245,0.6)")} onBlur={e => (e.target.style.borderColor = "rgba(159,110,245,0.2)")} />
              </div>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={closeModal} style={{ flex: 1, padding: "11px 0", borderRadius: 10, border: "1px solid rgba(159,110,245,0.25)", background: "transparent", color: "#c9aff5", fontSize: 13.5, fontWeight: 600, cursor: "pointer" }}
                onMouseEnter={e => (e.currentTarget.style.background = "rgba(159,110,245,0.1)")} onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>Batal</button>
              <button onClick={handleSubmit} disabled={submitting} style={{ flex: 1, padding: "11px 0", borderRadius: 10, background: "linear-gradient(135deg, #5b2faa, #9f6ef5)", border: "none", color: "white", fontSize: 13.5, fontWeight: 600, cursor: submitting ? "not-allowed" : "pointer", opacity: submitting ? 0.6 : 1 }}>
                {submitting ? "Menyimpan..." : modalMode === "tambah" ? "Tambahkan" : "Simpan"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal Update Stock ── */}
      {stockModal && (
        <div onClick={() => !stockSubmitting && setStockModal(null)} style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.65)", backdropFilter: "blur(6px)" }}>
          <div onClick={e => e.stopPropagation()} style={{ background: "#1e1040", border: "1px solid rgba(159,110,245,0.25)", borderRadius: 20, padding: "28px", width: 360, boxShadow: "0 24px 60px rgba(0,0,0,0.5)" }}>
            <div style={{ width: 48, height: 48, borderRadius: 14, marginBottom: 16, background: stockModal.aksi === "tambah" ? "rgba(74,222,128,0.1)" : "rgba(248,113,113,0.1)", border: `1px solid ${stockModal.aksi === "tambah" ? "rgba(74,222,128,0.25)" : "rgba(248,113,113,0.25)"}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>
              {stockModal.aksi === "tambah" ? "📦" : "📤"}
            </div>
            <h2 style={{ margin: "0 0 4px", fontSize: 16, fontWeight: 700, color: "#f0eaff" }}>
              {stockModal.aksi === "tambah" ? "Tambah Stok" : "Kurangi Stok"}
            </h2>
            <p style={{ margin: "0 0 16px", fontSize: 13, color: "#9b8ec4" }}>
              Produk: <span style={{ color: "#f0eaff", fontWeight: 600 }}>{stockModal.produk.nama}</span>
              &nbsp;· Stok saat ini: <span style={{ color: stockColor(stockModal.produk.stock), fontWeight: 600 }}>{stockModal.produk.stock}</span>
            </p>
            {stockError && (
              <div style={{ padding: "10px 14px", borderRadius: 10, marginBottom: 14, background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.25)", color: "#f87171", fontSize: 13 }}>{stockError}</div>
            )}
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#9b8ec4", marginBottom: 7, letterSpacing: "0.04em" }}>JUMLAH</label>
              <input type="number" min="1" value={stockJumlah} onChange={e => setStockJumlah(e.target.value)} style={{ ...inputStyle, fontSize: 16, fontWeight: 700, textAlign: "center" }}
                onFocus={e => (e.target.style.borderColor = "rgba(159,110,245,0.6)")} onBlur={e => (e.target.style.borderColor = "rgba(159,110,245,0.2)")} />
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setStockModal(null)} style={{ flex: 1, padding: "11px 0", borderRadius: 10, border: "1px solid rgba(159,110,245,0.25)", background: "transparent", color: "#c9aff5", fontSize: 13.5, fontWeight: 600, cursor: "pointer" }}
                onMouseEnter={e => (e.currentTarget.style.background = "rgba(159,110,245,0.1)")} onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>Batal</button>
              <button onClick={handleUpdateStock} disabled={stockSubmitting} style={{ flex: 1, padding: "11px 0", borderRadius: 10, border: "none", background: stockModal.aksi === "tambah" ? "linear-gradient(135deg, #166534, #4ade80)" : "linear-gradient(135deg, #991b1b, #f87171)", color: "white", fontSize: 13.5, fontWeight: 600, cursor: stockSubmitting ? "not-allowed" : "pointer", opacity: stockSubmitting ? 0.6 : 1 }}>
                {stockSubmitting ? "Menyimpan..." : stockModal.aksi === "tambah" ? "Tambah" : "Kurangi"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal Hapus ── */}
      {deleteTarget && (
        <div onClick={() => !deleting && setDeleteTarget(null)} style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.65)", backdropFilter: "blur(6px)" }}>
          <div onClick={e => e.stopPropagation()} style={{ background: "#1e1040", border: "1px solid rgba(159,110,245,0.25)", borderRadius: 20, padding: "28px", width: 340, boxShadow: "0 24px 60px rgba(0,0,0,0.5)" }}>
            <div style={{ width: 48, height: 48, borderRadius: 14, background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.2)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
              <svg width="22" height="22" fill="none" stroke="#f87171" strokeWidth="1.8" viewBox="0 0 24 24">
                <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h2 style={{ margin: "0 0 6px", fontSize: 16, fontWeight: 700, color: "#f0eaff" }}>Hapus Produk</h2>
            <p style={{ margin: "0 0 24px", fontSize: 13.5, color: "#9b8ec4", lineHeight: 1.6 }}>
              Yakin ingin menghapus produk{" "}
              <span style={{ color: "#f0eaff", fontWeight: 600 }}>"{deleteTarget.nama}"</span>? Tindakan ini tidak dapat dibatalkan.
            </p>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setDeleteTarget(null)} disabled={deleting} style={{ flex: 1, padding: "10px 0", borderRadius: 10, border: "1px solid rgba(159,110,245,0.25)", background: "transparent", color: "#c9aff5", fontSize: 13.5, fontWeight: 600, cursor: "pointer" }}
                onMouseEnter={e => (e.currentTarget.style.background = "rgba(159,110,245,0.1)")} onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>Batal</button>
              <button onClick={handleDelete} disabled={deleting} style={{ flex: 1, padding: "10px 0", borderRadius: 10, border: "1px solid rgba(248,113,113,0.3)", background: "rgba(248,113,113,0.15)", color: "#f87171", fontSize: 13.5, fontWeight: 600, cursor: deleting ? "not-allowed" : "pointer", opacity: deleting ? 0.6 : 1 }}
                onMouseEnter={e => { if (!deleting) e.currentTarget.style.background = "rgba(248,113,113,0.25)"; }}
                onMouseLeave={e => { if (!deleting) e.currentTarget.style.background = "rgba(248,113,113,0.15)"; }}>
                {deleting ? "Menghapus..." : "Ya, Hapus"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}