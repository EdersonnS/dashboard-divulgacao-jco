import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "md" | "sm";

const VARIANTS: Record<Variant, string> = {
  primary: "bg-marca text-white hover:bg-marca-forte disabled:opacity-40",
  secondary:
    "border border-linha-forte bg-painel text-tinta hover:bg-canvas disabled:opacity-40",
  ghost: "text-tinta-media hover:bg-canvas hover:text-tinta disabled:opacity-40",
  danger: "text-erro-ink hover:bg-erro-suave disabled:opacity-40",
};

// altura mínima 44px (alvo de toque confortável no celular)
const SIZES: Record<Size, string> = {
  md: "min-h-[44px] px-4 py-2 text-sm",
  sm: "min-h-[38px] px-3 py-1.5 text-[13px]",
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

export function Button({
  variant = "primary",
  size = "md",
  className = "",
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      className={`inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-colors disabled:cursor-not-allowed ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
    />
  );
}
