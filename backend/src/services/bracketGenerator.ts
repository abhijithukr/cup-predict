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

interface GroupResult {
  groupName: string;
  firstCode: string;
  secondCode: string;
  thirdCode: string;
}

// FIFA 2026 official Round of 32 (Matches 73-88)
// Annex C for qualified third-place groups: {B, D, E, F, I, J, K, L}
const R32_DEFS: Array<{ match: number; a: string; b: string }> = [
  { match: 73, a: '2nd:A', b: '2nd:B' },
  { match: 74, a: '1st:E', b: '3rd:D' },
  { match: 75, a: '1st:F', b: '2nd:C' },
  { match: 76, a: '1st:C', b: '2nd:F' },
  { match: 77, a: '1st:I', b: '3rd:F' },
  { match: 78, a: '2nd:E', b: '2nd:I' },
  { match: 79, a: '1st:A', b: '3rd:E' },
  { match: 80, a: '1st:L', b: '3rd:K' },
  { match: 81, a: '1st:D', b: '3rd:B' },
  { match: 82, a: '1st:G', b: '3rd:I' },
  { match: 83, a: '2nd:K', b: '2nd:L' },
  { match: 84, a: '1st:H', b: '2nd:J' },
  { match: 85, a: '1st:B', b: '3rd:J' },
  { match: 86, a: '1st:J', b: '2nd:H' },
  { match: 87, a: '1st:K', b: '3rd:L' },
  { match: 88, a: '2nd:D', b: '2nd:G' },
];

// R16 feeds: which R32 winners feed into each R16 match
const R16_FEEDS: Array<{ match: number; feed: [number, number] }> = [
  { match: 89, feed: [73, 75] },
  { match: 90, feed: [74, 77] },
  { match: 91, feed: [76, 78] },
  { match: 92, feed: [79, 80] },
  { match: 93, feed: [83, 84] },
  { match: 94, feed: [81, 82] },
  { match: 95, feed: [86, 88] },
  { match: 96, feed: [85, 87] },
];

const QF_FEEDS: Array<{ match: number; feed: [number, number] }> = [
  { match: 97, feed: [89, 90] },
  { match: 98, feed: [93, 94] },
  { match: 99, feed: [91, 92] },
  { match: 100, feed: [95, 96] },
];

const SF_FEEDS: Array<{ match: number; feed: [number, number] }> = [
  { match: 101, feed: [97, 98] },
  { match: 102, feed: [99, 100] },
];

type Pos = '1st' | '2nd' | '3rd';

function resolve(spec: string, groups: GroupResult[]): { code: string | null; pos: Pos | null } {
  const [p, groupLetter] = spec.split(':') as [string, string];
  const g = groups.find(x => x.groupName.replace('Group ', '') === groupLetter);
  if (!g) return { code: null, pos: null };
  if (p === '1st') return { code: g.firstCode, pos: '1st' };
  if (p === '2nd') return { code: g.secondCode, pos: '2nd' };
  if (p === '3rd') return { code: g.thirdCode, pos: '3rd' };
  return { code: null, pos: null };
}

export function generateBracket(groups: GroupResult[]): BracketTree {
  const r32 = R32_DEFS.map(spec => {
    const a = resolve(spec.a, groups);
    const b = resolve(spec.b, groups);
    return { match: spec.match, teamA: a.code, teamB: b.code, teamAPosition: a.pos, teamBPosition: b.pos, winner: null } as BracketMatch;
  });

  function feedFrom(prev: BracketMatch[], defs: Array<{ match: number; feed: [number, number] }>): BracketMatch[] {
    return defs.map(d => {
      const a = prev.find(m => m.match === d.feed[0]);
      const b = prev.find(m => m.match === d.feed[1]);
      return { match: d.match, teamA: a?.winner ?? null, teamB: b?.winner ?? null, teamAPosition: null, teamBPosition: null, winner: null } as BracketMatch;
    });
  }

  const r16 = feedFrom(r32, R16_FEEDS);
  const qf = feedFrom(r16, QF_FEEDS);
  const sf = feedFrom(qf, SF_FEEDS);
  const final: BracketMatch = { match: 103, teamA: sf[0].winner ?? null, teamB: sf[1].winner ?? null, teamAPosition: null, teamBPosition: null, winner: null };

  return { roundOf32: r32, roundOf16: r16, quarterFinals: qf, semiFinals: sf, final };
}

export function advanceWinners(bracket: BracketTree): BracketTree {
  const b = JSON.parse(JSON.stringify(bracket)) as BracketTree;

  const r32Map = new Map(b.roundOf32.map(m => [m.match, m]));
  const r16Map = new Map(b.roundOf16.map(m => [m.match, m]));
  const qfMap = new Map(b.quarterFinals.map(m => [m.match, m]));
  const sfMap = new Map(b.semiFinals.map(m => [m.match, m]));

  for (const d of R16_FEEDS) {
    const m = r16Map.get(d.match)!;
    const a = r32Map.get(d.feed[0]);
    const bM = r32Map.get(d.feed[1]);
    m.teamA = a?.winner ?? null;
    m.teamB = bM?.winner ?? null;
    if (m.winner && m.winner !== m.teamA && m.winner !== m.teamB) m.winner = null;
  }

  for (const d of QF_FEEDS) {
    const m = qfMap.get(d.match)!;
    const a = r16Map.get(d.feed[0]);
    const bM = r16Map.get(d.feed[1]);
    m.teamA = a?.winner ?? null;
    m.teamB = bM?.winner ?? null;
    if (m.winner && m.winner !== m.teamA && m.winner !== m.teamB) m.winner = null;
  }

  for (const d of SF_FEEDS) {
    const m = sfMap.get(d.match)!;
    const a = qfMap.get(d.feed[0]);
    const bM = qfMap.get(d.feed[1]);
    m.teamA = a?.winner ?? null;
    m.teamB = bM?.winner ?? null;
    if (m.winner && m.winner !== m.teamA && m.winner !== m.teamB) m.winner = null;
  }

  const f = b.final;
  f.teamA = sfMap.get(101)?.winner ?? null;
  f.teamB = sfMap.get(102)?.winner ?? null;
  if (f.winner && f.winner !== f.teamA && f.winner !== f.teamB) f.winner = null;

  return b;
}
