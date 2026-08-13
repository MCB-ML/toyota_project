import type React from "react";
import { useState } from "react";
import { FaRegEye, FaRegEyeSlash } from "react-icons/fa6";
import { cn } from "@/lib/utils";

type FloatingInputFieldProps = {
  id: string;
  label: string;
  type?: string;
  value: string | number;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  placeholder?: string;
  error?: boolean;
  errorMessage?: string;
  disabled?: boolean;
  className?: string; // Add className
  multiline?: boolean; // Add multiline
  rows?: number; // Add rows
  readOnly?: boolean; // Add readOnly
  required?: boolean; // Add required
};

const FloatingInputField = ({
  id,
  label,
  type = "text",
  value,
  onChange,
  placeholder = "",
  error = false,
  errorMessage = "",
  disabled = false,
  className,
  multiline = false,
  rows = 3,
  readOnly = false,
  required = false,
}: FloatingInputFieldProps) => {
  const [isFocused, setIsFocused] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const hasValue = value !== "" && value !== null && value !== undefined;

  const isFloating = isFocused || hasValue;
  const isPasswordField = type === "password";

  const inputType = isPasswordField ? (showPassword ? "text" : "password") : type;

  const commonClasses = cn(
    "mt-1 bg-[#f4f4f4]  w-full text-md px-4 py-2  rounded-lg outline-none transition-all duration-200 placeholder:text-sm peer",
    error ? "" : isFloating ? "" : "",
    isPasswordField ? "pr-12" : "",
    disabled || readOnly ? " text-[#757575]" : "bg-[#f4f4f4]",
    disabled ? "cursor-not-allowed opacity-60" : "",
    readOnly ? "cursor-default" : "",
    className,
  );

  return (
    <div className="w-full">
      <div className="relative">
        <label
          htmlFor={id}
          className={` text-sm   transition-all duration-200 pointer-events-none ${
            isFloating
              ? ` bg-white px-1 ${error ? "text-[#E30018]" : disabled ? "text-[#757575]" : ""}`
              : ""
          }`}
        >
          {label}
        </label>
        {multiline ? (
          <textarea
            id={id}
            value={value}
            onChange={onChange}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder={isFloating ? placeholder : ""}
            disabled={disabled}
            readOnly={readOnly}
            rows={rows}
            className={commonClasses}
          />
        ) : (
          <input
            id={id}
            type={inputType}
            value={value}
            onChange={onChange}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder={isFloating ? placeholder : ""}
            disabled={disabled}
            readOnly={readOnly}
            className={commonClasses}
          />
        )}

        {isPasswordField && !multiline && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            disabled={disabled}
            className={`absolute right-3 top-12 -translate-y-1/2 transition-colors duration-200 ${
              disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"
            } ${
              error ? "text-[#E30018] hover:text-[#f80019]" : "text-[#757575] hover:text-[#1a73e8]"
            }`}
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <FaRegEyeSlash size={18} /> : <FaRegEye size={18} />}
          </button>
        )}
      </div>

      <div className={`h-5 mt-1 ${!error && "hidden"}`}>
        {error && errorMessage && <p className="text-[#E30018] text-xs">{errorMessage}</p>}
      </div>
    </div>
  );
};

export default FloatingInputField;
