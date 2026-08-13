import type { ColumnList } from "../../../types/dataset.types";
import {
  type DatasetFabricReducerState,
  type DatasetJobReducerState,
  type DbConnection,
  type FabricTableList,
  TABS_FABRIC,
} from "../../../types/datasetFabric.types";
import {
  type DatasetBaseAction,
  DatasetBaseStateInit,
  DatasetBaseStateReducer,
} from "./Dataset.reducer";

export type DatasetJobAction =
  | { type: "showJobSchedule"; payload: boolean }
  | { type: "setJobMethod"; payload: string }
  | { type: "setJobRunDate"; payload: string }
  | { type: "setJobRunTime"; payload: string };

export type DatasetFabricAction =
  | DatasetJobAction
  | DatasetBaseAction
  | { type: "fabricTableList"; payload: FabricTableList[] }
  | { type: "fabricMode"; payload: string }
  | { type: "selectedTab"; payload: string }
  | { type: "editErdFabric"; payload: string }
  | { type: "queryPrompt"; payload: string }
  | { type: "setQueryResult"; payload: any }
  | { type: "setQueryBuilder"; payload: string; editQuery: boolean }
  | { type: "getQueryBuilder"; payload: string; fabricColumnList: ColumnList[] }
  | { type: "getColumnDataType"; payload: ColumnList[] }
  | { type: "saveNode"; tableNode: any[]; relationNode: any[] }
  | { type: "onChangeDbConnection"; field: string; value: any }
  | { type: "reset" };

export const DatasetJobStateInit: DatasetJobReducerState = {
  showJobSchedule: false,
  jobMethod: "1",
  jobRunDate: "",
  jobRunTime: "",
};

export const DatasetFabricStateInit: DatasetFabricReducerState = {
  ...DatasetJobStateInit,
  ...DatasetBaseStateInit,
  fabricTableList: [],
  dbConnection: {
    serverName: "",
    dbName: "",
    checked: false,
  },
  fabricMode: "C",
  fabricTableListOriginal: [],
  columnList: [],
  fabricColumnList: [],
  selectedTab: TABS_FABRIC.RELATION_TABLE,
  queryBuilder: "",
  queryBuilderOriginal: "",
  queryPrompt: "",
  queryResultData: [],
  tableNode: [],
  relationNode: [],
  editQuery: false,
  importMethod: {
    ext: "fabric",
    group: "opendb",
  },
};

export const DatasetJobStateReducer = <T extends DatasetJobReducerState>(
  state: T,
  action: DatasetJobAction,
): T => {
  switch (action.type) {
    case "showJobSchedule":
      return {
        ...state,
        showJobSchedule: action.payload,
      };
    case "setJobMethod":
      return {
        ...state,
        jobMethod: action.payload,
      };

    case "setJobRunDate":
      return {
        ...state,
        jobRunDate: action.payload,
      };
    case "setJobRunTime":
      return {
        ...state,
        jobRunTime: action.payload,
      };

    default:
      return state;
  }
};

export const DatasetFabricStateReducer = (
  state: DatasetFabricReducerState,
  action: DatasetFabricAction,
): DatasetFabricReducerState => {
  switch (action.type) {
    case "reset": {
      return { ...DatasetFabricStateInit };
    }

    case "setQueryBuilder":
      return {
        ...state,
        queryBuilder: action.payload,
        editQuery: action.editQuery,
      };

    case "setQueryResult":
      return {
        ...state,
        queryResultData: action.payload,
        editQuery: false,
      };
    case "queryPrompt":
      return {
        ...state,

        queryPrompt: action.payload,
      };
    case "getColumnDataType":
      return {
        ...state,

        columnList: action.payload,
      };
    case "getQueryBuilder":
      return {
        ...state,
        queryBuilderOriginal: action.payload,
        queryBuilder: action.payload,
        fabricColumnList: action.fabricColumnList,
      };
    case "editErdFabric": {
      return {
        ...state,
        fabricMode: action.payload,
      };
    }
    case "saveNode": {
      return {
        ...state,
        tableNode: action.tableNode,
        relationNode: action.relationNode,
      };
    }

    case "selectedTab": {
      return {
        ...state,
        selectedTab: action.payload,
      };
    }
    case "fabricMode": {
      return {
        ...state,
        fabricMode: action.payload,
      };
    }
    case "fabricTableList": {
      return {
        ...state,
        fabricTableList: action.payload,
      };
    }

    case "onChangeDbConnection": {
      const field = action.field as keyof DbConnection;
      return {
        ...state,
        dbConnection: {
          ...state.dbConnection,
          [field]: action.value,
        },
      };
    }

    default: {
      const jobState = DatasetJobStateReducer(state, action as DatasetJobAction);

      return DatasetBaseStateReducer(jobState, action as DatasetBaseAction);
    }
  }
};
