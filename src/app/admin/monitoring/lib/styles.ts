import type { CSSProperties } from "react";

export const inputStyle: CSSProperties = {
  width: "100%",
  padding: "10px 14px",
  borderRadius: 10,
  fontSize: 13,
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(159,110,245,0.2)",
  color: "#f0eaff",
  outline: "none",
  boxSizing: "border-box",
};

export const labelStyle: CSSProperties = {
  display: "block",
  fontSize: 12,
  color: "#9b8ec4",
  marginBottom: 6,
};

export const primaryBtnStyle: CSSProperties = {
  padding: "10px 16px",
  borderRadius: 12,
  background: "linear-gradient(135deg, #5b2faa, #9f6ef5)",
  border: "none",
  color: "white",
  fontSize: 13.5,
  fontWeight: 600,
  cursor: "pointer",
};

export const secondaryBtnStyle: CSSProperties = {
  padding: "10px 16px",
  borderRadius: 12,
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(159,110,245,0.2)",
  color: "#f0eaff",
  fontSize: 13.5,
  fontWeight: 600,
  cursor: "pointer",
};

export const dangerBtnStyle: CSSProperties = {
  padding: "10px 16px",
  borderRadius: 12,
  background: "rgba(248,113,113,0.15)",
  border: "1px solid rgba(248,113,113,0.3)",
  color: "#f87171",
  fontSize: 13.5,
  fontWeight: 600,
  cursor: "pointer",
};

export const closeBtnStyle: CSSProperties = {
  border: "none",
  background: "transparent",
  color: "#9b8ec4",
  fontSize: 20,
  cursor: "pointer",
};

export const qtyBtnStyle: CSSProperties = {
  width: 28,
  height: 28,
  borderRadius: 8,
  border: "1px solid rgba(159,110,245,0.2)",
  background: "rgba(255,255,255,0.04)",
  color: "#f0eaff",
  cursor: "pointer",
};

export const overlayStyle: CSSProperties = {
  position: "fixed",
  inset: 0,
  zIndex: 100,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "rgba(0,0,0,0.65)",
  backdropFilter: "blur(6px)",
  padding: 20,
};

export const modalStyle: CSSProperties = {
  width: "min(1100px, 100%)",
  maxHeight: "90vh",
  overflowY: "auto",
  background: "#1e1040",
  border: "1px solid rgba(159,110,245,0.25)",
  borderRadius: 20,
  padding: 28,
  boxShadow: "0 24px 60px rgba(0,0,0,0.5)",
};

export const panelStyle: CSSProperties = {
  borderRadius: 16,
  background: "#160d2e",
  border: "1px solid rgba(159,110,245,0.15)",
  padding: 18,
};

export const summaryBoxStyle: CSSProperties = {
  padding: "14px 16px",
  borderRadius: 12,
  background: "rgba(255,255,255,0.03)",
  border: "1px solid rgba(159,110,245,0.12)",
};

export const summaryLabelStyle: CSSProperties = {
  fontSize: 11,
  color: "#9b8ec4",
  marginBottom: 6,
  textTransform: "uppercase",
};

export const summaryValueStyle: CSSProperties = {
  fontSize: 14,
  fontWeight: 700,
  color: "#f0eaff",
};

export const miniBoxStyle: CSSProperties = {
  padding: "14px 16px",
  borderRadius: 12,
  background: "rgba(255,255,255,0.03)",
  border: "1px solid rgba(159,110,245,0.12)",
};

export const miniLabelStyle: CSSProperties = {
  fontSize: 11,
  color: "#9b8ec4",
  marginBottom: 6,
};

export const miniValueStyle: CSSProperties = {
  fontSize: 14,
  fontWeight: 600,
  color: "#f0eaff",
};

export const itemCardStyle: CSSProperties = {
  padding: 14,
  borderRadius: 12,
  background: "rgba(255,255,255,0.03)",
  border: "1px solid rgba(159,110,245,0.12)",
};

export const emptyNoticeStyle: CSSProperties = {
  padding: "16px 14px",
  borderRadius: 12,
  background: "rgba(159,110,245,0.08)",
  border: "1px solid rgba(159,110,245,0.15)",
  color: "#c9aff5",
  fontSize: 13,
};

export const receiptRowStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: 12,
  color: "#c9aff5",
};

export const tabButton = (active: boolean): CSSProperties => ({
  padding: "10px 16px",
  borderRadius: 10,
  border: "1px solid rgba(159,110,245,0.25)",
  background: active ? "rgba(159,110,245,0.2)" : "transparent",
  color: active ? "#f0eaff" : "#9b8ec4",
  fontWeight: 600,
  cursor: "pointer",
});
