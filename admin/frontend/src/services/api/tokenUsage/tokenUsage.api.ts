import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import envLoader from "@/utils/envLoader";
import type { IFetchApiRFesultContent } from "../../../types/apiResponse";
import type {
  TokenUsageDetail,
  TokenUsageQuery,
  TokenUsageSummary,
} from "../../../types/tokenUsage.types";

const USAGE_BASE = `${envLoader.BASE_OS_API_URL}/api/v1/tokenUsage`;

/**
 * 조회인데 POST 인 이유: 기간·딜러사·용도가 함께 오는 조건 묶음이라
 * 쿼리스트링에 늘어놓는 것보다 본문 스키마로 보내는 편이 서버에서 검증이 붙는다.
 */
const buildBody = (query: TokenUsageQuery) => ({
  // 빈 문자열을 그대로 보내면 서버의 date 파싱에서 422 가 난다. 조건 없음은 null 로.
  startDate: query.startDate || null,
  endDate: query.endDate || null,
  companyId: query.companyId || null,
  agentType: query.agentType || null,
  userEmail: query.userEmail || null,
});

const summaryKey = (query: TokenUsageQuery) => ["tokenUsageSummary", buildBody(query)];
const detailKey = (query: TokenUsageQuery, limit: number) => [
  "tokenUsageDetail",
  buildBody(query),
  limit,
];

const getSummary = async (
  query: TokenUsageQuery,
): Promise<IFetchApiRFesultContent<TokenUsageSummary> | null> => {
  const response = await axios.post(`${USAGE_BASE}/summary`, buildBody(query));
  return response.status === 200 ? response.data : null;
};

/** enabled: 조회 조건이 아직 성립하지 않을 때(예: 시작일이 종료일보다 뒤) 호출을 막는다. */
export const useGetUsageSummary = (query: TokenUsageQuery, enabled = true) =>
  useQuery({
    queryKey: summaryKey(query),
    queryFn: () => getSummary(query),
    enabled,
    retry: 1,
    refetchOnWindowFocus: false,
  });

const getDetail = async (
  query: TokenUsageQuery,
  limit: number,
): Promise<IFetchApiRFesultContent<TokenUsageDetail> | null> => {
  const response = await axios.post(
    `${USAGE_BASE}/detail?limit=${limit}&offset=0`,
    buildBody(query),
  );
  return response.status === 200 ? response.data : null;
};

export const useGetUsageDetail = (query: TokenUsageQuery, limit: number, enabled: boolean) =>
  useQuery({
    queryKey: detailKey(query, limit),
    queryFn: () => getDetail(query, limit),
    // 상세는 펼쳤을 때만 부른다. 로그가 많으면 굳이 매번 가져올 이유가 없다.
    enabled,
    retry: 1,
    refetchOnWindowFocus: false,
  });
