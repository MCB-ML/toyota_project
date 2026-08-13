/**
 * 시스템 프롬프트는 전 딜러사 공용이다. (companyId 없음)
 *
 * 카테고리 3종이고 카테고리마다 yaml/md 파일을 여러 개 둘 수 있다.
 * 한 카테고리의 파일들을 어떻게 조합해 쓸지는 에이전트 백엔드가 결정한다.
 */

export const PROMPT_CATEGORIES = ["semantic", "ontology", "metrics"] as const;

export type PromptCategory = (typeof PROMPT_CATEGORIES)[number];

export type PromptFileType = "yaml" | "md";

export interface SystemPrompt {
  id: string;
  category: PromptCategory;
  name: string;
  fileName?: string | null;
  fileType: PromptFileType;
  value: string;
  isActive?: boolean;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface SystemPromptCreateRequest {
  category: PromptCategory;
  name: string;
  fileName?: string | null;
  fileType: PromptFileType;
  value: string;
}

export interface SystemPromptUpdateRequest {
  id: string;
  name?: string;
  fileName?: string | null;
  fileType?: PromptFileType;
  value?: string;
  isActive?: boolean;
}

/** 파일명에서 형식을 판별한다. 확장자가 없으면 yaml 로 본다. */
export const detectFileType = (fileName: string | null | undefined): PromptFileType =>
  (fileName ?? "").toLowerCase().endsWith(".md") ? "md" : "yaml";
