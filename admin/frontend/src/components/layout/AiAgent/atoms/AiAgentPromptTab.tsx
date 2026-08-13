import { motion } from "framer-motion";
import YamlEditor from "@/components/reusable/YamlEditor";

type AiAgentPromptTabProps = {
  value: string;
  onChange: (value: string) => void;
};

const AiAgentPromptTab = ({ value, onChange }: AiAgentPromptTabProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3 }}
      className="space-y-4"
    >
      <div className="bg-white p-6 rounded-lg border border-[#e5e7eb] h-full">
        <YamlEditor value={value} onChange={onChange} />
      </div>
    </motion.div>
  );
};

export default AiAgentPromptTab;
