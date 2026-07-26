import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

import PokeCard from "@/components/PokeCard";
import StatBar from "@/components/StatBar";
import { TypeBadge } from "@/components/TypeSymbol";
import { dexNumber } from "@/lib/dex";
import { generateFlavorText } from "@/lib/flavor-text";
import { GitHubError, UserNotFoundError } from "@/lib/github";
import { getPokeGitProfile } from "@/lib/profile";
import type { PokeGitProfile } from "@/lib/types";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ username: string }> };

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { username } = await params;
  return {
    title: `${decodeURIComponent(username)} — PokeGit`,
    description: `Pokedex entry for the GitHub profile ${decodeURIComponent(username)}.`,
  };
}

const STAT_ROWS = [
  { key: "hp", abbreviation: "HP", label: "HP", hint: "Total contributions, past year" },
  { key: "attack", abbreviation: "ATK", label: "Attack", hint: "Total commit count" },
  { key: "defense", abbreviation: "DEF", label: "Defense", hint: "Code reviews given" },
  {
    key: "spAttack",
    abbreviation: "SP.ATK",
    label: "Sp. Attack",
    hint: "Stars earned plus top single-repo reach",
  },
  {
    key: "spDefense",
    abbreviation: "SP.DEF",
    label: "Sp. Defense",
    hint: "Follower count",
  },
  {
    key: "speed",
    abbreviation: "SPE",
    label: "Speed",
    hint: "Issue turnaround and issue volume",
  },
] as const;

const number = (value: number) => value.toLocaleString("en-US");

function Panel({
  title,
  children,
  className,
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 ${className ?? ""}`}
    >
      <h2 className="mb-4 font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--muted)]">
        {title}
      </h2>
      {children}
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-[var(--border)] py-2 last:border-0">
      <span className="text-sm text-[var(--muted)]">{label}</span>
      <span className="font-mono text-sm tabular-nums">{value}</span>
    </div>
  );
}

function ErrorState({ title, detail }: { title: string; detail: string }) {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-2xl font-semibold">{title}</h1>
      <p className="max-w-md text-sm leading-relaxed text-[var(--muted)]">{detail}</p>
      <Link
        href="/"
        className="mt-2 rounded-lg border border-[var(--border)] px-4 py-2 font-mono text-xs
                   text-[var(--muted)] transition hover:text-[var(--foreground)]"
      >
        ← back to search
      </Link>
    </main>
  );
}

export default async function PokedexEntryPage({ params }: PageProps) {
  const { username } = await params;
  const login = decodeURIComponent(username);

  let profile: PokeGitProfile;
  try {
    profile = await getPokeGitProfile(login);
  } catch (error) {
    if (error instanceof UserNotFoundError) notFound();
    if (error instanceof GitHubError) {
      return (
        <ErrorState
          title="Could not scan that profile"
          detail={error.message}
        />
      );
    }
    throw error;
  }

  const flavor = await generateFlavorText(profile);
  const { stats, typing, ability, signals, raw } = profile;
  const accent = typing.color;

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-10">
      <div className="mb-8 flex items-center justify-between">
        <Link
          href="/"
          className="font-mono text-xs text-[var(--muted)] transition hover:text-[var(--foreground)]"
        >
          ← pokegit
        </Link>
        <a
          href={`https://github.com/${profile.profile.login}`}
          target="_blank"
          rel="noreferrer"
          className="font-mono text-xs text-[var(--muted)] transition hover:text-[var(--foreground)]"
        >
          view on github ↗
        </a>
      </div>

      {/* Hero -------------------------------------------------------------- */}
      <header className="rise flex flex-col gap-6 sm:flex-row sm:items-center">
        <div
          className="relative h-24 w-24 shrink-0 overflow-hidden rounded-2xl border-2"
          style={{ borderColor: `${accent}66` }}
        >
          <Image
            src={profile.profile.avatarUrl}
            alt={`${profile.profile.login} avatar`}
            fill
            sizes="96px"
            className="object-cover"
            unoptimized
          />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-3">
            <span className="font-mono text-xs text-[var(--muted)]">
              NO. {dexNumber(profile.profile.login)}
            </span>
            <span className="h-px flex-1 bg-[var(--border)]" />
          </div>
          <h1 className="mt-1 truncate text-4xl font-bold tracking-tight">
            {profile.profile.login}
          </h1>
          <p className="mt-1 text-sm text-[var(--muted)]">
            {profile.profile.name ?? "Unnamed species"} ·{" "}
            {signals.accountAgeYears.toFixed(1)} years in the wild
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <TypeBadge type={typing.primary} />
            {typing.secondary && <TypeBadge type={typing.secondary} />}
          </div>
        </div>

        <div className="shrink-0 text-left sm:text-right">
          <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--muted)]">
            Base stat total
          </div>
          <div
            className="font-mono text-5xl font-bold tabular-nums"
            style={{ color: accent }}
          >
            {stats.total}
          </div>
        </div>
      </header>

      {/* Card ------------------------------------------------------------- */}
      <section className="mt-10 flex justify-center">
        <div className="relative">
          <div
            aria-hidden
            className="pointer-events-none absolute -inset-10 -z-10 rounded-full opacity-50 blur-3xl"
            style={{
              background: `radial-gradient(circle, ${accent}33 0%, transparent 70%)`,
            }}
          />
          <PokeCard
            username={profile.profile.login}
            type={typing.primary}
            hp={stats.hp}
            languageColor={typing.color}
            languageName={typing.primaryLanguage}
            avatarUrl={profile.profile.avatarUrl}
            dexNumber={dexNumber(profile.profile.login)}
          />
        </div>
      </section>

      {/* Flavor text ------------------------------------------------------- */}
      <section
        className="mt-8 rounded-2xl border p-6"
        style={{
          borderColor: `${accent}44`,
          background: `linear-gradient(135deg, ${accent}12, transparent 60%)`,
        }}
      >
        <div className="mb-2 flex items-center gap-2">
          <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--muted)]">
            Pokedex entry
          </span>
          {flavor.source === "fallback" && (
            <span
              className="rounded-full border border-[var(--border)] px-2 py-0.5
                         font-mono text-[10px] text-[var(--muted)]"
              title="Set ANTHROPIC_API_KEY in .env.local to generate this with the model."
            >
              offline text
            </span>
          )}
        </div>
        <p className="text-lg leading-relaxed">{flavor.text}</p>
      </section>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Base stats ------------------------------------------------------ */}
        <Panel title="Base stats">
          <div className="space-y-3">
            {STAT_ROWS.map((row) => (
              <StatBar
                key={row.key}
                label={row.label}
                abbreviation={row.abbreviation}
                value={stats[row.key]}
                color={accent}
                hint={row.hint}
              />
            ))}
          </div>
          <div className="mt-4 flex items-baseline justify-between border-t border-[var(--border)] pt-3">
            <span className="font-mono text-[11px] uppercase tracking-widest text-[var(--muted)]">
              BST
            </span>
            <span className="font-mono text-lg font-semibold tabular-nums">
              {stats.total}
              <span className="ml-1 text-xs font-normal text-[var(--muted)]">
                / 1530
              </span>
            </span>
          </div>
        </Panel>

        {/* Ability --------------------------------------------------------- */}
        <Panel title="Ability">
          <div
            className="rounded-xl border px-4 py-3"
            style={{ borderColor: `${accent}55`, background: `${accent}0f` }}
          >
            <div className="text-xl font-semibold" style={{ color: accent }}>
              {ability.name}
            </div>
            <p className="mt-1.5 text-sm leading-relaxed text-[var(--muted)]">
              {ability.description}
            </p>
          </div>

          <div className="mt-4">
            <Metric
              label="Longest streak"
              value={`${number(signals.streaks.longest)} days`}
            />
            <Metric
              label="Current streak"
              value={`${number(signals.streaks.current)} days`}
            />
            <Metric
              label="Longest quiet stretch"
              value={`${number(signals.streaks.longestGap)} days`}
            />
            <Metric
              label="Weekend share"
              value={`${Math.round(signals.weekendShare * 100)}%`}
            />
            {signals.timeOfDay.sampleSize > 0 && (
              <Metric
                label="After-midnight commits"
                value={`${Math.round(signals.timeOfDay.lateNight * 100)}% of ${number(signals.timeOfDay.sampleSize)}`}
              />
            )}
          </div>
        </Panel>

        {/* Raw signals ----------------------------------------------------- */}
        <Panel title="Scouting metrics">
          <Metric
            label="Contributions (past year)"
            value={number(raw.totalContributions)}
          />
          <Metric label="Commits (past year)" value={number(raw.commits)} />
          <Metric label="Code reviews given" value={number(raw.reviews)} />
          <Metric
            label="Pull requests"
            value={`${number(raw.pullRequestsMerged)} merged / ${number(raw.pullRequestsOpened)} opened`}
          />
          <Metric
            label="Issues"
            value={`${number(raw.issuesClosed)} closed / ${number(raw.issuesOpened)} opened`}
          />
          <Metric
            label="Median issue turnaround"
            value={
              signals.medianIssueTurnaroundHours === null
                ? "not enough data"
                : `${Math.round(signals.medianIssueTurnaroundHours)} h`
            }
          />
          <Metric label="Stars earned" value={number(raw.totalStars)} />
          <Metric label="Top repo reach" value={`${number(raw.topRepoStars)} stars`} />
          <Metric label="Followers" value={number(raw.followers)} />
          <Metric label="Public repositories" value={number(raw.publicRepos)} />
        </Panel>

        {/* Languages ------------------------------------------------------- */}
        <Panel title="Language distribution">
          {signals.languages.length === 0 ? (
            <p className="text-sm text-[var(--muted)]">
              No public code was found to read languages from.
            </p>
          ) : (
            <>
              <div className="mb-4 flex h-2.5 overflow-hidden rounded-full">
                {signals.languages.slice(0, 8).map((lang) => (
                  <div
                    key={lang.name}
                    style={{
                      width: `${Math.max(lang.share * 100, 0.6)}%`,
                      background: lang.color,
                    }}
                    title={`${lang.name} ${(lang.share * 100).toFixed(1)}%`}
                  />
                ))}
              </div>
              <ul className="space-y-2">
                {signals.languages.slice(0, 6).map((lang) => (
                  <li
                    key={lang.name}
                    className="flex items-center justify-between gap-3 text-sm"
                  >
                    <span className="flex min-w-0 items-center gap-2">
                      <span
                        className="h-2.5 w-2.5 shrink-0 rounded-full"
                        style={{ background: lang.color }}
                      />
                      <span className="truncate">{lang.name}</span>
                      <span className="shrink-0 font-mono text-[10px] uppercase tracking-wider text-[var(--muted)]">
                        {lang.pokemonType}
                      </span>
                    </span>
                    <span className="font-mono text-xs tabular-nums text-[var(--muted)]">
                      {(lang.share * 100).toFixed(1)}%
                    </span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </Panel>
      </div>

      {profile.caveats.length > 0 && (
        <footer className="mt-8 rounded-2xl border border-dashed border-[var(--border)] p-5">
          <h2 className="mb-2 font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--muted)]">
            How this was measured
          </h2>
          <ul className="space-y-1.5">
            {profile.caveats.map((caveat) => (
              <li key={caveat} className="text-xs leading-relaxed text-[var(--muted)]">
                · {caveat}
              </li>
            ))}
          </ul>
        </footer>
      )}
    </main>
  );
}
