import Papa from "papaparse";
import { useEffect } from "react";
import * as XLSX from "xlsx";
import type { ColumnList, DatasetReducerState } from "../../../../../../types/dataset.types";
import type { DatasetAction } from "../../../Dataset.reducer";

interface CsvRow {
  [key: string]: string;
}

interface DatasetPreviewProps {
  state: DatasetReducerState;
  dispatch: React.Dispatch<DatasetAction>;
}

const DatasetPreview = ({ state, dispatch }: DatasetPreviewProps) => {
  const PreviewData = () => {
    if (state.importMethod.ext === "csv" || state.importMethod.ext === "txt") PreviewDataCSV();
    if (state.importMethod.ext === "xlsx" || state.importMethod.ext === "xls") PreviewDataExcel();
  };

  const PreviewDataExcel = () => {
    if (!state.importMethod.file) return;

    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const arrayBuffer = event.target?.result as ArrayBuffer;
        const workbook = XLSX.read(arrayBuffer, { type: "array" });

        const sheetName = workbook.SheetNames[0];

        const sheet = workbook.Sheets[sheetName];

        const rows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });
        const header = rows[0] as string[];

        const dataType = getHeaderAndTypesExcel(sheet);

        const jsonData: any[] = XLSX.utils.sheet_to_json(sheet, { defval: "", raw: false });

        const result: ColumnList[] = header.map((value) => ({
          columnName: value,
          dataType: dataType[value],
        }));

        dispatch({
          type: "previewData",
          payload: {
            header: header,
            data: jsonData.slice(0, 50),
            typeDataValue: result,
          },
        });
      } catch (_err) {}
    };

    reader.readAsArrayBuffer(state.importMethod.file);
  };

  const PreviewDataCSV = () => {
    try {
      Papa.parse(state.importMethod.file, {
        header: true,
        skipEmptyLines: true,
        complete: (results: any) => {
          if (results.data.length > 0) {
            const previewData = results.data as CsvRow[];

            const header: string[] = Object.keys(results.data[0] as string[]);

            const columnListType = detectDataTypeValues(previewData.slice(0, 1));

            const result: ColumnList[] = header.map((value) => ({
              columnName: value,
              dataType: columnListType[value],
            }));

            dispatch({
              type: "previewData",
              payload: {
                header: header,
                data: previewData.slice(0, 50),
                typeDataValue: result,
              },
            });
          }
        },
      });
    } catch (_err) {}
  };

  const isValidDate = (value: string): boolean => {
    if (!value) return false;

    const parts = value.includes("/") ? value.split("/") : value.split("-");
    if (parts.length !== 3) return false;

    let day: number, month: number, year: number;

    if (parts[0].length === 4) {
      year = Number(parts[0]);
      month = Number(parts[1]);
      day = Number(parts[2]);
    } else if (parts[2].length === 4) {
      const p1 = Number(parts[0]);
      const p2 = Number(parts[1]);
      year = Number(parts[2]);

      if (p1 > 12) {
        day = p1;
        month = p2;
      } else {
        month = p1;
        day = p2;
      }
    } else if (parts[2].length === 2) {
      const p1 = Number(parts[0]);
      const p2 = Number(parts[1]);
      year = 2000 + Number(parts[2]);
      if (p1 > 12) {
        day = p1;
        month = p2;
      } else {
        month = p1;
        day = p2;
      }
    } else {
      return false;
    }

    if ([day, month, year].some((n) => Number.isNaN(n))) return false;

    const date = new Date(year, month - 1, day);
    return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
  };

  const detectDataTypeValues = (data: CsvRow[]) => {
    if (!data || data.length === 0) return {};

    const firstRow = data[0];

    const detectedTypes: Record<string, string> = {};

    for (const [key, val] of Object.entries(firstRow)) {
      const k = key.trim();
      const value = typeof val === "string" ? val.replace(/[.,]/g, "") : val;

      if (value === null || value === "" || value === undefined) {
        detectedTypes[k] = "String";
      } else if (!Number.isNaN(Number(value))) {
        if (/[.,]/.test(val) && !/^[0-9]+[.,]0+$/.test(val)) {
          detectedTypes[k] = "Decimal";
        } else {
          detectedTypes[k] = "Integer";
        }
      } else if (isValidDate(value) && !Number.isNaN(Date.parse(value as string))) {
        detectedTypes[k] = "Date";
      } else {
        detectedTypes[k] = "String";
      }
    }

    return detectedTypes;
  };

  const getHeaderAndTypesExcel = (sheet: XLSX.WorkSheet) => {
    const range = XLSX.utils.decode_range(sheet["!ref"]!);

    const headerRow = 0;
    const dataRow = 1;

    const columns: Record<string, string> = {};

    for (let C = range.s.c; C <= range.e.c; ++C) {
      const headerAddr = XLSX.utils.encode_cell({ r: headerRow, c: C });
      const headerCell = sheet[headerAddr];
      const columnName = headerCell?.v?.toString().trim() ?? `Column${C + 1}`;

      const dataAddr = XLSX.utils.encode_cell({ r: dataRow, c: C });
      const cell = sheet[dataAddr];

      let type = "String";

      if (cell) {
        if (cell.t === "d") {
          type = "Date";
        } else if (cell.t === "n") {
          if (cell.w && isValidDate(cell.w)) {
            type = "Date";
          } else if (cell.z && /[dy]/i.test(cell.z)) {
            type = "Date";
          } else {
            const formatted = cell.w?.trim() || "";
            if (formatted.includes(",") || formatted.includes(".")) {
              type = "Decimal";
            } else if (Number.isInteger(cell.v)) {
              type = "Integer";
            } else {
              type = "Decimal";
            }
          }
        } else if (cell.t === "s") {
          type = !Number.isNaN(Date.parse(cell.v)) && isValidDate(cell.v) ? "Date" : "String";
        }
      }

      columns[columnName] = type;
    }

    return columns;
  };

  useEffect(() => {
    if (state.importMethod.ext) PreviewData();
  }, [state.importMethod.file]);

  return (
    <div className="overflow-auto max-h-[450px] text-black flex flex-col  min-w-0">
      {state.importMethod.ext === "pdf" && state.importMethod?.url && (
        <div className="w-full bg-white  overflow-hidden">
          <div className="flex items-center justify-between py-1">
            <div className="flex items-center">
              <div>
                <p className="text-sm font-medium text-gray-900">PDF Preview</p>
                <p className="text-xs text-gray-500">Uploaded document</p>
              </div>
            </div>

            <div className="flex items-center">
              <a
                href={state.importMethod.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs px-3 py-1.5 rounded-lg border border-gray-300 hover:bg-gray-100 transition"
              >
                Open in new Tab
              </a>
              {/*<a*/}
              {/*    href={state.fileUpload.url}*/}
              {/*    download*/}
              {/*    className="text-xs px-3 py-1.5 rounded-lg bg-gray-900 text-white hover:bg-gray-800 transition"*/}
              {/*>*/}
              {/*    Download*/}
              {/*</a>*/}
            </div>
          </div>

          <div className="relative bg-gray-100">
            <iframe src={state.importMethod.url} title="PDF Preview" className="w-full h-[600px]" />
          </div>
        </div>
      )}
      {state.importMethod.ext !== "pdf" && state.previewData?.data?.length > 0 && (
        <div>
          <div className="flex items-center justify-between pb-5">
            <div>
              <h3 className="text-sm font-semibold text-gray-800">Dataset Preview</h3>
              <p className="text-xs text-gray-500">
                Showing first {state.previewData?.data?.length} rows from uploaded file
              </p>
            </div>
          </div>
          <table className="min-w-max w-full border-collapse text-sm">
            <thead className="sticky top-0 bg-gray-100 z-10">
              <tr>
                {Object.keys(state.previewData.data[0]).map((key) => (
                  <th key={key} className="text-left text-sm border px-2 py-1 truncate">
                    {key}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {state.previewData.data.map((row: any, i: number) => (
                //{dataPreview.slice(0, 10).map((row, i) => (
                <tr key={i}>
                  {Object.values(row).map((val: any, j) => (
                    <td key={j} className="text-sm  border px-2 py-1 truncate">
                      {val}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default DatasetPreview;
