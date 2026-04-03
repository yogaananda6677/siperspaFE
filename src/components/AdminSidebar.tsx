"use client";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
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
        <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    label: "Kelola PS",
    href: "/admin/konsol",
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
    label: "Kelola Makanan",
    href: "/admin/makanan",
    icon: (
      <IconFood />
    ),
  },
  {
    label: "Kelola Tipe PS",
    href: "/admin/tipe-ps",
    icon: (
      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path d="M3 11l19-9-9 19-2-8-8-2z" strokeLinecap="round" strokeLinejoin="round" />
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

        /* Container untuk teks logo agar transisi halus */
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

        .ps-nav-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px;
          margin: 4px 8px;
          border-radius: 12px;
          color: var(--ps-text-muted);
          text-decoration: none;
          transition: all 0.2s;
          white-space: nowrap;
        }

        .ps-nav-item:hover, .ps-nav-item.active {
          background: var(--ps-accent-glow);
          color: var(--ps-text);
        }

        .ps-nav-item.active {
          color: var(--ps-accent);
          box-shadow: inset 0 0 0 1px var(--ps-border);
        }

        .ps-label {
          font-size: 14px;
          font-weight: 500;
          transition: opacity 0.2s ease, transform 0.2s ease;
          opacity: ${collapsed ? 0 : 1};
          transform: translateX(${collapsed ? "-10px" : "0"});
          pointer-events: ${collapsed ? "none" : "auto"};
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
          font-weight: bold; color: white;
          flex-shrink: 0;
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
          {/* Header Logo dengan Transisi Halus */}
          <div style={{ padding: "20px 16px", display: "flex", alignItems: "center", gap: "12px", overflow: "hidden" }}>
            <div className="ps-avatar">PS</div>
            <div className="ps-logo-content">
              <p style={{ margin: 0, fontWeight: 700, color: "var(--ps-text)", fontSize: "14px" }}>Admin Center</p>
              <p style={{ margin: 0, fontSize: "11px", color: "var(--ps-text-muted)" }}>Management System</p>
            </div>
          </div>

          <nav style={{ flex: 1, marginTop: "10px" }}>
            {navItems.map((item) => (
              <a 
                key={item.href} 
                href={item.href} 
                className={`ps-nav-item ${pathname === item.href ? "active" : ""}`}
              >
                <span className="ps-icon-wrap">{item.icon}</span>
                <span className="ps-label">{item.label}</span>
              </a>
            ))}
          </nav>

          <div style={{ padding: "16px", borderTop: "1px solid var(--ps-border)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px", overflow: "hidden" }}>
              <div className="ps-avatar" style={{ width: 32, height: 32, fontSize: 12 }}>{initials}</div>
              <div className="ps-logo-content" style={{ flex: 1 }}>
                  <p style={{ margin: 0, fontSize: 13, color: "var(--ps-text)", fontWeight: 600, textOverflow: "ellipsis", overflow: "hidden" }}>
                    {user?.name || "Admin"}
                  </p>
              </div>
            </div>
            <button 
              className="ps-nav-item" 
              onClick={() => setShowLogoutModal(true)}
              style={{ background: "none", border: "none", cursor: "pointer", width: "100%", margin: 0, padding: "8px" }}
            >
              <span className="ps-icon-wrap">
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h6a2 2 0 012 2v1" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              <span className="ps-label">Keluar</span>
            </button>
          </div>
        </div>
      </aside>

      {showLogoutModal && (
        <div style={{ 
          position: "fixed", inset: 0, zIndex: 100, 
          display: "flex", alignItems: "center", justifyContent: "center",
          background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)"
        }}>
          <div style={{ background: "#1e1040", padding: 24, borderRadius: 16, width: 300, textAlign: "center", border: "1px solid var(--ps-border)" }}>
            <h3 style={{ color: "white", marginBottom: 8 }}>Konfirmasi</h3>
            <p style={{ color: "var(--ps-text-muted)", fontSize: 14, marginBottom: 20 }}>Yakin ingin keluar dari sistem?</p>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setShowLogoutModal(false)} disabled={loggingOut} style={{ flex: 1, padding: "8px", borderRadius: 8, cursor: "pointer" }}>Batal</button>
              <button onClick={handleLogout} disabled={loggingOut} style={{ flex: 1, padding: "8px", borderRadius: 8, background: "#ef4444", color: "white", border: "none", cursor: "pointer" }}>
                {loggingOut ? "..." : "Logout"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}