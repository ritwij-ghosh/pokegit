import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { DexBall } from "@/components/DexBall";
import PokeCard from "@/components/PokeCard";
import ScanChime from "@/components/ScanChime";
import StatBar from "@/components/StatBar";
import { TypeBadge, TypeChip } from "@/components/TypeSymbol";
import { COPY } from "@/lib/copy";
import { dexNumber } from "@/lib/dex";
import { generateFlavorText } from "@/lib/flavor-text";
import { GitHubError, UserNotFoundError } from "@/lib/github";
import { getPokeGitProfile } from "@/lib/profile";
import { themeAccent } from "@/lib/theme-accent";
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

/**
 * Data container. Light-touch on purpose: a 2px frame and a titled header rail
 * instead of the full dialogue-box treatment, so rows stay scannable.
 */
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
    <section className={`dex-panel ${className ?? ""}`}>
      <h2
        className="flex items-center gap-2 border-b-2 border-[var(--border)] bg-[var(--surface-raised)]
                   px-4 py-2.5 font-display text-[0.55rem] uppercase text-[var(--foreground)]"
      >
        <span aria-hidden className="h-2.5 w-2.5 shrink-0 bg-[var(--type)]" />
        {title}
      </h2>
      <div className="p-4 sm:p-5">{children}</div>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="dex-divider flex items-baseline justify-between gap-4 py-2 last:border-0">
      <span className="text-xs leading-relaxed text-[var(--muted)]">{label}</span>
      <span className="shrink-0 text-xs tabular-nums text-[var(--foreground)]">
        {value}
      </span>
    </div>
  );
}

/** Chrome, so it gets the full box: thick ink border and a hard shadow. */
function ErrorState({ title, detail }: { title: string; detail: string }) {
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-16 sm:px-6">
      <section className="gba-panel tile-route-faint w-full max-w-lg px-6 py-8 text-center">
        <div className="flex justify-center">
          <DexBall size={40} />
        </div>
        <p className="mt-5 font-display text-[0.5rem] uppercase tracking-wider text-[var(--muted)]">
          {COPY.error.kicker}
        </p>
        <h1 className="mt-3 font-display text-[0.85rem] leading-relaxed text-[var(--foreground)]">
          {title}
        </h1>
        <p className="mx-auto mt-4 max-w-sm text-xs leading-[1.9] text-[var(--muted)]">
          {detail}
        </p>
        <Link
          href="/"
          className="gba-btn mt-6 inline-block px-4 py-2.5 font-display text-[0.55rem]
                     uppercase text-[var(--foreground)]"
        >
          {COPY.error.back}
        </Link>
      </section>
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
      return <ErrorState title={COPY.error.title} detail={error.message} />;
    }
    throw error;
  }

  const flavor = await generateFlavorText(profile);
  const { stats, typing, ability, signals, raw } = profile;
  const accent = themeAccent(typing.color, typing.primary);

  return (
    <main
      className="type-accent mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6"
      style={
        {
          "--accent-day": accent.day,
          "--accent-night": accent.night,
        } as React.CSSProperties
      }
    >
      <ScanChime key={profile.profile.login} />

      <div className="mb-6 flex justify-end">
        <a
          href={`https://github.com/${profile.profile.login}`}
          target="_blank"
          rel="noreferrer"
          className="gba-btn inline-block px-3 py-2 font-display text-[0.5rem] uppercase
                     text-[var(--foreground)]"
        >
          {COPY.profile.viewOnGithub}
        </a>
      </div>

      {/* Hero ---------------------------------------------------------------
          The one zone on this page that gets the tile texture, matching the
          dashboard hero treatment on the landing page. */}
      <header className="rise gba-panel tile-route-faint flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:gap-6 sm:p-6">
        <div className="relative h-24 w-24 shrink-0 overflow-hidden border-[3px] border-[var(--type)]">
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
            <span className="shrink-0 text-[11px] tracking-wider text-[var(--muted)]">
              {COPY.profile.dexPrefix} {dexNumber(profile.profile.login)}
            </span>
            <span className="h-0.5 flex-1 bg-[var(--border)]" />
          </div>
          <h1 className="mt-2 truncate font-display text-xl leading-tight text-[var(--foreground)] sm:text-2xl">
            {profile.profile.login}
          </h1>
          <p className="mt-2 text-xs leading-relaxed text-[var(--muted)]">
            {profile.profile.name ?? COPY.profile.unnamed} /{" "}
            {signals.accountAgeYears.toFixed(1)} {COPY.profile.ageSuffix}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <TypeBadge type={typing.primary} />
            {typing.secondary && <TypeBadge type={typing.secondary} />}
          </div>
        </div>

        <div className="shrink-0 text-left sm:text-right">
          <div className="text-[10px] uppercase tracking-wider text-[var(--muted)]">
            {COPY.profile.bstLabel}
          </div>
          <div
            className="mt-1 font-display text-3xl tabular-nums text-[var(--type)] sm:text-4xl"
            style={{ textShadow: "3px 3px 0 var(--shadow-hard)" }}
          >
            {stats.total}
          </div>
        </div>
      </header>

      {/* Card ------------------------------------------------------------- */}
      <section className="mt-8 flex justify-center">
        <div className="relative">
          <div
            aria-hidden
            className="pointer-events-none absolute -inset-10 -z-10 rounded-full opacity-50 blur-3xl"
            style={{
              background:
                "radial-gradient(circle, color-mix(in srgb, var(--type) 22%, transparent) 0%, transparent 70%)",
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

      {/* Flavor text -------------------------------------------------------
          Styled as a dialogue box, which is what it is. */}
      <section
        className="gba-panel mt-8 p-5 sm:p-6"
        style={{
          background:
            "linear-gradient(135deg, color-mix(in srgb, var(--type) 14%, var(--surface)), var(--surface) 60%)",
        }}
      >
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <span className="font-display text-[0.5rem] uppercase tracking-wider text-[var(--muted)]">
            {COPY.profile.entryLabel}
          </span>
          {flavor.source === "fallback" && (
            <span
              className="border border-[var(--border)] px-1.5 py-px text-[10px] text-[var(--muted)]"
              title={COPY.profile.offlineHint}
            >
              {COPY.profile.offlineBadge}
            </span>
          )}
        </div>
        <p className="text-sm leading-[2] text-[var(--foreground)]">{flavor.text}</p>
      </section>

      <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Base stats ------------------------------------------------------ */}
        <Panel title={COPY.profile.panels.stats}>
          <div className="space-y-3">
            {STAT_ROWS.map((row) => (
              <StatBar
                key={row.key}
                label={row.label}
                abbreviation={row.abbreviation}
                value={stats[row.key]}
                hint={row.hint}
              />
            ))}
          </div>
          <div className="mt-4 flex items-baseline justify-between border-t-2 border-[var(--border)] pt-3">
            <span className="text-[11px] uppercase tracking-wider text-[var(--muted)]">
              BST
            </span>
            <span className="text-base tabular-nums text-[var(--foreground)]">
              {stats.total}
              <span className="ml-1 text-[11px] text-[var(--muted)]">/ 1530</span>
            </span>
          </div>
        </Panel>

        {/* Ability --------------------------------------------------------- */}
        <Panel title={COPY.profile.panels.ability}>
          <div
            className="border-2 border-[var(--type)] px-4 py-3"
            style={{
              background: "color-mix(in srgb, var(--type) 10%, var(--surface))",
            }}
          >
            <div className="font-display text-[0.7rem] leading-relaxed text-[var(--type)]">
              {ability.name}
            </div>
            <p className="mt-2.5 text-xs leading-[1.9] text-[var(--muted)]">
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
        <Panel title={COPY.profile.panels.metrics}>
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
        <Panel title={COPY.profile.panels.languages}>
          {signals.languages.length === 0 ? (
            <div className="tile-route-faint border-2 border-dashed border-[var(--border)] px-4 py-8 text-center">
              <div className="flex justify-center opacity-60">
                <DexBall size={28} />
              </div>
              <p className="mt-4 font-display text-[0.55rem] leading-relaxed text-[var(--foreground)]">
                {COPY.empty.languages.title}
              </p>
              <p className="mx-auto mt-3 max-w-xs text-xs leading-[1.9] text-[var(--muted)]">
                {COPY.empty.languages.detail}
              </p>
            </div>
          ) : (
            <>
              <div className="mb-4 flex h-3 overflow-hidden border-2 border-[var(--border)]">
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
              <ul className="space-y-2.5">
                {signals.languages.slice(0, 6).map((lang) => (
                  <li
                    key={lang.name}
                    className="flex items-center justify-between gap-3 text-xs"
                  >
                    <span className="flex min-w-0 items-center gap-2">
                      <span
                        aria-hidden
                        className="h-3 w-3 shrink-0 border"
                        style={{
                          background: lang.color,
                          borderColor: "var(--border)",
                        }}
                      />
                      <span className="truncate text-[var(--foreground)]">
                        {lang.name}
                      </span>
                      <TypeChip type={lang.pokemonType} />
                    </span>
                    <span className="shrink-0 tabular-nums text-[var(--muted)]">
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
        <footer className="dex-panel mt-6 border-dashed p-5">
          <h2 className="mb-3 font-display text-[0.5rem] uppercase tracking-wider text-[var(--muted)]">
            {COPY.profile.caveatsTitle}
          </h2>
          <ul className="space-y-2">
            {profile.caveats.map((caveat) => (
              <li
                key={caveat}
                className="flex gap-2 text-[11px] leading-[1.9] text-[var(--muted)]"
              >
                <span aria-hidden className="text-[var(--accent)]">
                  -
                </span>
                {caveat}
              </li>
            ))}
          </ul>
        </footer>
      )}
    </main>
  );
}
