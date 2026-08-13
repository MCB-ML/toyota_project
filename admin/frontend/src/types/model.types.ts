/**
 * 모델 스펙 카탈로그 (전역).
 *
 * 접속 키는 여기 없다. 딜러사마다 키를 나눠도 청구서가 갈라지지 않으므로,
 * 에이전트 실행 역할 하나로 호출하고 사용량은 TokenUsage_log 로 집계한다.
 *
 * 구 AzureDeployment 를 개명한 것이다. 벤더 이름은 provider 값으로만 표현한다.
 */

export const MODEL_PROVIDERS = ["bedrock", "azure_openai", "openai", "vertex"] as const;
export type ModelProvider = (typeof MODEL_PROVIDERS)[number];

export const MODEL_KINDS = ["llm", "embedding"] as const;
export type ModelKind = (typeof MODEL_KINDS)[number];

export const REASONING_EFFORTS = ["minimal", "low", "medium", "high"] as const;

export interface ModelSpec {
  id?: string;
  displayName: string;
  provider: ModelProvider;
  modelKind: ModelKind;
  /** provider 별 호출 식별자. bedrock 예: anthropic.claude-sonnet-4-5-20250929-v1:0 */
  modelId: string;
  apiVersion?: string | null;
  maxToken?: number | null;
  /** 0.7 같은 소수를 담는다 */
  temperature?: number | null;
  topP?: number | null;
  topK?: number | null;
  reasoningEffort?: string | null;
  embeddingModel?: string | null;
  isActive?: boolean;
  createdAt?: string | null;
  updatedAt?: string | null;
}
