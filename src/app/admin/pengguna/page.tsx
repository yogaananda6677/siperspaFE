"use client";

import { useEffect, useMemo, useState } from "react";
import {
  type Pengguna,
  getUsers,
  createUser,
  updateUser,
  deleteUser,
} from "@/lib/api";

type RoleType = "admin" | "pelanggan";
type RoleFilter = "semua" | RoleType;

type FormData = {
  name: string;
  username: string;
  email: string;
  role: RoleType;
  password: string;
  password_confirmation: string;
};

const EMPTY_FORM: FormData = {
  name: "",
  username: "",
  email: "",
  role: "pelanggan",
  password: "password123",
  password_confirmation: "password123",
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

const roleBadgeStyle = (role: RoleType): React.CSSProperties => {
  const isAdmin = role === "admin";

  return {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    padding: "4px 12px",
    borderRadius: 8,
    background: isAdmin ? "rgba(245,158,11,0.15)" : "rgba(59,130,246,0.15)",
    border: isAdmin
      ? "1px solid rgba(245,158,11,0.25)"
      : "1px solid rgba(59,130,246,0.25)",
    fontSize: 12,
    fontWeight: 600,
    color: isAdmin ? "#fbbf24" : "#93c5fd",
  };
};

const roleDotStyle = (role: RoleType): React.CSSProperties => ({
  width: 5,
  height: 5,
  borderRadius: "50%",
  background: role === "admin" ? "#f59e0b" : "#60a5fa",
});

export default function KelolaPenggunaPage() {
  const [data, setData] = useState<Pengguna[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("semua");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<Pengguna | null>(null);

  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const [errors, setErrors] = useState<Partial<FormData>>({});
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    void fetchAll();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, roleFilter, sortOrder, itemsPerPage]);

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchAll = async () => {
    setLoading(true);
    try {
      const res = await getUsers({ all: true });
      setData(res.data ?? []);
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Gagal memuat data pengguna", "error");
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
      else if (form.password.length < 8) newErrors.password = "Password minimal 8 karakter";

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

  const openEdit = (user: Pengguna) => {
    setSelectedUser(user);
    setForm({
      name: user.name,
      username: user.username,
      email: user.email,
      role: (user.role as RoleType) ?? "pelanggan",
      password: "",
      password_confirmation: "",
    });
    setErrors({});
    setShowEditModal(true);
  };

  const openDelete = (user: Pengguna) => {
    setSelectedUser(user);
    setShowDeleteModal(true);
  };

  const handleAdd = async () => {
    if (!validateForm(false)) return;

    setSubmitting(true);
    try {
      const created = await createUser(form);
      setData((prev) => [created, ...prev]);
      showToast("Pengguna berhasil ditambahkan");
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
    if (!selectedUser) return;
    if (!validateForm(true)) return;

    setSubmitting(true);
    try {
      const payload: Partial<FormData> = {
        name: form.name,
        username: form.username,
        email: form.email,
        role: form.role,
      };

      if (form.password) {
        payload.password = form.password;
        payload.password_confirmation = form.password_confirmation;
      }

      const updated = await updateUser(selectedUser.id_user, payload);

      setData((prev) =>
        prev.map((item) => (item.id_user === selectedUser.id_user ? updated : item))
      );

      showToast("Pengguna berhasil diupdate");
      setShowEditModal(false);
      setSelectedUser(null);
      setErrors({});
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Terjadi kesalahan", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedUser) return;

    setDeleting(true);
    try {
      await deleteUser(selectedUser.id_user, selectedUser.role);
      setData((prev) => prev.filter((item) => item.id_user !== selectedUser.id_user));
      showToast("Pengguna berhasil dihapus");
      setShowDeleteModal(false);
      setSelectedUser(null);
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Gagal menghapus", "error");
    } finally {
      setDeleting(false);
    }
  };

  const filteredData = useMemo(() => {
    return [...data]
      .filter((item) => {
        const keyword = search.toLowerCase();
        const role = (item.role as RoleType) ?? "pelanggan";

        const matchKeyword =
          !keyword ||
          item.name.toLowerCase().includes(keyword) ||
          item.username.toLowerCase().includes(keyword) ||
          item.email.toLowerCase().includes(keyword);

        const matchRole = roleFilter === "semua" || role === roleFilter;

        return matchKeyword && matchRole;
      })
      .sort((a, b) => {
        const cmp = a.name.localeCompare(b.name, "id", { sensitivity: "base" });
        return sortOrder === "asc" ? cmp : -cmp;
      });
  }, [data, search, roleFilter, sortOrder]);

  const totalPages = Math.max(1, Math.ceil(filteredData.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedData = filteredData.slice(startIndex, endIndex);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  const stats = {
    total: data.length,
    admin: data.filter((item) => item.role === "admin").length,
    pelanggan: data.filter((item) => item.role === "pelanggan").length,
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
            Kelola Pengguna
          </h1>
          <p
            style={{
              margin: "4px 0 0",
              fontSize: 13,
              color: "#9b8ec4",
            }}
          >
            Manajemen akun admin dan pelanggan
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
          }}
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
          Tambah Pengguna
        </button>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 14,
          marginBottom: 24,
        }}
      >
        {[
          {
            label: "Total Pengguna",
            value: stats.total,
            color: "#9f6ef5",
            bg: "rgba(159,110,245,0.08)",
            border: "rgba(159,110,245,0.2)",
          },
          {
            label: "Admin",
            value: stats.admin,
            color: "#fbbf24",
            bg: "rgba(245,158,11,0.08)",
            border: "rgba(245,158,11,0.2)",
          },
          {
            label: "Pelanggan",
            value: stats.pelanggan,
            color: "#60a5fa",
            bg: "rgba(59,130,246,0.08)",
            border: "rgba(59,130,246,0.2)",
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
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value as RoleFilter)}
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
            Semua Role
          </option>
          <option value="admin" style={{ background: "#1e1040" }}>
            Admin
          </option>
          <option value="pelanggan" style={{ background: "#1e1040" }}>
            Pelanggan
          </option>
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
              {search || roleFilter !== "semua"
                ? "Tidak ada pengguna ditemukan"
                : "Belum ada pengguna"}
            </p>
            <p style={{ margin: "4px 0 0", fontSize: 13, color: "#9b8ec4" }}>
              {search || roleFilter !== "semua"
                ? "Coba ubah filter atau kata kunci pencarian."
                : 'Klik "Tambah Pengguna" untuk mulai menambahkan.'}
            </p>
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(159,110,245,0.15)" }}>
                {["No", "Pengguna", "Email", "Role", "Bergabung", "Aksi"].map((h) => (
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
              {paginatedData.map((item, i) => (
                <tr
                  key={item.id_user}
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
                          background: avatarColor(item.id_user),
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 12,
                          fontWeight: 700,
                          color: "white",
                          flexShrink: 0,
                        }}
                      >
                        {initials(item.name)}
                      </div>
                      <div>
                        <div
                          style={{
                            fontSize: 13.5,
                            fontWeight: 600,
                            color: "#f0eaff",
                          }}
                        >
                          {item.name}
                        </div>
                        <div style={{ fontSize: 11.5, color: "#9b8ec4" }}>
                          @{item.username}
                        </div>
                      </div>
                    </div>
                  </td>

                  <td style={{ padding: "16px 20px", color: "#c4b5fd", fontSize: 13 }}>
                    {item.email}
                  </td>

                  <td style={{ padding: "16px 20px" }}>
                    <span style={roleBadgeStyle(item.role)}>
                      <span style={roleDotStyle(item.role)} />
                      {item.role === "admin" ? "Admin" : "Pelanggan"}
                    </span>
                  </td>

                  <td style={{ padding: "16px 20px", color: "#9b8ec4", fontSize: 13 }}>
                    {formatDate(item.created_at)}
                  </td>

                  <td style={{ padding: "16px 20px" }}>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button
                        onClick={() => openEdit(item)}
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
                        }}
                      >
                        Edit
                      </button>

                      <button
                        onClick={() => openDelete(item)}
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
                        }}
                      >
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
                  currentPage === 1 ? "rgba(255,255,255,0.03)" : "transparent",
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
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
              style={{
                padding: "8px 12px",
                borderRadius: 10,
                border: "1px solid rgba(159,110,245,0.25)",
                background:
                  currentPage === totalPages ? "rgba(255,255,255,0.03)" : "transparent",
                color: currentPage === totalPages ? "#666" : "#c9aff5",
                cursor: currentPage === totalPages ? "not-allowed" : "pointer",
              }}
            >
              Next
            </button>
          </div>
        </div>
      )}

      {showAddModal && (
        <ModalWrapper onClose={() => setShowAddModal(false)}>
          <h2 style={modalTitleStyle}>Tambah Pengguna Baru</h2>

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
              placeholder="contoh: admin_baru"
            />
            <InputField
              label="Email"
              value={form.email}
              onChange={(v) => setForm({ ...form, email: v })}
              error={errors.email}
              placeholder="user@example.com"
              type="email"
            />
          </div>

          <SelectField
            label="Role"
            value={form.role}
            onChange={(v) => setForm({ ...form, role: v as RoleType })}
            error={errors.role}
            options={[
              { label: "Admin", value: "admin" },
              { label: "Pelanggan", value: "pelanggan" },
            ]}
          />

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 14px" }}>
            <InputField
              label="Password"
              value={form.password}
              onChange={(v) => setForm({ ...form, password: v })}
              error={errors.password}
              placeholder="Masukkan password"
              type="password"
            />
            <InputField
              label="Konfirmasi Password"
              value={form.password_confirmation}
              onChange={(v) => setForm({ ...form, password_confirmation: v })}
              error={errors.password_confirmation}
              placeholder="Ulangi password"
              type="password"
            />
          </div>

          <ModalActions
            onCancel={() => setShowAddModal(false)}
            onSubmit={handleAdd}
            submitting={submitting}
            cancelLabel="Batal"
            submitLabel="Simpan Pengguna"
          />
        </ModalWrapper>
      )}

      {showEditModal && selectedUser && (
        <ModalWrapper onClose={() => setShowEditModal(false)}>
          <h2 style={modalTitleStyle}>Edit Pengguna</h2>

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
              placeholder="contoh: admin_baru"
            />
            <InputField
              label="Email"
              value={form.email}
              onChange={(v) => setForm({ ...form, email: v })}
              error={errors.email}
              placeholder="user@example.com"
              type="email"
            />
          </div>

          <SelectField
            label="Role"
            value={form.role}
            onChange={(v) => setForm({ ...form, role: v as RoleType })}
            error={errors.role}
            options={[
              { label: "Admin", value: "admin" },
              { label: "Pelanggan", value: "pelanggan" },
            ]}
          />

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
              onChange={(v) => setForm({ ...form, password_confirmation: v })}
              error={errors.password_confirmation}
              placeholder="Konfirmasi password"
              type="password"
            />
          </div>

          <ModalActions
            onCancel={() => setShowEditModal(false)}
            onSubmit={handleEdit}
            submitting={submitting}
            cancelLabel="Batal"
            submitLabel="Update Pengguna"
          />
        </ModalWrapper>
      )}

      {showDeleteModal && selectedUser && (
        <ModalWrapper onClose={() => !deleting && setShowDeleteModal(false)} width={340}>
          <h2 style={modalTitleStyle}>Hapus Pengguna?</h2>
          <p style={{ margin: "0 0 24px", fontSize: 13.5, color: "#9b8ec4", lineHeight: 1.6 }}>
            Akun <strong style={{ color: "#f0eaff" }}>{selectedUser.name}</strong> akan dihapus
            permanen dan tidak bisa dikembalikan.
          </p>

          <div style={{ display: "flex", gap: 10 }}>
            <button
              onClick={() => setShowDeleteModal(false)}
              disabled={deleting}
              style={secondaryButtonStyle}
            >
              Batal
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              style={{
                ...dangerButtonStyle,
                cursor: deleting ? "not-allowed" : "pointer",
                opacity: deleting ? 0.6 : 1,
              }}
            >
              {deleting ? "Menghapus..." : "Ya, Hapus"}
            </button>
          </div>
        </ModalWrapper>
      )}
    </div>
  );
}

function ModalWrapper({
  children,
  onClose,
  width = 460,
}: {
  children: React.ReactNode;
  onClose: () => void;
  width?: number;
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
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#1e1040",
          border: "1px solid rgba(159,110,245,0.25)",
          borderRadius: 20,
          padding: "28px",
          width,
          boxShadow: "0 24px 60px rgba(0,0,0,0.5)",
        }}
      >
        {children}
      </div>
    </div>
  );
}

function ModalActions({
  onCancel,
  onSubmit,
  submitting,
  cancelLabel,
  submitLabel,
}: {
  onCancel: () => void;
  onSubmit: () => void;
  submitting: boolean;
  cancelLabel: string;
  submitLabel: string;
}) {
  return (
    <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
      <button onClick={onCancel} style={secondaryButtonStyle}>
        {cancelLabel}
      </button>
      <button
        onClick={onSubmit}
        disabled={submitting}
        style={{
          ...primaryButtonStyle,
          cursor: submitting ? "not-allowed" : "pointer",
          opacity: submitting ? 0.6 : 1,
        }}
      >
        {submitting ? "Menyimpan..." : submitLabel}
      </button>
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
        }}
      />
      {error && (
        <p style={{ margin: "4px 0 0", fontSize: 11.5, color: "#f87171" }}>{error}</p>
      )}
    </div>
  );
}

function SelectField({
  label,
  value,
  onChange,
  error,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  options: { label: string; value: string }[];
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
      <select
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
        }}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} style={{ background: "#1e1040" }}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && (
        <p style={{ margin: "4px 0 0", fontSize: 11.5, color: "#f87171" }}>{error}</p>
      )}
    </div>
  );
}

const modalTitleStyle: React.CSSProperties = {
  margin: "0 0 20px",
  fontSize: 16,
  fontWeight: 700,
  color: "#f0eaff",
};

const primaryButtonStyle: React.CSSProperties = {
  flex: 1,
  padding: "11px 0",
  borderRadius: 10,
  background: "linear-gradient(135deg, #5b2faa, #9f6ef5)",
  border: "none",
  color: "white",
  fontSize: 13.5,
  fontWeight: 600,
};

const secondaryButtonStyle: React.CSSProperties = {
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

const dangerButtonStyle: React.CSSProperties = {
  flex: 1,
  padding: "10px 0",
  borderRadius: 10,
  border: "1px solid rgba(248,113,113,0.3)",
  background: "rgba(248,113,113,0.15)",
  color: "#f87171",
  fontSize: 13.5,
  fontWeight: 600,
};