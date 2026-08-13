import { ChevronLeft, ChevronRight, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { useCreateImport } from "../../../../../services/api/dataset/createImport";
import { useGetDatasetByType } from "../../../../../services/api/dataset/getDatasetByType";
import { useGetSchemaSourceList } from "../../../../../services/api/dataset/getSchemaSourceList";
import type { Source } from "../../../../../types/companyInfo.types";
import {
  type ColumnList,
  type DatasetReducerState,
  TABS_DATASET_IMPORT,
} from "../../../../../types/dataset.types";
import { getErrorMessage } from "../../../../../utils/getErrorMessage";
import Button from "../../../../reusable/Button";
import LoadingPage from "../../../../reusable/loadingPage";
import type { CompanyAction } from "../../../CompanyInfo/Company.reducer";
import type { DatasetAction } from "../../Dataset.reducer";

interface DatasetButtonProps {
  sourceList: Source[];
  state: DatasetReducerState;
  dispatchCompany: React.Dispatch<CompanyAction>;
  dispatch: React.Dispatch<DatasetAction>;
  companyId: string;
}
export const DatasetButton = ({
  sourceList,
  state,
  dispatchCompany,
  dispatch,
  companyId,
}: DatasetButtonProps) => {
  //const { data: datasetSchemaSourceList, isLoading: isfetchdatasetSchema } =
  //      useGetSchemaSourceList(companyId);

  const { data: datasetSchemaSourceList, isLoading: isfetchdatasetSchema } = useGetSchemaSourceList(
    companyId,
    state.selectedTabImport === "existing" ? state.importSource : "",
  );

  const { mutate: createImport, isPending: isCreateImport } = useCreateImport();

  const { data: datasetSchemaSourceListPDF, isLoading: isfetchSql } = useGetDatasetByType(
    state.importMethod.ext === "pdf" ? "rag" : "",
    companyId ?? "",
  );

  const validateStepMethod = (): boolean => {
    if (!state.importMethod.file && state.importMethod.ext !== "fabric") {
      toast.error("Please upload a file before proceeding.");
      return false;
    }

    return true;
  };

  const validateStepConfig = (): boolean => {
    if (!state.importSource || /\s/.test(state.importSource)) {
      toast.error("Please create / choose source");
      return false;
    }

    if (
      state.importMethod.ext !== "pdf" &&
      state.selectedTabImport === TABS_DATASET_IMPORT.EXISTING
    ) {
      const headerUploadFile = state.previewData.typeDataValue.map((e: ColumnList) => e.columnName);

      const existingSourceHeader = datasetSchemaSourceList?.result.tableColumn;

      const comparer = JSON.stringify(headerUploadFile) === JSON.stringify(existingSourceHeader);

      if (!comparer) {
        toast.error(
          "Column names do not match with the existing source. Please check and try again.",
        );
        return false;
      }
    } else {
      const checkSource =
        state.importMethod.ext === "pdf"
          ? datasetSchemaSourceListPDF?.result.some(
              (item) => item.sourceName === state.importSource,
            )
          : sourceList.some((item) => item.sourceName === state.importSource);

      if (state.selectedTabImport !== TABS_DATASET_IMPORT.EXISTING && checkSource) {
        toast.error("Source name already exists. Please choose a different name.");
        return false;
      }

      if (state.importMethod.ext !== "pdf") {
        const hasEmptyDataType = state.previewData.typeDataValue.some(
          (col: any) => col.dataType.trim() === "",
        );

        if (hasEmptyDataType) {
          toast.error("Please select data type for all columns.");
          return false;
        }
      }
    }

    return true;
  };

  const validateNextButton = () => {
    if (state.datasetStep === 1 && !validateStepMethod()) return;
    if (state.datasetStep === 3 && !validateStepConfig()) return;

    dispatch({ type: "datasetStep", payload: state.datasetStep + 1 });
  };

  const importData = () => {
    const formData = new FormData();

    const payload = {
      companyId: companyId,
      fileName: state.importMethod.name,
      ext: state.importMethod.ext,
      source: state.importSource,
      source_method: state.selectedTabImport === TABS_DATASET_IMPORT.NEW ? 1 : 2,
      columns: state.previewData.typeDataValue,
    };

    formData.append("file", state.importMethod.file as Blob);

    formData.append("payload", JSON.stringify(payload));

    createImport(formData, {
      onSuccess: (res) => {
        if (res?.success) {
          toast.success("Import Created", {
            description: res.message || "Import dataset successfully.",
          });
          dispatch({ type: "reset" });
          dispatchCompany({ type: "show_import", payload: false });
        } else {
          toast.error(res?.message);
        }
      },
      onError: (error) => {
        toast.error("Failed to import  ", {
          description: getErrorMessage(error),
        });
      },
    });
  };

  if (isCreateImport) return <LoadingPage isLoading={isCreateImport} />;

  return (
    <div className="flex gap-3">
      {state.datasetStep !== 1 && (
        <Button
          type="button"
          variant="outline"
          onClick={() => dispatch({ type: "datasetStep", payload: state.datasetStep - 1 })}
          className="w-full md:w-auto cursor-pointer flex items-center gap-2 h-8 text-sm"
        >
          <ChevronLeft className="w-4 h-4" />
          Previous
        </Button>
      )}

      {state.datasetStep !== 4 && (
        <Button
          type="button"
          variant="outline"
          onClick={() => validateNextButton()}
          className="w-full md:w-auto cursor-pointer flex items-center gap-2  h-8  text-sm"
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

      {state.datasetStep === 4 && (
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
