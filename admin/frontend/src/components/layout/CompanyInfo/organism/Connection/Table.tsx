import { ChevronDown, ChevronRight, Search } from "lucide-react";
import { type Dispatch, type SetStateAction, useEffect, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { useGetTop10Data } from "../../../../../services/api/company/getTop10Data";
import type { CompanyConnections, Source, TableList } from "../../../../../types/companyInfo.types";
import type { ColumnList } from "../../../../../types/dataset.types";
import TableSkeleton from "../../../../reusable/TableSkeleton";

interface TableListProps {
  loadingTable: boolean;
  connection: CompanyConnections;
  data: TableList[];
  selectedTables: Source[];
  setSelectedTables: Dispatch<SetStateAction<Source[]>>;
}

const Table = ({
  loadingTable,
  data,
  connection,
  selectedTables,
  setSelectedTables,
}: TableListProps) => {
  const [openTables, setOpenTables] = useState<Record<string, boolean>>({});

  const [preview, setPreview] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const { mutateAsync, isPending } = useGetTop10Data();
  const isSelected = (tableName: string) => selectedTables.some((t) => t.sourceName === tableName);

  const toggleTable = async (tableName: string) => {
    setOpenTables((prev) => ({
      ...prev,
      [tableName]: !prev[tableName],
    }));
  };
  const selectTable = async (tableName: string) => {
    try {
      let data: CompanyConnections | null = null;

      if (connection) {
        data = connection;
        data.table = tableName;
        data.configType = "dataagent";
      }
      if (data) {
        const result = await mutateAsync(data);

        if (result?.success) setPreview(result?.result ?? []);
      }
    } catch (error) {
      console.error("Connection failed:", error);
    }
  };

  const selectAllTables = () => {
    const allSelected = filteredTables.every((tbl) =>
      selectedTables.some((t) => t.sourceName === tbl.tableName),
    );

    if (allSelected) {
      setSelectedTables((prev) =>
        prev.filter((t) => !filteredTables.some((f) => f.tableName === t.sourceName)),
      );
    } else {
      const newTables: Source[] = filteredTables
        .filter((tbl) => !selectedTables.some((t) => t.sourceName === tbl.tableName))
        .map((tbl) => ({
          Id: uuidv4(),
          sourceName: tbl.tableName,
        }));

      setSelectedTables((prev) => [...prev, ...newTables]);
    }
  };

  const toggleSelect = (tableName: string) => {
    setSelectedTables((prev) => {
      const exists = prev.find((t) => t.sourceName === tableName);

      if (exists) {
        return prev.filter((t) => t.sourceName !== tableName);
      }

      return [
        ...prev,
        {
          Id: uuidv4(),
          sourceName: tableName,
        },
      ];
    });
  };

  const filteredTables = data.filter((tbl) =>
    tbl.tableName.toLowerCase().includes(search.toLowerCase()),
  );

  useEffect(() => {
    setSelectedTables((prev) => prev.filter((t) => data.some((d) => d.tableName === t.sourceName)));
  }, [data]);

  return (
    <div className="flex flex-col h-full overflow-hidden min-h-140">
      <div className="border-b p-5">
        <h2 className="text-lg font-semibold text-gray-800">Choosing Table</h2>
        <p className="text-sm text-gray-500">
          Select the tables you want to include from the connected database.
        </p>
      </div>
      <div className="flex items-center justify-between px-5 py-3 border-b bg-gray-50 gap-4">
        <div className="flex items-center gap-4 text-sm text-gray-700">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={
                filteredTables.length > 0 &&
                filteredTables.every((tbl) =>
                  selectedTables.some((t) => t.sourceName === tbl.tableName),
                )
              }
              onChange={selectAllTables}
            />
            <span className="font-semibold">Select All</span>
          </label>

          <div>
            <span className="font-semibold">Total Tables :</span> {data.length}
          </div>

          <div>
            <span className="font-semibold">Selected :</span>{" "}
            <span className="text-red-600">{selectedTables.length}</span>
          </div>
        </div>

        <div className="flex items-center border rounded-md px-3 py-1 text-sm w-52 bg-white focus-within:ring-1 focus-within:ring-blue-500">
          <Search size={15} className="text-gray-400 mr-2" />

          <input
            type="text"
            placeholder="Search tables..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 outline-none bg-transparent text-sm placeholder:text-gray-400"
          />
        </div>
      </div>

      <div className="flex gap-4 px-5 py-5 overflow-hidden h-full ">
        <div className="w-50   flex flex-col   gap-3  overflow-y-auto ">
          {loadingTable ? <TableSkeleton columnCount={1} rowCount={5} /> : ""}
          {!loadingTable &&
            filteredTables.map((tbl) => {
              const isOpen = openTables[tbl.tableName];

              return (
                <div key={tbl.tableName} className="border rounded-lg shadow-sm bg-white ">
                  <div className="flex items-center  px-2 py-3 hover:bg-gray-50 ">
                    {isOpen ? (
                      <ChevronDown size={15} onClick={() => toggleTable(tbl.tableName)} />
                    ) : (
                      <ChevronRight size={15} onClick={() => toggleTable(tbl.tableName)} />
                    )}
                    <button
                      disabled={isPending}
                      onClick={() => selectTable(tbl.tableName)}
                      className="ml-2 flex items-center gap-2 font-semibold text-gray-800 text-sm cursor-pointer truncate"
                    >
                      <div className="truncate" title={tbl.tableName}>
                        {tbl.tableName}
                      </div>
                    </button>

                    <div className="flex items-center gap-2 ml-auto">
                      <input
                        type="checkbox"
                        checked={isSelected(tbl.tableName)}
                        onChange={() => toggleSelect(tbl.tableName)}
                      />
                    </div>
                  </div>

                  {isOpen && (
                    <div className="border-t px-4 py-3 flex flex-col gap-2 max-h-50 overflow-y-auto">
                      {tbl.columnList.map((col: ColumnList) => (
                        <div
                          key={col.columnName}
                          className="flex justify-between text-sm text-gray-700 bg-gray-50 px-3 py-2 rounded text-xs"
                        >
                          <span className="truncate" title={col.columnName}>
                            {col.columnName}
                          </span>
                          <span className="text-gray-500 " title={col.dataType}>
                            {col.dataType}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
        </div>

        <div className="flex-1 border rounded-lg bg-white  overflow-x-auto">
          {isPending ? <TableSkeleton columnCount={4} rowCount={10} /> : ""}
          {!isPending && preview && preview.length > 0 ? (
            <div className="w-full overflow-auto">
              <table className="table-auto border border-gray-300 text-sm w-full">
                <thead className="font-[Segoe_UI] bg-gray-100">
                  <tr>
                    {Object.keys(preview[0]).map((key) => (
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
                  {preview.map((row: any, i: number) => (
                    <tr key={i}>
                      {Object.values(row).map((val: any, j) => (
                        <td
                          key={j}
                          className="border px-2 py-2 whitespace-nowrap font-['Segoe_UI']"
                        >
                          {val}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-4">
              <h2 className="font-semibold text-gray-700 mb-2">Preview Data</h2>
              <p className="text-sm text-gray-500">Select a table to preview its data.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Table;
