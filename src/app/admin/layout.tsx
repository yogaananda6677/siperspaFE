"use client";

import { useState } from "react";
import AdminSidebar from "@/components/AdminSidebar";
import AdminBookingNotificationProvider from "@/components/admin/AdminBookingNotificationProvider";
import AdminCashNotificationProvider from "@/components/admin/AdminCashNotificationProvider";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const sidebarWidth = isCollapsed ? "72px" : "240px";

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#0f0b1f" }}>
      <AdminBookingNotificationProvider />
      <AdminCashNotificationProvider />

      <AdminSidebar collapsed={isCollapsed} setCollapsed={setIsCollapsed} />

      <main
        style={{
          flex: 1,
          marginLeft: sidebarWidth,
          minHeight: "100vh",
          transition: "margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          padding: "24px",
        }}
      >
        {children}
      </main>
    </div>
  );
}