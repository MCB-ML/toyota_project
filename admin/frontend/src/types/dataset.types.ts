export const TABS_DATASET_IMPORT = {
  NEW: "new",
  EXISTING: "existing",
} as const;

export interface DatasetResponse {
  Id: string;
  datasetType: string;
  sourceName: string;
  fileName: string;
  fileList: FileList[];
}

export interface FileList {
  id: number;
  file: string;
}

export interface DatasetDeleteSource {
  Id: string;
  datasetType: string;
  sourceName: string;
}

export interface DatasetCreateSchemaRequest {
  Id?: string;
  datasetId: string;
  schemaValue: string;
  overviewValue: string;
}
export interface DatasetGenerateSchemaRequest {
  id: string;
  companyId: string;
  tableName: string;
}
export interface DatasetGenerateSchemaResponse {
  schema: string;
  overview: string;
}

export interface DatasetSchemaResponse {
  Id?: string;
  datasetId: number;
  schemaValue: string;
  overviewValue: string;
}
export interface DatasetSchemaSourceListResponse {
  tableName: string;
  tableColumn: string[];
}
export interface PreviewData {
  data: any;
  header: string[];
  typeDataValue: ColumnList[];
}

export interface DatasetBaseReducerState {
  selectedTabImport: string;
  importSource: string;
  previewData: PreviewData;
}

export interface DatasetReducerState extends DatasetBaseReducerState {
  datasetStep: number;
  dragFileActive: boolean;
  importMethod: ImportMethod;
}

export interface ColumnList {
  columnName: string;
  dataType: string;
}
export interface ImportMethod {
  file: File | null;
  name: string;
  ext: string;
  size: string;
  url?: string;
  group: string;
}
