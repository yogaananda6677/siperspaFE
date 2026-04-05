export type ActiveTab = "sewa" | "produk" | "pembayaran";

export type FilterStatus =
  | "semua"
  | "tersedia"
  | "digunakan"
  | "maintenance";

export type ToastState = {
  msg: string;
  type: "success" | "error";
} | null;

export type CartItem = {
  id_produk: number;
  nama: string;
  jenis: string;
  harga: number;
  qty: number;
};

export type MonitoringStats = {
  total: number;
  tersedia: number;
  digunakan: number;
  maintenance: number;
};
