import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import { useGetBranchView } from "@/services/api/orgChart/getBranchView";
import { useGetEndUserView } from "@/services/api/orgChart/getEndUserView";
import { BranchCard } from "../atoms/BranchCard";

const BranchesView = ({ searchQuery }: { searchQuery: string }) => {
  const { data: branchData, isLoading: isBranchLoading } = useGetBranchView();
  const { data: userData, isLoading: isUserLoading } = useGetEndUserView();

  const allBranches = branchData?.branches || [];
  const allUsers = userData?.users || [];

  const filteredBranches = allBranches.filter(
    (branch) =>
      branch.branchName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      branch.branchLocation?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  if (isBranchLoading || isUserLoading) {
    return (
      <div className="w-full h-full p-6 pt-0 md:pt-6 relative">
        <div className="max-w-[1600px] mx-auto">
          <div className="mb-8 space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div
                key={i}
                className="bg-white rounded-xl shadow-sm border border-[#f3f4f6] h-[300px] overflow-hidden flex flex-col"
              >
                <div className="p-6 border-b border-[#f3f4f6] space-y-3">
                  <div className="flex justify-between items-start">
                    <Skeleton className="w-12 h-12 rounded-lg" />
                    <Skeleton className="w-16 h-6 rounded-full" />
                  </div>
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
                <div className="p-6 flex-1 space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="w-full h-full p-6 pt-0 md:pt-6 relative"
    >
      <div className="max-w-[1600px] mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-5 gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[#101828]">Branches</h1>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
          {filteredBranches.length > 0 ? (
            filteredBranches.map((branch, idx) => (
              <BranchCard key={branch.id || idx} branch={branch} allUsers={allUsers} />
            ))
          ) : (
            <div className="col-span-full flex flex-col items-center justify-center py-20 text-[#6a7282]">
              <p className="text-lg">No branches found matching "{searchQuery}"</p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default BranchesView;
