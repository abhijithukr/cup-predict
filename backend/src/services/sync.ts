import { prisma } from '../lib/prisma';
import { getAllMatches, getFifaStandings } from './api-client';
import { scoreFixture } from './scoring';
import { computeAllGroupStandings } from './groupStandings';

const TEAM_CODE_MAP: Record<string, string> = {
  'Mexico': 'MEX', 'South Africa': 'RSA', 'South Korea': 'KOR', 'Czechia': 'CZE',
  'Canada': 'CAN', 'Bosnia & Herzegovina': 'BIH', 'Qatar': 'QAT', 'Switzerland': 'SUI',
  'Brazil': 'BRA', 'Morocco': 'MAR', 'Haiti': 'HAI', 'Scotland': 'SCO',
  'USA': 'USA', 'Paraguay': 'PAR', 'Australia': 'AUS', 'Türkiye': 'TUR', 'Turkey': 'TUR',
  'Germany': 'GER', 'Curaçao': 'CUR', 'Curacao': 'CUR',
  "C\u00f4te d'Ivoire": 'CIV', 'Cote d\'Ivoire': 'CIV', 'Ivory Coast': 'CIV',
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

function matchId(match: any): string {
  const slug = (match.url || `${match.home}-${match.away}`).replace(/[^a-zA-Z0-9-]/g, '_');
  return `ss_${slug}`;
}

export async function syncAllFixtures() {
  console.log('[sync] Starting full fixture sync from SportScore...');

  const standingsData = await getFifaStandings() as any;
  if (!standingsData?.tables) {
    console.log('[sync] No standings data available');
    return;
  }

  const teamGroupMap: Record<string, string> = {};
  for (const table of standingsData.tables) {
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

  console.log(`[sync] Synced ${Object.keys(teamGroupMap).length} teams across ${standingsData.tables.length} groups`);

  const matchesData = await getAllMatches() as any;
  if (!matchesData?.matches) {
    console.log('[sync] No matches data available');
    return;
  }

  const wcMatches = matchesData.matches.filter((m: any) => m.competition === 'FIFA World Cup');
  console.log(`[sync] Found ${wcMatches.length} FIFA World Cup matches`);

  for (const match of wcMatches) {
    await upsertMatch(match, teamGroupMap);
  }

  const scored = await processFinishedMatches();
  console.log(`[sync] Sync complete: ${wcMatches.length} matches, ${scored} predictions scored`);
}

async function upsertMatch(match: any, teamGroupMap: Record<string, string>) {
  const homeName = match.home;
  const awayName = match.away;
  const homeCode = toCode(homeName);
  const awayCode = toCode(awayName);
  const groupName = teamGroupMap[homeName] || teamGroupMap[awayName] || 'Group A';

  for (const [name, code] of [[homeName, homeCode], [awayName, awayCode]] as [string, string][]) {
    await prisma.team.upsert({
      where: { code },
      update: { name, groupName, flagUrl: toFlagUrl(code) },
      create: { code, name, groupName, flagUrl: toFlagUrl(code) },
    });
  }

  const kickoffTime = new Date(match.time);
  const id = matchId(match);

  const isFinished = match.status === 'finished';
  const isLive = match.status === 'live' || match.status === 'inprogress';

  let status = 'scheduled';
  if (isLive) status = 'live';
  else if (isFinished) status = 'finished';

  const fixtureData: Record<string, unknown> = {
    groupName,
    teamACode: homeCode,
    teamBCode: awayCode,
    kickoffTime,
    isClosed: isFinished,
    status,
  };

  if (match.home_score != null && match.away_score != null) {
    fixtureData.liveScoreA = match.home_score;
    fixtureData.liveScoreB = match.away_score;
    if (isFinished) {
      fixtureData.actualScoreA = match.home_score;
      fixtureData.actualScoreB = match.away_score;
    }
  }

  await prisma.fixture.upsert({
    where: { id },
    update: fixtureData as any,
    create: { id, ...fixtureData } as any,
  });
}

export async function clearOldData() {
  console.log('[sync] Clearing old data...');
  await prisma.prediction.deleteMany({ where: { fixture: { id: { startsWith: 'ext_' } } } });
  await prisma.fixture.deleteMany({ where: { id: { startsWith: 'ext_' } } });
  console.log('[sync] Old sportapi7 data cleared');
}

export async function processFinishedMatches() {
  const finished = await prisma.fixture.findMany({
    where: { isClosed: true, actualScoreA: { not: null }, actualScoreB: { not: null } },
    include: { predictions: true },
  });

  let scored = 0;
  for (const fixture of finished) {
    const unscored = fixture.predictions.filter((p: { status: string }) => p.status === 'OPEN');
    for (const pred of unscored) {
      await scoreFixture(pred.id, fixture.actualScoreA!, fixture.actualScoreB!);
      scored++;
    }
  }

  if (scored > 0) {
    await computeAllGroupStandings();
  }

  return scored;
}

export async function syncLiveScores() {
  const matchesData = await getAllMatches() as any;
  if (!matchesData?.matches) return;

  const wcMatches = matchesData.matches.filter((m: any) => m.competition === 'FIFA World Cup');

  for (const match of wcMatches) {
    const id = matchId(match);
    const existing = await prisma.fixture.findUnique({ where: { id } });
    if (!existing) continue;

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
      await prisma.fixture.update({ where: { id }, data: updates as any });
    }
  }

  const scored = await processFinishedMatches();
  if (scored > 0) console.log(`[sync] Live sync scored ${scored} predictions`);
}
