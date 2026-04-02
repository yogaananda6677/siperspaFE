import AdminSidebar from "@/components/AdminSidebar";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#0f0b1f" }}>
      <AdminSidebar />
      <main
        style={{
          flex: 1,
          marginLeft: 230,
          minHeight: "100vh",
          transition: "margin-left 0.25s cubic-bezier(.4,0,.2,1)",
        }}
      >
        {children}
      </main>
    </div>
  );
}