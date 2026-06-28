import React, { useState, useEffect } from 'react';
import { Shield, Trophy, Medal } from 'lucide-react';
import { getGroupPredictions, getGroupStandings } from '../api';

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

interface TeamStanding {
  code: string;
  name: string;
  flagUrl: string;
  pts: number;
  gd: number;
  gf: number;
  ga: number;
  position: number;
}

interface GroupStandingResult {
  groupName: string;
  standings: TeamStanding[];
}

interface GroupPrediction {
  groupName: string;
  teams: { code: string; name: string; flagUrl: string }[];
  prediction: { firstCode: string; secondCode: string; thirdCode: string | null; thirdQualifies: boolean } | null;
}

interface GroupPicks {
  [groupName: string]: { first: string | null; second: string | null; third: string | null };
}

function getPredictedRank(picks: { first: string | null; second: string | null; third: string | null } | undefined, teamCode: string): number | null {
  if (!picks) return null;
  if (picks.first === teamCode) return 1;
  if (picks.second === teamCode) return 2;
  if (picks.third === teamCode) return 3;
  return null;
}

export default function GroupStageView() {
  const [standings, setStandings] = useState<GroupStandingResult[]>([]);
  const [picks, setPicks] = useState<GroupPicks>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const [standingsData, groupsData] = await Promise.all([
          getGroupStandings(),
          getGroupPredictions(),
        ]);
        setStandings(standingsData);
        const init: GroupPicks = {};
        for (const g of groupsData as GroupPrediction[]) {
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
        <h1 className="text-3xl md:text-4xl font-black text-white uppercase tracking-tighter mb-2">Group Stage Standings</h1>
        <p className="text-zinc-400 text-sm font-bold uppercase tracking-[0.2em]">Final standings after all group matches</p>
      </header>

      {error && (
        <div className="bg-red-950/40 border border-red-800 text-red-400 p-4 text-xs font-bold uppercase tracking-wider">{error}</div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {standings.map(group => {
          const groupPicks = picks[group.groupName] || { first: null, second: null, third: null };

          return (
            <div key={group.groupName} className="bg-zinc-950 border border-zinc-800 overflow-hidden">
              <div className="bg-zinc-900 px-5 py-3 border-b border-zinc-800 flex items-center justify-between">
                <h3 className="font-black text-sm text-white uppercase tracking-widest">{group.groupName}</h3>
                <Shield size={14} className="text-zinc-500" />
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-zinc-800">
                      <th className="text-left px-3 py-2 text-zinc-500 font-black uppercase tracking-wider text-[10px] w-8">#</th>
                      <th className="text-left px-2 py-2 text-zinc-500 font-black uppercase tracking-wider text-[10px]">Team</th>
                      <th className="text-center px-2 py-2 text-zinc-500 font-black uppercase tracking-wider text-[10px] w-8">Pts</th>
                      <th className="text-center px-2 py-2 text-zinc-500 font-black uppercase tracking-wider text-[10px] w-8">GD</th>
                      <th className="text-center px-2 py-2 text-zinc-500 font-black uppercase tracking-wider text-[10px] w-8">GF</th>
                      <th className="text-center px-2 py-2 text-zinc-500 font-black uppercase tracking-wider text-[10px] w-14">Your Pick</th>
                    </tr>
                  </thead>
                  <tbody>
                    {group.standings.map(team => {
                      const predictedRank = getPredictedRank(groupPicks, team.code);
                      const actualPosition = team.position;
                      const correct = predictedRank === actualPosition;

                      return (
                        <tr key={team.code} className="border-b border-zinc-800/50 hover:bg-zinc-900/50">
                          <td className="px-3 py-2.5">
                            <span className={`font-black text-xs ${
                              actualPosition === 1 ? 'text-yellow-400' :
                              actualPosition === 2 ? 'text-zinc-300' :
                              actualPosition === 3 ? 'text-amber-600' :
                              'text-zinc-600'
                            }`}>
                              {actualPosition}
                            </span>
                          </td>
                          <td className="px-2 py-2.5">
                            <div className="flex items-center gap-2">
                              <img loading="lazy" src={flagUrl(team.code)} className="w-5 h-3.5 object-contain shrink-0" alt="" />
                              <span className="font-bold text-zinc-200 uppercase tracking-wider truncate">{team.name}</span>
                            </div>
                          </td>
                          <td className="px-2 py-2.5 text-center font-black text-zinc-100">{team.pts}</td>
                          <td className={`px-2 py-2.5 text-center font-black ${
                            team.gd > 0 ? 'text-green-400' : team.gd < 0 ? 'text-red-400' : 'text-zinc-400'
                          }`}>{team.gd > 0 ? `+${team.gd}` : team.gd}</td>
                          <td className="px-2 py-2.5 text-center font-black text-zinc-300">{team.gf}</td>
                          <td className="px-2 py-2.5 text-center">
                            {predictedRank ? (
                              <span className={`inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-1.5 py-0.5 ${
                                correct
                                  ? 'bg-green-900/60 text-green-400'
                                  : 'bg-zinc-800 text-zinc-400'
                              }`}>
                                {predictedRank === 1 ? '1st' : predictedRank === 2 ? '2nd' : '3rd'}
                                {correct && <span className="text-green-400">✓</span>}
                              </span>
                            ) : (
                              <span className="text-zinc-700 text-[10px]">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="bg-zinc-900 px-4 py-2 border-t border-zinc-800 flex flex-wrap gap-2 text-[9px] font-black uppercase tracking-wider">
                {groupPicks.first && (() => {
                  const actualFirst = group.standings[0]?.code;
                  return (
                    <span className={actualFirst === groupPicks.first ? 'text-green-400' : 'text-yellow-500'}>
                      1st: {group.standings.find(t => t.code === groupPicks.first)?.name || groupPicks.first}
                      {actualFirst === groupPicks.first ? ' ✓' : ''}
                    </span>
                  );
                })()}
                {groupPicks.second && (() => {
                  const actualSecond = group.standings[1]?.code;
                  return (
                    <span className={actualSecond === groupPicks.second ? 'text-green-400' : 'text-zinc-300'}>
                      2nd: {group.standings.find(t => t.code === groupPicks.second)?.name || groupPicks.second}
                      {actualSecond === groupPicks.second ? ' ✓' : ''}
                    </span>
                  );
                })()}
                {groupPicks.third && (() => {
                  const actualThird = group.standings[2]?.code;
                  return (
                    <span className={actualThird === groupPicks.third ? 'text-green-400' : 'text-amber-600'}>
                      3rd: {group.standings.find(t => t.code === groupPicks.third)?.name || groupPicks.third}
                      {actualThird === groupPicks.third ? ' ✓' : ''}
                    </span>
                  );
                })()}
              </div>
            </div>
          );
        })}
      </div>

      <footer className="bg-zinc-900 border border-zinc-800 p-6">
        <div className="flex items-center justify-center gap-4 text-zinc-500 text-sm font-bold">
          <Trophy size={16} className="text-yellow-500" />
          <span className="text-green-400">✓</span><span>Correct prediction</span>
          <span className="text-zinc-600">|</span>
          <Medal size={16} className="text-zinc-400" />
          <span>Your picks shown in your pick column</span>
        </div>
      </footer>
    </div>
  );
}
