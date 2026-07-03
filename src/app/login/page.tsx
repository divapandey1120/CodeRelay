'use client';

import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const redirectUrl = searchParams.get('redirect') || '/dashboard';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await signIn('credentials', {
        redirect: false,
        email,
        password,
        isRegister: 'false',
      });

      if (result?.error) {
        setError(result.error);
        setLoading(false);
      } else {
        router.push(redirectUrl);
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during login.');
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
              Sign in to your account
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
                  placeholder="name@company.com"
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
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-steel hover:bg-steel-light text-white font-bold py-2 px-4 rounded-lg shadow-lg hover:shadow-xl hover:translate-y-[-1px] transition-all disabled:opacity-50 disabled:pointer-events-none"
              >
                {loading ? 'Signing In...' : 'Log In'}
              </button>
            </div>
            
            <div className="text-center mt-4">
              <span className="text-sm text-slate-400">
                Don't have an account?{' '}
                <Link
                  href={`/register?redirect=${encodeURIComponent(redirectUrl)}`}
                  className="text-steel-light hover:text-white font-semibold transition-all"
                >
                  Register
                </Link>
              </span>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
