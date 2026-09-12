import type { ButtonHTMLAttributes, ReactNode } from "react";
type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  variant?: "primary" | "secondary" | "dark";
};
export function Button({ children, className = "", variant = "primary", ...props }: ButtonProps) {
  const variants = {
    primary: "bg-blue-700 text-white hover:bg-blue-800",
    secondary: "bg-blue-50 text-blue-800 hover:bg-blue-100",
    dark: "bg-slate-900 text-white hover:bg-slate-800",
  };
  return (
    <button
      className={`min-h-12 rounded-xl px-5 py-3 font-bold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700 ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
