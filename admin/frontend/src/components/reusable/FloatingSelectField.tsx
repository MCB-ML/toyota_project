import {
  Label,
  Listbox,
  ListboxButton,
  ListboxOption,
  ListboxOptions,
  Transition,
} from "@headlessui/react";
import { Fragment, useState } from "react";

export type Option = {
  value: string;
  label: string;
  /** true 면 목록에는 보이지만 선택할 수 없다 */
  disabled?: boolean;
  /** 항목 오른쪽에 붙는 상태 표시 */
  badge?: {
    text: string;
    tone: "success" | "danger";
  };
};

const badgeClass = (tone: "success" | "danger") =>
  tone === "success" ? "bg-[#E6F4EC] text-[#12805c]" : "bg-[#FDECEA] text-[#C0392B]";

const FloatingSelectField = ({
  id,
  label,
  value,
  onChange,
  onDisabledSelect,
  options,
  placeholder = "Select an option",
  error = false,
  errorMessage = "",
  disabled = false,
  showLabel = true,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  /** 선택 불가 항목을 눌렀을 때. 이유를 알려주지 않으면 왜 안 되는지 알 수 없다 */
  onDisabledSelect?: (option: Option) => void;
  options: Option[];
  placeholder?: string;
  error?: boolean;
  errorMessage?: string;
  disabled?: boolean;
  showLabel?: boolean;
}) => {
  const [isFocused, setIsFocused] = useState<boolean>(false);
  const hasValue = value !== "";
  const selectedOption = options.find((opt) => opt.value === value);

  return (
    <div className="w-full">
      <Listbox value={value} onChange={onChange} disabled={disabled}>
        {({ open }) => {
          const isFloating = open || hasValue || isFocused;

          return (
            <div className="relative">
              {showLabel && (
                <Label
                  className={`text-sm  px-1 transition-all duration-200 pointer-events-none ${
                    error ? "text-[#E30018]" : disabled ? "" : ""
                  }`}
                >
                  {label}
                </Label>
              )}

              <ListboxButton
                id={id}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                className={`w-full text-sm py-2.5  rounded-lg outline-none transition-all duration-200 text-left bg-[#f4f4f4] cursor-pointer ${
                  error ? "border-[#E30018]" : isFloating ? "" : "border-[#E2E9F1]"
                } ${!hasValue ? "text-[#757575] px-2.5" : "text-black px-4"} ${
                  disabled ? "bg-[#f5f5f5] text-[#757575] cursor-not-allowed" : ""
                }`}
              >
                {hasValue && selectedOption ? (
                  <span className="flex items-center gap-2">
                    <span className="truncate">{selectedOption.label}</span>
                    {selectedOption.badge && (
                      <span
                        className={`shrink-0 rounded px-1.5 py-0.5 text-[11px] font-medium ${badgeClass(
                          selectedOption.badge.tone,
                        )}`}
                      >
                        {selectedOption.badge.text}
                      </span>
                    )}
                  </span>
                ) : (
                  placeholder
                )}
              </ListboxButton>

              <div
                className={`absolute right-3 pointer-events-none text-[#757575] ${
                  showLabel ? "top-9" : "top-1/2 -translate-y-1/2"
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </div>

              <Transition
                as={Fragment}
                leave="transition ease-in duration-100"
                leaveFrom="opacity-100"
                leaveTo="opacity-0"
              >
                <ListboxOptions
                  modal={false}
                  className="absolute z-100 w-full mt-1 bg-white border-2  rounded-lg shadow-lg max-h-60 overflow-y-auto focus:outline-none"
                >
                  {options.map((option) => (
                    <ListboxOption
                      key={option.value}
                      value={option.value}
                      disabled={option.disabled}
                      className={({ focus, selected }) =>
                        `px-4 py-2 transition-colors text-sm ${
                          option.disabled
                            ? "cursor-not-allowed bg-white text-[#98a2b3]"
                            : `cursor-pointer ${focus ? "bg-[#E8F0FE]" : "bg-white"} ${
                                selected ? "text-[#1a73e8] font-medium" : "text-black"
                              }`
                        }`
                      }
                    >
                      {({ selected }) => (
                        // 선택 불가 항목은 Listbox 가 onChange 를 발생시키지 않으므로
                        // 여기서 직접 클릭을 받아 이유를 알린다.
                        <div
                          className="flex items-center justify-between gap-3"
                          onClick={() => {
                            if (option.disabled) onDisabledSelect?.(option);
                          }}
                        >
                          <span className="truncate">
                            {selected && !option.disabled && (
                              <span className="inline-block mr-2">✓</span>
                            )}
                            {option.label}
                          </span>

                          {option.badge && (
                            <span
                              className={`shrink-0 rounded px-1.5 py-0.5 text-[11px] font-medium ${badgeClass(
                                option.badge.tone,
                              )}`}
                            >
                              {option.badge.text}
                            </span>
                          )}
                        </div>
                      )}
                    </ListboxOption>
                  ))}
                </ListboxOptions>
              </Transition>
            </div>
          );
        }}
      </Listbox>

      <div className={`h-5 mt-1 ${!error && "hidden"}`}>
        {error && errorMessage && <p className="text-[#E30018] text-xs">{errorMessage}</p>}
      </div>
    </div>
  );
};

export default FloatingSelectField;
