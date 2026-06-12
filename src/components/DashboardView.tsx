import React, { useState, useEffect, useRef } from 'react';
import { TrendingUp, Award, Clock, History, PlaySquare, Check, Tv, Trophy, ChevronUp, MessageSquare, User, ArrowRight } from 'lucide-react';
import { UserProfile } from '../types';
import { getNextFixture, getFixtures, submitPrediction, getFixtureStats, getLeaderboard } from '../api';
import { getAvatarUrl } from '../avatar';

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
  return iso ? `https://flagcdn.com/w80/${iso}.png` : '';
}

interface DashboardViewProps {
  user: UserProfile;
  onNavigate: (view: string) => void;
}

export default function DashboardView({ user, onNavigate }: DashboardViewProps) {
  const [activeTab, setActiveTab] = useState<'HUB' | 'MATCH_CENTER'>('HUB');
  const fixturesRef = useRef<HTMLDivElement>(null);

  const [nextFixture, setNextFixture] = useState<any>(null);
  const [countdown, setCountdown] = useState<string>('');

  const [allFixtures, setAllFixtures] = useState<any[]>([]);
  const [fixtureScores, setFixtureScores] = useState<Record<string, { a: string; b: string }>>({});
  const [savedFixtures, setSavedFixtures] = useState<Record<string, boolean>>({});
  const [fixtureErrors, setFixtureErrors] = useState<Record<string, string>>({});

  const [liveFixture, setLiveFixture] = useState<any>(null);
  const [fixtureStats, setFixtureStats] = useState<any>(null);
  const [selectedFast, setSelectedFast] = useState<string | null>(null);

  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [leaderboardFull, setLeaderboardFull] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    loadNextFixture();
    loadFixtures();
    loadLeaderboard();

    const interval = setInterval(() => {
      loadNextFixture();
      loadLeaderboard();
      loadLiveData();
    }, 15000);
    return () => clearInterval(interval);
  }, [user]);

  useEffect(() => {
    if (nextFixture) {
      const tick = () => {
        const diff = new Date(nextFixture.kickoffTime).getTime() - Date.now();
        if (diff <= 0) { setCountdown('KICKOFF'); return; }
        const d = Math.floor(diff / 86400000);
        const h = Math.floor((diff % 86400000) / 3600000);
        const m = Math.floor((diff % 3600000) / 60000);
        const s = Math.floor((diff % 60000) / 1000);
        setCountdown(d > 0 ? `${d}d ${h}h ${m}m ${s}s` : `${h}h ${m}m ${s}s`);
      };
      tick();
      const id = setInterval(tick, 1000);
      return () => clearInterval(id);
    }
  }, [nextFixture]);

  async function loadNextFixture() {
    try {
      const data = await getNextFixture();
      setNextFixture(data);
    } catch { setNextFixture(null); }
  }

  async function loadFixtures() {
    try {
      const data = await getFixtures();
      const list = data.value || data || [];
      setAllFixtures(list);
      const init: Record<string, { a: string; b: string }> = {};
      list.forEach((f: any) => {
        const pred = f.predictions?.length > 0 ? f.predictions[0] : null;
        init[f.id] = { a: pred ? String(pred.scoreA) : '', b: pred ? String(pred.scoreB) : '' };
      });
      setFixtureScores(init);
    } catch { setAllFixtures([]); }
  }

  async function loadLeaderboard() {
    try {
      const data = await getLeaderboard();
      const list = Array.isArray(data) ? data : [];
      setLeaderboard(list.slice(0, 3));
      setLeaderboardFull(list);
    } catch { setLeaderboard([]); setLeaderboardFull([]); }
  }

  async function loadLiveData() {
    try {
      const data = await getFixtures();
      const list = data.value || data || [];
      const live = list.find((f: any) => f.status === 'live' || (!f.isClosed && new Date(f.kickoffTime) <= new Date()));
      setLiveFixture(live || null);
      if (live) {
        try { const stats = await getFixtureStats(live.id); setFixtureStats(stats); } catch { setFixtureStats(null); }
      }
    } catch { setLiveFixture(null); }
  }

  async function handleFixturePredict(id: string) {
    const s = fixtureScores[id];
    if (!s?.a.trim() || !s?.b.trim()) return;
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
      loadLeaderboard();
    } catch { alert('Failed to save'); }
  }

  function handleScoreInput(id: string, side: 'a' | 'b', raw: string) {
    const cleaned = raw.replace(/[^0-9]/g, '');
    setFixtureScores(prev => ({ ...prev, [id]: { ...prev[id], [side]: cleaned } }));
    setFixtureErrors(prev => ({ ...prev, [id]: '' }));
  }

  const currentLeader = leaderboardFull.find((item: any) => item.id === user.id);
  const liveRank = currentLeader?.rank ?? user.rank;
  const livePoints = currentLeader?.points ?? user.points;

  const padZero = (n: number) => n.toString().padStart(2, '0');

  const nextMatchSection = nextFixture ? (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="text-xl font-black text-white uppercase tracking-tighter">Next Match</h3>
          {nextFixture.status === 'live' && (
            <span className="bg-emerald-600 text-white px-2.5 py-1 text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></span>
              LIVE
            </span>
          )}
        </div>
        <button onClick={() => fixturesRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })} className="text-zinc-400 hover:text-white font-black uppercase tracking-widest text-[10px] border-b border-zinc-700 hover:border-white transition-all py-1">
          Full Schedule
        </button>
      </div>
      <div className="bg-zinc-950 p-6 md:p-8 border border-zinc-800">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-col items-center gap-4 w-full md:w-1/3">
            <div className="w-24 h-24 md:w-28 md:h-28 bg-zinc-900 flex items-center justify-center p-3 border border-zinc-800">
              <img loading="lazy" className="w-full h-full object-contain" src={flagUrl(nextFixture.teamACode)} alt={nextFixture.teamA?.name} />
            </div>
            <div className="text-center">
              <h4 className="text-lg md:text-xl font-black text-white uppercase tracking-tight">{nextFixture.teamA?.name || nextFixture.teamACode}</h4>
              <p className="text-zinc-500 text-xs uppercase tracking-widest font-bold mt-1">{nextFixture.groupName}</p>
            </div>
          </div>
          <div className="flex flex-col items-center justify-center gap-4 w-full md:w-1/3">
            <div className="bg-zinc-900 border border-zinc-800 text-white font-black text-xs uppercase tracking-[0.25em] px-4 py-2">VS</div>
            <div className="text-center">
              <p className="text-zinc-500 text-[10px] uppercase font-bold tracking-[0.2em] mb-2">KICKOFF IN</p>
              <p className="text-2xl md:text-3xl font-black text-white font-mono">{countdown}</p>
            </div>
          </div>
          <div className="flex flex-col items-center gap-4 w-full md:w-1/3">
            <div className="w-24 h-24 md:w-28 md:h-28 bg-zinc-900 flex items-center justify-center p-3 border border-zinc-800">
              <img loading="lazy" className="w-full h-full object-contain" src={flagUrl(nextFixture.teamBCode)} alt={nextFixture.teamB?.name} />
            </div>
            <div className="text-center">
              <h4 className="text-lg md:text-xl font-black text-white uppercase tracking-tight">{nextFixture.teamB?.name || nextFixture.teamBCode}</h4>
              <p className="text-zinc-500 text-xs uppercase tracking-widest font-bold mt-1">{nextFixture.groupName}</p>
            </div>
          </div>
        </div>
        <div className="mt-8 pt-6 border-t border-zinc-800 flex flex-col items-center">
          <button
            onClick={() => {
              setActiveTab('HUB');
              setTimeout(() => fixturesRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
            }}
            className="px-8 py-3.5 bg-white text-black font-black text-xs uppercase tracking-[0.25em] hover:bg-zinc-200 transition-all cursor-pointer"
          >
            Predict Score
          </button>
        </div>
      </div>
    </section>
  ) : null;

  const leaderboardMovers = (
    <div className="bg-zinc-950 border border-zinc-800 overflow-hidden">
      {leaderboard.length > 0 ? leaderboard.map((item: any, i: number) => (
        <div key={item.id} className={`flex items-center justify-between p-4 ${i < leaderboard.length - 1 ? 'border-b border-zinc-800' : ''} hover:bg-zinc-900/40 transition-colors`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 border border-zinc-700 overflow-hidden bg-zinc-900">
              <img loading="lazy" className="w-full h-full object-cover" src={getAvatarUrl(item.fullName || item.username, item.avatarUrl)} alt={item.username} />
            </div>
            <div>
              <p className="font-bold text-white text-xs uppercase tracking-wider">{item.fullName || item.username}</p>
              <p className="text-[10px] text-zinc-500 uppercase tracking-wide">{item.predictionsCount} predictions</p>
            </div>
          </div>
          <div className="text-emerald-400 font-extrabold flex items-center text-xs tracking-wider gap-2">
            <span>{item.points} pts</span>
            <span className="text-zinc-500">#{item.rank}</span>
          </div>
        </div>
      )) : (
        <div className="p-6 text-center text-zinc-500 text-xs uppercase tracking-wider">
          No predictions yet. Be the first!
        </div>
      )}
    </div>
  );

  return (
    <div className="w-full space-y-6">
      <div className="flex bg-zinc-950 p-2 border border-zinc-800 items-center justify-between">
        <span className="font-black text-xs uppercase tracking-[0.25em] text-zinc-500 px-4">DASHBOARD</span>
      </div>

      <div className="space-y-6">
          <header className="mb-2">
            <h2 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tighter mb-2">Welcome, {user.fullName} ⚽</h2>
            <p className="text-zinc-400 text-sm font-bold uppercase tracking-[0.2em]">COLLEGE OF ENGINEERING TRIVANDRUM</p>
          </header>

          <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-zinc-950 p-6 border border-zinc-800 relative overflow-hidden group">
              <div className="absolute -right-4 -bottom-4 text-zinc-800 opacity-30 group-hover:opacity-50 transition-opacity"><Trophy size={120} /></div>
              <div className="flex items-center gap-1.5 text-white mb-3">
                <Award className="w-4 h-4" />
                <span className="font-black text-[10px] uppercase tracking-widest text-zinc-400">Total Points</span>
              </div>
              <div className="text-5xl font-black text-white tracking-tighter">{livePoints}</div>
            </div>
            <div className="bg-zinc-950 p-6 border border-zinc-800 relative overflow-hidden group">
              <div className="absolute -right-4 -bottom-4 text-zinc-800 opacity-30 group-hover:opacity-50 transition-opacity"><Trophy size={120} /></div>
              <div className="flex items-center gap-1.5 text-emerald-500 mb-3">
                <Trophy className="w-4 h-4" />
                <span className="font-black text-[10px] uppercase tracking-widest text-zinc-400">Global Rank</span>
              </div>
              <div className="text-5xl font-black text-white tracking-tighter">#{liveRank}</div>
            </div>
            <div className="bg-zinc-950 p-6 border border-zinc-800 relative overflow-hidden group cursor-pointer hover:border-zinc-600 transition-all" onClick={() => onNavigate('PROFILE')}>
              <div className="absolute -right-4 -bottom-4 text-zinc-800 opacity-30 group-hover:opacity-50 transition-opacity"><Trophy size={120} /></div>
              <div className="flex items-center gap-1.5 text-zinc-400 mb-3">
                <History className="w-4 h-4" />
                <span className="font-black text-[10px] uppercase tracking-widest text-zinc-400">Predictions</span>
              </div>
              <div className="text-5xl font-black text-white tracking-tighter">{user.predictionsCount}</div>
              <div className="mt-4 text-zinc-500 font-bold uppercase tracking-widest text-[9px]">{user.accuracy !== null ? `${user.accuracy}% ACCURACY` : '— ACCURACY'}</div>
            </div>
          </section>

          {nextMatchSection}

          <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-black text-white uppercase tracking-tighter mb-4">Leaderboard Top 3</h3>
              {leaderboardMovers}
            </div>
            <div className="bg-zinc-900 border border-zinc-800 p-8 flex flex-col justify-center relative overflow-hidden">
              <div className="relative z-10">
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500 block mb-2">CET Football League</span>
                <h3 className="text-2xl font-black text-white uppercase tracking-tighter mb-3 leading-tight">World Cup 2026 Predictions</h3>
                <p className="text-zinc-400 text-xs uppercase tracking-wider mb-6 leading-relaxed">
                  Predict group stage matches and climb the leaderboard. Matches start June 11!
                </p>
                <button onClick={() => onNavigate('GROUP_STAGE')} className="bg-white text-black font-black text-xs uppercase tracking-[0.2em] py-3.5 px-6 hover:bg-zinc-200 transition-all cursor-pointer">
                  Start Predicting
                </button>
              </div>
              <div className="absolute -right-8 -bottom-8 text-zinc-800 select-none pointer-events-none"><Trophy size={180} /></div>
            </div>
          </section>

          {allFixtures.length > 0 && (
            <section id="all-fixtures" ref={fixturesRef} className="space-y-4">
              <h3 className="text-lg font-black text-white uppercase tracking-tighter">All Fixtures</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {allFixtures.map((f: any) => {
                  const s = fixtureScores[f.id] || { a: '', b: '' };
                  const isPast = new Date(f.kickoffTime) <= new Date() || f.isClosed;
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
                              {f.actualScoreA != null ? `${f.actualScoreA} - ${f.actualScoreB}` : f.status === 'finished' ? 'Match ended' : f.status === 'live' ? 'Match in progress' : 'Match started'}
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
            </section>
          )}
        </div>
      )
    </div>
  );
}
