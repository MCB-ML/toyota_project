import {
  type ColumnList,
  type DatasetBaseReducerState,
  type DatasetReducerState,
  type ImportMethod,
  type PreviewData,
  TABS_DATASET_IMPORT,
} from "../../../types/dataset.types";

export type DatasetBaseAction =
  | { type: "previewData"; payload: PreviewData }
  | { type: "selectedTabImport"; payload: string }
  | { type: "importSource"; payload: string }
  | { type: "changeColumnType"; field: string; value: string };

export type DatasetAction =
  | DatasetBaseAction
  | { type: "datasetStep"; payload: number }
  | { type: "dragFileActive"; payload: boolean }
  | { type: "importMethod"; payload: ImportMethod }
  | { type: "reset" };

export const DatasetBaseStateInit: DatasetBaseReducerState = {
  previewData: {
    data: [],
    header: [],
    typeDataValue: [],
  },
  selectedTabImport: TABS_DATASET_IMPORT.NEW,
  importSource: "",
};

export const DatasetStateInit: DatasetReducerState = {
  ...DatasetBaseStateInit,
  datasetStep: 1,
  dragFileActive: false,
  importMethod: {
    file: null,
    name: "",
    ext: "",
    size: "",
    group: "",
  },
};

export const DatasetBaseStateReducer = <T extends DatasetBaseReducerState>(
  state: T,
  action: DatasetBaseAction,
): T => {
  switch (action.type) {
    case "changeColumnType": {
      return {
        ...state,
        previewData: {
          ...state.previewData,
          typeDataValue: state.previewData.typeDataValue.map((col: ColumnList) =>
            col.columnName === action.field ? { ...col, dataType: action.value } : col,
          ),
        },
      };
    }
    case "importSource": {
      return {
        ...state,
        importSource: action.payload,
      };
    }
    case "selectedTabImport": {
      return {
        ...state,
        selectedTabImport: action.payload,
      };
    }

    case "previewData": {
      return {
        ...state,
        previewData: action.payload,
      };
    }

    default:
      return state;
  }
};

export const DatasetStateReducer = (
  state: DatasetReducerState,
  action: DatasetAction,
): DatasetReducerState => {
  switch (action.type) {
    case "reset": {
      return { ...DatasetStateInit };
    }

    case "datasetStep": {
      return {
        ...state,
        datasetStep: action.payload,
      };
    }

    case "dragFileActive": {
      return {
        ...state,
        dragFileActive: action.payload,
      };
    }
    case "importMethod": {
      return {
        ...state,
        importMethod: action.payload,
      };
    }

    default:
      return DatasetBaseStateReducer(state, action);
  }
};
