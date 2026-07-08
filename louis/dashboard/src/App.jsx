import { Routes, Route, Navigate } from 'react-router-dom'
import Sidebar from './components/Sidebar'

// AI
import ChatBot from './pages/ChatBot'

// Sales
import ContractMgmt from './pages/sales/ContractMgmt'
import PaymentMgmt from './pages/sales/PaymentMgmt'
import Inventory from './pages/Inventory'
import KpiDealer from './pages/sales/KpiDealer'

// Service
import Coupon from './pages/Coupon'

// FVD
import FvdVoc from './pages/fvd/Voc'
import FvdNetwork from './pages/fvd/Network'
import FvdFinance from './pages/fvd/Finance'

// DSD
import DsdStockMatch from './pages/dsd/StockMatch'
import DsdDailyTarget from './pages/dsd/DailyTarget'

// KTWS
import KtwsBi from './pages/ktws/Bi'
import KtwsCustom from './pages/ktws/Custom'

export default function App() {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex-1 overflow-y-auto bg-[#f0f2f5]">
        <Routes>
          <Route path="/" element={<ChatBot />} />

          {/* Sales */}
          <Route path="/sales/contract" element={<ContractMgmt />} />
          <Route path="/sales/payment" element={<PaymentMgmt />} />
          <Route path="/sales/inventory" element={<Inventory />} />
          <Route path="/sales/kpi" element={<KpiDealer />} />

          {/* Service */}
          <Route path="/service/coupon" element={<Coupon />} />

          {/* FVD */}
          <Route path="/fvd/voc" element={<FvdVoc />} />
          <Route path="/fvd/network" element={<FvdNetwork />} />
          <Route path="/fvd/finance" element={<FvdFinance />} />

          {/* DSD */}
          <Route path="/dsd/stock" element={<DsdStockMatch />} />
          <Route path="/dsd/target" element={<DsdDailyTarget />} />

          {/* KTWS */}
          <Route path="/ktws/bi" element={<KtwsBi />} />
          <Route path="/ktws/custom" element={<KtwsCustom />} />

          {/* fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </div>
  )
}
