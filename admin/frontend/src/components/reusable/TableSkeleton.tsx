import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface TableSkeletonProps {
  columnCount: number;
  rowCount?: number;
  className?: string; // Add className prop
}

const TableSkeleton = ({ columnCount, rowCount = 5, className }: TableSkeletonProps) => {
  return (
    <div
      className={cn(
        "bg-white rounded-lg shadow w-full max-w-352 flex flex-col h-[calc(100vh-10.5rem)] md:h-[calc(100vh-12rem)] lg:h-[calc(100vh-10rem)]",
        className,
      )}
    >
      <div className="p-4 border-b border-[#e5e7eb] flex justify-between items-center">
        <div className="flex gap-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-8 w-20" />
        </div>
        <Skeleton className="h-8 w-64" />
      </div>
      <div className="p-4 space-y-4">
        {Array.from({ length: rowCount }).map((_, rowIndex) => (
          <div key={rowIndex} className="flex gap-4">
            {Array.from({ length: columnCount }).map((_, colIndex) => (
              <Skeleton
                key={colIndex}
                className={`h-12 w-1/${columnCount}`}
                style={{ width: `${100 / columnCount}%` }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default TableSkeleton;
