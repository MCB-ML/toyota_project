import { Search } from "lucide-react";

type OrgChartSearchProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
};

const OrgChartSearch = ({ value, onChange, placeholder = "Search..." }: OrgChartSearchProps) => {
  return (
    <div className="w-full md:w-[300px]">
      <div className="relative glass-effect rounded-full shadow-sm bg-white/80 md:bg-white/50 backdrop-blur-md focus-within:ring-2 focus-within:ring-[#1a73e8] focus-within:bg-white">
        <div className="flex items-center px-4 py-2">
          <Search className="w-4 h-4 text-[#6a7282] mr-2 shrink-0" />
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="w-full bg-transparent border-none outline-none text-sm text-[#1b253b] placeholder:text-[#99a1af] h-6"
          />
        </div>
      </div>
    </div>
  );
};

export default OrgChartSearch;
