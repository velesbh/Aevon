"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { hasSupabaseEnv, supabase } from '@/lib/supabase';
import { Loader2, ArrowLeft } from 'lucide-react';
import { useLanguage } from '@/lib/i18n';
import Link from 'next/link';
import type { AuthError } from '@supabase/supabase-js';

export default function LoginPage() {
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (!supabase) {
      return;
    }

    // Only redirect if getUser() confirms the user is valid on the server
    void supabase.auth.getUser().then(({ data, error }) => {
      if (data.user && !error) {
        router.replace('/dashboard');
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        router.replace('/dashboard');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (!supabase || !hasSupabaseEnv) {
        throw new Error('Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and a public Supabase browser key.');
      }

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      router.replace('/dashboard');
    } catch (err) {
      const message =
        err && typeof err === 'object' && 'message' in err
          ? String((err as AuthError).message)
          : 'An error occurred during authentication.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md relative">
        <Link href="/" className="absolute -top-12 left-0 sm:left-auto flex items-center text-sm text-neutral-500 hover:text-brand-600 transition-colors">
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back
        </Link>
        <div className="flex justify-center mb-6">
          <Image
            src="/aevon.png"
            alt="Aevon"
            width={64}
            height={64}
            className="h-16 w-auto object-contain dark:brightness-110"
            priority
          />
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-neutral-900 dark:text-white">
          {t('login.title')}
        </h2>
        <p className="mt-2 text-center text-sm text-neutral-600 dark:text-neutral-400">
          {t('login.subtitle')}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white dark:bg-neutral-900 py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-neutral-200 dark:border-neutral-800">
          <form className="space-y-6" onSubmit={handleLogin}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                {t('login.email')}
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-neutral-300 dark:border-neutral-700 rounded-md shadow-sm placeholder-neutral-400 focus:outline-none focus:ring-brand-500 focus:border-brand-500 sm:text-sm bg-white dark:bg-neutral-950 text-neutral-900 dark:text-white transition-colors"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                {t('login.password')}
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-neutral-300 dark:border-neutral-700 rounded-md shadow-sm placeholder-neutral-400 focus:outline-none focus:ring-brand-500 focus:border-brand-500 sm:text-sm bg-white dark:bg-neutral-950 text-neutral-900 dark:text-white transition-colors"
                />
              </div>
            </div>

            {error && (
              <div className="text-red-500 text-sm mt-2">
                {error}
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 disabled:opacity-50 transition-colors"
              >
                {loading ? (
                  <Loader2 className="animate-spin h-5 w-5" />
                ) : (
                  t('login.submit')
                )}
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-neutral-300 dark:border-neutral-700" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white dark:bg-neutral-900 text-neutral-500">
                  {t('login.footer')}
                </span>
              </div>
            </div>

            <div className="mt-6 text-center">
              <Link
                href="/onboarding"
                className="text-brand-600 hover:text-brand-500 font-medium text-sm transition-colors"
              >
                {t('login.footerLink')}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
