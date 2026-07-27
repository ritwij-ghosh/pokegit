import type { Metadata } from "next";

import ContactForm from "@/components/ContactForm";
import { EmailIcon, GitHubIcon, LinkedInIcon } from "@/components/SocialIcons";
import { COPY } from "@/lib/copy";
import { SITE_FOUNDER } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contact — PokeGit",
  description:
    "Contact the PokeGit developer, or reach out via email, GitHub, or LinkedIn.",
};

const GITHUB_HANDLE =
  SITE_FOUNDER.github.replace(/\/$/, "").split("/").pop() ?? SITE_FOUNDER.name;
const LINKEDIN_HANDLE =
  SITE_FOUNDER.linkedin.replace(/\/$/, "").split("/").pop() ?? SITE_FOUNDER.name;

const LINKS = [
  {
    href: `mailto:${SITE_FOUNDER.email}`,
    label: COPY.footer.email,
    detail: SITE_FOUNDER.email,
    external: false,
    Icon: EmailIcon,
  },
  {
    href: SITE_FOUNDER.github,
    label: COPY.footer.github,
    detail: GITHUB_HANDLE,
    external: true,
    Icon: GitHubIcon,
  },
  {
    href: SITE_FOUNDER.linkedin,
    label: COPY.footer.linkedin,
    detail: LINKEDIN_HANDLE,
    external: true,
    Icon: LinkedInIcon,
  },
] as const;

export default function ContactPage() {
  return (
    <main className="tile-route relative flex flex-1 flex-col overflow-hidden px-4 py-10 sm:px-6 sm:py-14">
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-[28%] h-[36rem] w-[36rem]
                   -translate-x-1/2 -translate-y-1/2 rounded-full opacity-60 blur-3xl"
        style={{
          background:
            "radial-gradient(circle, var(--accent-soft) 0%, transparent 70%)",
        }}
      />

      <div className="relative mx-auto w-full max-w-5xl">
        <section className="gba-panel px-5 py-7 sm:px-8 sm:py-9">
          <span
            className="inline-flex items-center gap-2 border-2 border-[var(--border)]
                       bg-[var(--surface-raised)] px-2.5 py-1 font-display text-[0.5rem]
                       uppercase tracking-wider text-[var(--muted)]"
          >
            <span className="h-2 w-2 bg-[var(--accent)]" />
            {COPY.contact.kicker}
          </span>
          <h1 className="mt-5 font-display text-sm uppercase leading-relaxed text-[var(--foreground)] sm:text-base">
            {COPY.contact.title}
          </h1>
          <p className="mt-4 max-w-xl font-card text-base leading-relaxed tracking-normal text-[var(--muted)] sm:text-[1.0625rem] sm:leading-[1.65]">
            {COPY.contact.intro}
          </p>
        </section>

        <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,0.85fr)]">
          <section className="dex-panel">
            <h2
              className="flex items-center gap-2 border-b-2 border-[var(--border)]
                         bg-[var(--surface-raised)] px-4 py-2.5 font-display text-[0.55rem]
                         uppercase text-[var(--foreground)]"
            >
              <span
                aria-hidden
                className="h-2.5 w-2.5 shrink-0 bg-[var(--accent)]"
              />
              {COPY.contact.formTitle}
            </h2>
            <div className="p-4 sm:p-5">
              <ContactForm />
            </div>
          </section>

          <aside className="dex-panel">
            <h2
              className="flex items-center gap-2 border-b-2 border-[var(--border)]
                         bg-[var(--surface-raised)] px-4 py-2.5 font-display text-[0.55rem]
                         uppercase text-[var(--foreground)]"
            >
              <span
                aria-hidden
                className="h-2.5 w-2.5 shrink-0 bg-[var(--accent)]"
              />
              {COPY.contact.linksTitle}
            </h2>
            <div className="p-4 sm:p-5">
              <p className="font-card text-sm leading-relaxed tracking-normal text-[var(--muted)]">
                {COPY.contact.linksIntro}
              </p>
              <ul className="mt-4 space-y-3">
                {LINKS.map(({ href, label, detail, external, Icon }) => (
                  <li key={label}>
                    <a
                      href={href}
                      {...(external
                        ? { target: "_blank", rel: "noopener noreferrer" }
                        : {})}
                      className="gba-select flex items-center gap-3 border-2 border-[var(--border)]
                                 bg-[var(--surface)] px-3 py-3 text-[var(--foreground)]
                                 hover:border-[var(--accent)] hover:bg-[var(--surface-raised)]"
                    >
                      <span className="shrink-0 text-[var(--accent)]">
                        <Icon size={20} />
                      </span>
                      <span className="min-w-0">
                        <span className="block font-display text-[0.5rem] uppercase tracking-wider text-[var(--muted)]">
                          {label}
                        </span>
                        <span className="mt-1 block truncate font-card text-sm tracking-normal">
                          {detail}
                        </span>
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
