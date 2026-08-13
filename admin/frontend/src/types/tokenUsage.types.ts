/**
 * 토큰 사용량.
 *
 * 딜러사마다 API 키를 발급하는 대신 호출 한 건씩 로그를 남기고 집계한다.
 * 키를 나눠도 청구서는 갈라지지 않고, 키 단위로는 "누가 어느 용도로 썼는지"를
 * 알 수 없다. 로그에는 사용자와 용도가 함께 남는다.
 */

/** 용도. 모델 배포 화면의 용도 구분과 같은 체계다. */
export const USAGE_AGENT_TYPES = ["main", "sql", "sql_2", "rag", "powerbi", "chart"] as const;
export type UsageAgentType = (typeof USAGE_AGENT_TYPES)[number];

export const AGENT_TYPE_LABELS: Record<string, string> = {
  main: "메인",
  sql: "Text2SQL",
  sql_2: "Text2SQL 보조",
  rag: "RAG",
  powerbi: "Power BI",
  chart: "차트",
};

export interface TokenUsageQuery {
  /** 없으면 전체 기간 */
  startDate?: string | null;
  endDate?: string | null;
  companyId?: string | null;
  agentType?: string | null;
  userEmail?: string | null;
}

export interface TokenUsageSummaryRow {
  companyId: string;
  companyName: string;
  requestCount: number;
  failedCount: number;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  avgLatencyMs?: number | null;
  lastUsedAt?: string | null;
}

/** 딜러사 안에서 이메일 한 개. 딜러사 행을 펼치면 이 목록이 나온다. */
export interface TokenUsageUserRow {
  companyId: string;
  userEmail: string;
  requestCount: number;
  failedCount: number;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  avgLatencyMs?: number | null;
  lastUsedAt?: string | null;
}

export interface TokenUsageDailyRow {
  usageDate: string;
  companyId: string;
  companyName: string;
  requestCount: number;
  totalTokens: number;
}

export interface TokenUsageSummary {
  rows: TokenUsageSummaryRow[];
  users: TokenUsageUserRow[];
  daily: TokenUsageDailyRow[];
  totalRequestCount: number;
  totalTokens: number;
}

export interface TokenUsageDetailRow {
  id: number;
  companyId: string;
  companyName?: string | null;
  userEmail?: string | null;
  agentType?: string | null;
  modelName?: string | null;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  latencyMs?: number | null;
  succeeded: boolean;
  errorMessage?: string | null;
  createdAt: string;
}

export interface TokenUsageDetail {
  logs: TokenUsageDetailRow[];
  total: number;
}

/** 조회 기간 프리셋. 화면에서 날짜를 직접 고르는 일이 드물다. */
export const PERIOD_PRESETS = [
  { key: "7d", label: "최근 7일", days: 7 },
  { key: "30d", label: "최근 30일", days: 30 },
  { key: "90d", label: "최근 90일", days: 90 },
  { key: "all", label: "전체", days: 0 },
] as const;

export type PeriodPresetKey = (typeof PERIOD_PRESETS)[number]["key"];

/** yyyy-MM-dd. toISOString 은 UTC 로 밀려 하루가 어긋날 수 있어 로컬 기준으로 만든다. */
export const toDateString = (d: Date) => {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

/** 프리셋 -> 실제 조회 기간. days 가 0 이면 기간 조건 없이 전체를 본다. */
export const presetToRange = (key: PeriodPresetKey): { startDate: string; endDate: string } => {
  const preset = PERIOD_PRESETS.find((p) => p.key === key);

  if (!preset || preset.days === 0) return { startDate: "", endDate: "" };

  const end = new Date();
  const start = new Date();
  // 오늘을 포함해 N 일이므로 N-1 만큼 뺀다
  start.setDate(start.getDate() - (preset.days - 1));

  return { startDate: toDateString(start), endDate: toDateString(end) };
};
