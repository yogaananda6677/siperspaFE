"use client";

import { useEffect, useState } from "react";
import { getAdminDashboard, type AdminDashboardResponse } from "@/lib/api";

const formatRupiah = (n: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(Number(n || 0));

const formatDate = (iso?: string | null) => {
  if (!iso) return "-";
  return new Date(iso).toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const pageStyle: React.CSSProperties = {
  minHeight: "100vh",
  padding: "32px 40px 48px",
  background:
    "radial-gradient(circle at top left, rgba(109,75,195,0.18), transparent 24%), radial-gradient(circle at top right, rgba(59,130,246,0.12), transparent 20%), #0f0820",
};

const sectionTitle: React.CSSProperties = {
  margin: 0,
  color: "#f0eaff",
  fontWeight: 800,
  fontSize: 18,
};

const cardStyle: React.CSSProperties = {
  borderRadius: 20,
  background: "rgba(22,13,46,0.92)",
  border: "1px solid rgba(159,110,245,0.14)",
  boxShadow: "0 18px 40px rgba(0,0,0,0.28)",
};

const innerCard: React.CSSProperties = {
  borderRadius: 16,
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(159,110,245,0.12)",
};

function StatusBadge({
  label,
  tone = "default",
}: {
  label: string;
  tone?: "default" | "success" | "warning" | "danger" | "info";
}) {
  const map = {
    default: {
      bg: "rgba(148,163,184,0.14)",
      border: "rgba(148,163,184,0.25)",
      color: "#cbd5e1",
    },
    success: {
      bg: "rgba(74,222,128,0.14)",
      border: "rgba(74,222,128,0.25)",
      color: "#4ade80",
    },
    warning: {
      bg: "rgba(245,158,11,0.14)",
      border: "rgba(245,158,11,0.25)",
      color: "#fbbf24",
    },
    danger: {
      bg: "rgba(248,113,113,0.14)",
      border: "rgba(248,113,113,0.25)",
      color: "#f87171",
    },
    info: {
      bg: "rgba(96,165,250,0.14)",
      border: "rgba(96,165,250,0.25)",
      color: "#60a5fa",
    },
  }[tone];

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "5px 12px",
        borderRadius: 999,
        background: map.bg,
        border: `1px solid ${map.border}`,
        color: map.color,
        fontSize: 12,
        fontWeight: 700,
      }}
    >
      {label}
    </span>
  );
}

function StatCard({
  title,
  value,
  sub,
  color,
}: {
  title: string;
  value: string | number;
  sub: string;
  color: string;
}) {
  return (
    <div
      style={{
        ...innerCard,
        padding: 18,
      }}
    >
      <div
        style={{
          color: "#9b8ec4",
          fontSize: 12,
          fontWeight: 700,
          letterSpacing: "0.04em",
        }}
      >
        {title}
      </div>
      <div style={{ marginTop: 10, color, fontSize: 28, fontWeight: 900 }}>
        {value}
      </div>
      <div style={{ marginTop: 6, color: "#b7abd9", fontSize: 12 }}>{sub}</div>
    </div>
  );
}

function QuickAction({
  title,
  desc,
  href,
  emoji,
}: {
  title: string;
  desc: string;
  href: string;
  emoji: React.ReactNode;
}) {
  return (
    <a
      href={href}
      style={{
        ...innerCard,
        padding: 16,
        textDecoration: "none",
        display: "block",
      }}
    >
      <div style={{ fontSize: 22 }}>{emoji}</div>
      <div style={{ marginTop: 12, color: "#f0eaff", fontWeight: 800 }}>
        {title}
      </div>
      <div
        style={{
          marginTop: 6,
          color: "#9b8ec4",
          fontSize: 13,
          lineHeight: 1.6,
        }}
      >
        {desc}
      </div>
    </a>
  );
}

export default function AdminDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [dashboard, setDashboard] =
    useState<AdminDashboardResponse["data"] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await getAdminDashboard();
      setDashboard(result.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal memuat dashboard");
    } finally {
      setLoading(false);
    }
  };

  const stats = dashboard?.stats;
  const psStats = dashboard?.ps_stats;
  const cashPending = dashboard?.cash_pending ?? [];
  const recentTransaksi = dashboard?.recent_transaksi ?? [];
  const recentMonitoring = dashboard?.recent_monitoring ?? [];
  const highlightText =
    dashboard?.highlights?.text ??
    "Operasional hari ini terlihat stabil dan belum ada antrean validasi cash.";

  return (
    <div style={pageStyle}>
      <div
        style={{
          ...cardStyle,
          padding: 24,
          background:
            "linear-gradient(135deg, rgba(109,75,195,0.22), rgba(29,19,62,0.96))",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 24,
            flexWrap: "wrap",
          }}
        >
          <div style={{ maxWidth: 760 }}>
            <div
              style={{
                color: "#cdbdff",
                fontSize: 13,
                fontWeight: 700,
                letterSpacing: "0.06em",
              }}
            >
              DASHBOARD ADMIN
            </div>

            <h1
              style={{
                margin: "10px 0 0",
                color: "#ffffff",
                fontSize: 32,
                fontWeight: 900,
                lineHeight: 1.2,
              }}
            >
              Ringkasan operasional Rental PS
            </h1>

            <p
              style={{
                margin: "12px 0 0",
                color: "#ddd3ff",
                fontSize: 14,
                lineHeight: 1.8,
                maxWidth: 720,
              }}
            >
              Pantau transaksi, status unit PlayStation, pembayaran cash, dan
              aktivitas pelanggan dari satu tempat dengan tampilan yang
              konsisten.
            </p>
          </div>

          <div
            style={{
              minWidth: 260,
              flex: "0 0 280px",
              ...innerCard,
              padding: 18,
              alignSelf: "stretch",
            }}
          >
            <div style={{ color: "#9b8ec4", fontSize: 12, fontWeight: 700 }}>
              HIGHLIGHT HARI INI
            </div>

            <div
              style={{
                marginTop: 10,
                color: "#f0eaff",
                fontWeight: 700,
                lineHeight: 1.7,
                fontSize: 14,
              }}
            >
              {loading ? "Memuat highlight..." : highlightText}
            </div>

            <div
              style={{
                marginTop: 14,
                display: "flex",
                gap: 8,
                flexWrap: "wrap",
              }}
            >
              <StatusBadge
                label={`${psStats?.tersedia ?? 0} PS tersedia`}
                tone="success"
              />
              <StatusBadge
                label={`${psStats?.digunakan ?? 0} dipakai`}
                tone="info"
              />
              <StatusBadge
                label={`${dashboard?.cash_pending_count ?? 0} cash pending`}
                tone="warning"
              />
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div
          style={{
            marginTop: 18,
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

      <div
        style={{
          marginTop: 24,
          display: "grid",
          gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
          gap: 14,
        }}
      >
        <StatCard
          title="Total Transaksi"
          value={loading ? "..." : stats?.total_transaksi ?? 0}
          sub="Semua transaksi tercatat"
          color="#c4b5fd"
        />
        <StatCard
          title="Transaksi Aktif"
          value={loading ? "..." : stats?.aktif ?? 0}
          sub="Sedang berjalan saat ini"
          color="#60a5fa"
        />
        <StatCard
          title="Waiting Approval"
          value={loading ? "..." : stats?.waiting_approval ?? 0}
          sub="Booking pelanggan menunggu"
          color="#fbbf24"
        />
        <StatCard
          title="Omzet Lunas"
          value={loading ? "..." : formatRupiah(stats?.total_omzet ?? 0)}
          sub="Akumulasi transaksi lunas"
          color="#4ade80"
        />
      </div>

      <div
        style={{
          marginTop: 14,
          display: "grid",
          gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
          gap: 14,
        }}
      >
        <StatCard
          title="PS Tersedia"
          value={loading ? "..." : psStats?.tersedia ?? 0}
          sub="Siap dipakai sekarang"
          color="#4ade80"
        />
        <StatCard
          title="PS Dipakai"
          value={loading ? "..." : psStats?.digunakan ?? 0}
          sub="Sedang digunakan"
          color="#60a5fa"
        />
        <StatCard
          title="Maintenance"
          value={loading ? "..." : psStats?.maintenance ?? 0}
          sub="Perlu perhatian admin"
          color="#f87171"
        />
        <StatCard
          title="Belum Lunas"
          value={loading ? "..." : stats?.menunggu_bayar ?? 0}
          sub="Menunggu bayar/validasi"
          color="#fbbf24"
        />
      </div>

      <div style={{ marginTop: 24, ...cardStyle, padding: 22 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 16,
            alignItems: "center",
            marginBottom: 16,
            flexWrap: "wrap",
          }}
        >
          <h2 style={sectionTitle}>Menu Cepat</h2>
          <div style={{ color: "#9b8ec4", fontSize: 13 }}>
            Akses halaman yang paling sering dipakai admin
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
            gap: 14,
          }}
        >
          <QuickAction
            title="Approve Booking"
            desc="Verifikasi booking pelanggan yang masih menunggu approval."
            href="/admin/approve-booking"
            emoji={
                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                <path d="M8 7h8M8 12h5M8 17h4" strokeLinecap="round" />
                <circle cx="18" cy="17" r="3" />
                <path d="M17 17l1 1 2-2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            }
            />

            <QuickAction
            title="Pembayaran Cash"
            desc="Konfirmasi pembayaran cash dan cek antrean validasi."
            href="/admin/pembayaran"
            emoji={
                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                <path d="M12 1v22M5 5h9a3 3 0 010 6H9a3 3 0 000 6h10" strokeLinecap="round" />
                </svg>
            }
            />

            <QuickAction
            title="Monitoring PS"
            desc="Pantau status semua unit PlayStation secara real-time."
            href="/admin/monitoring"
            emoji={
                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                <polyline points="3 17 9 11 13 15 21 7" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="3" cy="17" r="1.5" fill="currentColor" />
                <circle cx="9" cy="11" r="1.5" fill="currentColor" />
                <circle cx="13" cy="15" r="1.5" fill="currentColor" />
                <circle cx="21" cy="7" r="1.5" fill="currentColor" />
                </svg>
            }
            />

        <QuickAction
        title="Riwayat Transaksi"
        desc="Lihat seluruh transaksi, detail pelanggan, dan status pembayaran."
        href="/admin/transaksi"
        emoji={
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
            <rect x="3" y="4" width="18" height="16" rx="2" />
            <path d="M7 8h10M7 12h6M7 16h4" strokeLinecap="round" />
            </svg>
        }
        />
        </div>
      </div>

      <div
        style={{
          marginTop: 24,
          display: "grid",
          gridTemplateColumns: "1.2fr 0.8fr",
          gap: 18,
          alignItems: "start",
        }}
      >
        <div style={{ ...cardStyle, padding: 22 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 16,
              alignItems: "center",
              marginBottom: 16,
            }}
          >
            <h2 style={sectionTitle}>Transaksi Terbaru</h2>
            <a
              href="/admin/transaksi"
              style={{
                color: "#c4b5fd",
                fontSize: 13,
                textDecoration: "none",
                fontWeight: 700,
              }}
            >
              Lihat semua
            </a>
          </div>

          {loading ? (
            <div style={{ color: "#9b8ec4", padding: "18px 0" }}>
              Memuat transaksi...
            </div>
          ) : recentTransaksi.length === 0 ? (
            <div style={{ color: "#9b8ec4", padding: "18px 0" }}>
              Belum ada transaksi.
            </div>
          ) : (
            <div style={{ display: "grid", gap: 12 }}>
              {recentTransaksi.map((item) => {
                const pay = (item.pembayaran?.status_bayar || "").toLowerCase();
                const trx = (item.status_transaksi || "").toLowerCase();

                const payTone =
                  pay === "lunas"
                    ? "success"
                    : pay === "menunggu_validasi"
                    ? "warning"
                    : pay === "gagal"
                    ? "danger"
                    : "default";

                const trxTone =
                  trx === "aktif"
                    ? "info"
                    : trx === "selesai"
                    ? "success"
                    : trx === "waiting" || trx === "menunggu_pembayaran"
                    ? "warning"
                    : trx === "dibatalkan" || trx === "ditolak"
                    ? "danger"
                    : "default";

                return (
                  <div
                    key={item.id_transaksi}
                    style={{
                      ...innerCard,
                      padding: 16,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: 14,
                        alignItems: "flex-start",
                      }}
                    >
                      <div>
                        <div style={{ color: "#f0eaff", fontWeight: 800 }}>
                          Transaksi #{item.id_transaksi}
                        </div>
                        <div
                          style={{
                            color: "#9b8ec4",
                            fontSize: 13,
                            marginTop: 6,
                          }}
                        >
                          {item.user?.name ?? "Tanpa pelanggan"} •{" "}
                          {formatDate(item.tanggal)}
                        </div>
                        <div
                          style={{
                            color: "#c4b5fd",
                            fontSize: 13,
                            marginTop: 6,
                          }}
                        >
                          {item.detail_sewa?.[0]?.playstation?.nomor_ps
                            ? `${item.detail_sewa[0]?.playstation?.nomor_ps} • ${
                                item.detail_sewa[0]?.playstation?.tipe
                                  ?.nama_tipe ?? "-"
                              }`
                            : "Tanpa detail sewa"}
                        </div>
                      </div>

                      <div style={{ textAlign: "right" }}>
                        <div style={{ color: "#f0eaff", fontWeight: 900 }}>
                          {formatRupiah(Number(item.total_harga || 0))}
                        </div>
                        <div
                          style={{
                            display: "flex",
                            gap: 8,
                            justifyContent: "flex-end",
                            marginTop: 10,
                            flexWrap: "wrap",
                          }}
                        >
                          <StatusBadge
                            label={item.status_transaksi}
                            tone={trxTone as
                              | "default"
                              | "success"
                              | "warning"
                              | "danger"
                              | "info"}
                          />
                          <StatusBadge
                            label={item.pembayaran?.status_bayar || "menunggu"}
                            tone={payTone as
                              | "default"
                              | "success"
                              | "warning"
                              | "danger"
                              | "info"}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div style={{ display: "grid", gap: 18 }}>
          <div style={{ ...cardStyle, padding: 22 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 16,
                alignItems: "center",
                marginBottom: 16,
              }}
            >
              <h2 style={sectionTitle}>Cash Menunggu Validasi</h2>
              <a
                href="/admin/pembayaran-cash"
                style={{
                  color: "#c4b5fd",
                  fontSize: 13,
                  textDecoration: "none",
                  fontWeight: 700,
                }}
              >
                Kelola
              </a>
            </div>

            {loading ? (
              <div style={{ color: "#9b8ec4" }}>Memuat data...</div>
            ) : cashPending.length === 0 ? (
              <div style={{ color: "#9b8ec4" }}>
                Tidak ada pembayaran cash yang menunggu.
              </div>
            ) : (
              <div style={{ display: "grid", gap: 12 }}>
                {cashPending.map((item) => (
                  <div
                    key={item.id_transaksi}
                    style={{ ...innerCard, padding: 14 }}
                  >
                    <div style={{ color: "#f0eaff", fontWeight: 800 }}>
                      #{item.id_transaksi} • {item.user?.name ?? "-"}
                    </div>
                    <div
                      style={{
                        color: "#9b8ec4",
                        fontSize: 13,
                        marginTop: 6,
                      }}
                    >
                      {item.detail_sewa?.[0]?.playstation?.nomor_ps
                        ? `${item.detail_sewa?.[0]?.playstation?.nomor_ps} • ${
                            item.detail_sewa?.[0]?.playstation?.tipe
                              ?.nama_tipe ?? "-"
                          }`
                        : "Tanpa detail sewa"}
                    </div>
                    <div
                      style={{
                        color: "#f0eaff",
                        fontWeight: 800,
                        marginTop: 8,
                      }}
                    >
                      {formatRupiah(Number(item.total_harga || 0))}
                    </div>
                    <div style={{ marginTop: 10 }}>
                      <StatusBadge
                        label="Menunggu Validasi"
                        tone="warning"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ ...cardStyle, padding: 22 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 16,
                alignItems: "center",
                marginBottom: 16,
              }}
            >
              <h2 style={sectionTitle}>Status Unit PS</h2>
              <a
                href="/admin/monitoring"
                style={{
                  color: "#c4b5fd",
                  fontSize: 13,
                  textDecoration: "none",
                  fontWeight: 700,
                }}
              >
                Buka monitoring
              </a>
            </div>

            {loading ? (
              <div style={{ color: "#9b8ec4" }}>Memuat monitoring...</div>
            ) : recentMonitoring.length === 0 ? (
              <div style={{ color: "#9b8ec4" }}>
                Data unit PS belum tersedia.
              </div>
            ) : (
              <div style={{ display: "grid", gap: 12 }}>
                {recentMonitoring.map((ps) => {
                  const status = (ps.status_ps || "").toLowerCase();
                  const tone =
                    status === "tersedia"
                      ? "success"
                      : status === "digunakan"
                      ? "info"
                      : status === "maintenance"
                      ? "danger"
                      : "default";

                  return (
                    <div key={ps.id_ps} style={{ ...innerCard, padding: 14 }}>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          gap: 12,
                          alignItems: "center",
                        }}
                      >
                        <div>
                          <div style={{ color: "#f0eaff", fontWeight: 800 }}>
                            {ps.nomor_ps}
                          </div>
                          <div
                            style={{
                              color: "#9b8ec4",
                              fontSize: 13,
                              marginTop: 4,
                            }}
                          >
                            {ps.tipe?.nama_tipe ?? "-"}
                          </div>
                        </div>

                        <StatusBadge
                          label={ps.status_ps}
                          tone={tone as
                            | "default"
                            | "success"
                            | "warning"
                            | "danger"
                            | "info"}
                        />
                      </div>

                      {ps.active_transaksi?.user?.name && (
                        <div
                          style={{
                            color: "#b7abd9",
                            fontSize: 12.5,
                            marginTop: 10,
                          }}
                        >
                          Dipakai oleh {ps.active_transaksi.user.name}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}