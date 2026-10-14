import { Suspense } from "react";
import AuthSplitPage from "@/components/AuthSplitPage";
import { LogoLoader } from "@/components/brand/LogoLoader";

export default function LoginPage() {
  return (
    <Suspense fallback={<LogoLoader />}>
      <AuthSplitPage initialMode="signin" />
    </Suspense>
  );
}
