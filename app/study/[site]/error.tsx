"use client";

import { useEffect } from "react";
import { useSite } from "@/components/learn/LearnerProvider";

/** Error boundary inside the learning layout: uses the learner's own dictionary (the layout and its provider stay mounted). */
export default function StudyError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  const { t, href } = useSite();
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <div className="l-wrap l-stack" role="alert">
      <div className="l-panel l-panel-reveal">{t("lesson.error")}</div>
      <button type="button" className="l-btn l-btn-block" onClick={() => retry()}>{t("lesson.error.retry")}</button>
      <a className="l-btn l-btn-ghost l-btn-block" href={href("/")}>{t("result.home")}</a>
    </div>
  );
}
