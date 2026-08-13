import { motion } from "framer-motion";
import { Building2, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { BsFillBuildingsFill } from "react-icons/bs";
import type { CompanyTreeData } from "@/types/orgChart.types";
import BranchNode from "./BranchNode";

type CompanyTreeProps = {
  company: CompanyTreeData;
};

const CompanyTree = ({ company }: CompanyTreeProps) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(true);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="w-full"
    >
      <div
        className="bg-white rounded-xl px-4 py-3 border-l-4 border-[#ad46ff] border hover:shadow-2xl transition-all duration-300 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className="shrink-0 w-9 h-9 bg-[#6cacff]/20 rounded-xl flex items-center justify-center">
              <Building2 className="w-5 h-5 text-[#c27aff]" />
            </div>
            <div className="flex flex-col md:flex-row md:items-center gap-1.5 md:gap-3 flex-1 min-w-0">
              <h3 className="text-lg font-bold truncate shrink-0">{company.companyName}</h3>
              <div className="flex flex-wrap gap-1.5 text-xs items-center">
                {/* 업종/주소 컬럼 제거됨. 딜러사 설명으로 대체. */}
                {company.description && (
                  <span className="bg-secondary px-2 py-0.5 rounded-full text-muted-foreground flex items-center gap-1 shrink-0">
                    <BsFillBuildingsFill className="w-3 h-3 text-[#ad46ff]" /> {company.description}
                  </span>
                )}

                {company.branches && company.branches.length > 0 && (
                  <span className="bg-[#00d492]/10 text-[#00d492] px-2 py-0.5 rounded-full font-semibold shrink-0">
                    {company.branches.length} Branch
                    {company.branches.length !== 1 ? "es" : ""}
                  </span>
                )}
              </div>
            </div>
          </div>
          {company.branches && company.branches.length > 0 && (
            <button className="shrink-0 text-muted-foreground hover:text-foreground transition-colors self-center">
              {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>
          )}
        </div>
      </div>

      {/* Branches */}
      {isExpanded && company.branches && company.branches.length > 0 && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.3 }}
          className="mt-4 ml-4 space-y-4 relative"
        >
          {/* Vertical connection line */}
          <div className="absolute left-0 top-0 bottom-4 w-px bg-[#6cacff]" />

          {company.branches.map((branch, index) => (
            <BranchNode key={branch.id} branch={branch} index={index} />
          ))}
        </motion.div>
      )}
    </motion.div>
  );
};

export default CompanyTree;
