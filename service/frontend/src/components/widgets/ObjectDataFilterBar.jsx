export default function ObjectDataFilterBar({ controls, values, onChange }) {
  if (!Array.isArray(controls) || !controls.length) return null
  return (
    <div className="flex min-w-0 flex-wrap justify-end gap-1.5">
      {controls.map((control) => (
        <label key={control.field} className="min-w-0">
          <span className="sr-only">{control.label}</span>
          <select
            value={values?.[control.field] || ''}
            onChange={(event) => onChange?.(control.field, event.target.value)}
            aria-label={control.label}
            className="max-w-[148px] rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] text-slate-600 outline-none hover:border-slate-300 focus:border-blue-400"
          >
            <option value="">{`${control.label}: \uC804\uCCB4`}</option>
            {control.options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        </label>
      ))}
    </div>
  )
}
