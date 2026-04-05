import type { ToastState } from "../lib/types";

export function Toast({ toast }: { toast: ToastState }) {
  if (!toast) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 20,
        right: 24,
        zIndex: 200,
        padding: "12px 20px",
        borderRadius: 12,
        background:
          toast.type === "success"
            ? "rgba(74,222,128,0.12)"
            : "rgba(248,113,113,0.12)",
        border: `1px solid ${
          toast.type === "success"
            ? "rgba(74,222,128,0.3)"
            : "rgba(248,113,113,0.3)"
        }`,
        color: toast.type === "success" ? "#4ade80" : "#f87171",
        fontSize: 13.5,
        fontWeight: 500,
        boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
      }}
    >
      {toast.msg}
    </div>
  );
}
