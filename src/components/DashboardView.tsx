import React, { useState, useEffect } from 'react';
import { TrendingUp, Award, Clock, History, PlaySquare, Check, Tv, Trophy, ChevronUp, MessageSquare, User } from 'lucide-react';
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

  const [nextFixture, setNextFixture] = useState<any>(null);
  const [countdown, setCountdown] = useState<string>('');
  const [nextA, setNextA] = useState('');
  const [nextB, setNextB] = useState('');
  const [nextLocked, setNextLocked] = useState(false);
  const [nextSubmitted, setNextSubmitted] = useState(false);

  const [allFixtures, setAllFixtures] = useState<any[]>([]);
  const [fixtureScores, setFixtureScores] = useState<Record<string, { a: string; b: string; locked: boolean }>>({});

  const [liveFixture, setLiveFixture] = useState<any>(null);
  const [fixtureStats, setFixtureStats] = useState<any>(null);
  const [selectedFast, setSelectedFast] = useState<string | null>(null);

  const [leaderboard, setLeaderboard] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    loadNextFixture();
    loadFixtures();
    loadLeaderboard();

    const interval = setInterval(() => {
      loadNextFixture();
      if (activeTab === 'MATCH_CENTER') loadLiveData();
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
      if (data.predictions?.length > 0) {
        setNextA(String(data.predictions[0].scoreA));
        setNextB(String(data.predictions[0].scoreB));
        setNextLocked(true);
      }
    } catch { setNextFixture(null); }
  }

  async function loadFixtures() {
    try {
      const data = await getFixtures();
      const list = data.value || data || [];
      setAllFixtures(list);
      const init: Record<string, { a: string; b: string; locked: boolean }> = {};
      list.forEach((f: any) => { init[f.id] = { a: '', b: '', locked: false }; });
      setFixtureScores(init);
    } catch { setAllFixtures([]); }
  }

  async function loadLeaderboard() {
    try {
      const data = await getLeaderboard();
      setLeaderboard(Array.isArray(data) ? data.slice(0, 3) : []);
    } catch { setLeaderboard([]); }
  }

  async function loadLiveData() {
    try {
      const data = await getFixtures();
      const list = data.value || data || [];
      const live = list.find((f: any) => f.status === 'live' || (f.isClosed === false && new Date(f.kickoffTime) <= new Date() && f.isClosed === false));
      setLiveFixture(live || null);
      if (live) {
        try { const stats = await getFixtureStats(live.id); setFixtureStats(stats); } catch { setFixtureStats(null); }
      }
    } catch { setLiveFixture(null); }
  }

  async function handleNextSubmit() {
    if (!nextA.trim() || !nextB.trim()) return;
    try {
      await submitPrediction(nextFixture.id, parseInt(nextA), parseInt(nextB));
      setNextLocked(true);
      setNextSubmitted(true);
      loadLeaderboard();
    } catch { alert('Failed to submit'); }
  }

  async function handleFixturePredict(id: string) {
    const s = fixtureScores[id];
    if (!s?.a.trim() || !s?.b.trim()) return;
    try {
      await submitPrediction(id, parseInt(s.a), parseInt(s.b));
      setFixtureScores(prev => ({ ...prev, [id]: { ...prev[id], locked: true } }));
      setNextSubmitted(true);
      loadLeaderboard();
    } catch { alert('Failed'); }
  }

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
        <button onClick={() => onNavigate('PREDICTIONS')} className="text-zinc-400 hover:text-white font-black uppercase tracking-widest text-[10px] border-b border-zinc-700 hover:border-white transition-all py-1">
          Full Schedule
        </button>
      </div>
      <div className="bg-zinc-950 p-6 md:p-8 border border-zinc-800">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-col items-center gap-4 w-full md:w-1/3">
            <div className="w-24 h-24 md:w-28 md:h-28 bg-zinc-900 flex items-center justify-center p-3 border border-zinc-800">
              <img className="w-full h-full object-contain" src={flagUrl(nextFixture.teamACode)} alt={nextFixture.teamA?.name} />
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
              <img className="w-full h-full object-contain" src={flagUrl(nextFixture.teamBCode)} alt={nextFixture.teamB?.name} />
            </div>
            <div className="text-center">
              <h4 className="text-lg md:text-xl font-black text-white uppercase tracking-tight">{nextFixture.teamB?.name || nextFixture.teamBCode}</h4>
              <p className="text-zinc-500 text-xs uppercase tracking-widest font-bold mt-1">{nextFixture.groupName}</p>
            </div>
          </div>
        </div>
        <div className="mt-8 pt-6 border-t border-zinc-800 flex flex-col items-center">
          <p className="text-xs font-bold text-zinc-400 mb-4 uppercase tracking-[0.2em]">Predict Score</p>
          <div className="flex items-center gap-3 justify-center mb-5">
            <input type="number" min="0" placeholder="Home" disabled={nextLocked || nextFixture.isClosed}
              value={nextA} onChange={(e) => setNextA(e.target.value)}
              className="w-24 text-center text-sm font-black py-2.5 bg-zinc-900 border border-zinc-800 outline-none focus:border-white disabled:opacity-50 text-white" />
            <span className="text-lg font-bold text-zinc-600">-</span>
            <input type="number" min="0" placeholder="Away" disabled={nextLocked || nextFixture.isClosed}
              value={nextB} onChange={(e) => setNextB(e.target.value)}
              className="w-24 text-center text-sm font-black py-2.5 bg-zinc-900 border border-zinc-800 outline-none focus:border-white disabled:opacity-50 text-white" />
          </div>
          {nextLocked || nextFixture.isClosed ? (
            <div className="flex items-center gap-2 text-emerald-400 bg-emerald-950/40 px-5 py-2.5 border border-emerald-800/50 text-xs font-black tracking-wider uppercase">
              <Check size={14} />
              <span>Prediction Submitted</span>
            </div>
          ) : (
            <button onClick={handleNextSubmit} className="px-8 py-3.5 bg-white text-black font-black text-xs uppercase tracking-[0.25em] hover:bg-zinc-200 transition-all flex items-center gap-2 cursor-pointer">
              <Check size={14} />
              LOCK PREDICTION
            </button>
          )}
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
              <img className="w-full h-full object-cover" src={getAvatarUrl(item.fullName || item.username, item.avatarUrl)} alt={item.username} />
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
        <span className="font-black text-xs uppercase tracking-[0.25em] text-zinc-500 px-4 hidden sm:inline-block">DASHBOARD</span>
        <div className="flex gap-2 w-full sm:w-auto">
          <button
            onClick={() => setActiveTab('HUB')}
            className={`flex-1 sm:flex-none py-2 px-6 text-[11px] font-black uppercase tracking-widest transition-all cursor-pointer flex items-center justify-center gap-2 ${activeTab === 'HUB' ? 'bg-white text-black' : 'text-zinc-400 hover:text-white'}`}
          ><Tv size={14} /> Welcome Hub</button>
          <button
            onClick={() => { setActiveTab('MATCH_CENTER'); loadLiveData(); }}
            className={`flex-1 sm:flex-none py-2 px-6 text-[11px] font-black uppercase tracking-widest transition-all cursor-pointer flex items-center justify-center gap-2 ${activeTab === 'MATCH_CENTER' ? 'bg-zinc-800 text-white border border-zinc-700' : 'text-zinc-500 hover:text-white'}`}
          ><PlaySquare size={14} /> Match Center</button>
        </div>
      </div>

      {activeTab === 'HUB' ? (
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
              <div className="text-5xl font-black text-white tracking-tighter">{user.points}</div>
            </div>
            <div className="bg-zinc-950 p-6 border border-zinc-800 relative overflow-hidden group">
              <div className="absolute -right-4 -bottom-4 text-zinc-800 opacity-30 group-hover:opacity-50 transition-opacity"><Trophy size={120} /></div>
              <div className="flex items-center gap-1.5 text-emerald-500 mb-3">
                <Trophy className="w-4 h-4" />
                <span className="font-black text-[10px] uppercase tracking-widest text-zinc-400">Global Rank</span>
              </div>
              <div className="text-5xl font-black text-white tracking-tighter">#{user.rank}</div>
            </div>
            <div className="bg-zinc-950 p-6 border border-zinc-800 relative overflow-hidden group">
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
                <button onClick={() => onNavigate('PREDICTIONS')} className="bg-white text-black font-black text-xs uppercase tracking-[0.2em] py-3.5 px-6 hover:bg-zinc-200 transition-all cursor-pointer">
                  Start Predicting
                </button>
              </div>
              <div className="absolute -right-8 -bottom-8 text-zinc-800 select-none pointer-events-none"><Trophy size={180} /></div>
            </div>
          </section>

          {allFixtures.length > 0 && (
            <section className="space-y-4">
              <h3 className="text-lg font-black text-white uppercase tracking-tighter">All Fixtures</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {allFixtures.map((f: any) => {
                  const s = fixtureScores[f.id] || { a: '', b: '', locked: false };
                  const isPast = new Date(f.kickoffTime) <= new Date() || f.isClosed;
                  return (
                    <div key={f.id} className="bg-zinc-950 p-5 border border-zinc-800 hover:border-zinc-600 transition-all">
                      <div className="flex items-center justify-between mb-3 border-b border-zinc-800 pb-2">
                        <span className="bg-zinc-900 text-zinc-300 border border-zinc-800 text-[9px] uppercase tracking-widest font-black px-2.5 py-0.5">{f.groupName}</span>
                        <div className="flex gap-1">
                          {f.status === 'live' && <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">LIVE</span>}
                          {f.isClosed && <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">CLOSED</span>}
                        </div>
                      </div>
                      <div className="flex items-center justify-between gap-2 mb-4">
                        <div className="flex flex-col items-center gap-1.5 flex-1 text-center">
                          <div className="w-10 h-10 bg-zinc-900 border border-zinc-800 flex items-center justify-center p-1">
                            <img className="w-full h-full object-contain" src={flagUrl(f.teamACode)} alt="" />
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
                        <div className="text-center text-zinc-500 text-xs font-bold">
                          {f.actualScoreA != null ? `${f.actualScoreA} - ${f.actualScoreB}` : 'Match started'}
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <input type="number" min="0" disabled={s.locked} placeholder="0"
                            value={s.a}
                            onChange={(e) => setFixtureScores(prev => ({ ...prev, [f.id]: { ...prev[f.id], a: e.target.value } }))}
                            className="w-full text-center bg-zinc-900 border border-zinc-800 py-2.5 focus:border-white outline-none font-black text-white text-sm" />
                          <span className="text-zinc-600 font-black">-</span>
                          <input type="number" min="0" disabled={s.locked} placeholder="0"
                            value={s.b}
                            onChange={(e) => setFixtureScores(prev => ({ ...prev, [f.id]: { ...prev[f.id], b: e.target.value } }))}
                            className="w-full text-center bg-zinc-900 border border-zinc-800 py-2.5 focus:border-white outline-none font-black text-white text-sm" />
                          {s.locked ? (
                            <span className="bg-zinc-900 text-emerald-400 p-2.5 border border-zinc-800"><Check size={14} /></span>
                          ) : (
                            <button onClick={() => handleFixturePredict(f.id)} className="bg-white text-black p-2.5 hover:bg-zinc-200 transition-all cursor-pointer"><Check size={14} /></button>
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
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 space-y-6">
            {liveFixture ? (
              <>
                <section className="relative bg-zinc-950 border border-zinc-800 overflow-hidden">
                  <div className="absolute top-4 left-4 z-10">
                    <div className="bg-emerald-600 text-white px-3 py-1 font-black text-[10px] tracking-widest flex items-center gap-2 uppercase">
                      <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                      LIVE
                    </div>
                  </div>
                  <div className="p-8 flex flex-col items-center justify-center relative">
                    <div className="flex items-center justify-between w-full max-w-2xl gap-4 md:gap-8">
                      <div className="flex flex-col items-center gap-3 text-center">
                        <div className="w-20 h-20 md:w-28 md:h-28 bg-zinc-900 flex items-center justify-center border border-zinc-800 p-2">
                          <img className="w-full h-full object-contain" src={flagUrl(liveFixture.teamACode)} alt="" />
                        </div>
                        <h2 className="font-black text-xs uppercase tracking-widest text-white">{liveFixture.teamA?.name || liveFixture.teamACode}</h2>
                      </div>
                      <div className="flex flex-col items-center gap-1.5">
                        <div className="text-5xl md:text-6xl font-black tracking-tighter flex items-center gap-3 text-white">
                          <span>{liveFixture.liveScoreA ?? liveFixture.actualScoreA ?? '—'}</span>
                          <span className="text-zinc-600 font-light">:</span>
                          <span>{liveFixture.liveScoreB ?? liveFixture.actualScoreB ?? '—'}</span>
                        </div>
                        <span className="text-zinc-400 font-black bg-zinc-900 border border-zinc-800 px-3.5 py-1 text-[10px] uppercase tracking-widest">{liveFixture.groupName}</span>
                      </div>
                      <div className="flex flex-col items-center gap-3 text-center">
                        <div className="w-20 h-20 md:w-28 md:h-28 bg-zinc-900 flex items-center justify-center border border-zinc-800 p-2">
                          <img className="w-full h-full object-contain" src={flagUrl(liveFixture.teamBCode)} alt="" />
                        </div>
                        <h2 className="font-black text-xs uppercase tracking-widest text-white">{liveFixture.teamB?.name || liveFixture.teamBCode}</h2>
                      </div>
                    </div>
                  </div>
                  <div className="bg-zinc-950 p-6 border-t border-zinc-800">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                      <div>
                        <h3 className="font-black text-[10px] text-zinc-500 uppercase tracking-widest">FAST PREDICT</h3>
                        <p className="text-xs font-bold uppercase tracking-wider text-white mt-1">Who wins?</p>
                      </div>
                      {selectedFast ? (
                        <div className="flex items-center gap-2 bg-emerald-950/40 border border-emerald-800 text-emerald-400 py-1.5 px-4 text-xs font-black uppercase tracking-wider">
                          <Check size={14} />
                          <span>Staked on {selectedFast}!</span>
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <button onClick={() => setSelectedFast(liveFixture.teamA?.name || liveFixture.teamACode)} className="px-5 py-2.5 bg-zinc-900 border border-zinc-800 text-white font-black text-[10px] uppercase tracking-widest hover:bg-white hover:text-black transition-all cursor-pointer">
                            {liveFixture.teamA?.name || liveFixture.teamACode}
                          </button>
                          <button onClick={() => setSelectedFast('Draw')} className="px-5 py-2.5 bg-zinc-900 border border-zinc-800 text-zinc-500 font-extrabold text-[10px] uppercase tracking-widest hover:bg-white hover:text-black transition-all cursor-pointer">
                            Draw
                          </button>
                          <button onClick={() => setSelectedFast(liveFixture.teamB?.name || liveFixture.teamBCode)} className="px-5 py-2.5 bg-zinc-900 border border-zinc-800 text-white font-black text-[10px] uppercase tracking-widest hover:bg-white hover:text-black transition-all cursor-pointer">
                            {liveFixture.teamB?.name || liveFixture.teamBCode}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </section>
                <section className="space-y-4">
                  <h2 className="text-lg font-black text-white uppercase tracking-tighter flex items-center gap-2">
                    <Clock size={18} /> Today's Fixtures
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {allFixtures.filter((f: any) => {
                      const d = new Date(f.kickoffTime);
                      const today = new Date();
                      return d.toDateString() === today.toDateString();
                    }).map((f: any) => {
                      const s = fixtureScores[f.id] || { a: '', b: '', locked: false };
                      return (
                        <div key={f.id} className="bg-zinc-950 p-5 border border-zinc-800 hover:border-zinc-600 transition-all">
                          <div className="flex items-center justify-between mb-3 border-b border-zinc-800 pb-2">
                            <span className="bg-zinc-900 text-zinc-300 border border-zinc-800 text-[9px] uppercase tracking-widest font-black px-2.5 py-0.5">{f.groupName}</span>
                          </div>
                          <div className="flex items-center justify-between gap-2 mb-4">
                            <div className="flex flex-col items-center gap-1.5 flex-1 text-center">
                              <div className="w-10 h-10 bg-zinc-900 border border-zinc-800 flex items-center justify-center p-1">
                                <img className="w-full h-full object-contain" src={flagUrl(f.teamACode)} alt="" />
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
                          <div className="flex items-center gap-2">
                            <input type="number" min="0" disabled={s.locked || f.isClosed} placeholder="0"
                              value={s.a}
                              onChange={(e) => setFixtureScores(prev => ({ ...prev, [f.id]: { ...prev[f.id], a: e.target.value } }))}
                              className="w-full text-center bg-zinc-900 border border-zinc-800 py-2.5 focus:border-white outline-none font-black text-white text-sm" />
                            <span className="text-zinc-600 font-black">-</span>
                            <input type="number" min="0" disabled={s.locked || f.isClosed} placeholder="0"
                              value={s.b}
                              onChange={(e) => setFixtureScores(prev => ({ ...prev, [f.id]: { ...prev[f.id], b: e.target.value } }))}
                              className="w-full text-center bg-zinc-900 border border-zinc-800 py-2.5 focus:border-white outline-none font-black text-white text-sm" />
                            {s.locked ? <span className="bg-zinc-900 text-emerald-400 p-2.5 border border-zinc-800"><Check size={14} /></span>
                              : <button onClick={() => handleFixturePredict(f.id)} className="bg-white text-black p-2.5 hover:bg-zinc-200 transition-all cursor-pointer"><Check size={14} /></button>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>
              </>
            ) : (
              <div className="bg-zinc-950 border border-zinc-800 p-12 text-center">
                <p className="text-zinc-500 font-black text-sm uppercase tracking-widest">No live matches right now</p>
                <p className="text-zinc-600 text-xs mt-2">Check back when matches start on June 11</p>
              </div>
            )}
          </div>

          <aside className="lg:col-span-4 space-y-6">
            <div className="bg-zinc-950 border border-zinc-800 p-6">
              <h3 className="font-black text-xs text-white uppercase tracking-widest mb-5">Match Insights</h3>
              {fixtureStats && liveFixture ? (
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-[10px] uppercase font-black tracking-wider text-zinc-400 mb-1.5">
                      <span>{liveFixture.teamA?.name || 'Team A'} win</span>
                      <span className="font-black text-white">{fixtureStats.teamAWinPct ?? '—'}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-zinc-900 overflow-hidden">
                      <div className="bg-white h-full" style={{ width: `${fixtureStats.teamAWinPct ?? 0}%` }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-[10px] uppercase font-black tracking-wider text-zinc-400 mb-1.5">
                      <span>Draw</span>
                      <span className="font-black text-zinc-300">{fixtureStats.drawPct ?? '—'}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-zinc-900 overflow-hidden">
                      <div className="bg-zinc-700 h-full" style={{ width: `${fixtureStats.drawPct ?? 0}%` }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-[10px] uppercase font-black tracking-wider text-zinc-400 mb-1.5">
                      <span>{liveFixture.teamB?.name || 'Team B'} win</span>
                      <span className="font-black text-white">{fixtureStats.teamBWinPct ?? '—'}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-zinc-900 overflow-hidden">
                      <div className="bg-zinc-500 h-full" style={{ width: `${fixtureStats.teamBWinPct ?? 0}%` }}></div>
                    </div>
                  </div>
                  <p className="text-[10px] text-zinc-500 uppercase tracking-wider pt-2 border-t border-zinc-800">{fixtureStats.total} predictions</p>
                </div>
              ) : (
                <p className="text-zinc-500 text-xs">No data yet</p>
              )}
            </div>

            <div className="bg-zinc-950 border border-zinc-800 p-6">
              <h4 className="font-black text-[10px] uppercase text-zinc-500 tracking-widest mb-4 border-b border-zinc-800 pb-2">Your Prediction</h4>
              {liveFixture?.predictions?.length > 0 ? (
                <div className="font-black text-white text-lg">
                  {liveFixture.predictions[0].scoreA} - {liveFixture.predictions[0].scoreB}
                  <span className="block text-[10px] text-zinc-500 font-bold uppercase tracking-wider mt-1">
                    {liveFixture.predictions[0].status === 'CORRECT' ? 'Correct!' : liveFixture.predictions[0].status === 'INCORRECT' ? 'Incorrect' : 'Pending'}
                  </span>
                </div>
              ) : (
                <p className="text-zinc-500 text-xs">No prediction yet</p>
              )}
            </div>

            <div className="bg-zinc-950 border border-zinc-800 p-6">
              <h4 className="font-black text-[10px] uppercase text-zinc-500 tracking-widest mb-4 border-b border-zinc-800 pb-2">Match Info</h4>
              {liveFixture ? (
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between"><span className="text-zinc-500">Group</span><span className="text-white font-bold">{liveFixture.groupName}</span></div>
                  <div className="flex justify-between"><span className="text-zinc-500">Kickoff</span><span className="text-white font-bold">{new Date(liveFixture.kickoffTime).toLocaleString()}</span></div>
                  <div className="flex justify-between"><span className="text-zinc-500">Status</span><span className="text-emerald-400 font-bold uppercase">{liveFixture.status || 'scheduled'}</span></div>
                </div>
              ) : <p className="text-zinc-500 text-xs">No live match</p>}
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
