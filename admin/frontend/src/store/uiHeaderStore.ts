import type { ReactNode } from "react";
import { create } from "zustand";

export type DialogType =
  | "COMPANY_ADD"
  | "BRANCH_ADD"
  | "WORKSPACE_ADD"
  | "USER_ADD"
  | "POWERBI_ADD"
  | "DATA_AGENT_ADD"
  | "COPILOT_ADD"
  | "AI_AGENT_ADD"
  | null;

export interface HeaderActionConfig {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  icon?: ReactNode;
}

interface UiHeaderState {
  // Dialog State
  activeDialog: DialogType;
  dialogProps: Record<string, any>;
  openDialog: (type: DialogType, props?: Record<string, any>) => void;
  closeDialog: () => void;

  // Header Action State
  headerAction: HeaderActionConfig | null;
  setHeaderAction: (action: HeaderActionConfig | null) => void;
}

export const useUiHeaderStore = create<UiHeaderState>((set) => ({
  // Dialog
  activeDialog: null,
  dialogProps: {},
  openDialog: (type, props = {}) => set({ activeDialog: type, dialogProps: props }),
  closeDialog: () => set({ activeDialog: null, dialogProps: {} }),

  // Header Action
  headerAction: null,
  setHeaderAction: (action) => set({ headerAction: action }),
}));
