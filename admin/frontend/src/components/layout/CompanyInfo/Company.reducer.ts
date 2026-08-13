import type {
  CompanyAzureDeploymentFormData,
  CompanyConnections,
  CompanyInfoData,
  CompanyInfoFormData,
  CompanyReducerState,
  DeploymentAgents,
  DialogFormProps,
  SelectDataset,
  ShowConnection,
  ShowDataset,
} from "@/types/companyInfo.types";
import { type selectPDFFile, TABS_DATAAGENT } from "../../../types/dataAgent.types";

export type CompanyAction =
  | { type: "show_import"; payload: boolean }
  | { type: "show_connection"; payload: ShowConnection }
  | { type: "add_company_connection"; payload: CompanyConnections }
  | { type: "update_company_connection"; payload: CompanyConnections }
  | { type: "delete_company_connection"; id: string }
  | { type: "is_delete_dataset_source"; payload: boolean }
  | { type: "selected_pdf_file"; payload: selectPDFFile }
  | { type: "show_dataset"; payload: ShowDataset }
  | { type: "selected_dataset_source"; payload: SelectDataset }
  | { type: "selected_dataset_tab"; payload: string }
  | { type: "select_tab"; payload: string }
  | { type: "select_childTab"; payload: string }
  | { type: "azure_form_model"; payload: string }
  | { type: "azure_form_crud"; payload: number }
  | { type: "azure_form"; payload: CompanyAzureDeploymentFormData }
  | { type: "show_company_form"; payload: DialogFormProps }
  | { type: "company_form"; payload: CompanyInfoFormData }
  | { type: "company_form_field"; field: string; value: any }
  | { type: "company_form_connection_field"; index: number; field: string; value: any }
  | {
      type: "company_form_deployment_field";
      index: number;
      field: string;
      value: any;
    }
  | { type: "azure_form_field"; field: string; value: any }
  | { type: "company_form_reset" }
  | { type: "company_list"; payload: CompanyInfoData[] }
  | { type: "delete_company_confirmation"; payload: DialogFormProps };

/** 용도 6종. 프롬프트 설정과 같은 체계를 쓴다. */
export const DEPLOYMENT_AGENT_TYPES = ["main", "sql", "sql_2", "rag", "powerbi", "chart"] as const;

export const initAzureDeployments = (
  agentType: string,
  companyId: string = "",
): DeploymentAgents => {
  return {
    companyId: companyId,
    agentType: agentType,
    modelId: "",
  };
};

/**
 * 저장된 목록에 없는 용도를 빈 행으로 채워 항상 6칸을 만든다.
 *
 * 서버는 실제로 지정된 것만 돌려주므로, 그대로 쓰면 아직 모델을 고르지 않은
 * 딜러사에서 선택 칸 자체가 보이지 않아 설정할 방법이 없어진다.
 */
export const fillDeployments = (
  saved: DeploymentAgents[] | undefined,
  companyId: string = "",
): DeploymentAgents[] => {
  const byType = new Map((saved ?? []).map((d) => [d.agentType, d]));

  return DEPLOYMENT_AGENT_TYPES.map(
    (agentType) => byType.get(agentType) ?? initAzureDeployments(agentType, companyId),
  );
};

export const initCompanyConnections = (
  agentType: string,
  companyId: string = "",
): CompanyConnections => {
  return {
    companyId: companyId,
    configType: "",
    agentType: agentType,
    endpoint: "",
    database: "",
    user: "",
    password: "",
    port: 0,
    sourceList: [],
  };
};

// initSystemPrompts 제거: 프롬프트는 전역이 되어 딜러사 생성 시 만들지 않는다.
// Prompt Settings 메뉴에서 별도 관리한다.

export const initialCompanyFormData: CompanyInfoFormData = {
  companyName: "",
  description: "",
  isActive: true,
  connections: [
    /*initCompanyConnections("sql"), initCompanyConnections("rag")*/
  ],
  // 용도별 모델 지정. deploymentType(dataagent/aiagent) 구분은 DB 에서 제거되었다.
  deployments: fillDeployments([]),
};

export const CompanyStateInit: CompanyReducerState = {
  tab: "general",

  isDialogOpen: {
    show: false,
    mode: 0,
    id: "",
  },
  isAzureDialogOpen: false,
  isDeleteDialogOpen: {
    show: false,
    mode: 0,
    id: "",
  },
  isEditOpen: false,
  companyFormData: initialCompanyFormData,
  companyList: [],
  loading: false,
  showDataset: {
    show: false,
    datasetType: "",
  },
  selectDatasetSource: {
    datasetType: "",
    id: "",
    sourceName: "",
  },
  selectedDatasetTab: TABS_DATAAGENT.DATASET_DATA,
  selectPDFFile: {
    id: "",
    fileName: "",
  },
  deleteSource: false,
  showImport: false,
  showConnection: {
    mode: 0,
    show: false,
  },
};

export const CompanyStateReducer = (
  state: CompanyReducerState,
  action: CompanyAction,
): CompanyReducerState => {
  switch (action.type) {
    case "show_import":
      return {
        ...state,
        showImport: action.payload,
      };
    case "show_connection":
      return {
        ...state,
        showConnection: action.payload,
      };
    case "selected_pdf_file":
      return {
        ...state,
        selectPDFFile: action.payload,
      };
    case "is_delete_dataset_source":
      return {
        ...state,
        deleteSource: action.payload,
      };
    case "selected_dataset_tab":
      return {
        ...state,
        selectedDatasetTab: action.payload,
      };
    case "selected_dataset_source":
      return {
        ...state,
        selectDatasetSource: action.payload,
        selectedDatasetTab: TABS_DATAAGENT.DATASET_DATA,
      };
    case "show_dataset":
      return {
        ...state,
        showDataset: action.payload,
        selectDatasetSource: {
          datasetType: "",
          id: "",
          sourceName: "",
        },
        selectPDFFile: {
          id: "",
          fileName: "",
        },
      };
    case "delete_company_confirmation":
      return {
        ...state,
        isDeleteDialogOpen: action.payload,
      };
    case "company_list":
      return {
        ...state,
        companyList: action.payload,
      };

    case "company_form_reset":
      return {
        ...state,
        companyFormData: initialCompanyFormData,
        tab: "general",
      };
    case "company_form":
      return {
        ...state,
        companyFormData: {
          ...action.payload,
          // 서버는 지정된 것만 돌려준다. 비어 있는 용도를 채워 항상 6칸을 그린다.
          deployments: fillDeployments(action.payload.deployments, action.payload.companyId),
        },
      };

    case "company_form_field":
      return {
        ...state,
        companyFormData: {
          ...state.companyFormData,
          [action.field]: action.value,
        },
      };
    case "company_form_connection_field":
      return {
        ...state,
        companyFormData: {
          ...state.companyFormData,
          connections: state.companyFormData.connections.map((conn, i) =>
            i === action.index ? { ...conn, [action.field]: action.value } : conn,
          ),
        },
      };
    case "delete_company_connection":
      return {
        ...state,
        companyFormData: {
          ...state.companyFormData,
          connections: state.companyFormData.connections.filter((conn) => conn.id !== action.id),
        },
      };
    case "update_company_connection":
      return {
        ...state,
        companyFormData: {
          ...state.companyFormData,
          connections: state.companyFormData.connections.map((conn, _i) =>
            conn.id === action.payload.id ? { ...conn, ...action.payload, mode: 2 } : conn,
          ),
        },
      };
    case "add_company_connection":
      return {
        ...state,
        companyFormData: {
          ...state.companyFormData,
          connections: [
            ...state.companyFormData.connections,
            {
              ...action.payload,
              mode: 1,
            },
          ],
        },
      };
    case "company_form_deployment_field":
      return {
        ...state,
        companyFormData: {
          ...state.companyFormData,
          deployments: state.companyFormData.deployments
            //   .filter((data) => data.deploymentType == action.deploymentType)
            .map((conn, i) =>
              i === action.index ? { ...conn, [action.field]: action.value } : conn,
            ),
        },
      };
    case "show_company_form":
      return {
        ...state,
        isDialogOpen: action.payload,
        companyFormData: action.payload.mode === 1 ? initialCompanyFormData : state.companyFormData,
        tab: "general",
      };
    case "select_tab":
      return {
        ...state,
        tab: action.payload,
      };

    default:
      return state;
  }
};
