"use client";

import { useEffect, useMemo, useState } from "react";
import {
  type MonitoringPlaystation,
  type MonitoringTransaksi,
  type Pelanggan,
  type Produk,
  bayarTransaksi,
  createQrisPayment,
  checkQrisPaymentStatus,
  createTransaksi,
  getMonitoringPlaystation,
  getPelanggans,
  getProduk,
  selesaikanTransaksi,
  tambahProdukKeTransaksi,
  tambahWaktuTransaksi,
  type CreateTransaksiPayload,
} from "@/lib/api";
import {
  formatDateTimeLocal,
  getNormalizedStatusBayarLocal,
  hitungSubtotalSewaTampil,
  toLaravelDateTime,
} from "../lib/helpers";
import type {
  ActiveTab,
  CartItem,
  FilterStatus,
  MonitoringStats,
  ProductCategory,
  ToastState,
} from "../lib/types";

export function useMonitoringPage() {
  const [data, setData] = useState<MonitoringPlaystation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [selectedIdPs, setSelectedIdPs] = useState<number | null>(null);
  const [receiptData, setReceiptData] = useState<MonitoringTransaksi | null>(null);
  const [activeTab, setActiveTab] = useState<ActiveTab>("sewa");

  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("semua");
  const [toast, setToast] = useState<ToastState>(null);

  const [pelanggans, setPelanggans] = useState<Pelanggan[]>([]);
  const [produkList, setProdukList] = useState<Produk[]>([]);

  const [selectedUserId, setSelectedUserId] = useState("");
  const [jamMulai, setJamMulai] = useState(formatDateTimeLocal());
  const [durasiMenit, setDurasiMenit] = useState(60);
  const [menitTambahan, setMenitTambahan] = useState(30);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [productKeyword, setProductKeyword] = useState("");
  const [productCategory, setProductCategory] = useState<ProductCategory>("semua");

  const [submittingCreate, setSubmittingCreate] = useState(false);
  const [submittingTambahProduk, setSubmittingTambahProduk] = useState(false);
  const [submittingSelesai, setSubmittingSelesai] = useState(false);
  const [submittingTambahWaktu, setSubmittingTambahWaktu] = useState(false);
  const [submittingBayar, setSubmittingBayar] = useState(false);
  const [isMutating, setIsMutating] = useState(false);

  const [nowTick, setNowTick] = useState(Date.now());

  const [metodePembayaran, setMetodePembayaran] = useState<"cash" | "online">("cash");
  const [jumlahBayar, setJumlahBayar] = useState("");

  const [qrisUrl, setQrisUrl] = useState<string | null>(null);
  const [qrisExpiredAt, setQrisExpiredAt] = useState<string | null>(null);
  const [qrisOrderId, setQrisOrderId] = useState<string | null>(null);
  const [isCheckingQris, setIsCheckingQris] = useState(false);
  const [lastQrisStatus, setLastQrisStatus] = useState<string | null>(null);
  const [qrisPollingEnabled, setQrisPollingEnabled] = useState(false);

  const selected = useMemo(
    () => data.find((item) => item.id_ps === selectedIdPs) ?? null,
    [data, selectedIdPs]
  );

  const pembayaranAktif = selected?.active_transaksi?.pembayaran ?? null;
  const sudahLunas = getNormalizedStatusBayarLocal(selected?.active_transaksi ?? null) === "lunas";
  const totalAktif = Number(selected?.active_transaksi?.total_harga || 0);
  const nominalBayar =
    metodePembayaran === "online" ? totalAktif : Number(jumlahBayar || 0);
  const kembalianCash = Math.max(0, nominalBayar - totalAktif);

  const showToast = (msg: string, type: "success" | "error") => {
    setToast({ msg, type });
    window.setTimeout(() => setToast(null), 2500);
  };

  const applyUpdatedTransaksi = (updated: MonitoringTransaksi) => {
    setData((prev) =>
      prev.map((item) => {
        const isSamePs = updated.detail_sewa?.some(
          (sewa) => Number(sewa.id_ps) === Number(item.id_ps)
        );
        if (!isSamePs) return item;

        return {
          ...item,
          status_ps:
            updated.status_transaksi === "selesai" ? "tersedia" : "digunakan",
          active_transaksi:
            updated.status_transaksi === "selesai" ? null : updated,
        };
      })
    );
  };

  const fetchAll = async (opts?: { silent?: boolean }) => {
    const silent = opts?.silent ?? false;

    if (silent) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const res = await getMonitoringPlaystation();
      setData(res);

      if (selectedIdPs !== null && !res.some((item) => item.id_ps === selectedIdPs)) {
        setSelectedIdPs(null);
      }

      return res;
    } catch (e) {
      if (!silent) {
        showToast(
          e instanceof Error ? e.message : "Gagal memuat monitoring.",
          "error"
        );
      }
      return null;
    } finally {
      if (silent) {
        setRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  };

  const fetchMasterData = async () => {
    try {
      const [pelangganRes, produkRes] = await Promise.all([
        getPelanggans({ all: true }),
        getProduk(),
      ]);

      setPelanggans(pelangganRes.data ?? []);
      setProdukList(produkRes ?? []);
    } catch {
      // silent
    }
  };

  useEffect(() => {
    void fetchAll();
    void fetchMasterData();
  }, []);

  useEffect(() => {
    const id = window.setInterval(() => {
      setNowTick(Date.now());
    }, 1000);

    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    const id = window.setInterval(() => {
      if (!isMutating) {
        void fetchAll({ silent: true });
      }
    }, 10000);

    return () => window.clearInterval(id);
  }, [isMutating, selectedIdPs]);

  useEffect(() => {
    if (!qrisPollingEnabled || !selected?.active_transaksi || !qrisUrl) return;

    const interval = window.setInterval(() => {
      void syncQrisStatus(false);
    }, 5000);

    return () => window.clearInterval(interval);
  }, [qrisPollingEnabled, selected?.active_transaksi?.id_transaksi, qrisUrl]);

  const openModal = (item: MonitoringPlaystation) => {
    if (isMutating) return;

    setSelectedIdPs(item.id_ps);
    setActiveTab("sewa");
    setSelectedUserId("");
    setJamMulai(formatDateTimeLocal());
    setDurasiMenit(60);
    setMenitTambahan(30);
    setCart([]);
    setProductKeyword("");
    setProductCategory("semua");
    setMetodePembayaran("cash");
    setJumlahBayar("");
    setQrisUrl(null);
    setQrisExpiredAt(null);
    setQrisOrderId(null);
    setQrisPollingEnabled(false);
    setLastQrisStatus(null);
  };

  const closeModal = () => {
    if (isMutating) return;

    setSelectedIdPs(null);
    setCart([]);
    setProductKeyword("");
    setProductCategory("semua");
    setJumlahBayar("");
    setMetodePembayaran("cash");
    setQrisUrl(null);
    setQrisExpiredAt(null);
    setQrisOrderId(null);
    setQrisPollingEnabled(false);
    setLastQrisStatus(null);
  };

  const filteredData = useMemo(() => {
    return data.filter((item) => {
      const keyword = search.toLowerCase();

      const matchSearch =
        !keyword ||
        item.nomor_ps.toLowerCase().includes(keyword) ||
        item.tipe?.nama_tipe.toLowerCase().includes(keyword);

      const matchStatus = filterStatus === "semua" || item.status_ps === filterStatus;

      return matchSearch && matchStatus;
    });
  }, [data, filterStatus, search]);

  const stats: MonitoringStats = useMemo(
    () => ({
      total: data.length,
      tersedia: data.filter((d) => d.status_ps === "tersedia").length,
      digunakan: data.filter((d) => d.status_ps === "digunakan").length,
      maintenance: data.filter((d) => d.status_ps === "maintenance").length,
    }),
    [data]
  );

  const rentalSubtotal = selected?.tipe
    ? hitungSubtotalSewaTampil(selected.tipe.harga_sewa, durasiMenit)
    : 0;

  const produkSubtotal = useMemo(
    () => cart.reduce((sum, item) => sum + item.harga * item.qty, 0),
    [cart]
  );

  const grandTotal = rentalSubtotal + produkSubtotal;

  const filteredProdukKasir = useMemo(() => {
    const q = productKeyword.toLowerCase();

    return produkList.filter((p) => {
      if (p.stock <= 0) return false;

      const matchKeyword =
        !q || p.nama.toLowerCase().includes(q) || p.jenis.toLowerCase().includes(q);

      const matchCategory =
        productCategory === "semua" ||
        p.jenis.toLowerCase() === productCategory;

      return matchKeyword && matchCategory;
    });
  }, [produkList, productKeyword, productCategory]);

  const addToCart = (produk: Produk) => {
    if (isMutating) return;

    setCart((prev) => {
      const existing = prev.find((item) => item.id_produk === produk.id_produk);

      if (existing) {
        if (existing.qty >= produk.stock) return prev;

        return prev.map((item) =>
          item.id_produk === produk.id_produk
            ? { ...item, qty: item.qty + 1 }
            : item
        );
      }

      return [
        ...prev,
        {
          id_produk: produk.id_produk,
          nama: produk.nama,
          jenis: produk.jenis,
          harga: produk.harga,
          qty: 1,
        },
      ];
    });
  };

  const changeQty = (id_produk: number, delta: number) => {
    if (isMutating) return;

    setCart((prev) =>
      prev
        .map((item) =>
          item.id_produk === id_produk ? { ...item, qty: item.qty + delta } : item
        )
        .filter((item) => item.qty > 0)
    );
  };

  const handleCreateTransaksi = async () => {
    if (!selected || isMutating) return;

    if (!selectedUserId) {
      showToast("Pilih pelanggan terlebih dahulu.", "error");
      return;
    }

    if (durasiMenit < 1) {
      showToast("Durasi minimal 1 menit.", "error");
      return;
    }

    setIsMutating(true);
    setSubmittingCreate(true);

    try {
      const payload: CreateTransaksiPayload = {
        id_user: Number(selectedUserId),
        sumber_transaksi: "admin",
        sewa: [
          {
            id_ps: selected.id_ps,
            jam_mulai: toLaravelDateTime(jamMulai),
            durasi_menit: durasiMenit,
            durasi_jam: Math.max(1, Math.ceil(durasiMenit / 60)),
          },
        ],
        produk: cart.map((item) => ({
          id_produk: item.id_produk,
          qty: item.qty,
        })),
      };

      await createTransaksi(payload);
      await fetchAll({ silent: true });

      showToast("Transaksi berhasil dibuat.", "success");
      setActiveTab("sewa");
      setCart([]);
      setProductKeyword("");
      setProductCategory("semua");
      setJumlahBayar("");
      setMetodePembayaran("cash");
    } catch (e) {
      showToast(
        e instanceof Error ? e.message : "Gagal membuat transaksi.",
        "error"
      );
    } finally {
      setSubmittingCreate(false);
      setIsMutating(false);
    }
  };

  const handleTambahProduk = async () => {
    if (isMutating) return;

    if (!selected?.active_transaksi || cart.length === 0) {
      showToast("Tambahkan produk terlebih dahulu.", "error");
      return;
    }

    if (getNormalizedStatusBayarLocal(selected.active_transaksi) === "lunas") {
      showToast("Transaksi yang sudah lunas tidak bisa diubah.", "error");
      return;
    }

    setIsMutating(true);
    setSubmittingTambahProduk(true);

    try {
      const updated = await tambahProdukKeTransaksi(selected.active_transaksi.id_transaksi, {
        produk: cart.map((item) => ({
          id_produk: item.id_produk,
          qty: item.qty,
        })),
      });

      applyUpdatedTransaksi(updated);
      await fetchAll({ silent: true });

      showToast("Produk berhasil ditambahkan.", "success");
      setCart([]);
      setProductKeyword("");
      setProductCategory("semua");
      setActiveTab("produk");
    } catch (e) {
      showToast(
        e instanceof Error ? e.message : "Gagal menambahkan produk.",
        "error"
      );
    } finally {
      setSubmittingTambahProduk(false);
      setIsMutating(false);
    }
  };

  const handleTambahWaktu = async () => {
    if (!selected?.active_transaksi || isMutating) return;

    if (getNormalizedStatusBayarLocal(selected.active_transaksi) === "lunas") {
      showToast("Transaksi yang sudah lunas tidak bisa diubah.", "error");
      return;
    }

    setIsMutating(true);
    setSubmittingTambahWaktu(true);

    try {
      const updated = await tambahWaktuTransaksi(selected.active_transaksi.id_transaksi, {
        menit_tambahan: menitTambahan,
        id_ps: selected.id_ps,
      });

      applyUpdatedTransaksi(updated);
      await fetchAll({ silent: true });

      showToast("Waktu sewa berhasil ditambahkan.", "success");
      setActiveTab("sewa");
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Gagal menambah waktu.", "error");
    } finally {
      setSubmittingTambahWaktu(false);
      setIsMutating(false);
    }
  };

  const handleBayar = async () => {
    if (!selected?.active_transaksi || isMutating) return;

    if (sudahLunas) {
      showToast("Transaksi ini sudah lunas.", "success");
      return;
    }

    if (metodePembayaran === "cash" && nominalBayar < totalAktif) {
      showToast("Nominal pembayaran cash kurang dari total tagihan.", "error");
      return;
    }

    setIsMutating(true);
    setSubmittingBayar(true);

    try {
      if (metodePembayaran === "cash") {
        const updated = await bayarTransaksi(selected.active_transaksi.id_transaksi, {
          metode_pembayaran: "cash",
          total_bayar: nominalBayar,
        });

        applyUpdatedTransaksi(updated);
        await fetchAll({ silent: true });
        showToast("Pembayaran cash berhasil disimpan.", "success");
        setActiveTab("pembayaran");
      } else {
        const result = await createQrisPayment(selected.active_transaksi.id_transaksi);

        const payment = result?.data?.payment ?? null;
        const midtrans = result?.data?.midtrans ?? null;

        const actions = Array.isArray(midtrans?.actions) ? midtrans.actions : [];
        const generateQrAction = actions.find(
          (item: any) => item?.name === "generate-qr-code"
        );

        const resolvedQrUrl = payment?.qr_url ?? generateQrAction?.url ?? null;
        const resolvedExpiredAt = payment?.expired_at ?? midtrans?.expiry_time ?? null;
        const resolvedOrderId = payment?.provider_order_id ?? midtrans?.order_id ?? null;

        setQrisUrl(resolvedQrUrl);
        setQrisExpiredAt(resolvedExpiredAt);
        setQrisOrderId(resolvedOrderId);
        setQrisPollingEnabled(true);
        setLastQrisStatus("pending");

        showToast("QRIS berhasil dibuat.", "success");
        setActiveTab("pembayaran");
      }
    } catch (e) {
      showToast(
        e instanceof Error ? e.message : "Gagal memproses pembayaran.",
        "error"
      );
    } finally {
      setSubmittingBayar(false);
      setIsMutating(false);
    }
  };

  const syncQrisStatus = async (showToastOnSuccess = false) => {
    if (!selected?.active_transaksi) return;

    const idTransaksi = selected.active_transaksi.id_transaksi;

    try {
      setIsCheckingQris(true);

      const result = await checkQrisPaymentStatus(idTransaksi);
      const updatedTransaksi = result?.data?.transaksi ?? null;
      const payment = result?.data?.payment ?? null;
      const midtrans = result?.data?.midtrans ?? null;

      if (updatedTransaksi) {
        applyUpdatedTransaksi(updatedTransaksi);
        await fetchAll({ silent: true });
      }

      const statusBayar =
        (payment?.status_bayar ?? updatedTransaksi?.pembayaran?.status_bayar ?? "").toLowerCase();

      const providerStatus =
        (
          payment?.provider_transaction_status ??
          updatedTransaksi?.pembayaran?.provider_transaction_status ??
          midtrans?.transaction_status ??
          ""
        ).toLowerCase();

      setLastQrisStatus(providerStatus || statusBayar || null);

      if (
        statusBayar === "lunas" ||
        providerStatus === "settlement" ||
        providerStatus === "capture"
      ) {
        setQrisPollingEnabled(false);
        showToast("Pembayaran QRIS sudah lunas.", "success");
        return;
      }

      if (
        ["gagal", "deny", "cancel", "expire", "failure"].includes(statusBayar) ||
        ["deny", "cancel", "expire", "failure"].includes(providerStatus)
      ) {
        setQrisPollingEnabled(false);
        showToast("Pembayaran QRIS gagal atau kadaluarsa.", "error");
        return;
      }

      if (showToastOnSuccess) {
        showToast("Status QRIS berhasil diperbarui.", "success");
      }
    } catch (e) {
      if (showToastOnSuccess) {
        showToast(
          e instanceof Error ? e.message : "Gagal mengecek status QRIS.",
          "error"
        );
      }
    } finally {
      setIsCheckingQris(false);
    }
  };

  const handleSelesaikan = async () => {
    if (!selected?.active_transaksi || isMutating) return;

    if (getNormalizedStatusBayarLocal(selected.active_transaksi) !== "lunas") {
      showToast("Selesaikan transaksi setelah pembayaran lunas.", "error");
      return;
    }

    setIsMutating(true);
    setSubmittingSelesai(true);

    try {
      const result = await selesaikanTransaksi(selected.active_transaksi.id_transaksi);

      setReceiptData(result);
      await fetchAll({ silent: true });

      showToast("Transaksi berhasil diselesaikan.", "success");
      setSelectedIdPs(null);
      setCart([]);
      setProductKeyword("");
      setProductCategory("semua");
      setJumlahBayar("");
      setMetodePembayaran("cash");
    } catch (e) {
      showToast(
        e instanceof Error ? e.message : "Gagal menyelesaikan transaksi.",
        "error"
      );
    } finally {
      setSubmittingSelesai(false);
      setIsMutating(false);
    }
  };

  return {
    data,
    loading,
    refreshing,
    selected,
    receiptData,
    activeTab,
    search,
    filterStatus,
    toast,
    pelanggans,
    selectedUserId,
    jamMulai,
    durasiMenit,
    menitTambahan,
    cart,
    productKeyword,
    productCategory,
    submittingCreate,
    submittingTambahProduk,
    submittingSelesai,
    submittingTambahWaktu,
    nowTick,
    filteredData,
    stats,
    rentalSubtotal,
    produkSubtotal,
    grandTotal,
    filteredProdukKasir,
    setReceiptData,
    setActiveTab,
    setSearch,
    setFilterStatus,
    setSelectedUserId,
    setJamMulai,
    setDurasiMenit,
    setMenitTambahan,
    setProductKeyword,
    setProductCategory,
    fetchAll,
    openModal,
    closeModal,
    addToCart,
    changeQty,
    handleCreateTransaksi,
    handleTambahProduk,
    handleTambahWaktu,
    handleSelesaikan,
    handleBayar,
    metodePembayaran,
    setMetodePembayaran,
    jumlahBayar,
    setJumlahBayar,
    submittingBayar,
    pembayaranAktif,
    sudahLunas,
    totalAktif,
    nominalBayar,
    kembalianCash,
    isMutating,
    qrisUrl,
    qrisExpiredAt,
    qrisOrderId,
    syncQrisStatus,
    isCheckingQris,
    lastQrisStatus,
  };
}