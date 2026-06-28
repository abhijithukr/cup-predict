import React, { useState, useEffect } from 'react';
import { Shield, Trophy, Check, Save, Lock, ChevronLeft, ChevronRight } from 'lucide-react';
import { getGroupPredictions, getKnockoutPredictions, saveKnockoutPredictions } from '../api';

const FIFA_TO_ISO: Record<string, string> = {
  MEX:'mx', KOR:'kr', CZE:'cz', RSA:'za', CAN:'ca', BIH:'ba', QAT:'qa', SUI:'ch',
  BRA:'br', MAR:'ma', HAI:'ht', SCO:'gb-sct', USA:'us', PAR:'py', AUS:'au', TUR:'tr',
  GER:'de', CUR:'cw', CIV:'ci', ECU:'ec', NED:'nl', JPN:'jp', SWE:'se', TUN:'tn',
  BEL:'be', EGY:'eg', IRN:'ir', NZL:'nz', ESP:'es', CPV:'cv', KSA:'sa', URU:'uy',
  FRA:'fr', SEN:'sn', IRQ:'iq', NOR:'no', ARG:'ar', ALG:'dz', AUT:'at', JOR:'jo',
  POR:'pt', COD:'cd', UZB:'uz', COL:'co', ENG:'gb-eng', CRO:'hr', GHA:'gh', PAN:'pa',
};

function flagUrl(code: string): string {
  const iso = FIFA_TO_ISO[code];
  return iso ? `https://flagcdn.com/w40/${iso}.png` : '';
}

interface GroupPredictionView {
  groupName: string;
  teams: { code: string; name: string; flagUrl: string }[];
  prediction: { firstCode: string; secondCode: string; thirdCode: string | null; thirdQualifies: boolean } | null;
}

interface BracketMatch {
  match: number;
  teamA: string | null;
  teamB: string | null;
  teamAPosition: '1st' | '2nd' | '3rd' | null;
  teamBPosition: '1st' | '2nd' | '3rd' | null;
  winner: string | null;
}

interface BracketTree {
  roundOf32: BracketMatch[];
  roundOf16: BracketMatch[];
  quarterFinals: BracketMatch[];
  semiFinals: BracketMatch[];
  final: BracketMatch;
}

const R32_MATCHUPS: Array<{match: number; label: string; feed: [number, number]}> = [
  { match: 73, label: 'RSA vs CAN', feed: [73, 75] },
  { match: 74, label: 'GER vs PAR', feed: [74, 77] },
  { match: 75, label: 'NED vs MAR', feed: [75, 76] },
  { match: 76, label: 'BRA vs JPN', feed: [76, 78] },
  { match: 77, label: 'FRA vs SWE', feed: [77, 79] },
  { match: 78, label: 'CIV vs NOR', feed: [78, 80] },
  { match: 79, label: 'MEX vs ECU', feed: [79, 81] },
  { match: 80, label: 'ENG vs COD', feed: [80, 82] },
  { match: 81, label: 'USA vs BIH', feed: [81, 83] },
  { match: 82, label: 'BEL vs SEN', feed: [82, 84] },
  { match: 83, label: 'POR vs CRO', feed: [83, 85] },
  { match: 84, label: 'ESP vs AUT', feed: [84, 86] },
  { match: 85, label: 'SUI vs ALG', feed: [85, 87] },
  { match: 86, label: 'ARG vs CPV', feed: [86, 88] },
  { match: 87, label: 'COL vs GHA', feed: [87, 73] },
  { match: 88, label: 'AUS vs EGY', feed: [88, 74] },
];

export default function GroupStageView() {
  const [groups, setGroups] = useState<GroupPredictionView[]>([]);
  const [bracket, setBracket] = useState<BracketTree | null>(null);
  const [isLocked, setIsLocked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [tab, setTab] = useState<'predictions' | 'r32'>('predictions');
  const [r32Page, setR32Page] = useState(0);
  const [teamNames, setTeamNames] = useState<Record<string, string>>({});

  useEffect(() => {
    (async () => {
      try {
        const [groupsData, koData] = await Promise.all([
          getGroupPredictions(),
          getKnockoutPredictions(),
        ]);
        setGroups(groupsData);
        if (koData.bracket) {
          setBracket(koData.bracket);
          setIsLocked(koData.locked);
          buildTeamNames(koData.bracket);
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  function buildTeamNames(b: BracketTree) {
    const names: Record<string, string> = {};
    for (const round of [b.roundOf32, b.roundOf16, b.quarterFinals, b.semiFinals]) {
      for (const m of round) {
        if (m.teamA && !names[m.teamA]) names[m.teamA] = m.teamA;
        if (m.teamB && !names[m.teamB]) names[m.teamB] = m.teamB;
      }
    }
    if (b.final.teamA) names[b.final.teamA] = b.final.teamA;
    if (b.final.teamB) names[b.final.teamB] = b.final.teamB;
    setTeamNames(names);
  }

  function handlePick(matchIdx: number, team: 'A' | 'B') {
    if (isLocked || !bracket) return;
    const next = JSON.parse(JSON.stringify(bracket)) as BracketTree;
    const match = next.roundOf32[matchIdx];
    const code = team === 'A' ? match.teamA : match.teamB;
    if (!code) return;
    if (match.winner === code) {
      match.winner = null;
    } else {
      match.winner = code;
    }
    advanceToNext(next);
    setBracket(next);
  }

  const R16_FEED: Array<[number, number]> = [
    [73, 75], [74, 77], [76, 78], [79, 80],
    [83, 84], [81, 82], [86, 88], [85, 87],
  ];
  const QF_FEED: Array<[number, number]> = [
    [89, 90], [93, 94], [91, 92], [95, 96],
  ];
  const SF_FEED: Array<[number, number]> = [
    [97, 98], [99, 100],
  ];

  function findMatch(round: BracketMatch[], matchNum: number): BracketMatch | undefined {
    return round.find(m => m.match === matchNum);
  }

  function advanceToNext(b: BracketTree) {
    for (let i = 0; i < 8; i++) {
      const m = b.roundOf16[i];
      const a = findMatch(b.roundOf32, R16_FEED[i][0]);
      const bM = findMatch(b.roundOf32, R16_FEED[i][1]);
      if (!m) continue;
      m.teamA = a?.winner ?? null;
      m.teamB = bM?.winner ?? null;
      if (m.winner && m.winner !== m.teamA && m.winner !== m.teamB) m.winner = null;
    }
    for (let i = 0; i < 4; i++) {
      const m = b.quarterFinals[i];
      const a = findMatch(b.roundOf16, QF_FEED[i][0]);
      const bM = findMatch(b.roundOf16, QF_FEED[i][1]);
      if (!m) continue;
      m.teamA = a?.winner ?? null;
      m.teamB = bM?.winner ?? null;
      if (m.winner && m.winner !== m.teamA && m.winner !== m.teamB) m.winner = null;
    }
    for (let i = 0; i < 2; i++) {
      const m = b.semiFinals[i];
      const a = findMatch(b.quarterFinals, SF_FEED[i][0]);
      const bM = findMatch(b.quarterFinals, SF_FEED[i][1]);
      if (!m) continue;
      m.teamA = a?.winner ?? null;
      m.teamB = bM?.winner ?? null;
      if (m.winner && m.winner !== m.teamA && m.winner !== m.teamB) m.winner = null;
    }
    b.final.teamA = b.semiFinals[0]?.winner ?? null;
    b.final.teamB = b.semiFinals[1]?.winner ?? null;
    if (b.final.winner && b.final.winner !== b.final.teamA && b.final.winner !== b.final.teamB) {
      b.final.winner = null;
    }
  }

  async function handleSaveBracket() {
    if (!bracket) return;
    setSaving(true);
    try {
      await saveKnockoutPredictions(bracket);
      alert('Bracket saved!');
    } catch (err: any) {
      alert(err.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  }

  function getTeamName(code: string | null): string {
    if (!code) return '';
    for (const g of groups) {
      const t = g.teams.find(t => t.code === code);
      if (t) return t.name;
    }
    return code || '';
  }

  const r32Matches = bracket?.roundOf32 || [];
  const r32Picks = r32Matches.filter(m => m.winner).length;
  const R32_PAGE_SIZE = 8;
  const r32TotalPages = Math.ceil(r32Matches.length / R32_PAGE_SIZE);
  const r32PageMatches = r32Matches.slice(r32Page * R32_PAGE_SIZE, (r32Page + 1) * R32_PAGE_SIZE);

  if (loading) {
    return (
      <div className="w-full flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-zinc-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      <header className="mb-4">
        <h1 className="text-3xl md:text-4xl font-black text-white uppercase tracking-tighter mb-2">Group Stage</h1>
        <p className="text-zinc-400 text-sm font-bold uppercase tracking-[0.2em]">Group predictions &amp; Round of 32 bracket</p>
      </header>

      {error && (
        <div className="bg-red-950/40 border border-red-800 text-red-400 p-4 text-xs font-bold uppercase tracking-wider">{error}</div>
      )}

      <div className="flex gap-2 bg-zinc-950 p-4 border border-zinc-800">
        <button
          onClick={() => setTab('predictions')}
          className={`px-5 py-2.5 text-[10px] font-black uppercase tracking-widest border transition-all cursor-pointer ${
            tab === 'predictions'
              ? 'bg-white text-black border-white'
              : 'bg-zinc-900 text-zinc-500 border-zinc-800 hover:border-zinc-600 hover:text-zinc-300'
          }`}
        >
          Group Predictions
        </button>
        <button
          onClick={() => setTab('r32')}
          className={`px-5 py-2.5 text-[10px] font-black uppercase tracking-widest border transition-all cursor-pointer ${
            tab === 'r32'
              ? 'bg-white text-black border-white'
              : 'bg-zinc-900 text-zinc-500 border-zinc-800 hover:border-zinc-600 hover:text-zinc-300'
          }`}
        >
          Round of 32 {r32Picks > 0 && <span className="ml-1.5 text-emerald-400">({r32Picks}/16)</span>}
        </button>
      </div>

      {tab === 'predictions' && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {groups.map(group => {
            const p = group.prediction;
            return (
              <div key={group.groupName} className="bg-zinc-950 border border-zinc-800 overflow-hidden">
                <div className="bg-zinc-900 px-5 py-3 border-b border-zinc-800 flex items-center justify-between">
                  <h3 className="font-black text-sm text-white uppercase tracking-widest">{group.groupName}</h3>
                  <Shield size={14} className="text-zinc-500" />
                </div>
                <div className="p-3 space-y-1.5">
                  {group.teams.map(team => {
                    let rankLabel = '';
                    if (p?.firstCode === team.code) rankLabel = '1st';
                    else if (p?.secondCode === team.code) rankLabel = '2nd';
                    else if (p?.thirdCode === team.code) rankLabel = '3rd';

                    const rankColors: Record<string, string> = {
                      '1st': 'bg-yellow-500 text-black',
                      '2nd': 'bg-zinc-200 text-black',
                      '3rd': 'bg-amber-700 text-white',
                    };

                    return (
                      <div key={team.code} className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 p-2.5">
                        <img loading="lazy" src={flagUrl(team.code)} className="w-6 h-4 object-contain shrink-0" alt="" />
                        <span className="flex-1 text-xs font-bold text-zinc-300 uppercase tracking-wider truncate">
                          {team.name}
                        </span>
                        {rankLabel && (
                          <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 ${rankColors[rankLabel]}`}>
                            {rankLabel}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
                <div className="bg-zinc-900 px-4 py-2 border-t border-zinc-800 flex flex-wrap gap-3 text-[9px] font-black uppercase tracking-wider">
                  {p?.firstCode && <span className="text-yellow-500">1st: {getTeamName(p.firstCode)}</span>}
                  {p?.secondCode && <span className="text-zinc-200">2nd: {getTeamName(p.secondCode)}</span>}
                  {p?.thirdCode && <span className="text-amber-600">3rd: {getTeamName(p.thirdCode)}</span>}
                  {!p?.firstCode && <span className="text-zinc-600">No prediction</span>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {tab === 'r32' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-zinc-950 border border-zinc-800 px-5 py-3">
            <span className="text-xs font-black uppercase tracking-wider text-zinc-400">
              Pick winners for each Round of 32 match
            </span>
            <span className="text-xs font-black text-zinc-500">
              {r32Picks}/16 picks
            </span>
          </div>

          {!bracket ? (
            <div className="bg-zinc-950 border border-zinc-800 p-12 text-center">
              <Trophy size={48} className="mx-auto text-zinc-600 mb-4" />
              <h3 className="text-lg font-black text-zinc-400 uppercase tracking-tighter mb-2">No Bracket Data</h3>
              <p className="text-zinc-500 text-sm max-w-md mx-auto">
                Knockout bracket data is not available yet. Complete group predictions first.
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {r32PageMatches.map((match, i) => {
                  const absIdx = r32Page * R32_PAGE_SIZE + i;
                  return (
                    <div key={match.match} className="bg-zinc-950 border border-zinc-800 overflow-hidden">
                      <div className="bg-zinc-900 px-4 py-2 border-b border-zinc-800 flex items-center justify-between">
                        <span className="font-black text-[10px] text-zinc-500 uppercase tracking-widest">
                          Match {absIdx + 1}
                        </span>
                        <Shield size={12} className="text-zinc-500" />
                      </div>

                      <div className="p-4 space-y-2">
                        {(['A', 'B'] as const).map(team => {
                          const code = team === 'A' ? match.teamA : match.teamB;
                          if (!code) {
                            return (
                              <div key={team} className="bg-zinc-900 border border-zinc-800 p-3 text-center text-xs font-bold text-zinc-600 uppercase tracking-wider">
                                TBD
                              </div>
                            );
                          }
                          const isWinner = match.winner === code;
                          return (
                            <button
                              key={team}
                              onClick={() => handlePick(absIdx, team)}
                              disabled={isLocked}
                              className={`w-full flex items-center gap-3 p-3 text-xs font-bold uppercase tracking-wider border transition-all cursor-pointer ${
                                isWinner
                                  ? 'bg-emerald-950/40 border-emerald-600 text-emerald-400'
                                  : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:border-zinc-600 hover:text-white disabled:opacity-50'
                              }`}
                            >
                              <img loading="lazy" src={flagUrl(code)} className="w-6 h-4 object-contain shrink-0" alt="" />
                              <span className="flex-1 text-left truncate">{teamNames[code] || code}</span>
                              {isWinner && <Check size={14} className="shrink-0" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center justify-between bg-zinc-950 p-4 border border-zinc-800">
                <button
                  onClick={() => setR32Page(Math.max(0, r32Page - 1))}
                  disabled={r32Page === 0}
                  className="flex items-center gap-2 px-4 py-2 text-xs font-black uppercase tracking-widest border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-600 transition-all cursor-pointer disabled:opacity-30"
                >
                  <ChevronLeft size={14} /> Previous
                </button>

                <div className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                  Page {r32Page + 1} of {r32TotalPages}
                </div>

                <button
                  onClick={() => setR32Page(Math.min(r32TotalPages - 1, r32Page + 1))}
                  disabled={r32Page >= r32TotalPages - 1}
                  className="flex items-center gap-2 px-4 py-2 text-xs font-black uppercase tracking-widest border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-600 transition-all cursor-pointer disabled:opacity-30"
                >
                  Next <ChevronRight size={14} />
                </button>
              </div>

              <div className="flex items-center justify-between bg-zinc-950 p-4 border border-zinc-800">
                <div className="flex items-center gap-2 text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                  Click a team to pick them as the match winner. Click again to deselect.
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={handleSaveBracket}
                    disabled={saving}
                    className="bg-white hover:bg-zinc-200 text-black font-black py-2.5 px-8 text-xs uppercase tracking-widest transition-all cursor-pointer disabled:opacity-30 flex items-center gap-2"
                  >
                    {saving ? 'Saving...' : <><Save size={14} /> Save R32 Picks</>}
                  </button>
                  {isLocked && (
                    <div className="flex items-center gap-2 bg-emerald-950/40 border border-emerald-800 text-emerald-400 py-2.5 px-5 font-black text-xs uppercase tracking-widest">
                      <Check size={14} /> Locked
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
