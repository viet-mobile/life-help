"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useHelper } from "@/lib/helper/HelperContext";
import { SupportServiceView } from "@/components/support/SupportServiceView";

export default function TechRegisterPage() {
  const router = useRouter();
  const { isLoggedIn } = useHelper();

  // If already logged in, redirect to workspace
  useEffect(() => {
    if (isLoggedIn) {
      router.replace("/tech/workspace");
    }
  }, [isLoggedIn, router]);

  return <SupportServiceView slug="job-help" initialTab="provider" />;
}
