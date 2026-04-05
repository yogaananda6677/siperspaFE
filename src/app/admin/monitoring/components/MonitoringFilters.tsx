import type { Dispatch, SetStateAction } from "react";
import type { FilterStatus } from "../lib/types";
import { inputStyle } from "../lib/styles";

export function MonitoringFilters({
  search,
  setSearch,
  filterStatus,
  setFilterStatus,
}: {
  search: string;
  setSearch: Dispatch<SetStateAction<string>>;
  filterStatus: FilterStatus;
  setFilterStatus: Dispatch<SetStateAction<FilterStatus>>;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: 10,
        marginBottom: 22,
        alignItems: "center",
      }}
    >
      <div style={{ position: "relative", flex: "1 1 220px", minWidth: 220 }}>
        <input
          type="text"
          placeholder="Cari nomor PS atau tipe..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={inputStyle}
        />
      </div>

      {(["semua", "tersedia", "digunakan", "maintenance"] as const).map((status) => (
        <button
          key={status}
          onClick={() => setFilterStatus(status)}
          style={{
            padding: "8px 14px",
            borderRadius: 10,
            fontSize: 13,
            fontWeight: 500,
            cursor: "pointer",
            border: "1px solid",
            background:
              filterStatus === status ? "rgba(159,110,245,0.2)" : "transparent",
            borderColor:
              filterStatus === status
                ? "rgba(159,110,245,0.5)"
                : "rgba(159,110,245,0.15)",
            color: filterStatus === status ? "#c9aff5" : "#9b8ec4",
            textTransform: "capitalize",
          }}
        >
          {status}
        </button>
      ))}
    </div>
  );
}
