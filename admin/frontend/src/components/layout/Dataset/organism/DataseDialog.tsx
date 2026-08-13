import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import type { CompanyAction } from "../../CompanyInfo/Company.reducer";

interface DataseDIalogProps {
  showForm: boolean;
  dispatchCompany: React.Dispatch<CompanyAction>;
  renderDatasetImport: () => React.ReactNode;
  renderButton: React.ReactNode;
}

const DataseDialog = ({
  showForm,
  dispatchCompany,
  renderDatasetImport,
  renderButton,
}: DataseDIalogProps) => {
  return (
    <Dialog
      open={showForm}
      onOpenChange={(val) => dispatchCompany({ type: "show_import", payload: val })}
    >
      <DialogContent
        className={`!w-[65%] !max-w-none h-[650px] p-0 gap-0 overflow-visible flex flex-col`}
        preventCloseOnOutsideClick={true}
      >
        <DialogHeader className="px-6 py-4 border-b border-[#e5e7eb]">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-semibold text-[#101828]">Add dataset</DialogTitle>
          </div>
        </DialogHeader>

        <div className="flex flex-col flex-1 overflow-hidden p-5 ">{renderDatasetImport()}</div>

        <DialogFooter className="px-6 py-4 border-t border-[#e5e7eb] gap-2">
          {renderButton}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DataseDialog;
