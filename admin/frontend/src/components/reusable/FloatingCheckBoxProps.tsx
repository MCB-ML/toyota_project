interface FloatingCheckBoxProps {
  id: string;
  label: string;
  value: boolean;
  onChangeField: (checked: boolean) => void;
  error?: boolean;
  errorMessage?: string;
  disabled?: boolean;
}
export const FloatingCheckBox = ({
  id,
  label,
  value,
  onChangeField,
  error = false,
  errorMessage = "",
  disabled = false,
}: FloatingCheckBoxProps) => {
  return (
    <div className="w-full">
      <div
        className={`relative flex items-center px-4 py-3 border-2 rounded-lg transition-all duration-200 ${
          error ? "border-[#E30018]" : value ? "border-[#1a73e8]" : "border-[#E2E9F1]"
        } ${
          disabled
            ? "bg-[#f5f5f5] text-[#757575] cursor-not-allowed opacity-60"
            : "bg-white cursor-pointer"
        }`}
      >
        <input
          id={id}
          type="checkbox"
          checked={value}
          disabled={disabled}
          onChange={(e) => onChangeField(e.target.checked)}
          className="peer w-4 h-4 accent-[#5f368d]"
        />

        <label
          htmlFor={id}
          className={`ml-3 text-sm transition-colors duration-200 ${
            error
              ? "text-[#E30018]"
              : disabled
                ? "text-[#757575]"
                : value
                  ? "text-[#1a73e8]"
                  : "text-[#757575]"
          }`}
        >
          {label}
        </label>
      </div>

      <div className={`h-5 mt-1 ${!error && "hidden"}`}>
        {error && errorMessage && <p className="text-[#E30018] text-xs">{errorMessage}</p>}
      </div>
    </div>
  );
};
