import type { MonitoringTransaksi, TransaksiData } from "@/lib/api";

type AnyTransaksi = MonitoringTransaksi | TransaksiData | null | undefined;

export function getNormalizedStatusBayar(transaksi: AnyTransaksi) {
  const raw = transaksi?.pembayaran?.status_bayar ?? "";
  const value = raw.toString().trim().toLowerCase();

  if (value === "menuggu") return "menunggu";
  if (value === "paid") return "lunas";
  if (value === "success") return "lunas";

  return value;
}

export function isLunas(transaksi: AnyTransaksi) {
  return getNormalizedStatusBayar(transaksi) === "lunas";
}

export function isTransaksiAktif(transaksi: AnyTransaksi) {
  return (transaksi?.status_transaksi ?? "").toString().trim().toLowerCase() === "aktif";
}

export function isTransaksiSelesai(transaksi: AnyTransaksi) {
  return (transaksi?.status_transaksi ?? "").toString().trim().toLowerCase() === "selesai";
}

export function isTransaksiBatal(transaksi: AnyTransaksi) {
  return (transaksi?.status_transaksi ?? "").toString().trim().toLowerCase() === "batal";
}

export function canBayarTransaksi(transaksi: AnyTransaksi) {
  if (!transaksi) return false;
  if (!isTransaksiAktif(transaksi) && (transaksi?.status_transaksi ?? "") !== "menunggu pembayaran") {
    return false;
  }
  if (isTransaksiSelesai(transaksi)) return false;
  if (isTransaksiBatal(transaksi)) return false;
  if (isLunas(transaksi)) return false;
  return true;
}

export function canSelesaikanTransaksi(transaksi: AnyTransaksi) {
  if (!transaksi) return false;
  if (!isTransaksiAktif(transaksi)) return false;
  if (isTransaksiSelesai(transaksi)) return false;
  if (isTransaksiBatal(transaksi)) return false;
  return isLunas(transaksi);
}