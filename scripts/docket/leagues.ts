// Which leagues the overnight run watches. Flip `enabled` as seasons change.
// Start narrow: a few in-season leagues done well beats every league done badly.

export interface LeagueConfig {
  key: string
  name: string
  enabled: boolean
  // Extra words that help the search find the right conversations.
  focus: string
}

export const LEAGUES: LeagueConfig[] = [
  { key: "NFL", name: "NFL", enabled: true, focus: "NFL officiating, replay review, penalties, coaching decisions, league fines and statements" },
  { key: "NBA", name: "NBA", enabled: true, focus: "NBA officiating, Last Two Minute report, replay challenges, coaching decisions, league fines and statements" },
  { key: "NCAAF", name: "College football", enabled: true, focus: "college football officiating, replay booth, targeting calls, conference statements and reprimands" },
  { key: "MLB", name: "MLB", enabled: true, focus: "MLB umpiring, ball-strike calls, replay review, managers' decisions, league statements" },
  { key: "WNBA", name: "WNBA", enabled: false, focus: "WNBA officiating, player safety, league statements and fines (offseason: turn on in spring)" },
  { key: "NHL", name: "NHL", enabled: false, focus: "NHL officiating, coach's challenges, Situation Room reviews, Player Safety decisions" },
  { key: "MLS", name: "MLS", enabled: false, focus: "MLS refereeing, VAR decisions, PRO statements, disciplinary committee" },
]

export function enabledLeagues(only?: string[]): LeagueConfig[] {
  if (only && only.length) {
    const want = new Set(only.map((s) => s.toUpperCase()))
    return LEAGUES.filter((l) => want.has(l.key))
  }
  return LEAGUES.filter((l) => l.enabled)
}
