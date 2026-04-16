import type { Dispatch, SetStateAction } from "react";
import type { MonitoringPlaystation, Pelanggan, Produk } from "@/lib/api";
import {
  findActiveSewaForPs,
  formatDateTime,
  formatDurasiMenit,
  formatRupiah,
  getCountdownText,
  getDetailProdukKey,
  getDetailSewaKey,
  getDurasiMenit,
  isExpired,
  STATUS_CONFIG,
} from "../lib/helpers";
import {
  closeBtnStyle,
  dangerBtnStyle,
  emptyNoticeStyle,
  inputStyle,
  itemCardStyle,
  labelStyle,
  miniBoxStyle,
  miniLabelStyle,
  miniValueStyle,
  modalStyle,
  overlayStyle,
  panelStyle,
  primaryBtnStyle,
  summaryBoxStyle,
  summaryLabelStyle,
  summaryValueStyle,
  tabButton,
} from "../lib/styles";
import type { ActiveTab, CartItem } from "../lib/types";
import { ProductPicker } from "./ProductPicker";
import {
  canBayarTransaksi,
  canSelesaikanTransaksi,
  getNormalizedStatusBayar,
} from "@/lib/transaksi-status";

type MonitoringModalProps = {
  selected: MonitoringPlaystation;
  activeTab: ActiveTab;
  setActiveTab: Dispatch<SetStateAction<ActiveTab>>;
  pelanggans: Pelanggan[];
  selectedUserId: string;
  setSelectedUserId: Dispatch<SetStateAction<string>>;
  jamMulai: string;
  setJamMulai: Dispatch<SetStateAction<string>>;
  durasiMenit: number;
  setDurasiMenit: Dispatch<SetStateAction<number>>;
  menitTambahan: number;
  setMenitTambahan: Dispatch<SetStateAction<number>>;
  rentalSubtotal: number;
  produkSubtotal: number;
  grandTotal: number;
  filteredProdukKasir: Produk[];
  cart: CartItem[];
  productKeyword: string;
  setProductKeyword: Dispatch<SetStateAction<string>>;
  addToCart: (produk: Produk) => void;
  changeQty: (id_produk: number, delta: number) => void;
  submittingCreate: boolean;
  submittingTambahProduk: boolean;
  submittingTambahWaktu: boolean;
  submittingSelesai: boolean;
  nowTick: number;
  onClose: () => void;
  onCreateTransaksi: () => void;
  onTambahProduk: () => void;
  onTambahWaktu: () => void;
  onSelesaikan: () => void;
  metodePembayaran: "cash" | "online";
  setMetodePembayaran: Dispatch<SetStateAction<"cash" | "online">>;
  jumlahBayar: string;
  setJumlahBayar: Dispatch<SetStateAction<string>>;
  submittingBayar: boolean;
  onBayar: () => void;
  isMutating: boolean;
};

export function MonitoringModal({
  selected,
  activeTab,
  setActiveTab,
  pelanggans,
  selectedUserId,
  setSelectedUserId,
  jamMulai,
  setJamMulai,
  durasiMenit,
  setDurasiMenit,
  menitTambahan,
  setMenitTambahan,
  rentalSubtotal,
  produkSubtotal,
  grandTotal,
  filteredProdukKasir,
  cart,
  productKeyword,
  setProductKeyword,
  addToCart,
  changeQty,
  submittingCreate,
  submittingTambahProduk,
  submittingTambahWaktu,
  submittingSelesai,
  nowTick,
  onClose,
  onCreateTransaksi,
  onTambahProduk,
  onTambahWaktu,
  onSelesaikan,
  metodePembayaran,
  setMetodePembayaran,
  jumlahBayar,
  setJumlahBayar,
  submittingBayar,
  onBayar,
  isMutating,
}: MonitoringModalProps) {
  return (
    <div onClick={isMutating ? undefined : onClose} style={overlayStyle}>
      <div onClick={(e) => e.stopPropagation()} style={modalStyle}>
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
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#f0eaff" }}>
              Monitoring {selected.nomor_ps}
            </h2>
            <p style={{ margin: "4px 0 0", fontSize: 13, color: "#9b8ec4" }}>
              {selected.tipe?.nama_tipe ?? "-"} • Status: {STATUS_CONFIG[selected.status_ps].label}
            </p>
          </div>

          <button
            onClick={onClose}
            disabled={isMutating}
            style={{
              ...closeBtnStyle,
              opacity: isMutating ? 0.6 : 1,
              cursor: isMutating ? "not-allowed" : "pointer",
            }}
          >
            ×
          </button>
        </div>

        <SummaryInfo selected={selected} />

        {selected.status_ps === "tersedia" && (
          <CreateTransaksiSection
            selected={selected}
            pelanggans={pelanggans}
            selectedUserId={selectedUserId}
            setSelectedUserId={setSelectedUserId}
            jamMulai={jamMulai}
            setJamMulai={setJamMulai}
            durasiMenit={durasiMenit}
            setDurasiMenit={setDurasiMenit}
            rentalSubtotal={rentalSubtotal}
            grandTotal={grandTotal}
            filteredProdukKasir={filteredProdukKasir}
            cart={cart}
            productKeyword={productKeyword}
            setProductKeyword={setProductKeyword}
            addToCart={addToCart}
            changeQty={changeQty}
            submittingCreate={submittingCreate}
            onCreateTransaksi={onCreateTransaksi}
            isMutating={isMutating}
          />
        )}

        {selected.status_ps === "digunakan" && selected.active_transaksi && (
          <ActiveTransaksiSection
            selected={selected}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            menitTambahan={menitTambahan}
            setMenitTambahan={setMenitTambahan}
            produkSubtotal={produkSubtotal}
            filteredProdukKasir={filteredProdukKasir}
            cart={cart}
            productKeyword={productKeyword}
            setProductKeyword={setProductKeyword}
            addToCart={addToCart}
            changeQty={changeQty}
            submittingTambahProduk={submittingTambahProduk}
            submittingTambahWaktu={submittingTambahWaktu}
            submittingSelesai={submittingSelesai}
            submittingBayar={submittingBayar}
            metodePembayaran={metodePembayaran}
            setMetodePembayaran={setMetodePembayaran}
            jumlahBayar={jumlahBayar}
            setJumlahBayar={setJumlahBayar}
            nowTick={nowTick}
            onTambahProduk={onTambahProduk}
            onTambahWaktu={onTambahWaktu}
            onSelesaikan={onSelesaikan}
            onBayar={onBayar}
            isMutating={isMutating}
          />
        )}

        {selected.status_ps === "maintenance" && <MaintenanceSection />}
      </div>
    </div>
  );
}

function SummaryInfo({ selected }: { selected: MonitoringPlaystation }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
        gap: 12,
        marginBottom: 18,
      }}
    >
      {[
        ["Nomor PS", selected.nomor_ps],
        ["Tipe", selected.tipe?.nama_tipe ?? "-"],
        ["Status PS", STATUS_CONFIG[selected.status_ps].label],
        [
          "Ref Transaksi",
          selected.active_transaksi ? `#${selected.active_transaksi.id_transaksi}` : "-",
        ],
      ].map(([label, value]) => (
        <div key={label} style={miniBoxStyle}>
          <div style={miniLabelStyle}>{label}</div>
          <div style={miniValueStyle}>{value}</div>
        </div>
      ))}
    </div>
  );
}

function CreateTransaksiSection({
  selected,
  pelanggans,
  selectedUserId,
  setSelectedUserId,
  jamMulai,
  setJamMulai,
  durasiMenit,
  setDurasiMenit,
  rentalSubtotal,
  grandTotal,
  filteredProdukKasir,
  cart,
  productKeyword,
  setProductKeyword,
  addToCart,
  changeQty,
  submittingCreate,
  onCreateTransaksi,
  isMutating,
}: {
  selected: MonitoringPlaystation;
  pelanggans: Pelanggan[];
  selectedUserId: string;
  setSelectedUserId: Dispatch<SetStateAction<string>>;
  jamMulai: string;
  setJamMulai: Dispatch<SetStateAction<string>>;
  durasiMenit: number;
  setDurasiMenit: Dispatch<SetStateAction<number>>;
  rentalSubtotal: number;
  grandTotal: number;
  filteredProdukKasir: Produk[];
  cart: CartItem[];
  productKeyword: string;
  setProductKeyword: Dispatch<SetStateAction<string>>;
  addToCart: (produk: Produk) => void;
  changeQty: (id_produk: number, delta: number) => void;
  submittingCreate: boolean;
  onCreateTransaksi: () => void;
  isMutating: boolean;
}) {
  return (
    <div style={panelStyle}>
      <h3 style={{ margin: "0 0 14px", fontSize: 15, color: "#f0eaff" }}>
        Buat Transaksi Baru
      </h3>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 160px",
          gap: 12,
          marginBottom: 14,
        }}
      >
        <div>
          <label style={labelStyle}>Pelanggan</label>
          <select
            value={selectedUserId}
            onChange={(e) => setSelectedUserId(e.target.value)}
            style={inputStyle}
            disabled={isMutating}
          >
            <option value="">Pilih pelanggan</option>
            {pelanggans.map((p) => (
              <option key={p.id_user} value={p.id_user}>
                {p.name} (@{p.username})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label style={labelStyle}>Jam Mulai</label>
          <input
            type="datetime-local"
            value={jamMulai}
            onChange={(e) => setJamMulai(e.target.value)}
            step={60}
            style={inputStyle}
            disabled={isMutating}
          />
        </div>

        <div>
          <label style={labelStyle}>Durasi (menit)</label>
          <select
            value={durasiMenit}
            onChange={(e) => setDurasiMenit(Number(e.target.value))}
            style={inputStyle}
            disabled={isMutating}
          >
            {[30, 60, 90, 120, 150, 180, 240].map((m) => (
              <option key={m} value={m}>
                {formatDurasiMenit(m)}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
          gap: 12,
          marginBottom: 14,
        }}
      >
        <div style={summaryBoxStyle}>
          <div style={summaryLabelStyle}>Harga per jam</div>
          <div style={summaryValueStyle}>{formatRupiah(selected.tipe?.harga_sewa ?? 0)}</div>
        </div>

        <div style={summaryBoxStyle}>
          <div style={summaryLabelStyle}>Durasi</div>
          <div style={summaryValueStyle}>{formatDurasiMenit(durasiMenit)}</div>
        </div>

        <div style={summaryBoxStyle}>
          <div style={summaryLabelStyle}>Subtotal rental</div>
          <div style={summaryValueStyle}>{formatRupiah(rentalSubtotal)}</div>
        </div>

        <div style={summaryBoxStyle}>
          <div style={summaryLabelStyle}>Total keseluruhan</div>
          <div style={summaryValueStyle}>{formatRupiah(grandTotal)}</div>
        </div>
      </div>

      <ProductPicker
        filteredProdukKasir={filteredProdukKasir}
        cart={cart}
        productKeyword={productKeyword}
        onProductKeywordChange={setProductKeyword}
        onAddToCart={addToCart}
        onChangeQty={changeQty}
        disabled={isMutating}
      />

      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 16 }}>
        <button
          onClick={onCreateTransaksi}
          disabled={submittingCreate || isMutating}
          style={primaryBtnStyle}
        >
          {submittingCreate ? "Menyimpan..." : "Buat Transaksi"}
        </button>
      </div>
    </div>
  );
}

function ActiveTransaksiSection({
  selected,
  activeTab,
  setActiveTab,
  menitTambahan,
  setMenitTambahan,
  produkSubtotal,
  filteredProdukKasir,
  cart,
  productKeyword,
  setProductKeyword,
  addToCart,
  changeQty,
  submittingTambahProduk,
  submittingTambahWaktu,
  submittingSelesai,
  submittingBayar,
  metodePembayaran,
  setMetodePembayaran,
  jumlahBayar,
  setJumlahBayar,
  nowTick,
  onTambahProduk,
  onTambahWaktu,
  onSelesaikan,
  onBayar,
  isMutating,
}: {
  selected: MonitoringPlaystation;
  activeTab: ActiveTab;
  setActiveTab: Dispatch<SetStateAction<ActiveTab>>;
  menitTambahan: number;
  setMenitTambahan: Dispatch<SetStateAction<number>>;
  produkSubtotal: number;
  filteredProdukKasir: Produk[];
  cart: CartItem[];
  productKeyword: string;
  setProductKeyword: Dispatch<SetStateAction<string>>;
  addToCart: (produk: Produk) => void;
  changeQty: (id_produk: number, delta: number) => void;
  submittingTambahProduk: boolean;
  submittingTambahWaktu: boolean;
  submittingSelesai: boolean;
  submittingBayar: boolean;
  metodePembayaran: "cash" | "online";
  setMetodePembayaran: Dispatch<SetStateAction<"cash" | "online">>;
  jumlahBayar: string;
  setJumlahBayar: Dispatch<SetStateAction<string>>;
  nowTick: number;
  onTambahProduk: () => void;
  onTambahWaktu: () => void;
  onSelesaikan: () => void;
  onBayar: () => void;
  isMutating: boolean;
}) {
  const transaksi = selected.active_transaksi!;
  const sewaAktif = findActiveSewaForPs(transaksi, selected.id_ps);
  const expired = isExpired(sewaAktif?.jam_selesai, nowTick);

  const pembayaranAktif = transaksi.pembayaran ?? null;
  const statusBayar = getNormalizedStatusBayar(transaksi);
  const bisaBayar = canBayarTransaksi(transaksi);
  const bisaSelesaikan = canSelesaikanTransaksi(transaksi);

  const sudahLunas = statusBayar === "lunas";
  const totalAktif = Number(transaksi.total_harga || 0);
  const nominalBayar =
    metodePembayaran === "online" ? totalAktif : Number(jumlahBayar || 0);
  const kembalianCash = Math.max(0, nominalBayar - totalAktif);

  const lockedTabButton = (active: boolean) => ({
    ...tabButton(active),
    opacity: isMutating ? 0.6 : 1,
    cursor: isMutating ? "not-allowed" : "pointer",
  });

  return (
    <>
      <div
        style={{
          marginBottom: 16,
          padding: "14px 16px",
          borderRadius: 12,
          background: expired ? "rgba(248,113,113,0.08)" : "rgba(251,146,60,0.08)",
          border: expired
            ? "1px solid rgba(248,113,113,0.2)"
            : "1px solid rgba(251,146,60,0.2)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <span style={{ fontSize: 13, color: expired ? "#fca5a5" : "#f0c08a" }}>
          {expired ? "Waktu bermain habis" : "Waktu bermain berjalan"}
        </span>
        <span
          style={{
            fontSize: 16,
            fontWeight: 700,
            color: expired ? "#f87171" : "#fb923c",
          }}
        >
          {getCountdownText(sewaAktif?.jam_selesai, nowTick)}
        </span>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 18, flexWrap: "wrap" }}>
        <button
          onClick={() => !isMutating && setActiveTab("sewa")}
          disabled={isMutating}
          style={lockedTabButton(activeTab === "sewa")}
        >
          Sewa PS
        </button>

        <button
          onClick={() => !isMutating && setActiveTab("produk")}
          disabled={isMutating}
          style={lockedTabButton(activeTab === "produk")}
        >
          Produk
        </button>

        <button
          onClick={() => !isMutating && setActiveTab("pembayaran")}
          disabled={isMutating}
          style={lockedTabButton(activeTab === "pembayaran")}
        >
          Pembayaran
        </button>
      </div>

      {activeTab === "sewa" ? (
        <div style={panelStyle}>
          <h3 style={{ margin: "0 0 14px", fontSize: 15, color: "#f0eaff" }}>
            Detail Sewa PS
          </h3>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
              gap: 12,
              marginBottom: 14,
            }}
          >
            {[
              ["Pelanggan", transaksi.user?.name ?? "-"],
              ["Username", transaksi.user?.username ?? "-"],
              ["Tanggal", formatDateTime(transaksi.tanggal)],
              ["Status Transaksi", transaksi.status_transaksi],
            ].map(([label, value]) => (
              <div key={label} style={miniBoxStyle}>
                <div style={miniLabelStyle}>{label}</div>
                <div style={miniValueStyle}>{value}</div>
              </div>
            ))}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {transaksi.detail_sewa.map((sewa, index) => {
              const durasi = getDurasiMenit(sewa);

              return (
                <div key={getDetailSewaKey(sewa, index)} style={itemCardStyle}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#f0eaff" }}>
                    {sewa.playstation?.nomor_ps ?? "-"} •{" "}
                    {sewa.playstation?.tipe?.nama_tipe ?? sewa.tipe_ps ?? "-"}
                  </div>
                  <div style={{ fontSize: 12.5, color: "#9b8ec4", marginTop: 6 }}>
                    Jam mulai: {formatDateTime(sewa.jam_mulai)}
                  </div>
                  <div style={{ fontSize: 12.5, color: "#9b8ec4", marginTop: 2 }}>
                    Jam selesai: {formatDateTime(sewa.jam_selesai)}
                  </div>
                  <div style={{ fontSize: 12.5, color: "#9b8ec4", marginTop: 2 }}>
                    Durasi: {formatDurasiMenit(durasi)}
                  </div>
                  <div style={{ fontSize: 12.5, color: "#c9aff5", marginTop: 8 }}>
                    Harga/jam: {formatRupiah(sewa.harga_perjam)}
                  </div>
                  <div style={{ fontSize: 12.5, color: "#c9aff5", marginTop: 2 }}>
                    Subtotal: {formatRupiah(Number(sewa.subtotal || 0))}
                  </div>
                </div>
              );
            })}
          </div>

          <div
            style={{
              marginTop: 16,
              padding: "14px 16px",
              borderRadius: 12,
              background: "rgba(159,110,245,0.08)",
              border: "1px solid rgba(159,110,245,0.15)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 12,
                alignItems: "end",
                flexWrap: "wrap",
              }}
            >
              <div>
                <div style={{ fontSize: 12, color: "#9b8ec4", marginBottom: 6 }}>
                  Tambah waktu sewa
                </div>
                <select
                  value={menitTambahan}
                  onChange={(e) => setMenitTambahan(Number(e.target.value))}
                  style={{ ...inputStyle, minWidth: 160 }}
                  disabled={isMutating}
                >
                  {[30, 60, 90, 120].map((m) => (
                    <option key={m} value={m}>
                      {formatDurasiMenit(m)}
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={onTambahWaktu}
                disabled={submittingTambahWaktu || isMutating}
                style={primaryBtnStyle}
              >
                {submittingTambahWaktu ? "Memproses..." : "Tambah Waktu"}
              </button>
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
            <button
              onClick={onSelesaikan}
              disabled={submittingSelesai || !bisaSelesaikan || isMutating}
              style={{
                ...dangerBtnStyle,
                opacity: submittingSelesai || !bisaSelesaikan || isMutating ? 0.6 : 1,
                cursor:
                  submittingSelesai || !bisaSelesaikan || isMutating
                    ? "not-allowed"
                    : "pointer",
              }}
              title={!bisaSelesaikan ? "Transaksi hanya bisa diselesaikan jika sudah lunas" : ""}
            >
              {submittingSelesai ? "Memproses..." : "Selesaikan & Tampilkan Struk"}
            </button>
          </div>
        </div>
      ) : activeTab === "produk" ? (
        <div style={panelStyle}>
          <h3 style={{ margin: "0 0 14px", fontSize: 15, color: "#f0eaff" }}>
            Detail Produk & Tambah Produk
          </h3>

          {transaksi.detail_produk.length === 0 ? (
            <div style={{ ...emptyNoticeStyle, marginBottom: 14 }}>
              Belum ada produk pada transaksi ini.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 14 }}>
              {transaksi.detail_produk.map((detail, index) => (
                <div key={getDetailProdukKey(detail, index)} style={itemCardStyle}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#f0eaff" }}>
                    {detail.produk?.nama ?? "-"}
                  </div>
                  <div style={{ fontSize: 12.5, color: "#9b8ec4", marginTop: 6 }}>
                    Jenis: {detail.produk?.jenis ?? "-"}
                  </div>
                  <div style={{ fontSize: 12.5, color: "#9b8ec4", marginTop: 2 }}>
                    Qty: {detail.qty}
                  </div>
                  <div style={{ fontSize: 12.5, color: "#c9aff5", marginTop: 8 }}>
                    Harga: {formatRupiah(detail.produk?.harga ?? 0)}
                  </div>
                  <div style={{ fontSize: 12.5, color: "#c9aff5", marginTop: 2 }}>
                    Subtotal: {formatRupiah(Number(detail.subtotal || 0))}
                  </div>
                </div>
              ))}
            </div>
          )}

          <ProductPicker
            filteredProdukKasir={filteredProdukKasir}
            cart={cart}
            productKeyword={productKeyword}
            onProductKeywordChange={setProductKeyword}
            onAddToCart={addToCart}
            onChangeQty={changeQty}
            disabled={isMutating}
          />

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 12,
              marginTop: 16,
              flexWrap: "wrap",
            }}
          >
            <div style={{ color: "#c9aff5", fontWeight: 600 }}>
              Tambahan produk: {formatRupiah(produkSubtotal)}
            </div>

            <button
              onClick={onTambahProduk}
              disabled={submittingTambahProduk || isMutating}
              style={primaryBtnStyle}
            >
              {submittingTambahProduk ? "Menambahkan..." : "Tambah Produk"}
            </button>
          </div>
        </div>
      ) : (
        <div style={panelStyle}>
          <h3 style={{ margin: "0 0 14px", fontSize: 15, color: "#f0eaff" }}>
            Pembayaran
          </h3>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
              gap: 12,
              marginBottom: 14,
            }}
          >
            <div style={miniBoxStyle}>
              <div style={miniLabelStyle}>Total Tagihan</div>
              <div style={miniValueStyle}>{formatRupiah(totalAktif)}</div>
            </div>

            <div style={miniBoxStyle}>
              <div style={miniLabelStyle}>Status Pembayaran</div>
              <div style={miniValueStyle}>{statusBayar || "belum dibayar"}</div>
            </div>
          </div>

          {pembayaranAktif && (
            <div style={{ ...emptyNoticeStyle, marginBottom: 14 }}>
              Metode: {pembayaranAktif.metode_pembayaran}
              {" • "}
              Total Bayar: {formatRupiah(Number(pembayaranAktif.total_bayar || 0))}
              {" • "}
              Kembalian: {formatRupiah(Number(pembayaranAktif.kembalian || 0))}
              {" • "}
              Waktu Bayar: {formatDateTime(pembayaranAktif.waktu_bayar)}
            </div>
          )}

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
              gap: 12,
              marginBottom: 14,
            }}
          >
            <div>
              <label style={labelStyle}>Metode Pembayaran</label>
              <select
                value={metodePembayaran}
                onChange={(e) => setMetodePembayaran(e.target.value as "cash" | "online")}
                style={inputStyle}
                disabled={sudahLunas || isMutating}
              >
                <option value="cash">Cash</option>
                <option value="online">Online Payment</option>
              </select>
            </div>

            <div>
              <label style={labelStyle}>Jumlah Bayar</label>
              <input
                type="number"
                min={0}
                value={metodePembayaran === "online" ? String(totalAktif) : jumlahBayar}
                onChange={(e) => setJumlahBayar(e.target.value)}
                style={inputStyle}
                disabled={sudahLunas || metodePembayaran === "online" || isMutating}
              />
            </div>
          </div>

          {metodePembayaran === "cash" && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                gap: 12,
                marginBottom: 14,
              }}
            >
              <div style={summaryBoxStyle}>
                <div style={summaryLabelStyle}>Nominal dibayar</div>
                <div style={summaryValueStyle}>{formatRupiah(nominalBayar)}</div>
              </div>

              <div style={summaryBoxStyle}>
                <div style={summaryLabelStyle}>Kembalian</div>
                <div style={summaryValueStyle}>{formatRupiah(kembalianCash)}</div>
              </div>
            </div>
          )}

          {metodePembayaran === "online" && (
            <div style={{ ...emptyNoticeStyle, marginBottom: 14 }}>
              Online payment akan langsung dicatat lunas sebesar total transaksi.
            </div>
          )}

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 12,
              alignItems: "center",
              flexWrap: "wrap",
            }}
          >
            <div style={{ color: "#9b8ec4", fontSize: 13 }}>
              Setelah pembayaran lunas, transaksi bisa diselesaikan dan struk bisa dicetak.
            </div>

            <button
              onClick={onBayar}
              disabled={submittingBayar || !bisaBayar || isMutating}
              style={{
                ...primaryBtnStyle,
                opacity: submittingBayar || !bisaBayar || isMutating ? 0.6 : 1,
                cursor:
                  submittingBayar || !bisaBayar || isMutating
                    ? "not-allowed"
                    : "pointer",
              }}
            >
              {submittingBayar
                ? "Menyimpan..."
                : sudahLunas
                ? "Sudah Lunas"
                : "Simpan Pembayaran"}
            </button>
          </div>
        </div>
      )}

      <div
        style={{
          marginTop: 18,
          padding: "14px 16px",
          borderRadius: 12,
          background: "rgba(159,110,245,0.08)",
          border: "1px solid rgba(159,110,245,0.15)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <span style={{ fontSize: 13, color: "#9b8ec4" }}>Total transaksi saat ini</span>
        <span style={{ fontSize: 16, fontWeight: 700, color: "#f0eaff" }}>
          {formatRupiah(Number(transaksi.total_harga || 0))}
        </span>
      </div>
    </>
  );
}

function MaintenanceSection() {
  return (
    <div style={panelStyle}>
      <div
        style={{
          padding: "18px 16px",
          borderRadius: 12,
          background: "rgba(250,204,21,0.08)",
          border: "1px solid rgba(250,204,21,0.15)",
          color: "#fde68a",
        }}
      >
        Unit ini sedang maintenance dan tidak bisa digunakan untuk transaksi.
      </div>
    </div>
  );
}