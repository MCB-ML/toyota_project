import { useEffect } from "react";
import { useGetDatasetByType } from "../../../services/api/dataset/getDatasetByType";
import type { Source } from "../../../types/companyInfo.types";
import type { DatasetReducerState } from "../../../types/dataset.types";
import type { CompanyAction } from "../CompanyInfo/Company.reducer";
import type { DatasetAction } from "./Dataset.reducer";
import { DatasetButton } from "./molecules/button/DatasetButton";
import { DatasetConfig } from "./organism/step/importFile/DatasetConfig";
import DatasetPreview from "./organism/step/importFile/DatasetPreview";
import DatasetReview from "./organism/step/importFile/DatasetReview";

interface DatasetComponentProps {
  sourceList: Source[];
  state: DatasetReducerState;
  companyId: string;
  dispatch: React.Dispatch<DatasetAction>;
  dispatchCompany: React.Dispatch<CompanyAction>;
  setFooterButtons: (buttons: React.ReactNode) => void;
}

const DatasetUploadComponent = ({
  sourceList,
  companyId,
  state,
  dispatch,
  setFooterButtons,
  dispatchCompany,
}: DatasetComponentProps) => {
  const { data: datasetSchemaSourceListPDF, isLoading: isfetchPDF } = useGetDatasetByType(
    state.importMethod.ext === "pdf" ? "rag" : "",
    companyId ?? "",
  );

  const renderStepUploadFile = () => {
    switch (state.datasetStep) {
      case 2:
        return <DatasetPreview state={state} dispatch={dispatch} />;
      case 3:
        return (
          <DatasetConfig
            state={state}
            dispatch={dispatch}
            sourceList={
              state.importMethod.ext !== "pdf"
                ? sourceList || []
                : datasetSchemaSourceListPDF?.result || []
            }
            companyId={companyId}
          />
        );
      case 4:
        return <DatasetReview state={state} />;

      default:
        return null;
    }
  };
  useEffect(() => {
    setFooterButtons(
      <DatasetButton
        sourceList={sourceList}
        state={state}
        dispatchCompany={dispatchCompany}
        dispatch={dispatch}
        companyId={companyId}
      />,
    );
  }, [state.datasetStep, state, state.importMethod.ext]);

  return renderStepUploadFile();
};

export default DatasetUploadComponent;
