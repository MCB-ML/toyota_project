import { CalendarClock, Check, Loader2, X } from "lucide-react";
import { useGetSchemaSourceList } from "../../../../../../services/api/dataset/getSchemaSourceList";
import type { Source } from "../../../../../../types/companyInfo.types";
import {
  type ColumnList,
  type DatasetResponse,
  TABS_DATASET_IMPORT,
} from "../../../../../../types/dataset.types";
import FloatingInputField from "../../../../../reusable/FloatingInputField";
import FloatingSelectField from "../../../../../reusable/FloatingSelectField";
import { DatasetJobSchedule } from "../../../molecules/DatasetJobSchedule";
import { DatasetTabImport } from "../../../molecules/DatasetTabImport";

interface DatasetConfigProps {
  companyId: string;
  state: any;
  dispatch: React.Dispatch<any>;
  sourceList: Source[] | DatasetResponse[];
}

export const DatasetConfig = ({ state, dispatch, sourceList, companyId }: DatasetConfigProps) => {
  const title = state.importMethod.ext === "pdf" ? "Index" : "Table";
  const group = state.importMethod.group;
  const existingSource =
    title === "Table"
      ? (sourceList?.map((data) => ({
          value: (data as Source).sourceName,
          label: (data as Source).sourceName,
        })) ?? [])
      : (sourceList?.map((data) => ({
          value: (data as DatasetResponse).sourceName,
          label: (data as DatasetResponse).sourceName,
        })) ?? []);

  const { data: datasetSchemaSourceList, isLoading: isfetchdatasetSchema } = useGetSchemaSourceList(
    companyId,
    state.selectedTabImport === "existing" ? state.importSource : "",
  );
  return (
    <div className="space-y-3">
      <DatasetTabImport
        onClickTab={(t) => dispatch({ type: "selectedTabImport", payload: t })}
        selectedTab={state.selectedTabImport}
        title={title}
      />

      {group === "opendb" && state.showJobSchedule && (
        <DatasetJobSchedule state={state} dispatch={dispatch} />
      )}

      <div className="rounded-xl shadow-md px-4 border py-1 ">
        <div className="mb-3 relative">
          {group === "opendb" && (
            <CalendarClock
              size={20}
              className="absolute right-0 top-4"
              onClick={() => dispatch({ type: "showJobSchedule", payload: true })}
            />
          )}

          {state.selectedTabImport === TABS_DATASET_IMPORT.NEW ? (
            <>
              <p className="text-md text-gray-500 py-4">
                Define the name {title === "Table" ? "and configure columns" : ""} for your new{" "}
                {title.toLowerCase()}.
              </p>
              <FloatingInputField
                id="importSource"
                label={`${title} Name`}
                value={state.importSource}
                type="text"
                onChange={(e) =>
                  dispatch({
                    type: "importSource",
                    payload: e.target.value,
                  })
                }
                placeholder="Enter the name of the new table to be created"
                error={false}
              />
            </>
          ) : (
            <>
              <p className="text-md text-gray-500 py-4">
                Select an existing table and configure columns for your {title.toLowerCase()}.
              </p>
              <FloatingSelectField
                id="importSource"
                label=""
                value={state.importSource}
                onChange={(e) =>
                  dispatch({
                    type: "importSource",
                    payload: e,
                  })
                }
                options={existingSource}
                placeholder="Select an existing table"
                error={false}
                errorMessage={""}
              />
            </>
          )}
        </div>
        {title === "Table" && (
          <div className="flex mb-3">
            <div className="w-60">Column Name</div>

            <div className="w-60 px-5">
              {state.selectedTabImport === TABS_DATASET_IMPORT.NEW ? "Data Type" : "Table Columns"}
            </div>
          </div>
        )}

        <div className=" overflow-y-auto  m-h-[400px]  h-[260px] pb-5  flex gap-3">
          <div className="">
            {state.previewData?.typeDataValue.map((data: ColumnList, index: number) => (
              <div key={index} className="text-sm py-2 flex items-center gap-3 text-gray-800 ">
                <div className=" rounded-xl shadow px-5 py-2.5 text-sm w-60 truncate bg-[#e8f6ff] shrink-0">
                  {data.columnName}
                </div>

                {title === "Table" && state.selectedTabImport === TABS_DATASET_IMPORT.NEW && (
                  <>
                    <div className="w-60">
                      <FloatingSelectField
                        id={data.columnName}
                        label=""
                        value={data.dataType}
                        onChange={(e) =>
                          dispatch({
                            type: "changeColumnType",
                            field: data.columnName,
                            value: e,
                          })
                        }
                        options={[
                          {
                            label: "String",
                            value: "String",
                          },
                          {
                            label: "Integer",
                            value: "Integer",
                          },
                          {
                            label: "Date",
                            value: "Date",
                          },
                          {
                            label: "Decimal",
                            value: "Decimal",
                          },
                        ]}
                        placeholder=""
                        error={false}
                        errorMessage={""}
                      />
                    </div>

                    <div className=" w-60 justify-center ml-3">
                      {data.dataType !== "" ? (
                        <Check className="size-5 text-green-600" />
                      ) : (
                        <X className="size-5 text-red-600" />
                      )}
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
          <div className="">
            {title === "Table" &&
              state.selectedTabImport === TABS_DATASET_IMPORT.EXISTING &&
              sourceList
                ?.filter((data) => (data as Source).sourceName === state.importSource)
                .map((data) => (
                  <div key={(data as Source).sourceName} className="mt-2 text-sm text-gray-800">
                    {isfetchdatasetSchema ? (
                      <Loader2 size={15} className="animate-spin text-gray-400 m-auto" />
                    ) : datasetSchemaSourceList?.result?.tableColumn?.length ? (
                      datasetSchemaSourceList.result.tableColumn.map((col: string) => {
                        const exists = state.previewData?.typeDataValue?.some(
                          (preview: ColumnList) => preview.columnName === col,
                        );

                        return (
                          <div key={col} className="flex items-center gap-2">
                            <div
                              className="flex justify-between mb-4 text-sm items-center gap-3"
                              title={col}
                            >
                              <div className="text-gray-700 w-60 truncate bg-[#e8f6ff] rounded-xl shadow shrink-0 px-5 py-2.5">
                                {col}
                              </div>
                              <div>
                                {exists ? (
                                  <Check className="size-5 text-green-600" />
                                ) : (
                                  <X className="size-5 text-red-600" />
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-gray-400 text-sm">No columns found</div>
                    )}
                  </div>
                ))}
          </div>
        </div>
      </div>
    </div>
  );
};
