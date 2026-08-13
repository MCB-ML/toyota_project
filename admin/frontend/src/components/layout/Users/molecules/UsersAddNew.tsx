import { Check, X } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import z from "zod";
import type { CompanyInfoData } from "../../../../types/companyInfo.types";
import { UserRoleOptions } from "../../../../types/user.types";
import { buildCompanyOptions } from "../companyOptions";

const usersSchema = z
  .object({
    userName: z.string().min(1, "User name is required"),
    userEmail: z.string().email("Invalid email address").min(1, "User email is required"),
    userPassword: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string().min(1, "Please confirm the password"),
    userDepartment: z.string().min(1, "User department is required"),
    userRole: z.enum(["admin", "user", "viewer"]),
    // 사용자는 딜러사 1곳에 소속된다. 워크스페이스 개념은 제거되었다.
    defaultCompany: z.string().min(1, "Default company is required"),
    defaultLanguage: z.string().optional(),
  })
  .refine((data) => data.userPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

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
    confirmPassword: "",
    userDepartment: "",
    userRole: "user",
    defaultCompany: "",
    defaultLanguage: "en",
  };

  const [formData, setFormData] = useState<UsersFormData>(defaultFormData);

  const handleChange = (field: keyof UsersFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
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
  }, []);
  const handleSubmit = () => {
    try {
      usersSchema.parse(formData);
      setErrors({});
      onSubmit(formData);
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

  // 두 칸을 모두 입력한 뒤에만 일치 여부를 알린다.
  // 입력 도중에 "불일치" 가 뜨면 정상 입력 중에도 오류처럼 보인다.
  const bothFilled = formData.userPassword !== "" && formData.confirmPassword !== "";
  const passwordsMatch = formData.userPassword === formData.confirmPassword;
  const showMismatch = bothFilled && !passwordsMatch;
  const showMatch = bothFilled && passwordsMatch;

  const isFormValid =
    formData.userName !== "" &&
    formData.userEmail !== "" &&
    formData.userPassword !== "" &&
    formData.confirmPassword !== "" &&
    formData.userPassword === formData.confirmPassword &&
    formData.userDepartment !== "" &&
    !!formData.defaultCompany;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New User</DialogTitle>
        </DialogHeader>

        <div className="py-4 space-y-4">
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
          <div>
            <FloatingInputField
              id="confirmPassword"
              label="Confirm Password"
              type="password"
              value={formData.confirmPassword}
              onChange={(e) => handleChange("confirmPassword", e.target.value)}
              error={showMismatch}
              errorMessage=""
            />

            {/* 두 칸을 모두 입력했을 때만 일치 여부를 알린다 */}
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

          <FloatingInputField
            id="userDepartment"
            label="User Department"
            value={formData.userDepartment}
            onChange={(e) => handleChange("userDepartment", e.target.value)}
            error={!!errors.userDepartment}
            errorMessage={errors.userDepartment}
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
            options={buildCompanyOptions(companyList)}
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

          {/*
            워크스페이스 선택 제거: 사용자 구분 단위는 딜러사(Default Company) 하나뿐이다.
          */}
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
            {isLoading ? "Adding..." : "Add User"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default UsersAddNew;
