import type { ColumnList, DatasetBaseReducerState } from "./dataset.types";

export const TABS_FABRIC = {
  RELATION_TABLE: "relation_table",
  GENERATE_SQL: "generate_sql",
  PREVIEW: "preview",
} as const;

export interface DatasetFabricConnectRequest {
  serverName: string;
  dbName: string;
}

export interface DatasetFabricConnectResponse {
  serverName: string;
  dbName: string;
}
export interface FabricTableList {
  columnList: ColumnList[];
  tableName: string;
}

export interface DbConnection {
  serverName: string;
  dbName: string;
  checked: boolean;
}
export interface DatasetJobReducerState {
  showJobSchedule: boolean;
  jobMethod: string;
  jobRunDate: string;
  jobRunTime: string;
}

export interface DatasetFabricReducerState extends DatasetBaseReducerState, DatasetJobReducerState {
  fabricTableList: FabricTableList[];
  dbConnection: DbConnection;
  fabricMode: string;
  fabricTableListOriginal: FabricTableList[];
  columnList: ColumnList[];
  fabricColumnList: ColumnList[];
  selectedTab: string;
  queryBuilder: string;
  queryBuilderOriginal: string;
  queryPrompt: string;
  queryResultData: any[];
  tableNode: any[];
  relationNode: any[];
  editQuery: boolean;
  importMethod: {
    ext: string;
    group: string;
  };
}

export interface ERDNodeData {
  table: string;
  columns: ColumnList[];
  onRemove: () => void;
  isConnectable: boolean;
  fabricMode: string;
  step: number;
}

export interface TableData {
  tableList: any[];
  relationList: any[];
}
export interface TableRelationRequest {
  mode: number;
  companyId: string;
  query: string;
}

export interface GenereteQueryRequest {
  companyId: string;
  query: string;
  prompt: string;
}

export interface GenereteSampleDataRequest {
  serverName: string;
  dbName: string;
  query: string;
  page: number;
  limit: number;
  paging: boolean;
}

export interface ImportFabricRequest {
  source: string;
  sourceMethod: number;
  columns: ColumnList[];
  serverName: string;
  dbName: string;
  queryData: string;
  jobMethod: number;
  jobSchedule: string;
  companyId: string;
}
