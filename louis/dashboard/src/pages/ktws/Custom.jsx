import PageHeader from '../../components/PageHeader'
import { LayoutGrid } from 'lucide-react'

export default function KtwsCustom() {
  return (
    <div className="p-6 space-y-6">
      <PageHeader title="대시보드 커스텀" description="KTWS 대시보드 커스텀 — 준비 중입니다." />

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 flex flex-col items-center justify-center text-center">
        <LayoutGrid size={40} className="text-gray-300 mb-3" />
        <p className="text-sm text-gray-500">준비 중인 페이지입니다.</p>
      </div>
    </div>
  )
}
