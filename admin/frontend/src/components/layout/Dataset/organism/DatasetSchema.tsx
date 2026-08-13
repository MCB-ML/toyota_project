import { Editor } from "@monaco-editor/react";
import yaml from "js-yaml";
import { Loader2, Sparkles } from "lucide-react";
import { forwardRef, useEffect, useImperativeHandle, useState } from "react";
import { toast } from "sonner";
import { useGenerateTableSchema } from "../../../../services/api/dataset/generateTableSchema";
import { useUpsertDatasetSchema } from "../../../../services/api/dataset/upsertDatasetSchema";
import type { DatasetCreateSchemaRequest } from "../../../../types/dataset.types";
import { getErrorMessage } from "../../../../utils/getErrorMessage";
import LoadingPage from "../../../reusable/loadingPage";
export interface DatasetSchemaRef {
  onUpdate: () => void;
}

interface DatasetSchemaProps {
  show: boolean;
  companyId: string;
  source: string;
  schemaId: string;
  overviewValue: string;
  schemaValue: string;
  id: string;
}

const DatasetSchema = forwardRef<DatasetSchemaRef, DatasetSchemaProps>(
  ({ show, companyId, source, schemaId, overviewValue, schemaValue, id }, ref) => {
    const [value, setValue] = useState(schemaValue);
    const [valueOv, setOvValue] = useState(overviewValue);
    const [tab, setTab] = useState<"overview" | "schema">("overview");
    const { mutate: upsertSchema, isPending: isCreating } = useUpsertDatasetSchema();
    const { mutateAsync, isPending } = useGenerateTableSchema();

    const generateSchema = async () => {
      if (!id || !source || !companyId) return;
      const result = await mutateAsync({
        id: id,
        companyId: companyId,
        tableName: source,
      });

      if (result.success) {
        setValue(result.result.schema);
        setOvValue(result.result.overview);
      } else {
        toast.error("Failed to generate schema");
      }
    };

    const _handleFileUpload = (file: File) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        const content = e.target?.result as string;

        try {
          yaml.load(content);
          setValue(content);
          toast.success("YAML file loaded successfully");
        } catch (err: any) {
          toast.error("Invalid YAML file", {
            description: err.message,
          });
        }
      };

      reader.readAsText(file);
    };

    const onUpdate = () => {
      try {
        yaml.load(value);
        yaml.load(valueOv);
      } catch (e: any) {
        toast.error("Failed save schema", {
          description: `Invalid YAML format : ${e.message}`,
        });
        return;
      }

      const payload: DatasetCreateSchemaRequest = {
        Id: schemaId,
        datasetId: id,
        schemaValue: value,
        overviewValue: valueOv,
      };

      upsertSchema(payload, {
        onSuccess: () => {
          toast.success("Success save schema", {
            description: "Schema saved successfully.",
          });
        },
        onError: (error) => {
          toast.error("Failed to save schema", {
            description: getErrorMessage(error),
          });
        },
      });
    };

    useImperativeHandle(ref, () => ({
      onUpdate,
    }));
    useEffect(() => {
      setValue(schemaValue);
    }, [schemaValue]);

    useEffect(() => {
      setOvValue(overviewValue);
    }, [overviewValue]);
    return (
      <div hidden={!show} className="w-full bg-white min-w-0 overflow-hidden flex flex-col h-[90%]">
        <LoadingPage isLoading={isCreating || isPending} />

        <div className="px-5 py-2 flex-1 overflow-y-auto min-h-0">
          <div className="mb-3 flex items-center gap-1">
            <button
              className={` ${tab === "overview" ? "  rounded-xl shadow  border font-bold  text-gray-700" : ""} px-5 py-1 text-sm  font-medium text-gray-500`}
              onClick={() => setTab("overview")}
            >
              Overview{" "}
            </button>
            <button
              className={` ${tab === "schema" ? "  rounded-xl shadow  border font-bold  text-gray-700" : ""} px-5 py-1 text-sm  m font-medium text-gray-500`}
              onClick={() => setTab("schema")}
            >
              Schema Definition
            </button>
            <label
              className=" ml-auto flex cursor-pointer items-center gap-2 rounded-md border px-3 py-1.5 text-sm text-gray-600
               hover:bg-gray-100 transition"
            >
              {" "}
              <button
                disabled={isPending}
                onClick={generateSchema}
                className="flex items-center gap-2"
              >
                {isPending ? (
                  <Loader2 size={15} className="animate-spin text-gray-400" />
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 text-gray-500" />
                    Generate with AI
                  </>
                )}
              </button>
            </label>
          </div>

          <div className=" min-h-0 overflow-hidden rounded-lg border pb-2 h-[80%]">
            {tab === "overview" && (
              <Editor
                key={tab}
                height="100%"
                language="yaml"
                value={valueOv}
                onChange={(ov) => setOvValue(ov ?? "")}
                options={{
                  minimap: { enabled: false },
                  fontSize: 14,
                  scrollBeyondLastLine: false,
                  wordWrap: "on",
                  automaticLayout: true,
                }}
              />
            )}
            {tab === "schema" && (
              <Editor
                key={tab}
                height="100%"
                language="yaml"
                value={value}
                onChange={(v) => setValue(v ?? "")}
                options={{
                  minimap: { enabled: false },
                  fontSize: 14,
                  scrollBeyondLastLine: false,
                  wordWrap: "on",
                  automaticLayout: true,
                }}
              />
            )}
          </div>
        </div>
      </div>
    );
  },
);

export default DatasetSchema;
