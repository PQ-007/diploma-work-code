import { Suspense } from "react";
import LoginForm from "@/components/LoginForm";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col justify-center">
      {/* Wrap login form so useSearchParams is allowed during prerender */}
      <Suspense fallback={<div />}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
