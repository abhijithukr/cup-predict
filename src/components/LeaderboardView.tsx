import React, { useState } from 'react';
import { Search, Trophy, Medal, Award, Flame, Star } from 'lucide-react';
import { LeaderboardUser } from '../types';

interface LeaderboardViewProps {
  leaderboardData: LeaderboardUser[];
  currentUserRank: number;
  currentUserPoints: number;
}

export default function LeaderboardView({ leaderboardData, currentUserRank, currentUserPoints }: LeaderboardViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'GLOBAL' | 'FRIENDS' | 'DEPT'>('GLOBAL');

  // Filter list based on search & tab selection
  const getFilteredData = () => {
    let list = [...leaderboardData];

    // Let's add current user dynamically to show real status!
    const userRow: LeaderboardUser = {
      id: "current_user",
      rank: currentUserRank,
      username: "alex_rivera (You)",
      department: "Business Admin",
      correctPercentage: 84,
      points: currentUserPoints,
      isCurrentUser: true,
      avatarUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuDxoWhez9GdIaYqL6r9uhYLqLTY6zyMT48GPRS7jvnw18I6dH4jy2fevVCzwVDK_5fzOjU3DsV7KqtCf7iEE3KyxcropPfWBzDmtXNWea8gXRM5M3osQrIE9fs7BxSwroqCb66VsnCz_eUR44w7TOxrQFl9DoBit2dAXTHLn-nvU1tKWkNEyP7pHMjk4bMCz1KJtOAwT0kqs6Tq-o0AdNAZ6Z18CvNy_UF4lBKp3gPD3N-Uf7DGoL9UbX8akk9vUCkUNQwdJe_SdB9F"
    };

    // Include current user in the sorting matrix!
    const alreadyIn = list.some(u => u.username.includes('alex_rivera'));
    if (!alreadyIn) {
      list.push(userRow);
    } else {
      // update points inside list
      list = list.map(u => u.username.includes('alex_rivera') ? { ...u, points: currentUserPoints, rank: currentUserRank } : u);
    }

    // Sort by points desc
    list.sort((a,b) => b.points - a.points);
    // reassing rank
    list = list.map((item, idx) => ({ ...item, rank: idx + 1 }));

    // Apply search filter
    if (searchQuery.trim() !== '') {
      list = list.filter(u => u.username.toLowerCase().includes(searchQuery.toLowerCase()) || u.department.toLowerCase().includes(searchQuery.toLowerCase()));
    }

    // Apply tab categorization
    if (activeTab === 'FRIENDS') {
      // Simulate close friend league
      list = list.filter(u => u.isCurrentUser || u.username === 'Jordan_K' || u.username === 'Sarah_Predictions');
    } else if (activeTab === 'DEPT') {
      // Highlight Business Admin department
      list = list.filter(u => u.isCurrentUser || u.department === 'Economics');
    }

    return list;
  };

  const filteredUsers = getFilteredData();

  // Top 3 for Podium drawing
  const top1 = leaderboardData.find(u => u.rank === 1);
  const top2 = leaderboardData.find(u => u.rank === 2);
  const top3 = leaderboardData.find(u => u.rank === 3);

  return (
    <div className="w-full space-y-8">
      {/* Header */}
      <header className="mb-4">
        <div className="flex items-center gap-1.5 mb-1 text-[#0051d5]">
          <span className="w-2.5 h-2.5 bg-blue-600 rounded-full animate-pulse"></span>
          <span className="font-extrabold text-xs uppercase tracking-widest">Campus League Status</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-extrabold text-[#0b1c30] mb-2 tracking-tight">Leaderboard</h1>
        <p className="text-gray-600 max-w-2xl text-sm leading-relaxed">
          See where you stand against fellow predictors. Climb your way up to earn legendary digital trophies and campus glory.
        </p>
      </header>

      {/* 3D ATHLETIC LEADERBOARD PODIUM */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end max-w-4xl mx-auto pt-6 pb-2 px-4 bg-gradient-to-b from-[#eff4ff]/60 to-white rounded-2xl border border-blue-50">
        
        {/* 2ND PLACE (Left) */}
        {top2 && (
          <div className="flex flex-col items-center order-2 md:order-1 transition-transform hover:translate-y-[-4px] duration-300">
            <div className="relative mb-3">
              <div className="w-16 h-16 md:w-20 md:h-20 rounded-full border-4 border-slate-350 overflow-hidden shadow-md ring-4 ring-white bg-white">
                <img className="w-full h-full object-cover" src={top2.avatarUrl} alt="2nd place avatar" />
              </div>
              <div className="absolute -bottom-1 -right-1 bg-slate-400 text-white p-1 rounded-full border border-white shadow-md">
                <Medal size={16} />
              </div>
            </div>
            <div className="text-center mb-2">
              <h4 className="font-extrabold text-[#0b1c30] text-sm md:text-base">{top2.username}</h4>
              <p className="text-[10px] text-gray-500 font-bold">{top2.department}</p>
            </div>
            {/* Podium Base */}
            <div className="w-full bg-[#eff4ff]/90 border border-t-0 border-[#bccbb9]/40 rounded-t-xl py-6 px-4 text-center shadow-sm min-h-[90px]">
              <span className="font-black text-2xl text-slate-500">2</span>
              <p className="font-bold text-xs text-[#0b1c30] mt-1">{top2.points} pts</p>
            </div>
          </div>
        )}

        {/* 1ST PLACE (Center - tallest) */}
        {top1 && (
          <div className="flex flex-col items-center order-1 md:order-2 transition-transform hover:translate-y-[-6px] duration-300">
            {/* Crown icon badge */}
            <div className="text-yellow-600 mb-1 animate-bounce">
              <Award size={26} fill="currentColor" />
            </div>
            <div className="relative mb-3">
              <div className="w-20 h-20 md:w-24 md:h-24 rounded-full border-4 border-yellow-400 overflow-hidden shadow-lg ring-4 ring-white bg-white">
                <img className="w-full h-full object-cover" src={top1.avatarUrl} alt="1st place avatar" />
              </div>
              <div className="absolute -bottom-1 -right-1 bg-yellow-400 text-white p-1.5 rounded-full border border-white shadow-lg">
                <Trophy size={18} />
              </div>
            </div>
            <div className="text-center mb-2">
              <h4 className="font-black text-[#0b1c30] text-base md:text-lg">{top1.username}</h4>
              <p className="text-[10px] text-primary font-bold">{top1.department}</p>
            </div>
            {/* Podium Base */}
            <div className="w-full bg-[#cbdfff] border border-t-0 border-blue-200 rounded-t-2xl py-10 px-4 text-center shadow-md min-h-[120px] relative overflow-hidden">
              <div className="absolute inset-0 pitch-pattern opacity-5 pointer-events-none" />
              <span className="font-black text-3xl text-yellow-600">1</span>
              <p className="font-black text-sm text-[#0051d5] mt-1">{top1.points} pts</p>
              <div className="mt-1 flex items-center justify-center gap-0.5 text-[9px] text-green-700 font-extrabold uppercase">
                <Flame size={10} fill="currentColor" />
                <span>Top Pick</span>
              </div>
            </div>
          </div>
        )}

        {/* 3RD PLACE (Right) */}
        {top3 && (
          <div className="flex flex-col items-center order-3 md:order-3 transition-transform hover:translate-y-[-4px] duration-300">
            <div className="relative mb-3">
              <div className="w-16 h-16 md:w-20 md:h-20 rounded-full border-4 border-amber-505 overflow-hidden shadow-md ring-4 ring-white bg-white">
                <img className="w-full h-full object-cover" src={top3.avatarUrl} alt="3rd place avatar" />
              </div>
              <div className="absolute -bottom-1 -right-1 bg-amber-600 text-white p-1 rounded-full border border-white shadow-md">
                <Award size={16} />
              </div>
            </div>
            <div className="text-center mb-2">
              <h4 className="font-extrabold text-[#0b1c30] text-sm md:text-base">{top3.username}</h4>
              <p className="text-[10px] text-gray-400 font-bold">{top3.department}</p>
            </div>
            {/* Podium Base */}
            <div className="w-full bg-[#eff4ff]/70 border border-t-0 border-[#bccbb9]/20 rounded-t-xl py-4 px-4 text-center shadow-sm min-h-[70px]">
              <span className="font-black text-xl text-amber-700">3</span>
              <p className="font-bold text-xs text-[#0b1c30] mt-1">{top3.points} pts</p>
            </div>
          </div>
        )}

      </section>

      {/* FILTER BUTTONS & SEARCH BAR */}
      <section className="flex flex-col md:flex-row items-center justify-between gap-4 mt-8">
        
        {/* Navigation segment Tabs */}
        <div className="flex bg-white/80 rounded-full p-1 border border-gray-200 shadow-sm w-full md:w-auto">
          <button 
            onClick={() => setActiveTab('GLOBAL')}
            className={`flex-1 md:flex-none px-6 py-2 rounded-full font-bold text-xs transition-all cursor-pointer ${activeTab === 'GLOBAL' ? 'bg-primary text-white' : 'text-gray-500 hover:text-gray-900'}`}
          >
            Global List
          </button>
          <button 
            onClick={() => setActiveTab('FRIENDS')}
            className={`flex-1 md:flex-none px-6 py-2 rounded-full font-bold text-xs transition-all cursor-pointer ${activeTab === 'FRIENDS' ? 'bg-primary text-white' : 'text-gray-500 hover:text-gray-900'}`}
          >
            Friends Club
          </button>
          <button 
            onClick={() => setActiveTab('DEPT')}
            className={`flex-1 md:flex-none px-6 py-2 rounded-full font-bold text-xs transition-all cursor-pointer ${activeTab === 'DEPT' ? 'bg-primary text-white' : 'text-gray-500 hover:text-gray-900'}`}
          >
            My Department
          </button>
        </div>

        {/* Input panel */}
        <div className="relative w-full md:w-80 group">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-600 transition-colors">
            <Search size={16} />
          </span>
          <input 
            type="text" 
            placeholder="Search predictors or department..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-[#bccbb9]/60 rounded-full py-2.5 pl-11 pr-5 text-sm placeholder:text-gray-400 outline-none focus:ring-4 focus:ring-green-100 focus:border-primary transition-all text-[#0b1c30]"
          />
        </div>
      </section>

      {/* DETAILED LEADERBOARD LIST TABLE */}
      <section className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/70 border-b border-gray-200 font-mono text-[11px] font-bold text-gray-500 tracking-wider">
                <th className="py-4 px-6 text-center">Rank</th>
                <th className="py-4 px-6">Predictor Student</th>
                <th className="py-4 px-6">Department</th>
                <th className="py-4 px-6 text-center">Accuracy</th>
                <th className="py-4 px-6 text-right">Points Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredUsers.length > 0 ? (
                filteredUsers.map((item) => (
                  <tr 
                    key={item.id} 
                    className={`transition-colors group hover:bg-[#eff4ff]/60 ${item.isCurrentUser ? 'bg-emerald-500/5 hover:bg-emerald-500/10 border-l-4 border-[#006e2f]' : ''}`}
                  >
                    {/* Rank cell */}
                    <td className="py-4 px-6 text-center font-bold text-sm text-[#0b1c30]">
                      <div className="flex items-center justify-center gap-1">
                        {item.rank <= 3 ? (
                          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black ${item.rank === 1 ? 'bg-yellow-100 text-yellow-700' : (item.rank === 2 ? 'bg-slate-100 text-slate-700' : 'bg-orange-100 text-orange-700')}`}>
                            {item.rank}
                          </span>
                        ) : (
                          <span>{item.rank}</span>
                        )}
                        {item.isCurrentUser && <Star size={12} fill="currentColor" className="text-yellow-500 animate-spin-slow" />}
                      </div>
                    </td>

                    {/* Username and Avatar */}
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full overflow-hidden border border-gray-200 flex-shrink-0 bg-gray-50">
                          {item.avatarUrl ? (
                            <img className="w-full h-full object-cover" src={item.avatarUrl} alt="Predictor avatar" />
                          ) : (
                            <div className="w-full h-full bg-[#eff4ff] text-[#0051d5] flex items-center justify-center font-extrabold text-xs">
                              {item.username.substring(0,2).toUpperCase()}
                            </div>
                          )}
                        </div>
                        <span className={`font-bold text-sm leading-none ${item.isCurrentUser ? 'text-[#006e2f]' : 'text-[#0b1c30]'}`}>
                          {item.username}
                        </span>
                      </div>
                    </td>

                    {/* Department */}
                    <td className="py-4 px-6 text-sm text-[#3d4a3d] font-medium">
                      {item.department}
                    </td>

                    {/* Accuracy rate */}
                    <td className="py-4 px-6 text-center">
                      <span className="font-mono text-sm font-bold bg-[#eff4ff] text-[#0b1c30] px-2.5 py-1 rounded-md border border-gray-100">
                        {item.correctPercentage}%
                      </span>
                    </td>

                    {/* Points Balance */}
                    <td className="py-4 px-6 text-right font-bold text-sm text-[#0b1c30]">
                      {item.points.toLocaleString()} pts
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-gray-500 font-medium">
                    No predictors match the search parameters. Try adjusting the search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
