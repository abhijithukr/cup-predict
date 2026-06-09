import React, { useState, useEffect } from 'react';
import { 
  Tv, Calendar, Trophy, User, LogOut, Award, Bell, Menu, X, 
  ChevronRight, ClipboardList, Shield, Flame
} from 'lucide-react';
import { ViewType, UserProfile, MatchPrediction } from './types';
import { INITIAL_USER, INITIAL_PREDICTIONS, PAST_PREDICTIONS, LEADERBOARD_DATA } from './initialData';

// Sub-views
import LoginView from './components/LoginView';
import DashboardView from './components/DashboardView';
import PredictionsView from './components/PredictionsView';
import KnockoutsView from './components/KnockoutsView';
import LeaderboardView from './components/LeaderboardView';
import ProfileView from './components/ProfileView';

export default function App() {
  // Authentication states
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<UserProfile>(INITIAL_USER);

  // Active view router
  const [activeView, setActiveView] = useState<ViewType>('DASHBOARD');

  // Sidebar toggler for medium screens
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Synced predictions
  const [pastPredictions, setPastPredictions] = useState<MatchPrediction[]>([]);

  // Persistent storage loaders
  useEffect(() => {
    const authUser = localStorage.getItem('user_authenticated');
    if (authUser) {
      setIsAuthenticated(true);
      const storedPoints = localStorage.getItem('user_points');
      if (storedPoints) {
        setUser(prev => ({ ...prev, points: parseInt(storedPoints) }));
      }
    }

    const storedPast = localStorage.getItem('past_predictions');
    if (storedPast) {
      setPastPredictions(JSON.parse(storedPast));
    } else {
      setPastPredictions(PAST_PREDICTIONS);
      localStorage.setItem('past_predictions', JSON.stringify(PAST_PREDICTIONS));
    }
  }, []);

  const handleLogin = (username: string) => {
    localStorage.setItem('user_authenticated', username);
    localStorage.setItem('user_points', INITIAL_USER.points.toString());
    setUser({ ...INITIAL_USER, username });
    setIsAuthenticated(true);
    setActiveView('DASHBOARD');
  };

  const handleLogout = () => {
    localStorage.removeItem('user_authenticated');
    setIsAuthenticated(false);
  };

  const handleUpdatePoints = (pts: number) => {
    setUser(prev => {
      const nextPoints = prev.points + pts;
      localStorage.setItem('user_points', nextPoints.toString());
      return { ...prev, points: nextPoints };
    });
  };

  const handleAddPastPredictions = (preds: MatchPrediction[]) => {
    setPastPredictions(prev => {
      const updated = [...preds, ...prev];
      localStorage.setItem('past_predictions', JSON.stringify(updated));
      return updated;
    });
  };

  // Nav mapping list helper
  const NAV_ITEMS = [
    { id: 'DASHBOARD', label: 'Welcome Hub', icon: Tv },
    { id: 'PREDICTIONS', label: 'Group Predictions', icon: Calendar },
    { id: 'KNOCKOUTS', label: 'Knockout Bracket', icon: Trophy },
    { id: 'LEADERBOARD', label: 'Leaderboard', icon: Award },
    { id: 'PROFILE', label: 'My profile', icon: User },
  ];

  // If not logged in, render stadium login screen!
  if (!isAuthenticated) {
    return <LoginView onLoginSuccess={handleLogin} />;
  }

  return (
    <div className="relative min-h-screen bg-background font-sans text-zinc-400 overflow-x-hidden">
      
      {/* 1. Mobile Top Bar Header */}
      <header className="lg:hidden flex items-center justify-between px-6 py-4 bg-zinc-950 border-b border-zinc-500/15 fixed top-0 left-0 right-0 z-40 shadow-sm">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="text-zinc-500 hover:text-zinc-400 p-1"
          >
            {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <span className="font-black text-xl text-zinc-400 tracking-tighter uppercase select-none">CUP PREDICT&trade;</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="bg-zinc-900 text-zinc-300 font-black text-[10px] uppercase tracking-widest px-2.5 py-1 border border-zinc-500/15">
            {user.points.toLocaleString()} PTS
          </span>
          <div className="w-8 h-8 overflow-hidden border border-zinc-500/15">
            <img className="w-full h-full object-cover" src={user.avatarUrl} alt="user avatar" />
          </div>
        </div>
      </header>

      {/* 2. Left Desktop Side Drawer Column */}
      <aside className={`fixed top-0 bottom-0 left-0 z-50 lg:z-30 w-72 bg-zinc-950 border-r border-zinc-500/15 flex flex-col justify-between p-8 transition-transform duration-300 transform lg:translate-x-0 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        
        {/* Upper Brand / Logo */}
        <div className="space-y-12">
          <div className="flex items-center justify-between">
            <h1 className="font-black text-2xl text-zinc-400 tracking-tighter uppercase">CUP PREDICT&trade;</h1>
            <button className="lg:hidden p-1 text-zinc-500 hover:text-zinc-400" onClick={() => setIsMobileMenuOpen(false)}>
              <X size={20} />
            </button>
          </div>

          {/* Nav Items */}
          <nav className="space-y-1">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = activeView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveView(item.id as ViewType);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full py-3.5 px-4 font-black text-[11px] uppercase tracking-[0.2em] text-left flex items-center gap-3 transition-all cursor-pointer duration-200 border-b border-zinc-805/10 ${isActive ? 'bg-zinc-900 text-zinc-300 border-l-2 border-zinc-400' : 'text-zinc-500 hover:bg-zinc-900 hover:text-zinc-400'}`}
                >
                  <Icon size={14} className={isActive ? 'text-zinc-300' : 'text-zinc-500'} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Lower Student Identity block */}
        <div className="space-y-6">
          <div className="bg-zinc-900 border border-zinc-500/10 p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 overflow-hidden border border-zinc-500/10 shadow-lg">
                <img className="w-full h-full object-cover" src={user.avatarUrl} alt="user avatar" />
              </div>
              <div>
                <p className="font-black text-xs uppercase tracking-wider text-zinc-300">{user.fullName}</p>
                <div className="flex items-center gap-1 text-[10px] text-amber-800 font-extrabold tracking-widest uppercase">
                  <Flame size={10} fill="currentColor" />
                  <span>Rank #{user.rank}</span>
                </div>
              </div>
            </div>
          </div>

          <button 
            onClick={handleLogout}
            className="w-full py-3 px-4 text-[10px] uppercase tracking-widest font-bold text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300 border border-zinc-500/10 transition-colors cursor-pointer flex items-center justify-center gap-2"
          >
            <LogOut size={12} />
            Sign out
          </button>
        </div>
      </aside>

      {/* Main Content Workspace viewport */}
      <div className="lg:pl-72 pt-16 lg:pt-0">
        
        {/* Upper TopBar Header dashboard status (Desktop only) */}
        <header className="hidden lg:flex items-center justify-between px-10 py-6 bg-zinc-950 border-b border-zinc-500/10 z-20">
          <div className="flex items-center gap-2 text-[10px] font-bold text-zinc-500 tracking-widest uppercase">
            <span>WESTFIELD UNIVERSITY</span>
            <ChevronRight size={12} className="text-zinc-650" />
            <span className="text-zinc-350 font-black">{activeView}</span>
          </div>

          {/* Quick Metrics & Notification Icon */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-6 text-xs font-bold uppercase tracking-wider">
              <div className="text-right">
                <p className="text-zinc-500 text-[9px] font-extrabold tracking-widest uppercase">Balance</p>
                <p className="text-zinc-300 font-black text-sm">{user.points.toLocaleString()} PTS</p>
              </div>
              <div className="h-6 w-[1px] bg-zinc-800/10" />
              <div className="text-right">
                <p className="text-zinc-500 text-[9px] font-extrabold tracking-widest uppercase">Streak</p>
                <p className="text-[#4b3d2e] font-black text-sm">{user.winStreak} STREAK</p>
              </div>
            </div>

            {/* Quick alert bar indicator */}
            <div className="relative group">
              <button className="bg-zinc-900 hover:bg-zinc-800 p-2 text-zinc-500 hover:text-zinc-300 transition-colors relative cursor-pointer border border-zinc-500/10">
                <Bell size={16} />
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-600 animate-pulse" />
              </button>
              {/* Notification hover menu dropdown */}
              <div className="absolute right-0 top-11 bg-zinc-950 border border-zinc-500/10 w-80 shadow-2xl p-4 invisible group-hover:visible transition-all duration-150 z-50">
                <h4 className="font-black text-xs text-zinc-400 uppercase tracking-widest mb-3 pb-1.5 border-b border-zinc-500/10">CAMPUS ALERTS</h4>
                <div className="space-y-3 font-medium text-xs text-zinc-500">
                  <div className="flex gap-2.5 items-start">
                    <span className="w-2 h-2 bg-red-600 mt-1 shrink-0" />
                    <div>
                      <p className="font-bold text-zinc-300">Germany vs Denmark kicks off soon</p>
                      <p className="text-[10px] text-zinc-500">Lock predictors before cutoff time!</p>
                    </div>
                  </div>
                  <div className="flex gap-2.5 items-start">
                    <span className="w-2 h-2 bg-red-600 mt-1 shrink-0" />
                    <div>
                      <p className="font-bold text-zinc-300">Live Campus Tournament Active</p>
                      <p className="text-[10px] text-zinc-500">Earn +100 bonus prediction points today.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Dynamic viewport renderer based on active navigation component */}
        <main className="p-6 md:p-10 max-w-7xl mx-auto min-h-[calc(100vh-80px)] pb-24 lg:pb-12">
          {activeView === 'DASHBOARD' && (
            <DashboardView 
              user={user} 
              onNavigate={(view) => setActiveView(view as ViewType)}
              onUpdatePoints={handleUpdatePoints}
            />
          )}

          {activeView === 'PREDICTIONS' && (
            <PredictionsView 
              initialFixtures={INITIAL_PREDICTIONS}
              onUpdatePoints={handleUpdatePoints}
              onAddPastPredictions={handleAddPastPredictions}
            />
          )}

          {activeView === 'KNOCKOUTS' && (
            <KnockoutsView 
              onUpdatePoints={handleUpdatePoints}
            />
          )}

          {activeView === 'LEADERBOARD' && (
            <LeaderboardView 
              leaderboardData={LEADERBOARD_DATA}
              currentUserRank={user.rank}
              currentUserPoints={user.points}
            />
          )}

          {activeView === 'PROFILE' && (
            <ProfileView 
              user={user}
              pastPredictions={pastPredictions}
            />
          )}
        </main>
      </div>

      {/* 4. Mobile Bottom Nav Sticky controls bar */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-zinc-950 border-t border-zinc-500/10 px-2 py-1.5 z-40 flex justify-around shadow-2xl">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id as ViewType)}
              className={`flex flex-col items-center gap-1 py-1 px-3.5 transition-all cursor-pointer ${isActive ? 'text-zinc-300' : 'text-zinc-500 font-bold'}`}
              style={{ minWidth: '44px', minHeight: '44px' }}
            >
              <Icon size={16} />
              <span className="text-[9px] tracking-widest uppercase font-black">{item.label.split(' ')[0]}</span>
            </button>
          );
        })}
      </nav>

    </div>
  );
}
