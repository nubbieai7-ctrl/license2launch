/**
 * License2Launch — reusable design-system components (M1)
 * Mobile-first, accessible, professional. Built on Tailwind v4 tokens.
 */
import type {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";
import { Link } from "@tanstack/react-router";

/* ------------------------------------------------------------------ */
/* Brand / layout primitives                                           */
/* ------------------------------------------------------------------ */

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <Link
      to="/"
      className="inline-flex items-center gap-2 rounded-md l2l-focus"
      aria-label="License2Launch home"
    >
      <span className="grid size-9 place-items-center rounded-lg bg-emerald text-white font-black shadow-sm">
        L2
      </span>
      {!compact && (
        <span className="font-display text-lg font-extrabold tracking-tight text-navy">
          License<span className="text-emerald">2</span>Launch
        </span>
      )}
    </Link>
  );
}

export function Container({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`mx-auto w-full max-w-6xl px-4 sm:px-6 ${className}`}>
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Buttons                                                             */
/* ------------------------------------------------------------------ */

type ButtonVariant = "primary" | "secondary" | "ghost" | "gold" | "danger";
type ButtonSize = "sm" | "md" | "lg";

const btnBase =
  "inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-colors l2l-focus disabled:opacity-50 disabled:cursor-not-allowed";

const btnVariants: Record<ButtonVariant, string> = {
  primary: "bg-emerald text-white hover:bg-emerald-dark shadow-sm",
  secondary: "bg-navy text-white hover:bg-navy-light shadow-sm",
  gold: "bg-gold text-navy hover:bg-gold-light shadow-sm",
  ghost: "bg-transparent text-emerald hover:bg-emerald/10",
  danger: "bg-danger text-white hover:bg-danger/90 shadow-sm",
};

const btnSizes: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-4 py-2.5 text-sm",
  lg: "px-6 py-3 text-base",
};

export function Button({
  variant = "primary",
  size = "md",
  asLink,
  href,
  className = "",
  children,
  ...rest
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  asLink?: boolean;
  href?: string;
  children: ReactNode;
} & ButtonHTMLAttributes<HTMLButtonElement>) {
  const cls = `${btnBase} ${btnVariants[variant]} ${btnSizes[size]} ${className}`;
  if (asLink && href) {
    return (
      <a href={href} className={cls}>
        {children}
      </a>
    );
  }
  return (
    <button {...rest} className={cls}>
      {children}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* Card                                                                */
/* ------------------------------------------------------------------ */

export function Card({
  children,
  className = "",
  title,
  subtitle,
  icon,
}: {
  children: ReactNode;
  className?: string;
  title?: string;
  subtitle?: string;
  icon?: ReactNode;
}) {
  return (
    <div
      className={`rounded-2xl border border-mist bg-paper p-5 shadow-card ${className}`}
    >
      {(title || icon) && (
        <div className="mb-3 flex items-start gap-3">
          {icon && (
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-mist text-emerald">
              {icon}
            </span>
          )}
          <div>
            {title && <h3 className="text-lg leading-snug">{title}</h3>}
            {subtitle && <p className="text-sm text-slate-soft">{subtitle}</p>}
          </div>
        </div>
      )}
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Badge                                                               */
/* ------------------------------------------------------------------ */

type BadgeTone = "emerald" | "gold" | "navy" | "gray" | "info" | "warn" | "danger";
const badgeTones: Record<BadgeTone, string> = {
  emerald: "bg-success-bg text-success",
  gold: "bg-warn-bg text-warn",
  navy: "bg-navy/10 text-navy",
  gray: "bg-mist text-slate-soft",
  info: "bg-info-bg text-info",
  warn: "bg-warn-bg text-warn",
  danger: "bg-danger-bg text-danger",
};

export function Badge({
  children,
  tone = "gray",
  className = "",
}: {
  children: ReactNode;
  tone?: BadgeTone;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${badgeTones[tone]} ${className}`}
    >
      {children}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* ProgressBar                                                         */
/* ------------------------------------------------------------------ */

export function ProgressBar({
  value,
  max = 100,
  className = "",
  label,
}: {
  value: number;
  max?: number;
  className?: string;
  label?: string;
}) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  return (
    <div className={className}>
      {label && (
        <div className="mb-1 flex items-center justify-between text-sm">
          <span className="font-medium text-navy">{label}</span>
          <span className="text-slate-soft">{Math.round(pct)}%</span>
        </div>
      )}
      <div
        className="h-2 w-full overflow-hidden rounded-full bg-mist"
        role="progressbar"
        aria-valuenow={Math.round(pct)}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="h-full rounded-full bg-emerald transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Form primitives                                                     */
/* ------------------------------------------------------------------ */

export function Field({
  label,
  htmlFor,
  hint,
  error,
  children,
}: {
  label: string;
  htmlFor?: string;
  hint?: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1">
      <label htmlFor={htmlFor} className="block text-sm font-semibold text-navy">
        {label}
      </label>
      {children}
      {hint && !error && <p className="text-xs text-slate-soft">{hint}</p>}
      {error && <p className="text-xs font-medium text-danger">{error}</p>}
    </div>
  );
}

const inputCls =
  "w-full rounded-lg border border-slate-soft/30 bg-white px-3 py-2.5 text-base text-ink placeholder:text-slate-soft/70 l2l-focus focus:border-emerald";

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${inputCls} ${props.className ?? ""}`} />;
}

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea {...props} className={`${inputCls} min-h-24 ${props.className ?? ""}`} />
  );
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={`${inputCls} ${props.className ?? ""}`} />;
}

export function Checkbox({
  label,
  className = "",
  ...rest
}: { label?: ReactNode } & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className={`flex items-start gap-2.5 ${className}`}>
      <input
        type="checkbox"
        className="mt-1 size-4 shrink-0 accent-emerald l2l-focus"
        {...rest}
      />
      {label && <span className="text-sm text-ink">{label}</span>}
    </label>
  );
}

/* ------------------------------------------------------------------ */
/* Typography + info                                                   */
/* ------------------------------------------------------------------ */

export function SectionHeading({
  title,
  subtitle,
  className = "",
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <h2 className="text-2xl font-bold tracking-tight text-navy sm:text-3xl">
        {title}
      </h2>
      {subtitle && <p className="mt-1.5 text-slate-soft">{subtitle}</p>}
    </div>
  );
}

export const DISCLAIMER_TEXT =
  "This information is for general educational purposes. Requirements vary by location and may change. Confirm current requirements with the appropriate government agency and qualified professionals.";

export function Disclaimer({ className = "" }: { className?: string }) {
  return (
    <div
      className={`rounded-xl border border-warn/30 bg-warn-bg px-4 py-3 text-sm text-warn ${className}`}
    >
      {DISCLAIMER_TEXT}
    </div>
  );
}

export function SampleBadge() {
  return <Badge tone="gold">Sample data</Badge>;
}
