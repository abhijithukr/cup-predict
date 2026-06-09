import React, { useState, useEffect } from 'react';
import { User, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';

interface LoginViewProps {
  onLoginSuccess: (username: string) => void;
}

export default function LoginView({ onLoginSuccess }: LoginViewProps) {
  const [username, setUsername] = useState('alex_rivera');
  const [password, setPassword] = useState('password123');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [mousePos, setMousePos] = useState({ x: 50, y: 50 });

  // Mouse move lightweight atmosphere effect
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth) * 100;
      const y = (e.clientY / window.innerHeight) * 100;
      setMousePos({ x, y });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError('Please fill in all fields.');
      return;
    }
    setError('');
    onLoginSuccess(username);
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center font-sans overflow-hidden bg-background select-none">
      {/* Background Layer */}
      <div className="absolute inset-0 z-0 opacity-40">
        <img 
          className="w-full h-full object-cover filter grayscale contrast-125" 
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuA1Vkyx7hSbrv8K022rIcSaJu_tpnJb3LffAYvldgFgqB-relvdyKBOO_dPi7UkG0a-GM0dRIk6aBen_5-TWZtgxzVLc4XqGCkQ0fcLpU6zAwtzP2E77-Si-cUdgKC25iaDRaNnOJ9ocnl81czhvR-gvY3lcRkGPD62dz-BFHpTVWsSlU1snu7IJy6U8Ru2OXPQJHA2HqmhFa8jnQ9k_xgfpfCL3gfrdkl4uqz2FEg7_AzoNnoA2A5CQuaSGV-RCdJx5LXHHyoSd4Sx"
          alt="Stadium lights background"
        />
        {/* Stadium Interactive Gradient Overlay */}
        <div 
          className="absolute inset-0 z-10 transition-all duration-300 pointer-events-none"
          style={{
            background: `radial-gradient(circle at ${mousePos.x}% ${mousePos.y}%, rgba(244, 227, 208, 0.45), rgba(250, 246, 240, 0.95))`
          }}
        />
        <div className="absolute inset-0 pitch-lines z-20" />
      </div>

      {/* Login Container */}
      <main className="relative z-30 w-full max-w-md px-4">
        <div className="bg-zinc-950 backdrop-blur-md rounded-none p-8 md:p-12 border border-zinc-500/10 shadow-2xl">
          {/* Branding */}
          <div className="text-center mb-10">
            <h1 className="font-black text-5xl text-zinc-400 tracking-tighter mb-2 uppercase select-none">CUP PREDICT&trade;</h1>
            <p className="text-xs font-bold text-zinc-500 uppercase tracking-[0.25em]">Collegiate Prediction Arena</p>
          </div>

          {/* Form */}
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div id="login-error" className="p-3 bg-red-150 text-red-800 text-xs font-semibold uppercase tracking-wider rounded-none border border-red-200">
                {error}
              </div>
            )}

            {/* Username */}
            <div className="space-y-2">
              <label className="font-bold text-[10px] uppercase tracking-widest text-zinc-500 block px-1" htmlFor="username">Username</label>
              <div className="relative group">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-zinc-650 transition-colors">
                  <User size={16} />
                </span>
                <input 
                  className="w-full pl-12 pr-4 py-3.5 bg-zinc-900 border border-zinc-500/10 rounded-none font-medium text-sm outline-none focus:border-zinc-400 transition-all placeholder:text-zinc-500 text-zinc-300 tracking-wide"
                  id="username" 
                  name="username" 
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Student ID or username" 
                  type="text"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <div className="flex justify-between items-center px-1">
                <label className="font-bold text-[10px] uppercase tracking-widest text-zinc-500" htmlFor="password">Password</label>
                <a 
                  className="font-bold text-[9px] uppercase tracking-widest text-zinc-500 hover:text-zinc-300 transition-colors" 
                  href="#"
                  onClick={(e) => e.preventDefault()}
                >
                  Forgot?
                </a>
              </div>
              <div className="relative group">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-zinc-650 transition-colors">
                  <Lock size={16} />
                </span>
                <input 
                  className="w-full pl-12 pr-12 py-3.5 bg-zinc-900 border border-zinc-500/10 rounded-none font-medium text-sm outline-none focus:border-zinc-400 transition-all placeholder:text-zinc-500 text-zinc-300 tracking-wide"
                  id="password" 
                  name="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••" 
                  type={showPassword ? "text" : "password"}
                />
                <button 
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors" 
                  onClick={() => setShowPassword(!showPassword)}
                  type="button"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* CTA */}
            <div className="pt-2">
              <button 
                className="w-full bg-zinc-300 text-zinc-900 font-black text-xs uppercase tracking-[0.2em] py-4 rounded-none hover:bg-zinc-600 transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer" 
                type="submit"
              >
                Login
                <ArrowRight size={14} />
              </button>
            </div>
          </form>

          {/* Footer Links */}
          <div className="mt-8 text-center">
            <p className="text-xs text-zinc-500 uppercase tracking-wider">
              No account?{' '}
              <a 
                className="text-zinc-350 font-black hover:underline decoration-1 underline-offset-4" 
                href="#"
                onClick={(e) => { e.preventDefault(); onLoginSuccess(username); }}
              >
                Join League
              </a>
            </p>
          </div>
        </div>

        {/* Active counter tag */}
        <div className="mt-6 flex justify-center">
          <div className="bg-zinc-950 backdrop-blur-sm px-5 py-2.5 rounded-none border border-zinc-500/10 flex items-center gap-2.5 shadow-xl">
            <span className="w-1.5 h-1.5 bg-amber-600 rounded-full animate-pulse"></span>
            <span className="font-bold text-[9px] uppercase tracking-widest text-zinc-500">1,240 STUDENTS ACTIVE</span>
          </div>
        </div>
      </main>
    </div>
  );
}
