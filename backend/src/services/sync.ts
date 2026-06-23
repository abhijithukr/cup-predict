import { prisma } from '../lib/prisma';
import { getAllMatches, getFifaStandings, getTeamMatches } from './api-client';
import { scoreFixture } from './scoring';
import { computeAllGroupStandings } from './groupStandings';

const TEAM_CODE_MAP: Record<string, string> = {
  'Mexico': 'MEX', 'South Africa': 'RSA', 'South Korea': 'KOR', 'Czechia': 'CZE',
  'Canada': 'CAN', 'Bosnia & Herzegovina': 'BIH', 'Qatar': 'QAT', 'Switzerland': 'SUI',
  'Brazil': 'BRA', 'Morocco': 'MAR', 'Haiti': 'HAI', 'Scotland': 'SCO',
  'USA': 'USA', 'Paraguay': 'PAR', 'Australia': 'AUS', 'T\u00fcrkiye': 'TUR', 'Turkiye': 'TUR', 'Turkey': 'TUR',
  'Germany': 'GER', 'Cura\u00e7ao': 'CUR', 'Curacao': 'CUR',
  "C\u00f4te d'Ivoire": 'CIV', "Cote d'Ivoire": 'CIV', 'Ivory Coast': 'CIV',
  'Ecuador': 'ECU',
  'Netherlands': 'NED', 'Japan': 'JPN', 'Sweden': 'SWE', 'Tunisia': 'TUN',
  'Belgium': 'BEL', 'Egypt': 'EGY', 'IR Iran': 'IRN', 'Iran': 'IRN', 'New Zealand': 'NZL',
  'Spain': 'ESP', 'Cabo Verde': 'CPV', 'Saudi Arabia': 'KSA', 'Uruguay': 'URU',
  'France': 'FRA', 'Senegal': 'SEN', 'Iraq': 'IRQ', 'Norway': 'NOR',
  'Argentina': 'ARG', 'Algeria': 'ALG', 'Austria': 'AUT', 'Jordan': 'JOR',
  'Portugal': 'POR', 'Democratic Republic of the Congo': 'COD', 'DR Congo': 'COD',
  'Uzbekistan': 'UZB', 'Colombia': 'COL',
  'England': 'ENG', 'Croatia': 'CRO', 'Ghana': 'GHA', 'Panama': 'PAN',
  'Bosnia and Herzegovina': 'BIH',
};

interface FixtureSeed {
  groupName: string;
  home: string;
  away: string;
  kickoff: string;
}

const GROUP_FIXTURES: FixtureSeed[] = [
  // Group A
  { groupName: 'Group A', home: 'Mexico', away: 'South Africa', kickoff: '2026-06-11T19:00:00Z' },
  { groupName: 'Group A', home: 'South Korea', away: 'Czechia', kickoff: '2026-06-12T02:00:00Z' },
  { groupName: 'Group A', home: 'Czechia', away: 'South Africa', kickoff: '2026-06-18T16:00:00Z' },
  { groupName: 'Group A', home: 'Mexico', away: 'South Korea', kickoff: '2026-06-19T01:00:00Z' },
  { groupName: 'Group A', home: 'Czechia', away: 'Mexico', kickoff: '2026-06-25T01:00:00Z' },
  { groupName: 'Group A', home: 'South Africa', away: 'South Korea', kickoff: '2026-06-25T01:00:00Z' },
  // Group B
  { groupName: 'Group B', home: 'Canada', away: 'Bosnia and Herzegovina', kickoff: '2026-06-12T19:00:00Z' },
  { groupName: 'Group B', home: 'Qatar', away: 'Switzerland', kickoff: '2026-06-13T19:00:00Z' },
  { groupName: 'Group B', home: 'Switzerland', away: 'Bosnia and Herzegovina', kickoff: '2026-06-18T19:00:00Z' },
  { groupName: 'Group B', home: 'Canada', away: 'Qatar', kickoff: '2026-06-18T22:00:00Z' },
  { groupName: 'Group B', home: 'Switzerland', away: 'Canada', kickoff: '2026-06-24T19:00:00Z' },
  { groupName: 'Group B', home: 'Bosnia and Herzegovina', away: 'Qatar', kickoff: '2026-06-24T19:00:00Z' },
  // Group C
  { groupName: 'Group C', home: 'Brazil', away: 'Morocco', kickoff: '2026-06-13T22:00:00Z' },
  { groupName: 'Group C', home: 'Haiti', away: 'Scotland', kickoff: '2026-06-14T01:00:00Z' },
  { groupName: 'Group C', home: 'Brazil', away: 'Haiti', kickoff: '2026-06-19T01:00:00Z' },
  { groupName: 'Group C', home: 'Scotland', away: 'Morocco', kickoff: '2026-06-19T22:00:00Z' },
  { groupName: 'Group C', home: 'Scotland', away: 'Brazil', kickoff: '2026-06-24T22:00:00Z' },
  { groupName: 'Group C', home: 'Morocco', away: 'Haiti', kickoff: '2026-06-24T22:00:00Z' },
  // Group D
  { groupName: 'Group D', home: 'USA', away: 'Paraguay', kickoff: '2026-06-13T01:00:00Z' },
  { groupName: 'Group D', home: 'Australia', away: 'Turkiye', kickoff: '2026-06-14T04:00:00Z' },
  { groupName: 'Group D', home: 'USA', away: 'Australia', kickoff: '2026-06-19T19:00:00Z' },
  { groupName: 'Group D', home: 'Turkiye', away: 'Paraguay', kickoff: '2026-06-20T04:00:00Z' },
  { groupName: 'Group D', home: 'Turkiye', away: 'USA', kickoff: '2026-06-26T20:00:00Z' },
  { groupName: 'Group D', home: 'Paraguay', away: 'Australia', kickoff: '2026-06-26T20:00:00Z' },
  // Group E
  { groupName: 'Group E', home: 'Germany', away: 'Curacao', kickoff: '2026-06-14T17:00:00Z' },
  { groupName: 'Group E', home: "Cote d'Ivoire", away: 'Ecuador', kickoff: '2026-06-14T23:00:00Z' },
  { groupName: 'Group E', home: 'Germany', away: "Cote d'Ivoire", kickoff: '2026-06-20T20:00:00Z' },
  { groupName: 'Group E', home: 'Ecuador', away: 'Curacao', kickoff: '2026-06-21T00:00:00Z' },
  { groupName: 'Group E', home: 'Curacao', away: "Cote d'Ivoire", kickoff: '2026-06-25T20:00:00Z' },
  { groupName: 'Group E', home: 'Ecuador', away: 'Germany', kickoff: '2026-06-25T20:00:00Z' },
  // Group F
  { groupName: 'Group F', home: 'Netherlands', away: 'Japan', kickoff: '2026-06-14T20:00:00Z' },
  { groupName: 'Group F', home: 'Sweden', away: 'Tunisia', kickoff: '2026-06-15T02:00:00Z' },
  { groupName: 'Group F', home: 'Netherlands', away: 'Sweden', kickoff: '2026-06-20T17:00:00Z' },
  { groupName: 'Group F', home: 'Tunisia', away: 'Japan', kickoff: '2026-06-21T04:00:00Z' },
  { groupName: 'Group F', home: 'Tunisia', away: 'Netherlands', kickoff: '2026-06-26T18:00:00Z' },
  { groupName: 'Group F', home: 'Japan', away: 'Sweden', kickoff: '2026-06-26T18:00:00Z' },
  // Group G
  { groupName: 'Group G', home: 'Belgium', away: 'Egypt', kickoff: '2026-06-15T19:00:00Z' },
  { groupName: 'Group G', home: 'Iran', away: 'New Zealand', kickoff: '2026-06-16T01:00:00Z' },
  { groupName: 'Group G', home: 'Belgium', away: 'Iran', kickoff: '2026-06-21T19:00:00Z' },
  { groupName: 'Group G', home: 'New Zealand', away: 'Egypt', kickoff: '2026-06-22T01:00:00Z' },
  { groupName: 'Group G', home: 'New Zealand', away: 'Belgium', kickoff: '2026-06-27T18:00:00Z' },
  { groupName: 'Group G', home: 'Egypt', away: 'Iran', kickoff: '2026-06-27T18:00:00Z' },
  // Group H
  { groupName: 'Group H', home: 'Spain', away: 'Cabo Verde', kickoff: '2026-06-15T16:00:00Z' },
  { groupName: 'Group H', home: 'Saudi Arabia', away: 'Uruguay', kickoff: '2026-06-15T22:00:00Z' },
  { groupName: 'Group H', home: 'Spain', away: 'Saudi Arabia', kickoff: '2026-06-21T16:00:00Z' },
  { groupName: 'Group H', home: 'Uruguay', away: 'Cabo Verde', kickoff: '2026-06-21T22:00:00Z' },
  { groupName: 'Group H', home: 'Cabo Verde', away: 'Saudi Arabia', kickoff: '2026-06-27T20:00:00Z' },
  { groupName: 'Group H', home: 'Uruguay', away: 'Spain', kickoff: '2026-06-27T20:00:00Z' },
  // Group I
  { groupName: 'Group I', home: 'France', away: 'Senegal', kickoff: '2026-06-16T19:00:00Z' },
  { groupName: 'Group I', home: 'Iraq', away: 'Norway', kickoff: '2026-06-16T22:00:00Z' },
  { groupName: 'Group I', home: 'Norway', away: 'Senegal', kickoff: '2026-06-22T00:00:00Z' },
  { groupName: 'Group I', home: 'France', away: 'Iraq', kickoff: '2026-06-22T21:00:00Z' },
  { groupName: 'Group I', home: 'Norway', away: 'France', kickoff: '2026-06-26T22:00:00Z' },
  { groupName: 'Group I', home: 'Senegal', away: 'Iraq', kickoff: '2026-06-26T22:00:00Z' },
  // Group J
  { groupName: 'Group J', home: 'Argentina', away: 'Algeria', kickoff: '2026-06-17T01:00:00Z' },
  { groupName: 'Group J', home: 'Austria', away: 'Jordan', kickoff: '2026-06-17T04:00:00Z' },
  { groupName: 'Group J', home: 'Argentina', away: 'Austria', kickoff: '2026-06-22T17:00:00Z' },
  { groupName: 'Group J', home: 'Jordan', away: 'Algeria', kickoff: '2026-06-23T03:00:00Z' },
  { groupName: 'Group J', home: 'Algeria', away: 'Austria', kickoff: '2026-06-28T18:00:00Z' },
  { groupName: 'Group J', home: 'Jordan', away: 'Argentina', kickoff: '2026-06-28T18:00:00Z' },
  // Group K
  { groupName: 'Group K', home: 'Portugal', away: 'DR Congo', kickoff: '2026-06-17T17:00:00Z' },
  { groupName: 'Group K', home: 'Uzbekistan', away: 'Colombia', kickoff: '2026-06-18T02:00:00Z' },
  { groupName: 'Group K', home: 'Portugal', away: 'Uzbekistan', kickoff: '2026-06-23T17:00:00Z' },
  { groupName: 'Group K', home: 'Colombia', away: 'DR Congo', kickoff: '2026-06-24T02:00:00Z' },
  { groupName: 'Group K', home: 'Colombia', away: 'Portugal', kickoff: '2026-06-28T22:30:00Z' },
  { groupName: 'Group K', home: 'DR Congo', away: 'Uzbekistan', kickoff: '2026-06-28T22:30:00Z' },
  // Group L
  { groupName: 'Group L', home: 'Ghana', away: 'Panama', kickoff: '2026-06-16T23:00:00Z' },
  { groupName: 'Group L', home: 'England', away: 'Croatia', kickoff: '2026-06-17T20:00:00Z' },
  { groupName: 'Group L', home: 'England', away: 'Ghana', kickoff: '2026-06-23T20:00:00Z' },
  { groupName: 'Group L', home: 'Panama', away: 'Croatia', kickoff: '2026-06-22T23:00:00Z' },
  { groupName: 'Group L', home: 'Panama', away: 'England', kickoff: '2026-06-27T01:00:00Z' },
  { groupName: 'Group L', home: 'Croatia', away: 'Ghana', kickoff: '2026-06-27T01:00:00Z' },
];

function groupNumToLetter(groupNum: string): string {
  const m = groupNum.match(/(\d+)/);
  if (m) {
    const n = parseInt(m[1], 10);
    if (n >= 1 && n <= 26) return `Group ${String.fromCharCode(64 + n)}`;
  }
  return 'Group A';
}

function toCode(name: string): string {
  return TEAM_CODE_MAP[name] || name.substring(0, 3).toUpperCase();
}

function toFlagUrl(code: string): string {
  return `/flags/${code.toLowerCase()}.png`;
}

async function fetchAndOverlayTeamMatches(teamSlug: string) {
  const data = await getTeamMatches(teamSlug) as any;
  if (!data?.matches) return;
  const wcMatches = data.matches.filter((m: any) => m.competition === 'FIFA World Cup');
  for (const match of wcMatches) {
    await overlaySportScoreScore(match);
  }
}

async function findFixtureByTeams(homeCode: string, awayCode: string) {
  return prisma.fixture.findFirst({
    where: { teamACode: homeCode, teamBCode: awayCode },
  });
}

async function upsertHardcodedFixture(fx: FixtureSeed, index: number) {
  const homeCode = toCode(fx.home);
  const awayCode = toCode(fx.away);
  const id = `ff_${fx.groupName.replace('Group ', '')}_${index}`;

  await prisma.fixture.upsert({
    where: { id },
    update: {
      teamACode: homeCode,
      teamBCode: awayCode,
      groupName: fx.groupName,
      kickoffTime: new Date(fx.kickoff),
    },
    create: {
      id,
      groupName: fx.groupName,
      teamACode: homeCode,
      teamBCode: awayCode,
      kickoffTime: new Date(fx.kickoff),
      isClosed: false,
      status: 'scheduled',
    },
  });
}

async function overlaySportScoreScore(match: any) {
  const homeCode = toCode(match.home);
  const awayCode = toCode(match.away);
  const existing = await findFixtureByTeams(homeCode, awayCode);
  if (!existing) return;

  const updates: Record<string, unknown> = {};

  if (match.home_score != null && match.away_score != null) {
    updates.liveScoreA = match.home_score;
    updates.liveScoreB = match.away_score;
  }

  if (match.status === 'finished') {
    updates.isClosed = true;
    updates.status = 'finished';
    if (match.home_score != null && match.away_score != null) {
      updates.actualScoreA = match.home_score;
      updates.actualScoreB = match.away_score;
    }
  } else if (match.status === 'live' || match.status === 'inprogress') {
    updates.status = 'live';
  }

  if (Object.keys(updates).length > 0) {
    await prisma.fixture.update({ where: { id: existing.id }, data: updates as any });
  }
}

export async function syncAllFixtures() {
  console.log('[sync] Starting full fixture sync...');

  const standingsData = await getFifaStandings() as any;
  if (standingsData?.tables) {
    const teamGroupMap: Record<string, string> = {};
    for (const table of standingsData.tables) {
      if (table.group === 'Ranking of third placed teams') continue;
      const groupName = groupNumToLetter(table.group);
      for (const row of table.rows) {
        teamGroupMap[row.team] = groupName;
      }
    }

    for (const [, groupName] of Object.entries(teamGroupMap)) {
      for (const [teamName, code] of Object.entries(TEAM_CODE_MAP)) {
        if (teamGroupMap[teamName] === groupName) {
          await prisma.team.upsert({
            where: { code },
            update: { name: teamName, groupName, flagUrl: toFlagUrl(code) },
            create: { code, name: teamName, groupName, flagUrl: toFlagUrl(code) },
          });
        }
      }
    }

    console.log(`[sync] Synced ${Object.keys(teamGroupMap).length} teams from standings`);
  } else {
    console.log('[sync] No standings data, skipping team sync');
  }

  let synced = 0;
  for (let i = 0; i < GROUP_FIXTURES.length; i++) {
    await upsertHardcodedFixture(GROUP_FIXTURES[i], i + 1);
    synced++;
  }
  console.log(`[sync] Upserted ${synced} hardcoded group stage fixtures`);

  const matchesData = await getAllMatches() as any;
  if (matchesData?.matches) {
    const wcMatches = matchesData.matches.filter((m: any) => m.competition === 'FIFA World Cup');
    console.log(`[sync] Overlaying scores from ${wcMatches.length} SportScore matches`);

    for (const match of wcMatches) {
      await overlaySportScoreScore(match);
    }
  }

  if (standingsData?.tables) {
    const teamSlugs = new Set<string>();
    for (const table of standingsData.tables) {
      if (table.group === 'Ranking of third placed teams') continue;
      for (const row of table.rows) {
        if (row.team_slug) teamSlugs.add(row.team_slug);
      }
    }
    console.log(`[sync] Fetching team data for ${teamSlugs.size} SportScore teams...`);
    for (const slug of teamSlugs) {
      await fetchAndOverlayTeamMatches(slug);
    }
  }

  const scored = await processFinishedMatches();
  console.log(`[sync] Sync complete: ${synced} fixtures, ${scored} predictions scored`);
}

export async function clearOldData() {
  console.log('[sync] Clearing old fixture data...');
  await prisma.prediction.deleteMany({ where: { fixture: { id: { startsWith: 'ext_' } } } });
  await prisma.fixture.deleteMany({ where: { id: { startsWith: 'ext_' } } });
  await prisma.prediction.deleteMany({ where: { fixture: { id: { startsWith: 'ss_' } } } });
  await prisma.fixture.deleteMany({ where: { id: { startsWith: 'ss_' } } });
  console.log('[sync] Old data cleared');
}

export async function processFinishedMatches() {
  const finished = await prisma.fixture.findMany({
    where: { isClosed: true, actualScoreA: { not: null }, actualScoreB: { not: null } },
    include: { predictions: true },
  });

  let scored = 0;
  for (const fixture of finished) {
    for (const pred of fixture.predictions) {
      const changed = await scoreFixture(pred.id, fixture.actualScoreA!, fixture.actualScoreB!);
      if (changed) scored++;
    }
  }

  if (scored > 0) {
    await computeAllGroupStandings();
  }

  return scored;
}

export async function syncLiveScores() {
  const matchesData = await getAllMatches() as any;
  if (matchesData?.matches) {
    const wcMatches = matchesData.matches.filter((m: any) => m.competition === 'FIFA World Cup');
    for (const match of wcMatches) {
      await overlaySportScoreScore(match);
    }
  }

  const standingsData = await getFifaStandings() as any;
  if (!standingsData?.tables) return;

  const teamCodeToSlug: Record<string, string> = {};
  for (const table of standingsData.tables) {
    if (table.group === 'Ranking of third placed teams') continue;
    for (const row of table.rows) {
      const code = TEAM_CODE_MAP[row.team] || row.team.substring(0, 3).toUpperCase();
      teamCodeToSlug[code] = row.team_slug;
    }
  }

  const pastUnscored = await prisma.fixture.findMany({
    where: { kickoffTime: { lte: new Date() }, actualScoreA: null, id: { startsWith: 'ff_' } },
    select: { teamACode: true, teamBCode: true },
    orderBy: { kickoffTime: 'asc' },
  });

  const neededSlugs = new Set<string>();
  for (const fx of pastUnscored) {
    if (teamCodeToSlug[fx.teamACode]) neededSlugs.add(teamCodeToSlug[fx.teamACode]);
    if (teamCodeToSlug[fx.teamBCode]) neededSlugs.add(teamCodeToSlug[fx.teamBCode]);
  }

  for (const slug of neededSlugs) {
    await fetchAndOverlayTeamMatches(slug);
  }

  const scored = await processFinishedMatches();
  if (scored > 0) console.log(`[sync] Live sync scored ${scored} predictions`);
}
