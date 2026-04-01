import { Suspense } from "react";
import AuthSplitPage from "@/components/AuthSplitPage";

export default function SignupPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AuthSplitPage initialMode="signup" />
    </Suspense>
  );
}
