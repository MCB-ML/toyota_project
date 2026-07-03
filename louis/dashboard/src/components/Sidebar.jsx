import { NavLink } from 'react-router-dom'
import {
  Sparkles,
  FileSignature, CreditCard, Boxes, BarChart3,
  Ticket,
  MessageSquare, Network, Landmark,
  GitMerge, CalendarDays,
  ChevronRight,
} from 'lucide-react'
import AccountSwitcher from './AccountSwitcher'

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
]

export default function Sidebar() {
  return (
    <aside className="w-56 flex-shrink-0 bg-[#111827] text-white flex flex-col h-screen">
      {/* Logo */}
      <div className="px-4 py-4 border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#EB0A1E] flex items-center justify-center font-bold text-sm tracking-tight">
            T
          </div>
          <div>
            <p className="font-bold text-sm leading-tight">Toyota / Lexus</p>
            <p className="text-xs text-white/40 leading-tight">Data Dashboard</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-3 overflow-y-auto space-y-4">
        {MENU_GROUPS.map(({ label, items }) => (
          <div key={label}>
            <p className="px-2 mb-1 text-[9px] font-bold uppercase tracking-widest text-white/30">{label}</p>
            <div className="space-y-0.5">
              {items.map(({ path, label: itemLabel, icon: Icon, badge }) => (
                <NavLink
                  key={path}
                  to={path}
                  end={path === '/'}
                  className={({ isActive }) =>
                    `flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] font-medium transition-all
                    ${isActive
                      ? 'bg-white/10 text-white'
                      : 'text-white/50 hover:bg-white/5 hover:text-white/90'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <Icon size={15} className={isActive ? 'text-[#60a5fa]' : 'text-white/35'} />
                      <span className="flex-1 leading-tight">{itemLabel}</span>
                      {badge && (
                        <span className="text-[9px] font-bold bg-blue-500 text-white px-1.5 py-0.5 rounded-full leading-none">
                          {badge}
                        </span>
                      )}
                      {isActive && !badge && <ChevronRight size={12} className="text-[#60a5fa]" />}
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Account (demo) */}
      <AccountSwitcher />

      {/* Footer */}
      <div className="px-4 py-3 border-t border-white/10">
        <p className="text-[11px] text-white/25">Toyota Korea DT Team</p>
      </div>
    </aside>
  )
}
