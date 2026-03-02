"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import Link from "next/link";
import { useLanguage } from "@/contexts/LanguageContext";

export default function LoginForm() {
  const { t } = useLanguage();
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [studentCode, setStudentCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const supabase = createClient();

  const handleStudentPasswordSignIn = async (e: {
    preventDefault: () => void;
  }) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    const normalizedCode = studentCode.trim().toLowerCase();
    if (!normalizedCode || !password) {
      setError("Student code and password are required.");
      setLoading(false);
      return;
    }

    const derivedEmail = `${normalizedCode}@nmct.edu.mn`;

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: derivedEmail,
        password,
      });

      if (error) {
        setError(error.message);
      } else {
        const userCode = data?.user?.user_metadata?.studentCode;
        if (!userCode || userCode.toLowerCase() !== normalizedCode) {
          setError(t("auth.studentCodeMismatch"));
          await supabase.auth.signOut();
        } else {
          // Check if profile exists in the DB table
          const { data: profileRow } = await supabase
            .from("profiles")
            .select("user_name")
            .eq("id", data.user!.id)
            .single();

          const hasProfile = !!profileRow?.user_name;
          router.push(hasProfile ? "/" : "/setup");
        }
      }
    } catch (err) {
      setError(t("auth.unexpectedError"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 rounded-2xl border border-border bg-card p-8 shadow-sm">
        <div>
          <h2 className="text-3xl font-bold text-foreground text-center suppressHydrationWarning">
            {t("auth.welcomeBack")}
          </h2>
          <p className="mt-2 text-center text-sm text-muted-foreground">
            {t("auth.signInSubtitle")}
          </p>
        </div>

        {error && (
          <div className="animate-fade-in rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-destructive">
            {error}
          </div>
        )}

        {message && (
          <div className="animate-fade-in rounded-lg border border-border bg-muted p-4 text-foreground">
            {message}
          </div>
        )}

        <form onSubmit={handleStudentPasswordSignIn} className="space-y-4">
          <div>
            <label
              htmlFor="student-code"
              className="block text-sm font-medium text-foreground"
            >
              Student code
            </label>
            <input
              id="student-code"
              type="text"
              value={studentCode}
              onChange={(e) => setStudentCode(e.target.value)}
              required
              className="mt-1 block w-full rounded-lg border border-input bg-background px-4 py-3 text-foreground shadow-sm outline-none transition duration-200 placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring"
              placeholder="e.g. s2x...."
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Use the code provided by your institution.
            </p>
          </div>
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-foreground"
            >
              {t("auth.passwordLabel")}
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="mt-1 block w-full rounded-lg border border-input bg-background px-4 py-3 text-foreground shadow-sm outline-none transition duration-200 placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring"
              placeholder={t("auth.passwordPlaceholder")}
              aria-describedby="password-error"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="flex w-full justify-center rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition duration-200 hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          {t("auth.noAccount")}{" "}
          <Link
            href="/signup"
            className="font-medium text-primary hover:opacity-80 transition duration-200"
          >
            {t("auth.signUp")}
          </Link>
        </p>
      </div>
    </div>
  );
}
