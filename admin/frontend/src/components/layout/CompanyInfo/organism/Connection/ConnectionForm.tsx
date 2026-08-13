import fabric from "@/assets/image/dataset/fabric.png";
import rag from "@/assets/image/dataset/rag.png";
import sqlerver from "@/assets/image/dataset/sql-server.png";
import type { CompanyConnections } from "../../../../../types/companyInfo.types";
import FloatingInputField from "../../../../reusable/FloatingInputField";

interface ConnectionFormProps {
  tab: string;
  form: CompanyConnections;
  setForm: React.Dispatch<React.SetStateAction<CompanyConnections>>;
}

const ConnectionForm = ({ tab, form, setForm }: ConnectionFormProps) => {
  const baseFields: (keyof CompanyConnections)[] = ["endpoint", "database"];

  const fields: (keyof CompanyConnections)[] =
    tab === "sql" || tab === "fabric"
      ? [...baseFields, "user", "password"]
      : [...baseFields, "user", "password", "port"];

  const handleChange = (field: keyof CompanyConnections, value: string) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };
  const images = {
    sql: sqlerver,
    rag: rag,
    fabric: fabric,
  };
  const img = images[tab as keyof typeof images];
  return (
    <div className="flex items-center gap-4 px-5 w-full">
      <div className="w-1/3 flex justify-center items-center">
        <img src={img} className="w-24" alt="Fabric logo" />
      </div>

      <div className="w-2/3 px-6 py-6">
        <div className="flex flex-col gap-4 w-full border-l px-6 border-gray-300 h-103 items-center justify-center">
          {fields.map((field, index) => (
            <FloatingInputField
              key={field}
              id={`${field}-${index}`}
              label={
                field === "endpoint"
                  ? "Server Name"
                  : field.charAt(0).toUpperCase() + field.slice(1)
              }
              value={String(form[field] ?? "")}
              type={field === "password" ? "password" : "text"}
              onChange={(e) => handleChange(field, e.target.value)}
              placeholder={`Enter ${field}`}
              error={false}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default ConnectionForm;
