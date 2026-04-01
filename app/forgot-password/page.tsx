import { Suspense } from "react";
import AuthSplitPage from "@/components/AuthSplitPage";

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AuthSplitPage initialMode="signin" />
    </Suspense>
  );
}
