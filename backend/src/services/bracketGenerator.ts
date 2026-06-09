export interface GroupStanding {
  groupName: string;
  first: string;
  second: string;
  third: string | null;
  thirdQualifies: boolean;
}

export interface BracketMatch {
  match: number;
  teamA: string | null;
  teamB: string | null;
  winner: string | null;
}

export interface BracketTree {
  roundOf32: BracketMatch[];
  roundOf16: BracketMatch[];
  quarterFinals: BracketMatch[];
  semiFinals: BracketMatch[];
  final: BracketMatch;
}

const R32_TEMPLATE: Array<{ a: string; b: string }> = [
  { a: '1st:A', b: '2nd:B' },
  { a: '1st:C', b: '2nd:D' },
  { a: '1st:E', b: '2nd:F' },
  { a: '1st:G', b: '2nd:H' },
  { a: '1st:I', b: '2nd:J' },
  { a: '1st:K', b: '2nd:L' },
  { a: '1st:B', b: '3rd:1' },
  { a: '1st:D', b: '3rd:2' },
  { a: '1st:F', b: '3rd:3' },
  { a: '1st:H', b: '3rd:4' },
  { a: '1st:J', b: '3rd:5' },
  { a: '1st:L', b: '3rd:6' },
  { a: '2nd:A', b: '3rd:7' },
  { a: '2nd:C', b: '3rd:8' },
  { a: '2nd:E', b: '2nd:G' },
  { a: '2nd:I', b: '2nd:K' },
];

const R16_FEEDS: Array<[number, number]> = [
  [0, 12], [1, 13], [2, 14], [3, 15],
  [4, 6], [5, 7], [8, 10], [9, 11],
];

const QF_FEEDS: Array<[number, number]> = [
  [0, 1], [2, 3], [4, 5], [6, 7],
];

const SF_FEEDS: Array<[number, number]> = [
  [0, 1], [2, 3],
];

function resolveTeam(spec: string, standings: GroupStanding[], thirdTeams: string[]): string | null {
  const parts = spec.split(':');
  if (parts.length !== 2) return null;
  const [pos, groupOrIdx] = parts;
  if (pos === '3rd') {
    const idx = parseInt(groupOrIdx) - 1;
    return thirdTeams[idx] || null;
  }
  const group = standings.find(s => s.groupName === `Group ${groupOrIdx}`);
  if (!group) return null;
  if (pos === '1st') return group.first;
  if (pos === '2nd') return group.second;
  return null;
}

export function generateBracket(standings: GroupStanding[]): BracketTree {
  const thirdTeams = standings
    .filter(s => s.third && s.thirdQualifies)
    .map(s => s.third!)
    .slice(0, 8);

  const roundOf32: BracketMatch[] = R32_TEMPLATE.map((slot, i) => ({
    match: i + 1,
    teamA: resolveTeam(slot.a, standings, thirdTeams),
    teamB: resolveTeam(slot.b, standings, thirdTeams),
    winner: null,
  }));

  const roundOf16: BracketMatch[] = R16_FEEDS.map(([a, b], i) => ({
    match: i + 1,
    teamA: roundOf32[a].winner,
    teamB: roundOf32[b].winner,
    winner: null,
  }));

  const quarterFinals: BracketMatch[] = QF_FEEDS.map(([a, b], i) => ({
    match: i + 1,
    teamA: roundOf16[a].winner,
    teamB: roundOf16[b].winner,
    winner: null,
  }));

  const semiFinals: BracketMatch[] = SF_FEEDS.map(([a, b], i) => ({
    match: i + 1,
    teamA: quarterFinals[a].winner,
    teamB: quarterFinals[b].winner,
    winner: null,
  }));

  const finalMatch: BracketMatch = {
    match: 1,
    teamA: semiFinals[0].winner,
    teamB: semiFinals[1].winner,
    winner: null,
  };

  return { roundOf32, roundOf16, quarterFinals, semiFinals, final: finalMatch };
}

export function advanceWinners(bracket: BracketTree): BracketTree {
  const b = JSON.parse(JSON.stringify(bracket)) as BracketTree;

  b.roundOf16.forEach((m, i) => {
    const feed = R16_FEEDS[i];
    m.teamA = b.roundOf32[feed[0]].winner;
    m.teamB = b.roundOf32[feed[1]].winner;
  });

  b.quarterFinals.forEach((m, i) => {
    const feed = QF_FEEDS[i];
    m.teamA = b.roundOf16[feed[0]].winner;
    m.teamB = b.roundOf16[feed[1]].winner;
  });

  b.semiFinals.forEach((m, i) => {
    const feed = SF_FEEDS[i];
    m.teamA = b.quarterFinals[feed[0]].winner;
    m.teamB = b.quarterFinals[feed[1]].winner;
  });

  b.final.teamA = b.semiFinals[0].winner;
  b.final.teamB = b.semiFinals[1].winner;

  return b;
}
