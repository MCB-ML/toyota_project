import type React from "react";
import { useRef, useState } from "react";
import { FaEye, FaTimes, FaTrash } from "react-icons/fa";

type ImageValue = File | string | null;

type ImageInputFieldProps = {
  id: string;
  label: string;
  value: ImageValue;
  onChangeField: (file: File | null) => void;
  deleteLogo: () => void;
  error?: boolean;
  errorMessage?: string;
  disabled?: boolean;
};

export const ImageInputField = ({
  id,
  label,
  value,
  onChangeField,
  deleteLogo,
  error = false,
  errorMessage = "",
  disabled = false,
}: ImageInputFieldProps) => {
  const [isFocused, setIsFocused] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const hasValue = Boolean(value);
  const isFloating = isFocused || hasValue;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    onChangeField(file);
  };

  const handleDelete = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    onChangeField(null);
  };

  const imageSrc =
    value instanceof File
      ? URL.createObjectURL(value)
      : value
        ? `data:image/png;base64,${value}`
        : null;

  const fileName =
    value instanceof File ? value.name : typeof value === "string" ? "Existing image" : "";

  return (
    <div className="w-full">
      <label htmlFor={id} className={`text-sm transition-all duration-200 pointer-events-none `}>
        {label}
      </label>
      <div className="relative flex border-2 rounded-lg items-center">
        <input
          ref={fileInputRef}
          id={id}
          type="file"
          accept="image/*"
          disabled={disabled}
          onChange={handleChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className={`w-full px-4 py-2 outline-none transition-all duration-200 text-sm rounded-lg 
                
                        file:mr-3 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-sm
                        file:bg-[#E2E9F1] file:text-[#1a73e8]
                        ${
                          error
                            ? "border-[#E30018]"
                            : isFloating
                              ? "border-[#1a73e8]"
                              : "border-[#E2E9F1]"
                        }
                        ${
                          disabled
                            ? "bg-[#f5f5f5] text-[#757575] cursor-not-allowed opacity-60"
                            : "bg-white"
                        }`}
        />

        {hasValue && (
          <div className="flex items-center gap-3 pr-3">
            <span className="max-w-[120px] truncate text-xs text-[#757575]">{fileName}</span>

            {!disabled && imageSrc && (
              <>
                <button
                  type="button"
                  onClick={() => setIsPreviewOpen(true)}
                  className="text-[#1a73e8] hover:underline"
                >
                  <FaEye size={14} />
                </button>

                <button
                  type="button"
                  onClick={handleDelete}
                  className="text-[#E30018] hover:text-[#f80019]"
                  title="Remove image"
                >
                  <FaTrash size={14} />
                </button>
              </>
            )}
          </div>
        )}
      </div>

      <div className={`h-5 mt-1 ${!error && "hidden"}`}>
        {error && errorMessage && <p className="text-[#E30018] text-xs">{errorMessage}</p>}
      </div>

      {isPreviewOpen && imageSrc && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={() => setIsPreviewOpen(false)}
        >
          <div
            className="relative bg-white rounded-xl p-4 max-w-[90vw] max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setIsPreviewOpen(false)}
              className="absolute top-2 right-2 text-[#757575] hover:text-[#E30018]"
            >
              <FaTimes size={18} />
            </button>

            <img
              src={imageSrc}
              alt="Preview"
              className="max-w-full max-h-[80vh] rounded-lg object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
};
