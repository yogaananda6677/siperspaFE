"use client";

import { useEffect, useState } from "react";
import {
  type Admin,
  getAdmins,
  createAdmin,
  updateAdmin,
  deleteAdmin,
} from "@/lib/api";

type FormData = {
  name: string;
  username: string;
  email: string;
  password: string;
  password_confirmation: string;
};

const EMPTY_FORM: FormData = {
  name: "",
  username: "",
  email: "",
  password: "admin123",
  password_confirmation: "admin123",
};

const initials = (name: string) =>
  name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

const AVATAR_COLORS = [
  "linear-gradient(135deg,#6366f1,#a855f7)",
  "linear-gradient(135deg,#0ea5e9,#6366f1)",
  "linear-gradient(135deg,#f59e0b,#ef4444)",
  "linear-gradient(135deg,#10b981,#0ea5e9)",
  "linear-gradient(135deg,#ec4899,#a855f7)",
];
const avatarColor = (id: number) => AVATAR_COLORS[id % AVATAR_COLORS.length];

export default function KelolaAdminPage() {
  const [data, setData] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState<Admin | null>(null);

  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const [errors, setErrors] = useState<Partial<FormData>>({});
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    fetchAll();
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
      const res = await getAdmins({ all: true });
      setData(res.data ?? []);
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Gagal memuat data admin", "error");
    } finally {
      setLoading(false);
    }
  };

  const validateForm = (isEdit = false) => {
    const newErrors: Partial<FormData> = {};

    if (!form.name.trim()) newErrors.name = "Nama wajib diisi";
    if (!form.username.trim()) newErrors.username = "Username wajib diisi";
    if (!form.email.trim()) newErrors.email = "Email wajib diisi";

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (form.email && !emailRegex.test(form.email)) {
      newErrors.email = "Format email tidak valid";
    }

    if (!isEdit || form.password) {
      if (!form.password) newErrors.password = "Password wajib diisi";
      else if (form.password.length < 6) newErrors.password = "Password minimal 6 karakter";

      if (form.password !== form.password_confirmation) {
        newErrors.password_confirmation = "Konfirmasi password tidak cocok";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const openAdd = () => {
    setForm(EMPTY_FORM);
    setErrors({});
    setShowAddModal(true);
  };

  const openEdit = (admin: Admin) => {
    setSelectedAdmin(admin);
    setForm({
      name: admin.name,
      username: admin.username,
      email: admin.email,
      password: "",
      password_confirmation: "",
    });
    setErrors({});
    setShowEditModal(true);
  };

  const openDelete = (admin: Admin) => {
    setSelectedAdmin(admin);
    setShowDeleteModal(true);
  };

  const handleAdd = async () => {
    if (!validateForm(false)) return;

    setSubmitting(true);
    try {
      const created = await createAdmin(form);
      setData((prev) => [created, ...prev]);
      showToast("Admin berhasil ditambahkan");
      setShowAddModal(false);
      setForm(EMPTY_FORM);
      setErrors({});
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Terjadi kesalahan", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = async () => {
    if (!selectedAdmin) return;
    if (!validateForm(true)) return;

    setSubmitting(true);
    try {
      const payload: Partial<FormData> = {
        name: form.name,
        username: form.username,
        email: form.email,
      };

      if (form.password) {
        payload.password = form.password;
        payload.password_confirmation = form.password_confirmation;
      }

      const updated = await updateAdmin(selectedAdmin.id_user, payload);

      setData((prev) =>
        prev.map((item) =>
          item.id_user === selectedAdmin.id_user ? updated : item
        )
      );

      showToast("Admin berhasil diupdate");
      setShowEditModal(false);
      setSelectedAdmin(null);
      setErrors({});
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Terjadi kesalahan", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedAdmin) return;

    setDeleting(true);
    try {
      await deleteAdmin(selectedAdmin.id_user);
      setData((prev) =>
        prev.filter((item) => item.id_user !== selectedAdmin.id_user)
      );
      showToast("Admin berhasil dihapus");
      setShowDeleteModal(false);
      setSelectedAdmin(null);
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Gagal menghapus", "error");
    } finally {
      setDeleting(false);
    }
  };

  const filteredData = [...data]
    .filter((item) => {
      const keyword = search.toLowerCase();
      return (
        !keyword ||
        item.name.toLowerCase().includes(keyword) ||
        item.username.toLowerCase().includes(keyword) ||
        item.email.toLowerCase().includes(keyword)
      );
    })
    .sort((a, b) => {
      const cmp = a.name.localeCompare(b.name, "id", { sensitivity: "base" });
      return sortOrder === "asc" ? cmp : -cmp;
    });

  const totalPages = Math.max(1, Math.ceil(filteredData.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedAdmins = filteredData.slice(startIndex, endIndex);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const stats = {
    total: data.length,
    aktif: data.length,
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
          <h1
            style={{
              margin: 0,
              fontSize: 22,
              fontWeight: 700,
              color: "#f0eaff",
            }}
          >
            Kelola Admin
          </h1>
          <p
            style={{
              margin: "4px 0 0",
              fontSize: 13,
              color: "#9b8ec4",
            }}
          >
            Manajemen akun admin sistem
          </p>
        </div>

        <button
          onClick={openAdd}
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
            transition: "opacity 0.15s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.85")}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
        >
          <svg
            width="14"
            height="14"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            viewBox="0 0 24 24"
          >
            <path d="M12 5v14M5 12h14" strokeLinecap="round" />
          </svg>
          Tambah Admin
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
            label: "Total Admin",
            value: stats.total,
            color: "#9f6ef5",
            bg: "rgba(159,110,245,0.08)",
            border: "rgba(159,110,245,0.2)",
          },
          {
            label: "Aktif",
            value: stats.aktif,
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
        <div style={{ position: "relative", flex: "1 1 200px", minWidth: 180 }}>
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
            placeholder="Cari nama, username, email..."
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
            Nama A-Z
          </option>
          <option value="desc" style={{ background: "#1e1040" }}>
            Nama Z-A
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
            Memuat data...
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
              }}
            >
              <svg
                width="26"
                height="26"
                fill="none"
                stroke="#9f6ef5"
                strokeWidth="1.6"
                viewBox="0 0 24 24"
              >
                <circle cx="12" cy="8" r="4" />
                <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" strokeLinecap="round" />
              </svg>
            </div>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "#f0eaff" }}>
              {search ? "Tidak ada admin ditemukan" : "Belum ada admin"}
            </p>
            <p style={{ margin: "4px 0 0", fontSize: 13, color: "#9b8ec4" }}>
              {search ? "Coba ubah kata kunci pencarian." : 'Klik "Tambah Admin" untuk mulai menambahkan.'}
            </p>
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(159,110,245,0.15)" }}>
                {["No", "Admin", "Email", "Role", "Bergabung", "Aksi"].map((h) => (
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
              {paginatedAdmins.map((admin, i) => (
                <tr
                  key={admin.id_user}
                  style={{
                    borderBottom:
                      i < paginatedAdmins.length - 1
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
                          background: avatarColor(admin.id_user),
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 12,
                          fontWeight: 700,
                          color: "white",
                          flexShrink: 0,
                        }}
                      >
                        {initials(admin.name)}
                      </div>
                      <div>
                        <div
                          style={{
                            fontSize: 13.5,
                            fontWeight: 600,
                            color: "#f0eaff",
                          }}
                        >
                          {admin.name}
                        </div>
                        <div style={{ fontSize: 11.5, color: "#9b8ec4" }}>
                          @{admin.username}
                        </div>
                      </div>
                    </div>
                  </td>

                  <td style={{ padding: "16px 20px", color: "#c4b5fd", fontSize: 13 }}>
                    {admin.email}
                  </td>

                  <td style={{ padding: "16px 20px" }}>
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                        padding: "4px 12px",
                        borderRadius: 8,
                        background: "rgba(124,58,237,0.15)",
                        border: "1px solid rgba(124,58,237,0.25)",
                        fontSize: 12,
                        fontWeight: 600,
                        color: "#c4b5fd",
                      }}
                    >
                      <span
                        style={{
                          width: 5,
                          height: 5,
                          borderRadius: "50%",
                          background: "#a78bfa",
                        }}
                      />
                      Admin
                    </span>
                  </td>

                  <td style={{ padding: "16px 20px", color: "#9b8ec4", fontSize: 13 }}>
                    {formatDate(admin.created_at)}
                  </td>

                  <td style={{ padding: "16px 20px" }}>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button
                        onClick={() => openEdit(admin)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                          padding: "7px 14px",
                          borderRadius: 8,
                          background: "rgba(159,110,245,0.1)",
                          border: "1px solid rgba(159,110,245,0.25)",
                          color: "#a47de8",
                          fontSize: 12.5,
                          fontWeight: 500,
                          cursor: "pointer",
                          transition: "all 0.15s",
                        }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.background = "rgba(159,110,245,0.2)")
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.background = "rgba(159,110,245,0.1)")
                        }
                      >
                        <svg
                          width="12"
                          height="12"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          viewBox="0 0 24 24"
                        >
                          <path
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                        Edit
                      </button>

                      <button
                        onClick={() => openDelete(admin)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                          padding: "7px 14px",
                          borderRadius: 8,
                          background: "rgba(248,113,113,0.08)",
                          border: "1px solid rgba(248,113,113,0.2)",
                          color: "#f87171",
                          fontSize: 12.5,
                          fontWeight: 500,
                          cursor: "pointer",
                          transition: "all 0.15s",
                        }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.background = "rgba(248,113,113,0.18)")
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.background = "rgba(248,113,113,0.08)")
                        }
                      >
                        <svg
                          width="12"
                          height="12"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          viewBox="0 0 24 24"
                        >
                          <path
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                        Hapus
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
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
            Menampilkan {filteredData.length === 0 ? 0 : startIndex + 1} –{" "}
            {Math.min(endIndex, filteredData.length)} dari {filteredData.length} data
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              style={{
                padding: "8px 12px",
                borderRadius: 10,
                border: "1px solid rgba(159,110,245,0.25)",
                background:
                  currentPage === 1
                    ? "rgba(255,255,255,0.03)"
                    : "transparent",
                color: currentPage === 1 ? "#666" : "#c9aff5",
                cursor: currentPage === 1 ? "not-allowed" : "pointer",
              }}
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
              onClick={() =>
                setCurrentPage((p) => Math.min(p + 1, totalPages))
              }
              disabled={currentPage === totalPages}
              style={{
                padding: "8px 12px",
                borderRadius: 10,
                border: "1px solid rgba(159,110,245,0.25)",
                background:
                  currentPage === totalPages
                    ? "rgba(255,255,255,0.03)"
                    : "transparent",
                color: currentPage === totalPages ? "#666" : "#c9aff5",
                cursor:
                  currentPage === totalPages ? "not-allowed" : "pointer",
              }}
            >
              Next
            </button>
          </div>
        </div>
      )}

      {showAddModal && (
        <div
          onClick={(e) => e.target === e.currentTarget && setShowAddModal(false)}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 100,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(0,0,0,0.65)",
            backdropFilter: "blur(6px)",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#1e1040",
              border: "1px solid rgba(159,110,245,0.25)",
              borderRadius: 20,
              padding: "28px",
              width: 460,
              boxShadow: "0 24px 60px rgba(0,0,0,0.5)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 11,
                  background: "rgba(124,58,237,0.15)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <svg width="18" height="18" fill="none" stroke="#a78bfa" strokeWidth="2" viewBox="0 0 24 24">
                  <circle cx="12" cy="8" r="4" />
                  <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" strokeLinecap="round" />
                  <path d="M19 3v4M17 5h4" strokeLinecap="round" />
                </svg>
              </div>
              <div>
                <p style={{ margin: 0, fontSize: 17, fontWeight: 700, color: "#f0eaff" }}>
                  Tambah Admin Baru
                </p>
                <p style={{ margin: "2px 0 0", fontSize: 12.5, color: "#9b8ec4" }}>
                  Buat akun admin untuk sistem
                </p>
              </div>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 10,
                padding: "12px 14px",
                borderRadius: 10,
                marginBottom: 20,
                background: "rgba(250,204,21,0.07)",
                border: "1px solid rgba(250,204,21,0.25)",
              }}
            >
              <svg
                width="16"
                height="16"
                fill="none"
                stroke="#facc15"
                strokeWidth="2"
                viewBox="0 0 24 24"
                style={{ flexShrink: 0, marginTop: 1 }}
              >
                <circle cx="12" cy="12" r="10" />
                <path d="M12 8v4M12 16h.01" strokeLinecap="round" />
              </svg>
              <div>
                <p style={{ margin: 0, fontSize: 12.5, fontWeight: 600, color: "#facc15" }}>
                  Password Default
                </p>
                <p style={{ margin: "3px 0 0", fontSize: 12, color: "#d4b96e", lineHeight: 1.5 }}>
                  Akun admin baru akan dibuat dengan password default{" "}
                  <span
                    style={{
                      fontFamily: "monospace",
                      fontWeight: 700,
                      background: "rgba(250,204,21,0.15)",
                      padding: "1px 6px",
                      borderRadius: 4,
                      color: "#fde68a",
                    }}
                  >
                    admin123
                  </span>
                </p>
              </div>
            </div>

            <InputField
              label="Nama Lengkap"
              value={form.name}
              onChange={(v) => setForm({ ...form, name: v })}
              error={errors.name}
              placeholder="Masukkan nama lengkap"
            />

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 14px" }}>
              <InputField
                label="Username"
                value={form.username}
                onChange={(v) => setForm({ ...form, username: v })}
                error={errors.username}
                placeholder="contoh: admin_budi"
              />
              <InputField
                label="Email"
                value={form.email}
                onChange={(v) => setForm({ ...form, email: v })}
                error={errors.email}
                placeholder="admin@example.com"
                type="email"
              />
            </div>

            <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
              <button
                onClick={() => setShowAddModal(false)}
                style={{
                  flex: 1,
                  padding: "11px 0",
                  borderRadius: 10,
                  border: "1px solid rgba(159,110,245,0.25)",
                  background: "transparent",
                  color: "#c9aff5",
                  fontSize: 13.5,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Batal
              </button>
              <button
                onClick={handleAdd}
                disabled={submitting}
                style={{
                  flex: 1,
                  padding: "11px 0",
                  borderRadius: 10,
                  background: "linear-gradient(135deg, #5b2faa, #9f6ef5)",
                  border: "none",
                  color: "white",
                  fontSize: 13.5,
                  fontWeight: 600,
                  cursor: submitting ? "not-allowed" : "pointer",
                  opacity: submitting ? 0.6 : 1,
                }}
              >
                {submitting ? "Menyimpan..." : "Simpan Admin"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showEditModal && selectedAdmin && (
        <div
          onClick={(e) => e.target === e.currentTarget && setShowEditModal(false)}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 100,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(0,0,0,0.65)",
            backdropFilter: "blur(6px)",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#1e1040",
              border: "1px solid rgba(159,110,245,0.25)",
              borderRadius: 20,
              padding: "28px",
              width: 460,
              boxShadow: "0 24px 60px rgba(0,0,0,0.5)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 11,
                  background: avatarColor(selectedAdmin.id_user),
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 14,
                  fontWeight: 700,
                  color: "white",
                }}
              >
                {initials(selectedAdmin.name)}
              </div>
              <div>
                <p style={{ margin: 0, fontSize: 17, fontWeight: 700, color: "#f0eaff" }}>
                  Edit Admin
                </p>
                <p style={{ margin: "2px 0 0", fontSize: 12.5, color: "#9b8ec4" }}>
                  @{selectedAdmin.username}
                </p>
              </div>
            </div>

            <InputField
              label="Nama Lengkap"
              value={form.name}
              onChange={(v) => setForm({ ...form, name: v })}
              error={errors.name}
              placeholder="Masukkan nama lengkap"
            />

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 14px" }}>
              <InputField
                label="Username"
                value={form.username}
                onChange={(v) => setForm({ ...form, username: v })}
                error={errors.username}
                placeholder="contoh: admin_budi"
              />
              <InputField
                label="Email"
                value={form.email}
                onChange={(v) => setForm({ ...form, email: v })}
                error={errors.email}
                placeholder="admin@example.com"
                type="email"
              />
            </div>

            <div style={{ height: 1, background: "rgba(159,110,245,0.1)", margin: "4px 0 14px" }} />
            <p style={{ margin: "0 0 12px", fontSize: 12, color: "#9b8ec4" }}>
              Password (kosongkan jika tidak ingin mengubah)
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 14px" }}>
              <InputField
                label="Password Baru"
                value={form.password}
                onChange={(v) => setForm({ ...form, password: v })}
                error={errors.password}
                placeholder="Password baru"
                type="password"
              />
              <InputField
                label="Konfirmasi Password"
                value={form.password_confirmation}
                onChange={(v) =>
                  setForm({ ...form, password_confirmation: v })
                }
                error={errors.password_confirmation}
                placeholder="Konfirmasi password"
                type="password"
              />
            </div>

            <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
              <button
                onClick={() => setShowEditModal(false)}
                style={{
                  flex: 1,
                  padding: "11px 0",
                  borderRadius: 10,
                  border: "1px solid rgba(159,110,245,0.25)",
                  background: "transparent",
                  color: "#c9aff5",
                  fontSize: 13.5,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Batal
              </button>
              <button
                onClick={handleEdit}
                disabled={submitting}
                style={{
                  flex: 1,
                  padding: "11px 0",
                  borderRadius: 10,
                  background: "linear-gradient(135deg, #5b2faa, #9f6ef5)",
                  border: "none",
                  color: "white",
                  fontSize: 13.5,
                  fontWeight: 600,
                  cursor: submitting ? "not-allowed" : "pointer",
                  opacity: submitting ? 0.6 : 1,
                }}
              >
                {submitting ? "Menyimpan..." : "Update Admin"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showDeleteModal && selectedAdmin && (
        <div
          onClick={() => !deleting && setShowDeleteModal(false)}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 100,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(0,0,0,0.65)",
            backdropFilter: "blur(6px)",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#1e1040",
              border: "1px solid rgba(159,110,245,0.25)",
              borderRadius: 20,
              padding: "28px",
              width: 340,
              boxShadow: "0 24px 60px rgba(0,0,0,0.5)",
            }}
          >
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 14,
                background: "rgba(248,113,113,0.1)",
                border: "1px solid rgba(248,113,113,0.2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 16,
              }}
            >
              <svg width="22" height="22" fill="none" stroke="#f87171" strokeWidth="1.8" viewBox="0 0 24 24">
                <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>

            <h2 style={{ margin: "0 0 6px", fontSize: 16, fontWeight: 700, color: "#f0eaff" }}>
              Hapus Admin?
            </h2>
            <p style={{ margin: "0 0 24px", fontSize: 13.5, color: "#9b8ec4", lineHeight: 1.6 }}>
              Akun <strong style={{ color: "#f0eaff" }}>{selectedAdmin.name}</strong> akan dihapus permanen dan tidak bisa dikembalikan.
            </p>

            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={() => setShowDeleteModal(false)}
                disabled={deleting}
                style={{
                  flex: 1,
                  padding: "10px 0",
                  borderRadius: 10,
                  border: "1px solid rgba(159,110,245,0.25)",
                  background: "transparent",
                  color: "#c9aff5",
                  fontSize: 13.5,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Batal
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                style={{
                  flex: 1,
                  padding: "10px 0",
                  borderRadius: 10,
                  border: "1px solid rgba(248,113,113,0.3)",
                  background: "rgba(248,113,113,0.15)",
                  color: "#f87171",
                  fontSize: 13.5,
                  fontWeight: 600,
                  cursor: deleting ? "not-allowed" : "pointer",
                  opacity: deleting ? 0.6 : 1,
                }}
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

function InputField({
  label,
  value,
  onChange,
  error,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  placeholder: string;
  type?: string;
}) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label
        style={{
          display: "block",
          fontSize: 12,
          fontWeight: 600,
          color: "#9b8ec4",
          marginBottom: 7,
          letterSpacing: "0.04em",
          textTransform: "uppercase",
        }}
      >
        {label}
      </label>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: "100%",
          padding: "10px 14px",
          borderRadius: 10,
          fontSize: 14,
          background: "rgba(255,255,255,0.04)",
          border: `1px solid ${
            error ? "rgba(248,113,113,0.5)" : "rgba(159,110,245,0.2)"
          }`,
          color: "#f0eaff",
          outline: "none",
          boxSizing: "border-box",
          transition: "border-color 0.15s",
        }}
      />
      {error && (
        <p style={{ margin: "4px 0 0", fontSize: 11.5, color: "#f87171" }}>
          {error}
        </p>
      )}
    </div>
  );
}