import React, { useState, useEffect } from 'react';
import { FLAG_MAP } from '../initialData';
import { MatchPrediction } from '../types';
import { Check, Info, Lock, Verified } from 'lucide-react';

interface PredictionsViewProps {
  initialFixtures: MatchPrediction[];
  onUpdatePoints: (pts: number) => void;
  onAddPastPredictions: (preds: MatchPrediction[]) => void;
}

export default function PredictionsView({ initialFixtures, onUpdatePoints, onAddPastPredictions }: PredictionsViewProps) {
  const [fixtures, setFixtures] = useState<MatchPrediction[]>([]);
  const [unsavedCount, setUnsavedCount] = useState(2);

  useEffect(() => {
    // Load fixtures or fetch from state/localStorage
    const stored = localStorage.getItem('group_stage_fixtures');
    if (stored) {
      setFixtures(JSON.parse(stored));
    } else {
      setFixtures(initialFixtures);
    }
  }, [initialFixtures]);

  // Sync count of empty scores
  useEffect(() => {
    const unsaved = fixtures.filter(f => !f.isClosed && (!f.scoreA.trim() || !f.scoreB.trim())).length;
    setUnsavedCount(unsaved);
  }, [fixtures]);

  const handleScoreChange = (id: string, team: 'A' | 'B', val: string) => {
    setFixtures(prev => {
      const updated = prev.map(f => {
        if (f.id === id) {
          return team === 'A' ? { ...f, scoreA: val } : { ...f, scoreB: val };
        }
        return f;
      });
      localStorage.setItem('group_stage_fixtures', JSON.stringify(updated));
      return updated;
    });
  };

  const handleSubmitAll = () => {
    const incomplete = fixtures.filter(f => !f.isClosed && (!f.scoreA.trim() || !f.scoreB.trim()));
    if (incomplete.length > 0) {
      alert(`Please enter valid score predictions for all open fixtures first. You have ${incomplete.length} unfilled predictions.`);
      return;
    }

    // Submit and transfer to closed past predictions dynamically to showcase persistent data!
    onUpdatePoints(300); // 150 points per predicted game
    
    const submittedAsPast = fixtures.map(f => {
      if (!f.isClosed) {
        return {
          ...f,
          isClosed: true,
          userScoreA: parseInt(f.scoreA),
          userScoreB: parseInt(f.scoreB),
          actualScoreA: Math.floor(Math.random() * 3), // Simulating actual result
          actualScoreB: Math.floor(Math.random() * 3),
          status: 'CORRECT' as const, // Let's showcase it positively!
          pointsEarned: 150
        };
      }
      return f;
    });

    onAddPastPredictions(submittedAsPast.filter(f => f.id !== 'groupA_2')); // Skip already closed
    
    // Lock fixtures locally too
    setFixtures(submittedAsPast);
    localStorage.setItem('group_stage_fixtures', JSON.stringify(submittedAsPast));
    
    alert('CUP PREDICT saved all predictions successfully! You gained +300 points and climb standard ladders! Check your Profile or Leaderboard.');
  };

  return (
    <div className="w-full space-y-6">
      {/* Header section */}
      <header className="mb-4">
        <div className="flex items-center gap-1.5 mb-1 text-primary">
          <span className="w-2.5 h-2.5 bg-primary rounded-full animate-pulse-green"></span>
          <span className="font-bold text-xs uppercase tracking-widest text-[#a3e635]">Live Tournament</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-extrabold text-white mb-2 tracking-tight">Group Stage Predictions</h1>
        <p className="text-zinc-400 max-w-2xl text-sm leading-relaxed">
          Predict the scores for upcoming matches to earn points and climb the campus leaderboard. Predictions close 15 minutes before kickoff.
        </p>
      </header>

      {/* Feed List */}
      <div className="grid grid-cols-1 gap-6">
        
        {/* GROUP A */}
        <div className="flex items-center gap-3 mt-4">
          <div className="px-5 py-1 bg-zinc-900 border border-white/10 text-white font-black text-xs uppercase tracking-widest">Group A</div>
          <div className="h-[1px] flex-grow bg-white/10"></div>
        </div>

        {/* France vs Brazil - Open Prediction */}
        {fixtures.find(f => f.id === 'groupA_1') && (() => {
          const f = fixtures.find(f => f.id === 'groupA_1')!;
          return (
            <div className="bg-zinc-950 border border-white/10 rounded-none overflow-hidden shadow-sm hover:border-white/30 transition-all group relative duration-300">
              <div className="flex flex-col md:flex-row items-center p-6 md:p-8 gap-6 relative">
                <div className="absolute inset-0 pitch-pattern opacity-10 pointer-events-none" />
                
                {/* Team France */}
                <div className="flex flex-col items-center gap-2 flex-1 z-10">
                  <div className="w-20 h-20 md:w-24 md:h-24 rounded-none border border-white/10 shadow-md overflow-hidden flex items-center justify-center bg-zinc-900/60 ring-2 ring-white/5">
                    <img 
                      className="w-full h-full object-cover filter grayscale contrast-125" 
                      src={FLAG_MAP.FR}
                      alt="France flag" 
                    />
                  </div>
                  <span className="font-extrabold text-white text-lg select-all">{f.teamA}</span>
                </div>

                {/* Score Input block */}
                <div className="flex items-center gap-4 z-10 justify-center">
                  <div className="flex flex-col items-center">
                    <input 
                      type="number" 
                      min="0"
                      disabled={f.isClosed}
                      placeholder="0"
                      value={f.scoreA}
                      onChange={(e) => handleScoreChange(f.id, 'A', e.target.value)}
                      className="w-16 h-16 md:w-20 md:h-20 text-center text-3xl font-black rounded-none border border-white/10 focus:border-white transition-all bg-zinc-900 outline-none text-white"
                    />
                    <span className="font-semibold text-xs text-zinc-400 mt-2">Goals</span>
                  </div>

                  <div className="flex flex-col items-center gap-1">
                    <span className="text-3xl font-extrabold text-zinc-600 opacity-50">VS</span>
                    <span className="px-3 py-0.5 bg-zinc-900 text-zinc-400 text-[10px] uppercase font-bold rounded">20:00 PM</span>
                  </div>

                  <div className="flex flex-col items-center">
                    <input 
                      type="number" 
                      min="0"
                      disabled={f.isClosed}
                      placeholder="0"
                      value={f.scoreB}
                      onChange={(e) => handleScoreChange(f.id, 'B', e.target.value)}
                      className="w-16 h-16 md:w-20 md:h-20 text-center text-3xl font-black rounded-none border border-white/10 focus:border-white transition-all bg-zinc-900 outline-none text-white"
                    />
                    <span className="font-semibold text-xs text-zinc-400 mt-2">Goals</span>
                  </div>
                </div>

                {/* Team Brazil */}
                <div className="flex flex-col items-center gap-2 flex-1 z-10">
                  <div className="w-20 h-20 md:w-24 md:h-24 rounded-none border border-white/10 shadow-md overflow-hidden flex items-center justify-center bg-zinc-900/60 ring-2 ring-white/5">
                    <img 
                      className="w-full h-full object-cover filter grayscale contrast-125" 
                      src={FLAG_MAP.BR} 
                      alt="Brazil flag" 
                    />
                  </div>
                  <span className="font-extrabold text-white text-lg">{f.teamB}</span>
                </div>
              </div>

              {/* Card Footer status info */}
              <div className="bg-zinc-900 px-6 py-3 flex justify-between items-center border-t border-white/5">
                <span className="font-semibold text-xs text-zinc-400">{f.dateLabel}</span>
                <div className="flex items-center gap-1 text-zinc-400 font-bold text-xs select-none">
                  {f.isClosed ? (
                    <>
                      <Lock size={14} className="text-zinc-650" />
                      <span className="text-zinc-500">Prediction Closed</span>
                    </>
                  ) : (
                    <>
                      <Verified size={15} className="text-[#a3e635]" />
                      <span className="text-[#a3e635] font-black uppercase tracking-wider text-[10px]">Prediction Open</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })()}

        {/* Argentina vs Spain - Locked/Closed Prediction Card */}
        {fixtures.find(f => f.id === 'groupA_2') && (() => {
          const f = fixtures.find(f => f.id === 'groupA_2')!;
          return (
            <div className="bg-gray-100/70 border border-gray-300 rounded-xl overflow-hidden opacity-85 hover:shadow-sm transition-all relative">
              <div className="flex flex-col md:flex-row items-center p-6 md:p-8 gap-6 justify-between grayscale-[0.25]">
                {/* Team Argentina */}
                <div className="flex flex-col items-center gap-2 flex-1">
                  <div className="w-16 h-16 md:w-20 md:h-20 rounded-full border-2 border-gray-300 overflow-hidden flex items-center justify-center bg-white shadow-sm">
                    <img 
                      className="w-full h-full object-cover" 
                      src={FLAG_MAP.AR} 
                      alt="Argentina flag" 
                    />
                  </div>
                  <span className="font-bold text-[#1d1409] text-sm md:text-base">{f.teamA}</span>
                </div>

                {/* Score locked blocks */}
                <div className="flex items-center gap-6">
                  <div className="w-14 h-14 bg-gray-200/80 rounded-lg flex items-center justify-center text-2xl font-black text-gray-700 shadow-inner">
                    1
                  </div>
                  <div className="flex flex-col items-center">
                    <Lock size={22} className="text-gray-400" />
                    <span className="font-extrabold text-[10px] uppercase text-gray-400 mt-1">Closed</span>
                  </div>
                  <div className="w-14 h-14 bg-gray-200/80 rounded-lg flex items-center justify-center text-2xl font-black text-gray-700 shadow-inner">
                    0
                  </div>
                </div>

                {/* Team Spain */}
                <div className="flex flex-col items-center gap-2 flex-1">
                  <div className="w-16 h-16 md:w-20 md:h-20 rounded-full border-2 border-gray-300 overflow-hidden flex items-center justify-center bg-white shadow-sm">
                    <img 
                      className="w-full h-full object-cover" 
                      src={FLAG_MAP.ES} 
                      alt="Spain flag" 
                    />
                  </div>
                  <span className="font-bold text-[#1d1409] text-sm md:text-base">{f.teamB}</span>
                </div>
              </div>
            </div>
          );
        })()}

        {/* GROUP B */}
        <div className="flex items-center gap-3 mt-4">
          <div className="px-5 py-1 bg-zinc-800 text-zinc-300 font-bold text-xs uppercase tracking-widest border border-zinc-500/10">Group B</div>
          <div className="h-[1px] flex-grow bg-zinc-500/10"></div>
        </div>

        {/* Germany vs Japan - Open Prediction */}
        {fixtures.find(f => f.id === 'groupB_1') && (() => {
          const f = fixtures.find(f => f.id === 'groupB_1')!;
          return (
            <div className="bg-white border border-[#bccbb9]/40 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all group relative duration-300">
              <div className="flex flex-col md:flex-row items-center p-6 md:p-8 gap-6 relative">
                <div className="absolute inset-0 pitch-pattern opacity-10 pointer-events-none" />
                
                {/* Team Germany */}
                <div className="flex flex-col items-center gap-2 flex-1 z-10">
                  <div className="w-20 h-20 md:w-24 md:h-24 rounded-full border-4 border-white shadow-md overflow-hidden flex items-center justify-center bg-gray-50 ring-2 ring-gray-100">
                    <img 
                      className="w-full h-full object-cover" 
                      src={FLAG_MAP.DE} 
                      alt="Germany flag" 
                    />
                  </div>
                  <span className="font-extrabold text-[#1d1409] text-lg">{f.teamA}</span>
                </div>

                {/* Score Input block */}
                <div className="flex items-center gap-4 z-10 justify-center">
                  <input 
                    type="number" 
                    min="0"
                    disabled={f.isClosed}
                    placeholder="-"
                    value={f.scoreA}
                    onChange={(e) => handleScoreChange(f.id, 'A', e.target.value)}
                    className="w-16 h-16 md:w-20 md:h-20 text-center text-3xl font-black rounded-none border border-zinc-500/20 focus:border-zinc-400 transition-all bg-zinc-800 outline-none text-[#1d1409]"
                  />

                  <div className="flex flex-col items-center gap-1">
                    <span className="text-3xl font-extrabold text-zinc-400 opacity-50">VS</span>
                    <span className="px-3 py-0.5 bg-zinc-800 text-[#4b3d2e] text-[10px] uppercase font-bold">18:00 PM</span>
                  </div>

                  <input 
                    type="number" 
                    min="0"
                    disabled={f.isClosed}
                    placeholder="-"
                    value={f.scoreB}
                    onChange={(e) => handleScoreChange(f.id, 'B', e.target.value)}
                    className="w-16 h-16 md:w-20 md:h-20 text-center text-3xl font-black rounded-none border border-zinc-500/20 focus:border-zinc-400 transition-all bg-zinc-800 outline-none text-[#1d1409]"
                  />
                </div>

                {/* Team Japan */}
                <div className="flex flex-col items-center gap-2 flex-1 z-10">
                  <div className="w-20 h-20 md:w-24 md:h-24 rounded-full border-4 border-white shadow-md overflow-hidden flex items-center justify-center bg-gray-50 ring-2 ring-gray-100">
                    <img 
                      className="w-full h-full object-cover" 
                      src={FLAG_MAP.JP} 
                      alt="Japan flag" 
                    />
                  </div>
                  <span className="font-extrabold text-[#1d1409] text-lg">{f.teamB}</span>
                </div>
              </div>

              {/* Card Footer status info */}
              <div className="bg-zinc-800 px-6 py-3 flex justify-between items-center border-t border-zinc-500/10">
                <span className="font-semibold text-xs text-[#4b3d2e]">{f.dateLabel}</span>
                <div className="flex items-center gap-1 text-[#4b3d2e] font-bold text-xs select-none">
                  {f.isClosed ? (
                    <>
                      <Lock size={14} className="text-[#4b3d2e]/50" />
                      <span className="text-[#4b3d2e]/60 font-bold">Prediction Closed</span>
                    </>
                  ) : (
                    <>
                      <Verified size={15} className="text-[#1d1409]" />
                      <span className="text-[#1d1409] font-black uppercase tracking-wider text-[10px]">Prediction Open</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })()}

      </div>

      {/* Sticky warnings & submits at bottom */}
      <footer className="mt-12 flex flex-col items-center gap-4 bg-zinc-800/80 backdrop-blur-md p-6 border border-zinc-500/10">
        {unsavedCount > 0 && (
          <div className="flex items-center gap-2 text-[#4b3d2e] font-bold text-sm">
            <Info className="text-[#1d1409]" size={18} />
            <span>You have {unsavedCount} unsaved predictions. Don't forget to submit!</span>
          </div>
        )}
        <button 
          onClick={handleSubmitAll}
          className="w-full md:w-auto min-w-[280px] bg-[#1d1409] hover:bg-[#4b3d2e] text-white font-extrabold py-3.5 px-8 transition-all text-base cursor-pointer"
        >
          Submit All Predictions
        </button>
      </footer>
    </div>
  );
}
