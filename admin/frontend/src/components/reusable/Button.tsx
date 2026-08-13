import type React from "react";
import { AiOutlineLoading3Quarters } from "react-icons/ai";

type ButtonProps = {
  children: React.ReactNode;
  onClick?: () => void;
  type?: "button" | "submit" | "reset";
  variant?: "primary" | "secondary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  className?: string;
  fullWidth?: boolean;
  isLoading?: boolean;
};

const Button = ({
  children,
  onClick,
  type = "button",
  variant = "primary",
  size = "md",
  disabled = false,
  className = "",
  fullWidth = false,
  isLoading = false,
}: ButtonProps) => {
  const baseStyles =
    "font-medium rounded-lg transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2";

  const variantStyles = {
    primary: "bg-[#1a73e8] text-white hover:bg-[#1557b0] active:bg-[#0d47a1]",
    secondary: "bg-[#666] text-white hover:bg-[#555] active:bg-[#444]",
    outline:
      "bg-transparent border-2 border-[#1a73e8] text-[#1a73e8] hover:bg-[#1a73e8] hover:text-white",
    ghost: "bg-transparent text-[#1a73e8] hover:bg-[#e8f0fe]",
  };

  const sizeStyles = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2.5 text-base",
    lg: "px-6 py-3 text-lg",
  };

  const widthStyle = fullWidth ? "w-full" : "";

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || isLoading}
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${widthStyle} ${className}`}
    >
      {isLoading && <AiOutlineLoading3Quarters className="animate-spin" size={18} />}
      {isLoading ? "Loading..." : children}
    </button>
  );
};

export default Button;
