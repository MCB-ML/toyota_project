import Editor from "@monaco-editor/react";
import { Info, Upload } from "lucide-react";

type Props = {
  value: string;
  onChange: (value: string) => void;
};

export default function YamlEditor({ value, onChange }: Props) {
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".yml") && !file.name.endsWith(".yaml")) {
      alert("Only YAML files (.yml, .yaml) are supported");
      e.target.value = "";
      return;
    }

    file.text().then((text) => {
      onChange(text);
      e.target.value = "";
    });
  };

  return (
    <div className="max-h-[600px] h-[600px] overflow-hidden flex flex-col gap-2 pb-5">
      <div className="flex items-center justify-between">
        <div className="flex flex-col">
          <span className="text-sm font-medium"></span>
          <span className="text-xs text-gray-500 flex items-center gap-1">
            <Info size={12} />
            Edit YAML directly or upload a <code>.yml</code> / <code>.yaml</code> file
          </span>
        </div>

        <label
          className="cursor-pointer p-2 rounded-md hover:bg-gray-100 transition"
          title="Upload YAML file (.yml, .yaml only)"
        >
          <Upload size={18} />
          <input type="file" accept=".yml,.yaml" className="hidden" onChange={handleFileUpload} />
        </label>
      </div>

      <Editor
        height="100%"
        defaultLanguage="yaml"
        value={value}
        onChange={(val) => onChange(val ?? "")}
        options={{
          minimap: { enabled: false },
          fontSize: 14,
          scrollBeyondLastLine: false,
        }}
      />
    </div>
  );
}
