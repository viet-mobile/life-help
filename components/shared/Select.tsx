import type { SelectHTMLAttributes } from "react";
export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={`min-h-12 rounded-xl border border-slate-300 bg-white px-4 outline-none focus:border-blue-600 ${props.className ?? ""}`}
      {...props}
    />
  );
}
