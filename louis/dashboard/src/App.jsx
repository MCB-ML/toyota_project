import { useState } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { Bot } from 'lucide-react'
import Sidebar from './components/Sidebar'
import ChatPanel from './components/ChatPanel'
import { DashboardStateProvider } from './context/DashboardStateContext'

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
  const [collapsed, setCollapsed] = useState(false)
  const [chatOpen, setChatOpen] = useState(false)
  const location = useLocation()
  const isAiPage = location.pathname === '/'
  const pageKey = location.pathname === '/ktws/custom' ? 'ktws-custom' : undefined

  return (
    <DashboardStateProvider>
      <div className="flex h-screen overflow-hidden">
        <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(v => !v)} />
        <div className="flex-1 overflow-y-auto bg-[#f0f2f5] relative">
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

          {!isAiPage && (
            <button
              onClick={() => setChatOpen(v => !v)}
              title="AI 챗봇"
              className={`fixed top-6 right-6 z-30 w-11 h-11 rounded-xl flex items-center justify-center transition-colors shadow-md border
                ${chatOpen
                  ? 'bg-[#1e3a5f] border-[#1e3a5f] text-white'
                  : 'bg-white border-gray-200 text-gray-600 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700'
                }`}
            >
              <Bot size={20} />
            </button>
          )}
        </div>

        <ChatPanel
          open={chatOpen && !isAiPage}
          onClose={() => setChatOpen(false)}
          title="AI 어시스턴트"
          subtitle={pageKey ? '대시보드 커스텀' : undefined}
          pageKey={pageKey}
        />
      </div>
    </DashboardStateProvider>
  )
}
