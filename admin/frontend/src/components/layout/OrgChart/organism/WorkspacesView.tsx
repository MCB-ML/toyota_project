import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import { useGetEndUserView } from "@/services/api/orgChart/getEndUserView";
import { useGetWorkspaceView } from "@/services/api/orgChart/getWorkspaceView";
import { WorkspaceCard } from "../atoms/WorkspaceCard";

const WorkspacesView = ({ searchQuery }: { searchQuery: string }) => {
  const { data: workspaceData, isLoading: isWorkspaceLoading } = useGetWorkspaceView();
  const { data: userData, isLoading: isUserLoading } = useGetEndUserView();

  const allWorkspaces = workspaceData?.workspaces || [];
  const allUsers = userData?.users || [];

  const filteredWorkspaces = allWorkspaces.filter(
    (ws) =>
      ws.workspaceName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ws.workspaceDepartment?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  if (isWorkspaceLoading || isUserLoading) {
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
                className="bg-white rounded-xl shadow-sm border border-[#f3f4f6] h-[300px] p-6 flex flex-col justify-between"
              >
                <div className="space-y-4">
                  <Skeleton className="w-12 h-12 rounded-lg" />
                  <div className="space-y-2">
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                </div>
                <div className="space-y-2 pt-4 border-t border-[#f3f4f6]">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
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
            <h1 className="text-2xl font-bold tracking-tight text-[#101828]">Workspaces</h1>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
          {filteredWorkspaces.length > 0 ? (
            filteredWorkspaces.map((ws, idx) => (
              <WorkspaceCard key={ws.id || idx} workspace={ws} allUsers={allUsers} />
            ))
          ) : (
            <div className="col-span-full flex flex-col items-center justify-center py-20 text-[#6a7282]">
              <p className="text-lg">No workspaces found matching "{searchQuery}"</p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default WorkspacesView;
