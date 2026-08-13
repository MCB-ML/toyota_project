import { CalendarClock, Database, FileText, HardDrive, Layers, PlayCircle } from "lucide-react";
import type { ColumnList } from "../../../../../../types/dataset.types";

interface DatasetImportProps {
  state: any;
}

const DatasetReview = ({ state }: DatasetImportProps) => {
  const title = state.importMethod.ext === "pdf" ? "Index" : "Table";
  const group = state.importMethod.group === "opendb";
  const capitalize = (value = "") => value.charAt(0).toUpperCase() + value.slice(1);
  return (
    <div className="overflow-auto h-[550px] max-h-[550px] min-w-0 border border-gray-200 rounded-xl shadow-sm">
      <div className="bg-white px-6 pt-3 pb-5 space-y-5 text-sm text-gray-900">
        <div>
          <h2 className="text-md font-semibold">Import Summary</h2>
          <p className="text-gray-500 text-sm">Review the dataset information before continuing</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {!group && (
            <div className="flex items-center gap-3 p-3 rounded-lg border bg-gray-50">
              <FileText className="w-5 h-5 text-blue-500 shrink-0" />
              <div className="flex flex-col min-w-0">
                <span className="text-gray-500">File Name</span>
                <span className="font-medium truncate">{state.importMethod.name}</span>
              </div>
            </div>
          )}
          <div className="flex items-center gap-3 p-3 rounded-lg border bg-gray-50">
            <Layers className="w-5 h-5 text-indigo-500 shrink-0" />
            <div className="flex flex-col">
              <span className="text-gray-500"> {!group ? "File " : " Method "} Type</span>
              <span className="font-medium uppercase">{state.importMethod.ext}</span>
            </div>
          </div>
          {!group && (
            <div className="flex items-center gap-3 p-3 rounded-lg border bg-gray-50">
              <HardDrive className="w-5 h-5 text-emerald-500 shrink-0" />
              <div className="flex flex-col">
                <span className="text-gray-500">File Size</span>
                <span className="font-medium">{state.importMethod.size}</span>
              </div>
            </div>
          )}
          <div className="flex items-center gap-3 p-3 rounded-lg border bg-gray-50">
            <Database className="w-5 h-5 text-purple-500 shrink-0" />
            <div className="flex flex-col">
              <span className="text-gray-500">Import Method</span>
              <span className="font-medium">
                {capitalize(state.selectedTabImport)} {title}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-lg border bg-gray-50">
            <Database className="w-5 h-5 text-orange-500 shrink-0" />
            <div className="flex flex-col min-w-0">
              <span className="text-gray-500">{title} Source</span>
              <span className="font-medium truncate">{state.importSource}</span>
            </div>
          </div>

          {group && (
            <div className="flex items-center gap-3 p-3 rounded-lg border bg-gray-50">
              <PlayCircle className="w-5 h-5 text-emerald-500 shrink-0" />
              <div className="flex flex-col">
                <span className="text-gray-500">Run Process</span>
                <span className="font-medium">
                  {state.jobMethod === "1" ? "One Time " : "Recurring"}
                </span>
              </div>
            </div>
          )}

          {group && state.jobMethod === "2" && (
            <div className="flex items-center gap-3 p-3 rounded-lg border bg-gray-50">
              <CalendarClock className="w-5 h-5 text-blue-500 shrink-0" />
              <div className="flex flex-col">
                <span className="text-gray-500">Run Schedule Date</span>
                <span className="font-medium">{`${state.jobRunDate} ${state.jobRunTime}`}</span>
              </div>
            </div>
          )}
        </div>
      </div>
      {title === "Table" && (
        <div className="bg-white px-6 py-1 space-y-4">
          <div>
            <p className="text-sm text-gray-500">Columns detected from the uploaded dataset</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {state.previewData?.typeDataValue.map((data: ColumnList, index: number) => (
              <div
                key={index}
                className="flex items-center justify-between gap-2 rounded-lg border bg-[#e8f6ff] px-3 py-2 text-sm text-gray-800"
                title={`${data.columnName}${data.dataType ? ` (${data.dataType})` : ""}`}
              >
                <span className="font-medium truncate">{data.columnName}</span>

                {data.dataType && (
                  <span className="shrink-0 rounded-md bg-white/70 px-2 py-0.5 text-xs font-semibold text-gray-700">
                    {data.dataType}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DatasetReview;
