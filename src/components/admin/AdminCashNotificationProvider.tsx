"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getCashPendingPayments, type CashPendingItem } from "@/lib/api";

type ToastState = {
  msg: string;
  type: "success" | "error" | "info";
} | null;

export default function AdminCashNotificationProvider() {
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

  const processIncomingCashPayments = useCallback(
    (rows: CashPendingItem[]) => {
      const currentIds = new Set(rows.map((x) => x.id_transaksi));
      const prevIds = prevIdsRef.current;

      if (!firstLoadRef.current) {
        const newRows = rows.filter((x) => !prevIds.has(x.id_transaksi));

        if (newRows.length > 0) {
          const latest = newRows[0];
          const customer = latest.user?.name ?? "Pelanggan";
          const psName =
            latest.detail_sewa?.[0]?.playstation?.nomor_ps ?? "Transaksi cash";

          showToast(
            newRows.length === 1
              ? `Pembayaran cash baru • ${customer} - ${psName}`
              : `${newRows.length} pembayaran cash baru menunggu validasi`,
            "info"
          );

          sendBrowserNotification(
            "Pembayaran cash baru",
            newRows.length === 1
              ? `${customer} menunggu validasi pembayaran cash untuk ${psName}`
              : `${newRows.length} pembayaran cash baru menunggu validasi`
          );
        }
      }

      prevIdsRef.current = currentIds;
      firstLoadRef.current = false;
    },
    [sendBrowserNotification, showToast]
  );

  const fetchCashPending = useCallback(async () => {
    try {
      const rows = await getCashPendingPayments();
      processIncomingCashPayments(rows);
    } catch {
      // sengaja diam agar tidak spam error global
    }
  }, [processIncomingCashPayments]);

  useEffect(() => {
    requestNotificationPermission();
    void fetchCashPending();

    const interval = window.setInterval(() => {
      void fetchCashPending();
    }, 15000);

    const handleFocus = () => {
      void fetchCashPending();
    };

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        void fetchCashPending();
      }
    };

    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [fetchCashPending, requestNotificationPermission]);

  return toast ? (
    <div
      style={{
        position: "fixed",
        top: 76,
        right: 20,
        zIndex: 9998,
        maxWidth: "min(92vw, 420px)",
        padding: "12px 16px",
        borderRadius: 12,
        background: "rgba(245,158,11,0.12)",
        border: "1px solid rgba(245,158,11,0.3)",
        color: "#fbbf24",
        fontSize: 13.5,
        fontWeight: 500,
        boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
        display: "flex",
        alignItems: "center",
        gap: 8,
      }}
    >
      💵 {toast.msg}
    </div>
  ) : null;
}