import { Eye, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { ModelSpec } from "../../../../types/model.types";

interface DeploymentAgentSelectProps {
  label: string;
  data: ModelSpec[];
  value: string;
  onSelectAzure: (id: string) => void;
}

/**
 * 용도별 모델 선택.
 *
 * 접속 키(endpoint / apiKey)는 여기서 다루지 않는다.
 * 딜러사별 키는 회사 편집 화면의 접속 키 섹션에서 따로 관리한다.
 */
export const DeploymentAgentSelect = ({
  label,
  data,
  value,
  onSelectAzure,
}: DeploymentAgentSelectProps) => {
  const [openDetail, setOpenDetail] = useState(false);
  const [openList, setOpenList] = useState(false);

  const selected = data.find((d) => d.id === value);

  return (
    <div className="relative flex w-full items-center gap-2">
      {/* 고정폭이면 모델 식별자가 잘린다. 남는 공간을 모두 쓴다. */}
      <div className="flex min-w-0 flex-1 items-center gap-3">
        {label}
        <div className="min-w-0 flex-1" onClick={() => setOpenList(true)}>
          <input
            type="text"
            readOnly
            value={
              selected
                ? selected.isActive === false
                  ? `${selected.displayName} (비활성화)`
                  : selected.displayName
                : ""
            }
            title={selected?.modelId ?? ""}
            placeholder="모델 선택"
            // 지정된 모델이 나중에 비활성화되면 눈에 띄어야 한다
            className={`w-full cursor-pointer truncate rounded-md border px-3 py-1.5 text-xs font-medium transition ${
              selected?.isActive === false
                ? "bg-[#FDECEA] text-[#C0392B]"
                : "bg-blue-100 text-blue-700"
            }`}
          />
        </div>
      </div>

      <Eye
        className={`h-4 w-4 shrink-0 cursor-pointer ${
          selected ? "text-gray-600" : "text-gray-300"
        }`}
        onClick={() => selected && setOpenDetail(true)}
      />

      {openDetail && selected && (
        <>
          <div
            className="fixed inset-0 z-10 bg-gray-500/40 backdrop-blur-sm"
            onClick={() => setOpenDetail(false)}
          />

          <div className="fixed top-16 left-1/2 z-20 w-[90%] max-w-xl -translate-x-1/2 rounded-2xl border bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b px-5 py-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <Eye className="h-4 w-4 text-gray-500" /> 모델 상세
              </div>
              <button
                onClick={() => setOpenDetail(false)}
                className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3 px-5 py-4 text-sm">
              {[
                ["표시 이름", selected.displayName],
                ["모델 식별자", selected.modelId],
                ["Provider", selected.provider],
                ["종류", selected.modelKind],
                ["API Version", selected.apiVersion],
                ["Max Token", selected.maxToken],
                ["Temperature", selected.temperature],
                ["Reasoning", selected.reasoningEffort],
              ].map(([k, v]) => (
                <div key={String(k)} className="flex items-start gap-3">
                  <span className="w-28 shrink-0 text-gray-500">{k}</span>
                  <span className="break-all text-gray-800">{v ?? "-"}</span>
                </div>
              ))}
            </div>

            <div className="flex justify-end border-t px-5 py-3">
              <button
                onClick={() => setOpenDetail(false)}
                className="rounded-lg bg-gray-100 px-4 py-1.5 text-sm text-gray-700 hover:bg-gray-200"
              >
                닫기
              </button>
            </div>
          </div>
        </>
      )}

      {openList && (
        <>
          <div className="fixed inset-0 z-10 bg-gray-500/40" onClick={() => setOpenList(false)} />

          <div className="fixed top-12 left-1/2 z-20 w-[90%] max-w-xl -translate-x-1/2 rounded-xl border bg-white shadow-xl">
            <div className="flex items-center justify-between border-b px-4 py-3">
              <h3 className="text-sm font-semibold text-gray-700">모델 선택</h3>
              <button
                onClick={() => setOpenList(false)}
                className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="max-h-110 overflow-auto p-2">
              {data.length === 0 && (
                <p className="px-3 py-6 text-center text-xs text-[#98a2b3]">
                  모델 배포 메뉴에서 모델을 먼저 등록하세요
                </p>
              )}

              {data.map((d) => {
                // 비활성 모델은 목록에 남기되 선택할 수 없게 한다.
                // 목록에서 빼면 "왜 없지?" 가 되고, 그냥 두면 멈춘 모델이 지정된다.
                // 단, 이미 지정된 모델은 다른 항목을 바꾸는 것까지 막히지 않도록 예외로 둔다.
                const isCurrent = d.id === value;
                const disabled = d.isActive === false && !isCurrent;

                return (
                  <div
                    key={d.id}
                    onClick={() => {
                      if (disabled) {
                        toast.error(`${d.displayName} 은(는) 비활성화된 모델입니다`, {
                          description: "모델 배포 메뉴에서 활성화한 뒤 선택할 수 있습니다.",
                        });
                        return;
                      }

                      onSelectAzure(d.id ?? "");
                      setOpenList(false);
                      setOpenDetail(false);
                    }}
                    className={`border-b px-3 py-3 transition ${
                      disabled ? "cursor-not-allowed bg-white" : "cursor-pointer hover:bg-gray-100"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span
                        className={`text-sm font-medium ${
                          disabled ? "text-[#98a2b3]" : "text-gray-800"
                        }`}
                      >
                        {d.displayName}
                      </span>

                      <span
                        className={`shrink-0 rounded px-1.5 py-0.5 text-[11px] font-medium ${
                          d.isActive === false
                            ? "bg-[#FDECEA] text-[#C0392B]"
                            : "bg-[#E6F4EC] text-[#12805c]"
                        }`}
                      >
                        {d.isActive === false ? "비활성화" : "활성화"}
                      </span>
                    </div>

                    <div
                      className={`mt-1 space-y-0.5 text-xs ${
                        disabled ? "text-[#b6bec9]" : "text-gray-500"
                      }`}
                    >
                      <div className="break-all">{d.modelId}</div>
                      <div>
                        {d.provider} · {d.modelKind} · Max Token {d.maxToken ?? "-"}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
