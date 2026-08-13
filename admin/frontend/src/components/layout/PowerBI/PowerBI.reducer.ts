import {
  type PowerBIData,
  type PowerBIReducerState,
  TABS_POWERBI,
} from "../../../types/powerBi.types";
import { getUUID } from "../DataAgent/DataAgent.reducer";

export type PowerBIAction =
  | { type: "showForm"; show: boolean; mode?: number }
  | { type: "isDeleteOpen"; payload: boolean }
  | { type: "selectedPowerBI"; payload: PowerBIData }
  | { type: "selectedTabForm"; payload: string }
  | { type: "selectedCompany"; payload: string }
  | { type: "selectedBranchId"; payload: string }
  | { type: "selectedWorkspace"; payload: string }
  | { type: "selectedTabDataset"; payload: string }
  | { type: "expandedCompanies"; payload: Record<string, boolean> }
  | { type: "selectedPowerBIFields"; field: string; value: any }
  | { type: "toggleCompany"; payload: string }
  | { type: "handleBranchSelect"; branchId: string; companyId: string }
  | { type: "handleCrudField"; operation: number; index: string; sourceType: string; source: any };

export const initPowerBIData: PowerBIData = {
  Id: "",
  workspace: "",
  agentName: "",
  desc: "",
  isReport: false,
  isChatAgent: false,
  tenantID: "",
  clientID: "",
  workspaceID: "",
  clientSecret: "",
  reportID: "",
  createdAt: "",
  pageID: "",
  isActive: false,
  seq: 1,
};

export const PowerBIStateInit: PowerBIReducerState = {
  showForm: false,
  showFormMode: 1,
  isDeleteOpen: false,
  selectedPowerBI: initPowerBIData,
  selectedTabForm: TABS_POWERBI.GENERAL,
  selectedCompany: "",
  selectedBranchId: "",
  expandedCompanies: {},
  selectedWorkspace: "",
};

export const PowerBIStateReducer = (
  state: PowerBIReducerState,
  action: PowerBIAction,
): PowerBIReducerState => {
  switch (action.type) {
    case "showForm": {
      const show = action.show;

      return {
        ...state,
        showForm: show,
        showFormMode: action.mode ?? 1,
        selectedPowerBI: show ? state.selectedPowerBI : initPowerBIData,
        selectedTabForm: TABS_POWERBI.GENERAL,
      };
    }
    case "handleBranchSelect": {
      return {
        ...state,
        selectedBranchId: action.branchId,
        selectedCompany: action.companyId,
      };
    }
    case "toggleCompany": {
      return {
        ...state,
        expandedCompanies: { [action.payload]: true },
        selectedCompany: action.payload,
        selectedBranchId: "",
      };
    }
    case "selectedBranchId": {
      return {
        ...state,
        selectedBranchId: action.payload,
      };
    }
    case "selectedWorkspace": {
      return {
        ...state,
        selectedWorkspace: action.payload,
      };
    }
    case "selectedCompany": {
      return {
        ...state,
        selectedCompany: action.payload,
      };
    }
    case "expandedCompanies": {
      return {
        ...state,
        expandedCompanies: action.payload,
      };
    }
    case "selectedTabForm":
      return {
        ...state,
        selectedTabForm: action.payload,
      };
    case "isDeleteOpen":
      return {
        ...state,
        isDeleteOpen: action.payload,
      };

    case "selectedPowerBI":
      return {
        ...state,
        selectedPowerBI: action.payload,
      };
    case "selectedPowerBIFields":
      return {
        ...state,
        selectedPowerBI: {
          ...state.selectedPowerBI,
          [action.field]: action.value,
        },
      };
    case "handleCrudField": {
      const { operation, index, sourceType, source } = action;

      let suggestion_list = [...(state.selectedPowerBI.suggestion || [])];

      if (operation === 1) {
        suggestion_list.push({ id: getUUID(), keyword: "", prompt: "" });
      } else if (operation === 3) {
        suggestion_list = suggestion_list.filter((item) => item.id !== index);
      } else {
        suggestion_list = suggestion_list.map((item) =>
          item.id === index ? { ...item, ...source } : item,
        );
      }

      return {
        ...state,
        selectedPowerBI: {
          ...state.selectedPowerBI,
          suggestion: suggestion_list,
        },
      };
    }
    default:
      return state;
  }
};
