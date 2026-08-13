import { useReducer, useState } from "react";
import { useGetAllCompanyList } from "../../../../services/api/company/getAllCompany";
import type { CompanyConnections } from "../../../../types/companyInfo.types";
import type { CompanyAction } from "../../CompanyInfo/Company.reducer";
import { DatasetStateInit, DatasetStateReducer } from "../Dataset.reducer";
import DatasetFabricComponent from "../DatasetFabricComponent";
import DatasetUploadComponent from "../DatasetUploadComponent";
import { DatasetButton } from "../molecules/button/DatasetButton";
import DataseDialog from "../organism/DataseDialog";
import { DatasetMethod } from "../organism/step/importFile/DatasetMethod";

interface DatasetImportProps {
  connection: CompanyConnections[];
  showForm: boolean;
  dispatchCompany: React.Dispatch<CompanyAction>;
  company: string;
}

const DatasetImport = ({ connection, showForm, dispatchCompany, company }: DatasetImportProps) => {
  const [state, dispatch] = useReducer(DatasetStateReducer, DatasetStateInit);

  const { data: companyData } = useGetAllCompanyList();
  const agentType = state.importMethod.ext === "pdf" ? "rag" : "sql";
  const [footerButtons, setFooterButtons] = useState<React.ReactNode>(null);
  const renderStep = () => {
    const ext = state.importMethod.ext;

    if (state.datasetStep > 1) {
      if (ext === "fabric")
        return (
          <DatasetFabricComponent
            stateDataset={state}
            dispatchCompany={dispatchCompany}
            setFooterButtons={setFooterButtons}
            dispatchDataset={dispatch}
            companyId={company}
          />
        );

      if (["csv", "xls", "xlsx", "pdf"].includes(ext))
        return (
          <DatasetUploadComponent
            sourceList={
              connection.find((data) => data.agentType === agentType && data.isActive)
                ?.sourceList ?? []
            }
            state={state}
            setFooterButtons={setFooterButtons}
            dispatch={dispatch}
            dispatchCompany={dispatchCompany}
            companyId={company}
          />
        );
    } else {
      switch (state.datasetStep) {
        case 1:
          return (
            <DatasetMethod
              connection={connection}
              companySetting={
                companyData?.result.find((comp) => comp.companyId === company) ?? null
              }
              state={state}
              dispatch={dispatch}
            />
          );

        default:
          return null;
      }
    }
  };

  return (
    <DataseDialog
      showForm={showForm}
      dispatchCompany={dispatchCompany}
      renderDatasetImport={renderStep}
      renderButton={
        state.datasetStep > 1 ? (
          footerButtons
        ) : (
          <DatasetButton
            state={state}
            dispatchCompany={dispatchCompany}
            dispatch={dispatch}
            companyId={company}
            sourceList={
              connection.find((data) => data.agentType === agentType && data.isActive)
                ?.sourceList ?? []
            }
          />
        )
      }
    />
  );
};

export default DatasetImport;
