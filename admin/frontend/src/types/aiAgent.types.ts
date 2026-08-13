import { FileText, FlaskConical, Settings } from "lucide-react";

export interface AiAgent {
  agentId: string;
  agentName: string;
  description: string;
  category: "OCR" | "Others" | "Vertex" | string;
  externalUrl?: string;
  isActive: boolean;
  workspaceId: string;
  createdAt: string;
  updatedAt: string | null;
  seq: number;
}

export interface AiAgentWorkspace {
  workspaceId: string;
  workspaceName: string;
  aiAgents: AiAgent[];
}

export interface AiAgentBranch {
  branchId: string;
  branchName: string;
  workspaces: AiAgentWorkspace[];
}

export interface AiAgentCompany {
  companyId: string;
  companyName: string;
  branches: AiAgentBranch[];
}

export interface GetAllAiAgentsResponse {
  data: AiAgentCompany[];
  total: number;
}

// Derived type for the table display
export interface AiAgentWithWorkspace extends AiAgent {
  workspaceName: string;
  workspaceId: string;
}

export type UpdateAiAgentRequest = Partial<Omit<AiAgent, "agentId" | "createdAt" | "updatedAt">>;

export interface UpdateAiAgentResponse extends AiAgent {}

export interface AiAgentBatchConfig {
  storageProvider: string | null;
  containerName: string | null;
  blobPath: string | null;
  filePattern: string | null;
  scheduleType: "manual" | "cron";
  scheduleExpression: string | null;
}

export interface AiAgentCreateRequest {
  agentId: string;
  prompt: string;
  config: {
    agentName: string;
    description: string;
    isActive: boolean;
    workspaceId: string;
    category: string;
    externalUrl?: string;
    seq: number;
  };
  batch: AiAgentBatchConfig | null;
}

// Update Request Payload
export interface AiAgentUpdateRequestPayload {
  agentId: string;
  prompt: string;
  config: {
    agentName: string;
    description: string;
    isActive: boolean;
    workspaceId: string;
    category: string;
    externalUrl?: string;
    seq: number;
  };
  batch: AiAgentBatchConfig | null;
}

export interface AiAgentDeleteRequestPayload {
  agentId: string;
}

export interface AiAgentResponse {
  success: boolean;
  agentId: string;
  message: string;
}

export interface AiAgentTestRequestPayload {
  file: File;
  prompt_yaml: string;
  company_info_id: string;
}

// AI Agent Add New
export const AI_AGENT_ADD_NEW_TABS = [
  { id: "config", label: "General", icon: Settings },
  { id: "prompt", label: "Prompt", icon: FileText },
  { id: "testing", label: "Testing", icon: FlaskConical },
] as const;

export interface GetAiAgentByIdResponse {
  success: boolean;
  message: string;
  data?: AiAgentCreateRequest;
}

export interface VertexConfiguration {
  id: string;
  description: string;
  projectId: string;
  location: string;
  publisher: string;
  modelId: string;
  type: string;
  clientEmail: string;
  universeDomain: string;
  containerName: string;
  createAt: string;
}
