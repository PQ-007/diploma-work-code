import type { ReactNode } from "react";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

/** A titled group of fields on a card (docs/design-system.md → Inputs). */
export function FormSection({
  title,
  description,
  action,
  children,
  className,
}: {
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("rounded-xl border bg-card p-4 shadow-xs sm:p-6", className)}>
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-base font-semibold">{title}</h2>
          {description && <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>}
        </div>
        {action}
      </div>
      <div className="space-y-5">{children}</div>
    </section>
  );
}

/** Label above, control, then hint or error below. */
export function Field({
  label,
  htmlFor,
  required,
  hint,
  error,
  children,
  className,
}: {
  label: ReactNode;
  htmlFor?: string;
  required?: boolean;
  hint?: ReactNode;
  error?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label htmlFor={htmlFor} className="text-sm font-medium">
        {label}
        {required && <span className="ml-0.5 text-destructive" aria-hidden>*</span>}
      </Label>
      {children}
      {error ? (
        <p className="text-xs text-destructive">{error}</p>
      ) : hint ? (
        <p className="text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}

/** Sticky footer with the form's actions; sits above the phone tab bar. */
export function FormActions({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "sticky bottom-[calc(var(--bottom-nav-h)+env(safe-area-inset-bottom)+0.5rem)] z-20 flex flex-wrap items-center justify-end gap-2 rounded-xl border bg-card/95 p-3 shadow-md backdrop-blur-md md:bottom-4",
        className,
      )}
    >
      {children}
    </div>
  );
}

/** Inline alert for form-level errors and notices. */
export function FormAlert({ tone = "danger", children }: { tone?: "danger" | "warning" | "info"; children: ReactNode }) {
  return (
    <div
      role={tone === "danger" ? "alert" : "status"}
      className={cn(
        "rounded-lg border px-3 py-2.5 text-sm",
        tone === "danger" && "border-destructive/30 bg-destructive/5 text-destructive",
        tone === "warning" && "border-warning/30 bg-warning/5 text-warning",
        tone === "info" && "border-primary/25 bg-primary/5 text-foreground",
      )}
    >
      {children}
    </div>
  );
}
