import { Check } from "lucide-react";

type Props = {
  label: string;
  value: string;
  onChange: (id: string) => void;
};
const models = [
  {
    id: "gpt-4",
    name: "GPT-4",
    capability: "High reasoning",
    latency: "Medium",
    status: "Stable",
  },
  {
    id: "gpt-4o",
    name: "GPT-4o",
    capability: "Fast, multimodal",
    latency: "Low",
    status: "Recommended",
  },
  {
    id: "gpt-5",
    name: "GPT-5",
    capability: "Next-gen reasoning",
    latency: "Low",
    status: "Preview",
  },
];

export function AzureModelList({ label, value, onChange }: Props) {
  return (
    <div className="overflow-hidden rounded-xl border">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 text-gray-600">
          <tr>
            <th className="px-4 py-3 w-10"></th>
            <th className="px-4 py-3 text-left">Model</th>
            <th className="px-4 py-3 text-left">Capability</th>
            <th className="px-4 py-3 text-left">Latency</th>
            <th className="px-4 py-3 text-left">Status</th>
          </tr>
        </thead>

        <tbody>
          {models.map((m) => {
            const selected = value === m.id;

            return (
              <tr
                key={m.id}
                onClick={() => onChange(m.id)}
                className={`cursor-pointer transition
                  ${selected ? "bg-blue-50" : "hover:bg-gray-50"}`}
              >
                <td className="px-4 py-3">
                  <div
                    className={`w-4 h-4 rounded-full border flex items-center justify-center
                      ${selected ? "border-blue-600 bg-blue-600" : "border-gray-300"}`}
                  >
                    {selected && <Check size={12} className="text-white" />}
                  </div>
                </td>

                <td className="px-4 py-3 font-medium">{m.name}</td>

                <td className="px-4 py-3 text-gray-600">{m.capability}</td>

                <td className="px-4 py-3">
                  <span className="text-gray-600">{m.latency}</span>
                </td>

                <td className="px-4 py-3">
                  <span
                    className={`text-xs px-2 py-1 rounded-full
                      ${
                        m.status === "Recommended"
                          ? "bg-green-100 text-green-700"
                          : m.status === "Preview"
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-gray-100 text-gray-700"
                      }`}
                  >
                    {m.status}
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
