"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<{ name: string; email: string; role: string } | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const stored = localStorage.getItem("user");
    if (!token || !stored) { router.push("/login"); return; }
    const u = JSON.parse(stored);
    if (u.role !== "admin") { router.push("/dashboard"); return; }
    setUser(u);
  }, []);

  if (!user) return null;

  return (
    <div style={{ padding: "32px 40px" }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: "#f0eaff" }}>Dashboard</h1>
        <p style={{ margin: "4px 0 0", fontSize: 13, color: "#9b8ec4" }}>
          {new Date().toLocaleDateString("id-ID", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
        </p>
      </div>

      {/* Welcome card */}
      <div style={{
        borderRadius: 16,
        border: "1px solid rgba(159,110,245,0.25)",
        background: "rgba(159,110,245,0.08)",
        padding: "28px 32px",
        display: "flex",
        alignItems: "center",
        gap: 20,
        maxWidth: 520,
      }}>
        <div style={{
          width: 52,
          height: 52,
          borderRadius: 14,
          background: "linear-gradient(135deg, #5b2faa, #9f6ef5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 24,
          flexShrink: 0,
        }}>
          🎮
        </div>
        <div>
          <p style={{ margin: 0, fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "#9b8ec4" }}>
            Selamat datang
          </p>
          <p style={{ margin: "4px 0 2px", fontSize: 18, fontWeight: 700, color: "#f0eaff" }}>{user.name}</p>
          <span style={{
            display: "inline-block",
            padding: "2px 10px",
            borderRadius: 6,
            background: "rgba(159,110,245,0.15)",
            border: "1px solid rgba(159,110,245,0.3)",
            fontSize: 11,
            fontWeight: 600,
            color: "#a47de8",
            textTransform: "capitalize",
          }}>
            {user.role}
          </span>
        </div>
      </div>

      {/* Status */}
      <div style={{
        marginTop: 20,
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        padding: "10px 16px",
        borderRadius: 10,
        background: "rgba(74,222,128,0.08)",
        border: "1px solid rgba(74,222,128,0.2)",
      }}>
        <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#4ade80", display: "inline-block" }} />
        <span style={{ fontSize: 13, color: "#4ade80", fontWeight: 500 }}>
          Middleware aktif — kamu berhasil masuk sebagai admin
        </span>
      </div>
    </div>
  );
}