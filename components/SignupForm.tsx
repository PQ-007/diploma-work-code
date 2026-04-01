"use client";

import { useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";

export default function SignupForm() {
  const { t } = useLanguage();
  const [password, setPassword] = useState("");
  const [studentCode, setStudentCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  const handleSignup = async (e: { preventDefault: () => void }) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const normalizedCode = studentCode.trim().toLowerCase();
      if (!normalizedCode) {
        setError("Student code is required.");
        setLoading(false);
        return;
      }

      const derivedEmail = `${normalizedCode}@nmct.edu.mn`;

      const { error } = await supabase.auth.signUp({
        email: derivedEmail,
        password,
        options: {
          emailRedirectTo: `${location.origin}/auth/callback`,
          data: { studentCode: normalizedCode },
        },
      });

      if (error) {
        setError(error.message);
      } else {
        setMessage(t("auth.checkEmail"));
        // After email confirmation, user will land on /setup via middleware
      }
    } catch (error) {
      setError(t("auth.unexpectedError"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 rounded-2xl border border-border bg-card p-8 shadow-sm">
        <div>
          <h2 className="text-3xl font-bold text-foreground text-center">
            {t("auth.signUpTitle")}
          </h2>
          <p className="mt-2 text-center text-sm text-muted-foreground">
            {t("auth.signUpSubtitle")}
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

        <form onSubmit={handleSignup} className="space-y-4">
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
              placeholder="s2x...."
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Required to link your student profile.
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
              minLength={6}
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
            {loading ? (
              <span className="flex items-center">
                <svg
                  className="animate-spin -ml-1 mr-3 h-5 w-5"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                {t("auth.signingUp")}
              </span>
            ) : (
              t("auth.signUp")
            )}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          {t("auth.hasAccount")}{" "}
          <a
            href="/signin"
            className="font-medium text-primary transition duration-200 hover:opacity-80"
          >
            {t("auth.signIn")}
          </a>
        </p>
      </div>
    </div>
  );
}
