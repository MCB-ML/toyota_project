export interface UserData {
  id: number;
  username: string;
  email: string;
  role: string;
  selectedChatbots: number[];
}

// User Role Options
interface UserRoleData {
  value: string;
  label: string;
}

/**
 * 사용자 권한 3종.
 *   admin  — 전 딜러사 조회/관리
 *   user   — 소속 딜러사 조회/편집
 *   viewer — 소속 딜러사 조회만
 * 각 권한이 실제로 무엇을 허용하는지는 에이전트 백엔드가 판단한다.
 */
export const UserRoleOptions: UserRoleData[] = [
  { value: "admin", label: "Admin" },
  { value: "user", label: "User" },
  { value: "viewer", label: "Viewer" },
];

// API Response Types
export interface UserListData {
  UserID: number;
  EmailUser: string;
  Username: string;
  RoleAccount: string;
  CreatedDate: string;
  Status: boolean;
}

// Update User Types
export interface UpdateUserFormData {
  email: string;
  password: string;
  username: string;
  role: string;
  status?: string;
}

export interface UpdateUserSuccessResponse {
  UserID: number;
  EmailUser: string;
  Username: string;
  RoleAccount: string;
  CreatedDate: string;
  Status: boolean;
}

export interface UpdateUserErrorResponse {
  detail:
    | string
    | Array<{
        type: string;
        loc: string[];
        msg: string;
        input: any;
      }>;
}

export type UpdateUserResponse = UpdateUserSuccessResponse | UpdateUserErrorResponse;

// Delete User Types
export interface DeleteUserSuccessResponse {
  message: string;
}

export interface DeleteUserErrorResponse {
  detail: string;
}

export type DeleteUserResponse = DeleteUserSuccessResponse | DeleteUserErrorResponse;

// AD User Types
export interface ADUser {
  userId: string;
  userName: string;
  userEmail: string;
  workspaces: { workspaceId: string; workspaceName: string }[];
  userRole: string | null;
  userAccess: string | null;
  userDepartment: string | null;
  userAvatar: string | null;
  defaultCompany: string | null;
  defaultLanguage: string | null;
  createdAt: string;
  updatedAt: string | null;
}

export interface ADUserListResponse {
  users: ADUser[];
  total: number;
}

// Create Credential User Request
export interface CreateUserRequest {
  userName: string;
  userEmail: string;
  userPassword?: string;
  workspaceIds: string[];
  userRole?: string;
  userAccess?: string;
  userDepartment?: string;
  defaultCompany?: string;
  defaultLanguage?: string;
  mode?: string;
}

// Create AD User Request
export interface CreateADUserRequest {
  userId: string;
  userName: string;
  userEmail: string;
  userRole: string; // "user"
  workspaceIds: string[];
  userAccess: string; // "full access"
  userDepartment?: string | null;
  defaultCompany: string | null;
  defaultLanguage: string | null;
  mode?: string | null;
}

export interface UpdateADUserRequest {
  userRole: string;
  userAccess?: string;
  userDepartment?: string;
  workspaceIds?: string[];
  defaultCompany?: string;
  defaultLanguage?: string;
}

export interface DeleteADUserResponse {
  message: string;
}

export interface CreateUserResponse {
  userId: string;
  userName: string;
  userEmail: string;
  workspaces: { workspaceId: string; workspaceName: string }[];
  userRole: string;
  userAccess: string;
  userDepartment: string;
  createdAt: string;
  updatedAt: string | null;
}

// Credential User Types
export interface User {
  userId: string;
  userName: string;
  userEmail: string;
  workspaces: { workspaceId: string; workspaceName: string }[];
  userRole: string;
  userAccess: string;
  userDepartment: string;
  userAvatar: string | null;
  userChangePassword: string;
  createdAt: string;
  updatedAt: string | null;
  defaultCompany: string | null;
  defaultLanguage: string | null;
}

export interface UserListResponse {
  users: User[];
  total: number;
}

export interface UpdateUserRequest {
  userName?: string;
  userEmail?: string;
  workspaceIds?: string[];
  userRole?: string;
  userAccess?: string;
  userDepartment?: string;
  userPassword?: string;
  userChangePassword?: string;
  defaultCompany?: string;
  defaultLanguage?: string;
}
