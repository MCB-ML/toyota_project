import { Check, X } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
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
import { type User, UserRoleOptions } from "@/types/user.types";
import type { CompanyInfoData } from "../../../../types/companyInfo.types";
import { buildCompanyOptions } from "../companyOptions";

const usersSchema = z.object({
  userName: z.string().min(1, "User name is required"),
  userEmail: z.string().email("Invalid email address").min(1, "User email is required"),
  userRole: z.enum(["admin", "user", "viewer"]),
  userDepartment: z.string().min(1, "User department is required"),
  userChangePassword: z.string().optional(),
  confirmPassword: z.string().optional(),
  // 사용자는 딜러사 1곳에 소속된다. 워크스페이스 개념은 제거되었다.
  defaultCompany: z.string().min(1, "Default company is required"),
  defaultLanguage: z.string().optional(),
});

type UsersEditFormData = z.infer<typeof usersSchema>;

type UsersEditProps = {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: UsersEditFormData) => void;
  isLoading?: boolean;
  user: User | null;
  companyList: CompanyInfoData[];
};

const UsersEdit = ({ open, onClose, onSubmit, isLoading, user, companyList }: UsersEditProps) => {
  const [formData, setFormData] = useState<UsersEditFormData>({
    userName: "",
    userEmail: "",
    userRole: "user",
    userDepartment: "",
    defaultCompany: "",
    defaultLanguage: "",
    userChangePassword: "",
    confirmPassword: "",
  });

  useEffect(() => {
    if (user && open) {
      const role = user.userRole as UsersEditFormData["userRole"];

      setFormData({
        userName: user.userName,
        userEmail: user.userEmail,
        // 저장된 값이 3종에 없으면(구 데이터) user 로 떨어뜨린다
        userRole: UserRoleOptions.some((o) => o.value === role) ? role : "user",
        userDepartment: user.userDepartment || "",
        defaultCompany: user.defaultCompany || "",
        defaultLanguage: user.defaultLanguage || "en",
        // 비밀번호는 불러오지 않는다. 입력했을 때만 변경한다.
        userChangePassword: "",
        confirmPassword: "",
      });
    }
  }, [user, open]);

  const handleChange = (field: keyof UsersEditFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // 비밀번호는 비워두면 변경하지 않는다. 입력했을 때만 재확인을 요구한다.
  const changingPassword = (formData.userChangePassword ?? "") !== "";
  const bothFilled = changingPassword && (formData.confirmPassword ?? "") !== "";
  const passwordsMatch = formData.userChangePassword === formData.confirmPassword;
  const showMismatch = bothFilled && !passwordsMatch;
  const showMatch = bothFilled && passwordsMatch;
  const passwordTooShort = changingPassword && (formData.userChangePassword ?? "").length < 6;

  const isFormValid =
    formData.userName !== "" &&
    formData.userDepartment !== "" &&
    !!formData.defaultCompany &&
    (!changingPassword || (!passwordTooShort && passwordsMatch));

  const handleSubmit = () => {
    // 비밀번호를 바꾸지 않으면 아예 보내지 않는다.
    const { confirmPassword: _confirmPassword, ...rest } = formData;

    onSubmit(changingPassword ? rest : { ...rest, userChangePassword: undefined });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit User</DialogTitle>
        </DialogHeader>

        <div className="py-4 space-y-4">
          <FloatingInputField
            id="userName"
            label="User Name"
            value={formData.userName}
            onChange={(e) => handleChange("userName", e.target.value)}
          />

          <FloatingInputField
            id="userEmail"
            label="User Email"
            type="email"
            value={formData.userEmail}
            onChange={(e) => handleChange("userEmail", e.target.value)}
            disabled={true}
          />

          <div>
            <FloatingInputField
              id="userChangePassword"
              label="Change Password"
              type="password"
              value={formData.userChangePassword || ""}
              onChange={(e) => handleChange("userChangePassword", e.target.value)}
              error={passwordTooShort}
              errorMessage={passwordTooShort ? "Password must be at least 6 characters" : ""}
            />
            <p className="mt-1 text-xs text-[#8a94a0]">비워두면 비밀번호를 변경하지 않습니다</p>
          </div>

          {changingPassword && (
            <div>
              <FloatingInputField
                id="confirmPassword"
                label="Confirm Password"
                type="password"
                value={formData.confirmPassword || ""}
                onChange={(e) => handleChange("confirmPassword", e.target.value)}
                error={showMismatch}
                errorMessage=""
              />

              {showMismatch && (
                <p className="mt-1 flex items-center gap-1 text-xs text-[#E30018]">
                  <X size={13} /> 비밀번호가 일치하지 않습니다
                </p>
              )}
              {showMatch && (
                <p className="mt-1 flex items-center gap-1 text-xs text-[#12805c]">
                  <Check size={13} /> 비밀번호가 일치합니다
                </p>
              )}
            </div>
          )}

          <FloatingInputField
            id="userDepartment"
            label="User Department"
            value={formData.userDepartment}
            onChange={(e) => handleChange("userDepartment", e.target.value)}
          />

          <FloatingSelectField
            id="userRole"
            label="User Role"
            placeholder="Select User Role"
            value={formData.userRole}
            onChange={(value: string) => handleChange("userRole", value)}
            options={UserRoleOptions}
          />

          <FloatingSelectField
            id="defaultCompany"
            label="Default Company"
            placeholder="Select Default Company"
            value={formData.defaultCompany || ""}
            onChange={(value: string) => handleChange("defaultCompany", value)}
            // 이미 소속된 딜러사가 비활성이어도 현재 값은 유지할 수 있어야 한다
            options={buildCompanyOptions(companyList, user?.defaultCompany ?? undefined)}
            onDisabledSelect={(option) =>
              toast.error(`${option.label} 은(는) 비활성화된 회사입니다`, {
                description: "회사 정보 메뉴에서 활성화한 뒤 선택할 수 있습니다.",
              })
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

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            className="bg-[#1a73e8] hover:bg-[#1557b0] text-white"
            disabled={isLoading || !isFormValid}
          >
            {isLoading ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default UsersEdit;
