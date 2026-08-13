import type React from "react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import type {
  DialogConfirmationField,
  DialogFieldConfig,
  FormDialogProps,
} from "@/types/dialog.types";
import { AzureDeploymentList } from "./AzureDeploymentList";
import { AzureModelList } from "./AzureModelList";
import { FloatingCheckBox } from "./FloatingCheckBoxProps";
import FloatingInputField from "./FloatingInputField";
import FloatingSelectField from "./FloatingSelectField";
import { ImageInputField } from "./ImageInputField";
import LoadingPage from "./loadingPage";
import PhoneInputField from "./PhoneInputField";
import YamlEditor from "./YamlEditor";

const FormDialog = <T extends Record<string, any>>({
  open,
  onClose,
  onSubmit,
  title,
  submitButtonText = "Submit",
  fields,
  validationSchema,
  initialValues,
  confirmationTitle = "Confirm Addition",
  confirmationMessage = "Are you sure you want to add this item? Please review the information before confirming.",
  confirmationFields,
  showConfirmation = true,
  isLoading = false,
  tabContent,
  layOutSize = "max-h-[90vh] min-h-[500px]",
  layOutSizeConfirmation = "max-h-[90vh] min-h-[500px]",
  dispatch,
  dispatchKey,
  preventCloseOnOutsideClick,
}: FormDialogProps<T>) => {
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});
  const [showConfirmDialog, setShowConfirmDialog] = useState<boolean>(false);

  const normalizeValue = (value: unknown) => {
    return value;
  };
  const onToggleActive = (fieldName: keyof T) => (checked: boolean) => {
    dispatch?.({
      type: dispatchKey,
      field: fieldName,
      value: checked,
    });

    if (errors[fieldName]) {
      setErrors((prev) => ({ ...prev, [fieldName]: "" }));
    }
  };
  const handleValueChange = (fieldName: keyof T) => (value: string) => {
    dispatch?.({
      type: dispatchKey,
      field: fieldName,
      value: normalizeValue(value),
    });
    if (errors[fieldName]) {
      setErrors((prev) => ({ ...prev, [fieldName]: "" }));
    }
  };
  const handleFileChange = (fieldName: keyof T) => (file: File | null) => {
    dispatch?.({
      type: dispatchKey,
      field: fieldName,
      value: file,
    });
    if (errors[fieldName]) {
      setErrors((prev) => ({ ...prev, [fieldName]: "" }));
    }
  };

  const handleInputChange =
    (fieldName: keyof T) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      dispatch?.({
        type: dispatchKey,
        field: fieldName,
        value: normalizeValue(e.target.value),
      });
      if (errors[fieldName]) {
        setErrors((prev) => ({ ...prev, [fieldName]: "" }));
      }
    };

  const handleSelectChange = (fieldName: keyof T) => (value: string) => {
    dispatch?.({
      type: dispatchKey,
      field: fieldName,
      value: normalizeValue(value),
    });
    if (errors[fieldName]) {
      setErrors((prev) => ({ ...prev, [fieldName]: undefined }));
    }
  };
  const _handleCheckChange = (fieldName: keyof T) => (value: boolean) => {
    dispatch?.({
      type: dispatchKey,
      field: fieldName,
      value: normalizeValue(value),
    });
    if (errors[fieldName]) {
      setErrors((prev) => ({ ...prev, [fieldName]: undefined }));
    }
  };
  const handleSubmitForm = () => {
    const result = validationSchema.safeParse(initialValues);

    if (!result.success) {
      const fieldErrors: Partial<Record<keyof T, string>> = {};
      result.error.issues.forEach((issue) => {
        if (issue.path[0]) {
          fieldErrors[issue.path[0] as keyof T] = issue.message;
        }
      });

      toast.error("Validation failed", {
        description: `${result.error.issues[0].path} ${result.error.issues[0]?.message}`,
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
    onSubmit(initialValues);
    setShowConfirmDialog(false);
  };

  const handleCancelForm = () => {
    setErrors({});
    onClose();
    onClose();
  };

  const renderField = (field: DialogFieldConfig) => {
    const fieldName = field.name as keyof T;
    const error = errors[fieldName];
    const value = initialValues[fieldName];
    const show = field.show ? "" : "hidden";
    const gridColClass = tabContent?.useTab
      ? tabContent.selectedTabId === field.tabId
        ? field.gridSpan === 2
          ? "md:col-span-2"
          : "md:col-span-1"
        : "hidden"
      : field.gridSpan === 2
        ? "md:col-span-2"
        : "md:col-span-1";

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
            id={field.name}
            checked={value}
            onCheckedChange={(checked) => {
              dispatch?.({
                type: dispatchKey,
                field: fieldName,
                value: checked,
              });
            }}
            disabled={field.disabled}
          />
        </div>
      );
    }

    if (field.type === "select" && field.options) {
      return (
        <div key={field.name} className={`${gridColClass} ${show}`}>
          <FloatingSelectField
            id={field.name}
            label={field.label}
            value={value}
            onChange={handleSelectChange(fieldName)}
            options={field.options}
            placeholder={field.placeholder || `Select ${field.label.toLowerCase()}`}
            error={!!error}
            errorMessage={error}
          />
        </div>
      );
    }

    if (field.type === "phone" && field.countryCodeFieldName) {
      const countryCodeFieldName = field.countryCodeFieldName as keyof T;
      const countryCode = initialValues[countryCodeFieldName] as string;

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

    if (field.type === "azure-deployment") {
      return (
        <div key={field.name} className={gridColClass}>
          <AzureDeploymentList
            dispatch={dispatch}
            dispatchKey={dispatchKey ?? ""}
            model={field.data ?? []}
            label={field.label}
            fieldName={fieldName}
            value={value}
            onAction={field.onAction ?? (() => {})}
          />
        </div>
      );
    }
    if (field.type === "azure-model") {
      return (
        <div key={field.name} className={gridColClass}>
          <AzureModelList
            label={field.label}
            value={value}
            onChange={handleSelectChange(fieldName)}
          />
        </div>
      );
    }

    if (field.type === "yaml-editor")
      return (
        <div key={field.name} className={gridColClass}>
          <YamlEditor value={value} onChange={handleValueChange(fieldName)} />
        </div>
      );

    if (field.type === "image") {
      return (
        <div key={field.name} className={gridColClass}>
          <ImageInputField
            id={field.name}
            label={field.label}
            value={value}
            onChangeField={handleFileChange(fieldName)}
            error={!!error}
            errorMessage={error}
            deleteLogo={(): void => {
              throw new Error("Function not implemented.");
            }}
          />
        </div>
      );
    }
    if (field.type === "check") {
      return (
        <div key={field.name} className={gridColClass}>
          <FloatingCheckBox
            id={field.name}
            label={field.label}
            value={!!value}
            onChangeField={onToggleActive(fieldName)}
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
        />
      </div>
    );
  };

  // Auto generate confirmation fields from form data if not provided
  const displayConfirmationFields: DialogConfirmationField[] =
    confirmationFields ||
    fields.slice(0, 4).map((field) => ({
      name: field.name,
      label: field.label,
    }));

  return (
    <>
      {/* Main Form Dialog */}
      <Dialog open={open && !showConfirmDialog} onOpenChange={onClose}>
        <DialogContent
          className={` ${layOutSize}  max-w-3xl p-0 gap-0 overflow-visible flex flex-col`}
          preventCloseOnOutsideClick={preventCloseOnOutsideClick}
          aria-describedby={undefined}
        >
          <DialogHeader className="px-6 py-4 border-b border-[#e5e7eb]">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-xl font-semibold text-[#101828]">{title}</DialogTitle>
            </div>
          </DialogHeader>

          <LoadingPage isLoading={isLoading} />
          {tabContent?.useTab && tabContent.content}

          <div className="flex flex-col flex-1 overflow-hidden">
            <div className="px-6 py-4 overflow-y-auto overflow-x-visible flex-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{fields.map(renderField)}</div>
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
                disabled={isLoading}
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
          <DialogContent className={` ${layOutSizeConfirmation} max-w-md `}>
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold text-[#101828]">
                {confirmationTitle}
              </DialogTitle>
            </DialogHeader>

            <div className="py-4 max-h-[500px] overflow-y-scroll">
              <p className="text-sm text-[#6a7282]">{confirmationMessage}</p>
              <div className="mt-4 p-4 bg-[#f9fafb] rounded-lg space-y-2 ">
                {displayConfirmationFields.map((field) => {
                  const value = initialValues[field.name as keyof T];
                  const displayValue = field.format
                    ? field.format(value, initialValues)
                    : String(value || "");

                  return (
                    <div key={field.name} className="flex text-sm w-full">
                      <div className="text-[#6a7282] basis-50">{field.label}:</div>
                      <div className="font-medium text-[#101828] truncate  basis-100">
                        {displayValue}
                      </div>
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
              >
                Cancel
              </Button>
              <Button
                onClick={handleConfirmForm}
                className="w-full md:w-auto bg-[#1a73e8] hover:bg-[#1557b0] cursor-pointer"
                disabled={isLoading}
              >
                {isLoading ? "Submitting..." : "Confirm"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};

export default FormDialog;
