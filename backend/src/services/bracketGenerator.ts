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

function buildRound(matches: number): BracketMatch[] {
  return Array.from({ length: matches }, (_, i) => ({
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
    const feedA = prev[i * 2];
    const feedB = prev[i * 2 + 1];
    m.teamA = feedA?.winner ?? null;
    m.teamB = feedB?.winner ?? null;
    m.teamAPosition = null;
    m.teamBPosition = null;
    if (m.winner && m.winner !== m.teamA && m.winner !== m.teamB) m.winner = null;
  });
}

export function generateBracket(standings: GroupStanding[]): BracketTree {
  const sorted = [...standings].sort((a, b) => a.groupName.localeCompare(b.groupName));

  const firstTeams: TeamSlot[] = sorted.map(s => ({ code: s.first, group: s.groupName }));
  const secondTeams: TeamSlot[] = sorted.map(s => ({ code: s.second, group: s.groupName }));
  const thirdTeams: TeamSlot[] = sorted
    .filter(s => s.third && s.thirdQualifies)
    .map(s => ({ code: s.third!, group: s.groupName }));

  const roundOf32: BracketMatch[] = [];
  const usedFirst = new Set<number>();
  const usedThird = new Set<number>();

  // Step 1: first vs third (cross-group)
  for (let ti = 0; ti < thirdTeams.length; ti++) {
    for (let fi = 0; fi < firstTeams.length; fi++) {
      if (!usedFirst.has(fi) && firstTeams[fi].group !== thirdTeams[ti].group) {
        roundOf32.push({
          match: roundOf32.length + 1,
          teamA: firstTeams[fi].code,
          teamB: thirdTeams[ti].code,
          teamAPosition: '1st',
          teamBPosition: '3rd',
          winner: null,
        });
        usedFirst.add(fi);
        usedThird.add(ti);
        break;
      }
    }
  }

  // Step 2: remaining first vs some second (cross-group)
  const remainingFirst = firstTeams.filter((_, i) => !usedFirst.has(i));
  const availableSecond = [...secondTeams];

  for (const ft of remainingFirst) {
    const si = availableSecond.findIndex(s => s.group !== ft.group);
    if (si !== -1) {
      roundOf32.push({
        match: roundOf32.length + 1,
        teamA: ft.code,
        teamB: availableSecond[si].code,
        teamAPosition: '1st',
        teamBPosition: '2nd',
        winner: null,
      });
      availableSecond.splice(si, 1);
    } else {
      roundOf32.push({
        match: roundOf32.length + 1,
        teamA: ft.code,
        teamB: availableSecond.shift()!.code,
        teamAPosition: '1st',
        teamBPosition: '2nd',
        winner: null,
      });
    }
  }

  // Step 3: remaining second vs second
  while (availableSecond.length >= 2) {
    const a = availableSecond.shift()!;
    const bi = availableSecond.findIndex(s => s.group !== a.group);
    const b = bi !== -1 ? availableSecond.splice(bi, 1)[0] : availableSecond.shift()!;
    roundOf32.push({
      match: roundOf32.length + 1,
      teamA: a.code,
      teamB: b.code,
      teamAPosition: '2nd',
      teamBPosition: '2nd',
      winner: null,
    });
  }

  const roundOf16 = buildRound(8);
  const quarterFinals = buildRound(4);
  const semiFinals = buildRound(2);
  const final = buildRound(1)[0];

  feedNext(roundOf32, roundOf16);
  feedNext(roundOf16, quarterFinals);
  feedNext(quarterFinals, semiFinals);

  semiFinals.forEach((m, i) => {
    if (i === 0) { final.teamA = m.winner; }
    else { final.teamB = m.winner; }
  });
  if (final.winner && final.winner !== final.teamA && final.winner !== final.teamB) {
    final.winner = null;
  }

  return { roundOf32, roundOf16, quarterFinals, semiFinals, final };
}

export function advanceWinners(bracket: BracketTree): BracketTree {
  const b = JSON.parse(JSON.stringify(bracket)) as BracketTree;
  feedNext(b.roundOf32, b.roundOf16);
  feedNext(b.roundOf16, b.quarterFinals);
  feedNext(b.quarterFinals, b.semiFinals);

  b.semiFinals.forEach((m, i) => {
    if (i === 0) b.final.teamA = m.winner;
    else b.final.teamB = m.winner;
  });
  if (b.final.winner && b.final.winner !== b.final.teamA && b.final.winner !== b.final.teamB) {
    b.final.winner = null;
  }

  return b;
}
