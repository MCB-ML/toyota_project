import type { CompanyConnections, Source } from "../../../../../types/companyInfo.types";

interface PreviewProps {
  tab: string;
  connection: CompanyConnections;
  selectedTables: Source[];
}

const Preview = ({ tab, connection, selectedTables }: PreviewProps) => {
  return (
    <div className="flex flex-col gap-6 px-5 py-5 min-h-140">
      <div className="border-b pb-3">
        <h2 className="text-lg font-semibold text-gray-800">Connection Preview</h2>
        <p className="text-sm text-gray-500">
          Review the connection and selected tables before saving.
        </p>
      </div>

      <div className="border rounded-lg bg-white shadow-sm p-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Connection Information</h3>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <span className="text-gray-500">Type:</span> <span className="font-medium">{tab}</span>
          </div>

          {"endpoint" in connection && (
            <div className="truncate">
              <span className="text-gray-500">Endpoint:</span>{" "}
              <span className="font-medium truncate" title={connection.endpoint}>
                {connection.endpoint}
              </span>
            </div>
          )}

          {"database" in connection && (
            <div className="truncate">
              <span className="text-gray-500">Database:</span>{" "}
              <span className="font-medium truncate" title={connection.database}>
                {connection.database}
              </span>
            </div>
          )}

          {"user" in connection && (
            <div className="truncate">
              <span className="text-gray-500">User:</span>{" "}
              <span className="font-medium truncate" title={connection.user}>
                {connection.user}
              </span>
            </div>
          )}
        </div>
      </div>

      {tab !== "rag" && (
        <div className="border rounded-lg bg-white shadow-sm p-4">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-sm font-semibold text-gray-700">Selected Tables</h3>

            <span className="text-xs text-gray-500">{selectedTables.length} tables</span>
          </div>

          {selectedTables.length === 0 ? (
            <div className="text-sm text-gray-500">No tables selected</div>
          ) : (
            <div className="flex flex-wrap gap-2 max-h-50 overflow-y-auto">
              {selectedTables.map((table) => (
                <span
                  key={table.Id}
                  className="px-3 py-1 text-xs bg-blue-50 text-blue-700 rounded-md border"
                >
                  {table.sourceName}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Preview;
