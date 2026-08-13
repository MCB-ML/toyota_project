import { AnimatePresence, motion } from "framer-motion";
import { GitBranch, LayoutGrid, Users } from "lucide-react";
import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { BranchTreeData, EndUserItem } from "@/types/orgChart.types";

export const BranchCard = ({
  branch,
  allUsers,
}: {
  branch: BranchTreeData;
  allUsers: EndUserItem[];
}) => {
  const users = allUsers.filter((u) => u.assignments?.some((a) => a.branchId === branch.id));
  const workspaces = branch.workspaces || [];

  const [activeFilter, setActiveFilter] = useState<{
    type: "workspace" | "user";
    id: string | number;
  } | null>(null);

  // Filter Logic
  const filteredUsers =
    activeFilter?.type === "workspace"
      ? users.filter((u) => u.assignments.some((a) => a.workspaceId === activeFilter.id))
      : users;

  const getWorkspaceHighlight = (wsId: string) => {
    if (activeFilter?.type === "user") {
      const selectedUser = users.find((u) => u.id === activeFilter.id);
      return selectedUser?.assignments.some((a) => a.workspaceId === wsId);
    }
    return activeFilter?.type === "workspace" && activeFilter.id === wsId;
  };

  const handleWorkspaceClick = (wsId: string) => {
    if (activeFilter?.type === "workspace" && activeFilter.id === wsId) {
      setActiveFilter(null);
    } else {
      setActiveFilter({ type: "workspace", id: wsId });
    }
  };

  const handleUserClick = (userId: number) => {
    if (activeFilter?.type === "user" && activeFilter.id === userId) {
      setActiveFilter(null);
    } else {
      setActiveFilter({ type: "user", id: userId });
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="bg-white rounded-2xl shadow-lg border border-[#f3f4f6] overflow-hidden flex flex-col h-[500px]"
    >
      {/* Branch Info */}
      <div className="p-6 bg-linear-to-br from-[#eff6ff] to-white shrink-0 border-b border-[#f3f4f6]">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#155dfc] flex items-center justify-center text-white shadow-[#bedbff] shadow-md shrink-0">
            <GitBranch className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-[#101828] leading-tight">{branch.branchName}</h3>
            <p className="text-sm text-[#6a7282] mt-1">{branch.branchLocation}</p>
            {branch.branchType && (
              <span className="inline-block mt-2 text-xs font-semibold px-2 py-0.5 rounded bg-[#dbeafe] text-[#1447e6]">
                {branch.branchType}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-[#e5e7eb]">
        {/* Workspaces */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <LayoutGrid className="text-[#9ca3af] w-4 h-4" />
            <h4 className="text-sm font-semibold text-[#101828]">
              Workspaces <span className="text-[#9ca3af] font-normal">({workspaces.length})</span>
            </h4>
          </div>
          <div className="flex flex-wrap gap-2">
            {workspaces.map((ws) => {
              const isActive = getWorkspaceHighlight(ws.id);
              return (
                <button
                  key={ws.id}
                  onClick={() => handleWorkspaceClick(ws.id)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 border ${
                    isActive
                      ? "bg-[#155dfc] text-white border-[#155dfc] shadow-md"
                      : "bg-[#f9fafb] text-[#4a5565] border-[#e5e7eb] hover:bg-[#f3f4f6] cursor-pointer"
                  }`}
                >
                  {ws.workspaceName}
                </button>
              );
            })}
            {workspaces.length === 0 && (
              <span className="text-xs text-[#99a1af]">No workspaces</span>
            )}
          </div>
        </div>

        {/* Users */}
        <div>
          <div className="flex justify-between items-center mb-3">
            <div className="flex items-center gap-2 mb-3">
              <Users className="text-[#9ca3af] w-4 h-4" />
              <h4 className="text-sm font-semibold text-[#101828]">
                Users <span className="text-[#9ca3af] font-normal">({users.length})</span>
              </h4>
            </div>
            {activeFilter && (
              <button
                onClick={() => setActiveFilter(null)}
                className="text-xs text-[#155dfc] hover:underline cursor-pointer"
              >
                Reset Filter
              </button>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            <AnimatePresence mode="popLayout">
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user) => {
                  const isSelected = activeFilter?.type === "user" && activeFilter.id === user.id;
                  return (
                    <motion.div
                      layout
                      key={user.id}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{ duration: 0.2 }}
                    >
                      <button
                        onClick={() => handleUserClick(user.id)}
                        className={`flex items-center gap-2 pl-1 pr-3 py-1 rounded-full border transition-all duration-200 ${
                          isSelected
                            ? "bg-[#4f39f6] text-white border-[#4f39f6] shadow-md ring-2 ring-[#c6d2ff]"
                            : "bg-white text-[#364153] border-[#e5e7eb] hover:border-[#a3b3ff] hover:shadow-sm cursor-pointer"
                        }`}
                      >
                        <Avatar className="w-6 h-6">
                          {user.userAvatar && (
                            <AvatarImage
                              src={
                                user.userAvatar.startsWith("data:")
                                  ? user.userAvatar
                                  : `data:image/jpeg;base64,${user.userAvatar}`
                              }
                              alt={user.name}
                            />
                          )}
                          <AvatarFallback className="text-[10px] bg-[#f3f4f6] text-[#111827]">
                            {user.username.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-xs font-medium">{user.name}</span>
                      </button>
                    </motion.div>
                  );
                })
              ) : (
                <motion.div
                  key="empty-state"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-sm text-[#99a1af] italic w-full text-center py-4"
                >
                  No users found in this filter.
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
