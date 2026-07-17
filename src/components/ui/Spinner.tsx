export function Spinner({ className = "" }: { className?: string }) {
  return (
    <span
      role="status"
      aria-label="Carregando"
      className={`border-linha-forte border-t-tinta inline-block h-4 w-4 animate-spin rounded-full border-2 ${className}`}
    />
  );
}

export function LoadingBlock({ label = "Carregando..." }: { label?: string }) {
  return (
    <div className="text-tinta-fraca flex items-center gap-3 py-10 font-mono text-xs">
      <Spinner />
      {label}
    </div>
  );
}
