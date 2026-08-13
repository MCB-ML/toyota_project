import type { Option } from "@/components/reusable/FloatingSelectField";
import type { CompanyInfoData } from "@/types/companyInfo.types";

/**
 * 딜러사 선택 옵션을 만든다.
 *
 * 비활성 딜러사는 목록에 남기되 선택할 수 없게 한다.
 *   - 목록에서 아예 빼면 "왜 안 보이지?" 가 되고,
 *   - 그냥 두면 비활성 딜러사에 사용자가 붙는다.
 *
 * 예외: 이미 그 딜러사에 소속된 사용자를 편집하는 경우.
 *       현재 값을 선택 불가로 만들면 다른 항목을 바꾸는 것조차 막히므로
 *       currentValue 로 전달된 딜러사만은 선택 가능하게 둔다.
 */
export const buildCompanyOptions = (
  companyList: CompanyInfoData[],
  currentValue?: string,
): Option[] =>
  (companyList ?? []).map((c) => {
    const active = c.isActive !== false;
    const isCurrent = !!currentValue && c.companyId === currentValue;

    return {
      value: c.companyId,
      label: c.companyName,
      disabled: !active && !isCurrent,
      badge: active
        ? { text: "활성화", tone: "success" as const }
        : { text: "비활성화", tone: "danger" as const },
    };
  });
