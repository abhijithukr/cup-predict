import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, Award, Clock, History, PlaySquare, Check, Flame, 
  Tv, Trophy, MessageSquare, Plus, ChevronUp, AlertCircle 
} from 'lucide-react';
import { MatchPrediction, UserProfile } from '../types';
import { TODAY_SCHEDULE } from '../initialData';

interface DashboardViewProps {
  user: UserProfile;
  onNavigate: (view: string) => void;
  onUpdatePoints?: (pts: number) => void;
}

export default function DashboardView({ user, onNavigate, onUpdatePoints }: DashboardViewProps) {
  // Mode selection: 'HUB' (Welcome view) | 'MATCH_CENTER' (Brazil vs France live console)
  const [activeTab, setActiveTab] = useState<'HUB' | 'MATCH_CENTER'>('HUB');

  // Next Match Countdown Timer state
  const [timeLeft, setTimeLeft] = useState({ hours: 2, minutes: 45, seconds: 12 });

  // Score fields for standard next match prediction (West State vs East College)
  const [westStatePrediction, setWestStatePrediction] = useState('');
  const [eastCollegePrediction, setEastCollegePrediction] = useState('');
  const [isNextMatchLocked, setIsNextMatchLocked] = useState(false);

  // Today's fixtures values
  const [fixtures, setFixtures] = useState<MatchPrediction[]>(TODAY_SCHEDULE);
  const [fixtureScores, setFixtureScores] = useState<Record<string, { a: string; b: string; locked: boolean }>>({
    today_1: { a: '', b: '', locked: false },
    today_2: { a: '', b: '', locked: false }
  });

  // Fast prediction widget on live match
  const [selectedFastPredict, setSelectedFastPredict] = useState<string | null>(null);
  const [livePoints, setLivePoints] = useState(0);

  // Match Center commentary feeds
  const [commentaries, setCommentaries] = useState<string[]>([
    "Vinicius Jr. cuts inside from the left flank, forcing a spectacular save from Maignan. France struggling to keep possession under high pressure.",
    "Goal kick France. Mike Maignan launches a deep counter-pass targeting Kylian Mbappé.",
    "Yellow Card for Casemiro after pushing Antoine Griezmann in the midfield area."
  ]);

  // Countdown clock ticker
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        } else if (prev.hours > 0) {
          return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        } else {
          return { hours: 2, minutes: 45, seconds: 12 }; // Loop back for demo
        }
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Handler for Today's Schedule predictions
  const handleFixturePredict = (fixtureId: string) => {
    const spec = fixtureScores[fixtureId];
    if (!spec.a.trim() || !spec.b.trim()) {
      alert('Please enter correct scores for both teams.');
      return;
    }
    setFixtureScores(prev => ({
      ...prev,
      [fixtureId]: { ...prev[fixtureId], locked: true }
    }));
    onUpdatePoints(50); // Small participation points
    alert('Prediction locked! You earned +50 participation points!');
  };

  // Handler for Fast Predict clicks
  const handleFastPredict = (choice: string) => {
    if (selectedFastPredict) return;
    setSelectedFastPredict(choice);
    onUpdatePoints(100);
    setLivePoints(100);
    setCommentaries(prev => [
      `[Quick Predict] You predicted: ${choice} to score next! +100 PTS locked.`,
      ...prev
    ]);
  };

  const padZero = (n: number) => n.toString().padStart(2, '0');

  return (
    <div className="w-full space-y-6">
      {/* Upper Navigation Tabs / Header to swap dashboard view seamlessly */}
      <div className="flex bg-zinc-950 p-2 border border-white/10 items-center justify-between">
        <span className="font-black text-xs uppercase tracking-[0.25em] text-zinc-500 px-4 hidden sm:inline-block">DASHBOARD NAVIGATION</span>
        <div className="flex gap-2 w-full sm:w-auto">
          <button 
            onClick={() => setActiveTab('HUB')}
            className={`flex-1 sm:flex-none py-2 px-6 text-[11px] font-black uppercase tracking-widest transition-all cursor-pointer flex items-center justify-center gap-2 ${activeTab === 'HUB' ? 'bg-white text-black' : 'text-zinc-400 hover:text-white'}`}
          >
            <Tv size={14} />
            Welcome Hub
          </button>
          <button 
            onClick={() => setActiveTab('MATCH_CENTER')}
            className={`flex-1 sm:flex-none py-2 px-6 text-[11px] font-black uppercase tracking-widest transition-all cursor-pointer flex items-center justify-center gap-2 ${activeTab === 'MATCH_CENTER' ? 'bg-zinc-800 text-white border border-white/10' : 'text-zinc-500 hover:text-white'}`}
          >
            <PlaySquare size={14} />
            Match Center (Live 🔴)
          </button>
        </div>
      </div>

      {activeTab === 'HUB' ? (
        // HUB VIEW (Welcome dashboard layout)
        <div className="space-y-6">
          {/* Welcome Header */}
          <header className="mb-2">
            <h2 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tighter mb-2">Welcome, {user.fullName}&trade; ⚽</h2>
            <p className="text-zinc-400 text-sm font-bold uppercase tracking-[0.2em]">The elite collegiate prediction arena</p>
          </header>

          {/* Stats Bento Grid */}
          <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Total Points */}
            <div className="bg-zinc-950 p-6 rounded-none border border-white/10 relative overflow-hidden group">
              <div className="absolute -right-4 -bottom-4 text-white/5 opacity-5 group-hover:opacity-10 transition-opacity">
                <Trophy size={120} />
              </div>
              <div className="flex items-center gap-1.5 text-white mb-3">
                <Award className="w-4 h-4" />
                <span className="font-black text-[10px] uppercase tracking-widest text-zinc-400">Total Points</span>
              </div>
              <div className="text-5xl font-black text-white tracking-tighter">{user.points}</div>
              <div className="mt-3 text-[#10b981] font-bold flex items-center gap-1 text-xs uppercase tracking-wider">
                <TrendingUp size={14} fill="currentColor" />
                <span>+12% this week</span>
              </div>
            </div>

            {/* Rank Card */}
            <div className="bg-zinc-950 p-6 rounded-none border border-white/10 relative overflow-hidden group">
              <div className="absolute -right-4 -bottom-4 text-white/5 opacity-5 group-hover:opacity-10 transition-opacity">
                <Trophy size={120} />
              </div>
              <div className="flex items-center gap-1.5 text-[#10b981] mb-3">
                <Trophy className="w-4 h-4" />
                <span className="font-black text-[10px] uppercase tracking-widest text-zinc-400">Global Rank</span>
              </div>
              <div className="text-5xl font-black text-white tracking-tighter">#{user.rank}</div>
              <div className="mt-4 text-zinc-500 font-bold uppercase tracking-widest text-[9px]">Top 5% of students</div>
            </div>

            {/* Predictions Card */}
            <div className="bg-zinc-950 p-6 rounded-none border border-white/10 relative overflow-hidden group">
              <div className="absolute -right-4 -bottom-4 text-white/5 opacity-5 group-hover:opacity-10 transition-opacity">
                <Trophy size={120} />
              </div>
              <div className="flex items-center gap-1.5 text-zinc-400 mb-3">
                <History className="w-4 h-4" />
                <span className="font-black text-[10px] uppercase tracking-widest text-zinc-400">Predictions Made</span>
              </div>
              <div className="text-5xl font-black text-white tracking-tighter">{user.predictionsCount}</div>
              <div className="mt-4 text-zinc-500 font-bold uppercase tracking-widest text-[9px]">{user.accuracy}% ACCURACY RATE</div>
            </div>
          </section>

          {/* Next Match Section */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h3 className="text-xl font-black text-white uppercase tracking-tighter">Next Match</h3>
                <span className="bg-white text-black px-2.5 py-1 text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 shadow-sm">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                  LIVE SOON
                </span>
              </div>
              <button 
                onClick={() => onNavigate('PREDICTIONS')}
                className="text-white hover:text-zinc-200 font-black uppercase tracking-widest text-[10px] border-b border-white/20 hover:border-white transition-all py-1"
              >
                View Schedule
              </button>
            </div>

            {/* Interative Match Box */}
            <div className="relative bg-zinc-950 p-6 md:p-8 border border-white/10 pitch-pattern overflow-hidden">
              <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
                {/* Home Team */}
                <div className="flex flex-col items-center gap-4 w-full md:w-1/3">
                  <div className="w-24 h-24 md:w-28 md:h-28 rounded-none bg-zinc-900 flex items-center justify-center p-3 border border-white/10 ring-4 ring-white/5">
                    <img 
                      className="w-full h-full object-contain filter grayscale invert" 
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuDx38sDSiLwUsQnRZQOgFaElt6QvDNOA-rvSKLJ_oZvcOeEXswlxyFXJEWYeVp_o5dHVXVjGV45mopMXeRlwUuACSikcOr8--9fT8hUi7CreWXBp1yylGmSFwBTko6yb1Xbs6m65lPF78V7g6KI1Db5eqpN6tDg_agh6EB4IYGAPlL70c4U669AjXW1146bFaLCC8uO4XXtMzRmNNQNSdb3yjG6zOkAgGQkTbZU9WepwppxI9rtrETGlfRWWn1wbkN7UMi5cxowO3xs" 
                      alt="West State Tigers" 
                    />
                  </div>
                  <div className="text-center">
                    <h4 className="text-lg md:text-xl font-black text-white uppercase tracking-tight">West State</h4>
                    <p className="text-zinc-500 text-xs uppercase tracking-widest font-bold mt-1">Home • Tigers</p>
                  </div>
                </div>

                {/* VS / Countdown */}
                <div className="flex flex-col items-center justify-center gap-4 w-full md:w-1/3">
                  <div className="bg-zinc-900 border border-white/10 text-white font-black text-xs uppercase tracking-[0.25em] px-4 py-2">
                    VS
                  </div>
                  <div className="text-center">
                    <p className="text-zinc-500 text-[10px] uppercase font-bold tracking-[0.2em] mb-2">KICKOFF IN</p>
                    <div className="flex gap-2 items-center justify-center font-mono">
                      <div className="flex flex-col items-center">
                        <span className="text-3xl font-black text-white">{padZero(timeLeft.hours)}</span>
                        <span className="text-[9px] font-bold text-zinc-500 tracking-wider">HRS</span>
                      </div>
                      <span className="text-2xl font-bold text-zinc-600 mb-4">:</span>
                      <div className="flex flex-col items-center">
                        <span className="text-3xl font-black text-white">{padZero(timeLeft.minutes)}</span>
                        <span className="text-[9px] font-bold text-zinc-500 tracking-wider">MIN</span>
                      </div>
                      <span className="text-2xl font-bold text-zinc-600 mb-4">:</span>
                      <div className="flex flex-col items-center">
                        <span className="text-3xl font-black text-white">{padZero(timeLeft.seconds)}</span>
                        <span className="text-[9px] font-bold text-zinc-500 tracking-wider">SEC</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Away Team */}
                <div className="flex flex-col items-center gap-4 w-full md:w-1/3">
                  <div className="w-24 h-24 md:w-28 md:h-28 rounded-none bg-zinc-900 flex items-center justify-center p-3 border border-white/10 ring-4 ring-white/5">
                    <img 
                      className="w-full h-full object-contain filter grayscale invert" 
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuAxIHkycLvvFInWJSm-1H72W8ddlvoeP2lx0KyFSe6QpkmLSX0SeSNIqvZek-O_qmAGuaYn_t4OvOnLGfVa4YMmLjV4bngp08OQxeTZZqupyWrnDchnF5S3kUNb-RUfjtml-19fv7-9G9K4fmhvvPZwe3xmEobO09TIxY6u5m61jSTsm8_o9OyNEXpkG0Ew5lG0SAaUMcG_93-YjsBnePuXN5_pHul0p1bCwq-zh_vL599kSikjNGlJXpDfoGqYcOhO6nhXUOiBjzZ3" 
                      alt="East College Eagles" 
                    />
                  </div>
                  <div className="text-center">
                    <h4 className="text-lg md:text-xl font-black text-white uppercase tracking-tight">East College</h4>
                    <p className="text-zinc-500 text-xs uppercase tracking-widest font-bold mt-1">Away • Eagles</p>
                  </div>
                </div>
              </div>

              {/* Dynamic Interactive Input form right on the Dashboard! */}
              <div className="mt-8 pt-6 border-t border-white/10 flex flex-col items-center">
                <p className="text-xs font-bold text-zinc-400 mb-4 uppercase tracking-[0.2em]">Fast Predict Match Score</p>
                <div className="flex items-center gap-3 justify-center mb-5">
                  <input 
                    type="number"
                    min="0"
                    placeholder="Tigers"
                    disabled={isNextMatchLocked}
                    value={westStatePrediction}
                    onChange={(e) => setWestStatePrediction(e.target.value)}
                    className="w-24 text-center text-sm font-black py-2.5 bg-zinc-900 border border-white/10 rounded-none outline-none focus:border-white disabled:opacity-50 text-white"
                  />
                  <span className="text-lg font-bold text-zinc-650">-</span>
                  <input 
                    type="number"
                    min="0"
                    placeholder="Eagles"
                    disabled={isNextMatchLocked}
                    value={eastCollegePrediction}
                    onChange={(e) => setEastCollegePrediction(e.target.value)}
                    className="w-24 text-center text-sm font-black py-2.5 bg-zinc-900 border border-white/10 rounded-none outline-none focus:border-white disabled:opacity-50 text-white"
                  />
                </div>
                {isNextMatchLocked ? (
                  <div className="flex items-center gap-2 text-emerald-400 bg-emerald-950/40 px-5 py-2.5 border border-emerald-850/50 text-xs font-black tracking-wider uppercase">
                    <Check size={14} />
                    <span>PREDICTION SUBMITTED & LOCKED (+200 PTS STAKED)</span>
                  </div>
                ) : (
                  <button 
                    onClick={() => {
                      if (!westStatePrediction.trim() || !eastCollegePrediction.trim()) {
                        alert('Please fill in both scores.');
                        return;
                      }
                      setIsNextMatchLocked(true);
                      onUpdatePoints(200);
                      alert('Awesome! Successfully submitted predictions for WT vs EC! +200 PTS added to your current balance.');
                    }}
                    className="px-8 py-3.5 bg-white text-black font-black text-xs uppercase tracking-[0.25em] rounded-none hover:bg-zinc-200 transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <Check size={14} />
                    LOCK PREDICTION
                  </button>
                )}
              </div>
            </div>
          </section>

          {/* Leaderboard Movers & Banner */}
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-black text-white uppercase tracking-tighter mb-4">Leaderboard Movers</h3>
              <div className="bg-zinc-950 border border-white/10 overflow-hidden rounded-none">
                {/* Row 1 */}
                <div className="flex items-center justify-between p-4 border-b border-white/5 hover:bg-zinc-900/40 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 border border-white/20 overflow-hidden rounded-none">
                      <img 
                        className="w-full h-full object-cover filter grayscale" 
                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuDDktPmlo1qgteQK0aUG29cviPpRzOnoU9IKGX_t6qW_WnkFSpeD9oSa0w0ArV3IJRzOmSuI1NMgLa4Sj9Dc7iCeOX_jssZ9s0tTVlWmg2_RVKREh4Sv5KkMDPQjF7C4cmVOgp1KmDQICWlGqjonzV5kanpmI1K8Hd5_Em4muFhe3MnoERaAnwxSjWw6cB06kEvnaoa9DDDFkKjfrbCTkENh89J328MfC5lVe_PnF1iw6Brrw6rFEmx76L7CBrtrE4-sFgk0fc1KbzY" 
                        alt="Jordan D." 
                      />
                    </div>
                    <div>
                      <p className="font-bold text-white text-xs uppercase tracking-wider">Jordan D.</p>
                      <p className="text-[10px] text-zinc-500 uppercase tracking-wide">Predicted correctly: +150 pts</p>
                    </div>
                  </div>
                  <div className="text-emerald-400 font-extrabold flex items-center text-xs tracking-wider">
                    <ChevronUp size={14} />
                    #12
                  </div>
                </div>

                {/* Row 2 */}
                <div className="flex items-center justify-between p-4 border-b border-white/5 hover:bg-zinc-900/40 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 border border-white/20 overflow-hidden rounded-none">
                      <img 
                        className="w-full h-full object-cover filter grayscale" 
                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuBm6gCkzKW61mT1OVhcivrKx9y2Jdg326RVHpw6HZAiSL-Cutu9iyW7qU84BRjDRgqwphkRd6ggalBI9EmFGEfT4xcG20hrEfJKL5BaxL7_QfCEZ52EmM_oGr6j2os985WmzX6TNQFcgxk0luBJXigc4t5lC54Av2uMOTsfbqbYYMZ7-Xy4iN0bHpKSo-m5q8QRVJnqpR7yEkU1m9NiPR340VOqokD7gI9Il_wYlzPUBuSErHk31oYNo7grO2Z7doZhrNla6YvWP9Yz" 
                        alt="Sarah R." 
                      />
                    </div>
                    <div>
                      <p className="font-bold text-white text-xs uppercase tracking-wider">Sarah R.</p>
                      <p className="text-[10px] text-zinc-500 uppercase tracking-wide">Perfect Score Bonus: +500 pts</p>
                    </div>
                  </div>
                  <div className="text-emerald-400 font-extrabold flex items-center text-xs tracking-wider">
                    <ChevronUp size={14} />
                    #3
                  </div>
                </div>

                {/* Row 3 */}
                <div className="flex items-center justify-between p-4 hover:bg-zinc-900/40 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-zinc-900 border border-white/10 flex items-center justify-center text-zinc-400 font-black overflow-hidden text-xs">
                      MK
                    </div>
                    <div>
                      <p className="font-bold text-white text-xs uppercase tracking-wider">Mike K.</p>
                      <p className="text-[10px] text-zinc-500 uppercase tracking-wide">Placed prediction on Final</p>
                    </div>
                  </div>
                  <div className="text-zinc-500 font-bold text-xs tracking-wider">
                    — #25
                  </div>
                </div>
              </div>
            </div>

            {/* Campaign promo */}
            <div className="bg-zinc-900 border border-white/10 rounded-none p-8 flex flex-col justify-center relative overflow-hidden">
              <div className="relative z-10">
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500 block mb-2">Campaign Raffle</span>
                <h3 className="text-2xl font-black text-white uppercase tracking-tighter mb-3 leading-tight">Win a Trip to the Finals!</h3>
                <p className="text-zinc-400 text-xs uppercase tracking-wider mb-6 leading-relaxed">
                  Keep your accuracy rate above 80% this month to enter the grand prize raffle. You're currently at{' '}
                  <span className="text-white font-black text-sm">{user.accuracy}%</span>.
                </p>
                <button 
                  onClick={() => onNavigate('PROFILE')}
                  className="bg-white text-black font-black text-xs uppercase tracking-[0.2em] py-3.5 px-6 hover:bg-zinc-200 transition-all cursor-pointer"
                >
                  Check My Progress
                </button>
              </div>
              <div className="absolute -right-8 -bottom-8 text-white/5 select-none pointer-events-none">
                <Trophy size={180} />
              </div>
            </div>
          </section>
        </div>
      ) : (
        // MATCH CENTER VIEW (Brazil vs France live console layout)
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-in">
          {/* Left & Center Column: Matches */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Live Match Hero card */}
            <section className="relative bg-zinc-950 border border-white/10 overflow-hidden pitch-pattern">
              <div className="absolute top-4 left-4 z-10">
                <div className="bg-white text-black px-3 py-1 font-black text-[10px] tracking-widest flex items-center gap-2 uppercase shadow-lg">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                  LIVE NOW
                </div>
              </div>

              <div className="p-8 flex flex-col items-center justify-center relative">
                <div className="flex items-center justify-between w-full max-w-2xl gap-4 md:gap-8">
                  {/* Team A (Brazil) */}
                  <div className="flex flex-col items-center gap-3 text-center">
                    <div className="w-20 h-20 md:w-28 md:h-28 rounded-none bg-zinc-900 flex items-center justify-center border border-white/10 ring-4 ring-white/5 overflow-hidden">
                      <img 
                        className="w-full h-full object-cover filter grayscale contrast-125" 
                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuD3ZSiEx8pCnVdKI7PM6kqQSlpK3sarJdok4UeoXGz9y1GWdMgWKzm6fo2zwKvZ8OSDu1NKRl3YyI3cWcNIUaOYPPfJrm0iQ3ZymIwg0QbWnfOB8jzUzAxYeBnLc7Hylo88WVLqCCDwSpLtXwT1sRtbZw6ruo113l2IUZcMoJOh3Jx08ud-eyJwppXje81hGNsNBpNGjrq4Pr7JA_4eeCAHs3Ps1Vcg44nqY-o5xf6j_NOdpajKLaWtF-isNZidg2QOBBr_zukahZ-0" 
                        alt="Brazil crest" 
                      />
                    </div>
                    <h2 className="font-black text-xs uppercase tracking-widest text-white">Brazil</h2>
                  </div>

                  {/* Score & Time */}
                  <div className="flex flex-col items-center gap-1.5">
                    <div className="text-5xl md:text-6xl font-black tracking-tighter flex items-center gap-3 text-white">
                      <span>2</span>
                      <span className="text-zinc-650 font-light">:</span>
                      <span>1</span>
                    </div>
                    <span className="text-zinc-400 font-black bg-zinc-900 border border-white/10 px-3.5 py-1 text-[10px] uppercase tracking-widest">74' Minute</span>
                  </div>

                  {/* Team B (France) */}
                  <div className="flex flex-col items-center gap-3 text-center">
                    <div className="w-20 h-20 md:w-28 md:h-28 rounded-none bg-zinc-900 flex items-center justify-center border border-white/10 ring-4 ring-white/5 overflow-hidden">
                      <img 
                        className="w-full h-full object-cover filter grayscale contrast-125" 
                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuBpNZI8iYkMgO4A4RorJNgvazHmQZPIttCaOxfdNJxcNSUl5bAac8wvCJGLlv9AIBI4a4fOThM-RdkQrbWvgol5sUKf8rPmtwUTZvnST1W4mBQJN_KSJNnCBMDPjAw_th8SKXHv96wnbbrOX3Bpgy3I5S4sN2unZvv58o_fVAJ_lqU1JMZg4EqhCL9pKh_vEi4PqqAPlT5Ft3jungPw7y1MrJCpbgNLhAj4bfnsbrV9-6LzYOwq185eLfgAp028Rf-NLWRyNsdlhR-Z" 
                        alt="France crest" 
                      />
                    </div>
                    <h2 className="font-black text-sm uppercase tracking-widest text-white">France</h2>
                  </div>
                </div>

                {/* Commentary Scrolling Snippet */}
                <div className="mt-8 w-full max-w-lg bg-zinc-900 border border-white/10 border-l-2 border-l-white rounded-none p-4 flex items-start gap-2.5 shadow-sm">
                  <span className="text-white mt-1"><MessageSquare size={14} /></span>
                  <div>
                    <h5 className="text-[10px] font-black text-white uppercase tracking-widest mb-1">LIVE COMMENTARY</h5>
                    <p className="text-xs font-semibold italic text-zinc-300 leading-relaxed">
                      "{commentaries[0]}"
                    </p>
                  </div>
                </div>
              </div>

              {/* Quick Prediction Widget */}
              <div className="bg-zinc-950 p-6 border-t border-white/10 z-10 relative">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                  <div>
                    <h3 className="font-black text-[10px] text-zinc-500 uppercase tracking-widest">FAST PREDICT GOAL</h3>
                    <p className="text-xs font-bold uppercase tracking-wider text-white mt-1">Who scores the next goal in this live match?</p>
                  </div>
                  {selectedFastPredict ? (
                    <div className="flex items-center gap-2 bg-emerald-950/40 border border-emerald-800 text-emerald-400 py-1.5 px-4 text-xs font-black uppercase tracking-wider">
                      <Check size={14} />
                      <span>Staked on {selectedFastPredict}! (+{livePoints} pts awarded)</span>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleFastPredict('Brazil')}
                        className="px-5 py-2.5 bg-zinc-900 border border-white/10 text-white font-black text-[10px] uppercase tracking-widest hover:bg-white hover:text-black transition-all cursor-pointer"
                      >
                        Brazil
                      </button>
                      <button 
                        onClick={() => handleFastPredict('France')}
                        className="px-5 py-2.5 bg-zinc-900 border border-white/10 text-white font-black text-[10px] uppercase tracking-widest hover:bg-white hover:text-black transition-all cursor-pointer"
                      >
                        France
                      </button>
                      <button 
                        onClick={() => handleFastPredict('No Goal')}
                        className="px-5 py-2.5 bg-zinc-900 border border-white/10 text-zinc-500 font-extrabold text-[10px] uppercase tracking-widest hover:bg-white hover:text-black transition-all cursor-pointer"
                      >
                        No Goal
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </section>

            {/* Today's Schedule inside match center */}
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-black text-white uppercase tracking-tighter flex items-center gap-2">
                  <span className="text-white"><Clock size={18} /></span>
                  Today's Fixtures Predictions
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {fixtures.map(f => {
                  const s = fixtureScores[f.id] || { a: '', b: '', locked: false };
                  return (
                    <div key={f.id} className="bg-zinc-950 p-5 border border-white/10 hover:border-white/30 transition-all rounded-none">
                      <div className="flex items-center justify-between mb-3 border-b border-white/5 pb-2">
                        <span className="bg-zinc-900 text-zinc-300 border border-white/10 text-[9px] uppercase tracking-widest font-black px-2.5 py-0.5 rounded-none">{f.group}</span>
                        <span className="text-zinc-500 font-bold text-[10px] flex items-center gap-1 uppercase tracking-widest">
                          <Clock size={12} />
                          {f.kickoffTime}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-2 mb-4">
                        <div className="flex flex-col items-center gap-1.5 flex-1 text-center">
                          <div className="w-10 h-10 rounded-none bg-zinc-900 border border-white/10 flex items-center justify-center shadow-inner">
                            <span className="font-black text-emerald-400">{f.teamA === 'Germany' ? '🇩🇪' : (f.teamA === 'Argentina' ? '🇦🇷' : '⚽')}</span>
                          </div>
                          <span className="font-extrabold text-xs text-white uppercase tracking-wide">{f.teamA}</span>
                        </div>
                        <div className="text-zinc-600 font-black text-xs uppercase tracking-widest">VS</div>
                        <div className="flex flex-col items-center gap-1.5 flex-1 text-center">
                          <div className="w-10 h-10 rounded-none bg-zinc-900 border border-white/10 flex items-center justify-center shadow-inner">
                            <span className="font-black text-amber-400">{f.teamB === 'Spain' ? '🇪🇸' : (f.teamB === 'Italy' ? '🇮🇹' : '⚽')}</span>
                          </div>
                          <span className="font-extrabold text-xs text-white uppercase tracking-wide">{f.teamB}</span>
                        </div>
                      </div>

                      {/* Score predict inputs */}
                      <div className="flex items-center gap-2">
                        <input 
                          type="number" 
                          min="0"
                          disabled={s.locked}
                          placeholder="0"
                          value={s.a}
                          onChange={(e) => setFixtureScores(prev => ({
                            ...prev,
                            [f.id]: { ...prev[f.id], a: e.target.value }
                          }))}
                          className="w-full text-center bg-zinc-900 border border-white/10 py-2.5 focus:border-white outline-none font-black text-white rounded-none text-sm"
                        />
                        <span className="text-zinc-650 font-black">-</span>
                        <input 
                          type="number" 
                          min="0"
                          disabled={s.locked}
                          placeholder="0"
                          value={s.b}
                          onChange={(e) => setFixtureScores(prev => ({
                            ...prev,
                            [f.id]: { ...prev[f.id], b: e.target.value }
                          }))}
                          className="w-full text-center bg-zinc-900 border border-white/10 py-2.5 focus:border-white outline-none font-black text-white rounded-none text-sm"
                        />
                        {s.locked ? (
                          <span className="bg-zinc-900 text-emerald-400 p-2.5 border border-white/10 rounded-none"><Check size={14} /></span>
                        ) : (
                          <button 
                            onClick={() => handleFixturePredict(f.id)}
                            className="bg-white text-black p-2.5 rounded-none hover:bg-zinc-200 transition-all cursor-pointer"
                          >
                            <Check size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          </div>

          {/* Right Column: Match Insights */}
          <aside className="lg:col-span-4 space-y-6">
            
            {/* Win bar percentages */}
            <div className="bg-zinc-950 border border-white/10 p-6 rounded-none">
              <h3 className="font-black text-xs text-white uppercase tracking-widest mb-5">Match Insights</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-[10px] uppercase font-black tracking-wider text-zinc-400 mb-1.5">
                    <span>Brazil win</span>
                    <span className="font-black text-white">65%</span>
                  </div>
                  <div className="w-full h-1.5 bg-zinc-900 overflow-hidden">
                    <div className="bg-white h-full w-[65%]"></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-[10px] uppercase font-black tracking-wider text-zinc-400 mb-1.5">
                    <span>Draw</span>
                    <span className="font-black text-zinc-300">20%</span>
                  </div>
                  <div className="w-full h-1.5 bg-zinc-900 overflow-hidden">
                    <div className="bg-zinc-700 h-full w-[20%]"></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-[10px] uppercase font-black tracking-wider text-zinc-400 mb-1.5">
                    <span>France win</span>
                    <span className="font-black text-white">15%</span>
                  </div>
                  <div className="w-full h-1.5 bg-zinc-900 overflow-hidden">
                    <div className="bg-zinc-500 h-full w-[15%]"></div>
                   </div>
                </div>
              </div>
            </div>

            {/* Head to Head values */}
            <div className="bg-zinc-950 border border-white/10 p-6 rounded-none">
              <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-2">
                <h4 className="font-black text-[10px] uppercase text-zinc-500 tracking-widest">Head to Head</h4>
                <span className="text-[9px] font-black tracking-widest uppercase text-white bg-zinc-900 border border-white/10 px-2 py-0.5 rounded-none">Last 5 Matches</span>
              </div>
              <div className="space-y-3 font-mono text-xs">
                <div className="flex items-center justify-between py-2 border-b border-white/5">
                  <span className="text-zinc-500 text-[10px] uppercase font-bold">2023 - Friendly</span>
                  <span className="font-black text-white">BRA 1 - 0 FRA</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-white/5">
                  <span className="text-zinc-500 text-[10px] uppercase font-bold">2018 - World Cup</span>
                  <span className="font-black text-white">BRA 0 - 2 FRA</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-zinc-500 text-[10px] uppercase font-bold">2014 - Friendly</span>
                  <span className="font-black text-white">BRA 3 - 0 FRA</span>
                </div>
              </div>
            </div>

            {/* Current team form */}
            <div className="bg-zinc-950 border border-white/10 p-6 rounded-none">
              <h4 className="font-black text-[10px] uppercase text-zinc-500 tracking-widest mb-4 border-b border-white/5 pb-2">Current Form</h4>
              <div className="space-y-4 text-xs font-sans">
                {/* Brazil form */}
                <div className="flex items-center justify-between">
                  <span className="font-bold text-zinc-300 uppercase tracking-wide text-[10px]">Brazil</span>
                  <div className="flex gap-1">
                    <span className="w-5 h-5 bg-white text-black text-[9px] flex items-center justify-center font-black">W</span>
                    <span className="w-5 h-5 bg-white text-black text-[9px] flex items-center justify-center font-black">W</span>
                    <span className="w-5 h-5 bg-zinc-800 text-zinc-400 text-[9px] flex items-center justify-center font-black">D</span>
                    <span className="w-5 h-5 bg-white text-black text-[9px] flex items-center justify-center font-black">W</span>
                    <span className="w-5 h-5 bg-white text-black text-[9px] flex items-center justify-center font-black">W</span>
                  </div>
                </div>

                {/* France form */}
                <div className="flex items-center justify-between">
                  <span className="font-bold text-zinc-300 uppercase tracking-wide text-[10px]">France</span>
                  <div className="flex gap-1">
                    <span className="w-5 h-5 bg-zinc-900 border border-white/15 text-zinc-500 text-[9px] flex items-center justify-center font-black">L</span>
                    <span className="w-5 h-5 bg-white text-black text-[9px] flex items-center justify-center font-black">W</span>
                    <span className="w-5 h-5 bg-white text-black text-[9px] flex items-center justify-center font-black">W</span>
                    <span className="w-5 h-5 bg-zinc-800 text-zinc-400 text-[9px] flex items-center justify-center font-black">D</span>
                    <span className="w-5 h-5 bg-zinc-900 border border-white/15 text-zinc-500 text-[9px] flex items-center justify-center font-black">L</span>
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
