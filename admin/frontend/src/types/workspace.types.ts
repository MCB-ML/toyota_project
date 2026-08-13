export interface WorkspaceData {
  workspaceId: string;
  workspaceName: string;
  branchId: string;
  branchName: string;
  workspaceDepartment: string;
  workspaceType: string;
  createdAt: string;
  updatedAt: string | null;
  seq?: number;
}

export interface GetAllWorkspacesResponse {
  workspaces: WorkspaceData[];
  total: number;
}

export interface CreateWorkspaceRequest {
  workspaceName: string;
  branchId: string;
  workspaceDepartment: string;
  workspaceType: string;
  seq?: number;
}

export interface CreateWorkspaceResponse extends WorkspaceData {}

export interface UpdateWorkspaceRequest {
  workspaceName: string;
  branchId: string;
  workspaceDepartment: string;
  seq?: number;
}

export interface UpdateWorkspaceResponse extends WorkspaceData {}

export interface DeleteWorkspaceResponse {
  workspaceId: string;
  message: string;
}

export const WORKSPACE_TYPE_LABELS: Record<string, string> = {
  powerBI: "Power BI",
  dataAgent: "Data Agent",
  aiAgent: "AI Agent",
  copilotAgent: "Copilot Agent",
};

export const getWorkspaceTypeLabel = (type: string): string => {
  return WORKSPACE_TYPE_LABELS[type] || type;
};

export interface WorkspaceUserAccessList {
  userId: string;
  email: string;
  name: string;
  source: string;
}
