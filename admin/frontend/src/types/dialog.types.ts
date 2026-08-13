import type { ZodSchema } from "zod";

export type DialogFieldType =
  | "text"
  | "textarea"
  | "select"
  | "password"
  | "email"
  | "number"
  | "check"
  | "azure-model"
  | "azure-deployment"
  | "yaml-editor"
  | "phone"
  | "phone"
  | "image"
  | "switch";

export interface DialogSelectOption {
  label: string;
  value: string;
}

export interface DialogFieldConfig {
  name: string;
  label: string;
  description?: string;
  type: DialogFieldType;
  placeholder?: string;
  options?: DialogSelectOption[];
  gridSpan?: 1 | 2;
  countryCodeFieldName?: string;
  tabId?: string;
  data?: any[];
  onAction?: (data: any, mode: number, index: number) => void;
  show?: boolean;
  disabled?: boolean;
}

export interface DialogConfirmationField {
  name: string;
  label: string;
  format?: (value: any, formData: any) => string;
}

export interface DialogTab {
  useTab: boolean;
  content: React.ReactNode;
  selectedTabId: string;
}

export interface AddNewFormDialogProps<T extends Record<string, any>> {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: T) => void;
  title: string;
  submitButtonText?: string;
  fields: DialogFieldConfig[];
  validationSchema: ZodSchema<T>;
  initialValues: T;
  confirmationTitle?: string;
  confirmationMessage?: string;
  confirmationFields?: DialogConfirmationField[];
  showConfirmation?: boolean;
  isLoading?: boolean;
  tabContent?: DialogTab;
  layOutSize?: string;
  preventCloseOnOutsideClick?: boolean;
}

export interface FormDialogProps<T extends Record<string, any>> extends AddNewFormDialogProps<T> {
  layOutSizeConfirmation?: string;
  state?: any;
  dispatch?: React.Dispatch<any>;
  dispatchKey?: string;
}
