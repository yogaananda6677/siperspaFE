"use client";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { logout } from "@/lib/api";
import IconFood from "@/components/icons/iconFood";

type User = {
  name: string;
  email: string;
  role: string;
};

const navItems = [
  {
    label: "Dashboard",
    href: "/admin/dashboard",
    icon: (
      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <rect x="3" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" />
      </svg>
    ),
  },
  {
    label: "Monitoring",
    href: "/admin/monitoring",
    icon: (
      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    label: "Kelola PS",
    href: "/admin/playstation",
    icon: (
      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <rect x="2" y="6" width="20" height="12" rx="3" />
        <path d="M8 12h4M10 10v4" strokeLinecap="round" />
        <circle cx="16" cy="11" r="1" fill="currentColor" stroke="none" />
        <circle cx="16" cy="13" r="1" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
  {
    label: "Kelola Produk",
    href: "/admin/produk",
    icon: <IconFood />,
  },
  {
    label: "Kelola Tipe PS",
    href: "/admin/tipe-ps",
    icon: (
      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path d="M4 6h16M4 12h10M4 18h7" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="18" cy="17" r="3" />
        <path d="M18 15v2l1 1" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    label: "Kelola Admin",
    href: "/admin/kelola-admin",
    icon: (
      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <circle cx="12" cy="8" r="4" />
        <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" strokeLinecap="round" />
        <path d="M19 3v4M17 5h4" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    label: "Kelola Pelanggan",
    href: "/admin/pelanggan",
    icon: (
      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <circle cx="9" cy="7" r="4" />
        <path d="M2 21c0-4 3.1-7 7-7s7 3 7 7" strokeLinecap="round" />
        <circle cx="17" cy="9" r="3" />
        <path d="M20.5 20.5c0-2-1.6-3.5-3.5-3.5" strokeLinecap="round" />
      </svg>
    ),
  },
];

interface AdminSidebarProps {
  collapsed: boolean;
  setCollapsed: (val: boolean) => void;
}

export default function AdminSidebar({ collapsed, setCollapsed }: AdminSidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("user");
    const token = localStorage.getItem("token");
    if (!stored || !token) { router.push("/login"); return; }
    try {
      const u = JSON.parse(stored);
      if (u.role !== "admin") { router.push("/dashboard"); return; }
      setUser(u);
    } catch (e) {
      router.push("/login");
    }
  }, [router]);

  const handleLogout = async () => {
    setLoggingOut(true);
    await logout();
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    router.push("/login");
  };

  const initials = user?.name
    ?.split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase() || "AD";

  return (
    <>
      <style>{`
        :root {
          --ps-purple-900: #160d2e;
          --ps-accent: #9f6ef5;
          --ps-accent-glow: rgba(159,110,245,0.12);
          --ps-text: #f0eaff;
          --ps-text-muted: #9b8ec4;
          --ps-border: rgba(159,110,245,0.15);
          --ps-border-hover: rgba(159,110,245,0.35);
        }

        .ps-sidebar {
          width: ${collapsed ? "72px" : "240px"};
          transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          background: var(--ps-purple-900);
          border-right: 1px solid var(--ps-border);
          display: flex;
          flex-direction: column;
          height: 100vh;
          position: fixed;
          left: 0; top: 0;
          z-index: 50;
          overflow: visible;
        }

        .ps-sidebar-inner {
          display: flex;
          flex-direction: column;
          height: 100%;
          width: 100%;
          overflow-x: hidden;
          overflow-y: auto;
          scrollbar-width: thin;
          scrollbar-color: var(--ps-border) transparent;
        }

        .ps-sidebar-inner::-webkit-scrollbar {
          width: 4px;
        }
        .ps-sidebar-inner::-webkit-scrollbar-thumb {
          background: var(--ps-border);
          border-radius: 4px;
        }

        .ps-toggle-btn {
          position: absolute;
          top: 24px;
          right: -14px;
          width: 28px;
          height: 28px;
          background: #2a1b4d;
          border: 1px solid var(--ps-border-hover);
          border-radius: 50%;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--ps-accent);
          box-shadow: 0 4px 10px rgba(0,0,0,0.3);
          z-index: 60;
          transition: all 0.2s ease;
        }

        .ps-toggle-btn:hover {
          background: var(--ps-accent);
          color: white;
          transform: scale(1.1);
        }

        .ps-logo-content {
          display: flex;
          flex-direction: column;
          transition: opacity 0.25s ease, transform 0.3s ease;
          opacity: ${collapsed ? 0 : 1};
          transform: translateX(${collapsed ? "-10px" : "0"});
          pointer-events: ${collapsed ? "none" : "auto"};
          white-space: nowrap;
          overflow: hidden;
        }

        .ps-section-label {
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--ps-text-muted);
          padding: 12px 20px 4px;
          transition: opacity 0.2s ease;
          opacity: ${collapsed ? 0 : 1};
          white-space: nowrap;
          overflow: hidden;
          pointer-events: none;
        }

        .ps-nav-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 12px;
          margin: 2px 8px;
          border-radius: 10px;
          color: var(--ps-text-muted);
          text-decoration: none;
          transition: all 0.2s;
          white-space: nowrap;
          cursor: pointer;
        }

        .ps-nav-item:hover {
          background: var(--ps-accent-glow);
          color: var(--ps-text);
        }

        .ps-nav-item.active {
          background: var(--ps-accent-glow);
          color: var(--ps-accent);
          box-shadow: inset 0 0 0 1px var(--ps-border);
        }

        .ps-nav-item.danger:hover {
          background: rgba(239,68,68,0.1);
          color: #f87171;
        }

        .ps-label {
          font-size: 13.5px;
          font-weight: 500;
          transition: opacity 0.2s ease, transform 0.2s ease;
          opacity: ${collapsed ? 0 : 1};
          transform: translateX(${collapsed ? "-10px" : "0"});
          pointer-events: ${collapsed ? "none" : "auto"};
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .ps-icon-wrap {
          width: 24px;
          display: flex;
          justify-content: center;
          flex-shrink: 0;
        }

        .ps-avatar {
          width: 36px; height: 36px;
          border-radius: 10px;
          background: linear-gradient(135deg, #6366f1, #a855f7);
          display: flex; align-items: center; justify-content: center;
          font-size: 13px;
          font-weight: bold; color: white;
          flex-shrink: 0;
        }

        .ps-divider {
          height: 1px;
          background: var(--ps-border);
          margin: 8px 12px;
        }

        .ps-profile-btn {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px 10px;
          margin: 4px 8px;
          border-radius: 10px;
          cursor: pointer;
          text-decoration: none;
          transition: all 0.2s;
          overflow: hidden;
        }

        .ps-profile-btn:hover {
          background: var(--ps-accent-glow);
        }

        .ps-profile-btn:hover .ps-profile-edit-icon {
          opacity: 1;
          transform: translateX(0);
        }

        .ps-profile-edit-icon {
          margin-left: auto;
          color: var(--ps-accent);
          opacity: 0;
          transform: translateX(4px);
          transition: all 0.2s;
          flex-shrink: 0;
        }

        .ps-tooltip {
          position: absolute;
          left: calc(100% + 14px);
          top: 50%;
          transform: translateY(-50%);
          background: #2a1b4d;
          color: var(--ps-text);
          padding: 5px 10px;
          border-radius: 6px;
          font-size: 12px;
          white-space: nowrap;
          pointer-events: none;
          opacity: 0;
          transition: opacity 0.15s;
          border: 1px solid var(--ps-border-hover);
          z-index: 200;
        }

        .ps-nav-item:hover .ps-tooltip,
        .ps-profile-btn:hover .ps-tooltip {
          opacity: ${collapsed ? 1 : 0};
        }
      `}</style>

      <aside className="ps-sidebar">
        <button className="ps-toggle-btn" onClick={() => setCollapsed(!collapsed)}>
          <svg
            width="14" height="14"
            viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="3"
            style={{
              transform: collapsed ? "rotate(0deg)" : "rotate(180deg)",
              transition: "transform 0.3s"
            }}
          >
            <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        <div className="ps-sidebar-inner">
          {/* Header Logo */}
          <div style={{ padding: "20px 16px", display: "flex", alignItems: "center", gap: "12px", overflow: "hidden" }}>
            <div className="ps-avatar" style={{ background: "linear-gradient(135deg, #7c3aed, #6366f1)" }}>
              {/* Gamepad icon in avatar */}
              <svg width="18" height="18" fill="none" stroke="white" strokeWidth="1.8" viewBox="0 0 24 24">
                <rect x="2" y="7" width="20" height="10" rx="3" />
                <path d="M8 12h4M10 10v4" strokeLinecap="round" />
                <circle cx="16" cy="11.5" r="1" fill="white" stroke="none" />
                <circle cx="16" cy="13.5" r="1" fill="white" stroke="none" />
              </svg>
            </div>
            <div className="ps-logo-content">
              <p style={{ margin: 0, fontWeight: 700, color: "var(--ps-text)", fontSize: "14px" }}>Admin Center</p>
              <p style={{ margin: 0, fontSize: "11px", color: "var(--ps-text-muted)" }}>Management System</p>
            </div>
          </div>

          {/* Main Nav */}
          <div className="ps-section-label">Menu Utama</div>
          <nav>
            {navItems.slice(0, 2).map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`ps-nav-item ${pathname === item.href ? "active" : ""}`}
                style={{ position: "relative" }}
              >
                <span className="ps-icon-wrap">{item.icon}</span>
                <span className="ps-label">{item.label}</span>
                {collapsed && <span className="ps-tooltip">{item.label}</span>}
              </Link>
            ))}
          </nav>

          <div className="ps-divider" />

          {/* Kelola Nav */}
          <div className="ps-section-label">Manajemen</div>
          <nav>
            {navItems.slice(2).map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`ps-nav-item ${pathname === item.href ? "active" : ""}`}
                style={{ position: "relative" }}
              >
                <span className="ps-icon-wrap">{item.icon}</span>
                <span className="ps-label">{item.label}</span>
                {collapsed && <span className="ps-tooltip">{item.label}</span>}
              </Link>
            ))}
          </nav>

          {/* Spacer */}
          <div style={{ flex: 1 }} />

          {/* Footer: Profile + Logout */}
          <div style={{ padding: "12px 0", borderTop: "1px solid var(--ps-border)" }}>
            {/* Profile link → edit profil */}
            <Link
              href="/admin/profil"
              className="ps-profile-btn"
              style={{ position: "relative" }}
              title="Edit Profil"
            >
              <div className="ps-avatar" style={{ width: 32, height: 32, fontSize: 12, borderRadius: 8 }}>
                {initials}
              </div>
              <div
                className="ps-logo-content"
                style={{
                  flex: 1,
                  minWidth: 0,
                  opacity: collapsed ? 0 : 1,
                  transform: collapsed ? "translateX(-10px)" : "translateX(0)",
                }}
              >
                <p style={{ margin: 0, fontSize: 13, color: "var(--ps-text)", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {user?.name || "Admin"}
                </p>
                <p style={{ margin: 0, fontSize: 11, color: "var(--ps-text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {user?.email || ""}
                </p>
              </div>
              {/* Edit icon — only visible when expanded & hovered */}
              {!collapsed && (
                <span className="ps-profile-edit-icon">
                  <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
              )}
              {collapsed && <span className="ps-tooltip">Edit Profil</span>}
            </Link>

            {/* Logout */}
            <button
              className="ps-nav-item danger"
              onClick={() => setShowLogoutModal(true)}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                width: "calc(100% - 16px)",
                textAlign: "left",
                position: "relative",
              }}
            >
              <span className="ps-icon-wrap">
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                  <path d="M17 16l4-4m0 0l-4-4m4 4H7" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              <span className="ps-label">Keluar</span>
              {collapsed && <span className="ps-tooltip">Keluar</span>}
            </button>
          </div>
        </div>
      </aside>

      {/* Logout Modal */}
      {showLogoutModal && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 100,
          display: "flex", alignItems: "center", justifyContent: "center",
          background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)"
        }}>
          <div style={{
            background: "#1e1040",
            padding: 28,
            borderRadius: 16,
            width: 320,
            textAlign: "center",
            border: "1px solid var(--ps-border)",
            boxShadow: "0 20px 60px rgba(0,0,0,0.5)"
          }}>
            {/* Icon */}
            <div style={{
              width: 52, height: 52,
              borderRadius: 14,
              background: "rgba(239,68,68,0.12)",
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 16px"
            }}>
              <svg width="24" height="24" fill="none" stroke="#f87171" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M17 16l4-4m0 0l-4-4m4 4H7" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h3 style={{ color: "white", margin: "0 0 8px", fontSize: 16, fontWeight: 700 }}>Konfirmasi Keluar</h3>
            <p style={{ color: "var(--ps-text-muted)", fontSize: 13, marginBottom: 24, lineHeight: 1.5 }}>
              Yakin ingin keluar dari sistem? Sesi kamu akan diakhiri.
            </p>
            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={() => setShowLogoutModal(false)}
                disabled={loggingOut}
                style={{
                  flex: 1, padding: "9px",
                  borderRadius: 8, cursor: "pointer",
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid var(--ps-border)",
                  color: "var(--ps-text)",
                  fontSize: 13, fontWeight: 500,
                  transition: "all 0.2s"
                }}
              >
                Batal
              </button>
              <button
                onClick={handleLogout}
                disabled={loggingOut}
                style={{
                  flex: 1, padding: "9px",
                  borderRadius: 8,
                  background: loggingOut ? "#7f1d1d" : "#ef4444",
                  color: "white",
                  border: "none",
                  cursor: loggingOut ? "not-allowed" : "pointer",
                  fontSize: 13, fontWeight: 600,
                  transition: "all 0.2s",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 6
                }}
              >
                {loggingOut ? (
                  <>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ animation: "spin 1s linear infinite" }}>
                      <path d="M21 12a9 9 0 11-6.219-8.56" strokeLinecap="round" />
                    </svg>
                    Keluar...
                  </>
                ) : "Ya, Keluar"}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
}