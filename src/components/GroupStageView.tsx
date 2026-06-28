import React, { useState, useEffect } from 'react';
import { Shield, Clock, Check } from 'lucide-react';
import { getGroupPredictions, getFixtures, submitPrediction } from '../api';

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

export default function GroupStageView() {
  const [groups, setGroups] = useState<GroupPredictionView[]>([]);
  const [r32Fixtures, setR32Fixtures] = useState<any[]>([]);
  const [fixtureScores, setFixtureScores] = useState<Record<string, { a: string; b: string }>>({});
  const [savedFixtures, setSavedFixtures] = useState<Record<string, boolean>>({});
  const [fixtureErrors, setFixtureErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState<'predictions' | 'r32'>('predictions');

  useEffect(() => {
    (async () => {
      try {
        const [groupsData, fixturesData] = await Promise.all([
          getGroupPredictions(),
          getFixtures(),
        ]);
        setGroups(groupsData);
        const list = fixturesData.value || fixturesData || [];
        const r32 = list.filter((f: any) => f.id.startsWith('r32_'));
        setR32Fixtures(r32);
        const init: Record<string, { a: string; b: string }> = {};
        r32.forEach((f: any) => {
          const pred = f.predictions?.length > 0 ? f.predictions[0] : null;
          init[f.id] = { a: pred ? String(pred.scoreA) : '', b: pred ? String(pred.scoreB) : '' };
        });
        setFixtureScores(init);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  function handleScoreInput(id: string, side: 'a' | 'b', raw: string) {
    const cleaned = raw.replace(/[^0-9]/g, '');
    setFixtureScores(prev => ({ ...prev, [id]: { ...prev[id], [side]: cleaned } }));
    setFixtureErrors(prev => ({ ...prev, [id]: '' }));
  }

  async function handleFixturePredict(id: string) {
    const s = fixtureScores[id];
    if (!s?.a.trim() || !s?.b.trim()) return;
    const f = r32Fixtures.find(fx => fx.id === id);
    if (f && (f.isClosed || f.actualScoreA !== null || new Date(f.kickoffTime) <= new Date())) {
      alert('Match has already started or closed');
      return;
    }
    const a = parseInt(s.a);
    const b = parseInt(s.b);
    if (isNaN(a) || isNaN(b) || a < 0 || b < 0) {
      setFixtureErrors(prev => ({ ...prev, [id]: 'Enter valid non-negative numbers' }));
      return;
    }
    setFixtureErrors(prev => ({ ...prev, [id]: '' }));
    try {
      await submitPrediction(id, a, b);
      setSavedFixtures(prev => ({ ...prev, [id]: true }));
      setTimeout(() => setSavedFixtures(prev => ({ ...prev, [id]: false })), 2000);
    } catch {
      alert('Failed to save');
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
        <p className="text-zinc-400 text-sm font-bold uppercase tracking-[0.2em]">Group predictions &amp; Round of 32 score predictions</p>
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
          Round of 32 Scores
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
              Predict scores for all Round of 32 matches
            </span>
          </div>

          {r32Fixtures.length === 0 ? (
            <div className="bg-zinc-950 border border-zinc-800 p-12 text-center">
              <h3 className="text-lg font-black text-zinc-400 uppercase tracking-tighter mb-2">No R32 Fixtures Yet</h3>
              <p className="text-zinc-500 text-sm max-w-md mx-auto">
                Round of 32 fixtures will appear here once group stage results are finalized.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {r32Fixtures.map((f: any) => {
                const s = fixtureScores[f.id] || { a: '', b: '' };
                const isPast = f.isClosed || f.actualScoreA !== null || new Date(f.kickoffTime) <= new Date();
                const justSaved = savedFixtures[f.id];
                return (
                  <div key={f.id} className="bg-zinc-950 p-5 border border-zinc-800 hover:border-zinc-600 transition-all">
                    <div className="flex items-center justify-between mb-3 border-b border-zinc-800 pb-2">
                      <span className="bg-zinc-900 text-zinc-300 border border-zinc-800 text-[9px] uppercase tracking-widest font-black px-2.5 py-0.5">{f.groupName}</span>
                      <div className="flex gap-1">
                        {f.status === 'live' && !f.isClosed && <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">LIVE</span>}
                        {f.isClosed && <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">CLOSED</span>}
                      </div>
                    </div>
                    <div className="flex items-center justify-between gap-2 mb-4">
                      <div className="flex flex-col items-center gap-1.5 flex-1 text-center">
                        <div className="w-10 h-10 bg-zinc-900 border border-zinc-800 flex items-center justify-center p-1">
                          <img loading="lazy" className="w-full h-full object-contain" src={flagUrl(f.teamACode)} alt="" />
                        </div>
                        <span className="font-extrabold text-xs text-white uppercase tracking-wide">{f.teamA?.name || f.teamACode}</span>
                      </div>
                      <div className="text-zinc-600 font-black text-xs uppercase tracking-widest">VS</div>
                      <div className="flex flex-col items-center gap-1.5 flex-1 text-center">
                        <div className="w-10 h-10 bg-zinc-900 border border-zinc-800 flex items-center justify-center p-1">
                          <img className="w-full h-full object-contain" src={flagUrl(f.teamBCode)} alt="" />
                        </div>
                        <span className="font-extrabold text-xs text-white uppercase tracking-wide">{f.teamB?.name || f.teamBCode}</span>
                      </div>
                    </div>
                    {isPast ? (
                      <div className="space-y-2">
                        {f.predictions?.[0] ? (
                          <div className="flex items-center justify-center gap-3">
                            <div className="text-center">
                              <div className="font-mono text-sm font-black text-zinc-400 bg-zinc-900 px-2.5 py-1 rounded border border-zinc-800">
                                <span>{f.predictions[0].scoreA ?? '?'}</span>
                                <span className="mx-0.5 text-zinc-600">-</span>
                                <span>{f.predictions[0].scoreB ?? '?'}</span>
                              </div>
                              <span className="text-[9px] font-bold text-zinc-600 mt-0.5 block uppercase">Your Guess</span>
                            </div>
                            <div className="text-center">
                              <div className="font-mono text-sm font-black text-white bg-zinc-900 px-2.5 py-1 rounded border border-zinc-700">
                                <span>{f.actualScoreA ?? '-'}</span>
                                <span className="mx-0.5 text-zinc-600">-</span>
                                <span>{f.actualScoreB ?? '-'}</span>
                              </div>
                              <span className="text-[9px] font-bold text-zinc-400 mt-0.5 block uppercase">Result</span>
                            </div>
                            {f.predictions[0].status !== 'OPEN' && (
                              <div className="flex flex-col items-center gap-0.5">
                                <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded ${f.predictions[0].status === 'CORRECT' ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-800/50' : 'bg-red-950/40 text-red-400 border border-red-800/50'}`}>
                                  {f.predictions[0].status === 'CORRECT' ? 'Correct' : 'Incorrect'}
                                </span>
                                <span className="text-[10px] font-mono font-black text-zinc-400">
                                  {f.predictions[0].status === 'CORRECT' ? `+${f.predictions[0].pointsEarned || 15} pts` : '0 pts'}
                                </span>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="text-center text-zinc-500 text-xs font-bold">
                            {f.actualScoreA != null ? `${f.actualScoreA} - ${f.actualScoreB}` : f.status === 'finished' ? 'Match ended' : 'Match started'}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div>
                        <div className="flex items-center gap-2">
                          <input type="text" inputMode="numeric" disabled={isPast} placeholder="0"
                            value={s.a}
                            onChange={(e) => handleScoreInput(f.id, 'a', e.target.value)}
                            className="w-full text-center bg-zinc-900 border border-zinc-800 py-2.5 focus:border-white outline-none font-black text-white text-sm disabled:opacity-50" />
                          <span className="text-zinc-600 font-black">-</span>
                          <input type="text" inputMode="numeric" disabled={isPast} placeholder="0"
                            value={s.b}
                            onChange={(e) => handleScoreInput(f.id, 'b', e.target.value)}
                            className="w-full text-center bg-zinc-900 border border-zinc-800 py-2.5 focus:border-white outline-none font-black text-white text-sm disabled:opacity-50" />
                          {justSaved ? (
                            <span className="bg-emerald-950/40 text-emerald-400 px-3 py-2.5 border border-emerald-800/50 text-[10px] font-black uppercase tracking-wider whitespace-nowrap">Saved!</span>
                          ) : (
                            <button onClick={() => handleFixturePredict(f.id)} disabled={!s.a.trim() || !s.b.trim()} className="bg-white text-black px-3 py-2.5 text-[10px] font-black uppercase tracking-wider hover:bg-zinc-200 transition-all cursor-pointer disabled:opacity-30 disabled:cursor-default">Save</button>
                          )}
                        </div>
                        {fixtureErrors[f.id] && (
                          <p className="text-red-400 text-[10px] font-bold mt-1">{fixtureErrors[f.id]}</p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
