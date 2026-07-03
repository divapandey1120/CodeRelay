'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import Link from 'next/link';

export default function RegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const redirectUrl = searchParams.get('redirect') || '/dashboard';
  const roleParam = searchParams.get('role'); // e.g. CANDIDATE
  
  const isCandidateUrl = roleParam === 'CANDIDATE';

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState(isCandidateUrl ? 'CANDIDATE' : 'INTERVIEWER');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isCandidateUrl) {
      setRole('CANDIDATE');
    }
  }, [isCandidateUrl]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // We sign up using NextAuth's authorize provider by passing `isRegister: 'true'`
      const result = await signIn('credentials', {
        redirect: false,
        name,
        email,
        password,
        role,
        isRegister: 'true',
      });

      if (result?.error) {
        setError(result.error);
        setLoading(false);
      } else {
        router.push(redirectUrl);
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during registration.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 text-slate-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-slate-800 p-8 rounded-xl border border-slate-700 shadow-2xl relative overflow-hidden">
        {/* Visual background accents */}
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-steel/20 rounded-full blur-2xl pointer-events-none"></div>
        <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-teal-green/10 rounded-full blur-2xl pointer-events-none"></div>
        
        <div className="relative">
          <div className="text-center">
            <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              Code<span className="text-steel-light font-medium">Relay</span>
            </h1>
            <p className="mt-2 text-sm text-slate-400">
              {isCandidateUrl 
                ? 'Join your coding interview session' 
                : 'Create your interviewer account'}
            </p>
          </div>
          
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-900/30 border border-danger text-danger text-sm rounded-lg p-3 text-center">
                {error}
              </div>
            )}
            
            <div className="rounded-md space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  Full Name
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-steel focus:border-transparent transition-all"
                  placeholder="Jane Doe"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  Email Address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-steel focus:border-transparent transition-all"
                  placeholder="jane.doe@company.com"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-steel focus:border-transparent transition-all"
                  placeholder="••••••••"
                />
              </div>

              {!isCandidateUrl && (
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                    Your Role
                  </label>
                  <div className="grid grid-cols-2 gap-2 mt-1">
                    <button
                      type="button"
                      onClick={() => setRole('INTERVIEWER')}
                      className={`py-2 px-4 rounded-lg border text-sm font-semibold transition-all ${
                        role === 'INTERVIEWER'
                          ? 'bg-navy border-steel text-white ring-2 ring-steel/50'
                          : 'bg-slate-950 border-slate-700 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Interviewer
                    </button>
                    <button
                      type="button"
                      onClick={() => setRole('CANDIDATE')}
                      className={`py-2 px-4 rounded-lg border text-sm font-semibold transition-all ${
                        role === 'CANDIDATE'
                          ? 'bg-navy border-steel text-white ring-2 ring-steel/50'
                          : 'bg-slate-950 border-slate-700 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Candidate
                    </button>
                  </div>
                </div>
              )}

              {isCandidateUrl && (
                <div className="bg-navy/30 border border-steel/30 rounded-lg p-3">
                  <p className="text-xs text-slate-400">
                    Registering as: <span className="text-steel-light font-bold">Candidate</span>
                  </p>
                </div>
              )}
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-steel hover:bg-steel-light text-white font-bold py-2 px-4 rounded-lg shadow-lg hover:shadow-xl hover:translate-y-[-1px] transition-all disabled:opacity-50 disabled:pointer-events-none"
              >
                {loading ? 'Creating Account...' : 'Sign Up'}
              </button>
            </div>
            
            <div className="text-center mt-4">
              <span className="text-sm text-slate-400">
                Already have an account?{' '}
                <Link
                  href={`/login?redirect=${encodeURIComponent(redirectUrl)}`}
                  className="text-steel-light hover:text-white font-semibold transition-all"
                >
                  Log In
                </Link>
              </span>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
