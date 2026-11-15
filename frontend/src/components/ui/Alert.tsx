import { cn } from "@/lib/cn";

const tonos = {
  error: "border-red-200 bg-red-50 text-red-800",
  success: "border-emerald-200 bg-emerald-50 text-emerald-800",
} as const;

export function Alert({
  tone = "error",
  message,
  onClose,
}: {
  tone?: keyof typeof tonos;
  message: string;
  onClose?: () => void;
}) {
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={cn("flex items-start justify-between gap-3 rounded-lg border px-3 py-2 text-sm", tonos[tone])}
    >
      <p>{message}</p>
      {onClose && (
        <button type="button" onClick={onClose} className="shrink-0 opacity-60 hover:opacity-100" aria-label="Cerrar">
          ✕
        </button>
      )}
    </div>
  );
}
