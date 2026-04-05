import { primaryBtnStyle } from "../lib/styles";

export function MonitoringHeader({
  refreshing,
  onRefresh,
}: {
  refreshing: boolean;
  onRefresh: () => void;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "space-between",
        marginBottom: 24,
        gap: 16,
        flexWrap: "wrap",
      }}
    >
      <div>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: "#f0eaff" }}>
          Monitoring PlayStation
        </h1>
        <p style={{ margin: "4px 0 0", fontSize: 13, color: "#9b8ec4" }}>
          Pantau status unit PS dan operasikan transaksi langsung dari monitoring
        </p>
      </div>

      <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
        {refreshing && <span style={{ fontSize: 12, color: "#9b8ec4" }}>Sinkronisasi data...</span>}
        <button onClick={onRefresh} style={primaryBtnStyle}>
          Refresh
        </button>
      </div>
    </div>
  );
}
