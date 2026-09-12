import type { InputHTMLAttributes } from "react";
export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4 outline-none focus:border-blue-600 ${props.className ?? ""}`}
      {...props}
    />
  );
}
