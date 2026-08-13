import { useState } from 'react'
import PageHeader from '../../components/PageHeader'
import HtmlReportStudio from '../../components/HtmlReportStudio'
import { useModel } from '../../llm/ModelContext'

// 딜러 계약퍼널 자동화(요구사항정의서 2026-08-10) 작업 화면.
//
// 이 페이지는 **작업대 하나만** 둔다. 전에는 아래에 집계·시승 파이프라인·예측·
// 이상현상·지표 정의·채널 매핑·진행 단계까지 여덟 섹션이 붙어 있었는데, 같은 내용이
// 생성된 HTML 문서 안에도 들어간다 — 화면과 문서에 같은 표가 두 벌 있으면 한쪽만
// 고쳐졌을 때 어느 쪽이 맞는지 알 수 없다. 문서가 산출물이므로 문서를 남긴다.
//
// 곁들여 그 섹션들이 부르던 /activity · /testdrive · /forecast · /insight 네 요청이
// 사라진다. 작업대가 쓰는 /report.html · /metrics 둘만 남는다.
//
// 요구사항정의서 2-1의 역할 분리는 그대로다:
//   코드  집계(3-1 채널매핑) · 부분월 예측(3-6) · 이상탐지 — 결정론적
//   AI    원인 해석·문구 생성(4장) · HTML 편집
export default function KtwsHtmlReport() {
  const { modelQuery } = useModel()
  const [brand, setBrand] = useState('')

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="HTML 작성 (실험)"
        description="딜러 계약퍼널(활동→기회→시승→계약) 분석을 단일 HTML 대시보드로 자동 생성하고, 챗봇으로 원하는 모습이 될 때까지 고칩니다. 문서에 없는 지표·축은 인증 리포트에서 조달해 넣습니다. 집계는 코드가 결정론적으로 처리하고, AI는 원인 해석·문구 생성과 HTML 편집을 맡습니다."
      />

      {/* 브랜드는 작업대가 어떤 문서를 만들지 정하는 축이라 위에 둔다. */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1 rounded-md border border-gray-200 bg-white p-0.5">
          {[['', '전체'], ['LEXUS', '렉서스'], ['TOYOTA', '토요타']].map(([v, label]) => (
            <button
              key={label}
              type="button"
              onClick={() => setBrand(v)}
              className={`rounded px-3 py-1 text-sm ${brand === v ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
            >
              {label}
            </button>
          ))}
        </div>
        <p className="text-xs text-gray-500">
          데이터·차트·표·AI 해석을 한 파일에 담습니다. 외부 요청이 없어 사내망·오프라인에서도 그대로 열립니다(정의서 2-2 (a)).
        </p>
      </div>

      <HtmlReportStudio
        brand={brand}
        sourceUrl={`/api/dealer-funnel/report.html?${['download=false', brand && `brand=${brand}`, modelQuery].filter(Boolean).join('&')}`}
        metricsUrl={`/api/dealer-funnel/metrics${brand ? `?brand=${brand}` : ''}`}
        downloadName={`dealer-funnel-${brand ? `${brand.toLowerCase()}-` : ''}${new Date().toISOString().slice(0, 10)}.html`}
      />
    </div>
  )
}
