import type { DataAgentSuggestionForm } from "./dataAgent.types";

export const TABS_POWERBI = {
  GENERAL: "general",
  REPORT: "report",
  SUGGESTION: "suggestion",
} as const;

export interface PowerBIBase {
  isActive: boolean;
  branchId?: string;
  workspace?: string;
  agentName: string;
  desc: string;
  isReport: boolean;
  isChatAgent: boolean;
  tenantID: string;
  clientID: string;
  workspaceID: string;
  clientSecret: string;
  reportID: string;
  pageID?: string;
  seq: number;
  suggestion?: DataAgentSuggestionForm[];
}
export interface PowerBIData extends PowerBIBase {
  Id: string;
  createdAt?: string;
}

export interface PowerBIReducerState {
  showForm: boolean;
  showFormMode: number;
  isDeleteOpen: boolean;
  selectedPowerBI: PowerBIData;
  selectedTabForm: string;
  selectedCompany: string;
  selectedBranchId: string;
  selectedWorkspace: string;
  expandedCompanies: Record<string, boolean>;
}

export interface CreatePowerBiRequest extends PowerBIBase {}

export interface CreatePowerBiUpdateRequest extends PowerBIBase {
  Id: string;
}
