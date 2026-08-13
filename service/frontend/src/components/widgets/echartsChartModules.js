// EChartsWidget 이 등록하는 차트/컴포넌트 모듈을 한 곳에 모은다.
//
// echarts/core(트리셰이킹 빌드)는 쓰는 시리즈 타입을 직접 등록해야 한다. 여기 빠진
// 타입은 setOption 이 콘솔 에러만 남기고 조용히 무시해 "빈 위젯"이 된다 — 퍼널이
// 그랬다(echartsViz.js 에 funnelOption 은 있는데 FunnelChart 등록이 빠져 있어,
// 퍼널로 바꾸면 아무것도 안 나왔다).
//
// echartsViz.js 의 CHART_CODE_BY_WIDGET_TYPE 에 새 kind 를 추가하면 반드시 여기에도
// 해당 차트 모듈을 추가할 것. backend/echartsRegistration.test.js 가 모든 kind 를
// 실제로 SSR 렌더해 등록 누락을 잡는다.
//
// 렌더러(Canvas/SVG)는 일부러 뺐다 — 앱은 CanvasRenderer, SSR 테스트는 SVGRenderer 를
// 각자 얹는다.
import {
  BarChart,
  FunnelChart,
  LineChart,
  PieChart,
  RadarChart,
  ScatterChart,
} from 'echarts/charts'
import {
  DataZoomComponent,
  GridComponent,
  LegendComponent,
  RadarComponent,
  TitleComponent,
  TooltipComponent,
} from 'echarts/components'

export const ECHARTS_CHART_MODULES = [
  BarChart,
  FunnelChart,
  LineChart,
  PieChart,
  RadarChart,
  ScatterChart,
  DataZoomComponent,
  GridComponent,
  LegendComponent,
  RadarComponent,
  TitleComponent,
  TooltipComponent,
]
