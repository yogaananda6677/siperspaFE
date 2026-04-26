"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getAdminDashboard, type AdminDashboardResponse } from "@/lib/api";

const formatRupiah = (n: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(Number(n || 0));

const pageStyle: React.CSSProperties = {
  minHeight: "100vh",
  padding: "32px 40px 48px",
  background:
    "radial-gradient(circle at top left, rgba(109,75,195,0.16), transparent 24%), radial-gradient(circle at top right, rgba(59,130,246,0.10), transparent 20%), #0f0820",
};

const cardStyle: React.CSSProperties = {
  borderRadius: 22,
  background: "rgba(22,13,46,0.92)",
  border: "1px solid rgba(159,110,245,0.14)",
  boxShadow: "0 18px 40px rgba(0,0,0,0.28)",
};

const innerCard: React.CSSProperties = {
  borderRadius: 16,
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(159,110,245,0.12)",
};

type DashboardData = AdminDashboardResponse["data"];

type ToastState = {
  id: string;
  title: string;
  message: string;
  tone: "booking" | "cash";
} | null;

function requestBrowserNotificationPermission() {
  if (typeof window === "undefined") return;
  if (!("Notification" in window)) return;

  if (Notification.permission === "default") {
    void Notification.requestPermission();
  }
}

function sendBrowserNotification(title: string, body: string) {
  if (typeof window === "undefined") return;
  if (!("Notification" in window)) return;
  if (Notification.permission !== "granted") return;

  new Notification(title, {
    body,
    icon: "/favicon.ico",
  });
}

function ToastPopup({ toast }: { toast: NonNullable<ToastState> }) {
  const theme =
    toast.tone === "cash"
      ? {
          bg: "rgba(245,158,11,0.16)",
          border: "rgba(245,158,11,0.28)",
          title: "#fde68a",
        }
      : {
          bg: "rgba(96,165,250,0.16)",
          border: "rgba(96,165,250,0.28)",
          title: "#bfdbfe",
        };

  return (
    <div
      style={{
        position: "fixed",
        top: 24,
        right: 24,
        zIndex: 999,
        minWidth: 320,
        maxWidth: 380,
        borderRadius: 16,
        padding: "14px 16px",
        background: theme.bg,
        border: `1px solid ${theme.border}`,
        boxShadow: "0 18px 40px rgba(0,0,0,0.35)",
        backdropFilter: "blur(10px)",
      }}
    >
      <div style={{ color: theme.title, fontSize: 14, fontWeight: 800 }}>
        {toast.title}
      </div>
      <div
        style={{
          marginTop: 6,
          color: "#e8defc",
          fontSize: 13,
          lineHeight: 1.6,
        }}
      >
        {toast.message}
      </div>
    </div>
  );
}

function NotificationCard({
  title,
  message,
  count,
  href,
  tone,
}: {
  title: string;
  message: string;
  count: number;
  href: string;
  tone: "booking" | "cash";
}) {
  const theme =
    tone === "cash"
      ? {
          bg: "rgba(245,158,11,0.10)",
          border: "rgba(245,158,11,0.22)",
          countBg: "rgba(245,158,11,0.16)",
          countColor: "#fbbf24",
          icon: "💵",
        }
      : {
          bg: "rgba(96,165,250,0.10)",
          border: "rgba(96,165,250,0.22)",
          countBg: "rgba(96,165,250,0.16)",
          countColor: "#60a5fa",
          icon: "📌",
        };

  return (
    <Link
      href={href}
      style={{
        ...innerCard,
        background: theme.bg,
        border: `1px solid ${theme.border}`,
        padding: 18,
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "space-between",
        gap: 16,
        textDecoration: "none",
      }}
    >
      <div style={{ display: "flex", gap: 14 }}>
        <div
          style={{
            width: 42,
            height: 42,
            borderRadius: 12,
            background: "rgba(255,255,255,0.06)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 18,
            flexShrink: 0,
          }}
        >
          {theme.icon}
        </div>

        <div>
          <div style={{ color: "#f0eaff", fontSize: 14, fontWeight: 800 }}>
            {title}
          </div>
          <div
            style={{
              color: "#cbbcf1",
              fontSize: 13,
              lineHeight: 1.7,
              marginTop: 8,
            }}
          >
            {message}
          </div>
        </div>
      </div>

      <div
        style={{
          minWidth: 42,
          height: 42,
          borderRadius: 12,
          background: theme.countBg,
          color: theme.countColor,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontWeight: 900,
          fontSize: 16,
          flexShrink: 0,
        }}
      >
        {count}
      </div>
    </Link>
  );
}

function InformativeCard({
  label,
  value,
  sub,
  color,
  href,
}: {
  label: string;
  value: string | number;
  sub: string;
  color: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      style={{
        ...innerCard,
        padding: 18,
        textDecoration: "none",
        display: "block",
      }}
    >
      <div
        style={{
          color: "#9b8ec4",
          fontSize: 12,
          fontWeight: 700,
          letterSpacing: "0.04em",
          textTransform: "uppercase",
        }}
      >
        {label}
      </div>

      <div
        style={{
          marginTop: 10,
          color,
          fontSize: typeof value === "string" && value.startsWith("Rp") ? 22 : 30,
          fontWeight: 900,
          lineHeight: 1.2,
        }}
      >
        {value}
      </div>

      <div style={{ marginTop: 8, color: "#b7abd9", fontSize: 12 }}>{sub}</div>
    </Link>
  );
}

function MetricMiniCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent: string;
}) {
  return (
    <div
      style={{
        ...innerCard,
        padding: 14,
        minHeight: 88,
      }}
    >
      <div
        style={{
          color: "#9b8ec4",
          fontSize: 11,
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: "0.05em",
        }}
      >
        {label}
      </div>
      <div
        style={{
          marginTop: 8,
          color: accent,
          fontWeight: 900,
          fontSize: 20,
          lineHeight: 1.3,
        }}
      >
        {value}
      </div>
    </div>
  );
}

function OmzetChart({
  title,
  data,
}: {
  title: string;
  data: { label: string; total: number }[];
}) {
  const max = Math.max(...data.map((d) => d.total), 1);

  const totalOmzet = data.reduce((sum, item) => sum + item.total, 0);
  const avgOmzet = data.length ? totalOmzet / data.length : 0;
  const topDay = data.reduce(
    (best, current) => (current.total > best.total ? current : best),
    data[0] ?? { label: "-", total: 0 }
  );
  const zeroDays = data.filter((d) => d.total <= 0).length;
  const nonZeroCount = data.filter((d) => d.total > 0).length;
  const topFive = [...data]
    .filter((d) => d.total > 0)
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);

  const points = useMemo(() => {
    if (!data.length) return "";
    const width = 760;
    const height = 280;
    const padX = 38;
    const padY = 24;
    const usableW = width - padX * 2;
    const usableH = height - padY * 2;

    return data
      .map((d, i) => {
        const x =
          padX + (data.length === 1 ? usableW / 2 : (i / (data.length - 1)) * usableW);
        const y = padY + usableH - (d.total / max) * usableH;
        return `${x},${y}`;
      })
      .join(" ");
  }, [data, max]);

  const areaPath = useMemo(() => {
    if (!data.length) return "";
    const width = 760;
    const height = 280;
    const padX = 38;
    const padY = 24;
    const usableW = width - padX * 2;
    const usableH = height - padY * 2;

    const coords = data.map((d, i) => {
      const x =
        padX + (data.length === 1 ? usableW / 2 : (i / (data.length - 1)) * usableW);
      const y = padY + usableH - (d.total / max) * usableH;
      return { x, y };
    });

    const first = coords[0];
    const last = coords[coords.length - 1];
    if (!first || !last) return "";

    return [
      `M ${first.x} ${height - padY}`,
      `L ${first.x} ${first.y}`,
      ...coords.slice(1).map((p) => `L ${p.x} ${p.y}`),
      `L ${last.x} ${height - padY}`,
      "Z",
    ].join(" ");
  }, [data, max]);

  return (
    <div style={{ ...cardStyle, padding: 22 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 12,
          alignItems: "center",
          marginBottom: 18,
          flexWrap: "wrap",
        }}
      >
        <div>
          <h2 style={{ margin: 0, color: "#f0eaff", fontSize: 18, fontWeight: 800 }}>
            {title}
          </h2>
          <div style={{ marginTop: 6, color: "#9b8ec4", fontSize: 13 }}>
            Berdasarkan transaksi yang sudah lunas
          </div>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1.3fr 0.7fr",
          gap: 16,
          alignItems: "start",
        }}
      >
        <div style={{ ...innerCard, padding: 18 }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
              gap: 12,
              marginBottom: 16,
            }}
          >
            <MetricMiniCard
              label="Total Periode"
              value={formatRupiah(totalOmzet)}
              accent="#4ade80"
            />
            <MetricMiniCard
              label="Rata-rata"
              value={formatRupiah(avgOmzet)}
              accent="#60a5fa"
            />
            <MetricMiniCard
              label="Puncak Penjualan"
              value={`${topDay.label} • ${formatRupiah(topDay.total)}`}
              accent="#fbbf24"
            />
            <MetricMiniCard
              label="Hari Tanpa Transaksi"
              value={`${zeroDays} hari`}
              accent="#f87171"
            />
          </div>

          {data.length === 0 ? (
            <div style={{ color: "#9b8ec4", padding: "24px 0" }}>Belum ada data omzet.</div>
          ) : (
            <svg viewBox="0 0 760 280" style={{ width: "100%", height: 310 }}>
              <defs>
                <linearGradient id="omzetAreaFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="rgba(139,92,246,0.40)" />
                  <stop offset="100%" stopColor="rgba(139,92,246,0.02)" />
                </linearGradient>
              </defs>

              {[0, 0.25, 0.5, 0.75, 1].map((step, idx) => {
                const y = 24 + (232 - step * 232);
                const val = Math.round(max * step);
                return (
                  <g key={idx}>
                    <line
                      x1="38"
                      y1={y}
                      x2="722"
                      y2={y}
                      stroke="rgba(159,110,245,0.12)"
                      strokeDasharray="4 4"
                    />
                    <text x="0" y={y + 4} fill="#8f82b9" fontSize="11">
                      {val > 0 ? `${Math.round(val / 1000)}k` : "0"}
                    </text>
                  </g>
                );
              })}

              {areaPath && <path d={areaPath} fill="url(#omzetAreaFill)" />}

              <polyline
                fill="none"
                stroke="#8b5cf6"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={points}
              />

              {data.map((d, i) => {
                const width = 760;
                const height = 280;
                const padX = 38;
                const padY = 24;
                const usableW = width - padX * 2;
                const usableH = height - padY * 2;

                const x =
                  padX + (data.length === 1 ? usableW / 2 : (i / (data.length - 1)) * usableW);
                const y = padY + usableH - (d.total / max) * usableH;

                return (
                  <g key={`${d.label}-${i}`}>
                    <circle cx={x} cy={y} r="5" fill="#8b5cf6" stroke="#c4b5fd" strokeWidth="2" />
                    <text x={x} y="272" textAnchor="middle" fill="#9b8ec4" fontSize="11">
                      {d.label}
                    </text>
                  </g>
                );
              })}
            </svg>
          )}
        </div>

        <div style={{ display: "grid", gap: 16 }}>
          <div style={{ ...innerCard, padding: 16 }}>
            <div
              style={{
                color: "#f0eaff",
                fontWeight: 800,
                fontSize: 14,
                marginBottom: 12,
              }}
            >
              Sorotan Periode
            </div>

            <div style={{ display: "grid", gap: 10 }}>
              <div
                style={{
                  padding: 12,
                  borderRadius: 12,
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(159,110,245,0.08)",
                }}
              >
                <div style={{ color: "#9b8ec4", fontSize: 11 }}>Hari/Bulan Terbaik</div>
                <div style={{ color: "#f0eaff", fontWeight: 800, marginTop: 4 }}>
                  {topDay.label}
                </div>
                <div style={{ color: "#4ade80", marginTop: 4, fontWeight: 700 }}>
                  {formatRupiah(topDay.total)}
                </div>
              </div>

              <div
                style={{
                  padding: 12,
                  borderRadius: 12,
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(159,110,245,0.08)",
                }}
              >
                <div style={{ color: "#9b8ec4", fontSize: 11 }}>Periode Bernilai</div>
                <div style={{ color: "#f0eaff", fontWeight: 800, marginTop: 4 }}>
                  {nonZeroCount} titik data
                </div>
                <div style={{ color: "#60a5fa", marginTop: 4, fontWeight: 700 }}>
                  punya omzet
                </div>
              </div>
            </div>
          </div>

          <div style={{ ...innerCard, padding: 16 }}>
            <div
              style={{
                color: "#f0eaff",
                fontWeight: 800,
                fontSize: 14,
                marginBottom: 12,
              }}
            >
              Top Penjualan
            </div>

            {topFive.length === 0 ? (
              <div style={{ color: "#9b8ec4", fontSize: 13 }}>
                Belum ada penjualan pada periode ini.
              </div>
            ) : (
              <div style={{ display: "grid", gap: 10 }}>
                {topFive.map((item, index) => (
                  <div
                    key={`${item.label}-${index}`}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 10,
                      padding: 12,
                      borderRadius: 12,
                      background: "rgba(255,255,255,0.03)",
                      border: "1px solid rgba(159,110,245,0.08)",
                    }}
                  >
                    <div>
                      <div style={{ color: "#f0eaff", fontWeight: 700, fontSize: 13 }}>
                        {item.label}
                      </div>
                      <div style={{ color: "#9b8ec4", fontSize: 11, marginTop: 4 }}>
                        Ranking #{index + 1}
                      </div>
                    </div>

                    <div
                      style={{
                        color: index === 0 ? "#4ade80" : "#c4b5fd",
                        fontWeight: 800,
                        fontSize: 13,
                        textAlign: "right",
                      }}
                    >
                      {formatRupiah(item.total)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [chartRange, setChartRange] = useState<"week" | "month" | "year">("week");
  const [toast, setToast] = useState<ToastState>(null);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const previousNotificationMapRef = useRef<Record<string, number>>({});
  const firstLoadRef = useRef(true);

  const showToast = useCallback((payload: NonNullable<ToastState>) => {
    setToast(payload);

    window.setTimeout(() => {
      setToast((current) => (current?.id === payload.id ? null : current));
    }, 4500);
  }, []);

  const processIncomingNotifications = useCallback(
    (notifications: DashboardData["notifications"]) => {
      const previousMap = previousNotificationMapRef.current;
      const nextMap: Record<string, number> = {};

      notifications.forEach((item) => {
        const key = `${item.type}:${item.href}`;
        const currentCount = Number(item.count || 0);
        const previousCount = Number(previousMap[key] || 0);

        nextMap[key] = currentCount;

        if (!firstLoadRef.current && currentCount > previousCount) {
          const toastId = `${key}:${currentCount}:${Date.now()}`;

          showToast({
            id: toastId,
            title: item.title,
            message: item.message,
            tone: item.type === "cash" ? "cash" : "booking",
          });

          sendBrowserNotification(item.title, item.message);
        }
      });

      previousNotificationMapRef.current = nextMap;
      firstLoadRef.current = false;
    },
    [showToast]
  );

  const fetchDashboard = useCallback(
    async (silent = false) => {
      try {
        if (!silent) setLoading(true);
        setError(null);

        const result = await getAdminDashboard();
        setDashboard(result.data);

        processIncomingNotifications(result.data.notifications ?? []);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Gagal memuat dashboard");
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [processIncomingNotifications]
  );

  useEffect(() => {
    requestBrowserNotificationPermission();
    void fetchDashboard(false);

    intervalRef.current = setInterval(() => {
      void fetchDashboard(true);
    }, 15000);

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        void fetchDashboard(true);
      }
    };

    const handleFocus = () => {
      void fetchDashboard(true);
    };

    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("focus", handleFocus);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("focus", handleFocus);
    };
  }, [fetchDashboard]);

  const notifications = dashboard?.notifications ?? [];
  const cards = dashboard?.informative_cards ?? [];
  const omzetChart = dashboard?.omzet_chart?.[chartRange] ?? [];
  const lastUpdated = dashboard?.last_updated_at ?? "-";

  return (
    <div style={pageStyle}>
      {toast && <ToastPopup toast={toast} />}

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 20,
          alignItems: "flex-start",
          flexWrap: "wrap",
          marginBottom: 24,
        }}
      >
        <div>
          <h1 style={{ margin: 0, color: "#f0eaff", fontSize: 28, fontWeight: 900 }}>
            Dashboard Admin
          </h1>
          <p style={{ margin: "6px 0 0", color: "#9b8ec4", fontSize: 13 }}>
            Ringkasan utama operasional rental PS tanpa informasi berulang
          </p>
          <p style={{ margin: "8px 0 0", color: "#7e72a8", fontSize: 12 }}>
            Update terakhir: {lastUpdated}
          </p>
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          {(["week", "month", "year"] as const).map((range) => (
            <button
              key={range}
              onClick={() => setChartRange(range)}
              style={{
                padding: "9px 14px",
                borderRadius: 10,
                border: "1px solid rgba(159,110,245,0.2)",
                background:
                  chartRange === range
                    ? "rgba(139,92,246,0.16)"
                    : "rgba(255,255,255,0.04)",
                color: chartRange === range ? "#e9ddff" : "#b8a9de",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              {range === "week" ? "Minggu" : range === "month" ? "Bulan" : "Tahun"}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div
          style={{
            marginBottom: 18,
            borderRadius: 16,
            padding: "14px 16px",
            background: "rgba(248,113,113,0.12)",
            border: "1px solid rgba(248,113,113,0.22)",
            color: "#fca5a5",
            fontWeight: 600,
          }}
        >
          ✕ {error}
        </div>
      )}

      <div style={{ display: "grid", gap: 14, marginBottom: 24 }}>
        {loading ? (
          <div style={{ ...cardStyle, padding: 20, color: "#9b8ec4" }}>Memuat notifikasi...</div>
        ) : notifications.length === 0 ? (
          <div style={{ ...cardStyle, padding: 20, color: "#9b8ec4" }}>
            Tidak ada notifikasi penting saat ini.
          </div>
        ) : (
          notifications.map((item, idx) => (
            <NotificationCard
              key={`${item.type}-${idx}-${item.count}`}
              title={item.title}
              message={item.message}
              count={Number(item.count || 0)}
              href={item.href}
              tone={item.type === "cash" ? "cash" : "booking"}
            />
          ))
        )}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
          gap: 14,
          marginBottom: 24,
        }}
      >
        {loading
          ? Array.from({ length: 6 }).map((_, i) => (
              <div key={i} style={{ ...innerCard, padding: 18, color: "#9b8ec4" }}>
                Memuat...
              </div>
            ))
          : cards.map((item) => (
              <InformativeCard
                key={item.key}
                label={item.label}
                value={item.is_currency ? formatRupiah(Number(item.value || 0)) : item.value}
                sub={item.sub}
                color={item.color}
                href={item.href}
              />
            ))}
      </div>

      <OmzetChart
        title={`Grafik Omzet ${
          chartRange === "week"
            ? "7 Hari Terakhir"
            : chartRange === "month"
            ? "30 Hari Terakhir"
            : "12 Bulan Terakhir"
        }`}
        data={omzetChart}
      />
    </div>
  );
}