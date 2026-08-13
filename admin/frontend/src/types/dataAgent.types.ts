export const TABS_DATAAGENT = {
  AGENT: "agent_list",
  POWER_BI: "bi_list",
  TABLE: "table_list",
  INDEX: "index_list",
  SUGGESTION: "suggestion_list",
  GENERAL_FORM: "general_form",
  INSTRUCTION_FORM: "instruction_form",
  SQL_FORM: "sql_form",
  RAG_FORM: "rag_form",
  DATASET_DATA: "preview",
  DATASET_SCHEMA: "schema",
} as const;
export interface DataAgentBase {
  branchId: string;
  dataAgentId?: string;
  workspaceId: string;
  agentName: string;
  desc: string;
  isActive: boolean;
  seq: number;
}
export interface selectPDFFile {
  id: string;
  fileName: string;
}

export interface DataAgentSuggestionForm {
  id?: string;
  keyword: string;
  prompt: string;
}
export interface DataAgentForm extends DataAgentBase {
  source: DataAgentSourceForm[];
  instruction: DataAgentInstructionForm[];
  suggestion: DataAgentSuggestionForm[];
}

export interface DataAgentSourceForm {
  id?: string;
  dataAgentId?: string;
  type: string;
  source: string;
}
export interface DataAgentInstructionForm {
  id?: string;
  dataAgentId?: string;
  text: string;
  fileName: string;
}
export interface DataAgentTableData {
  id?: number;
  dataAgentName: string;
  dataAgentUrl: string;
  dataAgentWorkspace: string;
}
export interface ShowDatasetDialog {
  show: boolean;
  type: number;
}

export interface DataAgentReducerState {
  showDatasetDialog: ShowDatasetDialog;
  selectedTab: string;
  selectedTabForm: string;
  showForm: boolean;
  showFormMode: number;
  isDeleteOpen: boolean;
  isDeleteSourceOpen: boolean;
  dataAgentForm: DataAgentForm;
  selectedCompany: string;
  selectedBranchId: string;
  selectedWorkspace: string;
  selectedTabDataset: string;
  expandedCompanies: Record<string, boolean>;
}
export interface DataAgentRespone extends DataAgentForm {
  createdAt: string;
  updatedAt: string;
}

export interface DataAgentCreateRequest extends DataAgentForm {}
export interface DataAgentUpdateRequest extends DataAgentForm {}
