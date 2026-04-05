import type { MonitoringTransaksi } from "@/lib/api";
import {
  formatDateTime,
  formatDurasiMenit,
  formatRupiah,
  getDetailProdukKey,
  getDetailSewaKey,
  getDurasiMenit,
  printReceipt,
} from "../lib/helpers";
import {
  closeBtnStyle,
  emptyNoticeStyle,
  itemCardStyle,
  miniBoxStyle,
  miniLabelStyle,
  miniValueStyle,
  modalStyle,
  overlayStyle,
  panelStyle,
  primaryBtnStyle,
  receiptRowStyle,
  secondaryBtnStyle,
} from "../lib/styles";

export function ReceiptModal({
  transaksi,
  onClose,
}: {
  transaksi: MonitoringTransaksi;
  onClose: () => void;
}) {
  const totalSewa = transaksi.detail_sewa.reduce(
    (sum, item) => sum + Number(item.subtotal || 0),
    0
  );

  const totalProduk = transaksi.detail_produk.reduce(
    (sum, item) => sum + Number(item.subtotal || 0),
    0
  );

  return (
    <div onClick={onClose} style={overlayStyle}>
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ ...modalStyle, width: "min(760px, 100%)" }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 12,
            alignItems: "flex-start",
            marginBottom: 20,
          }}
        >
          <div>
            <h2
              style={{
                margin: 0,
                fontSize: 20,
                fontWeight: 700,
                color: "#f0eaff",
              }}
            >
              Struk Transaksi #{transaksi.id_transaksi}
            </h2>
            <p style={{ margin: "6px 0 0", fontSize: 13, color: "#9b8ec4" }}>
              {formatDateTime(transaksi.tanggal)} • {transaksi.user?.name ?? "-"}
            </p>
          </div>

          <button onClick={onClose} style={closeBtnStyle}>
            ×
          </button>
        </div>

        <div style={panelStyle}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, 1fr)",
              gap: 12,
              marginBottom: 14,
            }}
          >
            <div style={miniBoxStyle}>
              <div style={miniLabelStyle}>Pelanggan</div>
              <div style={miniValueStyle}>{transaksi.user?.name ?? "-"}</div>
            </div>

            <div style={miniBoxStyle}>
              <div style={miniLabelStyle}>Username</div>
              <div style={miniValueStyle}>{transaksi.user?.username ?? "-"}</div>
            </div>

            <div style={miniBoxStyle}>
              <div style={miniLabelStyle}>Status Transaksi</div>
              <div style={miniValueStyle}>{transaksi.status_transaksi}</div>
            </div>

            <div style={miniBoxStyle}>
              <div style={miniLabelStyle}>Tanggal</div>
              <div style={miniValueStyle}>{formatDateTime(transaksi.tanggal)}</div>
            </div>
          </div>

          <h3 style={{ margin: "0 0 10px", color: "#f0eaff", fontSize: 15 }}>
            Detail Sewa
          </h3>

          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>
            {transaksi.detail_sewa.length === 0 ? (
              <div style={emptyNoticeStyle}>Tidak ada item sewa.</div>
            ) : (
              transaksi.detail_sewa.map((item, index) => (
                <div key={getDetailSewaKey(item, index)} style={itemCardStyle}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#f0eaff" }}>
                    {item.playstation?.nomor_ps ?? "-"} •{" "}
                    {item.playstation?.tipe?.nama_tipe ?? item.tipe_ps ?? "-"}
                  </div>

                  <div style={{ fontSize: 12.5, color: "#9b8ec4", marginTop: 6 }}>
                    Jam mulai: {formatDateTime(item.jam_mulai)}
                  </div>

                  <div style={{ fontSize: 12.5, color: "#9b8ec4", marginTop: 2 }}>
                    Jam selesai: {formatDateTime(item.jam_selesai)}
                  </div>

                  <div style={{ fontSize: 12.5, color: "#9b8ec4", marginTop: 2 }}>
                    Durasi: {formatDurasiMenit(getDurasiMenit(item))}
                  </div>

                  <div style={{ fontSize: 12.5, color: "#c9aff5", marginTop: 8 }}>
                    Subtotal: {formatRupiah(Number(item.subtotal || 0))}
                  </div>
                </div>
              ))
            )}
          </div>

          <h3 style={{ margin: "0 0 10px", color: "#f0eaff", fontSize: 15 }}>
            Detail Produk
          </h3>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {transaksi.detail_produk.length === 0 ? (
              <div style={emptyNoticeStyle}>Tidak ada produk tambahan.</div>
            ) : (
              transaksi.detail_produk.map((item, index) => (
                <div key={getDetailProdukKey(item, index)} style={itemCardStyle}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#f0eaff" }}>
                    {item.produk?.nama ?? "-"}
                  </div>

                  <div style={{ fontSize: 12.5, color: "#9b8ec4", marginTop: 6 }}>
                    Qty: {item.qty}
                  </div>

                  <div style={{ fontSize: 12.5, color: "#c9aff5", marginTop: 8 }}>
                    Subtotal: {formatRupiah(Number(item.subtotal || 0))}
                  </div>
                </div>
              ))
            )}
          </div>

          <div
            style={{
              marginTop: 16,
              paddingTop: 14,
              borderTop: "1px solid rgba(159,110,245,0.15)",
              display: "flex",
              flexDirection: "column",
              gap: 8,
            }}
          >
            <div style={receiptRowStyle}>
              <span>Total sewa</span>
              <strong>{formatRupiah(totalSewa)}</strong>
            </div>

            <div style={receiptRowStyle}>
              <span>Total produk</span>
              <strong>{formatRupiah(totalProduk)}</strong>
            </div>

            <div style={{ ...receiptRowStyle, fontSize: 16, color: "#f0eaff" }}>
              <span>Grand total</span>
              <strong>{formatRupiah(Number(transaksi.total_harga || 0))}</strong>
            </div>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: 10,
            marginTop: 16,
            flexWrap: "wrap",
          }}
        >
          <button onClick={() => printReceipt(transaksi)} style={secondaryBtnStyle}>
            Cetak Struk
          </button>
          <button onClick={onClose} style={primaryBtnStyle}>
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
