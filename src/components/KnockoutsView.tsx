import React, { useState, useEffect } from 'react';
import { Trophy, Check, Award, ArrowRight } from 'lucide-react';
import { getBracket, saveBracket, lockBracket as lockBracketApi, getFixtures } from '../api';

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

interface TeamInfo {
  code: string;
  name: string;
  groupName: string;
}

interface KnockoutsViewProps {
  username: string;
}

export default function KnockoutsView({ username }: KnockoutsViewProps) {
  const [allTeams, setAllTeams] = useState<TeamInfo[]>([]);
  const [stage, setStage] = useState<1 | 2 | 3>(1);
  const [qfSlots, setQfSlots] = useState<(string | null)[]>([null, null, null, null]);
  const [sfSlots, setSfSlots] = useState<(string | null)[]>([null, null]);
  const [champion, setChampion] = useState<string | null>(null);
  const [isLocked, setIsLocked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [fixturesData, bracketData] = await Promise.all([
          getFixtures().catch(() => null),
          getBracket(username).catch(() => null),
        ]);

        if (fixturesData) {
          const list = fixturesData.value || fixturesData || [];
          const teamMap = new Map<string, TeamInfo>();
          list.forEach((f: any) => {
            if (f.teamA?.code) {
              teamMap.set(f.teamA.code, {
                code: f.teamA.code, name: f.teamA.name,
                groupName: f.teamA.groupName || f.groupName || '',
              });
            }
            if (f.teamB?.code) {
              teamMap.set(f.teamB.code, {
                code: f.teamB.code, name: f.teamB.name,
                groupName: f.teamB.groupName || f.groupName || '',
              });
            }
          });
          const teams = Array.from(teamMap.values());
          teams.sort((a, b) => a.groupName.localeCompare(b.groupName) || a.name.localeCompare(b.name));
          setAllTeams(teams);
        }

        if (bracketData) {
          const b = bracketData.bracket || bracketData;
          if (b.m1) {
            setQfSlots([b.m1, b.m2, b.m3, b.m4]);
            const sf = [b.q1 || '', b.q2 || ''];
            setSfSlots(sf);
            const ch = b.champion || '';
            setChampion(ch);
            setIsLocked(b.locked || false);
            if (ch) setStage(3);
            else if (sf.every(Boolean)) setStage(3);
            else if ([b.m1, b.m2, b.m3, b.m4].every(Boolean)) setStage(2);
          }
        }
      } catch {} finally { setLoading(false); }
    })();
  }, [username]);

  const usedTeamCodes = new Set(qfSlots.filter(Boolean));
  sfSlots.forEach(s => { if (s) usedTeamCodes.add(s); });
  if (champion) usedTeamCodes.add(champion);

  function getTeamName(code: string): string {
    return allTeams.find(t => t.code === code)?.name || code;
  }

  function handlePickQF(teamCode: string) {
    if (isLocked || qfSlots.includes(teamCode)) return;
    const idx = qfSlots.findIndex(s => s === null);
    if (idx === -1) return;
    const next = [...qfSlots];
    next[idx] = teamCode;
    setQfSlots(next);
    if (next.every(s => s !== null)) setTimeout(() => setStage(2), 400);
  }

  function handlePickSF(slotIndex: number, teamCode: string) {
    if (isLocked) return;
    const next = [...sfSlots];
    next[slotIndex] = teamCode;
    setSfSlots(next);
    if (next.every(s => s !== null)) setTimeout(() => setStage(3), 400);
  }

  function handlePickChampion(teamCode: string) {
    if (isLocked) return;
    setChampion(teamCode);
  }

  function handleUndo() {
    if (isLocked) return;
    if (stage === 3 && champion) { setChampion(null); setStage(2); return; }
    if (stage === 2) {
      if (sfSlots.some(Boolean)) {
        const idx = [...sfSlots].reverse().findIndex(s => s !== null);
        const next = [...sfSlots];
        next[sfSlots.length - 1 - idx] = null;
        setSfSlots(next);
      } else {
        setStage(1);
        const last = [...qfSlots].reverse().findIndex(s => s !== null);
        if (last !== -1) {
          const next = [...qfSlots];
          next[qfSlots.length - 1 - last] = null;
          setQfSlots(next);
        }
      }
      return;
    }
    if (stage === 1) {
      const last = [...qfSlots].reverse().findIndex(s => s !== null);
      if (last !== -1) {
        const next = [...qfSlots];
        next[qfSlots.length - 1 - last] = null;
        setQfSlots(next);
      }
    }
  }

  function handleReset() {
    if (isLocked) return;
    setQfSlots([null, null, null, null]);
    setSfSlots([null, null]);
    setChampion(null);
    setStage(1);
  }

  const handleSave = async () => {
    if (!qfSlots.every(Boolean) || !sfSlots.every(Boolean) || !champion) return;
    setSaving(true);
    try {
      await saveBracket({
        m1: qfSlots[0]!, m2: qfSlots[1]!, m3: qfSlots[2]!, m4: qfSlots[3]!,
        q1: sfSlots[0]!, q2: sfSlots[1]!,
        s1: champion!, champion: champion!,
      });
      alert('Bracket saved!');
    } catch (err: any) {
      alert(err.message || 'Failed to save');
    } finally { setSaving(false); }
  };

  const handleLock = async () => {
    if (!qfSlots.every(Boolean) || !sfSlots.every(Boolean) || !champion) return;
    setSaving(true);
    try {
      await lockBracketApi();
      setIsLocked(true);
      alert('Bracket locked!');
    } catch (err: any) {
      alert(err.message || 'Failed to lock');
    } finally { setSaving(false); }
  };

  if (loading) {
    return (
      <div className="w-full flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-zinc-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const teamsByGroup = allTeams.reduce<Record<string, TeamInfo[]>>((acc, t) => {
    const g = t.groupName || 'Other';
    if (!acc[g]) acc[g] = [];
    acc[g].push(t);
    return acc;
  }, {});
  const groupKeys = Object.keys(teamsByGroup).sort();

  return (
    <div className="w-full space-y-6">
      <header className="mb-4">
        <h1 className="text-3xl md:text-4xl font-black text-white uppercase tracking-tighter mb-2">Knockout Bracket</h1>
        <p className="text-zinc-400 text-sm font-bold uppercase tracking-[0.2em]">Predict the Final 8</p>
      </header>

      <div className="flex items-center gap-2 bg-zinc-950 p-4 border border-zinc-800">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center gap-2">
            {s > 1 && <ArrowRight size={14} className="text-zinc-600" />}
            <div className={`w-8 h-8 flex items-center justify-center font-black text-xs ${
              stage >= s ? 'bg-white text-black' : 'bg-zinc-900 text-zinc-500 border border-zinc-800'
            }`}>{s}</div>
            <span className={`text-[10px] font-black uppercase tracking-wider ${
              stage === s ? 'text-white' : 'text-zinc-500'
            }`}>
              {s === 1 ? 'Quarter-finalists' : s === 2 ? 'Finalists' : 'Champion'}
            </span>
          </div>
        ))}
        <div className="ml-auto flex gap-2">
          {stage > 1 && (
            <button onClick={handleUndo} className="text-zinc-400 hover:text-white text-[10px] font-black uppercase tracking-widest border border-zinc-800 px-3 py-1.5 transition-all cursor-pointer">
              Undo
            </button>
          )}
          <button onClick={handleReset} className="text-zinc-500 hover:text-zinc-300 text-[10px] font-black uppercase tracking-widest border border-zinc-800 px-3 py-1.5 transition-all cursor-pointer">
            Reset
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
        <div className="xl:col-span-8 space-y-6">
          {stage === 1 && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="text-lg font-black text-white uppercase tracking-tighter">Pick 4 Quarter-finalists</h3>
                <span className="text-zinc-500 text-xs font-bold">{qfSlots.filter(Boolean).length}/4 selected</span>
              </div>
              <div className="flex gap-3 mb-4">
                {qfSlots.map((slot, i) => (
                  <div key={i} className={`flex-1 p-3 border text-center font-black text-xs uppercase tracking-wider ${
                    slot ? 'bg-emerald-950/40 border-emerald-800 text-emerald-400' : 'bg-zinc-950 border-zinc-800 text-zinc-600'
                  }`}>
                    {slot ? (
                      <div className="flex items-center justify-center gap-2">
                        <img src={flagUrl(slot)} className="w-5 h-3.5 object-contain" alt="" />
                        <span>{getTeamName(slot)}</span>
                        <Check size={12} />
                      </div>
                    ) : `Slot ${i + 1}`}
                  </div>
                ))}
              </div>
              {groupKeys.map((group) => (
                <div key={group} className="bg-zinc-950 border border-zinc-800 p-4">
                  <h4 className="font-black text-[10px] text-zinc-500 uppercase tracking-widest mb-3">{group}</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                    {teamsByGroup[group].map((team) => {
                      const picked = qfSlots.includes(team.code);
                      return (
                        <button key={team.code} onClick={() => handlePickQF(team.code)}
                          disabled={picked || isLocked}
                          className={`flex items-center gap-2 p-2.5 text-xs font-bold uppercase tracking-wider border transition-all cursor-pointer ${
                            picked
                              ? 'bg-emerald-950/40 border-emerald-800 text-emerald-400'
                              : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:border-zinc-600 hover:text-white disabled:opacity-30'
                          }`}>
                          <img src={flagUrl(team.code)} className="w-6 h-4 object-contain" alt="" />
                          <span>{team.name}</span>
                          {picked && <Check size={12} className="ml-auto" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {stage === 2 && (
            <div className="space-y-6">
              <h3 className="text-lg font-black text-white uppercase tracking-tighter">Pick the 2 Finalists</h3>
              {[
                { label: 'Semi-final 1', a: qfSlots[0], b: qfSlots[1], slot: 0 },
                { label: 'Semi-final 2', a: qfSlots[2], b: qfSlots[3], slot: 1 },
              ].map(({ label, a, b, slot }) => (
                <div key={slot} className="bg-zinc-950 border border-zinc-800 p-6">
                  <h4 className="font-black text-[10px] text-zinc-500 uppercase tracking-widest mb-4">{label}</h4>
                  <div className="flex items-center justify-center gap-4">
                    {[a, b].map((teamCode, i) => (
                      <button key={i} onClick={() => handlePickSF(slot, teamCode!)}
                        disabled={isLocked}
                        className={`flex flex-col items-center gap-3 p-6 border-2 min-w-[160px] transition-all cursor-pointer ${
                          sfSlots[slot] === teamCode
                            ? 'bg-emerald-950/40 border-emerald-500 text-emerald-400'
                            : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:border-zinc-600 disabled:opacity-50'
                        }`}>
                        <img src={flagUrl(teamCode!)} className="w-12 h-8 object-contain" alt="" />
                        <span className="font-black text-sm uppercase tracking-wide">{getTeamName(teamCode!)}</span>
                        {sfSlots[slot] === teamCode && <Check size={16} />}
                      </button>
                    ))}
                    <span className="text-zinc-600 font-black text-lg hidden md:block">VS</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {stage === 3 && (
            <div className="space-y-6">
              <h3 className="text-lg font-black text-white uppercase tracking-tighter">Crown the Champion</h3>
              <div className="bg-zinc-950 border border-zinc-800 p-8">
                <div className="flex flex-col md:flex-row items-center justify-center gap-8">
                  {[sfSlots[0], sfSlots[1]].map((teamCode, i) => (
                    <React.Fragment key={i}>
                      {i === 1 && <span className="text-zinc-600 font-black text-2xl hidden md:block">VS</span>}
                      <button onClick={() => handlePickChampion(teamCode!)}
                        disabled={isLocked}
                        className={`flex flex-col items-center gap-4 p-8 border-2 min-w-[200px] transition-all cursor-pointer ${
                          champion === teamCode
                            ? 'bg-yellow-950/40 border-yellow-500 text-yellow-400'
                            : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:border-zinc-600 disabled:opacity-50'
                        }`}>
                        <Trophy size={32} className={champion === teamCode ? 'text-yellow-400' : 'text-zinc-500'} />
                        <img src={flagUrl(teamCode!)} className="w-16 h-10 object-contain" alt="" />
                        <span className="font-black text-lg uppercase tracking-wide">{getTeamName(teamCode!)}</span>
                        {champion === teamCode && <Check size={20} />}
                      </button>
                    </React.Fragment>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        <aside className="xl:col-span-4 space-y-6">
          <div className="bg-zinc-950 border border-zinc-800 p-6 relative overflow-hidden">
            <h3 className="font-black text-xs text-white uppercase tracking-widest mb-4 flex items-center gap-2">
              <Award size={14} /> Your Bracket
            </h3>
            {champion ? (
              <div className="text-center py-6 bg-zinc-900 border border-zinc-800 mb-6">
                <Trophy size={40} className="mx-auto text-yellow-500 mb-3" />
                <h4 className="font-black text-xl text-yellow-400 mb-1">{getTeamName(champion)}</h4>
                <p className="text-zinc-500 text-[10px] uppercase font-bold tracking-wider">Your Champion</p>
              </div>
            ) : (
              <div className="text-center py-8 border border-dashed border-zinc-800 bg-zinc-900 mb-6">
                <p className="text-zinc-500 text-xs font-bold uppercase tracking-wider">No champion selected</p>
              </div>
            )}
            {qfSlots.every(Boolean) && (
              <div className="space-y-3 text-xs mb-6">
                <p className="font-black text-[10px] text-zinc-500 uppercase tracking-widest">Quarter-finalists</p>
                <div className="grid grid-cols-2 gap-2">
                  {qfSlots.map((code, i) => code ? (
                    <div key={i} className="bg-zinc-900 border border-zinc-800 p-2 flex items-center gap-2">
                      <img src={flagUrl(code)} className="w-5 h-3.5 object-contain" alt="" />
                      <span className="font-bold text-white text-[10px] truncate">{getTeamName(code)}</span>
                    </div>
                  ) : null)}
                </div>
              </div>
            )}
            <div className="space-y-3 border-t border-zinc-800 pt-4">
              <div className="flex justify-between text-sm">
                <span className="text-zinc-500 font-bold text-[10px] uppercase tracking-wider">Points at Stake</span>
                <span className="font-black text-white">+2,500 PTS</span>
              </div>
            </div>
            <div className="mt-6 space-y-3">
              {!isLocked && (
                <button onClick={handleSave} disabled={saving || !champion}
                  className="w-full bg-zinc-800 hover:bg-zinc-700 text-white font-black py-3 text-xs uppercase tracking-widest transition-all cursor-pointer disabled:opacity-30">
                  {saving ? 'Saving...' : 'Save Bracket'}
                </button>
              )}
              {isLocked ? (
                <div className="w-full text-center bg-emerald-950/40 border border-emerald-800 text-emerald-400 py-3 font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2">
                  <Check size={14} /> BRACKET LOCKED
                </div>
              ) : (
                <button onClick={handleLock} disabled={saving || !champion}
                  className="w-full bg-white hover:bg-zinc-200 text-black font-black py-3 text-xs uppercase tracking-widest transition-all cursor-pointer disabled:opacity-30">
                  Lock Bracket
                </button>
              )}
            </div>
          </div>
          <div className="bg-zinc-950 border border-zinc-800 p-6">
            <h4 className="font-black text-[10px] uppercase text-zinc-500 tracking-widest mb-2">How it works</h4>
            <ul className="text-zinc-500 text-[11px] space-y-1.5 font-medium">
              <li>1. Pick 4 teams for Quarter-finals</li>
              <li>2. Pick 2 Finalists from each pair</li>
              <li>3. Crown your Champion</li>
              <li className="text-zinc-400 pt-1">Lock before Round of 32</li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}
