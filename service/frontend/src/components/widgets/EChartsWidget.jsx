import { useEffect, useMemo, useRef, useState } from 'react'
import * as echarts from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import ChartSurface, { chartViewport } from './ChartSurface'
import { compileEChartsWidget } from './echartsViz'
import { ECHARTS_CHART_MODULES } from './echartsChartModules'
import { chartPaletteBackground } from '../../utils/chartColors'
import { normalizeChartTextSizes } from '../../utils/dashboardTypography'

// 차트/컴포넌트 목록은 echartsChartModules.js 한 곳에서 관리한다 — 여기 등록이 빠진
// 시리즈 타입은 조용히 빈 위젯이 된다(퍼널이 그랬다).
echarts.use([...ECHARTS_CHART_MODULES, CanvasRenderer])

function EChartsCanvas({ option, width, height, title, onError }) {
  const elementRef = useRef(null)
  const instanceRef = useRef(null)

  useEffect(() => {
    const element = elementRef.current
    if (!element) return undefined
    let frame = 0
    try {
      const instance = echarts.init(element, undefined, { renderer: 'canvas' })
      instanceRef.current = instance
      const resize = () => {
        cancelAnimationFrame(frame)
        frame = requestAnimationFrame(() => instance.resize())
      }
      const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(resize)
      observer?.observe(element)
      window.addEventListener('resize', resize)
      return () => {
        cancelAnimationFrame(frame)
        observer?.disconnect()
        window.removeEventListener('resize', resize)
        instance.dispose()
        instanceRef.current = null
      }
    } catch (error) {
      onError?.(error)
      return undefined
    }
  }, [onError])

  useEffect(() => {
    const instance = instanceRef.current
    if (!instance) return
    try {
      instance.setOption(option, { notMerge: true, lazyUpdate: true })
      instance.resize()
    } catch (error) {
      onError?.(error)
    }
  }, [option, onError])

  return <div ref={elementRef} role="img" aria-label={title} className="h-full w-full" style={{ width, height }} />
}

function EChartsContent({ name, props, objectSpec, viewport, title, error, onError }) {
  const compiled = useMemo(() => {
    try {
      return compileEChartsWidget(name, props, objectSpec, viewport)
    } catch (compileError) {
      return { error: compileError }
    }
  }, [name, props, objectSpec, viewport.width, viewport.height])

  if (compiled.error || error) {
    return <div className="flex h-full items-center justify-center px-4 text-center text-xs text-red-500">차트 설정을 해석하지 못했습니다.</div>
  }
  const hasHorizontalScroll = Number.isFinite(compiled.scrollWidth) && typeof viewport.width === 'number' && compiled.scrollWidth > viewport.width
  if (!hasHorizontalScroll) {
    return <EChartsCanvas option={compiled.option} width={viewport.width} height={viewport.height} title={title} onError={onError} />
  }
  return (
    <div className="h-full w-full overflow-x-auto overflow-y-hidden pb-1">
      <div style={{ width: compiled.scrollWidth, height: viewport.height }}>
        <EChartsCanvas option={compiled.option} width={compiled.scrollWidth} height={viewport.height} title={title} onError={onError} />
      </div>
    </div>
  )
}

export default function EChartsWidget({ name, props, objectSpec, height, fill = false, filterToolbar }) {
  const features = objectSpec?.vizSpec?.features || {}
  const backgroundColor = chartPaletteBackground(features.colorPalette, features.customPalette)
  const titleFontSize = normalizeChartTextSizes(features.textSizes).title
  const [error, setError] = useState(null)
  const title = props?.title || objectSpec?.title || '차트'
  const resolvedHeight = fill ? '100%' : (height ?? ((props?.y_keys?.length || props?.bar_keys?.length || 0) > 2 ? 280 : 220))
  const preview = useMemo(() => {
    try {
      return compileEChartsWidget(name, props, objectSpec, {})
    } catch (compileError) {
      return { error: compileError, bottomPadding: 8 }
    }
  }, [name, props, objectSpec])

  useEffect(() => setError(null), [name, props, objectSpec])

  return (
    <ChartSurface title={title} fill={fill} height={resolvedHeight} bottomPadding={preview.bottomPadding ?? 8} toolbar={filterToolbar} backgroundColor={backgroundColor} titleFontSize={titleFontSize}>
      {(size) => {
        const viewport = chartViewport(size, resolvedHeight)
        return <EChartsContent name={name} props={props} objectSpec={objectSpec} viewport={viewport} title={title} error={error || preview.error} onError={setError} />
      }}
    </ChartSurface>
  )
}
