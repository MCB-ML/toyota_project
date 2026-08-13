import { motion } from "framer-motion";
import { ChevronDown, ChevronUp, GitBranch } from "lucide-react";
import { useState } from "react";
import { GrLocationPin } from "react-icons/gr";
import type { BranchTreeData } from "@/types/orgChart.types";
import WorkspaceNode from "./WorkspaceNode";

type BranchNodeProps = {
  branch: BranchTreeData;
  index: number;
};

const BranchNode = ({ branch, index }: BranchNodeProps) => {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1 + 0.2, duration: 0.3 }}
      className="relative"
    >
      {/* Connection line to parent */}
      <div className="absolute -left-4 top-0 w-4 h-6 border-l border-b border-[#6cacff] rounded-bl-lg" />

      <div className="ml-4">
        <div
          className="bg-white rounded-lg px-3 py-2 border-l-4 border-[#00d492] border  hover:shadow-xl transition-all duration-300 cursor-pointer"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-start gap-2 flex-1 min-w-0">
              <div className="shrink-0 w-8 h-8 bg-[#00d492]/20 rounded-lg flex items-center justify-center">
                <GitBranch className="w-4 h-4 text-[#00d492]" />
              </div>
              <div className="flex flex-col md:flex-row md:items-center gap-1.5 md:gap-3 flex-1 min-w-0">
                <h4 className="text-sm font-bold truncate shrink-0">{branch.branchName}</h4>
                <div className="flex flex-wrap gap-1.5 text-xs text-muted-foreground items-center">
                  {branch.workspaces && branch.workspaces.length > 0 && (
                    <span className="bg-[#2b7fff]/10 text-[#51a2ff] px-1.5 py-0.5 rounded shrink-0">
                      {branch.workspaces.length} Workspace
                      {branch.workspaces.length !== 1 ? "s" : ""}
                    </span>
                  )}
                  {branch.branchLocation && (
                    <span className="bg-secondary px-1.5 py-0.5 rounded flex items-center gap-1 shrink-0">
                      <GrLocationPin className="w-3 h-3 text-[#fb2c36]" /> {branch.branchLocation}
                    </span>
                  )}
                  {branch.branchType && (
                    <span className="bg-secondary px-1.5 py-0.5 rounded shrink-0">
                      {branch.branchType}
                    </span>
                  )}
                </div>
              </div>
              {branch.workspaces && branch.workspaces.length > 0 && (
                <button className="shrink-0 text-muted-foreground hover:text-foreground transition-colors self-center">
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Workspaces */}
        {isExpanded && branch.workspaces && branch.workspaces.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="mt-3 ml-4 space-y-2 relative"
          >
            {/* Vertical connection line */}
            <div className="absolute -left-4 top-0 bottom-0 w-px bg-[#6cacff]" />

            {branch.workspaces.map((workspace, idx) => (
              <div key={workspace.id} className="relative">
                <div className="absolute -left-4 top-1/2 w-4 h-px bg-[#6cacff]" />
                <WorkspaceNode workspace={workspace} index={idx} />
              </div>
            ))}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

export default BranchNode;
