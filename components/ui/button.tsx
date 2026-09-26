import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg" | "icon";

export function buttonStyles({ variant = "primary", size = "md", className }: { variant?: ButtonVariant; size?: ButtonSize; className?: string } = {}) {
  return cn(
    "inline-flex items-center justify-center gap-2 rounded-[0.7rem] font-black select-none disabled:pointer-events-none disabled:opacity-55",
    {
      "bg-bal text-white hover:bg-ink": variant === "primary",
      "bg-ink text-white hover:bg-bal": variant === "secondary",
      "border border-line bg-white text-ink hover:border-bal/45 hover:bg-bal-soft": variant === "outline",
      "text-muted hover:bg-bal-soft hover:text-ink": variant === "ghost",
      "bg-red-700 text-white hover:bg-red-800": variant === "danger",
      "h-9 px-3 text-xs": size === "sm",
      "h-11 px-4 text-sm": size === "md",
      "h-12 px-6 text-base": size === "lg",
      "size-10 p-0": size === "icon",
    },
    className,
  );
}

export function Button({ className, variant, size, type = "button", ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant; size?: ButtonSize }) {
  return <button type={type} className={buttonStyles({ variant, size, className })} {...props} />;
}
