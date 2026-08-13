export const TABS_BRANCH = {
  GENERAL: "general",
  DATA_AGENT: "agent",
  AI_AGENT: "aiagent",
  AGENT_SQL: "agent_sql",
  AGENT_RAG: "agent_rag",
} as const;

type AgentSuffix = "sql_" | "rag_";

type DataAgentConnectionFields<S extends AgentSuffix> = {
  [K in `${S}configType` | `${S}agentType` | `${S}endpoint` | `${S}db` | `${S}user`]?:
    | string
    | null;
} & {
  [K in `${S}port`]?: number | null;
};

export type SqlConnection = DataAgentConnectionFields<"sql_">;

export type RagConnection = DataAgentConnectionFields<"rag_">;

export interface BranchData extends SqlConnection, RagConnection {
  branchId?: string;
  branchName: string;
  departmentName?: string;
  companyId?: string;
  companyName?: string;
  branchType: string;
  branchLocation: string;
  branchUserAccess?: string[] | string | null;
  allowUserAccess?: boolean;
  branchAllowUserAccess?: boolean | null;
  branchLogo?: File | string | null;
  branchLogoImg?: string;
  bgImg?: File | string | null;
  bgImgStr?: File | string | null;
  dataAgentBotName?: string | null;
  dataAgentWelcomeprompt?: string | null;
  isActive?: boolean | null;
  isDefault?: boolean | null;
  createdAt?: string;
  updatedAt?: string | null;
  branchConfiguration?: BranchConfiguration[];
}
export interface BranchConfiguration {
  id?: string;
  branchId?: string | null;
  configType?: string | null;
  agentType?: "sql" | "rag";
  endpoint?: string | null;
  db?: string | null;
  user?: string | null;
  port?: string[] | null;
}

export interface GetAllBranchesResponse {
  branches: BranchData[];
  total: number;
}

export interface CreateBranchRequest {
  branchId?: string;
  branchName: string;
  branchType: string;
  branchLocation: string;
  companyId: string;
  allowUserAccess: boolean;
  dataAgentBotName?: string;
  dataAgentWelcomeprompt?: string;
  branchLogo?: File | string | null;
  bgImg?: File | string | null;
  branchConfiguration?: BranchConfiguration[];
  isDefault: boolean | null;
  isActive: boolean | null;
}

export interface CreateBranchResponse {
  branchId: string;
  message: string;
}

export interface UpdateBranchRequest {
  branchName: string;
  branchType: string;
  branchLocation: string;
  companyId: string;
  allowUserAccess: boolean;
  branchId: string;
}

export interface UpdateBranchResponse extends BranchData {
  branchId: string;
}

export interface DeleteBranchResponse {
  branchId: string;
  message: string;
}

export interface BranchUpdateActiveRequest {
  companyId: string;
  branchId: string;
  isActive: boolean;
}

export interface BranchUpdateAllowUserAccessRequest {
  companyId: string;
  branchId: string;
  allowUserAccess: boolean;
}

export interface BranchReducerState {
  tab: string;
  showForm: boolean;
  showFormMode: number;
  isDeleteOpen: boolean;
  selectedBranch: BranchData;
  selectedCompanyId: string;
}
