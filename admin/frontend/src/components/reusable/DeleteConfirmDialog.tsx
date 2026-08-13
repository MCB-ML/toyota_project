import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import LoadingPage from "./loadingPage";

interface DeleteConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  description?: string;
  isLoading?: boolean;
  preventCloseOnOutsideClick?: boolean;
}

const DeleteConfirmDialog = ({
  open,
  onClose,
  onConfirm,
  title = "Delete Item",
  description = "Are you sure you want to delete this item? This action cannot be undone.",
  isLoading = false,
  preventCloseOnOutsideClick = false,
}: DeleteConfirmDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent preventCloseOnOutsideClick={preventCloseOnOutsideClick} className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-[#101828]">{title}</DialogTitle>
        </DialogHeader>
        <LoadingPage isLoading={isLoading} />
        <div className="py-4">
          <p className="text-sm text-[#6a7282]">{description}</p>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            className="w-full md:w-auto cursor-pointer"
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            className="w-full md:w-auto cursor-pointer bg-red-600 hover:bg-red-700"
            disabled={isLoading}
          >
            {isLoading ? "Deleting..." : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DeleteConfirmDialog;
