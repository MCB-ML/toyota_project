import { AnimatePresence, motion } from "framer-motion";
import { LoaderCircle, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useGetWorkspaceUserAccess } from "../../../../services/api/workspace/getWorkspaceUserAccess";
import type { WorkspaceData, WorkspaceUserAccessList } from "../../../../types/workspace.types";
import Button from "../../../reusable/Button";

type WorkspaceUserAccessListProps = {
  workspaceUserAccess: {
    show: boolean;
    workspace: WorkspaceData;
  };
  onClose: () => void;
  onAddUser: (form: string) => void;
  onCloseAddUser: boolean;
};

const WorkspaceUserAccessListDialog = ({
  workspaceUserAccess,
  onClose,
  onAddUser,
  onCloseAddUser,
}: WorkspaceUserAccessListProps) => {
  const { show, workspace } = workspaceUserAccess;

  const { data, isLoading, refetch } = useGetWorkspaceUserAccess(
    show ? workspace.workspaceId : null,
  );

  const [search, setSearch] = useState("");

  const filteredData = useMemo(() => {
    if (!data) return [];

    const q = search.toLowerCase().trim();
    if (!q) return data;

    return data.filter(
      (user) => user.name?.toLowerCase().includes(q) || user.email?.toLowerCase().includes(q),
    );
  }, [data, search]);

  useEffect(() => {
    setSearch("");
  }, [workspace.workspaceId]);

  useEffect(() => {
    console.log("onCloseAddUser", onCloseAddUser);
    if (!onCloseAddUser) refetch();
  }, [onCloseAddUser]);

  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!show) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ x: "100%", opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: "100%", opacity: 0 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
      >
        <div className=" relative bg-white rounded-xl shadow-xl p-6 z-10 max-w-352 w-100 flex flex-col h-[calc(100vh-6rem)] md:h-[calc(100vh-7.5rem)] lg:h-[calc(100vh-5.5rem)]">
          <div className="flex justify-between items-start mb-4">
            <div className="space-y-1">
              <h2 className="text-md font-semibold text-gray-900 flex items-center gap-2">
                {workspace.workspaceName}
                <span className="text-gray-400 font-normal">User Access</span>
              </h2>

              {!isLoading && (
                <div className="flex items-center h-4 gap-2">
                  <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">
                    {filteredData.length} users
                  </span>
                  <div className="relative inline-block" ref={menuRef}>
                    <Button className="h-4 text-xs" onClick={() => setOpen(!open)}>
                      Add User
                    </Button>

                    {open && (
                      <div className="absolute left-0 mt-1 flex flex-col gap-1 bg-white border rounded shadow-md p-2 z-20 w-35">
                        <div
                          className="text-xs w-full border-b pb-2 text-gray-500 hover:text-[#155dfc] cursor-pointer"
                          onClick={() => {
                            onAddUser("credentials");
                            setOpen(false);
                          }}
                        >
                          Add User Credential
                        </div>

                        <div
                          className=" text-xs w-full text-gray-500 hover:text-[#155dfc] cursor-pointer"
                          onClick={() => {
                            onAddUser("ad");
                            setOpen(false);
                          }}
                        >
                          Add User AD
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={() => {
                setSearch("");
                onClose();
              }}
              aria-label="Close"
              className="rounded-md p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition"
            >
              <X size={18} />
            </button>
          </div>

          {!isLoading && data && data.length > 0 && (
            <div className="mb-3">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search name or email..."
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm
                       focus:outline-none focus:ring-2 focus:ring-gray-400"
              />
            </div>
          )}

          {isLoading && <LoaderCircle className="animate-spin m-auto" />}

          {!isLoading && filteredData.length === 0 && (
            <p className="text-gray-500">
              {search ? "No matching users found" : "No access found"}
            </p>
          )}

          {!isLoading && filteredData.length > 0 && (
            <div className="border rounded-lg overflow-hidden flex-1 min-h-0">
              <div className="overflow-y-auto overflow-x-hidden h-full">
                <table className="w-full text-xs  overflow-hidden">
                  <thead className="bg-gray-100 sticky top-0 z-10">
                    <tr>
                      <th className="text-left px-3 py-2 w-10">#</th>
                      <th className="text-left px-3 py-2">Name</th>

                      <th className="text-left px-3 py-2">Source</th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredData.map((user: WorkspaceUserAccessList, index: number) => (
                      <tr key={user.userId} className="border-t">
                        <td className="px-3 py-2 text-gray-500">{index + 1}</td>
                        <td className="px-3 py-2">
                          <div className="font-medium">{user.name}</div>
                          <div className="text-xs text-gray-500">{user.email}</div>
                        </td>

                        <td className="px-3 py-2">
                          {user.source === "local" ? "User Credential" : "User AD"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default WorkspaceUserAccessListDialog;
