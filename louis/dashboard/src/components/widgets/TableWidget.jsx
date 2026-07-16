export default function TableWidget({ title, columns, rows, height }) {
  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
      <h4 className="text-sm font-semibold text-gray-700 mb-3">{title}</h4>
      <div className="overflow-x-auto" style={height ? { maxHeight: height, overflowY: 'auto' } : undefined}>
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-gray-50">
              {columns.map((col, i) => (
                <th key={i} className="px-3 py-2 text-left font-medium text-gray-600">{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, ri) => (
              <tr key={ri} className="border-t border-gray-50 hover:bg-gray-50">
                {row.map((cell, ci) => (
                  <td key={ci} className="px-3 py-2 text-gray-700">
                    {typeof cell === 'number' ? cell.toLocaleString() : cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
