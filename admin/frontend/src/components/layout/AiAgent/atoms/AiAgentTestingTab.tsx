import { motion } from "framer-motion";
import { ChevronDown, ChevronRight, CloudUpload, X } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

type AiAgentTestingTabProps = {
  prompt_yaml: string;
  company_info_id: string;
  file: File | null;
  onFileChange: (file: File | null) => void;
  testResult: any;
  isTesting: boolean;
  onRunTest: () => void;
};

// Helper component to render parsed JSON results (Key value pair)
const ParsedResultRenderer = ({
  data,
  label,
  level = 0,
}: {
  data: any;
  label?: string;
  level?: number;
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const { t } = useTranslation();

  const isLeafNode =
    data &&
    typeof data === "object" &&
    "value" in data &&
    "confidence" in data &&
    Object.keys(data).length <= 2;

  if (isLeafNode) {
    return (
      <div className="flex items-center gap-2 py-1 text-sm">
        {label && <span className="text-[#4a5565] font-medium">{label}:</span>}
        <span className="text-[#101828]">
          {data.value === null ? (
            <span className="text-[#99a1af] italic">null</span>
          ) : (
            String(data.value)
          )}
        </span>
        {data.confidence !== undefined && (
          <span
            className={`text-xs px-1.5 py-0.5 rounded ${
              data.confidence > 80
                ? "bg-[#dcfce7] text-[#008236]"
                : data.confidence > 50
                  ? "bg-[#fef9c2] text-[#a65f00]"
                  : "bg-[#ffe2e2] text-[#c10007]"
            }`}
          >
            {data.confidence}%
          </span>
        )}
      </div>
    );
  }

  // Arrays
  if (Array.isArray(data)) {
    if (data.length === 0) {
      return (
        <div className="py-1 text-sm text-[#99a1af] italic">
          {label && <span className="font-medium text-[#4a5565]">{label}: </span>}
          {t("AiAgent.emptyList")}
        </div>
      );
    }
    return (
      <div className="ml-2">
        <div
          className="flex items-center gap-1 cursor-pointer py-1 hover:bg-[#f9fafb] rounded select-none"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? (
            <ChevronDown className="w-4 h-4 text-[#6a7282]" />
          ) : (
            <ChevronRight className="w-4 h-4 text-[#6a7282]" />
          )}
          {label && <span className="font-semibold text-[#364153]">{label}</span>}
          <span className="text-xs text-[#99a1af]">
            ({t("common.itemsWithCount", { count: data.length })})
          </span>
        </div>
        {isExpanded && (
          <div className="border-l border-[#e5e7eb] pl-3 mt-1 space-y-2">
            {data.map((item, idx) => (
              <ParsedResultRenderer
                key={idx}
                data={item}
                // If the array item is an object give index otherwise label
                label={typeof item !== "object" ? String(idx + 1) : undefined}
                level={level + 1}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  // Handle Objects
  if (typeof data === "object" && data !== null) {
    return (
      <div className="ml-2">
        {label && (
          <div
            className="flex items-center gap-1 cursor-pointer py-1 hover:bg-[#f9fafb] rounded select-none"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? (
              <ChevronDown className="w-4 h-4 text-[#6a7282]" />
            ) : (
              <ChevronRight className="w-4 h-4 text-[#6a7282]" />
            )}
            <span className="font-semibold text-[#364153]">{label}</span>
          </div>
        )}
        {isExpanded && (
          <div className={`border-l border-[#e5e7eb] pl-3 mt-1 ${label ? "" : ""}`}>
            {Object.entries(data).map(([key, value]) => (
              <ParsedResultRenderer key={key} data={value} label={key} level={level + 1} />
            ))}
          </div>
        )}
      </div>
    );
  }

  // Fallback for simple format
  return (
    <div className="flex items-center gap-2 py-1 text-sm ml-2">
      {label && <span className="text-[#4a5565] font-medium">{label}:</span>}
      <span className="text-[#101828]">{String(data)}</span>
    </div>
  );
};

const AiAgentTestingTab = ({
  prompt_yaml,
  file,
  onFileChange,
  testResult,
  isTesting,
  onRunTest,
}: AiAgentTestingTabProps) => {
  const { t } = useTranslation();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      onFileChange(e.target.files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (isTesting) return;
    if (e.dataTransfer.files?.[0]) {
      onFileChange(e.dataTransfer.files[0]);
    }
  };

  const clearFile = () => {
    if (isTesting) return;
    onFileChange(null);
  };

  // Parse output string if present or use as is if object
  let parsedOutput = null;
  if (testResult && testResult.output !== undefined && testResult.output !== null) {
    if (typeof testResult.output === "object") {
      parsedOutput = testResult.output;
    } else if (typeof testResult.output === "string") {
      try {
        parsedOutput = JSON.parse(testResult.output);
      } catch (e) {
        console.error("Failed to parse output JSON", e);
      }
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3 }}
      className="space-y-6 flex flex-col h-full"
    >
      <div className="flex gap-6 h-full min-h-0">
        {/* Left Side */}
        <div className="w-1/3 flex flex-col gap-4 overflow-y-auto">
          {!prompt_yaml?.trim() && (
            <div
              className="bg-[#fefce8] border border-[#fff085] text-[#a65f00] px-4 py-3 rounded relative text-sm mb-2"
              role="alert"
            >
              <strong className="font-bold">{t("AiAgent.warning")}: </strong>
              <span className="block sm:inline">{t("AiAgent.promptYamlEmpty")}</span>
            </div>
          )}

          <div
            className={`border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center text-center transition-colors ${
              file ? "border-[#1a73e8] bg-[#f0f9ff]" : "border-[#d1d5dc] hover:border-[#1a73e8]"
            } ${isTesting ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => !isTesting && document.getElementById("file-upload")?.click()}
          >
            <input
              id="file-upload"
              type="file"
              accept="image/jpeg,image/png,.pdf"
              className="hidden"
              onChange={handleFileChange}
              disabled={isTesting}
            />

            {file ? (
              <div className="relative w-full">
                <img
                  src={URL.createObjectURL(file)}
                  alt="Preview"
                  className="max-h-48 rounded mx-auto"
                />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    clearFile();
                  }}
                  disabled={isTesting}
                  className="absolute top-0 right-0 p-1 bg-[#fb2c36] text-white rounded-full hover:bg-[#e7000b] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <X className="w-4 h-4" />
                </button>
                <p className="mt-2 text-sm text-[#1a73e8] font-medium truncate">{file.name}</p>
              </div>
            ) : (
              <>
                <CloudUpload className="w-10 h-10 text-[#1a73e8] mb-2" />
                <p className="text-sm font-medium text-[#364153]">{t("AiAgent.clickToUpload")}</p>
                <p className="text-xs text-[#6a7282]">{t("AiAgent.jpgOrPng")}</p>
              </>
            )}
          </div>

          <Button
            onClick={onRunTest}
            disabled={!file || isTesting || !prompt_yaml?.trim()}
            className={`w-full ${
              !file || isTesting || !prompt_yaml?.trim()
                ? "bg-[#99a1af]"
                : "bg-[#1a73e8] hover:bg-[#1557b0]"
            } text-white`}
          >
            {isTesting ? t("AiAgent.testing") : t("AiAgent.testConfiguration")}
          </Button>
        </div>

        {/* Right Side */}
        <div className="w-2/3 flex flex-col gap-4 min-h-0">
          {/* Top Block */}
          <div className="bg-white border border-[#e5e7eb] rounded-lg flex flex-col flex-1 min-h-0">
            <h3 className="text-lg font-semibold px-4 py-3 text-[#101828] border-b border-[#f3f4f6] shrink-0">
              {t("AiAgent.testResults")}
            </h3>

            <div className="p-4 overflow-y-auto custom-scrollbar flex-1">
              {isTesting ? (
                <div className="space-y-4">
                  <div className="flex flex-col gap-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-4 w-5/6" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <Skeleton className="h-24 w-full rounded-md" />
                    <Skeleton className="h-24 w-full rounded-md" />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-4/5" />
                  </div>
                </div>
              ) : testResult ? (
                parsedOutput ? (
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold text-[#364153] mb-2 uppercase tracking-wide">
                      {t("AiAgent.extractedData")}
                    </h4>
                    <ParsedResultRenderer data={parsedOutput} />
                  </div>
                ) : (
                  <div className="text-[#6a7282] italic text-sm">
                    {testResult.output
                      ? `Output is not valid JSON string (Received type: ${typeof testResult.output})`
                      : "No output field in response"}
                  </div>
                )
              ) : (
                <div className="flex items-center justify-center h-full text-[#99a1af] text-sm">
                  Upload an image and run test to see results
                </div>
              )}
            </div>
          </div>

          {/* Bottom Block */}
          {(testResult || isTesting) && (
            <div className="bg-white border border-[#e5e7eb] rounded-lg p-4 shrink-0 max-h-64 flex flex-col">
              <h4 className="text-sm font-semibold text-[#364153] mb-2 uppercase tracking-wide shrink-0">
                {t("AiAgent.rawResponse")}
              </h4>
              {isTesting ? (
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              ) : (
                <pre className="bg-[#1e1e1e] text-[#d4d4d4] p-4 rounded-md text-xs overflow-auto font-mono scrollbar-thin scrollbar-thumb-[#4a5565] scrollbar-track-transparent flex-1">
                  {JSON.stringify(testResult, null, 2)}
                </pre>
              )}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default AiAgentTestingTab;
