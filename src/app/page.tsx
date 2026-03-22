"use client";

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/lib/i18n';
import { Github, Monitor, Smartphone, Globe, BookOpen, Map, Users, Database, ChevronRight, Lock, Cloud, Zap, ArrowRight, Download } from 'lucide-react';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';

const TypewriterText = ({ text, className = "" }: { text: string, className?: string }) => {
  const characters = Array.from(text);
  
  return (
    <motion.span
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      variants={{
        visible: { transition: { staggerChildren: 0.02 } },
        hidden: {}
      }}
      className={className}
    >
      {characters.map((char, index) => (
        <motion.span
          key={index}
          variants={{
            visible: { opacity: 1, y: 0 },
            hidden: { opacity: 0, y: 5 }
          }}
        >
          {char === " " ? "\u00A0" : char}
        </motion.span>
      ))}
    </motion.span>
  );
};

export default function Home() {
  const router = useRouter();
  const { t, language, setLanguage } = useLanguage();
  const [isTauri, setIsTauri] = useState<boolean | null>(null);
  
  const targetRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: targetRef,
    offset: ["start end", "end start"],
  });
  const opacity = useTransform(scrollYProgress, [0, 0.5], [0, 1]);
  const y = useTransform(scrollYProgress, [0, 0.5], [50, 0]);

  useEffect(() => {
    const tauriEnv = typeof window !== 'undefined' && 
                    ('__TAURI_INTERNALS__' in window || '__TAURI__' in window);
    setIsTauri(tauriEnv);
    if (tauriEnv) {
      router.replace('/dashboard');
    }
  }, [router]);

  if (isTauri === null || isTauri === true) {
    return <div className="min-h-screen bg-[var(--background-app)] flex items-center justify-center"></div>;
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.3,
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: "spring" as const, stiffness: 100 } }
  };

  return (
    <div className="flex flex-col items-center w-full min-h-screen bg-[var(--background-app)] overflow-hidden font-sans text-foreground">
      {/* Navbar */}
      <motion.nav 
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", stiffness: 50, damping: 20 }}
        className="w-full max-w-7xl mx-auto px-6 py-4 flex justify-between items-center relative z-50"
      >
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center text-white font-bold text-xl">A</div>
          <span className="font-bold text-xl tracking-tight">Aevon</span>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setLanguage(language === 'en' ? 'es' : 'en')}
            className="text-sm font-medium hover:text-brand-500 transition-colors px-2 py-1 border border-border rounded-md bg-card/50 backdrop-blur-sm"
          >
            {language === 'en' ? 'ES' : 'EN'}
          </button>
          <Button variant="ghost" asChild className="hidden md:inline-flex rounded-full">
            <Link href="/login">{t("landing.login") || "Login"}</Link>
          </Button>
          <Button asChild className="rounded-full bg-brand-600 hover:bg-brand-500 text-white shadow-md shadow-brand-500/20">
            <Link href="/login">{t("landing.getStarted") || "Get Started"}</Link>
          </Button>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <section className="w-full max-w-7xl mx-auto px-6 pt-24 pb-32 flex flex-col items-center text-center relative z-10">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="absolute inset-0 top-[-20%] left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-brand-500/10 rounded-full blur-[120px] -z-10 pointer-events-none"
        />

        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="inline-flex items-center rounded-full px-4 py-1.5 text-sm font-semibold bg-brand-500/10 text-brand-600 ring-1 ring-inset ring-brand-500/20 mb-8"
        >
          {t("landing.hero.badge")}
        </motion.div>

        <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter mb-8 max-w-5xl leading-tight">
          <TypewriterText text={t("landing.hero.title")} />
        </h1>

        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5, duration: 1 }}
          className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-3xl leading-relaxed"
        >
          {t("landing.hero.desc")}
        </motion.p>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.8 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto"
        >
          <Button size="lg" asChild className="w-full sm:w-auto rounded-full px-8 h-14 text-lg font-semibold bg-brand-600 hover:bg-brand-500 text-white shadow-xl shadow-brand-500/25 group">
            <Link href="/login">
              {t("landing.hero.startBuilding")}
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </Button>
          <Button size="lg" variant="outline" asChild className="w-full sm:w-auto rounded-full px-8 h-14 text-lg font-semibold border-2 hover:bg-muted/50 transition-colors">
            <Link href="https://github.com/enzonic-llc/Aevon" target="_blank">
              <Github className="mr-2 h-5 w-5" />
              GitHub
            </Link>
          </Button>
        </motion.div>
      </section>

      {/* Feature Bento Box */}
      <section className="w-full max-w-7xl mx-auto px-6 py-24 relative" ref={targetRef}>
        <motion.div style={{ opacity, y }} className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">
            {t("landing.bento.title1")} <span className="text-brand-500">{t("landing.bento.title2")}</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            {t("landing.bento.desc")}
          </p>
        </motion.div>

        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[300px]"
        >
          {/* Feature 1 */}
          <motion.div variants={itemVariants} className="md:col-span-2 bg-gradient-to-br from-card to-card/50 border border-border rounded-3xl p-8 overflow-hidden relative group">
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
              <BookOpen className="w-48 h-48 -rotate-12 translate-x-12 -translate-y-12 text-brand-500" />
            </div>
            <div className="h-full flex flex-col justify-end relative z-10 w-2/3">
              <div className="w-12 h-12 bg-brand-500/10 text-brand-500 rounded-xl flex items-center justify-center mb-6">
                <BookOpen className="w-6 h-6" />
              </div>
              <h3 className="text-2xl font-bold mb-2">{t("landing.bento.feat1.title")}</h3>
              <p className="text-muted-foreground leading-relaxed">{t("landing.bento.feat1.desc")}</p>
            </div>
          </motion.div>

          {/* Feature 2 */}
          <motion.div variants={itemVariants} className="md:col-span-1 bg-gradient-to-bl from-card to-card/50 border border-border rounded-3xl p-8 overflow-hidden relative group">
             <div className="absolute bottom-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
              <Map className="w-32 h-32 rotate-12 translate-x-8 translate-y-8 text-blue-500" />
            </div>
            <div className="h-full flex flex-col justify-end relative z-10">
              <div className="w-12 h-12 bg-blue-500/10 text-blue-500 rounded-xl flex items-center justify-center mb-6">
                <Map className="w-6 h-6" />
              </div>
              <h3 className="text-2xl font-bold mb-2">{t("landing.bento.feat2.title")}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{t("landing.bento.feat2.desc")}</p>
            </div>
          </motion.div>

          {/* Feature 3 */}
          <motion.div variants={itemVariants} className="md:col-span-1 bg-gradient-to-tr from-card to-card/50 border border-border rounded-3xl p-8 overflow-hidden relative group">
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-5 group-hover:opacity-10 transition-opacity">
              <Users className="w-48 h-48 text-purple-500" />
            </div>
            <div className="h-full flex flex-col justify-end relative z-10">
              <div className="w-12 h-12 bg-purple-500/10 text-purple-500 rounded-xl flex items-center justify-center mb-6">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-2xl font-bold mb-2">{t("landing.bento.feat3.title")}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{t("landing.bento.feat3.desc")}</p>
            </div>
          </motion.div>

          {/* Feature 4 */}
          <motion.div variants={itemVariants} className="md:col-span-2 bg-gradient-to-tl from-card to-card/50 border border-border rounded-3xl p-8 overflow-hidden relative group">
            <div className="absolute bottom-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
              <Database className="w-48 h-48 translate-x-12 translate-y-12 text-green-500" />
            </div>
            <div className="h-full flex flex-col justify-end relative z-10 w-2/3">
              <div className="w-12 h-12 bg-green-500/10 text-green-500 rounded-xl flex items-center justify-center mb-6">
                <Database className="w-6 h-6" />
              </div>
              <h3 className="text-2xl font-bold mb-2">{t("landing.bento.feat4.title")}</h3>
              <p className="text-muted-foreground leading-relaxed">{t("landing.bento.feat4.desc")}</p>
            </div>
          </motion.div>
        </motion.div>

        {/* Small Badges */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
          className="flex flex-wrap justify-center gap-4 mt-12"
        >
          <div className="flex items-center gap-2 bg-muted/50 px-4 py-2 rounded-full text-sm font-medium border border-border/50">
            <Zap className="w-4 h-4 text-yellow-500" /> {t("landing.bento.fastSearch")}
          </div>
          <div className="flex items-center gap-2 bg-muted/50 px-4 py-2 rounded-full text-sm font-medium border border-border/50">
            <Cloud className="w-4 h-4 text-blue-500" /> {t("landing.bento.cloudSync")}
          </div>
          <div className="flex items-center gap-2 bg-muted/50 px-4 py-2 rounded-full text-sm font-medium border border-border/50">
            <Lock className="w-4 h-4 text-green-500" /> {t("landing.bento.secureStorage")}
          </div>
          <div className="flex items-center gap-2 bg-muted/50 px-4 py-2 rounded-full text-sm font-medium border border-border/50">
            <Download className="w-4 h-4 text-brand-500" /> {t("landing.bento.fullExport")}
          </div>
        </motion.div>
      </section>

      {/* Multi-platform Section */}
      <section id="downloads" className="w-full bg-muted/30 border-y border-border/50 py-24 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="text-center mb-16">
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-4xl md:text-5xl font-bold mb-4 text-foreground"
            >
              Available Everywhere
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-xl text-muted-foreground max-w-2xl mx-auto"
            >
              Access your world on any device. Your data syncs seamlessly across all platforms.
            </motion.p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Web */}
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="flex flex-col items-center p-8 bg-card rounded-3xl border border-border shadow-sm hover:shadow-md transition-shadow text-center"
            >
              <div className="h-16 w-16 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-500 mb-6">
                <Globe className="h-8 w-8" />
              </div>
              <h3 className="text-2xl font-bold mb-3">Web</h3>
              <p className="text-muted-foreground mb-8 flex-1">
                Access Aevon from any modern browser with full functionality.
              </p>
              <Button className="w-full rounded-full" variant="outline" asChild>
                <Link href="/login">Open App</Link>
              </Button>
            </motion.div>

            {/* Desktop */}
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="flex flex-col items-center p-8 bg-card rounded-3xl border-2 border-brand-500/20 shadow-lg relative text-center"
            >
              <div className="absolute -top-4 bg-brand-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                RECOMMENDED
              </div>
              <div className="h-16 w-16 bg-brand-500/10 rounded-2xl flex items-center justify-center text-brand-500 mb-6">
                <Monitor className="h-8 w-8" />
              </div>
              <h3 className="text-2xl font-bold mb-3">Desktop</h3>
              <p className="text-muted-foreground mb-8 flex-1">
                The ultimate offline-first experience for Windows, Mac, and Linux.
              </p>
              <Button className="w-full rounded-full bg-brand-600 hover:bg-brand-500" asChild>
                <a href="https://apps.enzonic.com/app/fXyEGedm1ROKxz30lCCe" target="_blank" rel="noopener noreferrer">
                  Download
                </a>
              </Button>
            </motion.div>

            {/* Mobile */}
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 }}
              className="flex flex-col items-center p-8 bg-card rounded-3xl border border-border shadow-sm text-center relative overflow-hidden"
            >
              <div className="absolute top-4 right-4 bg-muted text-muted-foreground text-xs font-bold px-2 py-1 rounded-full border border-border">
                BETA
              </div>
              <div className="h-16 w-16 bg-purple-500/10 rounded-2xl flex items-center justify-center text-purple-500 mb-6">
                <Smartphone className="h-8 w-8" />
              </div>
              <h3 className="text-2xl font-bold mb-3">Mobile</h3>
              <p className="text-muted-foreground mb-8 flex-1">
                Review notes and lore on the go. iOS and Android compatible.
              </p>
              <Button className="w-full rounded-full" variant="secondary" disabled>
                Coming Soon
              </Button>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="w-full max-w-5xl mx-auto px-6 py-32 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="bg-brand-600 rounded-[3rem] p-12 md:p-20 text-white relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
          <div className="relative z-10">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">{t("landing.cta.title")}</h2>
            <p className="text-lg md:text-xl text-brand-100 mb-10 max-w-2xl mx-auto">
              {t("landing.cta.desc")}
            </p>
            <Button size="lg" className="rounded-full px-10 h-16 text-xl bg-white text-brand-600 hover:bg-brand-50 hover:text-brand-700 shadow-xl shadow-black/10">
              <Link href="/login">{t("landing.cta.button")}</Link>
            </Button>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="w-full border-t border-border/50 py-12 mt-auto bg-card">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center text-white font-bold">A</div>
            <div>
              <span className="font-semibold text-lg block leading-none">Aevon</span>
              <span className="text-muted-foreground text-xs">{t("landing.footer.productBy")}</span>
            </div>
          </div>
          <div className="flex gap-8 text-sm text-muted-foreground font-medium">
            <Link href="https://github.com/enzonic-llc/Aevon" className="hover:text-brand-500 transition-colors">GitHub</Link>
            <Link href="#downloads" className="hover:text-brand-500 transition-colors">Downloads</Link>
            <Link href="/login" className="hover:text-brand-500 transition-colors">Sign In</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
