import { Plus } from "lucide-react";
import type React from "react";
import { Button } from "../ui/button";

type AddButtonProps = {
  title: string;
  onButtonClick: () => void;
  disabled?: boolean;
  icon?: React.ReactNode;
};

const AddButton = ({ title, onButtonClick, disabled = false, icon }: AddButtonProps) => {
  return (
    <Button
      className="group relative h-8 w-full md:w-auto overflow-hidden rounded-lg bg-[#1a73e8] px-6 py-1 font-medium text-white transition-all duration-300 hover:bg-[#1557b0] hover:shadow-[0_0_20px_2px_rgba(26,115,232,0.3)] active:scale-95 cursor-pointer"
      onClick={onButtonClick}
      disabled={disabled}
    >
      <div className="relative flex items-center justify-center gap-2">
        {icon ? (
          <span className="transition-all duration-300 group-hover:-translate-x-1 group-hover:opacity-100 flex items-center">
            {icon}
          </span>
        ) : (
          <Plus className="h-4 w-4 transition-all duration-300 group-hover:-translate-x-1 group-hover:opacity-100" />
        )}
        <span className="transition-transform duration-300 group-hover:translate-x-1">{title}</span>
      </div>
    </Button>
  );
};

export default AddButton;
