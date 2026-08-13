import { NavLink } from 'react-router-dom'
import {
  Sparkles,
  FileSignature, CreditCard, Boxes, BarChart3,
  Ticket,
  MessageSquare, Network, Landmark,
  GitMerge, CalendarDays,
  PieChart, LayoutGrid, FlaskConical, FileCode2,
  ChevronRight, PanelLeftClose, PanelLeftOpen,
  ShieldCheck, ExternalLink,
} from 'lucide-react'
import AccountSwitcher from './AccountSwitcher'
import ModelPicker from './ModelPicker'
import { useUser } from '../auth/UserContext'
import { isAdminSession } from '../auth/ai365'
import { adaptUrlToPageHost } from '../utils/runtimeHost'

// LAN(사설 IP)으로 접속했을 때도 관리자 센터가 열리도록 접속 호스트에 맞춘다 —
// 빌드에 박힌 localhost 그대로면 누른 기기 자신의 8088 을 찾아가 버린다.
const ADMIN_FRONTEND_URL = adaptUrlToPageHost(import.meta.env.VITE_ADMIN_FRONTEND_URL || 'http://localhost:8088')

const MENU_GROUPS = [
  {
    label: 'AI',
    items: [
      { path: '/', label: 'AI 어시스턴트', icon: Sparkles, badge: 'AI' },
    ],
  },
  {
    label: 'Sales  영업관리',
    items: [
      { path: '/sales/contract', label: '계약/출고 관리', icon: FileSignature },
      { path: '/sales/payment', label: '카드결제 관리', icon: CreditCard },
      { path: '/sales/inventory', label: '재고관리', icon: Boxes },
      { path: '/sales/kpi', label: 'KPI 분석', icon: BarChart3 },
    ],
  },
  {
    label: 'Service  서비스',
    items: [
      { path: '/service/coupon', label: 'FMS 쿠폰관리', icon: Ticket },
    ],
  },
  {
    label: 'FVD',
    items: [
      { path: '/fvd/voc', label: 'VOC 분석', icon: MessageSquare },
      { path: '/fvd/network', label: '네트워크/PMA', icon: Network },
      { path: '/fvd/finance', label: '딜러 재무', icon: Landmark },
    ],
  },
  {
    label: 'DSD',
    items: [
      { path: '/dsd/stock', label: '계약/재고 매칭', icon: GitMerge },
      { path: '/dsd/target', label: '일별 타겟 분배', icon: CalendarDays },
    ],
  },
  {
    label: 'KTWS',
    items: [
      { path: '/ktws/bi', label: 'BI', icon: PieChart },
      { path: '/ktws/agentic-bi', label: '대시보드 커스텀', icon: LayoutGrid },
      { path: '/ktws/custom', label: 'Query Planner', icon: FlaskConical, badge: '실험' },
      { path: '/ktws/html-report', label: 'HTML 작성', icon: FileCode2, badge: '실험' },
    ],
  },
]

export default function Sidebar({ collapsed, onToggle }) {
  const { ai365 } = useUser()
  const canOpenAdminCenter = isAdminSession(ai365)

  return (
    <aside
      className={`${collapsed ? 'w-16' : 'w-56'} flex-shrink-0 bg-[#111827] text-white flex flex-col h-screen transition-all duration-200 overflow-hidden`}
    >
      {/* Logo */}
      <div className="px-4 py-4 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 flex-shrink-0 rounded-lg bg-[#EB0A1E] flex items-center justify-center font-bold text-sm tracking-tight">
            T
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="font-bold text-sm leading-tight truncate">Toyota / Lexus</p>
              <p className="text-xs text-white/40 leading-tight truncate">Data Dashboard</p>
            </div>
          )}
        </div>
        {!collapsed && (
          <button
            onClick={onToggle}
            className="flex-shrink-0 w-7 h-7 rounded-lg bg-white text-[#111827] hover:bg-white/90 flex items-center justify-center shadow transition-colors"
            title="메뉴 접기"
          >
            <PanelLeftClose size={14} />
          </button>
        )}
      </div>

      {collapsed && (
        <button
          onClick={onToggle}
          className="mx-auto mt-3 w-8 h-8 flex items-center justify-center rounded-lg bg-white text-[#111827] hover:bg-white/90 shadow transition-colors"
          title="메뉴 펼치기"
        >
          <PanelLeftOpen size={16} />
        </button>
      )}

      {/* Navigation */}
      <nav className="flex-1 px-2 py-3 overflow-y-auto overflow-x-hidden space-y-4">
        {MENU_GROUPS.map(({ label, items }) => (
          <div key={label}>
            {!collapsed && (
              <p className="px-2 mb-1 text-[9px] font-bold uppercase tracking-widest text-white/30 truncate">{label}</p>
            )}
            <div className="space-y-0.5">
              {items.map(({ path, label: itemLabel, icon: Icon, badge }) => (
                <NavLink
                  key={path}
                  to={path}
                  end={path === '/'}
                  title={collapsed ? itemLabel : undefined}
                  className={({ isActive }) =>
                    `flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] font-medium transition-all
                    ${collapsed ? 'justify-center' : ''}
                    ${isActive
                      ? 'bg-white/10 text-white'
                      : 'text-white/50 hover:bg-white/5 hover:text-white/90'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <Icon size={15} className={`flex-shrink-0 ${isActive ? 'text-[#60a5fa]' : 'text-white/35'}`} />
                      {!collapsed && (
                        <>
                          <span className="flex-1 leading-tight truncate">{itemLabel}</span>
                          {badge && (
                            <span className="text-[9px] font-bold bg-blue-500 text-white px-1.5 py-0.5 rounded-full leading-none">
                              {badge}
                            </span>
                          )}
                          {isActive && !badge && <ChevronRight size={12} className="text-[#60a5fa]" />}
                        </>
                      )}
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {canOpenAdminCenter && (
        <div className="border-t border-white/10 px-2 py-3">
          <a
            href={ADMIN_FRONTEND_URL}
            target="_blank"
            rel="noreferrer"
            title="관리자 센터"
            className={`flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium text-white/70 transition-colors hover:bg-white/5 hover:text-white ${collapsed ? 'justify-center' : ''}`}
          >
            <ShieldCheck size={15} className="flex-shrink-0 text-[#60a5fa]" />
            {!collapsed && (
              <>
                <span className="flex-1 truncate">관리자 센터</span>
                <ExternalLink size={12} className="text-white/35" />
              </>
            )}
          </a>
        </div>
      )}
      {!collapsed && (
        <>
          {/* 어느 화면에서도 지금 무엇으로 답하는지 보이게 사이드바에 둔다. */}
          <div className="px-3 pb-2">
            <ModelPicker compact />
          </div>

          {/* Account (demo) */}
          <AccountSwitcher />

          {/* Footer */}
          <div className="px-4 py-3 border-t border-white/10">
            <p className="text-[11px] text-white/25 truncate">Toyota Korea DT Team</p>
          </div>
        </>
      )}
    </aside>
  )
}
