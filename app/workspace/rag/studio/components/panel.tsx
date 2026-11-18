"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/utils";

/** Glass surface used by every studio column. */
export const Panel = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => (
    <section
      ref={ref}
      className={cn(
        "relative flex min-h-0 flex-col overflow-hidden rounded-2xl border border-white/[0.07] bg-neutral-950/70 shadow-[0_1px_0_0_rgba(255,255,255,0.04)_inset,0_20px_50px_-30px_rgba(0,0,0,0.8)] backdrop-blur-xl",
        className
      )}
      {...props}
    >
      {children}
    </section>
  )
);
Panel.displayName = "Panel";

export function PanelHeader({
  title,
  subtitle,
  actions,
  className,
}: {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <header className={cn("flex items-center justify-between gap-3 px-4 pb-3 pt-4", className)}>
      <div className="min-w-0">
        <h2 className="text-[13px] font-semibold tracking-tight text-neutral-100">{title}</h2>
        {subtitle && <p className="truncate text-xs text-neutral-500">{subtitle}</p>}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-1">{actions}</div>}
    </header>
  );
}

export function Segmented<T extends string>({
  value,
  onChange,
  options,
  className,
  size = "sm",
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: React.ReactNode; title?: string }[];
  className?: string;
  size?: "sm" | "xs";
}) {
  return (
    <div className={cn("inline-flex rounded-lg border border-white/[0.07] bg-white/[0.02] p-0.5", className)} role="tablist">
      {options.map((o) => (
        <button
          key={o.value}
          role="tab"
          aria-selected={value === o.value}
          title={o.title}
          onClick={() => onChange(o.value)}
          className={cn(
            "flex flex-1 items-center justify-center gap-1.5 rounded-md font-medium transition-all",
            size === "sm" ? "px-2.5 py-1 text-xs" : "px-2 py-0.5 text-[11px]",
            value === o.value
              ? "bg-white/[0.09] text-neutral-50 shadow-[0_1px_0_0_rgba(255,255,255,0.06)_inset]"
              : "text-neutral-500 hover:text-neutral-200"
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
