import { z } from "zod";

const optionalNumber = z.preprocess((val) => {
  if (val === "" || val === null || val === undefined) return undefined;
  const num = Number(val);
  return Number.isNaN(num) ? undefined : num;
}, z.number().min(0).optional());

/**
 * 모델 스펙 검증.
 *
 * endpoint / apiKey 는 여기서 빠졌다 — 딜러사별 접속 키로 분리했기 때문이다.
 */
export const ModelDeploymentField = z.object({
  displayName: z.string().min(1, "표시 이름을 입력하세요"),
  provider: z.enum(["bedrock", "azure_openai", "openai", "vertex"]),
  modelKind: z.enum(["llm", "embedding"]),
  modelId: z.string().min(3, "모델 식별자를 입력하세요"),
  apiVersion: z.string().optional().nullable(),
  maxToken: optionalNumber,
  // 0.7 같은 소수를 허용해야 한다
  temperature: optionalNumber,
  topP: optionalNumber,
  topK: optionalNumber,
});
