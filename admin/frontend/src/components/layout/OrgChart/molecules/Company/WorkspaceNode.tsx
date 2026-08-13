import { motion } from "framer-motion";
import { LayoutGrid } from "lucide-react";
import type { WorkspaceTreeData } from "@/types/orgChart.types";

type WorkspaceNodeProps = {
  workspace: WorkspaceTreeData;
  index: number;
};

const WorkspaceNode = ({ workspace, index }: WorkspaceNodeProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.1 + 0.4, duration: 0.3 }}
      className="relative"
    >
      <div className="bg-white rounded-lg px-3 py-2 border-l-4 border-[#51a2ff] border hover:shadow-xl transition-all duration-300 hover:scale-105">
        <div className="flex items-start gap-2">
          <div className="shrink-0 w-8 h-8 bg-[#2b7fff]/20 rounded-lg flex items-center justify-center">
            <LayoutGrid className="w-4 h-4 text-[#51a2ff]" />
          </div>
          <div className="flex-1 min-w-0">
            <h5 className="text-sm font-semibold truncate">{workspace.workspaceName}</h5>
            {workspace.workspaceDepartment && (
              <p className="text-xs text-muted-foreground mt-1">
                Department: {workspace.workspaceDepartment}
              </p>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default WorkspaceNode;
