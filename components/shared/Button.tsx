import type { ButtonHTMLAttributes, ReactNode } from "react";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "dark"
  | "emerald"
  | "amber"
  | "indigo"
  | "danger";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  variant?: ButtonVariant;
  size?: "sm" | "md" | "lg";
};

export function Button({
  children,
  className = "",
  variant = "primary",
  size = "md",
  ...props
}: ButtonProps) {
  const sizeClasses = {
    sm: "px-3.5 py-1.5 text-xs rounded-xl min-h-9",
    md: "px-5 py-2.5 text-sm rounded-xl min-h-11",
    lg: "px-6 py-3.5 text-base rounded-2xl min-h-13",
  };

  const variantClasses = {
    primary:
      "bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 text-white shadow-md shadow-blue-600/20 hover:shadow-lg hover:shadow-blue-600/30 hover:brightness-105 active:scale-[0.98] border border-blue-500/30",
    secondary:
      "bg-white text-slate-700 border border-slate-200/90 shadow-2xs hover:bg-slate-50 hover:text-slate-900 active:scale-[0.98]",
    dark:
      "bg-slate-900 text-white shadow-md shadow-slate-900/30 hover:bg-slate-800 active:scale-[0.98] border border-slate-800",
    emerald:
      "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-600/20 hover:brightness-105 active:scale-[0.98] border border-emerald-500/30",
    amber:
      "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md shadow-amber-500/20 hover:brightness-105 active:scale-[0.98] border border-amber-400/30",
    indigo:
      "bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-700 text-white shadow-md shadow-indigo-600/20 hover:brightness-105 active:scale-[0.98] border border-indigo-500/30",
    danger:
      "bg-red-600 text-white shadow-md shadow-red-600/20 hover:bg-red-700 active:scale-[0.98]",
  };

  return (
    <button
      className={`inline-flex items-center justify-center font-extrabold tracking-tight transition-all duration-200 cursor-pointer select-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

