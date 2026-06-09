import React, { useState, useEffect } from 'react';
import { Trophy, Check, Award, ArrowRight, Lock, Info, ChevronLeft, ChevronRight, Shield } from 'lucide-react';
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
  { key: 'roundOf32', label: 'Round of 32', short: 'R32', matches: 16 },
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
  const [needsGroups, setNeedsGroups] = useState(false);
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
          setNeedsGroups(true);
        }
      } catch (err: any) {
        if (err.message?.includes('Complete all 12 group predictions')) {
          setNeedsGroups(true);
        } else {
          setError(err.message);
        }
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

  function handlePick(roundKey: RoundKey, matchIdx: number, team: 'A' | 'B') {
    if (isLocked || !bracket) return;
    const next = JSON.parse(JSON.stringify(bracket)) as BracketTree;
    const match = next[roundKey][matchIdx];
    const code = team === 'A' ? match.teamA : match.teamB;
    if (!code) return;

    if (match.winner === code) {
      match.winner = null;
    } else {
      match.winner = code;
    }

    // Auto-advance winners through the bracket
    advanceToNext(next);
    setBracket(next);
  }

  function advanceToNext(b: BracketTree) {
    // R32 winners → R16
    b.roundOf16.forEach((m, i) => {
      const feedA = b.roundOf32[i * 2];
      const feedB = b.roundOf32[i * 2 + 1];
      m.teamA = feedA?.winner || null;
      m.teamB = feedB?.winner || null;
      if (m.winner && m.winner !== m.teamA && m.winner !== m.teamB) m.winner = null;
    });

    // R16 winners → QF
    b.quarterFinals.forEach((m, i) => {
      const feedA = b.roundOf16[i * 2];
      const feedB = b.roundOf16[i * 2 + 1];
      m.teamA = feedA?.winner || null;
      m.teamB = feedB?.winner || null;
      if (m.winner && m.winner !== m.teamA && m.winner !== m.teamB) m.winner = null;
    });

    // QF winners → SF
    b.semiFinals.forEach((m, i) => {
      const feedA = b.quarterFinals[i * 2];
      const feedB = b.quarterFinals[i * 2 + 1];
      m.teamA = feedA?.winner || null;
      m.teamB = feedB?.winner || null;
      if (m.winner && m.winner !== m.teamA && m.winner !== m.teamB) m.winner = null;
    });

    // SF winners → Final
    b.final.teamA = b.semiFinals[0]?.winner || null;
    b.final.teamB = b.semiFinals[1]?.winner || null;
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
  const roundData = bracket ? bracket[currentRound.key] : [];
  const matches = currentRound.key === 'final' ? [bracket?.final] : roundData as BracketMatch[];

  function countPicks(): number {
    if (!bracket) return 0;
    let c = 0;
    for (const m of bracket.roundOf32) if (m.winner) c++;
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

  if (needsGroups) {
    return (
      <div className="w-full space-y-6">
        <header className="mb-4">
          <h1 className="text-3xl md:text-4xl font-black text-white uppercase tracking-tighter mb-2">Knockout Bracket</h1>
          <p className="text-zinc-400 text-sm font-bold uppercase tracking-[0.2em]">Complete your group predictions first</p>
        </header>
        <div className="bg-zinc-950 border border-zinc-800 p-12 text-center">
          <Trophy size={48} className="mx-auto text-zinc-600 mb-4" />
          <h3 className="text-lg font-black text-zinc-400 uppercase tracking-tighter mb-2">Group Predictions Required</h3>
          <p className="text-zinc-500 text-sm max-w-md mx-auto">
            You need to complete all 12 group predictions before the knockout bracket can be generated.
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full space-y-6">
        <div className="bg-red-950/40 border border-red-800 text-red-400 p-4 text-xs font-bold uppercase tracking-wider">{error}</div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      <header className="mb-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl md:text-4xl font-black text-white uppercase tracking-tighter mb-2">Knockout Bracket</h1>
            <p className="text-zinc-400 text-sm font-bold uppercase tracking-[0.2em]">Pick winners round by round</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Selections</p>
            <p className="font-black text-xl text-white">{countPicks()}/31</p>
          </div>
        </div>
      </header>

      {/* Round navigation */}
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

      {/* Round matches */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {matches.map((match, idx) => {
          if (!match) return null;
          const actualIdx = currentRound.key === 'final' ? 0 : idx;

          return (
            <div key={actualIdx} className="bg-zinc-950 border border-zinc-800 overflow-hidden">
              {(currentRound.key !== 'final' || true) && (
                <div className="bg-zinc-900 px-4 py-2 border-b border-zinc-800 flex items-center justify-between">
                  <span className="font-black text-[10px] text-zinc-500 uppercase tracking-widest">
                    Match {actualIdx + 1}
                  </span>
                  <Shield size={12} className="text-zinc-500" />
                </div>
              )}

              <div className="p-4 space-y-2">
                {([['A', match.teamA], ['B', match.teamB]] as const).map(([side, code]) => {
                  if (!code) {
                    return (
                      <div key={side} className="bg-zinc-900 border border-zinc-800 p-3 text-center text-xs font-bold text-zinc-600 uppercase tracking-wider">
                        TBD
                      </div>
                    );
                  }
                  const isWinner = match.winner === code;
                  return (
                    <button
                      key={side}
                      onClick={() => handlePick(currentRound.key as RoundKey, actualIdx, side)}
                      disabled={isLocked}
                      className={`w-full flex items-center gap-3 p-3 text-xs font-bold uppercase tracking-wider border transition-all cursor-pointer ${
                        isWinner
                          ? 'bg-emerald-950/40 border-emerald-600 text-emerald-400'
                          : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:border-zinc-600 hover:text-white disabled:opacity-50'
                      }`}
                    >
                      <img src={flagUrl(code)} className="w-6 h-4 object-contain" alt="" />
                      <span className="flex-1 text-left">{teamNames[code] || code}</span>
                      {isWinner && <Check size={14} />}
                    </button>
                  );
                })}
              </div>

              <div className="bg-zinc-900 px-4 py-2 border-t border-zinc-800 flex items-center justify-between">
                <span className="text-[9px] font-bold text-zinc-600 uppercase tracking-wider">
                  {currentRound.key !== 'final' ? `→ R${currentRoundIdx + 2}` : 'Champion'}
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

      {/* Navigation arrows */}
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
            className="bg-zinc-800 hover:bg-zinc-700 text-white font-black py-2 px-6 text-xs uppercase tracking-widest transition-all cursor-pointer disabled:opacity-30"
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
              className="bg-white hover:bg-zinc-200 text-black font-black py-2 px-6 text-xs uppercase tracking-widest transition-all cursor-pointer disabled:opacity-30"
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
