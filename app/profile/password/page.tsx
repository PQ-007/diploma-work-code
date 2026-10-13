"use client";

import { useMemo, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Field, FormAlert } from "@/components/common/Form";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";


export default function ChangePasswordPage() {
  const { t } = useTranslation();
  const p = (k: string) => t(`auth.pw.${k}`);
  const supabase = useMemo(() => createClient(), []);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const handleChangePassword = async (e: React.FormEvent<HTMLFormElement>) => {
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
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user?.email) {
        setError(p("mustSignIn"));
        setLoading(false);
        return;
      }

      const { error: verifyError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
      });

      if (verifyError) {
        setError(p("wrongCurrent"));
        setLoading(false);
        return;
      }

      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) {
        setError(updateError.message);
        setLoading(false);
        return;
      }

      setMessage(p("changed"));
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch {
      setError(p("unexpected"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-md">
      <div className="w-full max-w-md space-y-5">
        {/* settings sub-page */}
        
        <PageHeader className="!mb-0" title={p("changeTitle")} subtitle={p("changeSubtitle")} />
        {error && <FormAlert>{error}</FormAlert>}
        {message && <FormAlert tone="info">{message}</FormAlert>}

        <form onSubmit={handleChangePassword} className="space-y-4 rounded-xl border bg-card p-5 shadow-xs sm:p-6">
          <Field label={p("current")} htmlFor="current-password">
            <Input id="current-password" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required autoComplete="current-password" />
          </Field>
          <Field label={p("new")} htmlFor="new-password" hint={p("hint")}>
            <Input id="new-password" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength={6} autoComplete="new-password" />
          </Field>
          <Field label={p("confirm")} htmlFor="confirm-password">
            <Input id="confirm-password" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required minLength={6} autoComplete="new-password" />
          </Field>
          <Button type="submit" size="lg" className="w-full" disabled={loading}>
            {loading ? <Loader2 className="animate-spin" /> : null}
            {loading ? p("updating") : p("submitChange")}
          </Button>
        </form>
      </div>
    </div>
  );
}
