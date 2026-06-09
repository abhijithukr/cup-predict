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
  teamAPosition: '1st' | '2nd' | '3rd' | null;
  teamBPosition: '1st' | '2nd' | '3rd' | null;
  winner: string | null;
}

export interface BracketTree {
  roundOf32: BracketMatch[];
  roundOf16: BracketMatch[];
  quarterFinals: BracketMatch[];
  semiFinals: BracketMatch[];
  final: BracketMatch;
}

interface TeamSlot {
  code: string;
  group: string;
}

function buildRound(n: number): BracketMatch[] {
  return Array.from({ length: n }, (_, i) => ({
    match: i + 1,
    teamA: null,
    teamB: null,
    teamAPosition: null,
    teamBPosition: null,
    winner: null,
  }));
}

function feedNext(prev: BracketMatch[], next: BracketMatch[]) {
  next.forEach((m, i) => {
    const a = prev[i * 2];
    const b = prev[i * 2 + 1];
    m.teamA = a?.winner ?? null;
    m.teamB = b?.winner ?? null;
    m.teamAPosition = null;
    m.teamBPosition = null;
    if (m.winner && m.winner !== m.teamA && m.winner !== m.teamB) m.winner = null;
  });
}

const GROUP_NAMES = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];

function lookupTeam(pos: string, groups: string, standings: GroupStanding[]): string | null {
  const typed = standings.find(s => {
    const g = s.groupName.replace('Group ', '');
    return groups.includes(g);
  });
  if (!typed) return null;

  if (pos === '1st') {
    const g = standings.find(s => s.groupName.replace('Group ', '') === groups[0]);
    return g?.first ?? null;
  }
  if (pos === '2nd') {
    const g = standings.find(s => s.groupName.replace('Group ', '') === groups[0]);
    return g?.second ?? null;
  }
  if (pos === '3rd') {
    for (const c of groups) {
      const g = standings.find(s => s.groupName.replace('Group ', '') === c);
      if (g?.third && g.thirdQualifies) return g.third;
    }
    return null;
  }
  return null;
}

// FIFA 2026 official Round of 32 bracket
const R32_TEMPLATE: Array<{ a: string; b: string }> = [
  { a: '1st:E', b: '3rd:ABCDF' },
  { a: '1st:I', b: '3rd:CDFGH' },
  { a: '2nd:A', b: '2nd:B' },
  { a: '1st:F', b: '2nd:C' },
  { a: '2nd:K', b: '2nd:L' },
  { a: '1st:H', b: '2nd:J' },
  { a: '1st:D', b: '3rd:BEFIJ' },
  { a: '1st:G', b: '3rd:AEHIJ' },
  { a: '1st:C', b: '2nd:F' },
  { a: '2nd:E', b: '2nd:I' },
  { a: '1st:A', b: '3rd:CEFHI' },
  { a: '1st:L', b: '3rd:EHIJK' },
  { a: '1st:J', b: '2nd:H' },
  { a: '2nd:D', b: '2nd:G' },
  { a: '1st:B', b: '3rd:EFGIJ' },
  { a: '1st:K', b: '3rd:DEIJL' },
];

function resolveSlot(spec: string, standings: GroupStanding[]): { code: string | null; position: '1st' | '2nd' | '3rd' | null } {
  const parts = spec.split(':');
  if (parts.length !== 2) return { code: null, position: null };

  const [pos, groupsStr] = parts;

  if (pos === '1st') {
    const g = standings.find(s => s.groupName.replace('Group ', '') === groupsStr);
    return { code: g?.first ?? null, position: '1st' };
  }
  if (pos === '2nd') {
    const g = standings.find(s => s.groupName.replace('Group ', '') === groupsStr);
    return { code: g?.second ?? null, position: '2nd' };
  }
  if (pos === '3rd') {
    for (const c of groupsStr) {
      const g = standings.find(s => s.groupName.replace('Group ', '') === c);
      if (g?.third && g.thirdQualifies) {
        return { code: g.third, position: '3rd' };
      }
    }
    return { code: null, position: null };
  }
  return { code: null, position: null };
}

export function generateBracket(standings: GroupStanding[]): BracketTree {
  const roundOf32: BracketMatch[] = R32_TEMPLATE.map((slot, i) => {
    const a = resolveSlot(slot.a, standings);
    const b = resolveSlot(slot.b, standings);
    return {
      match: i + 1,
      teamA: a.code,
      teamB: b.code,
      teamAPosition: a.position,
      teamBPosition: b.position,
      winner: null,
    };
  });

  // R16 feeds: sequential pairs of R32 winners
  // W1 vs W2, W3 vs W4, W5 vs W6, W7 vs W8,
  // W9 vs W10, W11 vs W12, W13 vs W14, W15 vs W16
  const roundOf16 = buildRound(8);
  roundOf16.forEach((m, i) => {
    const a = roundOf32[i * 2];
    const b = roundOf32[i * 2 + 1];
    m.teamA = a.winner ?? null;
    m.teamB = b.winner ?? null;
    if (m.winner && m.winner !== m.teamA && m.winner !== m.teamB) m.winner = null;
  });

  // QF feeds: sequential pairs of R16 winners
  const quarterFinals = buildRound(4);
  quarterFinals.forEach((m, i) => {
    const a = roundOf16[i * 2];
    const b = roundOf16[i * 2 + 1];
    m.teamA = a.winner ?? null;
    m.teamB = b.winner ?? null;
    if (m.winner && m.winner !== m.teamA && m.winner !== m.teamB) m.winner = null;
  });

  // SF feeds: sequential pairs of QF winners
  const semiFinals = buildRound(2);
  semiFinals.forEach((m, i) => {
    const a = quarterFinals[i * 2];
    const b = quarterFinals[i * 2 + 1];
    m.teamA = a.winner ?? null;
    m.teamB = b.winner ?? null;
    if (m.winner && m.winner !== m.teamA && m.winner !== m.teamB) m.winner = null;
  });

  // Final: SF1 winner vs SF2 winner
  const final = buildRound(1)[0];
  final.teamA = semiFinals[0].winner ?? null;
  final.teamB = semiFinals[1].winner ?? null;
  if (final.winner && final.winner !== final.teamA && final.winner !== final.teamB) {
    final.winner = null;
  }

  return { roundOf32, roundOf16, quarterFinals, semiFinals, final };
}

export function advanceWinners(bracket: BracketTree): BracketTree {
  const b = JSON.parse(JSON.stringify(bracket)) as BracketTree;

  b.roundOf16.forEach((m, i) => {
    const a = b.roundOf32[i * 2];
    const bMatch = b.roundOf32[i * 2 + 1];
    m.teamA = a.winner ?? null;
    m.teamB = bMatch.winner ?? null;
    if (m.winner && m.winner !== m.teamA && m.winner !== m.teamB) m.winner = null;
  });

  b.quarterFinals.forEach((m, i) => {
    const a = b.roundOf16[i * 2];
    const bMatch = b.roundOf16[i * 2 + 1];
    m.teamA = a.winner ?? null;
    m.teamB = bMatch.winner ?? null;
    if (m.winner && m.winner !== m.teamA && m.winner !== m.teamB) m.winner = null;
  });

  b.semiFinals.forEach((m, i) => {
    const a = b.quarterFinals[i * 2];
    const bMatch = b.quarterFinals[i * 2 + 1];
    m.teamA = a.winner ?? null;
    m.teamB = bMatch.winner ?? null;
    if (m.winner && m.winner !== m.teamA && m.winner !== m.teamB) m.winner = null;
  });

  b.final.teamA = b.semiFinals[0].winner ?? null;
  b.final.teamB = b.semiFinals[1].winner ?? null;
  if (b.final.winner && b.final.winner !== b.final.teamA && b.final.winner !== b.final.teamB) {
    b.final.winner = null;
  }

  return b;
}
