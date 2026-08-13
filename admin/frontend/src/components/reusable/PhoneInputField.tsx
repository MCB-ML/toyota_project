import type React from "react";
import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { countries } from "@/data/countries";

type PhoneInputFieldProps = {
  id: string;
  label: string;
  value: string;
  countryCode: string;
  onPhoneChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onCountryChange: (countryCode: string) => void;
  error?: boolean;
  errorMessage?: string;
  disabled?: boolean;
};

const PhoneInputField = ({
  id,
  label,
  value,
  countryCode,
  onPhoneChange,
  onCountryChange,
  error = false,
  errorMessage = "",
  disabled = false,
}: PhoneInputFieldProps) => {
  const [isFocused, setIsFocused] = useState<boolean>(false);
  const hasValue = value.length > 0;
  const isFloating = isFocused || hasValue;

  const selectedCountry = countries.find((c) => c.code === countryCode) || countries[0];

  return (
    <div className="w-full">
      <div className="relative">
        <div className="flex gap-2">
          <Select value={countryCode} onValueChange={onCountryChange} disabled={disabled}>
            <SelectTrigger
              className={`w-[110px] sm:w-[120px] min-h-11 border-2 ${
                error ? "border-[#E30018]" : "border-[#E2E9F1] focus:border-[#1a73e8]"
              } ${disabled ? "bg-[#f5f5f5] cursor-not-allowed opacity-60" : ""} cursor-pointer`}
            >
              <SelectValue>
                <div className="flex items-center gap-1 sm:gap-2">
                  <span className="text-base sm:text-lg">{selectedCountry.flag}</span>
                  <span className="text-xs sm:text-sm whitespace-nowrap">
                    {selectedCountry.dialCode}
                  </span>
                </div>
              </SelectValue>
            </SelectTrigger>
            <SelectContent className="max-h-[300px]">
              {countries.map((country) => (
                <SelectItem key={country.code} value={country.code}>
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{country.flag}</span>
                    <span className="text-sm font-medium">{country.dialCode}</span>
                    <span className="text-sm text-[#757575]">{country.name}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="relative flex-1">
            <input
              id={id}
              type="tel"
              value={value}
              onChange={onPhoneChange}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder={isFloating ? "000-0000" : ""}
              disabled={disabled}
              className={`w-full text-md px-4 py-2 border-2 rounded-lg outline-none transition-all duration-200 placeholder:text-sm ${
                error ? "border-[#E30018]" : isFloating ? "border-[#1a73e8]" : "border-[#E2E9F1]"
              } ${
                disabled ? "bg-[#f5f5f5] text-[#757575] cursor-not-allowed opacity-60" : "bg-white"
              }`}
            />
            <label
              htmlFor={id}
              className={`absolute left-3 transition-all duration-200 pointer-events-none ${
                isFloating
                  ? `-top-2.5 text-xs bg-white px-1 ${
                      error ? "text-[#E30018]" : disabled ? "text-[#757575]" : "text-[#1a73e8]"
                    }`
                  : "top-3 text-sm text-[#757575]"
              }`}
            >
              {label}
            </label>
          </div>
        </div>
      </div>

      <div className={`h-5 mt-1 ${!error && "hidden"}`}>
        {error && errorMessage && <p className="text-[#E30018] text-xs">{errorMessage}</p>}
      </div>
    </div>
  );
};

export default PhoneInputField;
