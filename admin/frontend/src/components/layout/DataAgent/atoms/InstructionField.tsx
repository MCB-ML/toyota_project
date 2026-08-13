import Editor from "@monaco-editor/react";
import yaml from "js-yaml";
import { Info } from "lucide-react";
import type React from "react";
import { useEffect, useRef, useState } from "react";
import { FaEye, FaTrash } from "react-icons/fa";
import { toast } from "sonner";

type instructionFieldProps = {
  id: string;
  label: string;
  value: string;
  fileName?: string;
  onChangeField: (text: string, fileName: string) => void;
  onRemoveField: (operation: number) => void;
  error?: boolean;
  errorMessage?: string;
  disabled?: boolean;
};

export const InstructionField = ({
  id,
  value,
  fileName,
  onChangeField,
  onRemoveField,
  error = false,
  errorMessage = "",
  disabled = false,
}: instructionFieldProps) => {
  const [valueYaml, setValueYaml] = useState("");
  const [localFileName, setLocalFileName] = useState("");
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setValueYaml(value ?? "");
  }, [value]);

  useEffect(() => {
    if (fileName) setLocalFileName(fileName);
  }, [fileName]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const text = await file.text();
    setValueYaml(text);
    setLocalFileName(file.name);

    onChangeField(text, file.name);
  };

  const handleDelete = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    setValueYaml("");
    setLocalFileName("");

    onChangeField("", "");
    onRemoveField(3);
  };

  const handleUpdate = () => {
    try {
      yaml.load(valueYaml);

      onChangeField(valueYaml, localFileName);

      setIsPreviewOpen(false);
    } catch {
      toast.error("Validation failed", {
        description: "Invalid YAML format. Please fix errors before updating.",
      });
    }
  };

  return (
    <div className="w-full">
      <div className="relative flex border-2 rounded-lg items-center w-full">
        <input
          ref={fileInputRef}
          id={id}
          type="file"
          accept=".yaml,.yml"
          disabled={disabled}
          onChange={handleFileUpload}
          className="hidden"
        />

        <button
          type="button"
          disabled={disabled}
          onClick={() => fileInputRef.current?.click()}
          className={`px-4 py-2 text-sm rounded-md border ${
            disabled
              ? "bg-gray-100 text-gray-400 cursor-not-allowed"
              : "bg-white text-[#1a73e8] hover:bg-[#F1F6FD]"
          }`}
        >
          Browse
        </button>

        <div className="flex w-[80%] items-center gap-3 px-3 justify-end">
          <span className="max-w-[150px] truncate text-xs text-[#757575]">{localFileName}</span>

          {valueYaml && (
            <>
              <button
                type="button"
                onClick={() => setIsPreviewOpen(true)}
                className="text-[#1a73e8]"
              >
                <FaEye size={14} />
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="text-[#E30018]"
                title="Remove"
              >
                <FaTrash size={14} />
              </button>
            </>
          )}
        </div>
      </div>

      {error && errorMessage && <p className="mt-1 text-[#E30018] text-xs">{errorMessage}</p>}

      {isPreviewOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={() => setIsPreviewOpen(false)}
        >
          <div
            className="bg-white rounded-xl p-4 w-[960px] h-[700px] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3 bg-[#F1F6FD] p-3 rounded-lg mb-2">
              <Info size={18} className="text-[#1a73e8]" />
              <div>
                <p className="font-medium">YAML Preview</p>
                <p className="text-xs text-gray-500">Changes apply only after clicking Update</p>
              </div>
            </div>

            <Editor
              width="800px"
              height="550px"
              language="yaml"
              value={valueYaml}
              onChange={(v) => setValueYaml(v ?? "")}
              options={{
                minimap: { enabled: false },
                fontSize: 14,
              }}
            />

            <div className="flex justify-end gap-3 mt-3">
              <button
                onClick={() => setIsPreviewOpen(false)}
                className="border px-4 py-2 rounded-md"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdate}
                className="bg-[#1a73e8] text-white px-4 py-2 rounded-md"
              >
                Update
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
