"use client";

import { ErrorDialog } from "@repo/shared";
import { AlertDialog as AlertDialogContainer, AlertDialogAction, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "../ui/alert-dialog";

interface AlertDialogProps {
  errorDialog: ErrorDialog | null;
  onOpenChange: (open: boolean) => void;
  confirmText?: string;
}

export default function AlertDialog({ errorDialog, onOpenChange, confirmText = "Close" }: AlertDialogProps) {

  const open = Boolean(errorDialog);

  return (
    <AlertDialogContainer open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{errorDialog?.title}</AlertDialogTitle>
          <AlertDialogDescription>{errorDialog?.message}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction
            onClick={() => {
              onOpenChange(false);
            }}
          >
            {confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialogContainer>
  );
}
