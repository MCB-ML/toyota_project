import { X } from "lucide-react";
import { useMemo, useState } from "react";
import { Switch } from "@/components/ui/switch";
import { useGetDatasetByType } from "../../../../../services/api/dataset/getDatasetByType";
import type { DataAgentSourceForm } from "../../../../../types/dataAgent.types";

export interface SourceFormProps {
  selectedCompany: string;
  dataAgentForm: DataAgentSourceForm[];
  addInputField: (operation: number, index: string, data: any) => void;
  sourceType: string;
}

const SourceForm = ({
  selectedCompany,
  dataAgentForm,
  addInputField,
  sourceType,
}: SourceFormProps) => {
  const [searchDataset, setSearchDataset] = useState("");

  const { data: datasetByType, isLoading: loadingDatasetByType } = useGetDatasetByType(
    sourceType,
    selectedCompany ?? null,
  );
  const filterData = useMemo(() => {
    if (!datasetByType?.result) return [];

    return datasetByType.result.filter((item) =>
      item.sourceName?.toLowerCase().includes(searchDataset.toLowerCase()),
    );
  }, [datasetByType, searchDataset]);

  const selectedSources = dataAgentForm?.filter((s) => s.type === sourceType) || [];

  const allChecked =
    filterData.length > 0 &&
    filterData.every((row) => selectedSources.some((s) => s.source === row.sourceName));
  const handleCheckAll = (checked: boolean) => {
    if (checked) {
      filterData.forEach((row) => {
        const exists = selectedSources.some((s) => s.source === row.sourceName);

        if (!exists) {
          addInputField(1, row.sourceName, {
            source: row.sourceName,
            type: sourceType,
          });
        }
      });
    } else {
      filterData.forEach((row) => {
        addInputField(3, row.sourceName, {
          source: row.sourceName,
          type: sourceType,
        });
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between relative">
        <input
          type="text"
          placeholder={sourceType === "sql" ? "Search table..." : "Search index..."}
          value={searchDataset}
          onChange={(e) => setSearchDataset(e.target.value)}
          className="w-full border rounded-lg px-3 py-2"
        />
        {searchDataset && (
          <X className="absolute right-4 w-4 h-4" onClick={(_e) => setSearchDataset("")} />
        )}
      </div>
      <div className="overflow-x-auto border rounded-xl">
        <table className="w-full text-sm">
          <thead className="bg-gray-100 text-left">
            <tr>
              <th className="px-4 py-3">{sourceType === "sql" ? "Table" : "Index"} Name</th>
              <th className="px-4 py-3 text-center">
                <div className="flex items-center justify-center gap-2">
                  <Switch checked={allChecked} onCheckedChange={handleCheckAll} />
                </div>
              </th>
            </tr>
          </thead>

          <tbody>
            {filterData.length === 0 && (
              <tr>
                <td colSpan={2} className="text-center py-6 text-gray-400">
                  No data found
                </td>
              </tr>
            )}

            {filterData.map((row, index) => {
              const matchedSource = dataAgentForm.find(
                (s: DataAgentSourceForm) => s.source === row.sourceName && s.type === sourceType,
              );

              const isChecked = !!matchedSource;
              const selectedId = matchedSource?.id;

              return (
                <tr key={row.Id ?? index} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-3">{row.sourceName}</td>

                  <td className="px-4 py-3 text-center">
                    <Switch
                      id={row.Id ?? ""}
                      checked={isChecked}
                      onCheckedChange={(checked) => {
                        addInputField(checked ? 1 : 3, row.sourceName, {
                          id: selectedId,
                          source: row.sourceName,
                          type: sourceType,
                        });
                      }}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SourceForm;
