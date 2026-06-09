import React, { useState, useEffect } from 'react';
import { User, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { login, register } from '../api';

interface LoginViewProps {
  onLoginSuccess: (user: any, token: string) => void;
}

export default function LoginView({ onLoginSuccess }: LoginViewProps) {
  const [mode, setMode] = useState<'LOGIN' | 'REGISTER'>('LOGIN');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [semester, setSemester] = useState('');
  const [department, setDepartment] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 50, y: 50 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth) * 100;
      const y = (e.clientY / window.innerHeight) * 100;
      setMousePos({ x, y });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (mode === 'REGISTER') {
      if (!username.trim() || !password.trim() || !fullName.trim() || !email.trim() || !semester.trim() || !department.trim()) {
        setError('Please fill in all fields.');
        return;
      }
    } else {
      if (!username.trim() || !password.trim()) {
        setError('Please fill in all fields.');
        return;
      }
    }

    setSubmitting(true);
    try {
      if (mode === 'LOGIN') {
        const data = await login(username, password);
        onLoginSuccess(data.user, data.token);
      } else {
        const data = await register({ username, fullName, email, password, semester, department });
        onLoginSuccess(data.user, data.token);
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center font-sans overflow-hidden bg-background select-none">
      <div className="absolute inset-0 z-0 opacity-40">
        <img 
          className="w-full h-full object-cover filter grayscale contrast-125" 
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuA1Vkyx7hSbrv8K022rIcSaJu_tpnJb3LffAYvldgFgqB-relvdyKBOO_dPi7UkG0a-GM0dRIk6aBen_5-TWZtgxzVLc4XqGCkQ0fcLpU6zAwtzP2E77-Si-cUdgKC25iaDRaNnOJ9ocnl81czhvR-gvY3lcRkGPD62dz-BFHpTVWsSlU1snu7IJy6U8Ru2OXPQJHA2HqmhFa8jnQ9k_xgfpfCL3gfrdkl4uqz2FEg7_AzoNnoA2A5CQuaSGV-RCdJx5LXHHyoSd4Sx"
          alt="Stadium lights background"
        />
        <div 
          className="absolute inset-0 z-10 transition-all duration-300 pointer-events-none"
          style={{
            background: `radial-gradient(circle at ${mousePos.x}% ${mousePos.y}%, rgba(244, 227, 208, 0.45), rgba(250, 246, 240, 0.95))`
          }}
        />
        <div className="absolute inset-0 pitch-lines z-20" />
      </div>

      <main className="relative z-30 w-full max-w-md px-4">
        <div className="bg-zinc-950 backdrop-blur-md rounded-none p-8 md:p-12 border border-zinc-500/10 shadow-2xl">
          <div className="text-center mb-10">
            <h1 className="font-black text-5xl text-zinc-400 tracking-tighter mb-2 uppercase select-none">CUP PREDICT&trade;</h1>
            <p className="text-xs font-bold text-zinc-500 uppercase tracking-[0.25em]">
              {mode === 'LOGIN' ? 'Collegiate Prediction Arena' : 'Join the League'}
            </p>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div id="login-error" className="p-3 bg-red-150 text-red-800 text-xs font-semibold uppercase tracking-wider rounded-none border border-red-200">
                {error}
              </div>
            )}

            {mode === 'REGISTER' && (
              <>
                <div className="space-y-2">
                  <label className="font-bold text-[10px] uppercase tracking-widest text-zinc-500 block px-1" htmlFor="fullName">Full Name</label>
                  <input 
                    className="w-full px-4 py-3.5 bg-zinc-900 border border-zinc-500/10 rounded-none font-medium text-sm outline-none focus:border-zinc-400 transition-all placeholder:text-zinc-500 text-zinc-300 tracking-wide"
                    id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)}
                    placeholder="John Doe" type="text"
                  />
                </div>
                <div className="space-y-2">
                  <label className="font-bold text-[10px] uppercase tracking-widest text-zinc-500 block px-1" htmlFor="email">Email</label>
                  <input 
                    className="w-full px-4 py-3.5 bg-zinc-900 border border-zinc-500/10 rounded-none font-medium text-sm outline-none focus:border-zinc-400 transition-all placeholder:text-zinc-500 text-zinc-300 tracking-wide"
                    id="email" value={email} onChange={(e) => setEmail(e.target.value)}
                    placeholder="john@university.edu" type="email"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="font-bold text-[10px] uppercase tracking-widest text-zinc-500 block px-1" htmlFor="semester">Semester</label>
                    <input 
                      className="w-full px-4 py-3.5 bg-zinc-900 border border-zinc-500/10 rounded-none font-medium text-sm outline-none focus:border-zinc-400 transition-all placeholder:text-zinc-500 text-zinc-300 tracking-wide"
                      id="semester" value={semester} onChange={(e) => setSemester(e.target.value)}
                      placeholder="e.g. 3" type="text"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="font-bold text-[10px] uppercase tracking-widest text-zinc-500 block px-1" htmlFor="department">Department</label>
                    <input 
                      className="w-full px-4 py-3.5 bg-zinc-900 border border-zinc-500/10 rounded-none font-medium text-sm outline-none focus:border-zinc-400 transition-all placeholder:text-zinc-500 text-zinc-300 tracking-wide"
                      id="department" value={department} onChange={(e) => setDepartment(e.target.value)}
                      placeholder="Computer Science" type="text"
                    />
                  </div>
                </div>
              </>
            )}

            <div className="space-y-2">
              <label className="font-bold text-[10px] uppercase tracking-widest text-zinc-500 block px-1" htmlFor="username">Username</label>
              <div className="relative group">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-zinc-650 transition-colors">
                  <User size={16} />
                </span>
                <input 
                  className="w-full pl-12 pr-4 py-3.5 bg-zinc-900 border border-zinc-500/10 rounded-none font-medium text-sm outline-none focus:border-zinc-400 transition-all placeholder:text-zinc-500 text-zinc-300 tracking-wide"
                  id="username" value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Student ID or username" type="text"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center px-1">
                <label className="font-bold text-[10px] uppercase tracking-widest text-zinc-500" htmlFor="password">Password</label>
              </div>
              <div className="relative group">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-zinc-650 transition-colors">
                  <Lock size={16} />
                </span>
                <input 
                  className="w-full pl-12 pr-12 py-3.5 bg-zinc-900 border border-zinc-500/10 rounded-none font-medium text-sm outline-none focus:border-zinc-400 transition-all placeholder:text-zinc-500 text-zinc-300 tracking-wide"
                  id="password" value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••" type={showPassword ? "text" : "password"}
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

            <div className="pt-2">
              <button 
                className="w-full bg-zinc-300 text-zinc-900 font-black text-xs uppercase tracking-[0.2em] py-4 rounded-none hover:bg-zinc-600 transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50" 
                type="submit"
                disabled={submitting}
              >
                {submitting ? 'Please wait...' : mode === 'LOGIN' ? 'Login' : 'Create Account'}
                <ArrowRight size={14} />
              </button>
            </div>
          </form>

          <div className="mt-8 text-center">
            <p className="text-xs text-zinc-500 uppercase tracking-wider">
              {mode === 'LOGIN' ? (
                <>No account?{' '}
                  <button className="text-zinc-350 font-black hover:underline decoration-1 underline-offset-4 bg-transparent border-none cursor-pointer" onClick={() => { setMode('REGISTER'); setError(''); }}>
                    Join League
                  </button>
                </>
              ) : (
                <>Already registered?{' '}
                  <button className="text-zinc-350 font-black hover:underline decoration-1 underline-offset-4 bg-transparent border-none cursor-pointer" onClick={() => { setMode('LOGIN'); setError(''); }}>
                    Sign In
                  </button>
                </>
              )}
            </p>
          </div>
        </div>

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
