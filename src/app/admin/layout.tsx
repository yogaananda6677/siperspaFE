"use client";
import { useState } from "react";
import AdminSidebar from "@/components/AdminSidebar";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  // Pindahkan state ke sini agar Layout bisa "mendengar" perubahan sidebar
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Gunakan variabel untuk konsistensi ukuran
  const sidebarWidth = isCollapsed ? "72px" : "240px";

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#0f0b1f" }}>
      {/* Kirim state dan fungsi pengubahnya ke Sidebar */}
      <AdminSidebar collapsed={isCollapsed} setCollapsed={setIsCollapsed} />
      
      <main
        style={{
          flex: 1,
          // Margin sekarang mengikuti lebar sidebar secara dinamis
          marginLeft: sidebarWidth,
          minHeight: "100vh",
          // Transisi harus identik dengan sidebar (0.3s cubic-bezier)
          transition: "margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          padding: "24px",
        }}
      >
        {children}
      </main>
    </div>
  );
}