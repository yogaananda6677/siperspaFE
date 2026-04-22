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


export type QrisPaymentData = {
  provider?: string | null;
  provider_order_id?: string | null;
  provider_transaction_id?: string | null;
  provider_payment_type?: string | null;
  provider_transaction_status?: string | null;
  qr_url?: string | null;
  qr_string?: string | null;
  expired_at?: string | null;
  status_bayar?: string | null;
  total_bayar?: number | string | null;
};