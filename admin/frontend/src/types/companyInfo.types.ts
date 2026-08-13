import type { ReactNode } from "react";
import type { IFetchApiRFesultContent } from "./apiResponse";
import type { selectPDFFile } from "./dataAgent.types";
import type { ColumnList, DatasetResponse } from "./dataset.types";

export const TABS_COMPANY = {
  GENERAL: "general",
  DEPLOYMENT: "dataagent_deployment",
  DATA_AGENT: "dataagent_deployment",
  AI_AGENT: "aiagent_deployment",
  DEPLOYMENT_AGENT: "dataagent_deployment",
  // SYSTEM_PROMPT 제거: 프롬프트는 Prompt Settings 메뉴(/promptSettings)로 이동
  DATASET: "dataagent_dataset",
} as const;

type AgentSuffix =
  | "deployment"
  | "deployment_sql"
  | "deployment_rag"
  | "deployment_chart"
  | "deployment_powerbi";

type AzureDeploymentFields<S extends AgentSuffix> = {
  [K in `companyId_agent_${S}` | `agentType_agent_${S}`]?: string;
} & {
  [K in
    | `azureDeployment_agent_${S}`
    | `azureEndpoint_agent_${S}`
    | `azureApiKey_agent_${S}`
    | `azureVersion_agent_${S}`
    | `azureReasoning_agent_${S}`]?: string;
} & {
  [K in
    | `azureTopK_agent_${S}`
    | `azureMaxToken_agent_${S}`
    | `azureTemperature_agent_${S}`]?: number;
};
type AzureDeploymentRagFields = AzureDeploymentFields<"deployment_rag"> & {
  azureEmbedding_agent_deployment_rag?: string;
};

type AzureDeploymentChartFields = AzureDeploymentFields<"deployment_chart">;

export type CompanyAzureDeploymentFormDataMain = AzureDeploymentFields<"deployment">;

export type CompanyAzureDeploymentFormDataSql = AzureDeploymentFields<"deployment_sql">;
export type CompanyAzureDeploymentFormDataPowerBI = AzureDeploymentFields<"deployment_powerbi">;

export type CompanyAzureDeploymentFormDataRag = AzureDeploymentRagFields;

export type CompanyAzureDeploymentFormDataChart = AzureDeploymentChartFields;

export interface TabButtonProps {
  key?: number;
  label: string;
  icon?: ReactNode;
  activeTab?: boolean;
  onClick: () => void;
  className?: string;
  activeClass: string;
  unActiveClass: string;
}

export interface TabGroupProps {
  items: TabButtonProps[];
  groupName?: string;
  className?: string;
}

export interface CompanyTabProps {
  onClickTab: (tab: string) => void;
  selectedTab: string;
  isDataAgentActive?: boolean;
}

export interface CompanyDataAgentModelTabProps extends CompanyTabProps {
  groupName: string;
  tabMain: string;
  tabSql: string;
  tabRag: string;
  tabChart: string;
  tabPowerBI: string;
}

// SystemPrompts 제거: 전역 프롬프트는 types/systemPrompt.types.ts 참고

export interface CompanyAzureDeploymentFormData {
  companyId?: string;
  agentType?: "main" | "sql" | "rag" | "chart" | "powerbi";
  azureDeploymentName?: string;
  azureDeployment: string;
  azureEndpoint: string;
  azureApiKey: string;
  azureTopK: number;
  azureMaxToken: number;
  azureTemperature: number;
  azureVersion: string;
  azureReasoning: string;
  azureEmbedding?: string;
  default?: boolean;
}

export interface DeploymentAgents {
  id?: string;
  companyId?: string;
  agentType: string;
  /** Model_master.id */
  modelId: string;
}
export interface CompanyConnections {
  id?: string;
  companyId?: string;
  configType: string;
  agentType: string;
  endpoint: string;
  database: string;
  user: string;
  password?: string;
  port?: number;
  isActive?: boolean;
  table?: string;
  sourceList: Source[];
  mode?: number;
}
export interface Source {
  Id: string;
  sourceName: string;
}

export interface ShowConnection {
  show: boolean;
  mode: number;
  data?: CompanyConnections;
}
// 딜러사는 토요타 산하 자회사 개념이라 이름과 설명, 활성 여부만 관리한다.
export interface CompanyInfoFormData {
  companyId?: string;
  companyName: string;
  description: string;
  isActive: boolean;
  connections: CompanyConnections[];
  deployments: DeploymentAgents[];
}

export interface AiAgentAzureDeployments {
  azureDeploymentName_aiagent_deployment?: string;
  azureDeployment_aiagent_deployment?: string;
  azureEndpoint_aiagent_deployment?: string;
  azureApiKey_aiagent_deployment?: string;
  azureTopK_aiagent_deployment?: number;
  azureMaxToken_aiagent_deployment?: number;
  azureTemperature_aiagent_deployment?: number;
  azureVersion_aiagent_deployment?: string;
  azureReasoning_aiagent_deployment?: string;
}
export interface CompanyInfoFormDataDetail extends CompanyInfoFormData {
  azureDeployments: [];
  aiagentazureDeployments: AiAgentAzureDeployments[];
  datasetSource?: DatasetResponse[];
}
export interface CompanyInfoConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  onConfirm: () => void;
  onCancel?: () => void;
  confirmText?: string;
  cancelText?: string;
}

export type CompanyInfoFormProps = {
  formData: CompanyInfoFormData;
  errors: Partial<Record<keyof CompanyInfoFormData, string>>;
  onInputChange: (
    field: keyof CompanyInfoFormData,
  ) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onCountryChange: (countryCode: string) => void;
  onSubmit: () => void;
};

export type CompanyInfoConfirmDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: CompanyInfoFormData | null;
  onConfirm: () => void;
  onCancel: () => void;
};

// API Routes
export interface CompanyInfoData {
  companyId: string;
  companyName: string;
  description: string | null;
  isActive: boolean;
  createdAt: string | null;
  updatedAt: string | null;
  deletedAt: string | null;
}

export interface CompanyInfoResponse extends IFetchApiRFesultContent<CompanyInfoData> {
  message: string;
}

export interface CreateCompanyRequest extends CompanyInfoFormData {}

export interface CreateCompanyResponse {
  companyId: string;
  companyName: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string | null;
}

export interface DeleteCompanyRequest {
  id: string;
}

export interface DeleteCompanyResponse {
  companyId: string;
  message: string;
}

export interface UpdateCompanyRequest {
  companyName: string;
  description: string;
  isActive: boolean;
}

export interface UpdateCompanyResponse {
  message: string;
  companyId: string;
  companyName: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string | null;
}

export interface DialogFormProps {
  show: boolean;
  mode: number;
  id?: string;
}
export interface ShowDataset {
  show: boolean;
  datasetType: string;
}
export interface SelectDataset {
  datasetType: string;
  id: string;
  sourceName: string;
  fileName?: string;
}

export interface CompanyReducerState {
  tab: string;
  isDialogOpen: DialogFormProps;
  isAzureDialogOpen: boolean;
  isDeleteDialogOpen: DialogFormProps;
  isEditOpen: boolean;
  companyFormData: CompanyInfoFormData;
  companyList: CompanyInfoData[];
  loading: boolean;
  showDataset: ShowDataset;
  selectDatasetSource: SelectDataset;
  selectedDatasetTab: string;
  selectPDFFile: selectPDFFile;
  deleteSource: boolean;
  showImport: boolean;
  showConnection: ShowConnection;
}
export interface SqlFormState {
  endpoint: string;
  database: string;
  user: string;
  password: string;
}

export interface RagFormState extends SqlFormState {
  port: number;
}

export interface TableList {
  columnList: ColumnList[];
  tableName: string;
}
