"use client";

import { useEffect, useState, useCallback } from "react";
import { useReactToPrint } from "react-to-print";
import { useRef } from "react";

const formatRupiah = (n: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(Number(n || 0));

const formatTanggal = (iso?: string | null) => {
  if (!iso) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
};

const labelStatusBayar = (status: string) => {
  switch (status) {
    case "lunas": return "Lunas";
    case "menunggu_validasi": return "Menunggu Validasi";
    case "gagal": return "Gagal";
    default: return "Belum Lunas";
  }
};

type Periode = "harian" | "mingguan" | "bulanan" | "tahunan";

type LaporanRow = {
  label: string;
  jumlah_transaksi: number;
  total_pendapatan: number;
};

type TransaksiItem = {
  jenis: "sewa" | "produk";
  nama: string;
  detail: string;
  subtotal: number;
};

type TransaksiDetailRow = {
  id_transaksi: number;
  tanggal: string;
  pelanggan: string;
  items: TransaksiItem[];
  total_harga: number;
  status_bayar: string;
  lunas: boolean;
};

type LaporanData = {
  periode: Periode;
  dari: string;
  sampai: string;
  total_pendapatan: number;
  total_transaksi: number;
  data: LaporanRow[];
  transaksi: TransaksiDetailRow[];
};

const MONTHS = [
  "Januari","Februari","Maret","April","Mei","Juni",
  "Juli","Agustus","September","Oktober","November","Desember",
];

async function fetchLaporan(params: {
  periode: Periode;
  tahun?: number;
  bulan?: number;
  tanggal?: string;
}): Promise<LaporanData> {
  const token = typeof window !== "undefined"
    ? localStorage.getItem("token") ?? ""
    : "";

  const url = new URL(`${process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000"}/api/laporan/pendapatan`);
  url.searchParams.set("periode", params.periode);
  if (params.tahun) url.searchParams.set("tahun", String(params.tahun));
  if (params.bulan) url.searchParams.set("bulan", String(params.bulan));
  if (params.tanggal) url.searchParams.set("tanggal", params.tanggal);

  const res = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
  });

  if (!res.ok) throw new Error("Gagal memuat laporan");
  return res.json();
}

const selectStyle: React.CSSProperties = {
  padding: "8px 12px",
  borderRadius: 10,
  fontSize: 13,
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(159,110,245,0.2)",
  color: "#f0eaff",
  outline: "none",
  cursor: "pointer",
};

// Style untuk tabel khusus versi cetak (putih/hitam, bukan tema gelap UI)
const printThStyle: React.CSSProperties = {
  border: "1px solid #999",
  padding: "6px 10px",
  textAlign: "left",
  fontSize: 11,
  background: "#eee",
  color: "#111",
};
const printTdStyle: React.CSSProperties = {
  border: "1px solid #999",
  padding: "6px 10px",
  fontSize: 11,
  color: "#111",
  verticalAlign: "top",
};

export default function LaporanPendapatanPage() {
  const now = new Date();

  const [periode, setPeriode] = useState<Periode>("bulanan");
  const [tahun, setTahun] = useState(now.getFullYear());
  const [bulan, setBulan] = useState(now.getMonth() + 1);
  const [tanggal, setTanggal] = useState(now.toISOString().slice(0, 10));

  const [data, setData] = useState<LaporanData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchLaporan({
        periode,
        tahun: periode !== "harian" ? tahun : undefined,
        bulan: periode === "mingguan" ? bulan : undefined,
        tanggal: periode === "harian" ? tanggal : undefined,
      });
      setData(result);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Gagal memuat laporan";
      setError(msg);
      showToast(msg, "error");
    } finally {
      setLoading(false);
    }
  }, [periode, tahun, bulan, tanggal]);

  useEffect(() => { void load(); }, [load]);

  const tahunOptions = Array.from({ length: 5 }, (_, i) => now.getFullYear() - i);

  // ref ini sekarang menunjuk ke blok cetak khusus (tersembunyi dari layar),
  // bukan ke tabel UI bertema gelap
  const printRef = useRef<HTMLDivElement>(null);
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `laporan-${periode}-${tahun}`,
  });

  const transaksiList = data?.transaksi ?? [];

  return (
    <div style={{ padding: "32px 24px", minHeight: "100vh" }}>
      {/* Toast */}
      {toast && (
        <div style={{
          position: "fixed", top: 20, right: 24, zIndex: 200,
          padding: "12px 20px", borderRadius: 12,
          background: toast.type === "success" ? "rgba(74,222,128,0.12)" : "rgba(248,113,113,0.12)",
          border: `1px solid ${toast.type === "success" ? "rgba(74,222,128,0.3)" : "rgba(248,113,113,0.3)"}`,
          color: toast.type === "success" ? "#4ade80" : "#f87171",
          fontSize: 13.5, fontWeight: 500,
          boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
          display: "flex", alignItems: "center", gap: 8,
        }}>
          {toast.type === "success" ? "✓" : "✕"} {toast.msg}
        </div>
      )}

      {/* Header */}
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
          <h1
            style={{
              margin: 0,
              fontSize: 22,
              fontWeight: 700,
              color: "#f0eaff",
            }}
          >
            Laporan Pendapatan
          </h1>

          <p
            style={{
              margin: "4px 0 0",
              fontSize: 13,
              color: "#9b8ec4",
            }}
          >
            Rekap omzet dan transaksi berdasarkan periode waktu
          </p>
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={() => void load()}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "10px 18px",
              borderRadius: 12,
              background: "linear-gradient(135deg, #5b2faa, #9f6ef5)",
              border: "none",
              color: "white",
              fontSize: 13.5,
              fontWeight: 600,
              cursor: "pointer",
              boxShadow: "0 4px 16px rgba(159,110,245,0.3)",
            }}
          >
            Refresh
          </button>

          {(periode === "bulanan" || periode === "tahunan") && (
            <button
              onClick={handlePrint}
              style={{
                padding: "10px 18px",
                borderRadius: 12,
                border: "none",
                background: "#16a34a",
                color: "#fff",
                cursor: "pointer",
                fontWeight: 600,
              }}
            >
              Cetak Laporan {periode === "bulanan" ? "Bulanan" : "Tahunan"}
            </button>
          )}
        </div>
      </div>
      {/* Filter */}
      <div style={{
        display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 24,
        padding: "16px 20px", borderRadius: 14,
        background: "#160d2e", border: "1px solid rgba(159,110,245,0.15)",
        alignItems: "center",
      }}>
        <span style={{ fontSize: 13, color: "#9b8ec4", fontWeight: 600 }}>Filter:</span>

        <select value={periode} onChange={e => setPeriode(e.target.value as Periode)} style={selectStyle}>
          <option value="harian" style={{ background: "#1e1040" }}>Harian</option>
          <option value="mingguan" style={{ background: "#1e1040" }}>Mingguan</option>
          <option value="bulanan" style={{ background: "#1e1040" }}>Bulanan</option>
          <option value="tahunan" style={{ background: "#1e1040" }}>Tahunan</option>

        </select>

        {periode === "harian" && (
          <input
            type="date"
            value={tanggal}
            onChange={e => setTanggal(e.target.value)}
            style={{ ...selectStyle, colorScheme: "dark" }}
          />
        )}

        {periode === "mingguan" && (
          <>
            <select value={bulan} onChange={e => setBulan(Number(e.target.value))} style={selectStyle}>
              {MONTHS.map((m, i) => (
                <option key={i} value={i + 1} style={{ background: "#1e1040" }}>{m}</option>
              ))}
            </select>
            <select value={tahun} onChange={e => setTahun(Number(e.target.value))} style={selectStyle}>
              {tahunOptions.map(y => (
                <option key={y} value={y} style={{ background: "#1e1040" }}>{y}</option>
              ))}
            </select>
          </>
        )}

        {(periode === "bulanan" || periode === "tahunan")&&(
          <select value={tahun} onChange={e => setTahun(Number(e.target.value))} style={selectStyle}>
            {tahunOptions.map(y => (
              <option key={y} value={y} style={{ background: "#1e1040" }}>{y}</option>
            ))}
          </select>
        )}
      </div>

      {/* Summary Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14, marginBottom: 24 }}>
        {[
          {
            label: "Total Pendapatan",
            value: data ? formatRupiah(data.total_pendapatan) : "-",
            color: "#4ade80", bg: "rgba(74,222,128,0.08)", border: "rgba(74,222,128,0.2)",
            fontSize: 20,
          },
          {
            label: "Total Transaksi",
            value: data ? String(data.total_transaksi) : "-",
            color: "#9f6ef5", bg: "rgba(159,110,245,0.08)", border: "rgba(159,110,245,0.2)",
            fontSize: 28,
          },
          {
            label: "Rata-rata per Transaksi",
            value: data && data.total_transaksi > 0
              ? formatRupiah(data.total_pendapatan / data.total_transaksi)
              : "-",
            color: "#fb923c", bg: "rgba(251,146,60,0.08)", border: "rgba(251,146,60,0.2)",
            fontSize: 20,
          },
          {
            label: "Periode",
            value: data ? `${data.dari} s/d ${data.sampai}` : "-",
            color: "#60a5fa", bg: "rgba(96,165,250,0.08)", border: "rgba(96,165,250,0.2)",
            fontSize: 12,
          },
        ].map(s => (
          <div key={s.label} style={{ padding: "16px 20px", borderRadius: 14, background: s.bg, border: `1px solid ${s.border}` }}>
            <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: "#9b8ec4", letterSpacing: "0.05em", textTransform: "uppercase" }}>
              {s.label}
            </p>
            <p style={{ margin: "6px 0 0", fontSize: s.fontSize, fontWeight: 700, color: s.color, wordBreak: "break-word", lineHeight: 1.4 }}>
              {loading ? "..." : s.value}
            </p>
          </div>
        ))}
      </div>

      {/* Table: Ringkasan per periode */}
      <div style={{ borderRadius: 16, border: "1px solid rgba(159,110,245,0.15)", background: "#160d2e", overflow: "hidden", marginBottom: 24 }}>
        {loading ? (
          <div style={{ padding: "64px 0", textAlign: "center", color: "#9b8ec4" }}>
            <div style={{
              width: 32, height: 32,
              border: "2px solid rgba(159,110,245,0.2)",
              borderTop: "2px solid #9f6ef5",
              borderRadius: "50%",
              animation: "spin 0.8s linear infinite",
              margin: "0 auto 12px",
            }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            Memuat data laporan...
          </div>
        ) : error ? (
          <div style={{ padding: "48px 0", textAlign: "center", color: "#f87171" }}>
            {error}
          </div>
        ) : !data || data.data.length === 0 ? (
          <div style={{ padding: "56px 0", textAlign: "center" }}>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "#f0eaff" }}>Tidak ada data</p>
            <p style={{ margin: "4px 0 0", fontSize: 13, color: "#9b8ec4" }}>Belum ada transaksi selesai pada periode ini.</p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(159,110,245,0.15)" }}>
                  {["No", "Periode", "Jumlah Transaksi", "Total Pendapatan"].map(h => (
                    <th key={h} style={{
                      padding: "14px 24px", textAlign: "left",
                      fontSize: 11, fontWeight: 600, letterSpacing: "0.06em",
                      textTransform: "uppercase", color: "#9b8ec4",
                    }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.data.map((row, i) => (
                  <tr
                    key={i}
                    style={{ borderBottom: i < data.data.length - 1 ? "1px solid rgba(159,110,245,0.08)" : "none" }}
                    onMouseEnter={e => (e.currentTarget.style.background = "rgba(159,110,245,0.05)")}
                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                  >
                    <td style={{ padding: "14px 24px", color: "#9b8ec4", fontSize: 13 }}>{i + 1}</td>
                    <td style={{ padding: "14px 24px", color: "#f0eaff", fontSize: 13, fontWeight: 600 }}>{row.label}</td>
                    <td style={{ padding: "14px 24px", fontSize: 13 }}>
                      <span style={{
                        display: "inline-flex", alignItems: "center", gap: 6,
                        padding: "4px 12px", borderRadius: 8,
                        background: "rgba(159,110,245,0.12)",
                        border: "1px solid rgba(159,110,245,0.25)",
                        color: "#c4b5fd", fontWeight: 600, fontSize: 12,
                      }}>
                        {row.jumlah_transaksi} transaksi
                      </span>
                    </td>
                    <td style={{ padding: "14px 24px", color: "#4ade80", fontSize: 13, fontWeight: 700 }}>
                      {formatRupiah(row.total_pendapatan)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ borderTop: "1px solid rgba(159,110,245,0.2)" }}>
                  <td colSpan={2} style={{ padding: "14px 24px", color: "#9b8ec4", fontSize: 13, fontWeight: 700 }}>TOTAL</td>
                  <td style={{ padding: "14px 24px" }}>
                    <span style={{
                      display: "inline-flex", alignItems: "center", gap: 6,
                      padding: "4px 12px", borderRadius: 8,
                      background: "rgba(159,110,245,0.12)",
                      border: "1px solid rgba(159,110,245,0.25)",
                      color: "#c4b5fd", fontWeight: 700, fontSize: 12,
                    }}>
                      {data.total_transaksi} transaksi
                    </span>
                  </td>
                  <td style={{ padding: "14px 24px", color: "#4ade80", fontSize: 15, fontWeight: 800 }}>
                    {formatRupiah(data.total_pendapatan)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {/* Table: Detail Transaksi (pelanggan + rincian item) */}
      <div style={{ marginBottom: 8 }}>
        <h2 style={{ margin: "0 0 12px", fontSize: 16, fontWeight: 700, color: "#f0eaff" }}>
          Detail Transaksi
        </h2>
      </div>
      <div style={{ borderRadius: 16, border: "1px solid rgba(159,110,245,0.15)", background: "#160d2e", overflow: "hidden" }}>
        {loading ? (
          <div style={{ padding: "48px 0", textAlign: "center", color: "#9b8ec4" }}>Memuat detail transaksi...</div>
        ) : error ? (
          <div style={{ padding: "48px 0", textAlign: "center", color: "#f87171" }}>{error}</div>
        ) : transaksiList.length === 0 ? (
          <div style={{ padding: "56px 0", textAlign: "center" }}>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "#f0eaff" }}>Belum ada transaksi</p>
            <p style={{ margin: "4px 0 0", fontSize: 13, color: "#9b8ec4" }}>Tidak ada transaksi pelanggan pada periode ini.</p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(159,110,245,0.15)" }}>
                  {["No", "Tanggal", "Pelanggan", "Rincian", "Status", "Total"].map(h => (
                    <th key={h} style={{
                      padding: "14px 24px", textAlign: "left",
                      fontSize: 11, fontWeight: 600, letterSpacing: "0.06em",
                      textTransform: "uppercase", color: "#9b8ec4",
                    }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {transaksiList.map((t, i) => (
                  <tr
                    key={t.id_transaksi}
                    style={{ borderBottom: i < transaksiList.length - 1 ? "1px solid rgba(159,110,245,0.08)" : "none" }}
                    onMouseEnter={e => (e.currentTarget.style.background = "rgba(159,110,245,0.05)")}
                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                  >
                    <td style={{ padding: "14px 24px", color: "#9b8ec4", fontSize: 13 }}>{i + 1}</td>
                    <td style={{ padding: "14px 24px", color: "#f0eaff", fontSize: 13 }}>{formatTanggal(t.tanggal)}</td>
                    <td style={{ padding: "14px 24px", color: "#f0eaff", fontSize: 13, fontWeight: 600 }}>{t.pelanggan}</td>
                    <td style={{ padding: "14px 24px", fontSize: 13, color: "#c4b5fd" }}>
                      {t.items.length === 0 ? (
                        <span style={{ color: "#9b8ec4" }}>-</span>
                      ) : (
                        t.items.map((it, idx) => (
                          <div key={idx} style={{ marginBottom: idx < t.items.length - 1 ? 4 : 0 }}>
                            {it.nama} <span style={{ color: "#9b8ec4" }}>({it.detail})</span>
                          </div>
                        ))
                      )}
                    </td>
                    <td style={{ padding: "14px 24px", fontSize: 12 }}>
                      <span style={{
                        display: "inline-flex", alignItems: "center", gap: 6,
                        padding: "4px 12px", borderRadius: 8,
                        background: t.lunas ? "rgba(74,222,128,0.12)" : "rgba(251,146,60,0.12)",
                        border: `1px solid ${t.lunas ? "rgba(74,222,128,0.3)" : "rgba(251,146,60,0.3)"}`,
                        color: t.lunas ? "#4ade80" : "#fb923c", fontWeight: 600,
                      }}>
                        {labelStatusBayar(t.status_bayar)}
                      </span>
                    </td>
                    <td style={{ padding: "14px 24px", color: "#4ade80", fontSize: 13, fontWeight: 700 }}>
                      {formatRupiah(t.total_harga)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ===================== BLOK KHUSUS CETAK ===================== */}
      {/* Disembunyikan dari layar lewat wrapper di luar (posisi off-screen),
          bukan display:none, supaya tetap ter-render saat dicetak.
          printRef HANYA menunjuk ke div di dalam, jadi style wrapper di luar
          ini tidak ikut ke-print. */}
      <div style={{ position: "fixed", top: -10000, left: -10000, zIndex: -1 }}>
        <div
          ref={printRef}
          style={{
            background: "#ffffff",
            color: "#111111",
            padding: 24,
            width: 900,
            fontFamily: "Arial, Helvetica, sans-serif",
          }}
        >
          <h2 style={{ margin: 0, fontSize: 18, color: "#111" }}>Laporan Pendapatan</h2>
          <p style={{ margin: "4px 0 20px", fontSize: 12, color: "#444" }}>
            Periode {periode === "bulanan" ? "Bulanan" : "Tahunan"} &nbsp;|&nbsp; {data?.dari} s/d {data?.sampai}
          </p>

          <h3 style={{ margin: "0 0 8px", fontSize: 13, color: "#111" }}>Ringkasan</h3>
          <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 24 }}>
            <thead>
              <tr>
                {["No", "Periode", "Jumlah Transaksi", "Total Pendapatan"].map(h => (
                  <th key={h} style={printThStyle}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(data?.data ?? []).map((row, i) => (
                <tr key={i}>
                  <td style={printTdStyle}>{i + 1}</td>
                  <td style={printTdStyle}>{row.label}</td>
                  <td style={printTdStyle}>{row.jumlah_transaksi}</td>
                  <td style={printTdStyle}>{formatRupiah(row.total_pendapatan)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={2} style={{ ...printTdStyle, fontWeight: 700 }}>TOTAL</td>
                <td style={{ ...printTdStyle, fontWeight: 700 }}>{data?.total_transaksi ?? 0}</td>
                <td style={{ ...printTdStyle, fontWeight: 700 }}>{formatRupiah(data?.total_pendapatan ?? 0)}</td>
              </tr>
            </tfoot>
          </table>

          <h3 style={{ margin: "0 0 8px", fontSize: 13, color: "#111" }}>Detail Transaksi</h3>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {["No", "Tanggal", "Pelanggan", "Rincian", "Status", "Total"].map(h => (
                  <th key={h} style={printThStyle}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {transaksiList.length === 0 ? (
                <tr>
                  <td style={printTdStyle} colSpan={6}>Tidak ada transaksi pada periode ini.</td>
                </tr>
              ) : (
                transaksiList.map((t, i) => (
                  <tr key={t.id_transaksi}>
                    <td style={printTdStyle}>{i + 1}</td>
                    <td style={printTdStyle}>{formatTanggal(t.tanggal)}</td>
                    <td style={printTdStyle}>{t.pelanggan}</td>
                    <td style={printTdStyle}>
                      {t.items.length === 0
                        ? "-"
                        : t.items.map(it => `${it.nama} (${it.detail})`).join(", ")}
                    </td>
                    <td style={printTdStyle}>{labelStatusBayar(t.status_bayar)}</td>
                    <td style={printTdStyle}>{formatRupiah(t.total_harga)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}