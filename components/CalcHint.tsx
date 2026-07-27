/**
 * Little calculation explainer that appears on hover / keyboard focus.
 * Used on base-stat rows and the BST total.
 */
export default function CalcHint({
  hint,
  children,
  placement = "above",
  className,
}: {
  hint: string;
  children: React.ReactNode;
  placement?: "above" | "below";
  className?: string;
}) {
  const position =
    placement === "above"
      ? "bottom-[calc(100%+6px)] left-0"
      : "top-[calc(100%+6px)] left-1/2 -translate-x-1/2";

  return (
    <div className={`group relative ${className ?? ""}`}>
      {children}
      <div
        role="tooltip"
        className={`pointer-events-none absolute z-20 w-max max-w-[16rem]
                    border-2 border-[var(--ink)] bg-[var(--surface)] px-2.5 py-2
                    font-card text-xs leading-relaxed tracking-normal text-[var(--foreground)]
                    opacity-0 shadow-[3px_3px_0_0_var(--shadow-hard)] transition-opacity
                    duration-100 group-hover:opacity-100 group-focus-within:opacity-100 ${position}`}
      >
        {hint}
      </div>
    </div>
  );
}
