/**
 * Dev-only harness for eyeballing the data layer against real profiles.
 *
 *   npm run inspect -- torvalds sindresorhus <someone-quiet>
 *
 * Prints the computed base stats, typing, ability and the signals that drove
 * them, so the stat curves and ability thresholds can be retuned against real
 * distributions rather than guesses.
 */

import { getPokeGitProfile } from "@/lib/profile";

const pct = (n: number) => `${(n * 100).toFixed(0)}%`;

async function inspect(username: string) {
  const p = await getPokeGitProfile(username);
  const s = p.signals;

  console.log(`\n${"=".repeat(72)}`);
  console.log(`${p.profile.login}  (${p.profile.name ?? "no name"})`);
  console.log("=".repeat(72));

  console.log(
    `TYPE      ${p.typing.primary}${p.typing.secondary ? ` / ${p.typing.secondary}` : ""}` +
      `   [${p.typing.primaryLanguage}${p.typing.secondaryLanguage ? ` + ${p.typing.secondaryLanguage}` : ""}] ${p.typing.color}`,
  );
  console.log(`ABILITY   ${p.ability.name}`);

  console.log("\nBASE STATS");
  console.log(
    `  HP ${p.stats.hp}  ATK ${p.stats.attack}  DEF ${p.stats.defense}` +
      `  SPA ${p.stats.spAttack}  SPD ${p.stats.spDefense}  SPE ${p.stats.speed}` +
      `  ->  BST ${p.stats.total}`,
  );

  console.log("\nRAW");
  console.log(
    `  contributions ${p.raw.totalContributions}  commits ${p.raw.commits}` +
      `  reviews ${p.raw.reviews}  issues ${p.raw.issuesOpened}/${p.raw.issuesClosed}`,
  );
  console.log(
    `  stars ${p.raw.totalStars} (top repo ${p.raw.topRepoStars})` +
      `  followers ${p.raw.followers}  repos ${p.raw.publicRepos}`,
  );

  console.log("\nSIGNALS");
  console.log(`  account age            ${s.accountAgeYears.toFixed(1)}y`);
  console.log(
    `  streaks                longest ${s.streaks.longest}  current ${s.streaks.current}` +
      `  longest gap ${s.streaks.longestGap}  comeback ${s.streaks.hasComeback}`,
  );
  console.log(
    `  daily variance (CV)    ${s.dailyVariance.toFixed(2)}  mean/day ${s.meanDailyContributions.toFixed(2)}  max/day ${s.maxDailyContributions}`,
  );
  console.log(
    `  time of day (n=${s.timeOfDay.sampleSize})  night ${pct(s.timeOfDay.lateNight)}` +
      `  early ${pct(s.timeOfDay.earlyMorning)}  day ${pct(s.timeOfDay.day)}  evening ${pct(s.timeOfDay.evening)}`,
  );
  console.log(`  weekend share          ${pct(s.weekendShare)}`);
  console.log(
    `  star concentration     ${pct(s.starConcentration)}  stars/repo ${s.starsPerRepo.toFixed(1)}`,
  );
  console.log(
    `  collab                 reviews/commit ${s.reviewsPerCommit.toFixed(3)}  issues/commit ${s.issuesPerCommit.toFixed(3)}`,
  );
  console.log(
    `  issue turnaround       ${s.medianIssueTurnaroundHours === null ? "n/a" : `${s.medianIssueTurnaroundHours.toFixed(1)}h median`}`,
  );
  console.log(
    `  languages (${s.meaningfulLanguageCount} meaningful, concentration ${s.languageConcentration.toFixed(2)})`,
  );
  for (const lang of s.languages.slice(0, 6)) {
    console.log(`     ${pct(lang.share).padStart(4)}  ${lang.name} -> ${lang.pokemonType}`);
  }

  if (p.caveats.length) {
    console.log("\nCAVEATS");
    for (const c of p.caveats) console.log(`  - ${c}`);
  }
}

async function main() {
  const usernames = process.argv.slice(2);
  if (usernames.length === 0) {
    console.error("usage: npm run inspect -- <username> [username...]");
    process.exit(1);
  }
  for (const username of usernames) {
    try {
      await inspect(username);
    } catch (error) {
      console.error(`\n!! ${username}: ${(error as Error).message}`);
    }
  }
}

void main();
