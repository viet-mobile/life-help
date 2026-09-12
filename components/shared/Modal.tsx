import type { ReactNode } from "react";
export function Modal({ children, title }: { children: ReactNode; title: string }) {
  return (
    <div aria-modal="true" role="dialog" className="rounded-2xl bg-white p-6 shadow-xl">
      <h2 className="text-lg font-bold">{title}</h2>
      <div className="mt-4">{children}</div>
    </div>
  );
}
