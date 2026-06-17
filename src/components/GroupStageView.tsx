import React, { useState, useEffect } from 'react';
import { Check, Save, Info, Shield, Lock, Clock } from 'lucide-react';
import { getGroupPredictions, saveGroupPredictions } from '../api';

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
  flagUrl: string;
}

interface GroupData {
  groupName: string;
  teams: TeamInfo[];
  prediction: { firstCode: string; secondCode: string; thirdCode: string | null; thirdQualifies: boolean } | null;
}

export default function GroupStageView() {
  const [groups, setGroups] = useState<GroupData[]>([]);
  const [picks, setPicks] = useState<Record<string, { first: string | null; second: string | null; third: string | null }>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  const DEADLINE = new Date('2026-06-17T18:30:00Z');
  const isClosed = new Date() > DEADLINE;

  useEffect(() => {
    (async () => {
      try {
        const data = await getGroupPredictions();
        setGroups(data);
        const init: Record<string, { first: string | null; second: string | null; third: string | null }> = {};
        for (const g of data) {
          init[g.groupName] = {
            first: g.prediction?.firstCode || null,
            second: g.prediction?.secondCode || null,
            third: g.prediction?.thirdCode || null,
          };
        }
        setPicks(init);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  function directRank(groupName: string, teamCode: string, rank: 1 | 2 | 3) {
    const group = picks[groupName];
    if (!group) return;
    const next = { ...group };
    const currentThirdCount = (Object.values(picks) as { first: string | null; second: string | null; third: string | null }[]).filter(p => p.third !== null).length;

    if (rank === 1) {
      if (next.first === teamCode) { next.first = null; return; }
      if (next.second === teamCode) next.second = null;
      if (next.third === teamCode) next.third = null;
      next.first = teamCode;
    } else if (rank === 2) {
      if (next.second === teamCode) { next.second = null; return; }
      if (next.first === teamCode) next.first = null;
      if (next.third === teamCode) next.third = null;
      next.second = teamCode;
    } else {
      if (next.third === teamCode) { next.third = null; return; }
      if (group.third) { next.third = teamCode; }
      else {
        if (currentThirdCount >= 8) return;
        if (next.first === teamCode) next.first = null;
        if (next.second === teamCode) next.second = null;
        next.third = teamCode;
      }
    }

    setPicks(prev => ({ ...prev, [groupName]: next }));
  }

  function getTeamName(code: string | null): string {
    if (!code) return '';
    for (const g of groups) {
      const t = g.teams.find(t => t.code === code);
      if (t) return t.name;
    }
    return code;
  }

  function getTeamRank(groupName: string, teamCode: string): number | null {
    const group = picks[groupName];
    if (!group) return null;
    if (group.first === teamCode) return 1;
    if (group.second === teamCode) return 2;
    if (group.third === teamCode) return 3;
    return null;
  }

  const allGroupsComplete = groups.every(g => {
    const p = picks[g.groupName];
    return p && p.first && p.second;
  });

  const thirdCount = (Object.values(picks) as { first: string | null; second: string | null; third: string | null }[]).filter(p => p.third !== null).length;

  async function handleSave() {
    if (!allGroupsComplete) {
      alert('Please select at least 1st and 2nd place for all 12 groups.');
      return;
    }

    setSaving(true);
    setError('');
    try {
      const data = groups.map(g => {
        const p = picks[g.groupName];
        return {
          groupName: g.groupName,
          firstCode: p.first!,
          secondCode: p.second!,
          thirdCode: p.third || null,
          thirdQualifies: !!p.third,
        };
      });
      await saveGroupPredictions(data);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

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
        <h1 className="text-3xl md:text-4xl font-black text-white uppercase tracking-tighter mb-2">Group Stage Predictor</h1>
        <p className="text-zinc-400 text-sm font-bold uppercase tracking-[0.2em]">
          {isClosed ? 'Predictions are locked — Time Over' : 'Pick 1st and 2nd for all 12 groups, then 3rd for up to 8 groups'}
        </p>
      </header>

      {isClosed && (
        <div className="bg-red-950/40 border border-red-800 text-red-400 p-4 text-xs font-bold uppercase tracking-wider flex items-center gap-3">
          <Clock size={18} />
          <span>Group predictions are closed. You can view your picks below.</span>
        </div>
      )}

      {error && (
        <div className="bg-red-950/40 border border-red-800 text-red-400 p-4 text-xs font-bold uppercase tracking-wider">{error}</div>
      )}

      {!isClosed && thirdCount > 0 && (
        <div className="bg-zinc-900 border border-zinc-800 px-5 py-3 flex items-center gap-2">
          <Shield size={14} className="text-amber-500" />
          <span className="text-xs font-black uppercase tracking-wider text-zinc-300">
            {thirdCount}/8 third-place slots filled
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {groups.map(group => {
          const groupPicks = picks[group.groupName] || { first: null, second: null, third: null };

          return (
            <div key={group.groupName} className="bg-zinc-950 border border-zinc-800 overflow-hidden">
              <div className="bg-zinc-900 px-5 py-3 border-b border-zinc-800 flex items-center justify-between">
                <h3 className="font-black text-sm text-white uppercase tracking-widest">{group.groupName}</h3>
                <Shield size={14} className="text-zinc-500" />
              </div>

              <div className="p-3 space-y-1.5">
                {group.teams.map(team => {
                  const rank = getTeamRank(group.groupName, team.code);
                  const thirdSlotFull = thirdCount >= 8 && rank !== 3;

                  return (
                    <div key={team.code} className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 p-2.5">
                      <img loading="lazy" src={flagUrl(team.code)} className="w-6 h-4 object-contain shrink-0" alt="" />
                      <span className="flex-1 text-xs font-bold text-zinc-300 uppercase tracking-wider truncate">
                        {team.name}
                      </span>
                      {isClosed ? (
                        rank && (
                          <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 ${
                            rank === 1 ? 'bg-yellow-500 text-black' :
                            rank === 2 ? 'bg-zinc-200 text-black' :
                            'bg-amber-700 text-white'
                          }`}>
                            {rank === 1 ? '1st' : rank === 2 ? '2nd' : '3rd'}
                          </span>
                        )
                      ) : (
                        <div className="flex gap-1">
                          {([1, 2, 3] as const).map(r => {
                            const isActive = rank === r;
                            const isThirdDisabled = r === 3 && thirdSlotFull;
                            return (
                              <button
                                key={r}
                                onClick={() => directRank(group.groupName, team.code, r)}
                                disabled={isThirdDisabled}
                                className={`w-7 h-7 text-[9px] font-black uppercase tracking-wider border transition-all cursor-pointer ${
                                  isActive
                                    ? r === 1
                                      ? 'bg-yellow-500 text-black border-yellow-500'
                                      : r === 2
                                      ? 'bg-zinc-200 text-black border-zinc-200'
                                      : 'bg-amber-700 text-white border-amber-700'
                                    : isThirdDisabled
                                    ? 'bg-zinc-800 text-zinc-600 border-zinc-700 cursor-not-allowed opacity-40'
                                    : 'bg-zinc-800 text-zinc-500 border-zinc-700 hover:border-zinc-500 hover:text-zinc-300'
                                }`}
                              >
                                {r === 1 ? '1st' : r === 2 ? '2nd' : '3rd'}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="bg-zinc-900 px-4 py-2 border-t border-zinc-800 flex gap-3 text-[9px] font-black uppercase tracking-wider">
                {groupPicks.first && (
                  <span className="text-yellow-500">1st: {getTeamName(groupPicks.first)}</span>
                )}
                {groupPicks.second && (
                  <span className="text-zinc-200">2nd: {getTeamName(groupPicks.second)}</span>
                )}
                {groupPicks.third && (
                  <span className="text-amber-600">3rd: {getTeamName(groupPicks.third)}</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {isClosed ? (
        <footer className="bg-zinc-900 border border-zinc-800 p-6">
          <div className="flex items-center justify-center gap-2 text-zinc-500 text-sm font-bold">
            <Lock size={16} />
            <span>Group predictions are finalized — Time Over</span>
          </div>
        </footer>
      ) : (
        <footer className="flex items-center gap-4 bg-zinc-900 border border-zinc-800 p-6">
          <div className="flex items-center gap-2 text-zinc-500 text-xs font-bold">
            <Info size={16} />
            <span>Click 1st/2nd/3rd badges to assign positions. Click again to remove. Max 8 third-place picks.</span>
          </div>
          <button
            onClick={handleSave}
            disabled={saving || !allGroupsComplete}
            className="ml-auto min-w-[200px] bg-white hover:bg-zinc-200 text-black font-black py-3.5 px-8 transition-all text-sm cursor-pointer disabled:opacity-30 flex items-center justify-center gap-2"
          >
            {saving ? 'Saving...' : saved ? (
              <><Check size={16} /> Saved!</>
            ) : (
              <><Save size={16} /> Save Group Predictions</>
            )}
          </button>
        </footer>
      )}
    </div>
  );
}
