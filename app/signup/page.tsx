import { Suspense } from "react";
import AuthSplitPage from "@/components/AuthSplitPage";
import { LogoLoader } from "@/components/brand/LogoLoader";

export default function SignupPage() {
  return (
    <Suspense fallback={<LogoLoader />}>
      <AuthSplitPage initialMode="signup" />
    </Suspense>
  );
}
