"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/lib/i18n';
import { Github, Monitor, Smartphone } from 'lucide-react';

export default function Home() {
  const router = useRouter();
  const { t } = useLanguage();
  const [isTauri, setIsTauri] = useState<boolean | null>(null);

  useEffect(() => {
    // Check if running in Tauri environment
    const tauriEnv = typeof window !== 'undefined' && 
                    ('__TAURI_INTERNALS__' in window || '__TAURI__' in window);
    
    setIsTauri(tauriEnv);
    
    if (tauriEnv) {
      router.replace('/dashboard');
    }
  }, [router]);

  // Return a blank layout or a loading state while we check the environment
  if (isTauri === null || isTauri === true) {
    return <div className="min-h-screen bg-[var(--background-app)] flex items-center justify-center"></div>;
  }

  return (
    <div className="flex flex-col items-center w-full min-h-screen bg-[var(--background-app)]">
      {/* Hero Section */}
      <section className="w-full max-w-6xl mx-auto px-4 pt-40 pb-24 flex flex-col items-center text-center">
        <div className="inline-flex items-center rounded-full px-4 py-1.5 text-sm font-medium bg-brand-500/10 text-brand-500 ring-1 ring-inset ring-brand-500/20 mb-10">
          {t("landing.hero.badge")}
        </div>
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8 max-w-4xl text-foreground">
          {t("landing.hero.title")}
        </h1>
        <p className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-3xl">
          {t("landing.hero.desc")}
        </p>
        <div className="flex flex-wrap items-center justify-center gap-6">
          <Button size="lg" asChild className="rounded-full px-8 h-14 text-lg bg-brand-600 hover:bg-brand-500 text-white shadow-lg shadow-brand-500/25">
            <Link href="/login">{t("landing.hero.startBuilding")}</Link>
          </Button>
          <Button size="lg" variant="outline" asChild className="rounded-full px-8 h-14 text-lg border-2">
            <Link href="https://github.com/enzonic-llc/Aevon" target="_blank">
              <Github className="mr-2 h-5 w-5" />
              GitHub
            </Link>
          </Button>
        </div>
      </section>

      {/* Downloads Section */}
      <section id="downloads" className="w-full max-w-6xl mx-auto px-4 py-24 flex flex-col items-center border-t border-border/50">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4 text-foreground">Download Aevon</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Get the native app for the best offline experience.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl">
          {/* Desktop */}
          <div className="flex flex-col items-center p-10 bg-card rounded-3xl border border-border shadow-md text-center transition-transform hover:-translate-y-1 duration-300">
            <div className="h-20 w-20 bg-brand-500/10 rounded-2xl flex items-center justify-center text-brand-500 mb-8 rotate-3">
              <Monitor className="h-10 w-10 -rotate-3" />
            </div>
            <h3 className="text-3xl font-semibold mb-4">Desktop</h3>
            <p className="text-muted-foreground mb-10 text-lg flex-1">
              Experience the full power of Aevon on your desktop. Perfect for focused, distraction-free writing.
            </p>
            <Button className="w-full rounded-full h-12 text-md" asChild>
              <a href="https://apps.enzonic.com/app/fXyEGedm1ROKxz30lCCe" target="_blank" rel="noopener noreferrer">
                Download for Desktop
              </a>
            </Button>
          </div>

          {/* Mobile */}
          <div className="flex flex-col items-center p-10 bg-muted/30 rounded-3xl border border-border text-center relative overflow-hidden">
            <div className="absolute top-6 right-6">
              <span className="bg-brand-500/10 text-brand-500 border border-brand-500/20 px-4 py-1.5 rounded-full text-sm font-semibold">
                Coming Soon
              </span>
            </div>
            <div className="h-20 w-20 bg-muted rounded-2xl flex items-center justify-center text-muted-foreground mb-8">
              <Smartphone className="h-10 w-10" />
            </div>
            <h3 className="text-3xl font-semibold mb-4 text-muted-foreground">Mobile</h3>
            <p className="text-muted-foreground mb-10 text-lg flex-1">
              Take your world-building on the go. Read your manuscripts and update character notes anywhere.
            </p>
            <Button className="w-full rounded-full h-12 text-md" variant="secondary" disabled>
              Available Soon
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full border-t border-border/50 py-12 mt-auto">
        <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-lg">Aevon</span>
            <span className="text-muted-foreground text-sm">© {new Date().getFullYear()} Enzonic LLC. All rights reserved.</span>
          </div>
          <div className="flex gap-6 text-sm text-muted-foreground">
            <Link href="https://github.com/enzonic-llc/Aevon" className="hover:text-foreground transition-colors">GitHub</Link>
            <Link href="#downloads" className="hover:text-foreground transition-colors">Download</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

