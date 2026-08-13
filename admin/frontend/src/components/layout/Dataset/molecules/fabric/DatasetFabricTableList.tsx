import {
  Calendar,
  ChevronDown,
  ChevronRight,
  Columns,
  Hash,
  Table,
  ToggleLeft,
  Type,
} from "lucide-react";
import { useState } from "react";
import type { ColumnList } from "../../../../../types/dataset.types";
import type { FabricTableList } from "../../../../../types/datasetFabric.types";

interface DatasetFabricTableListProps {
  fabricTableList: FabricTableList[];
}

export const DatasetFabricTableList = ({ fabricTableList }: DatasetFabricTableListProps) => {
  const [expandedTables, setExpandedTables] = useState<{ [key: string]: boolean }>({});

  const toggleExpand = (tableName: string) => {
    setExpandedTables((prev) => ({
      [tableName]: !prev[tableName],
    }));
  };

  const onDragStart = (event: React.DragEvent, table: FabricTableList) => {
    event.dataTransfer.setData("table", JSON.stringify(table));
    event.dataTransfer.effectAllowed = "move";
  };

  const getColumnIcon = (type: string) => {
    const t = type.toLowerCase();

    if (t.includes("int") || t.includes("number")) return Hash;
    if (t.includes("char") || t.includes("text")) return Type;
    if (t.includes("date") || t.includes("time")) return Calendar;
    if (t.includes("bool")) return ToggleLeft;

    return Columns;
  };

  return (
    <>
      {fabricTableList.map((table, index) => (
        <div
          key={index}
          draggable
          className="mb-1 cursor-move"
          onDragStart={(e) => onDragStart(e, table)}
        >
          <div className="flex items-center text-sm" onClick={() => toggleExpand(table.tableName)}>
            <div className="w-6 flex justify-center">
              {expandedTables[table.tableName] ? (
                <ChevronDown className="w-4 h-4 text-[#9ca3af]" />
              ) : (
                <ChevronRight className="w-4 h-4 text-[#9ca3af]" />
              )}
            </div>

            <div
              className={`flex-1 py-2 px-3 flex items-center rounded-md transition-colors
          ${
            expandedTables[table.tableName]
              ? "bg-[#eff6ff] text-[#155dfc] font-bold"
              : "hover:bg-[#eff6ff] hover:text-[#155dfc] hover:font-bold"
          }
        `}
            >
              <Table size={14} className="mr-2 text-gray-400" />
              {table.tableName}
            </div>
          </div>

          {expandedTables[table.tableName] && (
            <div className="flex">
              <div className="w-6 flex justify-center">
                <div className="w-px bg-[#dbeafe]" />
              </div>

              <div className="flex-1 pl-3 py-1 space-y-1">
                {table.columnList?.map((col: ColumnList, ci: number) => {
                  const Icon = getColumnIcon(col.dataType);

                  return (
                    <div key={ci} className="text-xs flex justify-between items-center">
                      <span className="flex items-center gap-2 text-gray-700">
                        <Icon size={12} className="text-gray-400 shrink-0" />
                        {col.columnName}
                      </span>

                      <span className="text-[#347298] pr-1">{col.dataType}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      ))}
    </>
  );
};
