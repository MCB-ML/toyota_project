import { motion } from "framer-motion";
import { LayoutGrid, Users } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { EndUserItem, WorkspaceTreeData } from "@/types/orgChart.types";

export const WorkspaceCard = ({
  workspace,
  allUsers,
}: {
  workspace: WorkspaceTreeData;
  allUsers: EndUserItem[];
}) => {
  const users = allUsers.filter((u) => u.assignments?.some((a) => a.workspaceId === workspace.id));

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="bg-white rounded-2xl shadow-lg border border-[#f3f4f6] overflow-hidden flex flex-col h-[500px]"
    >
      {/* Workspace Info */}
      <div className="p-6 bg-linear-to-br from-[#eef2ff] to-white shrink-0 border-b border-[#f3f4f6]">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#4f39f6] flex items-center justify-center text-white shadow-[#c6d2ff] shadow-md shrink-0">
            <LayoutGrid className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-[#101828] leading-tight">
              {workspace.workspaceName}
            </h3>
            <p className="text-sm text-[#6a7282] mt-1">
              {workspace.workspaceDepartment} Department
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-[#e5e7eb]">
        {/* Users */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Users className="text-[#9ca3af] w-4 h-4" />
            <h4 className="text-sm font-semibold text-[#101828]">
              Users <span className="text-[#9ca3af] font-normal">({users.length})</span>
            </h4>
          </div>
          <div className="flex flex-wrap gap-2">
            {users.length > 0 ? (
              users.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center gap-2 pl-1 pr-3 py-1 rounded-full border border-[#e5e7eb] bg-[#f9fafb] text-[#364153] shadow-sm transition-hover hover:border-[#a3b3ff] hover:bg-white select-none"
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
                </div>
              ))
            ) : (
              <p className="text-sm text-[#99a1af] italic">No users assigned to this workspace.</p>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};
