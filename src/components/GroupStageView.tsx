import React, { useState, useEffect } from 'react';
import { Check, Save, Info, Trophy, Medal, Award, Shield } from 'lucide-react';
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

const RANK_LABELS = ['1st', '2nd', '3rd'] as const;

export default function GroupStageView() {
  const [groups, setGroups] = useState<GroupData[]>([]);
  const [picks, setPicks] = useState<Record<string, { first: string | null; second: string | null; third: string | null }>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

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

  function handleTeamClick(groupName: string, teamCode: string) {
    const group = picks[groupName];
    if (!group) return;

    const next = { ...group };

    if (next.first === teamCode) {
      next.first = null;
      if (next.second) { next.first = next.second; next.second = null; }
    }
    if (next.second === teamCode) {
      next.second = null;
      if (next.third) { next.second = next.third; next.third = null; }
    }
    if (next.third === teamCode) {
      next.third = null;
    }

    if (!next.first) {
      next.first = teamCode;
    } else if (!next.second && next.first !== teamCode) {
      next.second = teamCode;
    } else if (!next.third && next.first !== teamCode && next.second !== teamCode) {
      next.third = teamCode;
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

  async function handleSave() {
    const allComplete = groups.every(g => {
      const p = picks[g.groupName];
      return p && p.first && p.second;
    });

    if (!allComplete) {
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

  function getSlotStyle(rank: number | null) {
    if (rank === 1) return 'bg-yellow-950/40 border-yellow-600 text-yellow-400';
    if (rank === 2) return 'bg-zinc-800 border-zinc-500 text-zinc-300';
    if (rank === 3) return 'bg-amber-950/30 border-amber-700 text-amber-500';
    return 'bg-zinc-900 border-zinc-800 text-zinc-500';
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
        <p className="text-zinc-400 text-sm font-bold uppercase tracking-[0.2em]">Rank the teams in each group</p>
      </header>

      {error && (
        <div className="bg-red-950/40 border border-red-800 text-red-400 p-4 text-xs font-bold uppercase tracking-wider">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {groups.map(group => {
          const groupPicks = picks[group.groupName] || { first: null, second: null, third: null };
          const ranked = new Set([groupPicks.first, groupPicks.second, groupPicks.third].filter(Boolean));

          return (
            <div key={group.groupName} className="bg-zinc-950 border border-zinc-800 overflow-hidden">
              <div className="bg-zinc-900 px-5 py-3 border-b border-zinc-800 flex items-center justify-between">
                <h3 className="font-black text-sm text-white uppercase tracking-widest">{group.groupName}</h3>
                <Shield size={14} className="text-zinc-500" />
              </div>

              <div className="p-4 space-y-2">
                <div className="flex gap-2 mb-3">
                  {([['first', 1], ['second', 2], ['third', 3]] as const).map(([key, rank]) => {
                    const code = groupPicks[key];
                    return (
                      <div key={key} className={`flex-1 p-2 border text-center text-[10px] font-black uppercase tracking-wider ${getSlotStyle(rank)}`}>
                        {code ? (
                          <div className="flex items-center justify-center gap-1.5">
                            <img src={flagUrl(code)} className="w-4 h-3 object-contain" alt="" />
                            <span className="truncate">{getTeamName(code)}</span>
                          </div>
                        ) : (
                          <span>{RANK_LABELS[rank - 1]}</span>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="space-y-1">
                  {group.teams.map(team => {
                    const rank = getTeamRank(group.groupName, team.code);
                    const isRanked = rank !== null;

                    return (
                      <button
                        key={team.code}
                        onClick={() => handleTeamClick(group.groupName, team.code)}
                        className={`w-full flex items-center gap-3 p-2.5 text-xs font-bold uppercase tracking-wider border transition-all cursor-pointer ${
                          isRanked
                            ? getSlotStyle(rank)
                            : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-600 hover:text-white'
                        }`}
                      >
                        <img src={flagUrl(team.code)} className="w-6 h-4 object-contain" alt="" />
                        <span className="flex-1 text-left">{team.name}</span>
                        {isRanked ? <Check size={12} /> : <span className="text-zinc-600 text-[9px]">+</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <footer className="flex items-center gap-4 bg-zinc-800/80 backdrop-blur-md p-6 border border-zinc-500/10">
        <div className="flex items-center gap-2 text-zinc-400 text-xs font-bold">
          <Info size={16} />
          <span>Select 1st, 2nd, and 3rd for each group. Click a ranked team to change.</span>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="ml-auto min-w-[200px] bg-[#1d1409] hover:bg-[#4b3d2e] text-white font-extrabold py-3.5 px-8 transition-all text-sm cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {saving ? 'Saving...' : saved ? (
            <><Check size={16} /> Saved!</>
          ) : (
            <><Save size={16} /> Save Predictions</>
          )}
        </button>
      </footer>
    </div>
  );
}
