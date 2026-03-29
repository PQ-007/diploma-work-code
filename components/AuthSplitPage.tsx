"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { Github } from "lucide-react";

type AuthMode = "signin" | "signup";

interface AuthSplitPageProps {
  initialMode: AuthMode;
}

const FORM_SWITCH_DELAY_MS = 750;
const DONUT_TICK_MS = 90;
const DONUT_WIDTH = 48;
const DONUT_HEIGHT = 22;
const DONUT_SHADES = ".,-~:;=!*#$@";

function generateDonutFrame(angleA: number, angleB: number): string {
  const output = new Array<string>(DONUT_WIDTH * DONUT_HEIGHT).fill(" ");
  const zBuffer = new Array<number>(DONUT_WIDTH * DONUT_HEIGHT).fill(0);

  const cosA = Math.cos(angleA);
  const sinA = Math.sin(angleA);
  const cosB = Math.cos(angleB);
  const sinB = Math.sin(angleB);

  for (let theta = 0; theta < Math.PI * 2; theta += 0.07) {
    const cosTheta = Math.cos(theta);
    const sinTheta = Math.sin(theta);

    for (let phi = 0; phi < Math.PI * 2; phi += 0.02) {
      const cosPhi = Math.cos(phi);
      const sinPhi = Math.sin(phi);

      const circleX = 2 + cosTheta;
      const circleY = sinTheta;

      const x =
        circleX * (cosB * cosPhi + sinA * sinB * sinPhi) -
        circleY * cosA * sinB;
      const y =
        circleX * (sinB * cosPhi - sinA * cosB * sinPhi) +
        circleY * cosA * cosB;
      const z = 5 + cosA * circleX * sinPhi + circleY * sinA;

      const oneOverZ = 1 / z;
      const xProj = Math.floor(DONUT_WIDTH / 2 + 30 * oneOverZ * x);
      const yProj = Math.floor(DONUT_HEIGHT / 2 - 15 * oneOverZ * y);

      const luminance =
        cosPhi * cosTheta * sinB -
        cosA * cosTheta * sinPhi -
        sinA * sinTheta +
        cosB * (cosA * sinTheta - cosTheta * sinA * sinPhi);

      if (
        luminance > 0 &&
        xProj >= 0 &&
        xProj < DONUT_WIDTH &&
        yProj >= 0 &&
        yProj < DONUT_HEIGHT
      ) {
        const idx = xProj + DONUT_WIDTH * yProj;
        if (oneOverZ > zBuffer[idx]) {
          zBuffer[idx] = oneOverZ;
          const shadeIdx = Math.min(
            DONUT_SHADES.length - 1,
            Math.max(0, Math.floor(luminance * 8)),
          );
          output[idx] = DONUT_SHADES[shadeIdx];
        }
      }
    }
  }

  let frame = "";
  for (let row = 0; row < DONUT_HEIGHT; row += 1) {
    frame += output.slice(row * DONUT_WIDTH, (row + 1) * DONUT_WIDTH).join("");
    frame += "\n";
  }

  return frame;
}

export default function AuthSplitPage({ initialMode }: AuthSplitPageProps) {
  const { t } = useLanguage();
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [formMode, setFormMode] = useState<AuthMode>(initialMode);
  const [studentCode, setStudentCode] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [donutFrame, setDonutFrame] = useState<string>(() =>
    generateDonutFrame(0, 0),
  );

  const formSwapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const donutARef = useRef(0);
  const donutBRef = useRef(0);

  useEffect(() => {
    return () => {
      if (formSwapTimerRef.current) {
        clearTimeout(formSwapTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      donutARef.current += 0.07;
      donutBRef.current += 0.03;
      setDonutFrame(generateDonutFrame(donutARef.current, donutBRef.current));
    }, DONUT_TICK_MS);

    return () => clearInterval(timer);
  }, []);

  const setAuthMode = (nextMode: AuthMode) => {
    if (nextMode === mode) return;

    if (formSwapTimerRef.current) {
      clearTimeout(formSwapTimerRef.current);
    }

    setMode(nextMode);
    const targetPath = nextMode === "signin" ? "/signin" : "/signup";
    window.history.replaceState(window.history.state, "", targetPath);

    formSwapTimerRef.current = setTimeout(() => {
      setFormMode(nextMode);
      setError(null);
      setMessage(null);
    }, FORM_SWITCH_DELAY_MS);
  };

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    const normalizedCode = studentCode.trim().toLowerCase();
    if (!normalizedCode || !password) {
      setError(t("auth.fillAllFields"));
      setLoading(false);
      return;
    }

    const derivedEmail = `${normalizedCode}@nmct.edu.mn`;

    try {
      const { data, error: signInError } =
        await supabase.auth.signInWithPassword({
          email: derivedEmail,
          password,
        });

      if (signInError) {
        setError(signInError.message);
        return;
      }

      const userCode = data?.user?.user_metadata?.studentCode;
      if (!userCode || userCode.toLowerCase() !== normalizedCode) {
        setError("Student code does not match this account.");
        await supabase.auth.signOut();
        return;
      }

      const { data: profileRow } = await supabase
        .from("profiles")
        .select("user_name")
        .eq("id", data.user!.id)
        .single();

      router.push(profileRow?.user_name ? "/" : "/setup");
    } catch {
      setError(t("auth.unexpectedError"));
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    const normalizedCode = studentCode.trim().toLowerCase();
    if (!normalizedCode || !password) {
      setError(t("auth.fillAllFields"));
      setLoading(false);
      return;
    }

    const derivedEmail = `${normalizedCode}@nmct.edu.mn`;

    try {
      const { error: signUpError } = await supabase.auth.signUp({
        email: derivedEmail,
        password,
        options: {
          emailRedirectTo: `${location.origin}/auth/callback`,
          data: { studentCode: normalizedCode },
        },
      });

      if (signUpError) {
        setError(signUpError.message);
        return;
      }

      setMessage(t("auth.checkEmail"));
    } catch {
      setError(t("auth.unexpectedError"));
    } finally {
      setLoading(false);
    }
  };

  const isSignIn = mode === "signin";
  const isFormSignIn = formMode === "signin";

  return (
    <main className="min-h-screen bg-background p-3">
      <div className="relative mx-auto min-h-[calc(100vh-1.5rem)] overflow-hidden rounded-2xl border border-border bg-card shadow-[0_24px_90px_rgba(0,0,0,0.7)] lg:h-[calc(100vh-1.5rem)]">
        <section
          className={`relative z-20 flex min-h-[calc(100vh-1.5rem)] items-center justify-center px-6 py-10 sm:px-10 transform-gpu will-change-transform transition-transform duration-[1500ms] ease-[cubic-bezier(0.37,0,0.63,1)] lg:absolute lg:inset-y-0 lg:w-1/2 lg:min-h-0 ${
            isSignIn ? "lg:translate-x-0" : "lg:translate-x-full"
          }`}
        >
          <div className="w-full max-w-md space-y-6 transform-gpu transition-all duration-[300ms] ease-[cubic-bezier(0.37,0,0.63,1)]">
            <div className="relative inline-flex rounded-full border border-border bg-secondary p-1">
              <span
                aria-hidden
                className={`pointer-events-none absolute inset-y-1 left-1 w-[calc(50%-0.25rem)] rounded-full bg-white shadow-[0_6px_20px_rgba(255,255,255,0.15)] transform-gpu transition-transform duration-[900ms] ease-[cubic-bezier(0.37,0,0.63,1)] ${
                  isSignIn ? "translate-x-0" : "translate-x-full"
                }`}
              />
              <button
                type="button"
                onClick={() => setAuthMode("signin")}
                className={`relative z-10 rounded-full px-4 py-1.5 text-sm font-semibold transition-colors duration-500 ${
                  isFormSignIn
                    ? "bg-white text-black"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {t("auth.signIn")}
              </button>
              <button
                type="button"
                onClick={() => setAuthMode("signup")}
                className={`relative z-10 rounded-full px-4 py-1.5 text-sm font-semibold transition-colors duration-500 ${
                  !isFormSignIn
                    ? "bg-white text-black"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {t("auth.signUp")}
              </button>
            </div>

            <div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground">
                {isFormSignIn ? t("auth.welcomeBack") : t("auth.signUpTitle")}
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">
                {isFormSignIn
                  ? t("auth.signInSubtitle")
                  : t("auth.signUpSubtitle")}
              </p>
            </div>

            {error && (
              <div className="rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-200">
                {error}
              </div>
            )}
            {message && (
              <div className="rounded-lg border border-emerald-400/40 bg-emerald-400/10 p-3 text-sm text-emerald-200">
                {message}
              </div>
            )}

            <form
              onSubmit={isFormSignIn ? handleSignIn : handleSignUp}
              className="space-y-4"
            >
              <div>
                <label
                  htmlFor="student-code"
                  className="mb-2 block text-sm font-medium text-foreground"
                >
                  {t("auth.studentCodeLabel")}
                </label>
                <input
                  id="student-code"
                  type="text"
                  value={studentCode}
                  onChange={(e) => setStudentCode(e.target.value)}
                  placeholder={t("auth.studentCodePlaceholder")}
                  autoComplete="username"
                  required
                  className="block w-full rounded-lg border border-border bg-secondary px-4 py-3 text-foreground outline-none transition placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/25"
                />
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between text-sm">
                  <label
                    htmlFor="password"
                    className="font-medium text-foreground"
                  >
                    {t("auth.passwordLabel")}
                  </label>
                  {isFormSignIn && (
                    <button
                      type="button"
                      className="text-muted-foreground transition hover:text-foreground"
                    >
                      {t("auth.forgotPassword")}
                    </button>
                  )}
                </div>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t("auth.passwordPlaceholder")}
                  autoComplete={
                    isFormSignIn ? "current-password" : "new-password"
                  }
                  minLength={6}
                  required
                  className="block w-full rounded-lg border border-border bg-secondary px-4 py-3 text-foreground outline-none transition placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/25"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-white px-4 py-3 text-sm font-semibold text-black transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading
                  ? isFormSignIn
                    ? t("auth.signingIn")
                    : t("auth.signingUp")
                  : isFormSignIn
                    ? t("auth.signIn")
                    : t("auth.signUp")}
              </button>
            </form>

            <div className="relative py-1">
              <div className="absolute inset-0 flex items-center">
                <span className="h-px w-full bg-border" />
              </div>
              <p className="relative mx-auto w-max bg-card px-3 text-sm text-muted-foreground">
                {t("auth.orContinueWith")}
              </p>
            </div>

            <button
              type="button"
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-secondary px-4 py-3 text-sm font-semibold text-foreground transition hover:bg-accent"
            >
              <Github className="h-4 w-4" />
              Login with GitHub
            </button>

            <p className="text-center text-sm text-muted-foreground">
              {isFormSignIn ? t("auth.noAccount") : t("auth.hasAccount")}{" "}
              <button
                type="button"
                onClick={() => setAuthMode(isFormSignIn ? "signup" : "signin")}
                className="font-semibold text-foreground hover:text-muted-foreground"
              >
                {isFormSignIn ? t("auth.signUp") : t("auth.signIn")}
              </button>
            </p>
          </div>
        </section>

        <section
          className={`pointer-events-none relative z-40 hidden overflow-hidden border-l border-border transform-gpu will-change-transform transition-transform duration-[1500ms] ease-[cubic-bezier(0.37,0,0.63,1)] lg:absolute lg:inset-y-0 lg:block lg:w-1/2 ${
            isSignIn ? "lg:translate-x-full" : "lg:translate-x-0"
          }`}
          style={{ background: "var(--auth-right-bg)" }}
        >
          <div
            className="absolute inset-0"
            style={{ background: "var(--auth-right-overlay)" }}
          />
          <div
            className="absolute -top-20 right-10 h-64 w-64 rounded-full blur-3xl"
            style={{ backgroundColor: "var(--auth-right-orb-1)" }}
          />
          <div
            className="absolute -bottom-28 left-8 h-72 w-72 rounded-full blur-3xl"
            style={{ backgroundColor: "var(--auth-right-orb-2)" }}
          />
          <div className="absolute inset-0 opacity-25 [background-image:linear-gradient(to_right,var(--auth-right-grid)_1px,transparent_1px),linear-gradient(to_bottom,var(--auth-right-grid)_1px,transparent_1px)] [background-size:36px_36px]" />
          <div className="absolute left-7 top-10 h-3 w-3 rounded-full bg-blue-400/45 shadow-[0_0_10px_rgba(59,130,246,0.38)]" />
          <div className="absolute left-16 top-24 h-2 w-2 rounded-full bg-indigo-400/38 shadow-[0_0_8px_rgba(99,102,241,0.3)]" />
          <div className="absolute bottom-24 right-6 h-2.5 w-2.5 rounded-full bg-sky-300/38 shadow-[0_0_10px_rgba(56,189,248,0.32)]" />

          <div className="absolute inset-0 p-10">
            <div
              className="absolute left-8 top-16 z-30 w-[34%] overflow-hidden rounded-xl border p-4 shadow-[0_18px_40px_rgba(0,0,0,0.46)] backdrop-blur-md"
              style={{
                borderColor: "var(--auth-panel-border)",
                backgroundColor: "var(--auth-panel-bg)",
              }}
            >
              <svg
                viewBox="0 0 220 120"
                className="h-24 w-full"
                style={{ color: "var(--auth-panel-text)" }}
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <circle cx="34" cy="22" r="10" fill="currentColor" />
                <circle
                  cx="186"
                  cy="30"
                  r="8"
                  fill="currentColor"
                  opacity="0.7"
                />
                <circle
                  cx="114"
                  cy="98"
                  r="9"
                  fill="currentColor"
                  opacity="0.55"
                />
                <path
                  d="M44 26L176 32"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
                <path
                  d="M42 30L106 90"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  opacity="0.8"
                />
                <path
                  d="M180 36L122 92"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  opacity="0.8"
                />
                <rect
                  x="18"
                  y="52"
                  width="58"
                  height="8"
                  rx="4"
                  fill="currentColor"
                  opacity="0.45"
                />
                <rect
                  x="90"
                  y="52"
                  width="42"
                  height="8"
                  rx="4"
                  fill="currentColor"
                  opacity="0.35"
                />
                <rect
                  x="142"
                  y="52"
                  width="60"
                  height="8"
                  rx="4"
                  fill="currentColor"
                  opacity="0.25"
                />
              </svg>
            </div>

            <div
              className="absolute bottom-10 right-8 z-30 w-[28%] overflow-hidden rounded-xl border p-3 shadow-[0_18px_40px_rgba(0,0,0,0.46)] backdrop-blur-md"
              style={{
                borderColor: "var(--auth-panel-border)",
                backgroundColor: "var(--auth-panel-bg)",
              }}
            >
              <div className="mb-2 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-blue-300/55" />
                <span className="h-2 w-2 rounded-full bg-indigo-300/45" />
                <span className="h-2 w-2 rounded-full bg-sky-300/40" />
              </div>
              <div className="space-y-2">
                <div className="h-2 w-[88%] rounded-full bg-gradient-to-r from-blue-300/45 to-transparent" />
                <div className="h-2 w-[72%] rounded-full bg-gradient-to-r from-indigo-300/40 to-transparent" />
                <div className="h-2 w-[94%] rounded-full bg-gradient-to-r from-sky-300/35 to-transparent" />
                <div className="h-2 w-[60%] rounded-full bg-gradient-to-r from-blue-200/30 to-transparent" />
              </div>
            </div>

            <div
              className={`absolute right-8 top-1/2 z-50 flex h-[58%] w-[62%] -translate-y-1/2 items-center justify-center overflow-hidden rounded-2xl border shadow-[0_20px_60px_rgba(0,0,0,0.35)] backdrop-blur-sm transform-gpu transition-all duration-[1400ms] ease-[cubic-bezier(0.37,0,0.63,1)] ${
                isSignIn
                  ? "rotate-[1.5deg] opacity-100 scale-100"
                  : "rotate-[0.5deg] opacity-90 scale-[0.985]"
              }`}
              style={{
                borderColor: "var(--auth-panel-border)",
                backgroundColor: "var(--auth-panel-bg)",
              }}
            >
              <div
                className="absolute inset-0 rounded-2xl border shadow-[inset_0_0_60px_rgba(148,163,184,0.06)]"
                style={{ borderColor: "var(--auth-panel-border)" }}
              />
              <div
                className="absolute left-0 right-0 top-0 h-10"
                style={{
                  background:
                    "linear-gradient(to right, transparent, var(--auth-panel-accent), transparent)",
                }}
              />
              <div className="absolute left-4 top-3 flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-blue-300/50" />
                <span className="h-2.5 w-2.5 rounded-full bg-indigo-300/40" />
                <span className="h-2.5 w-2.5 rounded-full bg-sky-300/38" />
              </div>
              <pre
                aria-label="Rotating ASCII donut"
                className="m-0 overflow-hidden whitespace-pre p-0 text-[12px] leading-[1.02] tracking-tight"
                style={{
                  color: "var(--auth-panel-text)",
                  textShadow: "0 0 8px var(--auth-panel-accent)",
                }}
              >
                {donutFrame}
              </pre>
              <div
                className="absolute bottom-3 right-4 text-[10px] uppercase tracking-[0.22em]"
                style={{ color: "var(--auth-panel-text-soft)" }}
              >
                Runtime Render
              </div>
            </div>

            <div
              className={`absolute bottom-14 left-10 z-40 w-[62%] overflow-hidden rounded-2xl border border-white/10 bg-black/30 shadow-[0_16px_40px_rgba(0,0,0,0.35)] backdrop-blur-sm transform-gpu transition-all duration-[1500ms] ease-[cubic-bezier(0.37,0,0.63,1)] ${
                isSignIn
                  ? "translate-y-0 -rotate-[2deg] opacity-95"
                  : "translate-y-2 -rotate-[0.5deg] opacity-100"
              }`}
            >
              <div className="aspect-[4/3] p-6">
                <div
                  className="relative flex h-full w-full flex-col justify-between rounded-xl border p-5 shadow-[inset_0_0_32px_rgba(148,163,184,0.06)]"
                  style={{
                    borderColor: "var(--auth-panel-border)",
                    backgroundColor: "var(--auth-panel-bg)",
                  }}
                >
                  <div
                    className="absolute inset-x-0 top-0 h-px"
                    style={{
                      background:
                        "linear-gradient(to right, transparent, var(--auth-panel-accent), transparent)",
                    }}
                  />
                  <svg
                    viewBox="0 0 160 80"
                    className="h-12 w-24"
                    style={{ color: "var(--auth-panel-text)" }}
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    aria-hidden="true"
                  >
                    <circle cx="34" cy="40" r="10" fill="currentColor" />
                    <circle
                      cx="80"
                      cy="40"
                      r="8"
                      fill="currentColor"
                      opacity="0.7"
                    />
                    <circle
                      cx="122"
                      cy="40"
                      r="6"
                      fill="currentColor"
                      opacity="0.45"
                    />
                    <path
                      d="M16 40C30 14 52 14 66 40C80 66 102 66 116 40C126 22 140 22 148 40"
                      stroke="currentColor"
                      strokeWidth="4"
                      strokeLinecap="round"
                    />
                  </svg>

                  <p
                    className="text-base font-medium leading-relaxed drop-shadow-[0_0_12px_rgba(148,163,184,0.25)]"
                    style={{ color: "var(--auth-panel-text)" }}
                  >
                    {isSignIn
                      ? "Ad astra per aspera."
                      : "There is no magic—just abstraction layers built on top of one another."}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
