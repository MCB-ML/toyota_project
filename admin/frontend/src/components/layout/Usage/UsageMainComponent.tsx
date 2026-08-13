import { AlertTriangle, BarChart3, ChevronDown, ChevronRight, ChevronsDownUp, ChevronsUpDown, Info, Mail, RefreshCw } from "lucide-react";
import { Fragment, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import LoadingPage from "@/components/reusable/loadingPage";
import { useGetAllCompanyList } from "@/services/api/company/getAllCompany";
import { useGetUsageDetail, useGetUsageSummary } from "@/services/api/tokenUsage/tokenUsage.api";
import {
  AGENT_TYPE_LABELS,
  PERIOD_PRESETS,
  type PeriodPresetKey,
  presetToRange,
  toDateString,
  type TokenUsageUserRow,
  USAGE_AGENT_TYPES,
} from "@/types/tokenUsage.types";

/** 상세 로그는 조사용이다. 전부 내려받을 이유가 없다. */
const DETAIL_LIMIT = 200;

/** 프리셋 + 직접 선택. 'custom' 은 화면에서만 쓰는 값이라 타입도 여기 둔다. */
type PeriodKey = PeriodPresetKey | "custom";

/** 오늘 이후는 고를 이유가 없다. date 입력의 max 로 쓴다. */
const today = toDateString(new Date());

const nf = new Intl.NumberFormat("ko-KR");

const formatDateTime = (iso: string) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;

  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(
    d.getMinutes(),
  )}`;
};

const agentLabel = (type?: string | null) => (type ? (AGENT_TYPE_LABELS[type] ?? type) : "-");

const UsageMainComponent = () => {
  const [period, setPeriod] = useState<PeriodKey>("30d");
  const [companyId, setCompanyId] = useState("");
  const [agentType, setAgentType] = useState("");
  const [showLogs, setShowLogs] = useState(false);

  // 직접 선택한 기간. 프리셋에서 넘어올 때 그때 보던 기간으로 채워 넣는다 —
  // 빈 값은 서버에서 "전체 기간"이 되어, 좁히려던 사람에게 정반대로 동작한다.
  const [customRange, setCustomRange] = useState({ startDate: "", endDate: "" });

  // 펼친 딜러사. 이메일 내역은 이미 받아둔 데이터라 펼칠 때 재조회하지 않는다.
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const range = useMemo(
    () => (period === "custom" ? customRange : presetToRange(period)),
    [period, customRange],
  );

  // 시작이 종료보다 뒤면 서버는 0건을 오류 없이 돌려준다. 조회하기 전에 잡는다.
  const rangeInvalid =
    period === "custom" &&
    !!range.startDate &&
    !!range.endDate &&
    range.startDate > range.endDate;

  const query = useMemo(
    () => ({
      startDate: range.startDate,
      endDate: range.endDate,
      companyId,
      agentType,
    }),
    [range, companyId, agentType],
  );

  const {
    data,
    isLoading,
    isError,
    isFetching,
    refetch: refetchSummary,
  } = useGetUsageSummary(query, !rangeInvalid);
  const {
    data: detailData,
    isLoading: isDetailLoading,
    refetch: refetchDetail,
  } = useGetUsageDetail(query, DETAIL_LIMIT, showLogs && !rangeInvalid);
  const { data: companyData } = useGetAllCompanyList();

  useEffect(() => {
    if (isError) toast.error("사용량을 불러오지 못했습니다");
  }, [isError]);

  const summary = data?.success ? data.result : null;
  const rows = summary?.rows ?? [];
  // 전체 펼치기/접기 버튼의 상태. 한 곳이라도 닫혀 있으면 '펼치기'를 보여준다.
  const allExpanded = rows.length > 0 && rows.every((r) => expanded[r.companyId]);
  const logs = detailData?.success ? (detailData.result?.logs ?? []) : [];

  /** 딜러사 id -> 그 딜러사의 이메일별 내역 (토큰 많은 순) */
  const usersByCompany = useMemo(() => {
    const map = new Map<string, TokenUsageUserRow[]>();

    for (const u of summary?.users ?? []) {
      const list = map.get(u.companyId);
      if (list) list.push(u);
      else map.set(u.companyId, [u]);
    }

    return map;
  }, [summary]);

  const companies = useMemo(
    () => (companyData?.success ? (companyData.result ?? []) : []),
    [companyData],
  );

  const totalRequests = summary?.totalRequestCount ?? 0;
  const totalTokens = summary?.totalTokens ?? 0;
  const totalFailed = rows.reduce((sum, r) => sum + r.failedCount, 0);

  const failRate = totalRequests > 0 ? (totalFailed / totalRequests) * 100 : 0;

  /**
   * 전체 토큰 대비 비중(%).
   *
   * 기준은 언제나 조회된 전체 합계다. 그래야 딜러사 비중을 다 더하면 100% 가 되고,
   * 펼친 계정들의 비중을 더하면 그 딜러사의 비중이 된다 — 한 자로 잰 값이 된다.
   *
   * 1위 딜러사를 100% 로 잡는 방식(상대 규모)은 막대 길이 차이는 잘 보이지만,
   * 1위가 전체를 다 차지한 것처럼 읽혀서 쓰지 않는다.
   */
  const share = (tokens: number) => (totalTokens > 0 ? (tokens / totalTokens) * 100 : 0);

  return (
    <div className="h-full flex flex-col bg-[#f2f5fa] px-1 md:px-2 lg:px-3 py-1 md:py-2 lg:py-3">
      <LoadingPage isLoading={isLoading} />

      <div className="flex-1 min-h-0 overflow-auto rounded-lg bg-white p-6">
        <div className="mb-5 flex items-start gap-3 rounded-lg bg-[#F1F6FD] p-4">
          <Info size={18} className="mt-0.5 shrink-0 text-[#1a73e8]" />
          <div>
            <p className="text-sm font-medium text-[#101828]">사용량</p>
            <p className="mt-0.5 text-xs text-[#5a6a7a]">
              에이전트 호출마다 남는 로그를 딜러사별로 집계합니다. 딜러사 행을 클릭하면 계정
              (이메일) 별 사용량이 펼쳐집니다. 키를 딜러사마다 발급하지 않아도 누가 얼마나 쓰는지
              여기서 확인할 수 있습니다.
            </p>
          </div>
        </div>

        {/* 조회 조건 */}
        <div className="mb-5 flex flex-wrap items-center gap-3">
          <div className="flex h-[38px] items-center overflow-hidden rounded-md border">
            {PERIOD_PRESETS.map((p) => (
              <button
                key={p.key}
                type="button"
                onClick={() => setPeriod(p.key)}
                className={`h-full px-3.5 text-xs font-medium transition ${
                  period === p.key
                    ? "bg-[#1a73e8] text-white"
                    : "bg-white text-[#5a6a7a] hover:bg-[#F1F6FD]"
                }`}
              >
                {p.label}
              </button>
            ))}

            {/* 넘어올 때 지금 보던 기간을 그대로 채워준다. 빈 칸으로 두면
                조건이 사라져 전체 기간이 되는데, 좁히려던 의도와 정반대다. */}
            <button
              type="button"
              onClick={() => {
                if (period !== "custom") {
                  const base = presetToRange(period);
                  setCustomRange({
                    startDate: base.startDate || today,
                    endDate: base.endDate || today,
                  });
                }
                setPeriod("custom");
              }}
              className={`h-full px-3.5 text-xs font-medium transition ${
                period === "custom"
                  ? "bg-[#1a73e8] text-white"
                  : "bg-white text-[#5a6a7a] hover:bg-[#F1F6FD]"
              }`}
            >
              직접 선택
            </button>
          </div>

          {period === "custom" && (
            <div className="flex h-[38px] items-center gap-1.5">
              <input
                type="date"
                value={customRange.startDate}
                max={customRange.endDate || today}
                onChange={(e) =>
                  setCustomRange((prev) => ({ ...prev, startDate: e.target.value }))
                }
                className="h-[38px] rounded-md border border-[#e5e7eb] px-2.5 text-sm text-[#101828] outline-none focus:border-[#1a73e8]"
              />
              <span className="text-xs text-[#8a94a0]">~</span>
              <input
                type="date"
                value={customRange.endDate}
                min={customRange.startDate || undefined}
                max={today}
                onChange={(e) => setCustomRange((prev) => ({ ...prev, endDate: e.target.value }))}
                className="h-[38px] rounded-md border border-[#e5e7eb] px-2.5 text-sm text-[#101828] outline-none focus:border-[#1a73e8]"
              />
            </div>
          )}

          <select
            value={companyId}
            onChange={(e) => setCompanyId(e.target.value)}
            className="h-[38px] rounded-md border border-[#e5e7eb] px-3 text-sm text-[#101828] outline-none focus:border-[#1a73e8]"
          >
            <option value="">딜러사 전체</option>
            {companies.map((c) => (
              <option key={c.companyId} value={c.companyId}>
                {c.companyName}
              </option>
            ))}
          </select>

          <select
            value={agentType}
            onChange={(e) => setAgentType(e.target.value)}
            className="h-[38px] rounded-md border border-[#e5e7eb] px-3 text-sm text-[#101828] outline-none focus:border-[#1a73e8]"
          >
            <option value="">용도 전체</option>
            {USAGE_AGENT_TYPES.map((t) => (
              <option key={t} value={t}>
                {AGENT_TYPE_LABELS[t]}
              </option>
            ))}
          </select>

          {/* 직접 선택 중에는 입력칸에 날짜가 이미 보이므로 겹쳐 적지 않는다. */}
          {period !== "custom" && range.startDate && (
            <span className="text-xs text-[#8a94a0]">
              {range.startDate} ~ {range.endDate}
            </span>
          )}

          {rangeInvalid && (
            <span className="text-xs font-medium text-[#d92d20]">
              시작일이 종료일보다 뒤입니다
            </span>
          )}

          <div className="ml-auto flex items-center gap-2">
            {/* 사용량은 에이전트가 쓰는 대로 쌓인다. 조회 조건을 바꾸지 않고
                방금 친 질의가 잡혔는지 보려면 다시 불러올 방법이 있어야 한다.
                조회 실패 뒤 재시도 통로이기도 해서 rows 가 비어도 남겨둔다. */}
            <button
              type="button"
              onClick={() => {
                refetchSummary();
                // 로그는 펼쳐 놓았을 때만 다시 부른다. disabled 상태에서도
                // refetch() 는 실제로 요청을 보내므로 조건을 직접 건다.
                if (showLogs) refetchDetail();
              }}
              disabled={isFetching || rangeInvalid}
              title="사용량 다시 불러오기"
              className="flex h-[38px] items-center gap-1.5 rounded-md border border-[#e5e7eb] px-3 text-xs font-medium text-[#5a6a7a] transition hover:bg-[#F1F6FD] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCw size={14} className={isFetching ? "animate-spin" : ""} />
              새로고침
            </button>

            {/* 딜러사가 늘어나면 행을 하나씩 여는 게 번거롭다. 한 번에 펼치고 접는다.
                rows 가 비어 있으면 누를 대상이 없으므로 감춘다. */}
            {rows.length > 0 && (
              <button
                type="button"
                onClick={() =>
                  setExpanded(
                    allExpanded
                      ? {}
                      : Object.fromEntries(rows.map((r) => [r.companyId, true])),
                  )
                }
                className="flex h-[38px] items-center gap-1.5 rounded-md border border-[#e5e7eb] px-3 text-xs font-medium text-[#5a6a7a] transition hover:bg-[#F1F6FD]"
              >
                {allExpanded ? <ChevronsDownUp size={14} /> : <ChevronsUpDown size={14} />}
                {allExpanded ? "전체 접기" : "전체 펼치기"}
              </button>
            )}
          </div>
        </div>

        {/* 요약 카드 */}
        <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-lg border border-[#e5e7eb] p-4">
            <p className="text-xs text-[#8a94a0]">총 요청</p>
            <p className="mt-1 text-2xl font-semibold text-[#101828]">{nf.format(totalRequests)}</p>
          </div>
          <div className="rounded-lg border border-[#e5e7eb] p-4">
            <p className="text-xs text-[#8a94a0]">총 토큰</p>
            <p className="mt-1 text-2xl font-semibold text-[#101828]">{nf.format(totalTokens)}</p>
          </div>
          <div className="rounded-lg border border-[#e5e7eb] p-4">
            <p className="text-xs text-[#8a94a0]">실패</p>
            <p
              className={`mt-1 text-2xl font-semibold ${
                totalFailed > 0 ? "text-[#d92d20]" : "text-[#101828]"
              }`}
            >
              {nf.format(totalFailed)}
              {totalRequests > 0 && (
                <span className="ml-2 text-sm font-normal text-[#8a94a0]">
                  {failRate.toFixed(1)}%
                </span>
              )}
            </p>
          </div>
        </div>

        {/* 딜러사별 집계 */}
        {rows.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-[#e5e7eb] py-16">
            <BarChart3 size={28} className="text-[#c4cbd4]" />
            <p className="text-sm text-[#8a94a0]">해당 기간에 사용 기록이 없습니다</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-[#e5e7eb]">
            <table className="w-full min-w-[1040px] text-sm">
              <thead className="bg-[#fafbfc] text-xs text-[#5a6a7a]">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">딜러사</th>
                  <th className="px-4 py-3 text-right font-medium">요청</th>
                  <th className="px-4 py-3 text-right font-medium">실패</th>
                  <th className="px-4 py-3 text-right font-medium">입력 토큰</th>
                  <th className="px-4 py-3 text-right font-medium">출력 토큰</th>
                  <th className="px-4 py-3 text-right font-medium">합계</th>
                  <th className="px-4 py-3 text-right font-medium">평균 응답</th>
                  <th className="px-4 py-3 text-right font-medium">최근 사용</th>
                  <th className="w-[190px] px-4 py-3 text-left font-medium">비중</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const users = usersByCompany.get(r.companyId) ?? [];
                  const isOpen = !!expanded[r.companyId];

                  return (
                    <Fragment key={r.companyId}>
                      <tr
                        className="cursor-pointer border-t border-[#f1f3f6] hover:bg-[#fafbfc]"
                        onClick={() =>
                          setExpanded((prev) => ({ ...prev, [r.companyId]: !prev[r.companyId] }))
                        }
                      >
                        <td className="px-4 py-3 font-medium text-[#101828]">
                          <span className="flex items-center gap-1.5">
                            {isOpen ? (
                              <ChevronDown size={14} className="text-[#8a94a0]" />
                            ) : (
                              <ChevronRight size={14} className="text-[#8a94a0]" />
                            )}
                            {r.companyName}
                            <span className="ml-1 text-xs font-normal text-[#8a94a0]">
                              계정 {users.length}
                            </span>
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums text-[#5a6a7a]">
                          {nf.format(r.requestCount)}
                        </td>
                        <td
                          className={`px-4 py-3 text-right tabular-nums ${
                            r.failedCount > 0 ? "text-[#d92d20]" : "text-[#c4cbd4]"
                          }`}
                        >
                          {nf.format(r.failedCount)}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums text-[#5a6a7a]">
                          {nf.format(r.inputTokens)}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums text-[#5a6a7a]">
                          {nf.format(r.outputTokens)}
                        </td>
                        <td className="px-4 py-3 text-right font-medium tabular-nums text-[#101828]">
                          {nf.format(r.totalTokens)}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums text-[#5a6a7a]">
                          {r.avgLatencyMs != null ? `${nf.format(r.avgLatencyMs)}ms` : "-"}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-right text-xs tabular-nums text-[#8a94a0]">
                          {r.lastUsedAt ? formatDateTime(r.lastUsedAt) : "-"}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="h-2 flex-1 overflow-hidden rounded-full bg-[#f1f3f6]">
                              <div
                                className="h-full rounded-full bg-[#1a73e8]"
                                // 비중이 아주 작아도 막대가 아예 사라지지 않게 최소 폭을 준다.
                                // 정확한 값은 옆의 숫자가 말해준다.
                                style={{ width: `${share(r.totalTokens)}%`, minWidth: "2px" }}
                              />
                            </div>
                            <span className="w-11 shrink-0 text-right text-xs tabular-nums text-[#5a6a7a]">
                              {share(r.totalTokens).toFixed(1)}%
                            </span>
                          </div>
                        </td>
                      </tr>

                      {/* 이메일별 내역. 딜러사 안에서의 비중이라 기준은 그 딜러사 합계다. */}
                      {isOpen &&
                        users.map((u) => (
                          <tr
                            key={`${r.companyId}-${u.userEmail}`}
                            className="border-t border-[#f6f8fa] bg-[#fcfdfe]"
                          >
                            <td className="py-2.5 pl-11 pr-4 text-[#5a6a7a]">
                              <span className="flex items-center gap-2">
                                <Mail size={13} className="shrink-0 text-[#c4cbd4]" />
                                {u.userEmail}
                              </span>
                            </td>
                            <td className="px-4 py-2.5 text-right tabular-nums text-[#8a94a0]">
                              {nf.format(u.requestCount)}
                            </td>
                            <td
                              className={`px-4 py-2.5 text-right tabular-nums ${
                                u.failedCount > 0 ? "text-[#d92d20]" : "text-[#d8dde3]"
                              }`}
                            >
                              {nf.format(u.failedCount)}
                            </td>
                            <td className="px-4 py-2.5 text-right tabular-nums text-[#8a94a0]">
                              {nf.format(u.inputTokens)}
                            </td>
                            <td className="px-4 py-2.5 text-right tabular-nums text-[#8a94a0]">
                              {nf.format(u.outputTokens)}
                            </td>
                            <td className="px-4 py-2.5 text-right tabular-nums text-[#5a6a7a]">
                              {nf.format(u.totalTokens)}
                            </td>
                            <td className="px-4 py-2.5 text-right tabular-nums text-[#8a94a0]">
                              {u.avgLatencyMs != null ? `${nf.format(u.avgLatencyMs)}ms` : "-"}
                            </td>
                            <td className="whitespace-nowrap px-4 py-2.5 text-right text-xs tabular-nums text-[#8a94a0]">
                              {u.lastUsedAt ? formatDateTime(u.lastUsedAt) : "-"}
                            </td>
                            <td className="px-4 py-2.5">
                              {/*
                                계정도 딜러사와 같은 기준(전체 합계)으로 잰다.
                                그래야 펼친 계정들의 비중을 더하면 그 딜러사의 비중이 된다.
                              */}
                              <div className="flex items-center gap-2">
                                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#f1f3f6]">
                                  <div
                                    className="h-full rounded-full bg-[#93b8f0]"
                                    style={{
                                      width: `${share(u.totalTokens)}%`,
                                      minWidth: "2px",
                                    }}
                                  />
                                </div>
                                <span className="w-11 shrink-0 text-right text-xs tabular-nums text-[#8a94a0]">
                                  {share(u.totalTokens).toFixed(1)}%
                                </span>
                              </div>
                            </td>
                          </tr>
                        ))}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* 원본 로그. 집계 숫자가 이상할 때만 펼친다. */}
        <div className="mt-5">
          <button
            type="button"
            onClick={() => setShowLogs((v) => !v)}
            className="flex items-center gap-1.5 rounded-md border px-3 py-2 text-xs text-[#5a6a7a] hover:bg-[#fafbfc]"
          >
            {showLogs ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            원본 로그 {showLogs ? "접기" : "보기"}
          </button>

          {showLogs && (
            <div className="mt-3">
              {isDetailLoading ? (
                <p className="py-6 text-center text-sm text-[#8a94a0]">불러오는 중...</p>
              ) : logs.length === 0 ? (
                <p className="py-6 text-center text-sm text-[#8a94a0]">기록이 없습니다</p>
              ) : (
                <>
                  <p className="mb-2 text-xs text-[#8a94a0]">
                    최신순 최대 {DETAIL_LIMIT}건까지 표시합니다
                  </p>
                  <div className="overflow-x-auto rounded-lg border border-[#e5e7eb]">
                    <table className="w-full min-w-[1020px] text-sm">
                      <thead className="bg-[#fafbfc] text-xs text-[#5a6a7a]">
                        <tr>
                          <th className="px-4 py-3 text-left font-medium">시각</th>
                          <th className="px-4 py-3 text-left font-medium">딜러사</th>
                          <th className="px-4 py-3 text-left font-medium">계정</th>
                          <th className="px-4 py-3 text-left font-medium">용도</th>
                          <th className="px-4 py-3 text-left font-medium">모델</th>
                          <th className="px-4 py-3 text-right font-medium">토큰</th>
                          <th className="px-4 py-3 text-right font-medium">응답</th>
                          <th className="px-4 py-3 text-left font-medium">결과</th>
                        </tr>
                      </thead>
                      <tbody>
                        {logs.map((lg) => (
                          <tr key={lg.id} className="border-t border-[#f1f3f6]">
                            <td className="whitespace-nowrap px-4 py-2.5 tabular-nums text-[#5a6a7a]">
                              {formatDateTime(lg.createdAt)}
                            </td>
                            <td className="px-4 py-2.5 text-[#101828]">{lg.companyName ?? "-"}</td>
                            <td className="px-4 py-2.5 text-[#5a6a7a]">
                              {lg.userEmail ?? "(시스템)"}
                            </td>
                            <td className="px-4 py-2.5 text-[#5a6a7a]">
                              {agentLabel(lg.agentType)}
                            </td>
                            <td className="px-4 py-2.5 text-[#5a6a7a]">{lg.modelName ?? "-"}</td>
                            <td className="px-4 py-2.5 text-right tabular-nums text-[#5a6a7a]">
                              {nf.format(lg.totalTokens)}
                            </td>
                            <td className="px-4 py-2.5 text-right tabular-nums text-[#5a6a7a]">
                              {lg.latencyMs != null ? `${nf.format(lg.latencyMs)}ms` : "-"}
                            </td>
                            <td className="px-4 py-2.5">
                              {lg.succeeded ? (
                                <span className="text-xs font-medium text-[#0f9d58]">성공</span>
                              ) : (
                                <span
                                  className="flex items-center gap-1 text-xs font-medium text-[#d92d20]"
                                  title={lg.errorMessage ?? ""}
                                >
                                  <AlertTriangle size={12} />
                                  실패
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UsageMainComponent;
