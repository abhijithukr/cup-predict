import React, { useState, useEffect } from 'react';
import { UserProfile, MatchPrediction } from '../types';
import { FLAG_MAP } from '../initialData';
import { getPredictionHistory } from '../api';
import { Award, Star, History, Calendar, TrendingUp, Trophy } from 'lucide-react';
import { getAvatarUrl } from '../avatar';

interface ProfileViewProps {
  user: UserProfile;
}

function mapPrediction(p: any): MatchPrediction {
  return {
    id: p.id,
    group: p.fixture?.groupName || '',
    teamA: p.fixture?.teamA?.name || p.fixture?.teamACode || '',
    teamB: p.fixture?.teamB?.name || p.fixture?.teamBCode || '',
    teamAFlag: p.fixture?.teamACode || '',
    teamBFlag: p.fixture?.teamBCode || '',
    scoreA: p.scoreA?.toString() || '',
    scoreB: p.scoreB?.toString() || '',
    kickoffTime: p.fixture?.kickoffTime ? new Date(p.fixture.kickoffTime).toLocaleString() : '',
    dateLabel: p.fixture?.kickoffTime ? new Date(p.fixture.kickoffTime).toLocaleDateString() : '',
    isClosed: p.fixture?.isClosed || false,
    actualScoreA: p.fixture?.actualScoreA,
    actualScoreB: p.fixture?.actualScoreB,
    userScoreA: p.scoreA,
    userScoreB: p.scoreB,
    status: p.status === 'CORRECT' ? 'CORRECT' : p.status === 'INCORRECT' ? 'INCORRECT' : 'OPEN',
    pointsEarned: p.pointsEarned || 0,
  };
}

export default function ProfileView({ user }: ProfileViewProps) {
  const [pastPredictions, setPastPredictions] = useState<MatchPrediction[]>([]);
  const [loading, setLoading] = useState(true);
  const [hoveredPoint, setHoveredPoint] = useState<{ x: number; y: number; label: string; rank: number } | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await getPredictionHistory();
        const list = Array.isArray(data) ? data : data.predictions || [];
        setPastPredictions(list.map(mapPrediction));
      } catch {
        // fallback
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const rankHistoryData = [
    { date: 'Oct 1', rank: Math.max(user.rank + 40, 1), x: 50, y: 151 },
    { date: 'Oct 8', rank: Math.max(user.rank + 25, 1), x: 150, y: 120 },
    { date: 'Oct 15', rank: Math.max(user.rank + 10, 1), x: 250, y: 90 },
    { date: 'Oct 22', rank: Math.max(user.rank + 3, 1), x: 350, y: 70 },
    { date: 'Today', rank: user.rank, x: 450, y: 60 + Math.max(0, (100 - user.rank) * 0.5) },
  ];

  return (
    <div className="w-full space-y-8">
      <section className="bg-white border border-[#bccbb9]/40 rounded-2xl overflow-hidden shadow-sm relative">
        <div className="absolute inset-0 pitch-pattern opacity-10 pointer-events-none" />
        <div className="p-6 md:p-8 flex flex-col md:flex-row items-center gap-6 relative z-10">
          
          <div className="relative">
            <div className="w-24 h-24 md:w-28 md:h-28 rounded-full border-4 border-[#006e2f] bg-white overflow-hidden shadow-md">
              <img className="w-full h-full object-cover" src={getAvatarUrl(user.fullName || user.username, user.avatarUrl)} alt="Avatar" />
            </div>
            <span className="absolute bottom-1 right-1 bg-[#006e2f] text-white p-1 rounded-full border border-white">
              <Star size={16} fill="currentColor" />
            </span>
          </div>

          <div className="flex-grow text-center md:text-left">
            <div className="flex flex-col md:flex-row md:items-center gap-2 mb-1.5 justify-center md:justify-start">
              <h2 className="text-2xl md:text-3xl font-black text-[#0b1c30]">{user.fullName}</h2>
              <span className="bg-[#eff4ff] text-[#0051d5] border border-blue-105 font-bold text-xs px-3 py-0.5 rounded-full inline-block self-center">
                {user.studentId}
              </span>
            </div>
            <p className="text-[#3d4a3d] font-bold text-sm mb-3">Senior &bull; {user.classYear} &bull; Department of {user.department}</p>
            
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-xs font-bold text-gray-500">
              <div className="flex items-center gap-1">
                <Calendar size={14} />
                <span>Joined Sept 2024</span>
              </div>
              <span>&bull;</span>
              <div className="flex items-center gap-1">
                <Award size={14} className="text-[#daa300]" />
                <span>CET Football League</span>
              </div>
              <span>&bull;</span>
              <div className="flex items-center gap-1">
                <TrendingUp size={14} className="text-green-600" />
                <span>Streak: {user.winStreak} games</span>
              </div>
            </div>
          </div>

          <div className="bg-[#eff4ff]/60 border border-[#bccbb9]/20 p-5 rounded-2xl flex flex-row md:flex-col gap-6 justify-around w-full md:w-auto text-center md:text-left shrink-0">
            <div>
              <p className="text-[10px] font-extrabold uppercase text-gray-400 tracking-wider">Prediction Accuracy</p>
              <div className="text-3xl font-black text-[#006e2f]">{user.accuracy !== null ? `${user.accuracy}%` : '—'}</div>
            </div>
            <div>
              <p className="text-[10px] font-extrabold uppercase text-gray-400 tracking-wider">Rank</p>
              <div className="text-3xl font-black text-[#0b1c30]">#{user.rank}</div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white border border-[#bccbb9]/30 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="font-extrabold text-lg text-[#0b1c30]">Rank Progress</h3>
            <p className="text-gray-500 text-xs">Climbing trajectory over recent weeks</p>
          </div>
          <span className="bg-[#eff4ff] text-[#0051d5] text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
            <TrendingUp size={14} />
            Current: #{user.rank}
          </span>
        </div>

        <div className="relative w-full overflow-x-auto pt-4 pb-2">
          <svg className="min-w-[500px] w-full h-[220px]" viewBox="0 0 500 220">
            <line x1="50" y1="30" x2="450" y2="30" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="4" />
            <line x1="50" y1="70" x2="450" y2="70" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="4" />
            <line x1="50" y1="110" x2="450" y2="110" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="4" />
            <line x1="50" y1="150" x2="450" y2="150" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="4" />
            <line x1="50" y1="190" x2="450" y2="190" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="4" />

            <text x="25" y="34" className="text-[9px] font-mono font-bold fill-gray-400 text-right">#10</text>
            <text x="25" y="74" className="text-[9px] font-mono font-bold fill-gray-400 text-right">#40</text>
            <text x="25" y="114" className="text-[9px] font-mono font-bold fill-gray-400 text-right">#60</text>
            <text x="25" y="154" className="text-[9px] font-mono font-bold fill-gray-400 text-right">#80</text>
            <text x="25" y="194" className="text-[9px] font-mono font-bold fill-gray-400 text-right">#100</text>

            <defs>
              <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#22c55e" stopOpacity="0.15" />
                <stop offset="100%" stopColor="#22c55e" stopOpacity="0.0" />
              </linearGradient>
            </defs>
            <path 
              d={`M ${rankHistoryData.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')} L 450 200 L 50 200 Z`} 
              fill="url(#chartGrad)" 
            />
            <path 
              d={rankHistoryData.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')} 
              fill="none" stroke="#006e2f" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" 
            />

            {rankHistoryData.map((pt, idx) => (
              <circle
                key={idx}
                cx={pt.x} cy={pt.y}
                r={hoveredPoint?.label === pt.date ? "7" : "5"}
                fill={hoveredPoint?.label === pt.date ? "#0051d5" : "#006e2f"}
                stroke="#ffffff" strokeWidth="2"
                className="cursor-pointer transition-all duration-150"
                onMouseEnter={() => setHoveredPoint({ x: pt.x, y: pt.y, label: pt.date, rank: pt.rank })}
                onMouseLeave={() => setHoveredPoint(null)}
              />
            ))}
            {rankHistoryData.map((pt, idx) => (
              <text key={idx} x={pt.x} y="212" className="text-[10px] font-bold font-sans fill-gray-500 text-center" textAnchor="middle">
                {pt.date}
              </text>
            ))}
          </svg>

          {hoveredPoint && (
            <div 
              className="absolute bg-slate-900 text-white rounded px-2.5 py-1 text-xs shadow-md font-bold pointer-events-none z-20 flex flex-col items-center leading-none"
              style={{ left: `${hoveredPoint.x}px`, top: `${hoveredPoint.y - 12}px` }}
            >
              <span className="text-[9px] text-slate-300 font-normal mb-1">{hoveredPoint.label}</span>
              <span>Rank #{hoveredPoint.rank}</span>
            </div>
          )}
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="font-extrabold text-xl text-[#0b1c30] flex items-center gap-2">
          <History size={20} className="text-gray-600" />
          Past Predictions History
        </h3>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-2 border-zinc-400 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : pastPredictions.length === 0 ? (
          <div className="text-center py-12 bg-white border border-gray-200 rounded-xl">
            <Trophy size={40} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500 font-medium">No predictions yet. Start by predicting group stage matches!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {pastPredictions.map((pred) => {
              const isCorrect = pred.status === 'CORRECT';
              return (
                <div 
                  key={pred.id} 
                  className={`bg-white border rounded-xl overflow-hidden shadow-sm transition-all hover:shadow-md flex flex-col md:flex-row items-center p-5 md:p-6 justify-between gap-4 ${isCorrect ? 'border-green-200 bg-green-500/5' : 'border-red-100'}`}
                >
                  <div className="flex flex-col items-center md:items-start text-center md:text-left shrink-0">
                    <span className="text-[10px] uppercase font-mono font-extrabold text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded border border-blue-100">
                      {pred.group}
                    </span>
                    <span className="text-xs text-gray-500 font-semibold mt-1 flex items-center gap-1">
                      <Calendar size={12} />
                      {pred.dateLabel}
                    </span>
                  </div>

                  <div className="flex items-center gap-6 justify-center flex-grow py-2">
                    <div className="flex items-center gap-2 w-32 justify-end">
                      <span className="font-extrabold text-[#0b1c30] text-sm md:text-base text-right">{pred.teamA}</span>
                      <div className="w-8 h-8 rounded-full overflow-hidden border border-gray-200">
                        {FLAG_MAP[pred.teamAFlag] ? (
                          <img className="w-full h-full object-cover" src={FLAG_MAP[pred.teamAFlag]} alt="flag" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xs font-bold bg-gray-100">
                            {pred.teamAFlag}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col items-center shrink-0">
                      <div className="font-mono text-base md:text-lg font-black text-slate-800 bg-gray-100 px-3 py-1 rounded border border-gray-200">
                        <span>{pred.userScoreA ?? '?'}</span>
                        <span className="mx-1 text-gray-400 font-normal">-</span>
                        <span>{pred.userScoreB ?? '?'}</span>
                      </div>
                      <span className="text-[9px] font-bold text-gray-400 mt-1 uppercase">Your Guess</span>
                    </div>

                    <div className="flex flex-col items-center shrink-0">
                      <div className="font-mono text-base md:text-lg font-black text-[#0b1c30] bg-[#eff4ff] px-3 py-1 rounded border border-[#bccbb9]/40">
                        <span>{pred.actualScoreA ?? '-'}</span>
                        <span className="mx-1 text-gray-400 font-normal">-</span>
                        <span>{pred.actualScoreB ?? '-'}</span>
                      </div>
                      <span className="text-[9px] font-extrabold text-primary mt-1 uppercase">Result</span>
                    </div>

                    <div className="flex items-center gap-2 w-32 justify-start">
                      <div className="w-8 h-8 rounded-full overflow-hidden border border-gray-200">
                        {FLAG_MAP[pred.teamBFlag] ? (
                          <img className="w-full h-full object-cover" src={FLAG_MAP[pred.teamBFlag]} alt="flag" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xs font-bold bg-gray-100">
                            {pred.teamBFlag}
                          </div>
                        )}
                      </div>
                      <span className="font-extrabold text-[#0b1c30] text-sm md:text-base text-left">{pred.teamB}</span>
                    </div>
                  </div>

                  <div className="flex flex-row md:flex-col items-center gap-2 shrink-0 justify-end">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${isCorrect ? 'bg-green-150/15 text-[#006e2f] bg-green-100' : 'bg-red-100 text-red-700'}`}>
                      {isCorrect ? 'Correct' : pred.status === 'OPEN' ? 'Pending' : 'Incorrect'}
                    </span>
                    <span className="text-xs font-mono font-black text-gray-700">
                      {isCorrect ? `+${pred.pointsEarned || 150} pts` : '0 pts'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
