import { prisma } from '../lib/prisma';
import { getRoundEvents, getScheduledEvents, getLiveEvents } from './api-client';
import { scoreFixture } from './scoring';
import { computeAllGroupStandings } from './groupStandings';

const ROUNDS = [1, 2, 3];

const TEAM_CODE_MAP: Record<string, string> = {
  'Mexico': 'MEX', 'South Africa': 'RSA', 'South Korea': 'KOR', 'Czechia': 'CZE',
  'Canada': 'CAN', 'Bosnia & Herzegovina': 'BIH', 'Qatar': 'QAT', 'Switzerland': 'SUI',
  'Brazil': 'BRA', 'Morocco': 'MAR', 'Haiti': 'HAI', 'Scotland': 'SCO',
  'USA': 'USA', 'Paraguay': 'PAR', 'Australia': 'AUS', 'Türkiye': 'TUR', 'Turkey': 'TUR',
  'Germany': 'GER', 'Curaçao': 'CUR', 'Curacao': 'CUR',
  "C\u00f4te d'Ivoire": 'CIV', 'Cote d\'Ivoire': 'CIV', 'Ivory Coast': 'CIV',
  'Ecuador': 'ECU',
  'Netherlands': 'NED', 'Japan': 'JPN', 'Sweden': 'SWE', 'Tunisia': 'TUN',
  'Belgium': 'BEL', 'Egypt': 'EGY', 'Iran': 'IRN', 'New Zealand': 'NZL',
  'Spain': 'ESP', 'Cabo Verde': 'CPV', 'Saudi Arabia': 'KSA', 'Uruguay': 'URU',
  'France': 'FRA', 'Senegal': 'SEN', 'Iraq': 'IRQ', 'Norway': 'NOR',
  'Argentina': 'ARG', 'Algeria': 'ALG', 'Austria': 'AUT', 'Jordan': 'JOR',
  'Portugal': 'POR', 'DR Congo': 'COD', 'Uzbekistan': 'UZB', 'Colombia': 'COL',
  'England': 'ENG', 'Croatia': 'CRO', 'Ghana': 'GHA', 'Panama': 'PAN',
};

function extractGroup(name: string): string {
  const m = name.match(/Group\s+([A-Z])/);
  return m ? `Group ${m[1]}` : 'Group A';
}

function toCode(name: string): string {
  return TEAM_CODE_MAP[name] || name.substring(0, 3).toUpperCase();
}

function toFlagUrl(code: string): string {
  return `/flags/${code.toLowerCase()}.png`;
}

export async function syncAllFixtures() {
  console.log('[sync] Starting full fixture sync...');

  const seenEventIds = new Set<number>();

  for (const round of ROUNDS) {
    const data = await getRoundEvents(round);
    if (!data?.events) {
      console.log(`[sync] No data for round ${round}`);
      continue;
    }
    for (const ev of data.events) {
      await upsertEvent(ev);
      seenEventIds.add(ev.id);
    }
    console.log(`[sync] Round ${round}: ${data.events.length} events processed`);
  }

  const scored = await processFinishedMatches();
  console.log(`[sync] Sync complete: ${seenEventIds.size} events, ${scored} predictions scored`);
}

async function upsertEvent(ev: {
  id: number;
  homeTeam: { name: string };
  awayTeam: { name: string };
  startTimestamp: number;
  status: { code: number; type: string };
  homeScore: { current: number | null };
  awayScore: { current: number | null };
  tournament: { name: string };
}) {
  const homeCode = toCode(ev.homeTeam.name);
  const awayCode = toCode(ev.awayTeam.name);
  const groupName = extractGroup(ev.tournament.name);

  for (const [name, code] of [[ev.homeTeam.name, homeCode], [ev.awayTeam.name, awayCode]]) {
    await prisma.team.upsert({
      where: { code },
      update: { name, groupName, flagUrl: toFlagUrl(code) },
      create: { code, name, groupName, flagUrl: toFlagUrl(code) },
    });
  }

  const kickoffTime = new Date(ev.startTimestamp * 1000);
  const isFinished = ev.status.code === 100;
  const isLive = ev.status.type === 'inprogress';
  const fixtureId = `ext_${ev.id}`;

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

  if (ev.homeScore?.current != null && ev.awayScore?.current != null) {
    fixtureData.liveScoreA = ev.homeScore.current;
    fixtureData.liveScoreB = ev.awayScore.current;
    if (isFinished) {
      fixtureData.actualScoreA = ev.homeScore.current;
      fixtureData.actualScoreB = ev.awayScore.current;
    }
  }

  await prisma.fixture.upsert({
    where: { id: fixtureId },
    update: fixtureData as any,
    create: { id: fixtureId, ...fixtureData } as any,
  });
}

export async function clearOldData() {
  console.log('[sync] Clearing old fixture data...');
  await prisma.prediction.deleteMany({ where: { fixture: { id: { not: { startsWith: 'ext_' } } } } });
  await prisma.fixture.deleteMany({ where: { id: { not: { startsWith: 'ext_' } } } });
  console.log('[sync] Old data cleared');
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
  const today = new Date().toISOString().split('T')[0];

  const data = await getScheduledEvents(today);
  if (data?.events) {
    for (const ev of data.events) {
      const fixtureId = `ext_${ev.id}`;
      const existing = await prisma.fixture.findUnique({ where: { id: fixtureId } });
      if (!existing) continue;

      const updates: Record<string, unknown> = {};

      if (ev.status.code === 100) {
        updates.isClosed = true;
        updates.status = 'finished';
        if (ev.homeScore?.current != null && ev.awayScore?.current != null) {
          updates.actualScoreA = ev.homeScore.current;
          updates.actualScoreB = ev.awayScore.current;
          updates.liveScoreA = ev.homeScore.current;
          updates.liveScoreB = ev.awayScore.current;
        }
      }

      if (Object.keys(updates).length > 0) {
        await prisma.fixture.update({ where: { id: fixtureId }, data: updates as any });
      }
    }
  }

  const liveData = await getLiveEvents();
  if (liveData?.events) {
    for (const ev of liveData.events) {
      const fixtureId = `ext_${ev.id}`;
      const existing = await prisma.fixture.findUnique({ where: { id: fixtureId } });
      if (!existing) continue;

      const updates: Record<string, unknown> = {};

      if (ev.homeScore?.current != null && ev.awayScore?.current != null) {
        updates.liveScoreA = ev.homeScore.current;
        updates.liveScoreB = ev.awayScore.current;
      }

      if (ev.status.type === 'inprogress') {
        updates.status = 'live';
      } else if (ev.status.type === 'finished' || ev.status.code === 100) {
        updates.isClosed = true;
        updates.status = 'finished';
        if (ev.homeScore?.current != null && ev.awayScore?.current != null) {
          updates.actualScoreA = ev.homeScore.current;
          updates.actualScoreB = ev.awayScore.current;
        }
      }

      if (Object.keys(updates).length > 0) {
        await prisma.fixture.update({ where: { id: fixtureId }, data: updates as any });
      }
    }
  }
}
