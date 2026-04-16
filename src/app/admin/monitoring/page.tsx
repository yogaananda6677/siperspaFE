"use client";

import { MonitoringFilters } from "./components/MonitoringFilters";
import { MonitoringGrid } from "./components/MonitoringGrid";
import { MonitoringHeader } from "./components/MonitoringHeader";
import { MonitoringModal } from "./components/MonitoringModal";
import { MonitoringStats } from "./components/MonitoringStats";
import { ReceiptModal } from "./components/ReceiptModal";
import { Toast } from "./components/Toast";
import { useMonitoringPage } from "./hooks/useMonitoringPage";


export default function MonitoringPage() {
  const state = useMonitoringPage();

  return (
    <div style={{ padding: "32px 40px", minHeight: "100vh" }}>
      <Toast toast={state.toast} />

      <MonitoringHeader
        refreshing={state.refreshing}
        onRefresh={() => {
          void state.fetchAll();
        }}
      />

      <MonitoringStats stats={state.stats} />

      <MonitoringFilters
        search={state.search}
        setSearch={state.setSearch}
        filterStatus={state.filterStatus}
        setFilterStatus={state.setFilterStatus}
      />

      <MonitoringGrid
        loading={state.loading}
        items={state.filteredData}
        nowTick={state.nowTick}
        onOpen={state.openModal}
      />

      {state.selected && (
        <MonitoringModal
            selected={state.selected}
            activeTab={state.activeTab}
            setActiveTab={state.setActiveTab}
            pelanggans={state.pelanggans}
            selectedUserId={state.selectedUserId}
            setSelectedUserId={state.setSelectedUserId}
            jamMulai={state.jamMulai}
            setJamMulai={state.setJamMulai}
            durasiMenit={state.durasiMenit}
            setDurasiMenit={state.setDurasiMenit}
            menitTambahan={state.menitTambahan}
            setMenitTambahan={state.setMenitTambahan}
            rentalSubtotal={state.rentalSubtotal}
            produkSubtotal={state.produkSubtotal}
            grandTotal={state.grandTotal}
            filteredProdukKasir={state.filteredProdukKasir}
            cart={state.cart}
            productKeyword={state.productKeyword}
            setProductKeyword={state.setProductKeyword}
            addToCart={state.addToCart}
            changeQty={state.changeQty}
            submittingCreate={state.submittingCreate}
            submittingTambahProduk={state.submittingTambahProduk}
            submittingTambahWaktu={state.submittingTambahWaktu}
            submittingSelesai={state.submittingSelesai}
            submittingBayar={state.submittingBayar}
            metodePembayaran={state.metodePembayaran}
            setMetodePembayaran={state.setMetodePembayaran}
            jumlahBayar={state.jumlahBayar}
            setJumlahBayar={state.setJumlahBayar}
            nowTick={state.nowTick}
            onClose={state.closeModal}
            onCreateTransaksi={state.handleCreateTransaksi}
            onTambahProduk={state.handleTambahProduk}
            onTambahWaktu={state.handleTambahWaktu}
            onSelesaikan={state.handleSelesaikan}
            onBayar={state.handleBayar}
            isMutating={state.isMutating}
            />
      )}

      {state.receiptData && (
        <ReceiptModal
          transaksi={state.receiptData}
          onClose={() => state.setReceiptData(null)}
        />
      )}
    </div>
  );
}
