"use client";

import { GrainGradient } from "@paper-design/shaders-react";
import { useState, useEffect, type ReactNode, type FormEvent } from "react";
import { Link } from "react-router-dom";

type AuthMode = "login" | "signup";

interface AuthSectionProps {
  mode: AuthMode;
  onSubmit: (data: {
    email: string;
    password: string;
    confirmPassword?: string;
  }) => Promise<void>;
  onGoogle: () => Promise<void>;
  loading: boolean;
  googleLoading: boolean;
  error: string;
}

export default function AuthSection({
  mode,
  onSubmit,
  onGoogle,
  loading,
  googleLoading,
  error,
}: AuthSectionProps) {
  const isSignup = mode === "signup";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    void onSubmit({ email, password, confirmPassword });
  };

  return (
    <section className="min-h-screen bg-white p-3 text-black antialiased [font-synthesis:none] dark:bg-[#050505] dark:text-white pb-24">
      <div className="grid min-h-[calc(100vh-1.5rem)] gap-6 lg:grid-cols-[0.94fr_1.06fr]">
        <div className="relative flex items-center overflow-hidden rounded-md border border-black/20 bg-white px-6 py-12 sm:px-10 dark:border-white/10 dark:bg-[#0a0a0a] lg:items-start lg:px-14 lg:py-28 xl:px-20">
          
          {/* Mobile top animation */}
          <div className="absolute left-0 top-0 h-[400px] w-full pointer-events-none lg:hidden opacity-60 dark:opacity-80">
            <GrainGradient
              speed={1}
              scale={1}
              rotation={0}
              offsetX={0}
              offsetY={0}
              softness={0.5}
              intensity={0.5}
              noise={0.25}
              shape="corners"
              frame={2854.5}
              colors={["#FFFFFF", "#FC7819", "#FC7819", "#FFFFFF"]}
              colorBack="#00000000"
              className="absolute inset-0"
            />
            {/* Fade out mask */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/50 to-white dark:via-[#0a0a0a]/50 dark:to-[#0a0a0a]" />
          </div>

          <div className="relative z-10 mx-auto w-full max-w-[590px]">
            <div>
              <h1 className="whitespace-nowrap text-3xl font-medium tracking-[-0.04em] sm:text-4xl lg:text-[42px] lg:leading-[1.05] xl:text-[50px]">
                {isSignup ? "Create an account" : "Welcome back"}
              </h1>
              <p className="mt-3 text-lg leading-snug text-black/60 dark:text-white/55 sm:text-xl lg:text-2xl xl:text-3xl">
                {isSignup
                  ? "Join GIKI Chronicles"
                  : "Sign in to continue"}
              </p>
            </div>

            <div className="mt-12">
              <SocialButton
                icon={<GoogleIcon />}
                label={isSignup ? "Sign up with Google" : "Sign in with Google"}
                onClick={() => void onGoogle()}
                disabled={googleLoading || loading}
                loading={googleLoading}
              />
            </div>

            <div className="my-10 text-center text-xl font-medium text-black/60 dark:text-white/50">
              or
            </div>

            <form className="space-y-5" onSubmit={handleSubmit}>
              <FieldBox
                label="Email"
                value={email}
                onChange={setEmail}
                type="email"
                required
              />
              <FieldBox
                label="Password"
                value={password}
                onChange={setPassword}
                type="password"
                required
              />
              {isSignup && (
                <FieldBox
                  label="Confirm Password"
                  value={confirmPassword}
                  onChange={setConfirmPassword}
                  type="password"
                  required
                />
              )}

              {error && (
                <div className="rounded-[10px] border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                  {error}
                </div>
              )}

              {isSignup && (
                <div className="space-y-4 pt-2 text-sm leading-5 text-black/30 dark:text-white/35 sm:text-[15px]">
                  <CheckboxLine>
                    I don&apos;t want to receive emails about feature updates
                  </CheckboxLine>
                  <CheckboxLine>
                    By creating an account, you agree to our{" "}
                    <span className="font-medium text-black/45 underline underline-offset-2 dark:text-white/45">
                      Terms and Services
                    </span>{" "}
                    and{" "}
                    <span className="font-medium text-black/45 underline underline-offset-2 dark:text-white/45">
                      Privacy Policy
                    </span>
                  </CheckboxLine>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || googleLoading}
                className="mt-9 flex h-12 w-full items-center justify-center rounded-[10px] border border-black/40 bg-black text-xl font-medium text-white transition-colors hover:bg-black/85 disabled:opacity-60 dark:border-white/40 dark:bg-white dark:text-black dark:hover:bg-white/85"
              >
                {loading
                  ? isSignup
                    ? "Creating..."
                    : "Signing in..."
                  : isSignup
                    ? "Submit"
                    : "Sign in"}
              </button>
            </form>

            <p className="mt-8 text-center text-sm text-black/50 dark:text-white/45">
              {isSignup ? (
                <>
                  Already have an account?{" "}
                  <Link
                    to="/login"
                    className="font-medium text-black underline underline-offset-2 dark:text-white"
                  >
                    Log in
                  </Link>
                </>
              ) : (
                <>
                  Don&apos;t have an account?{" "}
                  <Link
                    to="/signup"
                    className="font-medium text-black underline underline-offset-2 dark:text-white"
                  >
                    Sign up
                  </Link>
                </>
              )}
            </p>
          </div>
        </div>

        <div className="hidden lg:flex relative overflow-hidden rounded-md bg-black p-8 text-white sm:p-12 lg:min-h-0">
          <GrainGradient
            speed={1}
            scale={1}
            rotation={0}
            offsetX={0}
            offsetY={0}
            softness={0.5}
            intensity={0.5}
            noise={0.25}
            shape="corners"
            frame={2854.5}
            colors={["#FFFFFF", "#FC7819", "#FC7819", "#FFFFFF"]}
            colorBack="#00000000"
            className="absolute inset-0 bg-black"
          />

          <div className="relative z-10 flex h-full w-full flex-col justify-between">
            <h2 className="max-w-[620px] pt-0 text-5xl font-medium tracking-[-0.05em] text-white sm:text-6xl lg:pt-16 lg:text-[64px] lg:leading-[0.98] xl:text-[70px]">
              To Create,
              <br />
              Is to live twice
            </h2>

            <Link
              to="/"
              className="mb-0 inline-flex h-12 max-w-full items-center gap-3 rounded-[10px] border border-white/25 px-5 text-base font-medium text-white/85 backdrop-blur-sm transition-colors hover:border-white/45 hover:text-white xl:mb-32 xl:px-6 xl:text-2xl"
            >
              <span className="truncate whitespace-nowrap">
                Welcome to GIKI Chronicles
              </span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function SocialButton({
  icon,
  label,
  onClick,
  disabled,
  loading,
}: {
  icon: ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex h-10 w-full items-center justify-center gap-2 rounded-[10px] border border-black/25 bg-white px-3 text-sm leading-none text-black transition-colors hover:bg-black/[0.03] disabled:opacity-60 dark:border-white/20 dark:bg-white/5 dark:text-white dark:hover:bg-white/10 xl:text-[19px]"
    >
      {loading ? (
        <span className="size-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
      ) : (
        <span className="shrink-0">{icon}</span>
      )}
      <span className="whitespace-nowrap">{label}</span>
    </button>
  );
}

function FieldBox({
  label,
  value,
  onChange,
  type = "text",
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
}) {
  const [isFocused, setIsFocused] = useState(false);
  const showLabel = !isFocused && !value;

  return (
    <label className="flex h-14 items-center justify-between gap-4 rounded-[10px] border border-black/25 bg-white px-5 text-lg leading-none dark:border-white/15 dark:bg-white/5 xl:text-xl">
      <input
        type={type}
        value={value}
        required={required}
        aria-label={label}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        onChange={(event) => onChange(event.target.value)}
        className="min-w-0 flex-1 truncate bg-transparent text-black outline-none placeholder:text-black/30 dark:text-white dark:placeholder:text-white/35"
        placeholder={isFocused ? label : ""}
      />
      {showLabel && (
        <span className="shrink-0 text-black dark:text-white">{label}</span>
      )}
    </label>
  );
}

function CheckboxLine({ children }: { children: ReactNode }) {
  return (
    <label className="flex items-start gap-3">
      <span className="relative mt-1 size-3.5 shrink-0">
        <input
          type="checkbox"
          className="peer size-full appearance-none rounded-[2px] border border-black/25 bg-white checked:border-black checked:bg-black dark:border-white/30 dark:bg-white/5 dark:checked:border-white dark:checked:bg-white"
        />
        <svg
          viewBox="0 0 12 12"
          className="pointer-events-none absolute inset-0 hidden size-full p-0.5 text-white peer-checked:block dark:text-black"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M3 6.2 5 8.1 9 3.9"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      <span>{children}</span>
    </label>
  );
}

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09Z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23Z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.84Z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84C6.71 7.3 9.14 5.38 12 5.38Z"
        fill="#EB4335"
      />
    </svg>
  );
}
