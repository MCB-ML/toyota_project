import {
  ChevronDown,
  ChevronRight,
  FileCode2,
  FileText,
  Globe,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import DeleteConfirmDialog from "@/components/reusable/DeleteConfirmDialog";
import LoadingPage from "@/components/reusable/loadingPage";
import {
  useCreateSystemPrompt,
  useDeleteSystemPrompt,
  useGetAllSystemPrompt,
  useUpdateSystemPrompt,
} from "@/services/api/systemPrompt/systemPrompt.api";
import { useUiHeaderStore } from "@/store/uiHeaderStore";
import {
  PROMPT_CATEGORIES,
  type PromptCategory,
  type SystemPrompt,
} from "@/types/systemPrompt.types";
import { getErrorMessage } from "@/utils/getErrorMessage";
import PromptEditorDialog, { type PromptDraft } from "./PromptEditorDialog";

const CATEGORY_META: Record<PromptCategory, { label: string; desc: string }> = {
  semantic: { label: "시맨틱", desc: "용어·표현의 의미를 정의합니다" },
  ontology: { label: "온톨로지", desc: "엔티티와 관계를 정의합니다" },
  metrics: { label: "메트릭스", desc: "지표와 산식을 정의합니다" },
};

const PromptSettingsMainComponent = () => {
  const { data, isLoading, isError } = useGetAllSystemPrompt();

  const { mutate: createPrompt, isPending: isCreating } = useCreateSystemPrompt();
  const { mutate: updatePrompt, isPending: isUpdating } = useUpdateSystemPrompt();
  const { mutate: deletePrompt, isPending: isDeleting } = useDeleteSystemPrompt();

  const { setHeaderAction } = useUiHeaderStore();

  const [editing, setEditing] = useState<{
    open: boolean;
    category: PromptCategory;
    prompt: SystemPrompt | null;
  }>({ open: false, category: "semantic", prompt: null });

  const [deleting, setDeleting] = useState<SystemPrompt | null>(null);
  const [keyword, setKeyword] = useState("");

  // 카테고리마다 파일이 수십 개가 될 수 있어 기본을 접힌 상태로 둔다.
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(PROMPT_CATEGORIES.map((c) => [c, true])),
  );

  const prompts = useMemo(() => (data?.success ? (data.result ?? []) : []), [data]);

  const trimmedKeyword = keyword.trim().toLowerCase();

  /** 카테고리별로 묶는다. 검색어가 있으면 이름·파일명으로 거른다. */
  const byCategory = useMemo(() => {
    const map = new Map<PromptCategory, SystemPrompt[]>(
      PROMPT_CATEGORIES.map((c) => [c, [] as SystemPrompt[]]),
    );

    for (const p of prompts) {
      if (trimmedKeyword) {
        const haystack = `${p.name} ${p.fileName ?? ""}`.toLowerCase();
        if (!haystack.includes(trimmedKeyword)) continue;
      }

      map.get(p.category)?.push(p);
    }

    return map;
  }, [prompts, trimmedKeyword]);

  /** 전체 개수는 검색과 무관하게 보여준다 (몇 개 중 몇 개인지 알 수 있게) */
  const totalByCategory = useMemo(() => {
    const map = new Map<PromptCategory, number>(PROMPT_CATEGORIES.map((c) => [c, 0]));
    for (const p of prompts) map.set(p.category, (map.get(p.category) ?? 0) + 1);
    return map;
  }, [prompts]);

  useEffect(() => {
    if (isError) toast.error("프롬프트를 불러오지 못했습니다");
  }, [isError]);

  useEffect(() => {
    setHeaderAction({
      label: "프롬프트 추가",
      onClick: () => setEditing({ open: true, category: "semantic", prompt: null }),
      disabled: isLoading,
    });

    return () => setHeaderAction(null);
  }, [setHeaderAction, isLoading]);

  const toggle = (category: PromptCategory) =>
    setCollapsed((prev) => ({ ...prev, [category]: !prev[category] }));

  const setAllCollapsed = (value: boolean) =>
    setCollapsed(Object.fromEntries(PROMPT_CATEGORIES.map((c) => [c, value])));

  const handleSave = (draft: PromptDraft) => {
    const done = (message: string) => {
      toast.success(message);
      setEditing((prev) => ({ ...prev, open: false }));
      // 방금 건드린 카테고리는 펼쳐서 결과가 바로 보이게 한다
      setCollapsed((prev) => ({ ...prev, [draft.category]: false }));
    };

    const fail = (error: unknown) => toast.error(getErrorMessage(error));

    if (draft.id) {
      updatePrompt(
        {
          id: draft.id,
          name: draft.name,
          fileName: draft.fileName || null,
          fileType: draft.fileType,
          value: draft.value,
        },
        { onSuccess: () => done("수정되었습니다"), onError: fail },
      );
    } else {
      createPrompt(
        {
          category: draft.category,
          name: draft.name,
          fileName: draft.fileName || null,
          fileType: draft.fileType,
          value: draft.value,
        },
        { onSuccess: () => done("추가되었습니다"), onError: fail },
      );
    }
  };

  const handleDelete = () => {
    if (!deleting) return;

    deletePrompt(deleting.id, {
      onSuccess: () => {
        toast.success("삭제되었습니다");
        setDeleting(null);
      },
      onError: (error) => toast.error(getErrorMessage(error)),
    });
  };

  return (
    <div className="h-full flex flex-col bg-[#f2f5fa] px-1 md:px-2 lg:px-3 py-1 md:py-2 lg:py-3">
      <LoadingPage isLoading={isLoading} />

      <div className="flex-1 min-h-0 overflow-auto rounded-lg bg-white p-6">
        <div className="mb-5 flex items-start gap-3 rounded-lg bg-[#F1F6FD] p-4">
          <Globe size={18} className="mt-0.5 shrink-0 text-[#1a73e8]" />
          <div>
            <p className="text-sm font-medium text-[#101828]">프롬프트 설정</p>
            <p className="mt-0.5 text-xs text-[#5a6a7a]">
              전 딜러사가 공통으로 사용합니다. 카테고리마다 yaml · md 파일을 여러 개 등록할 수
              있습니다.
            </p>
          </div>
        </div>

        {/* 검색 + 전체 펼치기/접기 */}
        <div className="mb-4 flex items-center gap-3">
          <div className="relative flex-1">
            <Search
              size={15}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#98a2b3]"
            />
            <input
              type="text"
              value={keyword}
              onChange={(e) => {
                setKeyword(e.target.value);
                // 검색 중에는 결과가 보여야 하므로 전부 펼친다
                if (e.target.value.trim()) setAllCollapsed(false);
              }}
              placeholder="파일명으로 검색"
              className="w-full rounded-lg border border-[#e5e7eb] py-2 pl-9 pr-9 text-sm outline-none focus:border-[#1a73e8]"
            />
            {keyword && (
              <button
                type="button"
                onClick={() => setKeyword("")}
                title="검색어 지우기"
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-[#98a2b3] hover:bg-[#f1f3f6]"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() => setAllCollapsed(false)}
            className="shrink-0 rounded-md border px-3 py-2 text-xs text-[#5a6a7a] hover:bg-[#fafbfc]"
          >
            전체 펼치기
          </button>
          <button
            type="button"
            onClick={() => setAllCollapsed(true)}
            className="shrink-0 rounded-md border px-3 py-2 text-xs text-[#5a6a7a] hover:bg-[#fafbfc]"
          >
            전체 접기
          </button>
        </div>

        <div className="flex flex-col gap-3">
          {PROMPT_CATEGORIES.map((category) => {
            const items = byCategory.get(category) ?? [];
            const total = totalByCategory.get(category) ?? 0;
            const meta = CATEGORY_META[category];
            const isCollapsed = collapsed[category];

            return (
              <section key={category} className="rounded-lg border border-[#e5e7eb]">
                <header className="flex items-center justify-between gap-3 bg-[#fafbfc] px-4 py-3">
                  {/* 헤더 전체를 접기 토글로 쓴다 */}
                  <button
                    type="button"
                    onClick={() => toggle(category)}
                    className="flex min-w-0 flex-1 items-center gap-2 text-left"
                  >
                    {isCollapsed ? (
                      <ChevronRight size={16} className="shrink-0 text-[#5a6a7a]" />
                    ) : (
                      <ChevronDown size={16} className="shrink-0 text-[#5a6a7a]" />
                    )}

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-[#101828]">{meta.label}</span>
                        <span className="rounded bg-[#eef1f5] px-1.5 py-0.5 text-[11px] text-[#5a6a7a]">
                          {trimmedKeyword ? `${items.length} / ${total}` : total}
                        </span>
                      </div>
                      <p className="mt-0.5 truncate text-xs text-[#8a94a0]">{meta.desc}</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setEditing({ open: true, category, prompt: null })}
                    className="flex shrink-0 items-center gap-1.5 rounded-md border border-[#1a73e8] px-3 py-1.5 text-xs font-medium text-[#1a73e8] hover:bg-[#F1F6FD]"
                  >
                    <Plus size={14} /> 추가
                  </button>
                </header>

                {!isCollapsed &&
                  (items.length === 0 ? (
                    <p className="border-t border-[#eef1f5] px-4 py-6 text-center text-xs text-[#98a2b3]">
                      {trimmedKeyword ? "검색 결과가 없습니다" : "등록된 프롬프트가 없습니다"}
                    </p>
                  ) : (
                    <ul className="divide-y divide-[#f1f3f6] border-t border-[#eef1f5]">
                      {items.map((item) => (
                        <li
                          key={item.id}
                          className="flex items-center gap-3 px-4 py-2.5 hover:bg-[#fafbfc]"
                        >
                          {item.fileType === "md" ? (
                            <FileText size={16} className="shrink-0 text-[#8a94a0]" />
                          ) : (
                            <FileCode2 size={16} className="shrink-0 text-[#8a94a0]" />
                          )}

                          <div className="min-w-0 flex-1">
                            <div className="truncate text-sm text-[#101828]">{item.name}</div>
                            <div className="truncate text-xs text-[#8a94a0]">
                              {item.fileName || `${item.name}.${item.fileType}`}
                            </div>
                          </div>

                          <span className="shrink-0 rounded bg-[#eef1f5] px-1.5 py-0.5 text-[10px] uppercase text-[#5a6a7a]">
                            {item.fileType}
                          </span>

                          <button
                            type="button"
                            title="편집"
                            onClick={() => setEditing({ open: true, category, prompt: item })}
                            className="shrink-0 rounded-md border p-1.5 text-[#1a73e8] hover:bg-[#F1F6FD]"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            type="button"
                            title="삭제"
                            onClick={() => setDeleting(item)}
                            className="shrink-0 rounded-md border p-1.5 text-[#E30018] hover:bg-[#FDECEA]"
                          >
                            <Trash2 size={14} />
                          </button>
                        </li>
                      ))}
                    </ul>
                  ))}
              </section>
            );
          })}
        </div>
      </div>

      <PromptEditorDialog
        open={editing.open}
        category={editing.category}
        prompt={editing.prompt}
        isSaving={isCreating || isUpdating}
        onClose={() => setEditing((prev) => ({ ...prev, open: false }))}
        onSave={handleSave}
      />

      <DeleteConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={handleDelete}
        title="프롬프트 삭제"
        description={`${deleting?.name ?? ""} 을(를) 삭제할까요? 되돌릴 수 없습니다.`}
        isLoading={isDeleting}
      />
    </div>
  );
};

export default PromptSettingsMainComponent;
