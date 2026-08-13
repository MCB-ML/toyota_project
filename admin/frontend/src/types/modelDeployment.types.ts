import type { ModelSpec } from "./model.types";

export const TABS_MODELDEPLOYMENT = {
  CHAT: "chat",
  RAG: "rag",
} as const;

export interface ShowForm {
  mode: number;
  show: boolean;
}

export interface ModelDeploymentReducerState {
  showForm: ShowForm;
  form: ModelSpec;
  selectTabForm: string;
}
