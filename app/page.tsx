'use client';

import { useEffect, useState } from 'react';
import { User } from 'firebase/auth';
import { initAuth, googleSignIn, logout, signInWithEmail, signUpWithEmail } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import Dashboard from '@/components/Dashboard';

export default function App() {
  const [needsAuth, setNeedsAuth] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);

  // Email login states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const unsubscribe = initAuth(
      (user, token) => {
        setUser(user);
        setNeedsAuth(false);
        setIsInitializing(false);
      },
      () => {
        setUser(null);
        setNeedsAuth(true);
        setIsInitializing(false);
      }
    );
    return () => unsubscribe();
  }, []);

  const handleGoogleLogin = async () => {
    setErrorMsg('');
    setIsLoggingIn(true);
    try {
      const result = await googleSignIn();
      if (result) {
        setUser(result.user);
        setNeedsAuth(false);
      }
    } catch (err: any) {
      console.error('Google login failed:', err);
      setErrorMsg(err.message || 'Google sign-in failed');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsLoggingIn(true);
    try {
      if (authMode === 'signin') {
        const loggedInUser = await signInWithEmail(email, password);
        setUser(loggedInUser);
        setNeedsAuth(false);
      } else {
        if (!displayName.trim()) {
          throw new Error('Please enter your name.');
        }
        const registeredUser = await signUpWithEmail(email, password, displayName);
        setUser(registeredUser);
        setNeedsAuth(false);
      }
    } catch (err: any) {
      console.error('Email auth failed:', err);
      let msg = err.message || 'Authentication failed.';
      if (msg.includes('auth/invalid-credential') || msg.includes('auth/user-not-found') || msg.includes('auth/wrong-password')) {
        msg = 'Invalid email or password.';
      } else if (msg.includes('auth/email-already-in-use')) {
        msg = 'An account with this email already exists.';
      } else if (msg.includes('auth/weak-password')) {
        msg = 'Password should be at least 6 characters.';
      } else if (msg.includes('auth/invalid-email')) {
        msg = 'Please enter a valid email address.';
      }
      setErrorMsg(msg);
    } finally {
      setIsLoggingIn(false);
    }
  };

  if (isInitializing) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[#0A0A0B]">
        <Loader2 className="w-8 h-8 animate-spin text-slate-500" />
      </div>
    );
  }

  if (needsAuth) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-[#0A0A0B] p-4 font-sans selection:bg-emerald-500/30">
        <div className="w-full max-w-[440px] bg-[#121214] border border-white/5 rounded-2xl p-8 shadow-2xl flex flex-col relative overflow-hidden">
          {/* Subtle gradient effect */}
          <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
          
          <div className="flex flex-col items-center mb-8">
            <div className="w-12 h-12 bg-white/5 rounded-xl border border-white/5 flex items-center justify-center mb-5">
              <span className="text-xl font-bold text-emerald-500">$</span>
            </div>
            <h1 className="text-2xl font-light text-white tracking-tight mb-1">
              LoanPro <span className="text-emerald-500 font-medium">DSA</span>
            </h1>
            <p className="text-slate-400 text-sm">Your intelligent loan management workspace</p>
          </div>

          {errorMsg && (
            <div className="w-full p-3 mb-6 text-xs bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-center">
              {errorMsg}
            </div>
          )}

          <div className="flex bg-white/5 p-1 rounded-lg mb-6 border border-white/5">
            <button
              onClick={() => { setAuthMode('signin'); setErrorMsg(''); }}
              className={`flex-1 text-sm font-medium py-2 rounded-md transition-colors ${authMode === 'signin' ? 'bg-[#121214] text-white shadow-sm border border-white/5' : 'text-slate-400 hover:text-slate-200'}`}
            >
              Sign In
            </button>
            <button
              onClick={() => { setAuthMode('signup'); setErrorMsg(''); }}
              className={`flex-1 text-sm font-medium py-2 rounded-md transition-colors ${authMode === 'signup' ? 'bg-[#121214] text-white shadow-sm border border-white/5' : 'text-slate-400 hover:text-slate-200'}`}
            >
              Create Account
            </button>
          </div>

          <form onSubmit={handleEmailAuth} className="w-full space-y-4 mb-6">
            {authMode === 'signup' && (
              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-grotesk">Full Name</Label>
                <Input 
                  type="text" 
                  value={displayName} 
                  onChange={e => setDisplayName(e.target.value)} 
                  required
                  placeholder="John Doe"
                  className="bg-black/20 border-white/10 text-slate-200 focus:border-emerald-500/50 focus:ring-emerald-500/20 h-10 transition-colors"
                />
              </div>
            )}

            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-grotesk">Email Address</Label>
              <Input 
                type="email" 
                value={email} 
                onChange={e => setEmail(e.target.value)} 
                required
                placeholder="name@example.com"
                className="bg-black/20 border-white/10 text-slate-200 focus:border-emerald-500/50 focus:ring-emerald-500/20 h-10 transition-colors"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-grotesk">Password</Label>
                {authMode === 'signin' && (
                  <button type="button" className="text-xs text-emerald-500 hover:text-emerald-400 font-medium transition-colors">
                    Forgot password?
                  </button>
                )}
              </div>
              <Input 
                type="password" 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                required
                placeholder="••••••••"
                className="bg-black/20 border-white/10 text-slate-200 focus:border-emerald-500/50 focus:ring-emerald-500/20 h-10 transition-colors"
              />
            </div>

            <Button 
              type="submit" 
              disabled={isLoggingIn}
              className="w-full bg-emerald-500 text-white hover:bg-emerald-600 h-10 font-medium transition-colors border-none mt-2"
            >
              {isLoggingIn ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : (
                authMode === 'signin' ? 'Sign In' : 'Create Account'
              )}
            </Button>
          </form>

          <div className="w-full flex items-center my-6 gap-3">
            <div className="h-px bg-white/5 flex-1"></div>
            <span className="text-[10px] text-slate-500 uppercase font-bold tracking-widest font-grotesk">or</span>
            <div className="h-px bg-white/5 flex-1"></div>
          </div>

          <Button 
            type="button"
            onClick={handleGoogleLogin} 
            disabled={isLoggingIn}
            className="w-full bg-transparent border border-white/10 text-slate-300 hover:bg-white/5 h-10 font-medium"
          >
            {isLoggingIn ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : (
              <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                <path fill="none" d="M0 0h48v48H0z" />
              </svg>
            )}
            Continue with Google
          </Button>
        </div>
      </div>
    );
  }

  return <Dashboard user={user} onLogout={logout} />;
}
