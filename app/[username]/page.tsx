import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

import CalcHint from "@/components/CalcHint";
import { DexBall } from "@/components/DexBall";
import PokeCard from "@/components/PokeCard";
import PokedexEntryText from "@/components/PokedexEntryText";
import ScanChime from "@/components/ScanChime";
import StatBar from "@/components/StatBar";
import { TypeBadge, TypeChip } from "@/components/TypeSymbol";
import { COPY } from "@/lib/copy";
import { dexNumber, formatDexNumber } from "@/lib/dex";
import { GitHubError, UserNotFoundError } from "@/lib/github";
import { resolveFlavorForProfile } from "@/lib/pokedex-generation";
import { toCardMoves } from "@/lib/moves";
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
  { key: "hp", abbreviation: "HP", label: "HP", hint: COPY.profile.statHints.hp },
  {
    key: "attack",
    abbreviation: "ATK",
    label: "Attack",
    hint: COPY.profile.statHints.attack,
  },
  {
    key: "defense",
    abbreviation: "DEF",
    label: "Defense",
    hint: COPY.profile.statHints.defense,
  },
  {
    key: "spAttack",
    abbreviation: "SP.ATK",
    label: "Sp. Attack",
    hint: COPY.profile.statHints.spAttack,
  },
  {
    key: "spDefense",
    abbreviation: "SP.DEF",
    label: "Sp. Defense",
    hint: COPY.profile.statHints.spDefense,
  },
  {
    key: "speed",
    abbreviation: "SPE",
    label: "Speed",
    hint: COPY.profile.statHints.speed,
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

  const headerStore = await headers();
  const clientKey =
    headerStore.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headerStore.get("x-real-ip") ||
    "anon";
  const { flavor, entryNumber } = await resolveFlavorForProfile(profile, {
    clientKey,
  });
  const { stats, typing, ability, moves, signals, raw } = profile;
  const cardMoves = toCardMoves(moves);
  const accent = themeAccent(typing.color, typing.primary);
  const dex =
    entryNumber != null
      ? formatDexNumber(entryNumber)
      : dexNumber(profile.profile.login);

  return (
    <main
      className="type-accent mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 sm:py-8"
      style={
        {
          "--accent-day": accent.day,
          "--accent-night": accent.night,
        } as React.CSSProperties
      }
    >
      <ScanChime key={profile.profile.login} />

      {/* Header — name, BST badge, tags, pokedex entry */}
      <header className="rise mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-start sm:gap-5">
        <CalcHint hint={COPY.profile.bstHint} placement="below" className="shrink-0">
          <div
            className="dex-panel flex flex-col items-center justify-center px-4 py-3 sm:min-w-[5.5rem]"
            style={{
              background:
                "linear-gradient(160deg, color-mix(in srgb, var(--type) 18%, var(--surface)), var(--surface))",
            }}
          >
            <span
              className="font-display text-2xl tabular-nums leading-none text-[var(--type)] sm:text-3xl"
              style={{ textShadow: "2px 2px 0 var(--shadow-hard)" }}
            >
              {stats.total}
            </span>
            <span className="mt-1.5 text-[9px] uppercase tracking-wider text-[var(--muted)]">
              {COPY.profile.bstLabel}
            </span>
          </div>
        </CalcHint>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-3">
                <span className="shrink-0 text-[11px] tracking-wider text-[var(--muted)]">
                  {COPY.profile.dexPrefix} {dex}
                </span>
                <span className="h-0.5 flex-1 bg-[var(--border)]" />
              </div>
              <h1 className="mt-1.5 font-display text-xl leading-tight text-[var(--foreground)] sm:text-2xl lg:text-[1.65rem]">
                {profile.profile.login}
              </h1>
            </div>

            <a
              href={`https://github.com/${profile.profile.login}`}
              target="_blank"
              rel="noreferrer"
              className="gba-btn shrink-0 px-3 py-2 font-display text-[0.5rem] uppercase
                         text-[var(--foreground)]"
            >
              {COPY.profile.viewOnGithub}
            </a>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <TypeBadge type={typing.primary} />
            {typing.secondary && <TypeBadge type={typing.secondary} />}
            <span className="border border-[var(--border)] bg-[var(--surface)] px-2 py-0.5 text-[10px] text-[var(--muted)]">
              {profile.profile.name ?? COPY.profile.unnamed}
            </span>
            <span className="border border-[var(--border)] bg-[var(--surface)] px-2 py-0.5 text-[10px] text-[var(--muted)]">
              {signals.accountAgeYears.toFixed(1)} {COPY.profile.ageSuffix}
            </span>
          </div>

          <div
            className="mt-4 border-l-4 border-[var(--type)] pl-3 sm:pl-4"
            style={{
              background:
                "linear-gradient(90deg, color-mix(in srgb, var(--type) 10%, transparent), transparent)",
            }}
          >
            <PokedexEntryText
              username={profile.profile.login}
              initial={flavor}
            />
          </div>
        </div>
      </header>

      {/* Dashboard — card center, panels around it */}
      <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] lg:gap-6 xl:gap-8">
        {/* Left: base stats + ability */}
        <div className="order-2 flex flex-col gap-5 lg:order-1">
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
            <CalcHint hint={COPY.profile.bstHint} className="mt-4 block">
              <div className="flex items-baseline justify-between border-t-2 border-[var(--border)] pt-3">
                <span className="text-[11px] uppercase tracking-wider text-[var(--muted)]">
                  BST
                </span>
                <span className="text-base tabular-nums text-[var(--foreground)]">
                  {stats.total}
                  <span className="ml-1 text-[11px] text-[var(--muted)]">/ 1530</span>
                </span>
              </div>
            </CalcHint>
          </Panel>

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
        </div>

        {/* Center: card + share */}
        <div className="order-1 flex justify-center lg:order-2 lg:sticky lg:top-20 lg:self-start">
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
              dexNumber={dex}
              moves={cardMoves}
              width="min(400px, 86vw)"
              showShare
              abilityName={ability.name}
              shareStats={{
                hp: stats.hp,
                attack: stats.attack,
                defense: stats.defense,
                spAttack: stats.spAttack,
                spDefense: stats.spDefense,
                speed: stats.speed,
                total: stats.total,
                primaryType: typing.primary,
                secondaryType: typing.secondary,
                languageName: typing.primaryLanguage,
                abilityName: ability.name,
                dexNumber: dex,
                contributions: raw.totalContributions,
                commits: raw.commits,
                reviews: raw.reviews,
                pullRequestsMerged: raw.pullRequestsMerged,
                pullRequestsOpened: raw.pullRequestsOpened,
                issuesClosed: raw.issuesClosed,
                issuesOpened: raw.issuesOpened,
                medianIssueTurnaroundHours: signals.medianIssueTurnaroundHours,
                totalStars: raw.totalStars,
                topRepoStars: raw.topRepoStars,
                followers: raw.followers,
                publicRepos: raw.publicRepos,
              }}
            />
          </div>
        </div>

        {/* Right: scouting metrics + languages */}
        <div className="order-3 flex flex-col gap-5">
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
      </div>

      {profile.caveats.length > 0 && (
        <footer className="dex-panel mt-6 border-dashed p-5 lg:mt-8">
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
