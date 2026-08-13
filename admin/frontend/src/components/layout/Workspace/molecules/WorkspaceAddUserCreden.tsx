import { useEffect, useRef, useState } from "react";
import z from "zod";
import type { CompanyInfoData } from "../../../../types/companyInfo.types";

// Schema with array
const usersSchema = z.object({
  userName: z.string().min(1, "User name is required"),
  userEmail: z.string().email("Invalid email address").min(1, "User email is required"),
  userPassword: z.string().min(6, "Password must be at least 6 characters"),
  userDepartment: z.string().min(1, "User department is required"),
  workspaceIds: z.array(z.string()).min(1, "At least one workspace is required"),
  defaultCompany: z.string().optional(),
  defaultLanguage: z.string().optional(),
});
type SelectedUser = User & { role: string };
type UsersFormData = z.infer<typeof usersSchema>;

type UsersAddNewProps = {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: UsersFormData) => void;
  isLoading?: boolean;
  companyList: CompanyInfoData[];
  companyId?: string;
  branchId?: string;
  workspaceId?: string;
};

import { Avatar, AvatarFallback } from "@radix-ui/react-avatar";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2, Search, X } from "lucide-react";
import { toast } from "sonner";
import FloatingInputField from "@/components/reusable/FloatingInputField";
import FloatingSelectField from "@/components/reusable/FloatingSelectField";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { languagesList } from "@/types/sidebar.types";
import { cn } from "../../../../lib/utils";
import { useGetAllUsers } from "../../../../services/api/users/getAllUser";
import { useCreateUser } from "../../../../services/api/users/postCreateUser";
import type { User } from "../../../../types/user.types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../ui/select";
import UsersWorkspaceSelector from "../../Users/atoms/UsersWorkspaceSelector";

const UsersAddNew = ({
  open,
  onClose,
  onSubmit,
  isLoading,
  companyList,
  companyId,
  branchId,
  workspaceId,
}: UsersAddNewProps) => {
  const defaultFormData: UsersFormData = {
    userName: "",
    userEmail: "",
    userPassword: "",
    userDepartment: "",
    workspaceIds: [],
    defaultCompany: "",
    defaultLanguage: "en",
  };
  const [activeTab, setActiveTab] = useState<"new" | "existing">("new");
  const { data: usersData } = useGetAllUsers();
  const [searchUser, setSearchUser] = useState<string>("");
  const [selectedUsers, setSelectedUsers] = useState<SelectedUser[]>([]);
  const [focusedIndex, setFocusedIndex] = useState<number>(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const users = usersData?.users || [];
  const filteredUsers =
    searchUser === ""
      ? []
      : users.filter(
          (user) =>
            (user.userName.toLowerCase().includes(searchUser.toLowerCase()) ||
              user.userEmail.toLowerCase().includes(searchUser.toLowerCase())) &&
            !selectedUsers.find((u) => u.userId === user.userId),
        );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && searchUser === "" && selectedUsers.length > 0) {
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setFocusedIndex((prev) => Math.min(prev + 1, filteredUsers.length - 1));
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setFocusedIndex((prev) => Math.max(prev - 1, -1));
    }
    if (e.key === "Enter" && focusedIndex >= 0 && filteredUsers[focusedIndex]) {
      e.preventDefault();
      handleSelectUser(filteredUsers[focusedIndex]);
      setFocusedIndex(-1);
    }
  };

  const handleSelectUser = (user: User) => {
    // Default role 'user'
    setSelectedUsers([...selectedUsers, { ...user, role: "user" }]);
    setSearchUser("");
    inputRef.current?.focus();
  };
  const handleRoleChange = (userId: string, newRole: string) => {
    setSelectedUsers(selectedUsers.map((u) => (u.userId === userId ? { ...u, role: newRole } : u)));
  };
  const [formData, setFormData] = useState<UsersFormData>(defaultFormData);

  const handleChange = (field: keyof UsersFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };
  const handleRemoveUser = (userId: string) => {
    setSelectedUsers(selectedUsers.filter((u) => u.userId !== userId));
  };

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!open) {
      setFormData(defaultFormData);
      setErrors({});
    }
  }, [open]);
  useEffect(() => {
    if (companyId) handleChange("defaultCompany", companyId);
    if (workspaceId) handleChange("workspaceIds", [workspaceId]);
  }, []);

  const handleSubmit = async () => {
    try {
      if (activeTab === "new") {
        usersSchema.parse(formData);
        setErrors({});
        onSubmit(formData);
      }

      if (activeTab === "existing") await handleSubmitExisting();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        const fieldErrors = error.flatten().fieldErrors as Record<string, string[] | undefined>;
        Object.keys(fieldErrors).forEach((key) => {
          const messages = fieldErrors[key];
          if (messages && messages.length > 0) {
            newErrors[key] = messages[0];
          }
        });
        setErrors(newErrors);
      }
    }
  };

  const createUserMutation = useCreateUser();

  const handleSubmitExisting = async () => {
    try {
      let successCount = 0;
      const errors: string[] = [];

      // Create requests per user (with all selected workspaces)
      const promises = selectedUsers.map((user) =>
        createUserMutation.mutateAsync({
          userPassword: "dummy12345",
          userName: user.userName,
          userEmail: user.userEmail,
          userRole: user.role,
          workspaceIds: formData.workspaceIds,
          mode: "2",
        }),
      );

      const results = await Promise.allSettled(promises);

      results.forEach((result, index) => {
        if (result.status === "fulfilled") {
          successCount++;
        } else {
          const user = selectedUsers[index];
          console.error(`Failed to add ${user.userName}`, result.reason);
          errors.push(user.userName);
        }
      });

      if (errors.length > 0) {
        toast.error("Partial Success", {
          description: `Added ${successCount} users. Failed: ${errors.length}`,
        });
      } else {
        toast.success("Success", {
          description: `Successfully added ${successCount} users.`,
        });
        //  onSubmit({ users: selectedUsers, workspaceIds });
        onClose();
      }
    } catch (_error) {
      toast.error("Error", {
        description: "An unexpected error occurred during bulk add.",
      });
    }
  };
  const isFormValid =
    formData.userName !== "" &&
    formData.userEmail !== "" &&
    formData.userPassword !== "" &&
    formData.userDepartment !== "" &&
    formData.workspaceIds.length > 0;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add User Workspace</DialogTitle>
        </DialogHeader>

        <div className="py-4">
          {/* TAB HEADER */}
          <div className="flex mb-4 border-b border-gray-200">
            <button
              onClick={() => setActiveTab("new")}
              className={`px-4 py-2 text-sm font-medium transition-colors
        ${
          activeTab === "new"
            ? "border-b-2 border-[#1a73e8] text-[#1a73e8]"
            : "text-gray-500 hover:text-gray-700"
        }
      `}
            >
              Add New
            </button>

            <button
              onClick={() => setActiveTab("existing")}
              className={`px-4 py-2 text-sm font-medium transition-colors
        ${
          activeTab === "existing"
            ? "border-b-2 border-[#1a73e8] text-[#1a73e8]"
            : "text-gray-500 hover:text-gray-700"
        }
      `}
            >
              Add Existing
            </button>
          </div>

          {activeTab === "existing" && workspaceId && (
            <div className="mb-3">
              <div className="text-sm text-[#6a7282] mb-2 font-medium">Search by name or email</div>

              <div
                ref={containerRef}
                className="relative bg-white border border-[#d0d5dd] rounded-lg shadow-sm focus-within:border-[#1a73e8] focus-within:ring-1 focus-within:ring-[#1a73e8] transition-all duration-200"
              >
                <div className="flex flex-wrap items-center gap-1.5 p-2 min-h-[44px]">
                  <Search className="w-4 h-4 text-[#667085] ml-1 mr-1 shrink-0" />

                  <input
                    ref={inputRef}
                    value={searchUser}
                    onChange={(e) => setSearchUser(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Find user..."
                    disabled={isLoading}
                    className="flex-1 bg-transparent border-none outline-none text-sm text-[#101828] placeholder:text-[#98a2b3] min-w-[120px] h-7"
                  />
                  {isLoading && <Loader2 className="w-4 h-4 animate-spin text-gray-500" />}
                </div>

                {/* Search Results Dropdown */}
                {searchUser && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-[#d0d5dd] rounded-lg shadow-lg overflow-hidden z-50 max-h-[300px] overflow-y-auto">
                    {filteredUsers.length > 0 ? (
                      filteredUsers.map((user, index) => (
                        <div
                          key={user.userId}
                          onClick={() => handleSelectUser(user)}
                          className={cn(
                            "flex items-center gap-3 p-3 cursor-pointer transition-colors border-b border-[#f2f4f7] last:border-0",
                            index === focusedIndex ? "bg-[#f9fafb]" : "hover:bg-[#f9fafb]",
                          )}
                        >
                          <Avatar className="w-8 h-8">
                            <AvatarFallback className="bg-[#f2f4f7] text-[#475467]">
                              {user.userName.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-[#101828]">
                              {user.userName}
                            </span>
                            <span className="text-xs text-[#667085]">{user.userEmail}</span>
                          </div>
                          {user.userDepartment && (
                            <span className="ml-auto text-xs text-gray-500">
                              {user.userDepartment}
                            </span>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="p-4 text-center text-[#667085] text-sm">
                        No users found matching "{searchUser}"
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Selected List */}
              <div className="mt-4 flex flex-col min-h-0">
                {selectedUsers.length > 0 && (
                  <div className="text-xs font-semibold text-[#667085] uppercase tracking-wider mb-2 shrink-0">
                    Selected Users ({selectedUsers.length})
                  </div>
                )}
                <div className="overflow-y-auto max-h-[200px] pr-1 space-y-2">
                  <AnimatePresence initial={false}>
                    {selectedUsers.map((user) => (
                      <motion.div
                        key={user.userId}
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="flex items-center justify-between py-2 border-b border-[#f2f4f7] last:border-0"
                      >
                        <div className="flex items-center gap-3">
                          <Avatar className="w-8 h-8">
                            <AvatarFallback className="bg-[#f2f4f7] text-[#475467]">
                              {user.userName.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-[#101828]">
                              {user.userName}
                            </span>
                            <span className="text-xs text-[#667085]">{user.userEmail}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {/* Role Selector */}
                          <Select
                            value={user.role}
                            onValueChange={(val) => handleRoleChange(user.userId, val)}
                          >
                            <SelectTrigger className="w-[90px] h-8 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="user">User</SelectItem>
                              <SelectItem value="admin">Admin</SelectItem>
                            </SelectContent>
                          </Select>

                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-[#667085] hover:text-[#101828] hover:bg-[#f2f4f7]"
                            onClick={() => handleRemoveUser(user.userId)}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          )}

          {activeTab === "new" && (
            <div className="space-y-4">
              <FloatingInputField
                id="userName"
                label="User Name"
                value={formData.userName}
                onChange={(e) => handleChange("userName", e.target.value)}
                error={!!errors.userName}
                errorMessage={errors.userName}
              />
              <FloatingInputField
                id="userEmail"
                label="User Email"
                type="email"
                value={formData.userEmail}
                onChange={(e) => handleChange("userEmail", e.target.value)}
                error={!!errors.userEmail}
                errorMessage={errors.userEmail}
              />
              <FloatingInputField
                id="userPassword"
                label="User Password"
                type="password"
                value={formData.userPassword}
                onChange={(e) => handleChange("userPassword", e.target.value)}
                error={!!errors.userPassword}
                errorMessage={errors.userPassword}
              />
              <FloatingInputField
                id="userDepartment"
                label="User Department"
                value={formData.userDepartment}
                onChange={(e) => handleChange("userDepartment", e.target.value)}
                error={!!errors.userDepartment}
                errorMessage={errors.userDepartment}
              />

              <FloatingSelectField
                id="defaultCompany"
                label="Default Company"
                placeholder="Select Default Company"
                value={formData.defaultCompany || ""}
                onChange={(value: string) => handleChange("defaultCompany", value)}
                options={
                  companyList?.map((data: CompanyInfoData) => ({
                    value: data.companyId,
                    label: data.companyName,
                  })) || []
                }
              />

              <FloatingSelectField
                id="defaultLanguage"
                label="Default Language"
                placeholder="Select Default Language"
                value={formData.defaultLanguage || ""}
                onChange={(value: string) => handleChange("defaultLanguage", value)}
                options={languagesList.map((lang) => ({
                  value: lang.code,
                  label: lang.label,
                }))}
              />
            </div>
          )}
          <div className="pt-2">
            <UsersWorkspaceSelector
              selectedWorkspaceIds={formData.workspaceIds}
              onChange={(ids) => handleChange("workspaceIds", ids)}
              companyId={companyId}
              workspaceId={workspaceId}
              branchId={branchId}
              error={!!errors.workspaceIds}
              errorMessage={errors.workspaceIds}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            className="bg-[#1a73e8] hover:bg-[#1557b0] text-white"
            disabled={
              isLoading ||
              createUserMutation.isPending ||
              (activeTab === "existing" && selectedUsers.length === 0) ||
              (activeTab === "new" && !isFormValid)
            }
          >
            {isLoading || createUserMutation.isPending ? "Adding..." : "Add User"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default UsersAddNew;
