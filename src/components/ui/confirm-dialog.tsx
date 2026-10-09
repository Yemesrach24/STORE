"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Info, CheckCircle, X } from "lucide-react";
import { useLanguage } from "@/components/i18n/LanguageProvider";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "warning" | "info" | "success";
  loading?: boolean;
  /** When true, hides the Cancel button and shows only the primary action — for alert()-style single-acknowledgement dialogs. */
  hideCancel?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel,
  cancelLabel,
  variant = "warning",
  loading = false,
  hideCancel = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const { t } = useLanguage();

  // Close on Escape so the dialog can never get stuck open.
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onCancel]);

  if (!open) return null;

  const iconMap = {
    danger: <AlertTriangle className="h-6 w-6 text-red-600" />,
    warning: <AlertTriangle className="h-6 w-6 text-amber-600" />,
    info: <Info className="h-6 w-6 text-blue-600" />,
    success: <CheckCircle className="h-6 w-6 text-green-600" />,
  };
  const bgMap = {
    danger: "bg-red-100",
    warning: "bg-amber-100",
    info: "bg-blue-100",
    success: "bg-green-100",
  };
  const btnVariant = variant === "danger" ? "destructive" : "default";
  const btnClass =
    variant === "danger"
      ? ""
      : variant === "success"
      ? "bg-green-600 hover:bg-green-700 text-white"
      : "";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4" onClick={onCancel}>
      <div
        className="bg-white rounded-xl p-6 w-full max-w-sm shadow-xl space-y-4"
        onClick={(e) => e.stopPropagation()}
        role="alertdialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="flex items-start gap-3">
          <div className={`p-2 rounded-full ${bgMap[variant]}`}>
            {iconMap[variant]}
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-lg text-gray-900">{title}</h3>
            <p className="text-sm text-gray-500 mt-1">{message}</p>
          </div>
          <button
            type="button"
            aria-label={t("close")}
            onClick={(e) => {
              e.stopPropagation();
              onCancel();
            }}
            className="text-gray-400 hover:text-gray-600 p-1 -m-1 rounded-md hover:bg-gray-100 transition-colors shrink-0"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="flex gap-2 justify-end pt-2">
          {!hideCancel && (
            <Button variant="outline" size="sm" onClick={onCancel} disabled={loading}>
              {cancelLabel ?? t("cancel")}
            </Button>
          )}
          <Button
            variant={btnVariant as any}
            size="sm"
            className={btnClass}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? t("processing") : (confirmLabel ?? t("confirm"))}
          </Button>
        </div>
      </div>
    </div>
  );
}
