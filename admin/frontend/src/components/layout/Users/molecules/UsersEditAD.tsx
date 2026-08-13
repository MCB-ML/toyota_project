import { useEffect, useState } from "react";
import z from "zod";
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
import { type ADUser, UserRoleOptions } from "@/types/user.types";
import type { CompanyInfoData } from "../../../../types/companyInfo.types";

const usersADSchema = z.object({
  userRole: z.string().optional(),
  userDepartment: z.string().optional(),
  // 워크스페이스 제거: 소속은 defaultCompany 하나로 정한다
  defaultCompany: z.string().optional(),
  defaultLanguage: z.string().optional(),
});

type UsersEditADFormData = z.infer<typeof usersADSchema>;

type UsersEditADProps = {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: UsersEditADFormData) => void;
  isLoading?: boolean;
  user: ADUser | null;
  companyList: CompanyInfoData[];
};

const UsersEditAD = ({
  open,
  onClose,
  onSubmit,
  isLoading,
  user,
  companyList,
}: UsersEditADProps) => {
  const [formData, setFormData] = useState<UsersEditADFormData>({
    userRole: "",
    userDepartment: "",
    defaultCompany: "",
    defaultLanguage: "",
  });

  const [displayData, setDisplayData] = useState({
    userName: "",
    userEmail: "",
  });

  useEffect(() => {
    if (user && open) {
      setFormData({
        userRole: user.userRole || "",
        userDepartment: user.userDepartment || "",
        defaultCompany: user.defaultCompany || "",
        defaultLanguage: user.defaultLanguage || "en",
      });
      setDisplayData({
        userName: user.userName,
        userEmail: user.userEmail,
      });
    }
  }, [user, open]);

  const handleChange = (field: keyof UsersEditADFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit AD User</DialogTitle>
        </DialogHeader>

        <div className="py-4 space-y-4">
          <FloatingInputField
            id="userName"
            label="User Name"
            value={displayData.userName}
            onChange={() => {}} // Read-only
            disabled={true}
          />

          <FloatingInputField
            id="userEmail"
            label="User Email"
            type="email"
            value={displayData.userEmail}
            onChange={() => {}} // Read-only
            disabled={true}
          />

          <FloatingInputField
            id="userDepartment"
            label="User Department"
            value={formData.userDepartment || ""}
            onChange={(e) => handleChange("userDepartment", e.target.value)}
          />

          <FloatingSelectField
            id="userRole"
            label="User Role"
            value={formData.userRole || ""}
            onChange={(value: string) => handleChange("userRole", value)}
            options={UserRoleOptions}
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

          <div className="pt-2"></div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            onClick={() => onSubmit(formData)}
            className="bg-[#1a73e8] hover:bg-[#1557b0] text-white"
            disabled={isLoading}
          >
            {isLoading ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default UsersEditAD;
