import {
  type DataAgentForm,
  type DataAgentReducerState,
  type ShowDatasetDialog,
  type selectPDFFile,
  TABS_DATAAGENT,
} from "../../../types/dataAgent.types";

export type DataAgentAction =
  | { type: "showForm"; show: boolean; mode?: number }
  | { type: "showDatasetDialog"; payload: ShowDatasetDialog }
  | { type: "isDeleteOpen"; payload: boolean }
  | { type: "isDeleteSourceOpen"; payload: boolean }
  | { type: "selectedPDFFile"; payload: selectPDFFile }
  | { type: "selectedTab"; payload: string }
  | { type: "selectedTabForm"; payload: string }
  | { type: "selectedDataAgentFields"; field: string; value: any }
  | { type: "selectedDataAgent"; payload: DataAgentForm }
  | { type: "selectedCompany"; payload: string }
  | { type: "selectedBranchId"; payload: string }
  | { type: "selectedWorkspace"; payload: string }
  | { type: "selectedTabDataset"; payload: string }
  | { type: "expandedCompanies"; payload: Record<string, boolean> }
  | { type: "toggleCompany"; payload: string }
  | { type: "handleBranchSelect"; branchId: string; companyId: string }
  | { type: "handleCrudField"; operation: number; index: string; sourceType: string; source: any };

export const initDataAGentForm = {
  branchId: "",
  dataAgentId: "",
  workspaceId: "",
  agentName: "",
  desc: "",
  isActive: false,
  source: [],
  instruction: [],
  suggestion: [],
  seq: 1,
};
export const DataAgenStateInit: DataAgentReducerState = {
  showForm: false,
  showDatasetDialog: {
    show: false,
    type: 0,
  },
  showFormMode: 1,
  isDeleteOpen: false,
  isDeleteSourceOpen: false,
  dataAgentForm: initDataAGentForm,
  selectedTab: TABS_DATAAGENT.AGENT,
  selectedTabForm: TABS_DATAAGENT.GENERAL_FORM,
  selectedTabDataset: TABS_DATAAGENT.DATASET_DATA,
  selectedCompany: "",
  selectedBranchId: "",
  selectedWorkspace: "",
  expandedCompanies: {},
};

export const getUUID = () => {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

export const DataAgenStateReducer = (
  state: DataAgentReducerState,
  action: DataAgentAction,
): DataAgentReducerState => {
  switch (action.type) {
    case "showDatasetDialog": {
      return {
        ...state,
        showDatasetDialog: action.payload,
      };
    }
    case "showForm": {
      const show = action.show;

      return {
        ...state,
        showForm: show,
        showFormMode: action.mode ?? 1,
        dataAgentForm: initDataAGentForm,
        selectedTabForm: TABS_DATAAGENT.GENERAL_FORM,
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
    case "selectedTabDataset": {
      return {
        ...state,
        selectedTabDataset: action.payload,
      };
    }
    case "selectedBranchId": {
      return {
        ...state,
        selectedBranchId: action.payload,
      };
    }
    case "selectedCompany": {
      return {
        ...state,
        selectedCompany: action.payload,
      };
    }
    case "selectedWorkspace": {
      return {
        ...state,
        selectedWorkspace: action.payload,
      };
    }
    case "expandedCompanies": {
      return {
        ...state,
        expandedCompanies: action.payload,
      };
    }
    case "selectedDataAgent": {
      return {
        ...state,
        dataAgentForm: action.payload,
      };
    }

    case "isDeleteOpen":
      return {
        ...state,
        isDeleteOpen: action.payload,
      };
    case "isDeleteSourceOpen":
      return {
        ...state,
        isDeleteSourceOpen: action.payload,
      };
    case "selectedTab":
      return {
        ...state,
        selectedTab: action.payload,
      };
    case "selectedTabForm":
      return {
        ...state,
        selectedTabForm: action.payload,
      };

    case "selectedDataAgentFields":
      return {
        ...state,
        dataAgentForm: {
          ...state.dataAgentForm,
          [action.field]: action.value,
        },
      };

    case "handleCrudField": {
      const { operation, index, sourceType, source } = action;

      let instruction_list = [...(state.dataAgentForm.instruction || [])];
      let source_list = [...(state.dataAgentForm.source || [])];
      let suggestion_list = [...(state.dataAgentForm.suggestion || [])];

      if (sourceType === TABS_DATAAGENT.INSTRUCTION_FORM) {
        if (operation === 1) {
          instruction_list.push({ id: getUUID(), fileName: "", text: "" });
        } else if (operation === 3) {
          instruction_list = instruction_list.filter((item) => item.id !== index);
        } else {
          instruction_list = instruction_list.map((item) =>
            item.id === index ? { ...item, ...source } : item,
          );
        }
      } else if (sourceType === TABS_DATAAGENT.SUGGESTION) {
        if (operation === 1) {
          suggestion_list.push({ id: getUUID(), keyword: "", prompt: "" });
        } else if (operation === 3) {
          suggestion_list = suggestion_list.filter((item) => item.id !== index);
        } else {
          suggestion_list = suggestion_list.map((item) =>
            item.id === index ? { ...item, ...source } : item,
          );
        }
      } else {
        if (operation === 1) {
          const exists = source_list.find(
            (item) => item.source === source.source && item.type === source.type,
          );

          if (!exists) {
            source_list.push({
              id: getUUID(),
              source: source.source,
              type: source.type,
            });
          }
        } else if (operation === 3) {
          source_list = source_list.filter(
            (item) => !(item.source === index && item.type === source.type),
          );
        } else {
          source_list = source_list.map((item) =>
            item.id === index ? { ...item, ...source } : item,
          );
        }
      }

      //}else {
      //  if (operation === 1) {
      //    source_list.push({
      //      id: getUUID(),
      //      source: "",
      //      type: sourceType === "sql_form" ? "sql" : "rag",
      //    });
      //  } else if (operation === 3) {
      //    source_list = source_list.filter((item) => item.id !== index);
      //  } else {
      //    source_list = source_list.map((item) =>
      //      item.id === index ? { ...item, ...source } : item,
      //    );
      //  }
      //}

      return {
        ...state,
        dataAgentForm: {
          ...state.dataAgentForm,
          instruction: instruction_list,
          source: source_list,
          suggestion: suggestion_list,
        },
      };
    }
    default:
      return state;
  }
};
