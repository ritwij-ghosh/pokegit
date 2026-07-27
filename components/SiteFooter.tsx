import { EmailIcon, GitHubIcon, LinkedInIcon } from "@/components/SocialIcons";
import { COPY } from "@/lib/copy";
import { SITE_FOUNDER } from "@/lib/site";

/** Site-wide credit strip — quiet chrome, mirrors the header border treatment. */
export default function SiteFooter() {
  return (
    <footer className="mt-auto border-t-[3px] border-[var(--ink)] bg-[var(--surface)]">
      <div
        className="mx-auto flex w-full max-w-7xl flex-col items-center justify-between
                   gap-3 px-4 py-4 text-center sm:flex-row sm:items-center
                   sm:text-left sm:px-6"
      >
        <div className="flex min-w-0 flex-col items-center gap-2 sm:flex-row sm:items-center sm:gap-4">
          <p className="font-card text-sm leading-relaxed tracking-normal text-[var(--muted)]">
            {COPY.footer.creditPrefix}{" "}
            <span className="text-[var(--foreground)]">{SITE_FOUNDER.name}</span>
          </p>
          <nav
            aria-label={COPY.footer.navLabel}
            className="flex shrink-0 items-center gap-2.5"
          >
            <a
              href={`mailto:${SITE_FOUNDER.email}`}
              aria-label={COPY.footer.email}
              title={SITE_FOUNDER.email}
              className="text-[var(--muted)] transition-colors hover:text-[var(--foreground)]"
            >
              <EmailIcon />
            </a>
            <a
              href={SITE_FOUNDER.github}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={COPY.footer.github}
              title={COPY.footer.github}
              className="text-[var(--muted)] transition-colors hover:text-[var(--foreground)]"
            >
              <GitHubIcon />
            </a>
            <a
              href={SITE_FOUNDER.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={COPY.footer.linkedin}
              title={COPY.footer.linkedin}
              className="text-[var(--muted)] transition-colors hover:text-[var(--foreground)]"
            >
              <LinkedInIcon />
            </a>
          </nav>
        </div>

        <p className="shrink-0 font-card text-xs tracking-normal text-[var(--muted)] sm:text-right">
          {COPY.brand.footer}
        </p>
      </div>
    </footer>
  );
}
