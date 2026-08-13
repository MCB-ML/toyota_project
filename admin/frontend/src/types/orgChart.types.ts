import type { BranchData } from "./branch.types";
import type { CompanyInfoFormData } from "./companyInfo.types";
import type { UserData } from "./user.types";
import type { WorkspaceData } from "./workspace.types";

export interface UserAssignment {
  companyId: string;
  branchId: string;
  workspaceId: string;
}

export interface EndUserItem extends UserData {
  assignments: UserAssignment[];
  avatarSeed: string;
  name: string;
  department?: string | null;
  userAvatar?: string | null;
}

export interface CompanyTreeData extends Partial<CompanyInfoFormData> {
  id: string;
  companyName: string;
  branches: BranchTreeData[];
}

export interface BranchTreeData extends Partial<BranchData> {
  id: string;
  branchName: string;
  workspaces: WorkspaceTreeData[];
}

export interface WorkspaceTreeData extends Partial<WorkspaceData> {
  id: string;
  workspaceName: string;
}

// API Responses
export interface CompanyViewResponse {
  companies: CompanyTreeData[];
  total: number;
}

export interface BranchViewResponse {
  branches: BranchTreeData[];
  total: number;
}

export interface WorkspaceViewItem extends WorkspaceData {
  id: string;
  userCount: number;
}

export interface WorkspaceViewResponse {
  workspaces: WorkspaceViewItem[];
  total: number;
}

export interface EndUserViewResponse {
  users: EndUserItem[];
  total: number;
}
