"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Field, FormAlert } from "@/components/common/Form";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { Logo } from "@/components/brand/Logo";


export default function ResetPasswordPage() {
  const { t } = useTranslation();
  const p = (k: string) => t(`auth.pw.${k}`);
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const bootstrap = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!mounted) return;
      setReady(Boolean(session));
    };

    bootstrap();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;
      if (event === "PASSWORD_RECOVERY") {
        setReady(true);
        return;
      }
      setReady(Boolean(session));
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  const handleResetPassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    if (newPassword.length < 6) {
      setError(p("tooShort"));
      setLoading(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError(p("mismatch"));
      setLoading(false);
      return;
    }

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) {
        setError(updateError.message);
        return;
      }

      setMessage(p("resetDone"));
      setTimeout(() => {
        router.push("/signin");
      }, 1200);
    } catch {
      setError(p("unexpected"));
    } finally {
      setLoading(false);
    }
  };

  return (
    // Rendered outside AppChrome (full-screen auth page), so it owns the <main> landmark.
    <main className="flex min-h-dvh items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-5">
        {/* Brand on the standalone reset page */}
        <Link href="/" className="inline-flex" aria-label="FutureHub home"><Logo /></Link>
        <PageHeader className="!mb-0" title={p("resetTitle")} subtitle={p("resetSubtitle")} />
        {!ready && <FormAlert tone="warning">{p("noSession")}</FormAlert>}
        {error && <FormAlert>{error}</FormAlert>}
        {message && <FormAlert tone="info">{message}</FormAlert>}

        <form onSubmit={handleResetPassword} className="space-y-4 rounded-xl border bg-card p-5 shadow-xs sm:p-6">
          <Field label={p("new")} htmlFor="new-password" hint={p("hint")}>
            <Input id="new-password" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength={6} autoComplete="new-password" />
          </Field>
          <Field label={p("confirm")} htmlFor="confirm-password">
            <Input id="confirm-password" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required minLength={6} autoComplete="new-password" />
          </Field>
          <Button type="submit" size="lg" className="w-full" disabled={loading || !ready}>
            {loading ? <Loader2 className="animate-spin" /> : null}
            {loading ? p("updating") : p("submitReset")}
          </Button>
        </form>
      </div>
    </main>
  );
}
