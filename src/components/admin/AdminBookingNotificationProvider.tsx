"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getWaitingBookings, type ApprovalBookingItem } from "@/lib/api";

type ToastState = {
  msg: string;
  type: "success" | "error" | "info";
} | null;

export default function AdminBookingNotificationProvider() {
  const [toast, setToast] = useState<ToastState>(null);

  const prevIdsRef = useRef<Set<number>>(new Set());
  const firstLoadRef = useRef(true);

  const showToast = useCallback(
    (msg: string, type: "success" | "error" | "info" = "info") => {
      setToast({ msg, type });
      window.setTimeout(() => setToast(null), 3500);
    },
    []
  );

  const requestNotificationPermission = useCallback(() => {
    if (typeof window === "undefined") return;
    if (!("Notification" in window)) return;

    if (Notification.permission === "default") {
      void Notification.requestPermission();
    }
  }, []);

  const sendBrowserNotification = useCallback((title: string, body: string) => {
    if (typeof window === "undefined") return;
    if (!("Notification" in window)) return;
    if (Notification.permission !== "granted") return;

    new Notification(title, {
      body,
      icon: "/favicon.ico",
    });
  }, []);

  const processIncomingBookings = useCallback(
    (rows: ApprovalBookingItem[]) => {
      const currentIds = new Set(rows.map((x) => x.id_transaksi));
      const prevIds = prevIdsRef.current;

      if (!firstLoadRef.current) {
        const newRows = rows.filter((x) => !prevIds.has(x.id_transaksi));

        if (newRows.length > 0) {
          const latest = newRows[0];
          const psName =
            latest.detail_sewa?.[0]?.playstation?.nomor_ps ?? "Produk / Booking";
          const customer = latest.user?.name ?? "Pelanggan";

          showToast(
            newRows.length === 1
              ? `Booking baru dari ${customer} untuk ${psName}`
              : `${newRows.length} booking baru masuk`,
            "info"
          );

          sendBrowserNotification(
            "Booking baru masuk",
            newRows.length === 1
              ? `${customer} mengajukan booking untuk ${psName}`
              : `${newRows.length} booking baru menunggu persetujuan admin`
          );
        }
      }

      prevIdsRef.current = currentIds;
      firstLoadRef.current = false;
    },
    [sendBrowserNotification, showToast]
  );

  const fetchBookings = useCallback(async () => {
    try {
      const rows = await getWaitingBookings();
      processIncomingBookings(rows);
    } catch {
      // provider global: diamkan error agar tidak spam
    }
  }, [processIncomingBookings]);

  useEffect(() => {
    requestNotificationPermission();
    void fetchBookings();

    const interval = window.setInterval(() => {
      void fetchBookings();
    }, 15000);

    const handleFocus = () => {
      void fetchBookings();
    };

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        void fetchBookings();
      }
    };

    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [fetchBookings, requestNotificationPermission]);

  return toast ? (
    <div
      style={{
        position: "fixed",
        top: 20,
        right: 20,
        zIndex: 9999,
        maxWidth: "min(92vw, 420px)",
        padding: "12px 16px",
        borderRadius: 12,
        background: "rgba(96,165,250,0.12)",
        border: "1px solid rgba(96,165,250,0.3)",
        color: "#60a5fa",
        fontSize: 13.5,
        fontWeight: 500,
        boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
        display: "flex",
        alignItems: "center",
        gap: 8,
      }}
    >
      🔔 {toast.msg}
    </div>
  ) : null;
}