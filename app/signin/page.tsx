import { Suspense } from "react";
import AuthSplitPage from "@/components/AuthSplitPage";

export default function LoginPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AuthSplitPage initialMode="signin" />
    </Suspense>
  );
}
