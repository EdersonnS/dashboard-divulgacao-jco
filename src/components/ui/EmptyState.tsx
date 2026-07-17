import type { ReactNode } from "react";

interface EmptyStateProps {
  title: string;
  description?: string;
  action?: ReactNode;
  tone?: "default" | "error";
}

export function EmptyState({
  title,
  description,
  action,
  tone = "default",
}: EmptyStateProps) {
  const toneClass =
    tone === "error" ? "border-erro/20 bg-erro-suave" : "border-linha bg-painel";
  return (
    <div
      className={`flex flex-col items-center justify-center rounded-lg border border-dashed px-6 py-12 text-center ${toneClass}`}
    >
      <p className="text-sm font-medium">{title}</p>
      {description && (
        <p className="text-tinta-fraca mt-1 max-w-md text-sm">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
