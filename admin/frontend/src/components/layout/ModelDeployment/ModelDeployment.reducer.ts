import type { ModelSpec } from "../../../types/model.types";
import {
  type ModelDeploymentReducerState,
  type ShowForm,
  TABS_MODELDEPLOYMENT,
} from "../../../types/modelDeployment.types";

export type ModelDeploymentAction =
  | { type: "showForm"; payload: ShowForm }
  | { type: "setForm"; payload: ModelSpec }
  | { type: "formField"; field: string; value: any }
  | { type: "selectTabForm"; payload: string };

// 접속 키(endpoint / apiKey)는 여기 없다. 딜러사별 키는 회사 편집 화면에서 관리한다.
export const initModelDeploymentForm: ModelSpec = {
  id: "",
  displayName: "",
  provider: "bedrock",
  modelKind: "llm",
  modelId: "",
  apiVersion: "",
  maxToken: 8192,
  temperature: 0.2,
  topP: null,
  topK: null,
  reasoningEffort: "",
  embeddingModel: "",
  isActive: true,
};

export const ModelDeploymentStateInit: ModelDeploymentReducerState = {
  showForm: {
    show: false,
    mode: 0,
  },
  form: initModelDeploymentForm,
  selectTabForm: TABS_MODELDEPLOYMENT.CHAT,
};

export const ModelDeploymentStateStateReducer = (
  state: ModelDeploymentReducerState,
  action: ModelDeploymentAction,
): ModelDeploymentReducerState => {
  switch (action.type) {
    case "setForm":
      return {
        ...state,
        form: action.payload,
      };
    case "selectTabForm":
      return {
        ...state,
        selectTabForm: action.payload,
      };
    case "showForm":
      return {
        ...state,
        showForm: action.payload,
        form:
          action.payload.mode === 0 || action.payload.mode === 1
            ? initModelDeploymentForm
            : state.form,
      };
    case "formField":
      return {
        ...state,
        form: {
          ...state.form,
          [action.field]: action.value,
        },
      };
    default:
      return state;
  }
};
