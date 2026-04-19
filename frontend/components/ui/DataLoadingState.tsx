"use client";

interface DataLoadingStateProps {
  title?: string;
  subtitle?: string;
  className?: string;
  compact?: boolean;
}

export default function DataLoadingState({
  title = "Loading data",
  subtitle = "Please wait while we retrieve the latest information.",
  className = "",
  compact = false,
}: DataLoadingStateProps) {
  const paddingClassName = compact ? "p-4" : "p-6";

  return (
    <div className={`soft-surface rounded-xl border-[#dce9e1] bg-[#fcfffd] ${paddingClassName} ${className}`.trim()}>
      <div className="flex items-center gap-2">
        <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-[#1a7b3a]" />
        <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-[#2f8f59]" />
        <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-[#72b58b]" />
      </div>

      <p className="mt-3 text-xs font-black uppercase tracking-[0.16em] text-[#1a7b3a]">{title}</p>
      <p className="mt-1 text-sm text-[#607267]">{subtitle}</p>

      <div className="mt-4 space-y-2">
        <div className="h-2.5 w-11/12 animate-pulse rounded-full bg-[#deebe3]" />
        <div className="h-2.5 w-3/4 animate-pulse rounded-full bg-[#deebe3]" />
      </div>
    </div>
  );
}
