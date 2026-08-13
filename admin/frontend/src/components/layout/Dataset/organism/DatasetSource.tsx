import { Check, X } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { TABS_DATAAGENT } from "@/types/dataAgent.types";
import { useGetTop10Data } from "../../../../services/api/company/getTop10Data";
import { useDeleteDatasetSource } from "../../../../services/api/dataset/deleteDatasetSource";
import { useGetDatasetSchema } from "../../../../services/api/dataset/getDatasetSchema";
import type {
  CompanyConnections,
  CompanyReducerState,
  Source,
} from "../../../../types/companyInfo.types";
import type { DatasetDeleteSource } from "../../../../types/dataset.types";
import { getErrorMessage } from "../../../../utils/getErrorMessage";
import Button from "../../../reusable/Button";
import DeleteConfirmDialog from "../../../reusable/DeleteConfirmDialog";
import type { CompanyAction } from "../../CompanyInfo/Company.reducer";
import { DatasetPreviewPDF } from "../molecules/DatasetPreviewPDF";
import { DatasetSourcePreviewTable } from "../molecules/DatasetPreviewTable";
import { DatasetTabs } from "../molecules/DatasetTabs";
import DatasetSchema, { type DatasetSchemaRef } from "./DatasetSchema";

interface DatasetSourceProps {
  onClose: () => void;

  dispatch: React.Dispatch<CompanyAction>;
  state: CompanyReducerState;
  //selectedPDFFile: selectPDFFile;
  //isDeleteSourceOpen: boolean;
  //dispatch: React.Dispatch<DataAgentAction>;
  //onDeleteSource: () => void;
  //isLoadingDelete: boolean;
}

const DatasetSource = ({
  onClose,

  state,
  //selectedPDFFile,
  //isDeleteSourceOpen,
  dispatch,
  //onDeleteSource,
  //isLoadingDelete,
}: DatasetSourceProps) => {
  const activeConn = state.companyFormData.connections?.find(
    (e) =>
      e.isActive &&
      (state.showDataset.datasetType === "sql"
        ? e.agentType === "sql" || e.agentType === "fabric"
        : state.showDataset.datasetType === "rag"
          ? e.agentType === "rag"
          : false),
  );

  const schemaRef = useRef<DatasetSchemaRef>(null);
  const [source, setSource] = useState<Source>();
  const [preview, setPreview] = useState<any[]>([]);
  const [connection, setConnection] = useState<CompanyConnections | null>(null);

  const { mutateAsync, isPending } = useGetTop10Data();

  const { data: datasetSchema, isLoading: isfetchdatasetSchema } = useGetDatasetSchema(
    source?.Id ?? "",
  );
  //const { data: datasetPreview, isLoading: isfetchdatasetPreview } =
  //    useGetDatasetPreview({
  //        id: activeConn?.id ?? "",
  //        sourceName: source?.sourceName ?? "",
  //        datasetType: ""
  //    });
  const { mutate: deleteDatasetSource, isPending: isDeleteDatasetSource } =
    useDeleteDatasetSource();

  const datasetList = activeConn?.sourceList || [];

  const updateSchemaTable = () => {
    schemaRef.current?.onUpdate();
  };

  const onDeleteSource = () => {
    if (isfetchdatasetSchema) {
      toast.error("Source  Deleted", {
        description: "Please try again until preview data is loaded",
      });
      return;
    }

    const payload: DatasetDeleteSource = {
      Id: state.selectDatasetSource.id,
      datasetType: state.showDataset.datasetType,
      sourceName: state.selectDatasetSource.sourceName,
    };

    deleteDatasetSource(payload, {
      onSuccess: (res) => {
        if (res) {
          toast.success("Source  Deleted", {
            description: res.message || "Source  deleted successfully.",
          });
          dispatch({ type: "is_delete_dataset_source", payload: false });

          dispatch({
            type: "selected_pdf_file",
            payload: {
              id: "",
              fileName: "",
            },
          });

          dispatch({
            type: "selected_dataset_source",
            payload: {
              datasetType: "",
              id: "",
              sourceName: "",
            },
          });
        }
      },
      onError: (error) => {
        toast.error("Failed to delete dataset source ", {
          description: getErrorMessage(error),
        });
        dispatch({ type: "is_delete_dataset_source", payload: false });
      },
    });
  };
  const selectTable = async (src: Source) => {
    try {
      let data: CompanyConnections | null = null;

      if (activeConn) {
        data = activeConn;
        data.table = src.sourceName;
        data.companyId = state.companyFormData.companyId;
        data.configType = "dataagent";
        setSource(src);
        setConnection(data);
      }
      if (data) {
        const result = await mutateAsync(data);

        if (result?.success) setPreview(result?.result ?? []);
      }
    } catch (error) {
      console.error("Connection failed:", error);
    }
  };
  const showDataset =
    state.selectedDatasetTab === TABS_DATAAGENT.DATASET_DATA &&
    (activeConn?.agentType === "sql" || activeConn?.agentType === "fabric");

  const showDatasetSchema =
    state.selectedDatasetTab === TABS_DATAAGENT.DATASET_SCHEMA &&
    (activeConn?.agentType === "sql" || activeConn?.agentType === "fabric");

  return (
    <>
      {/* Main Form Dialog */}
      <Dialog open={state.showDataset.show} onOpenChange={onClose}>
        <DialogContent
          className={`!w-[70%] !max-w-none h-[70%] max-w-3xl !p-0 gap-0 overflow-visible flex flex-col`}
          preventCloseOnOutsideClick={true}
        >
          <DialogHeader className="px-6 py-4 border-b border-[#e5e7eb]">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-xl font-semibold text-[#101828]">
                {state.showDataset.datasetType === "rag" ? "Index List" : "Table List"}
              </DialogTitle>
            </div>
          </DialogHeader>

          <div className="flex-1 flex flex-col border-t border-[#e5e7eb] overflow-hidden  min-w-0">
            <div className="flex h-full min-w-0">
              <div className="border-r h-full w-54 flex-shrink-0 overflow-hidden">
                <div className="p-3 border-b border-[#f3f4f6] bg-[#f9fafb]/50 sticky top-0 z-10">
                  <h3 className="font-semibold text-[#101828] text-sm flex items-center gap-2">
                    Select Source
                  </h3>
                </div>
                <div className="p-3 overflow-y-auto h-full pb-15">
                  {datasetList.map((data: Source, index: number) => {
                    const isSelected = data.sourceName === source?.sourceName;

                    return (
                      <div
                        key={index}
                        className={`group p-2 mb-2 flex justify-between items-center cursor-pointer rounded-md
        ${
          isSelected ? "text-sm bg-[#eff6ff] text-[#155dfc] font-bold" : "text-sm hover:bg-gray-100"
        }
      `}
                      >
                        <div className="w-full">
                          <div
                            className="flex items-center w-full truncate"
                            title={data.sourceName}
                            onClick={() => selectTable(data)}
                          >
                            {data.sourceName}
                            {/*<div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity duration-200">*/}
                            {/*    <CircleX*/}
                            {/*        onClick={() =>*/}
                            {/*            dispatch({ type: "is_delete_dataset_source", payload: true })*/}
                            {/*        }*/}
                            {/*        size={16}*/}
                            {/*        className="text-red-500 hover:text-red-600"*/}
                            {/*    />*/}
                            {/*</div>*/}
                          </div>
                        </div>
                        {/*{state.showDataset.datasetType === "rag" &&*/}
                        {/*    isSelected &&*/}
                        {/*    (() => {*/}
                        {/*        let fileList: string[] = [];*/}

                        {/*        try {*/}
                        {/*            fileList = JSON.parse(data.fileName || "[]");*/}
                        {/*        } catch {*/}
                        {/*            fileList = [];*/}
                        {/*        }*/}

                        {/*        return (*/}
                        {/*            fileList.length > 0 && (*/}
                        {/*                <div className="ml-3 pl-2 border-l-3 border-gray-300 space-y-0.5">*/}
                        {/*                    {fileList.map((file, index) => (*/}
                        {/*                        <div*/}
                        {/*                            key={index}*/}
                        {/*                            className="group/file flex items-center justify-between gap-2 min-w-0 ml-2"*/}
                        {/*                            onClick={(e) => e.stopPropagation()}*/}
                        {/*                        >*/}
                        {/*                            <div*/}
                        {/*                                className={`${file === state.selectPDFFile.fileName*/}
                        {/*                                        ? "border-b-3"*/}
                        {/*                                        : ""*/}
                        {/*                                    } text-gray-500 truncate min-w-0 py-1`}*/}
                        {/*                                title={file}*/}
                        {/*                                onClick={() =>*/}
                        {/*                                    dispatch({*/}
                        {/*                                        type: "selected_pdf_file",*/}
                        {/*                                        payload: { fileName: file, id: data.Id },*/}
                        {/*                                    })*/}
                        {/*                                }*/}
                        {/*                            >*/}
                        {/*                                {file}*/}
                        {/*                            </div>*/}

                        {/*                            */}
                        {/*                                                       <CircleX*/}
                        {/*                            */}
                        {/*                                                           size={14}*/}
                        {/*                            */}
                        {/*                                                           className="mr-5 flex-shrink-0 opacity-0 group-hover/file:opacity-100 transition-opacity*/}
                        {/*                            */}
                        {/*text-red-500 hover:text-red-600"*/}
                        {/*                            */}
                        {/*                                                           onClick={() => {*/}
                        {/*                            */}
                        {/*                                                               dispatch({*/}
                        {/*                            */}
                        {/*                                                                   type: "selected_pdf_file",*/}
                        {/*                            */}
                        {/*                                                                   payload: { id: data.Id, fileName: file },*/}
                        {/*                            */}
                        {/*                                                               });*/}
                        {/*                            */}
                        {/*                                                               dispatch({*/}
                        {/*                            */}
                        {/*                                                                   type: "is_delete_dataset_source",*/}
                        {/*                            */}
                        {/*                                                                   payload: true,*/}
                        {/*                            */}
                        {/*                                                               });*/}
                        {/*                            */}
                        {/*                                                           }}*/}
                        {/*                            */}
                        {/*                                                       />*/}
                        {/*                        </div>*/}
                        {/*                    ))}*/}
                        {/*                </div>*/}
                        {/*            )*/}
                        {/*        );*/}
                        {/*    })()}*/}
                      </div>
                    );
                  })}
                </div>
              </div>
              {source || state.showDataset.datasetType === "rag" /*&& selectedPDFFile.fileName*/ ? (
                <div className="flex-1 overflow-y-auto min-h-0">
                  {state.showDataset.datasetType === "sql" && (
                    <DatasetTabs
                      onClickTab={(tab) =>
                        dispatch({
                          type: "selected_dataset_tab",
                          payload: tab,
                        })
                      }
                      selectedTab={state.selectedDatasetTab}
                    />
                  )}
                  {activeConn?.agentType === "rag" && state.selectPDFFile.fileName && (
                    <DatasetPreviewPDF source={state.selectPDFFile.fileName} />
                  )}
                  {activeConn?.agentType !== "rag" && (
                    <>
                      <DatasetSourcePreviewTable
                        show={showDataset}
                        isLoading={isfetchdatasetSchema}
                        sourceName={source?.sourceName ?? ""}
                        data={preview || []}
                      />

                      <DatasetSchema
                        ref={schemaRef}
                        show={showDatasetSchema}
                        schemaValue={datasetSchema?.result?.schemaValue ?? ""}
                        id={connection?.id ?? ""}
                        schemaId={source?.Id ?? ""}
                        companyId={state.companyFormData.companyId ?? ""}
                        source={source?.sourceName ?? ""}
                        overviewValue={datasetSchema?.result?.overviewValue ?? ""}
                      />
                    </>
                  )}
                </div>
              ) : (
                <div className="flex-1 h-full bg-white rounded-t-xl flex items-center justify-center overflow-hidden">
                  <div className="text-center max-w-sm">
                    <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                      📂
                    </div>
                    <h3 className=" font-semibold text-gray-800">No Source Selected</h3>
                    <p className="mt-1  text-gray-500">
                      Please select a dataset source from the list to preview its data or schema.
                    </p>
                  </div>
                </div>
              )}
            </div>

            <DeleteConfirmDialog
              open={state.deleteSource}
              onClose={() => dispatch({ type: "is_delete_dataset_source", payload: false })}
              onConfirm={onDeleteSource}
              title="Delete Source"
              description={`Are you sure you want to delete ${state.selectDatasetSource.sourceName} ? This action cannot be undone.`}
              isLoading={isDeleteDatasetSource}
            />
          </div>
          <DialogFooter className="px-6 py-3 border-t border-[#e5e7eb] gap-2 items-center">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="w-full md:w-auto cursor-pointer text-sm h-8 "
              disabled={false}
            >
              <X size={18} />
              Close
            </Button>
            {state.selectedDatasetTab === TABS_DATAAGENT.DATASET_SCHEMA &&
              (activeConn?.agentType === "sql" || activeConn?.agentType === "fabric") &&
              source?.Id && (
                <Button
                  type="button"
                  onClick={updateSchemaTable}
                  className="w-full md:w-auto bg-[#1a73e8] hover:bg-[#1557b0] cursor-pointer text-sm h-8 "
                  //   disabled={isCreating}
                >
                  <Check size={18} />
                  Update Schema
                </Button>
              )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default DatasetSource;
