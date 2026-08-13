import TableSkeleton from "../../../reusable/TableSkeleton";

interface DatasetPreviewTableProps {
  show: boolean;
  isLoading: boolean;
  sourceName: string;
  data?: Record<string, any>[];
  title?: string;
}

export const DatasetSourcePreviewTable = ({
  show,
  isLoading,
  data = [],
  sourceName = "",
  title = "Dataset Preview of ",
}: DatasetPreviewTableProps) => {
  const hasData = data.length > 0;
  const columns = hasData ? Object.keys(data[0]) : [];

  if (isLoading) {
    return <TableSkeleton columnCount={3} rowCount={10} />;
  }
  return (
    <div
      hidden={!show}
      className="px-4 py-2 rounded-lg bg-white overflow-hidden w-full max-w-full overflow-y-auto h-full"
    >
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-gray-700">{title + sourceName}</h2>
      </div>

      {hasData ? (
        <div className="relative w-full max-w-full overflow-x-auto ">
          <table className="min-w-max border-collapse text-sm">
            <thead className="bg-gray-100 sticky top-0 z-10">
              <tr>
                {columns.map((key) => (
                  <th
                    key={key}
                    className="px-3 py-2 text-left text-gray-600 font-medium border"
                    style={{ whiteSpace: "nowrap" }}
                  >
                    {key}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {data.map((row, rowIndex) => (
                <tr key={rowIndex} className="hover:bg-gray-50">
                  {columns.map((col, colIndex) => (
                    <td
                      key={colIndex}
                      className="px-3 py-2 border text-gray-700"
                      style={{ whiteSpace: "nowrap" }}
                    >
                      {row[col] ?? "-"}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-6 text-gray-400 italic">No data available to preview</div>
      )}
    </div>
  );
};
