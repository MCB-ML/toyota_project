import { AnimatePresence, motion } from "framer-motion";
import { Loader2, Search, X } from "lucide-react";
import type React from "react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useGetADUserList } from "@/services/api/usersAD/getADUserList";
import { useCreateADUser } from "@/services/api/usersAD/postCreateADUser";
import { languagesList } from "@/types/sidebar.types";
import { type ADUser, UserRoleOptions } from "@/types/user.types";
import type { CompanyInfoData } from "../../../../types/companyInfo.types";
import FloatingSelectField from "../../../reusable/FloatingSelectField";

type SelectedUser = ADUser & { role: string };

type UsersAddNewADProps = {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: { users: SelectedUser[] }) => void;
  companyList: CompanyInfoData[];

  companyId?: string;
  branchId?: string;
  workspaceId?: string;
};

const UsersAddNewAD = ({
  open,
  onClose,
  onSubmit,
  companyList,
  companyId,
  branchId,
  workspaceId,
}: UsersAddNewADProps) => {
  const [searchUser, setSearchUser] = useState<string>("");
  const [selectedDefaultCompany, setselectedDefaultCompany] = useState<string>("");
  const [selectedDefaultLanguage, setSelectedDefaultLanguage] = useState<string>("en");
  const [selectedUsers, setSelectedUsers] = useState<SelectedUser[]>([]);
  const [focusedIndex, setFocusedIndex] = useState<number>(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Data State
  const { data: adUserListResponse, isLoading } = useGetADUserList();
  const adUsers = adUserListResponse?.users || [];

  // Mutation
  const createADUserMutation = useCreateADUser();
  const isSubmitting = createADUserMutation.isPending;

  // Confirmation State
  const [showConfirmation, setShowConfirmation] = useState<boolean>(false);

  // Reset state when closed
  useEffect(() => {
    if (!open) {
      setSearchUser("");
      setSelectedUsers([]);
      setShowConfirmation(false);
      setSelectedDefaultLanguage("en");
    }
  }, [open]);

  const filteredUsers =
    searchUser === ""
      ? []
      : adUsers.filter(
          (user) =>
            (user.userName.toLowerCase().includes(searchUser.toLowerCase()) ||
              user.userEmail.toLowerCase().includes(searchUser.toLowerCase())) &&
            !selectedUsers.find((u) => u.userId === user.userId),
        );

  const handleSelectUser = (user: ADUser) => {
    // Default role 'user'
    setSelectedUsers([...selectedUsers, { ...user, role: "user" }]);
    setSearchUser("");
    inputRef.current?.focus();
  };

  const handleRemoveUser = (userId: string) => {
    setSelectedUsers(selectedUsers.filter((u) => u.userId !== userId));
  };

  const handleRoleChange = (userId: string, newRole: string) => {
    setSelectedUsers(selectedUsers.map((u) => (u.userId === userId ? { ...u, role: newRole } : u)));
  };

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

  useEffect(() => {
    setFocusedIndex(-1);

    if (companyId) setselectedDefaultCompany(companyId);
  }, []);

  const handleInitialSubmit = () => {
    if (selectedUsers.length === 0) return;

    // 워크스페이스 조건 제거: 사용자 구분 단위는 딜러사 하나뿐이다.
    if (!selectedDefaultCompany) {
      toast.error("Default Company 를 선택하세요");
      return;
    }

    setShowConfirmation(true);
  };

  const handleConfirm = async () => {
    try {
      let successCount = 0;
      const errors: string[] = [];

      // Create requests per user (with all selected workspaces)
      const promises = selectedUsers.map((user) =>
        createADUserMutation.mutateAsync({
          userId: user.userId,
          userName: user.userName,
          userEmail: user.userEmail,
          userRole: user.role,
          workspaceIds: [],
          userAccess: "full access",
          userDepartment: user.userDepartment,
          defaultCompany: selectedDefaultCompany,
          defaultLanguage: selectedDefaultLanguage,
          mode: "",
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
        onSubmit({ users: selectedUsers });
        onClose();
      }
    } catch (_error) {
      toast.error("Error", {
        description: "An unexpected error occurred during bulk add.",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={(_val) => !isSubmitting && onClose()}>
      {!showConfirmation ? (
        <DialogContent className="sm:max-w-[700px] p-0 gap-0 bg-white text-[#101828] shadow-lg flex flex-col h-[80vh]">
          <DialogHeader className="px-6 py-4 border-b border-[#e5e7eb]">
            <DialogTitle className="text-xl font-semibold">Add AD Based User</DialogTitle>
          </DialogHeader>

          <div className="p-6 flex-1 overflow-y-auto flex flex-col min-h-[400px]">
            {/* User Search */}
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
                            {user.userAvatar ? (
                              <AvatarImage
                                src={
                                  user.userAvatar.startsWith("data:")
                                    ? user.userAvatar
                                    : `data:image/jpeg;base64,${user.userAvatar}`
                                }
                              />
                            ) : null}
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
                            {user.userAvatar ? (
                              <AvatarImage
                                src={
                                  user.userAvatar.startsWith("data:")
                                    ? user.userAvatar
                                    : `data:image/jpeg;base64,${user.userAvatar}`
                                }
                              />
                            ) : null}
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
                              {/* 권한 목록은 UserRoleOptions 한 곳에서만 관리한다 */}
                              {UserRoleOptions.map((role) => (
                                <SelectItem key={role.value} value={role.value}>
                                  {role.label}
                                </SelectItem>
                              ))}
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
            <div className="flex flex-col items-center gap-y-3">
              <FloatingSelectField
                id="defaultCompany"
                label="Default Company"
                placeholder="Select Default Company"
                value={selectedDefaultCompany || ""}
                onChange={(value: string) => setselectedDefaultCompany(value)}
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
                value={selectedDefaultLanguage}
                onChange={(value: string) => setSelectedDefaultLanguage(value)}
                options={languagesList.map((lang) => ({
                  value: lang.code,
                  label: lang.label,
                }))}
              />
            </div>

            {/* 워크스페이스 선택 제거: 소속은 Default Company 하나로 정한다 */}
          </div>

          <DialogFooter className="px-6 py-4 border-t border-[#e5e7eb] bg-white gap-2 rounded-b-xl">
            <Button variant="outline" onClick={onClose} className="w-full md:w-auto cursor-pointer">
              Cancel
            </Button>
            <Button
              onClick={handleInitialSubmit}
              disabled={selectedUsers.length === 0 || !selectedDefaultCompany}
              className="w-full md:w-auto bg-[#1a73e8] hover:bg-[#1557b0] text-white cursor-pointer"
            >
              Add Users
            </Button>
          </DialogFooter>
        </DialogContent>
      ) : (
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-[#101828]">
              Confirm Addition
            </DialogTitle>
          </DialogHeader>

          <div className="py-4">
            <p className="text-sm text-[#6a7282]">
              Are you sure you want to add the following users?
            </p>
            <div className="mt-4 p-4 bg-[#f9fafb] rounded-lg space-y-2 max-h-[300px] overflow-y-auto">
              {/* 워크스페이스 요약 제거. 소속은 Default Company 하나로 정한다. */}
              {selectedUsers.map((user) => (
                <div
                  key={user.userId}
                  className="flex flex-col text-sm border-b border-gray-100 last:border-0 pb-2 mb-2"
                >
                  <div className="flex justify-between">
                    <span className="text-[#6a7282]">Name:</span>
                    <span className="font-medium text-[#101828]">{user.userName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#6a7282]">Email:</span>
                    <span className="font-medium text-[#101828]">{user.userEmail}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#6a7282]">Role:</span>
                    <span className="font-medium text-[#101828]">{user.role}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setShowConfirmation(false)}
              className="w-full md:w-auto cursor-pointer"
              disabled={isSubmitting}
            >
              Back
            </Button>
            <Button
              onClick={handleConfirm}
              className="w-full md:w-auto bg-[#1a73e8] hover:bg-[#1557b0] cursor-pointer"
              disabled={isSubmitting}
            >
              {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {isSubmitting ? "Adding..." : "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      )}
    </Dialog>
  );
};

export default UsersAddNewAD;
