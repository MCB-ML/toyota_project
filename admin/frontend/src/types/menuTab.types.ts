export type EndUserTabId = "credentials" | "ad";

export interface MenuTab<T extends string = string> {
  id: T;
  label: string;
}

// User
export const endUserTabs: MenuTab<EndUserTabId>[] = [
  { id: "credentials", label: "Credentials User" },
  { id: "ad", label: "AD Users" },
] as const;

// Ai Agent
export type AiAgentTabId = "alphaFold" | "visionAi" | "ocr" | "vertex";

export const aiAgentTabs: MenuTab<AiAgentTabId>[] = [{ id: "ocr", label: "OCR" }] as const;
