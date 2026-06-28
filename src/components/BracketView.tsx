import React, { useState, useEffect } from 'react';
import { Trophy, Check, Award, Lock, ChevronLeft, ChevronRight, Shield } from 'lucide-react';
import { getKnockoutPredictions, saveKnockoutPredictions, lockKnockoutPredictions } from '../api';

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

const ROUND_LABELS = [
  { key: 'roundOf16', label: 'Round of 16', short: 'R16', matches: 8 },
  { key: 'quarterFinals', label: 'Quarter-Finals', short: 'QF', matches: 4 },
  { key: 'semiFinals', label: 'Semi-Finals', short: 'SF', matches: 2 },
  { key: 'final', label: 'Final', short: 'Final', matches: 1 },
] as const;

type RoundKey = typeof ROUND_LABELS[number]['key'];

export default function BracketView() {
  const [bracket, setBracket] = useState<BracketTree | null>(null);
  const [isLocked, setIsLocked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [currentRoundIdx, setCurrentRoundIdx] = useState(0);
  const [teamNames, setTeamNames] = useState<Record<string, string>>({});

  useEffect(() => {
    (async () => {
      try {
        const data = await getKnockoutPredictions();
        if (data.bracket) {
          setBracket(data.bracket);
          setIsLocked(data.locked);
          buildTeamNames(data.bracket);
        } else {
          setError('No bracket data available. Complete group predictions and set R32 picks first.');
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

  function findMatch(round: BracketMatch[], matchNum: number): BracketMatch | undefined {
    return round.find(m => m.match === matchNum);
  }

  function handlePick(roundKey: RoundKey, matchIdx: number, team: 'A' | 'B') {
    if (isLocked || !bracket) return;
    const next = JSON.parse(JSON.stringify(bracket)) as BracketTree;
    const match: BracketMatch = roundKey === 'final' ? (next.final as BracketMatch) : (next[roundKey] as BracketMatch[])[matchIdx];
    if (!match) return;
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

  async function handleSave() {
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

  async function handleLock() {
    if (!bracket) return;
    setSaving(true);
    try {
      await lockKnockoutPredictions();
      setIsLocked(true);
      alert('Bracket locked!');
    } catch (err: any) {
      alert(err.message || 'Failed to lock');
    } finally {
      setSaving(false);
    }
  }

  const currentRound = ROUND_LABELS[currentRoundIdx];
  const roundData = bracket ? (bracket[currentRound.key] as BracketMatch[]) : [];
  const matches = currentRound.key === 'final' && bracket ? [bracket.final] : roundData;

  function countPicks(): number {
    if (!bracket) return 0;
    let c = 0;
    for (const m of bracket.roundOf16) if (m.winner) c++;
    for (const m of bracket.quarterFinals) if (m.winner) c++;
    for (const m of bracket.semiFinals) if (m.winner) c++;
    if (bracket.final.winner) c++;
    return c;
  }

  if (loading) {
    return (
      <div className="w-full flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-zinc-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full space-y-6">
        <header className="mb-4">
          <h1 className="text-3xl md:text-4xl font-black text-white uppercase tracking-tighter mb-2">Knockout Bracket</h1>
          <p className="text-zinc-400 text-sm font-bold uppercase tracking-[0.2em]">From Round of 16 to the Final</p>
        </header>
        <div className="bg-red-950/40 border border-red-800 text-red-400 p-4 text-xs font-bold uppercase tracking-wider">{error}</div>
      </div>
    );
  }

  function renderTeamButton(match: BracketMatch, team: 'A' | 'B', idx: number) {
    const code = team === 'A' ? match.teamA : match.teamB;
    if (!code) {
      return (
        <div className="bg-zinc-900 border border-zinc-800 p-3 text-center text-xs font-bold text-zinc-600 uppercase tracking-wider">
          TBD
        </div>
      );
    }
    const isWinner = match.winner === code;

    return (
      <button
        onClick={() => handlePick(currentRound.key as RoundKey, idx, team)}
        disabled={isLocked || !bracket?.roundOf32.some(m => m.winner)}
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
  }

  return (
    <div className="w-full space-y-6">
      <header className="mb-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl md:text-4xl font-black text-white uppercase tracking-tighter mb-2">Knockout Bracket</h1>
            <p className="text-zinc-400 text-sm font-bold uppercase tracking-[0.2em]">From R16 to the Final</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Selections</p>
            <p className="font-black text-xl text-white">{countPicks()}/15</p>
          </div>
        </div>
      </header>

      <div className="flex items-center gap-2 bg-zinc-950 p-4 border border-zinc-800 overflow-x-auto">
        {ROUND_LABELS.map((round, i) => (
          <button
            key={round.key}
            onClick={() => setCurrentRoundIdx(i)}
            className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest border transition-all cursor-pointer whitespace-nowrap ${
              currentRoundIdx === i
                ? 'bg-white text-black border-white'
                : 'bg-zinc-900 text-zinc-500 border-zinc-800 hover:border-zinc-600 hover:text-zinc-300'
            }`}
          >
            {round.short}
          </button>
        ))}
        <div className="ml-auto text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
          {currentRound.label}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {matches.map((match, idx) => {
          if (!match) return null;

          return (
            <div key={currentRound.key === 'final' ? 'final' : idx} className="bg-zinc-950 border border-zinc-800 overflow-hidden">
              <div className="bg-zinc-900 px-4 py-2 border-b border-zinc-800 flex items-center justify-between">
                <span className="font-black text-[10px] text-zinc-500 uppercase tracking-widest">
                  {currentRound.key === 'final' ? 'Final' : `Match ${idx + 1}`}
                </span>
                <Shield size={12} className="text-zinc-500" />
              </div>

              <div className="p-4 space-y-2">
                {renderTeamButton(match, 'A', idx)}
                {renderTeamButton(match, 'B', idx)}
              </div>

              <div className="bg-zinc-900 px-4 py-2 border-t border-zinc-800 flex items-center justify-between">
                <span className="text-[9px] font-bold text-zinc-600 uppercase tracking-wider">
                  {currentRound.key === 'final' ? 'Champion' : `→ ${currentRoundIdx < ROUND_LABELS.length - 1 ? ROUND_LABELS[currentRoundIdx + 1].short : 'Done'}`}
                </span>
                {match.winner && (
                  <div className="flex items-center gap-1.5 text-emerald-500 text-[9px] font-black uppercase tracking-wider">
                    <Award size={10} />
                    <span>{teamNames[match.winner] || match.winner}</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-between bg-zinc-950 p-4 border border-zinc-800">
        <button
          onClick={() => setCurrentRoundIdx(Math.max(0, currentRoundIdx - 1))}
          disabled={currentRoundIdx === 0}
          className="flex items-center gap-2 px-4 py-2 text-xs font-black uppercase tracking-widest border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-600 transition-all cursor-pointer disabled:opacity-30"
        >
          <ChevronLeft size={14} /> Previous
        </button>

        <div className="flex gap-3">
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-white hover:bg-zinc-200 text-black font-black py-2 px-6 text-xs uppercase tracking-widest transition-all cursor-pointer disabled:opacity-30"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
          {isLocked ? (
            <div className="flex items-center gap-2 bg-emerald-950/40 border border-emerald-800 text-emerald-400 py-2 px-4 font-black text-xs uppercase tracking-widest">
              <Check size={14} /> Locked
            </div>
          ) : (
            <button
              onClick={handleLock}
              disabled={saving}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-black py-2 px-6 text-xs uppercase tracking-widest transition-all cursor-pointer disabled:opacity-30"
            >
              <Lock size={12} className="inline mr-1.5" /> Lock
            </button>
          )}
        </div>

        <button
          onClick={() => setCurrentRoundIdx(Math.min(ROUND_LABELS.length - 1, currentRoundIdx + 1))}
          disabled={currentRoundIdx === ROUND_LABELS.length - 1}
          className="flex items-center gap-2 px-4 py-2 text-xs font-black uppercase tracking-widest border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-600 transition-all cursor-pointer disabled:opacity-30"
        >
          Next <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}
