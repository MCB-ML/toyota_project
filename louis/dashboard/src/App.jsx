import { useState } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { Bot } from 'lucide-react'
import Sidebar from './components/Sidebar'
import ChatPanel from './components/ChatPanel'
import DeployableTab from './components/DeployableTab'
import { DashboardStateProvider } from './context/DashboardStateContext'
import { useUser } from './auth/UserContext'

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
import KtwsAgenticBi from './pages/ktws/AgenticBi'

export default function App() {
  const [collapsed, setCollapsed] = useState(false)
  const [chatOpen, setChatOpen] = useState(false)
  const location = useLocation()
  const isAiPage = location.pathname === '/'
  // 챗봇을 "대시보드 커스텀 빌더" 모드로 돌릴지 여부 — DB의 배포 대상 pageKey와는 별개 개념.
  const chatPageKey = location.pathname === '/ktws/custom' ? 'ktws-custom'
    : location.pathname === '/ktws/agentic-bi' ? 'agentic-bi' : undefined
  const { user } = useUser()
  // 개인 계정이 아니라 본사/딜러사 단위로 대시보드를 공유하는 키(SelectAccount에서 고른 role/dealerId 기준).
  const scopeKey = user.role === 'hq' ? 'hq' : user.role === 'dealer' ? `dealer:${user.dealerId}` : null

  return (
    <DashboardStateProvider scopeKey={scopeKey}>
      <div className="flex h-screen overflow-hidden">
        <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(v => !v)} />
        <div className="flex-1 overflow-y-auto bg-[#f0f2f5] relative">
          <Routes>
            <Route path="/" element={<ChatBot />} />

            {/* Sales */}
            <Route path="/sales/contract" element={<DeployableTab pageKey="sales-contract"><ContractMgmt /></DeployableTab>} />
            <Route path="/sales/payment" element={<DeployableTab pageKey="sales-payment"><PaymentMgmt /></DeployableTab>} />
            <Route path="/sales/inventory" element={<DeployableTab pageKey="sales-inventory"><Inventory /></DeployableTab>} />
            <Route path="/sales/kpi" element={<DeployableTab pageKey="sales-kpi"><KpiDealer /></DeployableTab>} />

            {/* Service */}
            <Route path="/service/coupon" element={<DeployableTab pageKey="service-coupon"><Coupon /></DeployableTab>} />

            {/* FVD */}
            <Route path="/fvd/voc" element={<DeployableTab pageKey="fvd-voc"><FvdVoc /></DeployableTab>} />
            <Route path="/fvd/network" element={<DeployableTab pageKey="fvd-network"><FvdNetwork /></DeployableTab>} />
            <Route path="/fvd/finance" element={<DeployableTab pageKey="fvd-finance"><FvdFinance /></DeployableTab>} />

            {/* DSD */}
            <Route path="/dsd/stock" element={<DeployableTab pageKey="dsd-stock"><DsdStockMatch /></DeployableTab>} />
            <Route path="/dsd/target" element={<DeployableTab pageKey="dsd-target"><DsdDailyTarget /></DeployableTab>} />

            {/* KTWS */}
            <Route path="/ktws/bi" element={<DeployableTab pageKey="ktws-bi"><KtwsBi /></DeployableTab>} />
            <Route path="/ktws/custom" element={<KtwsCustom />} />
            <Route path="/ktws/agentic-bi" element={<KtwsAgenticBi />} />

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
          subtitle={chatPageKey === 'agentic-bi' ? 'Agentic BI (실험)' : chatPageKey ? '대시보드 커스텀' : undefined}
          pageKey={chatPageKey}
        />
      </div>
    </DashboardStateProvider>
  )
}
