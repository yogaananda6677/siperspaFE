"use client";

import { useEffect, useMemo, useState } from "react";
import {
  type MonitoringDetailSewa,
  type MonitoringPlaystation,
  type MonitoringTransaksi,
  type Pelanggan,
  type Produk,
  bayarTransaksi,
  createTransaksi,
  getMonitoringPlaystation,
  getPelanggans,
  getProduk,
  selesaikanTransaksi,
  tambahProdukKeTransaksi,
  tambahWaktuTransaksi,
} from "@/lib/api";
import { formatDateTimeLocal, hitungSubtotalSewaTampil , toLaravelDateTime} from "../lib/helpers";
import type {
  ActiveTab,
  CartItem,
  FilterStatus,
  MonitoringStats,
  ToastState,
} from "../lib/types";



export function useMonitoringPage() {
  const [data, setData] = useState<MonitoringPlaystation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [selected, setSelected] = useState<MonitoringPlaystation | null>(null);
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

  const [submittingCreate, setSubmittingCreate] = useState(false);
  const [submittingTambahProduk, setSubmittingTambahProduk] = useState(false);
  const [submittingSelesai, setSubmittingSelesai] = useState(false);
  const [submittingTambahWaktu, setSubmittingTambahWaktu] = useState(false);

  const [nowTick, setNowTick] = useState(Date.now());
  const [metodePembayaran, setMetodePembayaran] = useState<"cash" | "online">("cash");
const [jumlahBayar, setJumlahBayar] = useState("");
const [submittingBayar, setSubmittingBayar] = useState(false);
const pembayaranAktif = selected?.active_transaksi?.pembayaran ?? null;
const sudahLunas = pembayaranAktif?.status_bayar === "lunas";
const totalAktif = Number(selected?.active_transaksi?.total_harga || 0);
const nominalBayar = Number(jumlahBayar || 0);
const kembalianCash = Math.max(0, nominalBayar - totalAktif);


  const showToast = (msg: string, type: "success" | "error") => {
    setToast({ msg, type });
    window.setTimeout(() => setToast(null), 2500);
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

      setSelected((prev) => {
        if (!prev) return prev;
        return res.find((item) => item.id_ps === prev.id_ps) ?? null;
      });

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
      void fetchAll({ silent: true });
    }, 5000);

    return () => window.clearInterval(id);
  }, []);

  const openModal = (item: MonitoringPlaystation) => {
    setSelected(item);
    setActiveTab("sewa");
    setSelectedUserId("");
    setJamMulai(formatDateTimeLocal());
    setDurasiMenit(60);
    setMenitTambahan(30);
    setCart([]);
    setProductKeyword("");
  };

  const closeModal = () => {
    setSelected(null);
    setCart([]);
    setProductKeyword("");
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

    return produkList.filter(
      (p) =>
        p.stock > 0 &&
        (!q || p.nama.toLowerCase().includes(q) || p.jenis.toLowerCase().includes(q))
    );
  }, [produkList, productKeyword]);

  const addToCart = (produk: Produk) => {
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
    setCart((prev) =>
      prev
        .map((item) =>
          item.id_produk === id_produk ? { ...item, qty: item.qty + delta } : item
        )
        .filter((item) => item.qty > 0)
    );
  };

  const syncSelectedTransaksi = (updatedTransaksi: MonitoringTransaksi, idPs: number) => {
    setData((prev) =>
      prev.map((item) =>
        item.id_ps === idPs
          ? {
              ...item,
              status_ps:
                updatedTransaksi.status_transaksi === "selesai"
                  ? "tersedia"
                  : "digunakan",
              active_transaksi:
                updatedTransaksi.status_transaksi === "selesai"
                  ? null
                  : updatedTransaksi,
            }
          : item
      )
    );

    setSelected((prev) => {
      if (!prev || prev.id_ps !== idPs) return prev;

      return {
        ...prev,
        status_ps:
          updatedTransaksi.status_transaksi === "selesai" ? "tersedia" : "digunakan",
        active_transaksi:
          updatedTransaksi.status_transaksi === "selesai" ? null : updatedTransaksi,
      };
    });
  };

  const handleCreateTransaksi = async () => {
    if (!selected) return;

    if (!selectedUserId) {
      showToast("Pilih pelanggan terlebih dahulu.", "error");
      return;
    }

    if (durasiMenit < 1) {
      showToast("Durasi minimal 1 menit.", "error");
      return;
    }

    setSubmittingCreate(true);

    try {
      const payload = {
        id_user: Number(selectedUserId),
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

      const created = await createTransaksi(payload);

      showToast("Transaksi berhasil dibuat.", "success");
      syncSelectedTransaksi(created, selected.id_ps);
      setActiveTab("sewa");
      setCart([]);
      setProductKeyword("");

      await fetchAll({ silent: true });
    } catch (e) {
      showToast(
        e instanceof Error ? e.message : "Gagal membuat transaksi.",
        "error"
      );
    } finally {
      setSubmittingCreate(false);
    }
  };

  const handleTambahProduk = async () => {
    if (!selected?.active_transaksi || cart.length === 0) {
      showToast("Tambahkan produk terlebih dahulu.", "error");
      return;
    }
    
    if (selected.active_transaksi?.pembayaran?.status_bayar === "lunas") {
    showToast("Transaksi yang sudah lunas tidak bisa diubah.", "error");
    return;
    }

    setSubmittingTambahProduk(true);

    try {
      const updated = await tambahProdukKeTransaksi(selected.active_transaksi.id_transaksi, {
        produk: cart.map((item) => ({
          id_produk: item.id_produk,
          qty: item.qty,
        })),
      });

      showToast("Produk berhasil ditambahkan.", "success");
      syncSelectedTransaksi(updated, selected.id_ps);
      setCart([]);
      setProductKeyword("");
      setActiveTab("produk");

      await fetchAll({ silent: true });
    } catch (e) {
      showToast(
        e instanceof Error ? e.message : "Gagal menambahkan produk.",
        "error"
      );
    } finally {
      setSubmittingTambahProduk(false);
    }
  };

  const handleTambahWaktu = async () => {
    if (!selected?.active_transaksi) return;

    if (selected.active_transaksi?.pembayaran?.status_bayar === "lunas") {
    showToast("Transaksi yang sudah lunas tidak bisa diubah.", "error");
    return;
    }

    setSubmittingTambahWaktu(true);

    try {
      const updated = await tambahWaktuTransaksi(selected.active_transaksi.id_transaksi, {
        menit_tambahan: menitTambahan,
        id_ps: selected.id_ps,
      });

      showToast("Waktu sewa berhasil ditambahkan.", "success");
      syncSelectedTransaksi(updated, selected.id_ps);
      setActiveTab("sewa");

      await fetchAll({ silent: true });
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Gagal menambah waktu.", "error");
    } finally {
      setSubmittingTambahWaktu(false);
    }
  };
  const handleBayar = async () => {
  if (!selected?.active_transaksi) return;

  if (sudahLunas) {
    showToast("Transaksi ini sudah lunas.", "success");
    return;
  }

  if (metodePembayaran === "cash" && nominalBayar < totalAktif) {
    showToast("Nominal pembayaran cash kurang dari total tagihan.", "error");
    return;
  }

  setSubmittingBayar(true);

  try {
    const updated = await bayarTransaksi(selected.active_transaksi.id_transaksi, {
      metode_pembayaran: metodePembayaran,
      total_bayar: metodePembayaran === "cash" ? nominalBayar : totalAktif,
    });

    showToast("Pembayaran berhasil disimpan.", "success");
    syncSelectedTransaksi(updated, selected.id_ps);
    setActiveTab("pembayaran");

    await fetchAll({ silent: true });
  } catch (e) {
    showToast(e instanceof Error ? e.message : "Gagal menyimpan pembayaran.", "error");
  } finally {
    setSubmittingBayar(false);
  }
};

  const handleSelesaikan = async () => {
    if (!selected?.active_transaksi) return;
    if (selected.active_transaksi.pembayaran?.status_bayar !== "lunas") {
  showToast("Selesaikan transaksi setelah pembayaran lunas.", "error");
  return;
}

    setSubmittingSelesai(true);

    try {
      const result = await selesaikanTransaksi(selected.active_transaksi.id_transaksi);

      showToast("Transaksi berhasil diselesaikan.", "success");
      setReceiptData(result);
      syncSelectedTransaksi(result, selected.id_ps);
      closeModal();

      await fetchAll({ silent: true });
    } catch (e) {
      showToast(
        e instanceof Error ? e.message : "Gagal menyelesaikan transaksi.",
        "error"
      );
    } finally {
      setSubmittingSelesai(false);
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
  };
}
