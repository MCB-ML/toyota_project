import TableSkeleton from "../../../../../reusable/TableSkeleton";

interface DatasetFabricPreviewDataProps {
  queryResultData: any;
  isFetchingSampleData: boolean;
}

const DatasetFabricPreviewData = ({
  queryResultData,
  isFetchingSampleData,
}: DatasetFabricPreviewDataProps) => {
  if (isFetchingSampleData) return <TableSkeleton rowCount={3} columnCount={3} />;

  return (
    <div className="w-full mt-3">
      {queryResultData?.length > 0 ? (
        <div className="w-full overflow-auto">
          <table className="table-auto border border-gray-300 text-sm w-full">
            <thead className="font-[Segoe_UI] bg-gray-100">
              <tr>
                {Object.keys(queryResultData[0]).map((key) => (
                  <th
                    key={key}
                    className="border px-2 py-1 whitespace-nowrap font-[Segoe_UI] font-bold font-bold text-left"
                  >
                    {key}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="font-['Segoe_UI'] text-xs">
              {queryResultData.map((row: any, i: number) => (
                <tr key={i}>
                  {Object.values(row).map((val: any, j) => (
                    <td key={j} className="border px-2 py-1 whitespace-nowrap font-['Segoe_UI']">
                      {val}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <i>No result data.</i>
      )}
    </div>
  );
};

export default DatasetFabricPreviewData;
