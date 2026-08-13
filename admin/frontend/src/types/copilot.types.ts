export interface CopilotAgent {
  copilotAgentId: string;
  copilotAgentName: string;
  copilotAgentDescription: string;
  copilotAgentWebchatSecret: string;
  copilotAgentIsActive: boolean;
  copilotAgentGreetings: string;
  copilotAgentWorkspaceId: string;
  seq: number;
  createdAt: string;
  updatedAt: string | null;
}

export interface CopilotAgentWorkspace {
  workspaceId: string;
  workspaceName: string;
  copilots: CopilotAgent[];
}

export interface CopilotAgentBranch {
  branchId: string;
  branchName: string;
  workspaces: CopilotAgentWorkspace[];
}

export interface CopilotAgentCompany {
  companyId: string;
  companyName: string;
  branches: CopilotAgentBranch[];
}

export interface GetAllCopilotAgentsResponse {
  data: CopilotAgentCompany[];
  total: number;
}

export interface CreateCopilotAgentRequest {
  copilotAgentName: string;
  copilotAgentDescription: string;
  copilotAgentWebchatSecret: string;
  copilotAgentIsActive: boolean;
  copilotAgentGreetings: string;
  copilotAgentWorkspaceId: string;
  seq: number;
}

export type UpdateCopilotAgentRequest = Partial<CreateCopilotAgentRequest>;

export interface CreateCopilotAgentResponse extends CopilotAgent {
  message: string;
}
export interface UpdateCopilotAgentResponse extends CopilotAgent {}

export interface DeleteCopilotAgentResponse {
  copilotAgentId: string;
  message: string;
}

// Derived type for the table display
export interface CopilotAgentWithWorkspace extends CopilotAgent {
  workspaceName: string;
  workspaceId: string;
}
