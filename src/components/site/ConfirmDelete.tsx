import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export function ConfirmDelete({
  onConfirm,
  label = "حذف",
  title = "هل أنت متأكد من الحذف؟",
  description = "لا يمكن التراجع عن هذه العملية.",
  confirmLabel = "نعم، احذف",
}: {
  onConfirm: () => void;
  label?: string;
  title?: string;
  description?: string;
  confirmLabel?: string;
}) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <button
          type="button"
          className="rounded-xl bg-oxblood/10 px-3 py-2 text-sm font-semibold text-oxblood"
        >
          {label}
        </button>
      </AlertDialogTrigger>
      <AlertDialogContent dir="rtl" className="max-w-[calc(100vw-2rem)] rounded-3xl sm:max-w-md">
        <AlertDialogHeader className="text-start sm:text-start">
          <AlertDialogTitle className="font-display">{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-2 sm:justify-start">
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-oxblood text-gold-soft hover:bg-oxblood/90"
          >
            {confirmLabel}
          </AlertDialogAction>
          <AlertDialogCancel>إلغاء</AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
