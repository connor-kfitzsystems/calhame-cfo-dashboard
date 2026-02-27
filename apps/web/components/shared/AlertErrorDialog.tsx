"use client";

import { ErrorDialog } from "@repo/shared";
import { AlertDialog as AlertDialogContainer, AlertDialogAction, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "../ui/alert-dialog";

interface AlertErrorDialogProps {
  errorDialog: ErrorDialog | null;
  setErrorDialog: React.Dispatch<React.SetStateAction<ErrorDialog | null>>;
  confirmText?: string;
}

export default function AlertErrorDialog({
  errorDialog,
  setErrorDialog,
  confirmText = "Close"
}: AlertErrorDialogProps) {

  return (
    <AlertDialogContainer
      open={!!errorDialog}
      onOpenChange={(open) => {
        if (!open) setErrorDialog(null);
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{errorDialog?.title}</AlertDialogTitle>
          <AlertDialogDescription>{errorDialog?.message}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction
            onClick={() => {
              setErrorDialog(null);
            }}
          >
            {confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialogContainer>
  );
}
