import { useEffect, useMemo, useState } from 'react'
import { ArrowDown, ArrowUp, ArrowUpDown, Minus, TrendingDown, TrendingUp } from 'lucide-react'
import { formatTableValue, inferredTableSpec, progressValue, sortTableRows, statusTone, tableRowsFromProps, toneForValue } from './tableModel'

const DENSITY_CLASS = {
  compact: 'px-2.5 py-1.5',
  comfortable: 'px-3 py-2.5',
  spacious: 'px-3 py-3.5',
}

const STATUS_CLASS = {
  success: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  warning: 'bg-amber-50 text-amber-700 ring-amber-200',
  danger: 'bg-rose-50 text-rose-700 ring-rose-200',
  neutral: 'bg-slate-100 text-slate-600 ring-slate-200',
}

function alignClass(align) {
  return align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : 'text-left'
}

function TrendCell({ value, column }) {
  const number = Number(value)
  if (!Number.isFinite(number)) return <span>{formatTableValue(value, column)}</span>
  const Icon = number > 0 ? TrendingUp : number < 0 ? TrendingDown : Minus
  const tone = toneForValue(number, column.toneRules)
  const color = tone === 'success' ? 'text-emerald-600' : tone === 'danger' ? 'text-rose-600' : tone === 'warning' ? 'text-amber-600' : number > 0 ? 'text-emerald-600' : number < 0 ? 'text-rose-600' : 'text-slate-400'
  return <span className={`inline-flex items-center justify-end gap-1 ${color}`}><Icon size={14} />{formatTableValue(Math.abs(number), column)}</span>
}

function ProgressCell({ value, column }) {
  const progress = progressValue(value, column.progress)
  const tone = toneForValue(value, column.toneRules)
  const fillColor = tone === 'success' ? column.progress?.successColor || '#059669'
    : tone === 'warning' ? column.progress?.warningColor || '#D97706'
      : tone === 'danger' ? column.progress?.dangerColor || '#E11D48'
        : column.progress?.fillColor || '#2563EB'
  const targetPercent = progress.target !== null && Number.isFinite(progress.target)
    ? progressValue(progress.target, column.progress).percent
    : null
  return (
    <div className="flex min-w-[92px] items-center justify-end gap-2">
      <div className="relative h-1.5 min-w-[56px] flex-1 overflow-hidden rounded-full bg-slate-100">
        <div className="h-full rounded-full" style={{ width: `${progress.percent}%`, backgroundColor: fillColor }} />
        {column.progress?.showTargetMarker !== false && targetPercent !== null && targetPercent > 0 && targetPercent < 100 && <span className="absolute inset-y-0 w-px bg-slate-500/70" style={{ left: `${targetPercent}%` }} />}
      </div>
      {column.progress?.showValue !== false && <span className="tabular-nums text-slate-600">{formatTableValue(value, column)}</span>}
    </div>
  )
}

function TableCell({ value, column }) {
  if (column.cellRenderer === 'progress-bar') return <ProgressCell value={value} column={column} />
  if (column.cellRenderer === 'trend') return <TrendCell value={value} column={column} />
  if (column.cellRenderer === 'badge' || column.cellRenderer === 'status-badge') {
    return <span className={`inline-flex max-w-full rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ${STATUS_CLASS[statusTone(value)]}`}>{formatTableValue(value, column)}</span>
  }
  return <span className="block truncate" title={formatTableValue(value, column)}>{formatTableValue(value, column)}</span>
}

export default function TableWidget({ title, columns, rows, height, fill = false, tableSpec, columnMap, filterToolbar }) {
  const normalizedRows = useMemo(() => tableRowsFromProps(columns, rows), [columns, rows])
  const spec = useMemo(() => inferredTableSpec({ columns, rows, tableSpec, columnMap }), [columns, rows, tableSpec, columnMap])
  const resolvedColumns = spec.columns
  // 2026-08-04 leo: 표 컬럼의 저장 계약을 visible=true/false로 통일했다. false만
  // 렌더링에서 제외하므로 기본값과 기존에 값이 없는 컬럼은 계속 표시된다.
  const visibleColumns = resolvedColumns.filter((column) => column.visible !== false)
  const defaultSort = spec.defaultSort || {}
  const [sort, setSort] = useState({ field: defaultSort.field || null, direction: defaultSort.direction || 'asc' })
  const pageSize = Number(spec.pagination?.pageSize) || 0
  const [page, setPage] = useState(0)

  useEffect(() => {
    setSort({ field: defaultSort.field || null, direction: defaultSort.direction || 'asc' })
    setPage(0)
  }, [defaultSort.field, defaultSort.direction, columns, rows])

  const sortedRows = useMemo(() => sortTableRows(normalizedRows, sort.field, sort.direction), [normalizedRows, sort])
  const pageCount = pageSize ? Math.max(1, Math.ceil(sortedRows.length / pageSize)) : 1
  const currentPage = Math.min(page, pageCount - 1)
  const visibleRows = pageSize ? sortedRows.slice(currentPage * pageSize, (currentPage + 1) * pageSize) : sortedRows
  const density = DENSITY_CLASS[spec.density] || DENSITY_CLASS.comfortable
  const stickyHeader = spec.stickyHeader !== false && spec.scroll?.stickyHeader !== false
  const stickyFirstColumn = spec.scroll?.stickyFirstColumn === true || resolvedColumns[0]?.pinned === 'left'
  const tableMinWidth = Math.max(560, visibleColumns.reduce((total, column) => total + (column.width || column.minWidth || 120), 0))
  const typography = spec.typography

  const toggleSort = (column) => {
    if (column.sortable === false) return
    setPage(0)
    setSort((current) => current.field === column.field
      ? { field: column.field, direction: current.direction === 'asc' ? 'desc' : 'asc' }
      : { field: column.field, direction: 'asc' })
  }

  return (
    <div className={`rounded-lg border border-gray-100 bg-white px-2.5 pt-2 shadow-sm ${fill ? 'h-full min-h-0 flex flex-col' : ''}`} style={{ paddingBottom: 8 }}>
      <div className="mb-1.5 flex shrink-0 items-center justify-between gap-2">
        <h4 className="min-w-0 flex-1 truncate font-semibold leading-5 text-gray-700" style={{ fontSize: typography.titleFontSize }}>{title}</h4>
        {filterToolbar}
      </div>
      <div className={`${fill ? 'flex-1 min-h-0' : ''} overflow-auto`} style={fill ? undefined : { maxHeight: height || 260 }}>
        <table className="w-full border-separate border-spacing-0 text-xs" style={{ minWidth: tableMinWidth, fontSize: typography.bodyFontSize }}>
          {spec.showHeader !== false && (
            <thead>
              <tr>
                {visibleColumns.map((column, index) => {
                  const isSorted = sort.field === column.field
                  const SortIcon = !isSorted ? ArrowUpDown : sort.direction === 'asc' ? ArrowUp : ArrowDown
                  const pinnedLeft = stickyFirstColumn && index === 0
                  return (
                    <th
                      key={column.field}
                      className={`${density} ${alignClass(column.align)} ${stickyHeader ? 'sticky top-0 z-20' : ''} ${pinnedLeft ? 'sticky left-0 z-30' : ''} border-b border-slate-200 bg-slate-50 font-medium text-slate-600 whitespace-nowrap`}
                      style={{ minWidth: column.minWidth, width: column.width, maxWidth: column.maxWidth, fontSize: typography.headerFontSize }}
                    >
                      {column.sortable === false ? column.headerName : (
                        <button type="button" onClick={() => toggleSort(column)} className={`inline-flex max-w-full items-center gap-1 ${column.align === 'right' ? 'ml-auto' : column.align === 'center' ? 'mx-auto' : ''}`}>
                          <span className="truncate">{column.headerName}</span><SortIcon size={12} className={isSorted ? 'text-blue-600' : 'text-slate-400'} />
                        </button>
                      )}
                    </th>
                  )
                })}
              </tr>
            </thead>
          )}
          <tbody>
            {visibleRows.map((row, rowIndex) => (
              <tr key={row[spec.rowKeyField] ?? row.__rowId ?? rowIndex} className="group hover:bg-slate-50">
                {visibleColumns.map((column, columnIndex) => {
                  const pinnedLeft = stickyFirstColumn && columnIndex === 0
                  return (
                    <td
                      key={column.field}
                      className={`${density} ${alignClass(column.align)} ${pinnedLeft ? 'sticky left-0 z-10 group-hover:bg-slate-50 bg-white' : ''} border-b border-slate-100 text-slate-700 whitespace-nowrap`}
                      style={{ minWidth: column.minWidth, width: column.width, maxWidth: column.maxWidth }}
                    >
                      <TableCell value={row[column.field]} column={column} />
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
        {!visibleRows.length && <div className="flex min-h-28 items-center justify-center text-xs text-slate-400">{spec.emptyText || '조회된 데이터가 없습니다.'}</div>}
      </div>
      {pageSize > 0 && pageCount > 1 && (
        <div className="flex shrink-0 items-center justify-between px-1 pt-2 text-xs text-slate-500">
          <span>{currentPage + 1} / {pageCount}</span>
          <div className="flex gap-1">
            <button type="button" onClick={() => setPage((current) => Math.max(0, current - 1))} disabled={currentPage === 0} className="rounded border border-slate-200 px-2 py-1 disabled:opacity-40">이전</button>
            <button type="button" onClick={() => setPage((current) => Math.min(pageCount - 1, current + 1))} disabled={currentPage >= pageCount - 1} className="rounded border border-slate-200 px-2 py-1 disabled:opacity-40">다음</button>
          </div>
        </div>
      )}
    </div>
  )
}
