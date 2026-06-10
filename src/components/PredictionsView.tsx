import React, { useState, useEffect } from 'react';
import { getFixtures, submitPrediction } from '../api';
import { Check, Info, Lock, Verified } from 'lucide-react';

function isMatchLocked(f: any): boolean {
  return f.isClosed || (f.kickoffTime && new Date(f.kickoffTime) <= new Date());
}

export default function PredictionsView() {
  const [fixtures, setFixtures] = useState<any[]>([]);
  const [scores, setScores] = useState<Record<string, { a: string; b: string }>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const data = await getFixtures();
        const list = data.fixtures || [];
        setFixtures(list);
        const init: Record<string, { a: string; b: string }> = {};
        list.forEach((f: any) => { init[f.id] = { a: '', b: '' }; });
        setScores(init);
      } catch {
        // fallback
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleScoreChange = (id: string, team: 'A' | 'B', val: string) => {
    setScores(prev => ({
      ...prev,
      [id]: { ...prev[id], [team === 'A' ? 'a' : 'b']: val },
    }));
  };

  const handleSubmitAll = async () => {
    const openFixtures = fixtures.filter(f => !isMatchLocked(f));
    const incomplete = openFixtures.filter(f => {
      const s = scores[f.id];
      return !s || !s.a.trim() || !s.b.trim();
    });
    if (incomplete.length > 0) {
      alert(`Please enter valid score predictions for all open fixtures first. You have ${incomplete.length} unfilled predictions.`);
      return;
    }

    setSubmitting(true);
    try {
      for (const f of openFixtures) {
        const s = scores[f.id];
        await submitPrediction(f.id, parseInt(s.a), parseInt(s.b));
      }
      alert('All predictions saved successfully!');
      // Refresh fixtures to reflect closed state
      const data = await getFixtures();
      setFixtures(data.fixtures || []);
    } catch (err: any) {
      alert(err.message || 'Failed to submit predictions');
    } finally {
      setSubmitting(false);
    }
  };

  const groups = fixtures.reduce((acc: Record<string, any[]>, f: any) => {
    const g = f.groupName || 'Unknown';
    if (!acc[g]) acc[g] = [];
    acc[g].push(f);
    return acc;
  }, {});

  if (loading) {
    return (
      <div className="w-full flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-zinc-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const unsavedCount = fixtures.filter(f => {
    if (isMatchLocked(f)) return false;
    const s = scores[f.id];
    return !s || !s.a.trim() || !s.b.trim();
  }).length;

  return (
    <div className="w-full space-y-6">
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

      <div className="grid grid-cols-1 gap-6">
        {Object.entries(groups).map(([groupName, groupFixtures]: [string, any]) => (
          <React.Fragment key={groupName}>
            <div className="flex items-center gap-3 mt-4">
              <div className="px-5 py-1 bg-zinc-900 border border-white/10 text-white font-black text-xs uppercase tracking-widest">{groupName}</div>
              <div className="h-[1px] flex-grow bg-white/10"></div>
            </div>

            {(groupFixtures as any[]).map((f: any) => {
              const s = scores[f.id] || { a: '', b: '' };
              return (
                <div key={f.id} className={`bg-zinc-950 border border-white/10 rounded-none overflow-hidden shadow-sm hover:border-white/30 transition-all group relative duration-300 ${isMatchLocked(f) ? 'opacity-70' : ''}`}>
                  <div className="flex flex-col md:flex-row items-center p-6 md:p-8 gap-6 relative">
                    <div className="absolute inset-0 pitch-pattern opacity-10 pointer-events-none" />

                    <div className="flex flex-col items-center gap-2 flex-1 z-10">
                      <div className="w-20 h-20 md:w-24 md:h-24 rounded-none border border-white/10 shadow-md overflow-hidden flex items-center justify-center bg-zinc-900/60 ring-2 ring-white/5">
                        {f.teamA?.flagUrl ? (
                          <img className="w-full h-full object-cover filter grayscale contrast-125" src={f.teamA.flagUrl} alt={f.teamA.code} />
                        ) : (
                          <span className="font-black text-2xl text-zinc-600">{f.teamA?.code || '?'}</span>
                        )}
                      </div>
                      <span className="font-extrabold text-white text-lg">{f.teamA?.name || f.teamACode}</span>
                    </div>

                    <div className="flex items-center gap-4 z-10 justify-center">
                      <div className="flex flex-col items-center">
                        <input 
                          type="number" min="0"
                          disabled={isMatchLocked(f)}
                          placeholder="0"
                          value={s.a}
                          onChange={(e) => handleScoreChange(f.id, 'A', e.target.value)}
                          className="w-16 h-16 md:w-20 md:h-20 text-center text-3xl font-black rounded-none border border-white/10 focus:border-white transition-all bg-zinc-900 outline-none text-white disabled:opacity-50"
                        />
                        <span className="font-semibold text-xs text-zinc-400 mt-2">Goals</span>
                      </div>

                      <div className="flex flex-col items-center gap-1">
                        <span className="text-3xl font-extrabold text-zinc-600 opacity-50">VS</span>
                        {f.kickoffTime && (
                          <span className="px-3 py-0.5 bg-zinc-900 text-zinc-400 text-[10px] uppercase font-bold rounded">
                            {new Date(f.kickoffTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        )}
                      </div>

                      <div className="flex flex-col items-center">
                        <input 
                          type="number" min="0"
                          disabled={isMatchLocked(f)}
                          placeholder="0"
                          value={s.b}
                          onChange={(e) => handleScoreChange(f.id, 'B', e.target.value)}
                          className="w-16 h-16 md:w-20 md:h-20 text-center text-3xl font-black rounded-none border border-white/10 focus:border-white transition-all bg-zinc-900 outline-none text-white disabled:opacity-50"
                        />
                        <span className="font-semibold text-xs text-zinc-400 mt-2">Goals</span>
                      </div>
                    </div>

                    <div className="flex flex-col items-center gap-2 flex-1 z-10">
                      <div className="w-20 h-20 md:w-24 md:h-24 rounded-none border border-white/10 shadow-md overflow-hidden flex items-center justify-center bg-zinc-900/60 ring-2 ring-white/5">
                        {f.teamB?.flagUrl ? (
                          <img className="w-full h-full object-cover filter grayscale contrast-125" src={f.teamB.flagUrl} alt={f.teamB.code} />
                        ) : (
                          <span className="font-black text-2xl text-zinc-600">{f.teamB?.code || '?'}</span>
                        )}
                      </div>
                      <span className="font-extrabold text-white text-lg">{f.teamB?.name || f.teamBCode}</span>
                    </div>
                  </div>

                  <div className="bg-zinc-900 px-6 py-3 flex justify-between items-center border-t border-white/5">
                    <span className="font-semibold text-xs text-zinc-400">
                      {f.kickoffTime ? new Date(f.kickoffTime).toLocaleDateString() : 'TBD'}
                    </span>
                    <div className="flex items-center gap-1 text-zinc-400 font-bold text-xs select-none">
                      {f.isClosed ? (
                        <>
                          <Lock size={14} className="text-zinc-650" />
                          <span className="text-zinc-500">Closed</span>
                        </>
                      ) : isMatchLocked(f) ? (
                        <span className="text-zinc-500">Match started</span>
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
            })}
          </React.Fragment>
        ))}
      </div>

      {unsavedCount > 0 && (
        <footer className="mt-12 flex flex-col items-center gap-4 bg-zinc-800/80 backdrop-blur-md p-6 border border-zinc-500/10">
          <div className="flex items-center gap-2 text-[#4b3d2e] font-bold text-sm">
            <Info className="text-[#1d1409]" size={18} />
            <span>You have {unsavedCount} unsaved predictions. Don't forget to submit!</span>
          </div>
          <button 
            onClick={handleSubmitAll}
            disabled={submitting}
            className="w-full md:w-auto min-w-[280px] bg-white hover:bg-zinc-200 text-black font-extrabold py-3.5 px-8 transition-all text-base cursor-pointer disabled:opacity-50"
          >
            {submitting ? 'Submitting...' : 'Submit All Predictions'}
          </button>
        </footer>
      )}
    </div>
  );
}
