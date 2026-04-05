import type { Produk } from "@/lib/api";
import { formatRupiah } from "../lib/helpers";
import { emptyNoticeStyle, inputStyle, panelStyle, qtyBtnStyle } from "../lib/styles";
import type { CartItem } from "../lib/types";

export function ProductPicker({
  filteredProdukKasir,
  cart,
  productKeyword,
  onProductKeywordChange,
  onAddToCart,
  onChangeQty,
}: {
  filteredProdukKasir: Produk[];
  cart: CartItem[];
  productKeyword: string;
  onProductKeywordChange: (value: string) => void;
  onAddToCart: (produk: Produk) => void;
  onChangeQty: (id_produk: number, delta: number) => void;
}) {
  return (
    <div style={panelStyle}>
      <h3 style={{ margin: "0 0 14px", fontSize: 15, color: "#f0eaff" }}>Pilih Produk</h3>

      <input
        type="text"
        placeholder="Cari produk..."
        value={productKeyword}
        onChange={(e) => onProductKeywordChange(e.target.value)}
        style={{ ...inputStyle, marginBottom: 14 }}
      />

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
          gap: 10,
          marginBottom: 14,
          maxHeight: 220,
          overflowY: "auto",
        }}
      >
        {filteredProdukKasir.map((produk) => (
          <button
            key={produk.id_produk}
            onClick={() => onAddToCart(produk)}
            style={{
              textAlign: "left",
              padding: 12,
              borderRadius: 12,
              border: "1px solid rgba(159,110,245,0.15)",
              background: "rgba(255,255,255,0.03)",
              cursor: "pointer",
              color: "#f0eaff",
            }}
          >
            <div style={{ fontWeight: 700, fontSize: 13.5 }}>{produk.nama}</div>
            <div style={{ fontSize: 12, color: "#9b8ec4", marginTop: 4 }}>
              {produk.jenis} • Stock {produk.stock}
            </div>
            <div style={{ fontSize: 12.5, color: "#c9aff5", marginTop: 6 }}>
              {formatRupiah(produk.harga)}
            </div>
          </button>
        ))}
      </div>

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
                <div style={{ fontWeight: 700, fontSize: 13.5, color: "#f0eaff" }}>
                  {item.nama}
                </div>
                <div style={{ fontSize: 12, color: "#9b8ec4", marginTop: 4 }}>
                  {item.jenis} • {formatRupiah(item.harga)}
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <button onClick={() => onChangeQty(item.id_produk, -1)} style={qtyBtnStyle}>
                  -
                </button>
                <span style={{ minWidth: 24, textAlign: "center", color: "#f0eaff" }}>
                  {item.qty}
                </span>
                <button onClick={() => onChangeQty(item.id_produk, 1)} style={qtyBtnStyle}>
                  +
                </button>
              </div>

              <div
                style={{
                  minWidth: 120,
                  textAlign: "right",
                  color: "#c9aff5",
                  fontWeight: 600,
                }}
              >
                {formatRupiah(item.harga * item.qty)}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
