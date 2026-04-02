"use client";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";

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
    label: "Konsol",
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
    label: "Transaksi",
    href: "/admin/transaksi",
    icon: (
      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" strokeLinecap="round" />
        <rect x="9" y="3" width="6" height="4" rx="1" />
        <path d="M9 12h6M9 16h4" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    label: "User",
    href: "/admin/user",
    icon: (
      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <circle cx="9" cy="7" r="3" />
        <path d="M3 21v-1a6 6 0 0112 0v1" strokeLinecap="round" />
        <path d="M16 11a3 3 0 010 6M19 11.5a5.5 5.5 0 010 5" strokeLinecap="round" />
      </svg>
    ),
  },
];

export default function AdminSidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("user");
    const token = localStorage.getItem("token");
    if (!stored || !token) { router.push("/login"); return; }
    const u = JSON.parse(stored);
    if (u.role !== "admin") { router.push("/dashboard"); return; }
    setUser(u);
  }, []);

  const handleLogout = async () => {
    const token = localStorage.getItem("token");
    await fetch("http://127.0.0.1:8000/api/logout", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
    });
    localStorage.clear();
    router.push("/login");
  };

  const initials = user?.name
    ?.split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <>
      <style>{`
        :root {
          --ps-purple-950: #0f0b1f;
          --ps-purple-900: #160d2e;
          --ps-purple-800: #1e1040;
          --ps-purple-700: #2a1558;
          --ps-purple-600: #3d1f80;
          --ps-purple-500: #5b2faa;
          --ps-purple-400: #7c4fd4;
          --ps-purple-300: #a47de8;
          --ps-purple-200: #c9aff5;
          --ps-purple-100: #ede5ff;
          --ps-accent: #9f6ef5;
          --ps-accent-glow: rgba(159,110,245,0.15);
          --ps-text: #f0eaff;
          --ps-text-muted: #9b8ec4;
          --ps-border: rgba(159,110,245,0.15);
          --ps-border-hover: rgba(159,110,245,0.35);
        }
        .ps-sidebar {
          width: ${collapsed ? "68px" : "230px"};
          transition: width 0.25s cubic-bezier(.4,0,.2,1);
          overflow: hidden;
          background: var(--ps-purple-900);
          border-right: 1px solid var(--ps-border);
          display: flex;
          flex-direction: column;
          height: 100vh;
          position: fixed;
          left: 0;
          top: 0;
          z-index: 40;
        }
        .ps-nav-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 12px;
          border-radius: 10px;
          color: var(--ps-text-muted);
          font-size: 13.5px;
          font-weight: 500;
          text-decoration: none;
          transition: all 0.15s ease;
          white-space: nowrap;
          cursor: pointer;
          border: 1px solid transparent;
        }
        .ps-nav-item:hover {
          background: var(--ps-accent-glow);
          color: var(--ps-text);
          border-color: var(--ps-border);
        }
        .ps-nav-item.active {
          background: var(--ps-accent-glow);
          color: var(--ps-accent);
          border-color: var(--ps-border-hover);
        }
        .ps-nav-item.active svg {
          color: var(--ps-accent);
        }
        .ps-icon-wrap {
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          border-radius: 8px;
        }
        .ps-nav-item.active .ps-icon-wrap {
          background: rgba(159,110,245,0.2);
        }
        .ps-label {
          opacity: ${collapsed ? 0 : 1};
          transition: opacity 0.15s ease;
          overflow: hidden;
        }
        .ps-divider {
          height: 1px;
          background: var(--ps-border);
          margin: 8px 16px;
        }
        .ps-section-label {
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--ps-text-muted);
          padding: 0 14px;
          margin: 12px 0 4px;
          opacity: ${collapsed ? 0 : 1};
          transition: opacity 0.15s;
          white-space: nowrap;
        }
        .ps-avatar {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          background: linear-gradient(135deg, var(--ps-purple-600), var(--ps-purple-400));
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: 700;
          color: white;
          flex-shrink: 0;
        }
        .ps-logout-btn {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 12px;
          border-radius: 10px;
          color: var(--ps-text-muted);
          font-size: 13px;
          font-weight: 500;
          background: none;
          border: 1px solid transparent;
          cursor: pointer;
          width: 100%;
          transition: all 0.15s;
          white-space: nowrap;
        }
        .ps-logout-btn:hover {
          color: #f87171;
          background: rgba(248,113,113,0.08);
          border-color: rgba(248,113,113,0.2);
        }
        .ps-toggle-btn {
          background: none;
          border: none;
          cursor: pointer;
          color: var(--ps-text-muted);
          padding: 4px;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.15s;
        }
        .ps-toggle-btn:hover { color: var(--ps-text); background: var(--ps-accent-glow); }
        .ps-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #4ade80;
          flex-shrink: 0;
          margin-left: auto;
        }
      `}</style>

      <aside className="ps-sidebar">
        {/* Logo */}
        <div style={{
          padding: "16px 14px",
          borderBottom: "1px solid var(--ps-border)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 10,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, overflow: "hidden" }}>
            <div style={{
              width: 34,
              height: 34,
              borderRadius: 10,
              background: "linear-gradient(135deg, #5b2faa, #9f6ef5)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}>
              <svg width="18" height="18" fill="none" stroke="white" strokeWidth="1.8" viewBox="0 0 24 24">
                <rect x="2" y="6" width="20" height="12" rx="3" />
                <path d="M8 12h4M10 10v4" strokeLinecap="round" />
                <circle cx="16" cy="11" r="1" fill="white" stroke="none" />
                <circle cx="16" cy="13" r="1" fill="white" stroke="none" />
              </svg>
            </div>
            <div className="ps-label" style={{ overflow: "hidden" }}>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "var(--ps-text)", lineHeight: 1.2 }}>PS Rental</p>
              <p style={{ margin: 0, fontSize: 11, color: "var(--ps-text-muted)" }}>Admin Panel</p>
            </div>
          </div>
          <button className="ps-toggle-btn" onClick={() => setCollapsed(!collapsed)}>
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              {collapsed
                ? <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
                : <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />}
            </svg>
          </button>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: "8px 10px", overflowY: "auto", overflowX: "hidden" }}>
          <p className="ps-section-label">Menu</p>
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <a
                key={item.href}
                href={item.href}
                className={`ps-nav-item${isActive ? " active" : ""}`}
              >
                <span className="ps-icon-wrap">{item.icon}</span>
                <span className="ps-label">{item.label}</span>
                {isActive && !collapsed && <span className="ps-dot" />}
              </a>
            );
          })}
        </nav>

        {/* User + Logout */}
        <div style={{
          padding: "10px",
          borderTop: "1px solid var(--ps-border)",
        }}>
          {!collapsed && user && (
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "8px 12px",
              marginBottom: 6,
              borderRadius: 10,
              background: "var(--ps-accent-glow)",
              border: "1px solid var(--ps-border)",
            }}>
              <div className="ps-avatar">{initials}</div>
              <div style={{ overflow: "hidden", flex: 1 }}>
                <p style={{ margin: 0, fontSize: 12.5, fontWeight: 600, color: "var(--ps-text)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {user.name}
                </p>
                <p style={{ margin: 0, fontSize: 11, color: "var(--ps-text-muted)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {user.email}
                </p>
              </div>
            </div>
          )}
          <button className="ps-logout-btn" onClick={handleLogout}>
            <span style={{ width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                <path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h6a2 2 0 012 2v1" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            <span className="ps-label">Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}