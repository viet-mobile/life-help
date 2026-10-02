import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAppEnv } from "@/lib/env";
import "./study.css";

export const metadata: Metadata = { title: "Learning sites (staging)", robots: { index: false, follow: false } };

/**
 * Staging/local chooser for hosts that cannot use math./english. subdomains
 * (e.g. *.workers.dev). It does not exist in production.
 */
export default function StudyIndex() {
  if (getAppEnv() === "production") notFound();
  return (
    <div className="study-root" data-site="math">
      <div className="l-wrap l-stack">
        <h1 className="l-h1">Learning sites · {getAppEnv()}</h1>
        <p className="l-muted">This page only exists outside production.</p>
        <Link className="l-btn l-btn-block" href="/study/math">Math</Link>
        <Link className="l-btn l-btn-ghost l-btn-block" href="/study/english">English</Link>
      </div>
    </div>
  );
}
