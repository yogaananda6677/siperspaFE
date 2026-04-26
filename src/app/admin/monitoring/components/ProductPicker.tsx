import { useEffect, useMemo, useState } from "react";
import type { Produk } from "@/lib/api";
import { formatRupiah } from "../lib/helpers";
import { emptyNoticeStyle, inputStyle, panelStyle, qtyBtnStyle } from "../lib/styles";
import type { CartItem } from "../lib/types";

type ProductCategory = "makanan" | "minuman" | "snack";

export function ProductPicker({
  filteredProdukKasir,
  cart,
  onAddToCart,
  onChangeQty,
  disabled = false,
}: {
  filteredProdukKasir: Produk[];
  cart: CartItem[];
  productKeyword?: string;
  productCategory?: string;
  onProductKeywordChange?: (value: string) => void;
  onProductCategoryChange?: (value: string) => void;
  onAddToCart: (produk: Produk) => void;
  onChangeQty: (id_produk: number, delta: number) => void;
  disabled?: boolean;
}) {
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory>("makanan");
  const [selectedProdukId, setSelectedProdukId] = useState<string>("");

  const kategoriOptions: ProductCategory[] = ["makanan", "minuman", "snack"];

  const produkByCategory = useMemo(() => {
    return filteredProdukKasir.filter((produk) => {
      const jenis = String(produk.jenis ?? "").toLowerCase().trim();
      return jenis === selectedCategory;
    });
  }, [filteredProdukKasir, selectedCategory]);

  useEffect(() => {
    if (!produkByCategory.some((item) => String(item.id_produk) === selectedProdukId)) {
      setSelectedProdukId("");
    }
  }, [produkByCategory, selectedProdukId]);

  const selectedProduk = useMemo(() => {
    return produkByCategory.find((item) => String(item.id_produk) === selectedProdukId) ?? null;
  }, [produkByCategory, selectedProdukId]);

  const handleChooseProduk = (value: string) => {
    setSelectedProdukId(value);
    const produk = produkByCategory.find((item) => String(item.id_produk) === value);
    if (produk && !disabled) {
      onAddToCart(produk);
      setSelectedProdukId("");
    }
  };

  return (
    <div style={panelStyle}>
      <h3 style={{ margin: "0 0 14px", fontSize: 15, color: "#f0eaff" }}>Pilih Produk</h3>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "200px 1fr",
          gap: 10,
          marginBottom: 14,
        }}
      >
        <div>
          <label style={{ display: "block", color: "#9b8ec4", fontSize: 12, marginBottom: 6 }}>
            Kategori
          </label>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value as ProductCategory)}
            style={inputStyle}
            disabled={disabled}
          >
            {kategoriOptions.map((kategori) => (
              <option key={kategori} value={kategori}>
                {kategori.charAt(0).toUpperCase() + kategori.slice(1)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label style={{ display: "block", color: "#9b8ec4", fontSize: 12, marginBottom: 6 }}>
            Produk
          </label>
          <select
            value={selectedProdukId}
            onChange={(e) => handleChooseProduk(e.target.value)}
            style={inputStyle}
            disabled={disabled || produkByCategory.length === 0}
          >
            <option value="">Pilih produk untuk langsung ditambahkan...</option>
            {produkByCategory.map((produk) => (
              <option key={produk.id_produk} value={produk.id_produk}>
                {produk.nama} • stok {produk.stock} • {formatRupiah(produk.harga)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {produkByCategory.length === 0 ? (
        <div style={{ ...emptyNoticeStyle, marginBottom: 14 }}>
          Tidak ada produk pada kategori ini.
        </div>
      ) : selectedProduk ? (
        <div
          style={{
            marginBottom: 14,
            padding: 12,
            borderRadius: 12,
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(159,110,245,0.12)",
          }}
        >
          <div style={{ fontWeight: 700, fontSize: 13.5, color: "#f0eaff" }}>
            {selectedProduk.nama}
          </div>
          <div style={{ fontSize: 12, color: "#9b8ec4", marginTop: 4 }}>
            {selectedProduk.jenis} • stok {selectedProduk.stock}
          </div>
          <div style={{ fontSize: 12, color: "#c9aff5", marginTop: 4 }}>
            {formatRupiah(selectedProduk.harga)}
          </div>
        </div>
      ) : null}

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {cart.length === 0 ? (
          <div style={emptyNoticeStyle}>Belum ada produk dipilih.</div>
        ) : (
          cart.map((item) => (
            <div
              key={item.id_produk}
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 12,
                alignItems: "center",
                padding: 12,
                borderRadius: 12,
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(159,110,245,0.12)",
                flexWrap: "wrap",
              }}
            >
              <div>
                <div style={{ fontWeight: 700, fontSize: 13.5, color: "#f0eaff" }}>{item.nama}</div>
                <div style={{ fontSize: 12, color: "#9b8ec4", marginTop: 4 }}>
                  {item.jenis} • {formatRupiah(item.harga)}
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <button
                  type="button"
                  onClick={() => onChangeQty(item.id_produk, -1)}
                  style={{ ...qtyBtnStyle, opacity: disabled ? 0.6 : 1, cursor: disabled ? "not-allowed" : "pointer" }}
                  disabled={disabled}
                >
                  -
                </button>

                <span style={{ minWidth: 24, textAlign: "center", color: "#f0eaff" }}>{item.qty}</span>

                <button
                  type="button"
                  onClick={() => onChangeQty(item.id_produk, 1)}
                  style={{ ...qtyBtnStyle, opacity: disabled ? 0.6 : 1, cursor: disabled ? "not-allowed" : "pointer" }}
                  disabled={disabled}
                >
                  +
                </button>
              </div>

              <div style={{ minWidth: 120, textAlign: "right", color: "#c9aff5", fontWeight: 600 }}>
                {formatRupiah(item.harga * item.qty)}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
