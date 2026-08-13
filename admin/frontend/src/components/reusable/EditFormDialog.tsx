import type React from "react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import type {
  AddNewFormDialogProps,
  DialogConfirmationField,
  DialogFieldConfig,
} from "@/types/dialog.types";
import FloatingInputField from "./FloatingInputField";
import FloatingSelectField from "./FloatingSelectField";
import PhoneInputField from "./PhoneInputField";

interface EditFormDialogProps<T extends Record<string, any>> extends AddNewFormDialogProps<T> {
  isFetching?: boolean;
}

const EditFormDialog = <T extends Record<string, any>>({
  open,
  onClose,
  onSubmit,
  title,
  submitButtonText = "Save Changes",
  fields,
  validationSchema,
  initialValues,
  confirmationTitle = "Confirm Changes",
  confirmationMessage = "Are you sure you want to save these changes?",
  confirmationFields,
  showConfirmation = true,
  isLoading = false,
  isFetching = false,
  preventCloseOnOutsideClick = false,
}: EditFormDialogProps<T>) => {
  const [formData, setFormData] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});
  const [showConfirmDialog, setShowConfirmDialog] = useState<boolean>(false);

  useEffect(() => {
    if (open) {
      // When opening, reset form data to the passed initialValues
      setFormData(initialValues);
      setErrors({});
      setShowConfirmDialog(false);
    } else {
      setShowConfirmDialog(false);
    }
  }, [open, initialValues]);

  const handleInputChange =
    (fieldName: keyof T) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setFormData((prev) => ({ ...prev, [fieldName]: e.target.value }));
      if (errors[fieldName]) {
        setErrors((prev) => ({ ...prev, [fieldName]: "" }));
      }
    };

  const handleSelectChange = (fieldName: keyof T) => (value: string) => {
    setFormData((prev) => ({ ...prev, [fieldName]: value }));
    if (errors[fieldName]) {
      setErrors((prev) => ({ ...prev, [fieldName]: undefined }));
    }
  };

  const handleSubmitForm = () => {
    const result = validationSchema.safeParse(formData);

    if (!result.success) {
      const fieldErrors: Partial<Record<keyof T, string>> = {};
      result.error.issues.forEach((issue) => {
        if (issue.path[0]) {
          fieldErrors[issue.path[0] as keyof T] = issue.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    if (showConfirmation) {
      setShowConfirmDialog(true);
    } else {
      handleConfirmForm();
    }
  };

  const handleConfirmForm = () => {
    onSubmit(formData);
  };

  const handleCancelForm = () => {
    setFormData(initialValues);
    setErrors({});
    onClose();
  };

  const renderField = (field: DialogFieldConfig) => {
    const fieldName = field.name as keyof T;
    const error = errors[fieldName];
    const value = formData[fieldName] as string;

    const gridColClass = field.gridSpan === 2 ? "md:col-span-2" : "md:col-span-1";

    if (field.type === "switch") {
      return (
        <div
          key={field.name}
          className={`${gridColClass} flex items-center justify-between p-4 bg-white rounded-lg border border-[#e5e7eb]`}
        >
          <div className="space-y-0.5">
            <Label className="text-base font-medium text-[#101828]">{field.label}</Label>
            {field.description && <div className="text-sm text-[#a4a4a4]">{field.description}</div>}
            {error && <p className="text-[#E30018] text-xs">{error}</p>}
          </div>
          <Switch
            checked={!!value}
            onCheckedChange={(checked) => {
              setFormData((prev) => ({ ...prev, [fieldName]: checked }));
            }}
            disabled={field.disabled}
          />
        </div>
      );
    }

    if (field.type === "select" && field.options) {
      return (
        <div key={field.name} className={gridColClass}>
          <FloatingSelectField
            id={field.name}
            label={field.label}
            value={value}
            onChange={handleSelectChange(fieldName)}
            options={field.options}
            placeholder={field.placeholder || `Select ${field.label.toLowerCase()}`}
            error={!!error}
            errorMessage={error}
            disabled={field.disabled}
          />
        </div>
      );
    }

    if (field.type === "phone" && field.countryCodeFieldName) {
      const countryCodeFieldName = field.countryCodeFieldName as keyof T;
      const countryCode = formData[countryCodeFieldName] as string;

      return (
        <div key={field.name} className={gridColClass}>
          <PhoneInputField
            id={field.name}
            label={field.label}
            value={value}
            countryCode={countryCode}
            onPhoneChange={handleInputChange(fieldName)}
            onCountryChange={handleSelectChange(countryCodeFieldName)}
            error={!!error}
            errorMessage={error}
          />
        </div>
      );
    }

    return (
      <div key={field.name} className={gridColClass}>
        <FloatingInputField
          id={field.name}
          label={field.label}
          value={value}
          type={field.type}
          onChange={handleInputChange(fieldName)}
          placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
          error={!!error}
          errorMessage={error}
          disabled={field.disabled}
        />
      </div>
    );
  };

  const displayConfirmationFields: DialogConfirmationField[] =
    confirmationFields ||
    fields.slice(0, 4).map((field) => ({
      name: field.name,
      label: field.label,
    }));

  return (
    <>
      <Dialog open={open && !showConfirmDialog} onOpenChange={onClose}>
        <DialogContent
          preventCloseOnOutsideClick={preventCloseOnOutsideClick}
          className="max-w-3xl max-h-[90vh] min-h-[500px] p-0 gap-0 overflow-visible flex flex-col"
        >
          <DialogHeader className="px-6 py-4 border-b border-[#e5e7eb]">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-xl font-semibold text-[#101828]">{title}</DialogTitle>
            </div>
          </DialogHeader>

          <div className="flex flex-col flex-1 overflow-hidden">
            <div className="px-6 py-4 overflow-y-auto overflow-x-visible flex-1">
              {isFetching ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {fields.map((field) => (
                      <div
                        key={field.name}
                        className={field.gridSpan === 2 ? "md:col-span-2" : "md:col-span-1"}
                      >
                        <Skeleton className="h-4 w-24 mb-2" />
                        <Skeleton className="h-10 w-full" />
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {fields.map(renderField)}
                </div>
              )}
            </div>

            <DialogFooter className="px-6 py-4 border-t border-[#e5e7eb] gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleCancelForm}
                className="w-full md:w-auto cursor-pointer"
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleSubmitForm}
                className="w-full md:w-auto bg-[#1a73e8] hover:bg-[#1557b0] cursor-pointer"
                disabled={isLoading || isFetching}
              >
                {submitButtonText}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog */}
      {showConfirmation && (
        <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
          <DialogContent
            preventCloseOnOutsideClick={preventCloseOnOutsideClick}
            className="max-w-md"
          >
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold text-[#101828]">
                {confirmationTitle}
              </DialogTitle>
            </DialogHeader>

            <div className="py-4">
              <p className="text-sm text-[#6a7282]">{confirmationMessage}</p>
              <div className="mt-4 p-4 bg-[#f9fafb] rounded-lg space-y-2">
                {displayConfirmationFields.map((field) => {
                  const value = formData[field.name as keyof T];
                  const displayValue = field.format
                    ? field.format(value, formData)
                    : String(value || "");

                  return (
                    <div key={field.name} className="flex justify-between text-sm">
                      <span className="text-[#6a7282]">{field.label}:</span>
                      <span className="font-medium text-[#101828] text-right break-all max-w-[60%]">
                        {displayValue}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                onClick={() => setShowConfirmDialog(false)}
                className="w-full md:w-auto cursor-pointer"
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleConfirmForm}
                className="w-full md:w-auto bg-[#1a73e8] hover:bg-[#1557b0] cursor-pointer"
                disabled={isLoading}
              >
                {isLoading ? "Saving..." : "Confirm"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};

export default EditFormDialog;
