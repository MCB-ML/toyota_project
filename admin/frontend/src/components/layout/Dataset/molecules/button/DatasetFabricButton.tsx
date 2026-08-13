import { ChevronLeft, ChevronRight, Upload, X } from "lucide-react";
import { useEffect } from "react";
import type { Edge } from "reactflow";
import { toast } from "sonner";
import { useCreateImportFabric } from "../../../../../services/api/dataset/fabric/createImportFabric";
import { useGetSchemaSourceList } from "../../../../../services/api/dataset/getSchemaSourceList";
import {
  type ColumnList,
  type DatasetReducerState,
  TABS_DATASET_IMPORT,
} from "../../../../../types/dataset.types";
import {
  type DatasetFabricReducerState,
  type ImportFabricRequest,
  TABS_FABRIC,
} from "../../../../../types/datasetFabric.types";
import Button from "../../../../reusable/Button";
import LoadingPage from "../../../../reusable/loadingPage";
import type { CompanyAction } from "../../../CompanyInfo/Company.reducer";
import type { DatasetAction } from "../../Dataset.reducer";
import type { DatasetFabricAction } from "../../DatasetFabric.reducer";

interface DatasetFabricButtonProps {
  companyId: string;
  state: DatasetReducerState;
  stateFabric: DatasetFabricReducerState;
  dispatchCompany: React.Dispatch<CompanyAction>;
  dispatchDataset: React.Dispatch<DatasetAction>;
  dispatch: React.Dispatch<DatasetFabricAction>;
  nodes: any;
  edges: any;
  setEdges: React.Dispatch<React.SetStateAction<Edge[]>>;
  setNodes: React.Dispatch<React.SetStateAction<any>>;
  onExecuteQuery: (query: string) => void;
  generateRelation: () => void;
  isGeneratingRelation: boolean;
}
export const DatasetFabricButton = ({
  companyId,
  state,
  stateFabric,
  dispatchCompany,
  dispatchDataset,
  dispatch,
  nodes,
  edges,
  setEdges,
  setNodes,
  onExecuteQuery,
  generateRelation,
  isGeneratingRelation,
}: DatasetFabricButtonProps) => {
  const { data: datasetSchemaSourceList, isLoading: isfetchdatasetSchema } = useGetSchemaSourceList(
    "",
    "",
  );

  const { mutate: createImport, isPending: isCreateImport } = useCreateImportFabric();

  const validateNextButton = () => {
    validateStep2();
    validateStep3();
    validateStep4();
    validateStep5();
  };

  const validateStep = (step: number, fnc: () => boolean): void => {
    if (state.datasetStep !== step) return;

    const isValid = fnc();
    if (!isValid) return;

    dispatchDataset({
      type: "datasetStep",
      payload: state.datasetStep + 1,
    });
  };

  const validateStep2 = () => {
    validateStep(2, () => {
      return stateFabric.dbConnection.checked;
    });
  };

  const validateStep3 = () => {
    validateStep(3, () => {
      if (nodes.length === 0) {
        toast.error("Please select source");
        return false;
      }

      return true;
    });
  };

  const validateStep4 = () => {
    validateStep(4, () => {
      if (stateFabric.queryBuilder && stateFabric.previewData.data.length > 0) return true;

      const duplicates = stateFabric.previewData.header.filter(
        (item, index) => stateFabric.previewData.header.indexOf(item) !== index,
      );

      if (duplicates.length > 0) {
        toast.error(`Duplicate Columnt ${duplicates}`);
        return false;
      }

      return false;
    });
  };

  const validateStep5 = () => {
    validateStep(5, () => {
      if (!stateFabric.importSource || /\s/.test(stateFabric.importSource)) {
        toast.error("Please create / choose source");
        return false;
      }

      const hasEmptyDataType = stateFabric.previewData.typeDataValue.some(
        (col: any) => col.dataType.trim() === "",
      );

      if (hasEmptyDataType) {
        toast.error("Please select data type for all columns.");
        return false;
      }

      if (stateFabric.selectedTabImport === TABS_DATASET_IMPORT.EXISTING) {
        const headerUploadFile = stateFabric.previewData.typeDataValue.map(
          (e: ColumnList) => e.columnName,
        );

        const existingSourceHeader = datasetSchemaSourceList?.result;

        const comparer = JSON.stringify(headerUploadFile) === JSON.stringify(existingSourceHeader);

        if (!comparer) {
          toast.error(
            "Column names do not match with the existing source. Please check and try again.",
          );
          return false;
        }
      } else {
        //const checkSource = datasetSchemaSourceList?.result.some(
        //  (item) => item.tableName === stateFabric.importSource,
        //);
        //if (checkSource) {
        //  toast.error("Source name already exists. Please choose a different name.");
        //  return false;
        //}
      }
      return true;
    });
  };

  const updateNode = (mode: string) => {
    const updated = nodes.map((n: any) => ({
      ...n,
      data: {
        ...n.data,
        fabricMode: mode,
        step: state.datasetStep,
      },
    }));

    setNodes(updated);
  };

  useEffect(() => {
    if (state.datasetStep === 2) {
      setNodes([]);
      setEdges([]);
    }
    if (state.datasetStep === 3) {
      updateNode("E");
      setEdges([]);
    }
    if (state.datasetStep === 4) {
      updateNode("C");
    }
    if (state.datasetStep === 4) generateRelation();

    dispatch({ type: "editErdFabric", payload: "C" });
    dispatch({ type: "queryPrompt", payload: "" });
    dispatch({ type: "selectedTab", payload: TABS_FABRIC.RELATION_TABLE });
  }, [state.datasetStep]);

  useEffect(() => {
    updateNode(stateFabric.fabricMode);
  }, [stateFabric.fabricMode]);

  const importData = () => {
    const jobMehthod = Number(stateFabric.jobMethod);

    let jobScheduleDate: string = "";

    if (jobMehthod === 2) {
      const datetimeString = `${stateFabric.jobRunDate}T${stateFabric.jobRunTime}:00`;
      const dateObj = new Date(datetimeString);
      const isValid = !Number.isNaN(dateObj.getTime());

      if (!isValid) {
        toast.error("Import schedule date is not valid date");
        return;
      }

      jobScheduleDate = datetimeString;
    }

    const param: ImportFabricRequest = {
      source: stateFabric.importSource,
      sourceMethod: stateFabric.selectedTabImport === TABS_DATASET_IMPORT.NEW ? 1 : 2,
      columns: stateFabric.previewData.typeDataValue,
      serverName: stateFabric.dbConnection.serverName,
      dbName: stateFabric.dbConnection.dbName,
      queryData: stateFabric.queryBuilder,
      jobMethod: jobMehthod,
      jobSchedule: jobScheduleDate,
      companyId: companyId,
    };

    createImport(param, {
      onSuccess: (res) => {
        if (res?.success) {
          toast.success("Import Created", {
            description: res.message || "Import Fabric data successfully.",
          });
          dispatch({ type: "reset" });
          dispatchDataset({ type: "reset" });
          dispatchCompany({ type: "show_import", payload: false });
        } else {
          toast.error(res?.message);
        }
      },
      onError: (_error) => {
        toast.error("Failed to import");
      },
    });
  };

  if (isCreateImport || isGeneratingRelation)
    return <LoadingPage isLoading={isCreateImport || isGeneratingRelation} />;

  const showNextButton =
    state.datasetStep === 1 ||
    (state.datasetStep > 1 && stateFabric.dbConnection.checked && state.datasetStep < 6);

  if (stateFabric.fabricMode === "E") return;

  return (
    <div className="flex gap-3 ">
      {state.datasetStep !== 1 && (
        <Button
          type="button"
          variant="outline"
          onClick={() => dispatchDataset({ type: "datasetStep", payload: state.datasetStep - 1 })}
          className="w-full md:w-auto cursor-pointer flex items-center gap-2 h-8 text-sm"
        >
          <ChevronLeft className="w-4 h-4" />
          Previous
        </Button>
      )}

      {showNextButton && (
        <Button
          type="button"
          variant="outline"
          onClick={() => validateNextButton()}
          className="w-full md:w-auto cursor-pointer flex items-center gap-2  h-8 text-sm"
        >
          Next
          <ChevronRight className="w-4 h-4" />
        </Button>
      )}
      <Button
        type="button"
        variant="outline"
        onClick={() => dispatchCompany({ type: "show_import", payload: false })}
        className="w-full md:w-auto cursor-pointer flex items-center gap-2  h-8 text-sm"
      >
        <X className="w-4 h-4" />
        Cancel
      </Button>

      {state.datasetStep === 6 && (
        <Button
          type="button"
          onClick={importData}
          className="w-full md:w-auto bg-[#1a73e8] hover:bg-[#1557b0] cursor-pointer flex items-center gap-2  h-8 text-sm"
        >
          <Upload className="w-4 h-4" />
          Import
        </Button>
      )}
    </div>
  );
};
