import type { BranchData, BranchReducerState } from "../../../types/branch.types";

//const [isAddOpen, setIsAddOpen] = useState<boolean>(false);
//const [isEditOpen, setIsEditOpen] = useState<boolean>(false);
//const [isDeleteOpen, setIsDeleteOpen] = useState<boolean>(false);
//const [selectedBranch, setSelectedBranch] = useState<BranchData | null>(null);
//const [selectedCompanyId, setSelectedCompanyId] = useState<string>("");

export type BranchAction =
  | { type: "select_tab"; payload: string }
  | { type: "showForm"; show: boolean; mode?: number }
  | { type: "isDeleteOpen"; payload: boolean }
  | { type: "selectedBranch"; payload: BranchData }
  | { type: "selectedBranchFields"; field: string; value: any }
  | { type: "selectedCompanyId"; payload: string };

export const initBranchData = {
  branchId: "",
  branchName: "",
  companyId: "",
  companyName: "",
  branchType: "",
  branchLocation: "",
  branchUserAccess: null,
  createdAt: "",
  updatedAt: null,
  branchLogo: null,
  bgImg: null,
  dataAgentBotName: null,
  dataAgentWelcomeprompt: null,
  isActive: null,
  isDefault: null,
  branchConfiguration: [],
};

export const BranchStateInit: BranchReducerState = {
  tab: "general",
  showForm: false,
  showFormMode: 1, // 1 add , 2 edit
  isDeleteOpen: false,
  selectedBranch: initBranchData,
  selectedCompanyId: "",
};

export const BranchStateReducer = (
  state: BranchReducerState,
  action: BranchAction,
): BranchReducerState => {
  switch (action.type) {
    case "select_tab":
      return {
        ...state,
        tab: action.payload,
      };

    case "showForm": {
      const show = action.show;

      return {
        ...state,
        showForm: show,
        showFormMode: action.mode ?? 1,
        tab: show ? state.tab : "general",
        selectedBranch: show ? state.selectedBranch : initBranchData,
      };
    }

    case "isDeleteOpen":
      return {
        ...state,
        isDeleteOpen: action.payload,
      };

    case "selectedBranch":
      return {
        ...state,
        selectedBranch: action.payload,
      };
    case "selectedBranchFields":
      return {
        ...state,
        selectedBranch: {
          ...state.selectedBranch,
          [action.field]: action.value,
        },
      };

    case "selectedCompanyId":
      return {
        ...state,
        selectedCompanyId: action.payload,
      };

    default:
      return state;
  }
};
