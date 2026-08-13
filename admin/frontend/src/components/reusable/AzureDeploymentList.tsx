import { Check, Edit, Trash2 } from "lucide-react";
import type { CompanyAzureDeploymentFormData } from "../../types/companyInfo.types";

type AzureDeploymenProps = {
  dispatch: any;
  dispatchKey: string;
  fieldName: any;
  model: CompanyAzureDeploymentFormData[];
  label: string;
  value: string;
  onAction: (data: CompanyAzureDeploymentFormData, mode: number, index: number) => void;
};

export function AzureDeploymentList({
  dispatch,
  dispatchKey,
  model,
  fieldName,
  value,
  onAction,
}: AzureDeploymenProps) {
  const chooseDefault = (index: number) => {
    const updatedList = model.map((item, i) => {
      if (i === index) {
        return {
          ...item,
          default: true,
        };
      }

      return {
        ...item,
        default: false,
      };
    });

    dispatch({
      type: dispatchKey,
      field: fieldName,
      value: updatedList,
    });
  };

  return (
    <div className="overflow-hidden rounded-xl border">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 text-gray-600">
          <tr>
            <th className="px-4 py-3 w-10"></th>
            <th className="px-4 py-3 text-left">Model</th>
            <th className="px-4 py-3 text-left">Endoint</th>
            <th className="px-4 py-3 text-left">
              {model[0]?.agentType === "rag" ? "Embedding" : "Azure Max Token"}
            </th>
            <th className="px-4 py-3 text-left">Version</th>
            <th className="px-4 py-3 text-left"></th>
            <th className="px-4 py-3 text-left"></th>
          </tr>
        </thead>

        <tbody>
          {model.map((m, index: number) => {
            const selected = m.default === true;

            return (
              <tr
                key={index}
                className={`cursor-pointer transition
                  ${selected ? "bg-blue-50" : "hover:bg-gray-50"}`}
              >
                <td className="px-4 py-3" onClick={() => chooseDefault(index)}>
                  <div
                    className={`w-4 h-4 rounded-full border flex items-center justify-center
                      ${selected ? "border-blue-600 bg-blue-600" : "border-gray-300"}`}
                  >
                    {selected && <Check size={12} className="text-white" />}
                  </div>
                </td>

                <td className="px-4 py-3 font-medium">{m.azureDeployment}</td>

                <td className="px-4 py-3 text-gray-600">{m.azureEndpoint}</td>

                <td className="px-4 py-3">
                  <span className="text-gray-600">
                    {model[0]?.agentType === "rag" ? m.azureEmbedding : m.azureMaxToken}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className="text-gray-600">{m.azureVersion}</span>
                </td>
                <td className="px-4 py-3 items-center">
                  <span
                    className="text-gray-600"
                    onClick={() => onAction(m, 1, index)}
                    title="Edit"
                  >
                    <Edit size={16} color="#1a73e8" />
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span
                    className="text-gray-600"
                    onClick={() => onAction(m, 2, index)}
                    title="Delete"
                  >
                    <Trash2 size={16} color="red" />
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
