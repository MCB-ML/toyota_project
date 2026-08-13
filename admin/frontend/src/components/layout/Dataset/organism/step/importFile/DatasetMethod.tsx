import { ArrowUpFromLine } from "lucide-react";
import { toast } from "sonner";
import azure_b from "@/assets/image/dataset/azure_b.png";
import csv from "@/assets/image/dataset/csv.png";
import databricks_b from "@/assets/image/dataset/databricks_b.png";
import fabric from "@/assets/image/dataset/fabric.png";
import pdf from "@/assets/image/dataset/pdf.png";
import snowflake_b from "@/assets/image/dataset/snowflake_b.png";
import xls from "@/assets/image/dataset/xls.png";
import type {
  CompanyConnections,
  CompanyInfoData,
} from "../../../../../../types/companyInfo.types";
import type { DatasetReducerState } from "../../../../../../types/dataset.types";
import type { DatasetAction } from "../../../Dataset.reducer";

interface DatasetMethodProps {
  connection: CompanyConnections[];
  companySetting: CompanyInfoData | null;
  state: DatasetReducerState;
  dispatch: React.Dispatch<DatasetAction>;
}

/** 업로드 허용 최대 크기(MB). 구 CompanyInfo.maxUploadSizeDataset 를 대체한다. */
const MAX_UPLOAD_SIZE_MB = 10;

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 B";

  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${(bytes / k ** i).toFixed(2)} ${sizes[i]}`;
};

export const DatasetMethod = ({
  connection,
  companySetting,
  state,
  dispatch,
}: DatasetMethodProps) => {
  const hasSql = connection.some((e) => e.isActive && e.agentType === "sql");

  const hasRag = connection.some((e) => e.isActive && e.agentType === "rag");
  console.log("hasSql", hasSql, connection);
  const listType = (): string[] => {
    if (!connection) return [];

    const types = new Set<string>();

    if (hasSql) {
      types.add("csv");
      types.add("xls");
      types.add("xlsx");
    }

    if (hasRag) {
      types.add("pdf");
    }

    return Array.from(types);
  };

  const _fileOptions = [
    {
      ext: "fabric",
      label: "Microsoft Fabric",
      img: fabric,
      enabled: true,
    },
    {
      ext: "azure",
      label: "Azure",
      img: azure_b,
      enabled: false,
    },
    {
      ext: "databricks",
      label: "Databricks",
      img: databricks_b,
      enabled: false,
    },
    {
      ext: "snowflake",
      label: "Snowflake",
      img: snowflake_b,
      enabled: false,
    },
  ];
  const _filetypecss =
    "rounded p-4 shadow text-sm cursor-pointer text-sm  hover:bg-[#347298] hover:text-white transition-all duration-300 transform hover:scale-105";

  const validateFileUpload = (file: FileList) => {
    if (file && file.length > 0) {
      const selectedfile = file[0];

      const ext = selectedfile.name.split(".").pop()?.toLowerCase();

      const name: string = selectedfile.name;

      // 딜러사별 업로드 크기 설정을 제거하고 고정값을 쓴다.
      // (Company Info 는 이름/설명만 관리한다)
      const maxSize = MAX_UPLOAD_SIZE_MB;

      if (selectedfile.size / (1024 * 1024) > maxSize) {
        toast.error(`File size exceeds the maximum limit of ${maxSize} MB.`);

        return;
      }

      if (!ext) return;

      if (!listType().includes(ext)) {
        const allowedTypes = listType();

        const formatTypes = (types: string[]) => {
          return types
            .map((t) => t.toUpperCase())
            .join(", ")
            .replace(/, ([^,]*)$/, " or $1"); // replace last comma with "or"
        };

        toast.error(`Invalid file type. Please upload a ${formatTypes(allowedTypes)} file.`);

        return;
      }

      dispatch({
        type: "importMethod",
        payload: {
          ext: ext,
          file: selectedfile,
          name: name,
          size: formatFileSize(selectedfile.size),
          url: URL.createObjectURL(selectedfile),
          group: "upload",
        },
      });
    }
  };

  const onHandleChangeFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (!file) return;

    validateFileUpload(e.target.files!);
  };

  const onHandleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();

    dispatch({ type: "dragFileActive", payload: true });
  };

  const onHandleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();

    dispatch({ type: "dragFileActive", payload: false });
  };

  const onHandleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();

    dispatch({ type: "dragFileActive", payload: false });

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateFileUpload(e.dataTransfer.files);

      e.dataTransfer.clearData();
    }
  };
  const getFileIcon = (fileName: string) => {
    const ext = fileName.split(".").pop()?.toLowerCase();

    switch (ext) {
      case "pdf":
        return <img className=" w-10 h-10" src={pdf} alt="" />;

      case "csv":
        return <img className=" w-10 h-10" src={csv} alt="" />;
      case "xls":
      case "xlsx":
        return <img className=" w-10 h-10" src={xls} alt="" />;
    }
  };
  return (
    <div>
      <div
        className={`  flex flex-col items-center mb-6 bg-[radial-gradient(140%_120%_at_40%_15%,rgb(255,255,255)_0%,rgb(250,252,255)_30%,rgb(242,247,252)_60%,rgb(225,236,244)_85%,rgb(210,225,236)_100%)]`}
      >
        <div
          className={` w-full h-80 justify-center border border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer transition-colors
    ${state.dragFileActive ? "border-blue-500 bg-blue-50" : " border-[#347298]"}`}
          onDragOver={onHandleDragOver}
          onDragLeave={onHandleDragLeave}
          onDrop={onHandleDrop}
          onClick={() => document.getElementById("fileInput")?.click()}
        >
          {state.importMethod.file ? (
            <div className="flex flex-col items-center gap-2">
              {getFileIcon(state.importMethod.name)}
              <p className="text-sm text-gray-700 truncate max-w-xs">{state.importMethod.name}</p>
            </div>
          ) : (
            <div className="text-center">
              <ArrowUpFromLine size={17} className="size-9 m-auto text-gray-500 pb-2" />
              <p className="text-sm text-gray-500">
                Drag & drop or{" "}
                <span className="border-b text-[#347298] border-[#347298]">select to browse</span>
              </p>

              <div className="flex justify-center gap-3 mt-4 text-xs text-gray-500">
                {hasSql && (
                  <>
                    <div className="flex flex-col items-center">
                      <img className=" w-9 h-9" src={xls} alt="" />
                    </div>
                    <div className="flex flex-col items-center ">
                      <img className=" w-9 h-9" src={csv} alt="" />
                    </div>
                  </>
                )}
                {hasRag && (
                  <div className="flex flex-col items-center">
                    <img className=" w-9 h-9" src={pdf} alt="" />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <input
          id="fileInput"
          name="fileUpload"
          type="file"
          className="hidden w-full"
          accept={listType()
            .map((ext) => `.${ext}`)
            .join(", ")}
          onChange={onHandleChangeFile}
        />
      </div>

      {/*<div className="grid grid-cols-4 gap-6 items-center">*/}
      {/*    {fileOptions.map((file, index) => (*/}
      {/*        <div*/}
      {/*            key={index}*/}
      {/*            className={`*/}
      {/*                ${state.importMethod.ext === file.ext ? "bg-[#1557b0] text-white" : ""}*/}
      {/*                h-[55px] rounded px-4 shadow text-sm cursor-pointer transition-all duration-300 transform ${file.enabled*/}
      {/*                    ? "hover:bg-[#1557b0] hover:text-white hover:scale-105"*/}
      {/*                    : `relative pointer-events-none disabled bg-gray-50 flex justify-center items-center ${filetypecss}`*/}
      {/*                }`}*/}
      {/*        >*/}
      {/*            {file.enabled ? (*/}
      {/*                <div*/}
      {/*                    className="flex items-center"*/}
      {/*                    onClick={() =>*/}
      {/*                        dispatch({*/}
      {/*                            type: "importMethod",*/}
      {/*                            payload: {*/}
      {/*                                ext: file.ext,*/}
      {/*                                file: null,*/}
      {/*                                name: "",*/}
      {/*                                size: "0",*/}
      {/*                                url: "",*/}
      {/*                                group: "",*/}
      {/*                            },*/}
      {/*                        })*/}
      {/*                    }*/}
      {/*                >*/}
      {/*                    <img className="w-6 h-13 object-contain" src={file.img} alt={file.label} />*/}
      {/*                    <div className="font-bold ml-3">{file.label}</div>*/}
      {/*                </div>*/}
      {/*            ) : (*/}
      {/*                <>*/}
      {/*                    <img className="w-[101px] absolute left-3" src={file.img} alt={file.label} />*/}
      {/*                    <span className="text-xs bg-[#e8f6ff] px-2 py-1 rounded-full absolute right-2">*/}
      {/*                        Coming soon*/}
      {/*                    </span>*/}
      {/*                </>*/}
      {/*            )}*/}
      {/*        </div>*/}
      {/*    ))}*/}
      {/*</div>*/}
    </div>
  );
};
