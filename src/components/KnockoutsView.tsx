import React, { useState, useEffect } from 'react';
import { Trophy, Check, Users, ShieldAlert, Award } from 'lucide-react';
import { getBracket, saveBracket, lockBracket as lockBracketApi } from '../api';

interface KnockoutsViewProps {
  username: string;
}

export default function KnockoutsView({ username }: KnockoutsViewProps) {
  const [m1, setM1] = useState<string>('');
  const [m2, setM2] = useState<string>('');
  const [m3, setM3] = useState<string>('');
  const [m4, setM4] = useState<string>('');
  const [q1, setQ1] = useState<string>('');
  const [q2, setQ2] = useState<string>('');
  const [champion, setChampion] = useState<string>('');
  const [isLocked, setIsLocked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const data = await getBracket(username);
        const bracketData = data.bracket || data;
        if (bracketData && bracketData.m1) {
          const b = bracketData;
          setM1(b.m1 || '');
          setM2(b.m2 || '');
          setM3(b.m3 || '');
          setM4(b.m4 || '');
          setQ1(b.q1 || '');
          setQ2(b.q2 || '');
          setChampion(b.champion || '');
          setIsLocked(b.locked || false);
        }
      } catch {
        // no bracket saved yet
      } finally {
        setLoading(false);
      }
    })();
  }, [username]);

  const handleSelectM1 = (team: string) => {
    if (isLocked) return;
    setM1(team);
    if (q1 === m1 || q1 === team) setQ1('');
    if (champion === q1) setChampion('');
  };

  const handleSelectM2 = (team: string) => {
    if (isLocked) return;
    setM2(team);
    if (q1 === m2 || q1 === team) setQ1('');
    if (champion === q1) setChampion('');
  };

  const handleSelectM3 = (team: string) => {
    if (isLocked) return;
    setM3(team);
    if (q2 === m3 || q2 === team) setQ2('');
    if (champion === q2) setChampion('');
  };

  const handleSelectM4 = (team: string) => {
    if (isLocked) return;
    setM4(team);
    if (q2 === m4 || q2 === team) setQ2('');
    if (champion === q2) setChampion('');
  };

  const handleSelectQ1 = (team: string) => {
    if (isLocked) return;
    if (!m1 || !m2) { alert('Please complete the preceding round predictions first.'); return; }
    setQ1(team);
    if (champion === q1 || champion === team) setChampion('');
  };

  const handleSelectQ2 = (team: string) => {
    if (isLocked) return;
    if (!m3 || !m4) { alert('Please complete the preceding round predictions first.'); return; }
    setQ2(team);
    if (champion === q2 || champion === team) setChampion('');
  };

  const handleSelectChampion = (team: string) => {
    if (isLocked) return;
    if (!q1 || !q2) { alert('Please complete the preceding round predictions first.'); return; }
    setChampion(team);
  };

  const handleSave = async () => {
    if (!m1 || !m2 || !m3 || !m4 || !q1 || !q2 || !champion) {
      alert('Please fill out the entire tournament tree before saving.');
      return;
    }
    setSaving(true);
      try {
        await saveBracket({ m1, m2, m3, m4, q1, q2, s1: champion, champion });
        alert('Bracket saved successfully!');
    } catch (err: any) {
      alert(err.message || 'Failed to save bracket');
    } finally {
      setSaving(false);
    }
  };

  const handleLockBracket = async () => {
    if (!m1 || !m2 || !m3 || !m4 || !q1 || !q2 || !champion) {
      alert('Please fill out the entire tournament tree before locking predictions.');
      return;
    }
    setSaving(true);
    try {
      await lockBracketApi();
      setIsLocked(true);
      alert('Tournament bracket predictions locked!');
    } catch (err: any) {
      alert(err.message || 'Failed to lock bracket');
    } finally {
      setSaving(false);
    }
  };

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
        <div className="flex items-center gap-1.5 mb-1 text-primary">
          <Trophy size={16} className="text-amber-500 animate-bounce" />
          <span className="font-bold text-xs uppercase tracking-widest text-amber-600">Leader Challenge</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-extrabold text-[#0b1c30] mb-2 tracking-tight">Knockout Bracket</h1>
        <p className="text-gray-600 max-w-2xl text-sm leading-relaxed">
          Predict each tier of the tournament ladder. Tap on teams to advance them to the next stage. Predict the ultimate champion for maximum points!
        </p>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
        <div className="xl:col-span-8 bg-white border border-[#bccbb9]/40 rounded-2xl p-6 relative overflow-x-auto min-w-[700px] shadow-sm">
          <div className="absolute inset-0 pitch-lines opacity-[1.5%] rounded-2xl pointer-events-none" />

          <div className="relative min-w-[650px] flex justify-between gap-4 py-8 select-none z-10">
            
            <div className="flex flex-col justify-around gap-12 w-1/4">
              <h4 className="font-extrabold text-xs text-gray-400 border-b border-gray-100 uppercase pb-1 mb-2 text-center tracking-wider">Round of 16</h4>
              
              <div className="space-y-1 bg-gray-50 p-2.5 rounded-xl border border-gray-200">
                <button 
                  onClick={() => handleSelectM1('Germany')}
                  disabled={isLocked}
                  className={`w-full py-2.5 px-3 rounded-lg font-bold text-sm text-left flex items-center justify-between transition-all cursor-pointer ${m1 === 'Germany' ? 'bg-[#006e2f] text-white shadow-sm' : 'bg-white hover:bg-gray-100 text-gray-700 disabled:opacity-50'}`}
                >
                  <span>&#x1f1e9;&#x1f1ea; Germany</span>
                  {m1 === 'Germany' && <Check size={14} />}
                </button>
                <div className="text-center font-extrabold text-[10px] text-gray-400 py-0.5">VS</div>
                <button 
                  onClick={() => handleSelectM1('Denmark')}
                  disabled={isLocked}
                  className={`w-full py-2.5 px-3 rounded-lg font-bold text-sm text-left flex items-center justify-between transition-all cursor-pointer ${m1 === 'Denmark' ? 'bg-[#006e2f] text-white shadow-sm' : 'bg-white hover:bg-gray-100 text-gray-700 disabled:opacity-50'}`}
                >
                  <span>&#x1f1e9;&#x1f1f0; Denmark</span>
                  {m1 === 'Denmark' && <Check size={14} />}
                </button>
              </div>

              <div className="space-y-1 bg-gray-50 p-2.5 rounded-xl border border-gray-200">
                <button 
                  onClick={() => handleSelectM2('Spain')}
                  disabled={isLocked}
                  className={`w-full py-2.5 px-3 rounded-lg font-bold text-sm text-left flex items-center justify-between transition-all cursor-pointer ${m2 === 'Spain' ? 'bg-[#006e2f] text-white shadow-sm' : 'bg-white hover:bg-gray-100 text-gray-700 disabled:opacity-50'}`}
                >
                  <span>&#x1f1ea;&#x1f1f8; Spain</span>
                  {m2 === 'Spain' && <Check size={14} />}
                </button>
                <div className="text-center font-extrabold text-[10px] text-gray-400 py-0.5">VS</div>
                <button 
                  onClick={() => handleSelectM2('Georgia')}
                  disabled={isLocked}
                  className={`w-full py-2.5 px-3 rounded-lg font-bold text-sm text-left flex items-center justify-between transition-all cursor-pointer ${m2 === 'Georgia' ? 'bg-[#006e2f] text-white shadow-sm' : 'bg-white hover:bg-gray-100 text-gray-700 disabled:opacity-50'}`}
                >
                  <span>&#x1f1ec;&#x1f1ea; Georgia</span>
                  {m2 === 'Georgia' && <Check size={14} />}
                </button>
              </div>

              <div className="space-y-1 bg-gray-50 p-2.5 rounded-xl border border-gray-200">
                <button 
                  onClick={() => handleSelectM3('Portugal')}
                  disabled={isLocked}
                  className={`w-full py-2.5 px-3 rounded-lg font-bold text-sm text-left flex items-center justify-between transition-all cursor-pointer ${m3 === 'Portugal' ? 'bg-[#006e2f] text-white shadow-sm' : 'bg-white hover:bg-gray-100 text-gray-700 disabled:opacity-50'}`}
                >
                  <span>&#x1f1f5;&#x1f1f9; Portugal</span>
                  {m3 === 'Portugal' && <Check size={14} />}
                </button>
                <div className="text-center font-extrabold text-[10px] text-gray-400 py-0.5">VS</div>
                <button 
                  onClick={() => handleSelectM3('Slovenia')}
                  disabled={isLocked}
                  className={`w-full py-2.5 px-3 rounded-lg font-bold text-sm text-left flex items-center justify-between transition-all cursor-pointer ${m3 === 'Slovenia' ? 'bg-[#006e2f] text-white shadow-sm' : 'bg-white hover:bg-gray-100 text-gray-700 disabled:opacity-50'}`}
                >
                  <span>&#x1f1f8;&#x1f1ee; Slovenia</span>
                  {m3 === 'Slovenia' && <Check size={14} />}
                </button>
              </div>

              <div className="space-y-1 bg-gray-50 p-2.5 rounded-xl border border-gray-200">
                <button 
                  onClick={() => handleSelectM4('France')}
                  disabled={isLocked}
                  className={`w-full py-2.5 px-3 rounded-lg font-bold text-sm text-left flex items-center justify-between transition-all cursor-pointer ${m4 === 'France' ? 'bg-[#006e2f] text-white shadow-sm' : 'bg-white hover:bg-gray-100 text-gray-700 disabled:opacity-50'}`}
                >
                  <span>&#x1f1eb;&#x1f1f7; France</span>
                  {m4 === 'France' && <Check size={14} />}
                </button>
                <div className="text-center font-extrabold text-[10px] text-gray-400 py-0.5">VS</div>
                <button 
                  onClick={() => handleSelectM4('Belgium')}
                  disabled={isLocked}
                  className={`w-full py-2.5 px-3 rounded-lg font-bold text-sm text-left flex items-center justify-between transition-all cursor-pointer ${m4 === 'Belgium' ? 'bg-[#006e2f] text-white shadow-sm' : 'bg-white hover:bg-gray-100 text-gray-700 disabled:opacity-50'}`}
                >
                  <span>&#x1f1e7;&#x1f1ea; Belgium</span>
                  {m4 === 'Belgium' && <Check size={14} />}
                </button>
              </div>
            </div>

            <div className="flex flex-col justify-around gap-16 w-1/4">
              <h4 className="font-extrabold text-xs text-gray-400 border-b border-gray-100 uppercase pb-1 mb-2 text-center tracking-wider">Quarter Finals</h4>

              <div className="space-y-2 bg-gray-50/50 p-3 rounded-xl border border-dashed border-gray-300">
                <button 
                  onClick={() => handleSelectQ1(m1)}
                  disabled={isLocked || !m1}
                  className={`w-full py-3 px-3 rounded-lg font-extrabold text-xs text-left flex items-center justify-between transition-all min-h-[44px] cursor-pointer ${q1 === m1 && m1 ? 'bg-[#22c55e] text-white shadow-sm' : 'bg-white hover:bg-gray-100 text-gray-600 disabled:opacity-50'}`}
                >
                  <span>{m1 || 'Winner M1'}</span>
                  {q1 === m1 && m1 && <Check size={14} />}
                </button>
                <div className="text-center font-extrabold text-[10px] text-gray-400">VS</div>
                <button 
                  onClick={() => handleSelectQ1(m2)}
                  disabled={isLocked || !m2}
                  className={`w-full py-3 px-3 rounded-lg font-extrabold text-xs text-left flex items-center justify-between transition-all min-h-[44px] cursor-pointer ${q1 === m2 && m2 ? 'bg-[#22c55e] text-white shadow-sm' : 'bg-white hover:bg-gray-100 text-gray-600 disabled:opacity-50'}`}
                >
                  <span>{m2 || 'Winner M2'}</span>
                  {q1 === m2 && m2 && <Check size={14} />}
                </button>
              </div>

              <div className="space-y-2 bg-gray-50/50 p-3 rounded-xl border border-dashed border-gray-300">
                <button 
                  onClick={() => handleSelectQ2(m3)}
                  disabled={isLocked || !m3}
                  className={`w-full py-3 px-3 rounded-lg font-extrabold text-xs text-left flex items-center justify-between transition-all min-h-[44px] cursor-pointer ${q2 === m3 && m3 ? 'bg-[#22c55e] text-white shadow-sm' : 'bg-white hover:bg-gray-100 text-gray-600 disabled:opacity-50'}`}
                >
                  <span>{m3 || 'Winner M3'}</span>
                  {q2 === m3 && m3 && <Check size={14} />}
                </button>
                <div className="text-center font-extrabold text-[10px] text-gray-400">VS</div>
                <button 
                  onClick={() => handleSelectQ2(m4)}
                  disabled={isLocked || !m4}
                  className={`w-full py-3 px-3 rounded-lg font-extrabold text-xs text-left flex items-center justify-between transition-all min-h-[44px] cursor-pointer ${q2 === m4 && m4 ? 'bg-[#22c55e] text-white shadow-sm' : 'bg-white hover:bg-gray-100 text-gray-600 disabled:opacity-50'}`}
                >
                  <span>{m4 || 'Winner M4'}</span>
                  {q2 === m4 && m4 && <Check size={14} />}
                </button>
              </div>
            </div>

            <div className="flex flex-col justify-around gap-20 w-1/4">
              <h4 className="font-extrabold text-xs text-gray-400 border-b border-gray-100 uppercase pb-1 mb-2 text-center tracking-wider">Semi Finals</h4>

              <div className="space-y-3 bg-[#eff4ff] p-4 rounded-2xl border-2 border-primary/20">
                <button 
                  onClick={() => handleSelectChampion(q1)}
                  disabled={isLocked || !q1}
                  className={`w-full py-3.5 px-4 rounded-xl font-black text-sm text-center flex items-center justify-center gap-2 transition-all min-h-[50px] cursor-pointer ${champion === q1 && q1 ? 'bg-primary text-white shadow-md' : 'bg-white text-primary hover:bg-green-50 disabled:opacity-50'}`}
                >
                  <span>{q1 ? `🏆 ${q1}` : 'Finalist A'}</span>
                </button>
                <div className="text-center font-bold text-xs text-blue-600">VS</div>
                <button 
                  onClick={() => handleSelectChampion(q2)}
                  disabled={isLocked || !q2}
                  className={`w-full py-3.5 px-4 rounded-xl font-black text-sm text-center flex items-center justify-center gap-2 transition-all min-h-[50px] cursor-pointer ${champion === q2 && q2 ? 'bg-primary text-white shadow-md' : 'bg-white text-primary hover:bg-green-50 disabled:opacity-50'}`}
                >
                  <span>{q2 ? `🏆 ${q2}` : 'Finalist B'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <aside className="xl:col-span-4 space-y-6">
          <div className="bg-white border border-[#bccbb9]/40 rounded-2xl p-6 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5 text-amber-500">
              <Trophy size={140} />
            </div>

            <h3 className="font-extrabold text-xl text-[#0b1c30] mb-4 flex items-center gap-2">
              <Award size={20} className="text-[#daa300]" />
              Your Champion Choice
            </h3>

            {champion ? (
              <div className="text-center py-6 bg-[#f8f9ff] rounded-xl border border-[#bccbb9]/30 mb-6">
                <div className="inline-flex p-3 bg-amber-100 rounded-full text-amber-600 mb-3 animate-bounce">
                  <Trophy size={32} />
                </div>
                <h4 className="font-black text-2xl text-[#006e2f] mb-1">{champion}</h4>
                <div className="flex items-center justify-center gap-1.5 text-gray-500 text-xs mt-2 font-semibold">
                  <Users size={14} />
                  <span>Community Consensus: 68% pick {champion}</span>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 border border-dashed border-gray-300 bg-gray-50 rounded-xl mb-6 text-gray-400 font-medium text-sm">
                No champion selected.<br />Advance teams in the bracket to crown a champion.
              </div>
            )}

            <div className="space-y-4 border-t border-gray-100 pt-5">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 font-semibold">Points at Stake</span>
                <span className="font-extrabold text-primary">+2,500 PTS</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 font-semibold">Participation Bonus</span>
                <span className="font-extrabold text-[#0051d5]">+500 PTS</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 font-semibold">Leaderboard Impact</span>
                <span className="font-extrabold text-yellow-700">Estimated +18 ranks</span>
              </div>
            </div>

            <div className="mt-8 space-y-3">
              {!isLocked && (
                <button 
                  onClick={handleSave}
                  disabled={saving}
                  className="w-full bg-zinc-800 hover:bg-zinc-700 text-white font-extrabold py-3 rounded-full text-sm transition-all cursor-pointer disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Bracket'}
                </button>
              )}
              {isLocked ? (
                <div className="w-full text-center bg-green-50 border border-green-200 text-green-700 py-3.5 rounded-full font-bold text-sm flex items-center justify-center gap-2">
                  <Check size={18} />
                  BRACKET LOCKED
                </div>
              ) : (
                <button 
                  onClick={handleLockBracket}
                  disabled={saving}
                  className="w-full bg-[#006e2f] hover:bg-green-800 text-white font-extrabold py-3.5 rounded-full shadow-md text-base transition-transform hover:scale-105 active:scale-95 cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Check size={18} />
                  LOCK BRACKET PREDICTIONS
                </button>
              )}
            </div>
          </div>

          <div className="bg-[#eff4ff] rounded-xl p-5 border border-[#bccbb9]/30 flex gap-3">
            <ShieldAlert size={20} className="text-blue-500 shrink-0 mt-0.5" />
            <div>
              <h5 className="font-bold text-sm text-[#0b1c30] mb-1">Bracket Editing Rules</h5>
              <p className="text-xs text-gray-600 leading-relaxed">
                You can rearrange your bracket predictions up until the Round of 16 kickoff. Once locked, choices are submitted down to server scoring.
              </p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
