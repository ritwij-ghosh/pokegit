/**
 * Every numeric cutoff used by the ability decision tree lives here.
 *
 * plan.md section 5 asks for reasonable hardcoded starting cutoffs in one
 * config file, with the expectation that they get retuned after real
 * distributions are observed. Nothing here is derived from data yet — these are
 * judgment calls anchored on rough real-world reference profiles.
 */

export const ABILITY_THRESHOLDS = {
  // --- Time-of-day / day-of-week patterns -------------------------------
  /** plan.md gives 40% for all three rhythm abilities. */
  lateNightShare: 0.4,
  earlyBirdShare: 0.4,
  weekendShare: 0.4,
  /**
   * Time-of-day comes from a best-effort commit sample. Below this many
   * commits the histogram is noise, so the rhythm abilities are skipped
   * rather than fired off a handful of timestamps.
   */
  minCommitSample: 25,

  // --- Rhythm / consistency --------------------------------------------
  dormancyGapDays: 90,
  /** Coefficient of variation of daily contributions. */
  burstVarianceCv: 2.2,
  /** Burst Mode is spiky *without* long dormancy, per plan.md. */
  burstMaxGapDays: 60,
  burstMinContributions: 150,
  streakMasterDays: 100,
  steadyMaxGapDays: 7,
  steadyMaxVarianceCv: 1.1,
  steadyMinContributions: 300,

  // --- Tenure -----------------------------------------------------------
  /**
   * NOTE: at 5 years this catches a large share of working developers, and
   * because Veteran sits at position 8 it shadows most of the abilities below
   * it. Kept at the plan's value deliberately; this is the first knob to turn
   * if the distribution comes out flat.
   */
  veteranAccountYears: 5,
  risingStarMaxAccountYears: 1,
  risingStarContributions: 800,
  risingStarStars: 200,

  // --- Volume / reach ---------------------------------------------------
  prolificContributions: 2000,
  viralHitStarConcentration: 0.7,
  viralHitMinTopRepoStars: 400,
  crowdFavoriteStars: 1000,
  crowdFavoriteMaxConcentration: 0.5,

  // --- Social -----------------------------------------------------------
  /** Followers per contribution — reach earned per unit of output. */
  influencerFollowerRatio: 0.5,
  influencerMinFollowers: 300,
  communityPillarReviews: 150,
  /**
   * Mentor sits *after* Community Pillar in the plan's order, so it can only
   * fire in the review band below Community Pillar's cutoff. Keeping this
   * lower than communityPillarReviews is what makes Mentor reachable at all.
   */
  mentorReviews: 60,
  mentorFollowers: 500,

  // --- Issues -----------------------------------------------------------
  firstResponderMaxMedianHours: 24,
  firstResponderMinIssues: 15,
  bugHunterIssues: 100,

  // --- Languages --------------------------------------------------------
  polyglotLanguages: 5,
  /** languageConcentration: 0 = perfectly even, 1 = single language. */
  polyglotMaxConcentration: 0.4,
  specialistTopShare: 0.9,

  // --- Repos ------------------------------------------------------------
  architectRepoCount: 40,
  perfectionistMaxRepos: 12,
  perfectionistStarsPerRepo: 100,

  // --- Collaboration ----------------------------------------------------
  soloArtistMinCommits: 400,
  soloArtistMaxReviewsPerCommit: 0.02,
  soloArtistMaxIssuesPerCommit: 0.05,
  /** (reviews + issues) / commits. */
  teamPlayerCollabRatio: 0.35,
  teamPlayerMinCommits: 50,

  /** Below this the profile is treated as too thin to characterize at all. */
  newcomerMaxContributions: 50,
} as const;
