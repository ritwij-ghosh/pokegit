/**
 * A generic capture-ball motif drawn from scratch: two-tone sphere, a banded
 * equator and a diamond latch. Deliberately not the Poke Ball design - the
 * latch is a rotated square rather than a ringed circle, and the top half
 * takes the theme accent instead of red.
 *
 * Used as the loading spinner, the wordmark accent and the empty-state mark.
 */

export function DexBall({
  size = 24,
  className,
  title,
  variant = "filled",
}: {
  size?: number | string;
  className?: string;
  title?: string;
  /** Outline keeps the silhouette without the accent fill. */
  variant?: "filled" | "outline";
}) {
  const outline = variant === "outline";

  return (
    <svg
      viewBox="0 0 32 32"
      width={size}
      height={size}
      className={className}
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      {!outline && (
        <>
          <circle cx="16" cy="16" r="14" fill="var(--surface)" />
          <path d="M2 16a14 14 0 0 1 28 0Z" fill="var(--accent)" />

          {/* Stepped highlight, top-left, to read as a pixel specular. */}
          <rect x="7" y="6" width="4" height="2" fill="rgba(255,255,255,0.5)" />
          <rect x="6" y="8" width="2" height="3" fill="rgba(255,255,255,0.32)" />

          {/* The circle edge at y=14..18 is within 0.15px of vertical, so a plain
              rect matches the silhouette and the outer stroke hides the rest. */}
          <rect x="2.1" y="14" width="27.8" height="4" fill="var(--ink)" />
        </>
      )}

      <circle
        cx="16"
        cy="16"
        r="14"
        fill="none"
        stroke={outline ? "currentColor" : "var(--ink)"}
        strokeWidth={outline ? 2.25 : 3}
      />

      {outline && (
        <line
          x1="2"
          y1="16"
          x2="30"
          y2="16"
          stroke="currentColor"
          strokeWidth="2.25"
        />
      )}

      <rect
        x="11.5"
        y="11.5"
        width="9"
        height="9"
        transform="rotate(45 16 16)"
        fill={outline ? "none" : "var(--surface)"}
        stroke={outline ? "currentColor" : "var(--ink)"}
        strokeWidth={outline ? 2.25 : 2.5}
      />
    </svg>
  );
}

export function DexBallSpinner({
  size = 40,
  label,
}: {
  size?: number;
  label?: string;
}) {
  return (
    <span
      className="inline-flex items-center gap-3"
      role="status"
      aria-live="polite"
    >
      <span className="dex-ball-spin inline-flex">
        <DexBall size={size} />
      </span>
      {label && (
        <span className="text-sm text-[var(--muted)]">{label}</span>
      )}
    </span>
  );
}
