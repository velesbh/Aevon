"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/lib/i18n';
import { Github, Monitor, Smartphone, Globe, ArrowRight, ArrowDown, Map, Users, BookOpen, Lightbulb, Cloud, Languages, Pen, ChevronRight } from 'lucide-react';
import { motion, type Variants } from 'framer-motion';
import { StructuredData } from '@/components/structured-data';
import { CursorStroke, SketchBackground, DoodleUnderline } from '@/components/landing/sketch-effects';
import { ScrollEffects } from '@/components/landing/scroll-effects';

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.6, delay: i * 0.1, ease: [0.25, 0.4, 0.25, 1] as [number, number, number, number] } })
};

const stagger: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } }
};

export default function Home() {
  const router = useRouter();
  const { t } = useLanguage();
  const [isTauri, setIsTauri] = useState<boolean | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);
  
  // Fix hydration issue for useScroll
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    const tauriEnv = typeof window !== 'undefined' &&
                    ('__TAURI_INTERNALS__' in window || '__TAURI__' in window);
    if (tauriEnv) {
      router.replace('/dashboard');
    }
    setTimeout(() => setIsTauri(tauriEnv), 0);
  }, [router]);

  if (isTauri === null || isTauri === true) {
    return <div className="min-h-screen bg-background flex items-center justify-center" />;
  }

  
  const features = [
    {
      label: t("landing.feat.manuscript.label"),
      title: t("landing.feat.manuscript.title"),
      desc: t("landing.feat.manuscript.desc"),
      src: "/manuscript.png",
      alt: "Manuscript Editor",
    },
    {
      label: t("landing.feat.characters.label"),
      title: t("landing.feat.characters.title"),
      desc: t("landing.feat.characters.desc"),
      src: "/characters dash.png",
      alt: "Character Profiles",
    },
    {
      label: t("landing.feat.export.label"),
      title: t("landing.feat.export.title"),
      desc: t("landing.feat.export.desc"),
      src: "/export.png",
      alt: "Export Engine",
    },
  ];

  const bentoItems = [
    { icon: <Map className="w-5 h-5" />, title: t("landing.bento.maps.title"), desc: t("landing.bento.maps.desc") },
    { icon: <BookOpen className="w-5 h-5" />, title: t("landing.bento.lore.title"), desc: t("landing.bento.lore.desc") },
    { icon: <Lightbulb className="w-5 h-5" />, title: t("landing.bento.ideas.title"), desc: t("landing.bento.ideas.desc") },
    { icon: <Users className="w-5 h-5" />, title: t("landing.bento.relationships.title"), desc: t("landing.bento.relationships.desc") },
    { icon: <Cloud className="w-5 h-5" />, title: t("landing.bento.sync.title"), desc: t("landing.bento.sync.desc") },
    { icon: <Languages className="w-5 h-5" />, title: t("landing.bento.i18n.title"), desc: t("landing.bento.i18n.desc") },
  ];

  return (
    <div className="flex flex-col items-center w-full min-h-screen bg-[var(--background-app)] text-[var(--text-primary)] font-sans selection:bg-[var(--state-layer-primary)] relative overflow-hidden">
      <StructuredData />
      <CursorStroke />

      {/* HERO */}
      {isHydrated ? (
        <ScrollEffects>
          <div className="relative w-full min-h-[110dvh] flex flex-col items-center justify-center px-6 pt-28 pb-32 overflow-hidden">
            {/* Background decorations */}
            <SketchBackground variant="hero" />
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              <div className="absolute top-[-30%] left-[-25%] w-[75%] h-[55%] bg-[var(--primary)]/[0.04] rounded-full blur-[160px]" />
              <div className="absolute bottom-[-40%] right-[-25%] w-[65%] h-[45%] bg-[var(--primary)]/[0.03] rounded-full blur-[140px]" />
              <div className="absolute bottom-0 left-0 right-0 h-[200px] bg-gradient-to-t from-[var(--background-app)] to-transparent" />
            </div>

            <div className="relative z-10 flex flex-col lg:flex-row items-center gap-12 lg:gap-20 max-w-7xl w-full px-6">
              {/* Left content */}
              <motion.div
                initial="hidden" animate="visible" variants={stagger}
                className="flex-1 text-center lg:text-left"
              >
                {/* Badge */}
                <motion.div variants={fadeUp} custom={0}
                  className="mb-8 rounded-full px-5 py-2 text-sm font-medium bg-[var(--state-layer-primary)] text-[var(--primary)] border border-[var(--primary)]/20 backdrop-blur-sm inline-block"
                >
                  {t("landing.hero.badge")}
                </motion.div>

                {/* Title */}
                <motion.div variants={fadeUp} custom={1} className="relative mb-6">
                  <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black tracking-tighter leading-[1.05]">
                    {t("landing.hero.title")}
                  </h1>
                  <DoodleUnderline className="absolute -bottom-2 left-[0%] right-[10%] h-3 md:h-4 opacity-40" />
                </motion.div>

                {/* Subtitle */}
                <motion.p variants={fadeUp} custom={2}
                  className="text-lg sm:text-xl text-[var(--text-secondary)] mb-12 max-w-2xl font-light leading-relaxed"
                >
                  {t("landing.hero.desc")}
                </motion.p>

                {/* CTAs */}
                <motion.div variants={fadeUp} custom={3} className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                  <Button size="lg" className="rounded-full px-10 h-14 text-lg font-semibold shadow-md hover:shadow-lg transition-all hover:-translate-y-0.5" asChild>
                    <Link href="/login">
                      {t("landing.hero.cta")}
                      <ArrowRight className="ml-2 w-5 h-5" />
                    </Link>
                  </Button>
                  <Button size="lg" variant="outline" className="rounded-full px-8 h-14 text-lg font-medium border-[var(--border-ui)] bg-[var(--background-surface)]/50 backdrop-blur-sm hover:bg-[var(--surface-state-hover)] transition-all" asChild>
                    <Link href="https://github.com/enzonic-llc/Aevon" target="_blank">
                      <Github className="mr-2 h-5 w-5" />
                      {t("landing.hero.github")}
                    </Link>
                  </Button>
                </motion.div>
              </motion.div>

              {/* Right: Dashboard screenshot */}
              <motion.div
                initial={{ opacity: 0, scale: 0.85, rotateY: 15 }}
                animate={{ opacity: 1, scale: 1, rotateY: 0 }}
                transition={{ duration: 1.2, delay: 0.4, ease: [0.25, 0.4, 0.25, 1] }}
                className="flex-1 max-w-2xl relative"
                style={{ perspective: "2000px", transformStyle: "preserve-3d" }}
              >
                <motion.div 
                  className="relative rounded-2xl overflow-hidden border border-[var(--border-ui)]/30 backdrop-blur-sm bg-[var(--background-surface)]/10"
                  style={{ 
                    perspective: "1500px",
                    transform: "rotateX(-12deg) rotateY(12deg) translateZ(50px)",
                    transformStyle: "preserve-3d"
                  }}
                  whileHover={{ 
                    transform: "rotateX(-8deg) rotateY(8deg) translateZ(80px) scale(1.02)",
                    transition: { duration: 0.4, ease: "easeOut" }
                  }}
                >
                  {/* Glass effect overlay */}
                  <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent pointer-events-none" />
                  
                  {/* Image with enhanced styling */}
                  <div className="relative">
                    <Image 
                      src="/dashboard.png" 
                      alt="Aevon Dashboard" 
                      width={1920} 
                      height={1080} 
                      className="w-full h-auto" 
                      priority 
                      style={{ 
                        filter: "contrast(1.05) saturate(1.1)",
                        transform: "translateZ(20px)"
                      }}
                    />
                    
                    {/* Subtle gradient overlay for depth */}
                    <div className="absolute inset-0 bg-gradient-to-t from-[var(--background-app)]/30 via-transparent to-transparent opacity-80 pointer-events-none" />
                    <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-[var(--primary)]/5 pointer-events-none" />
                  </div>
                  
                  {/* Enhanced shadow with 3D effect */}
                  <div 
                    className="absolute -inset-4 rounded-2xl opacity-40"
                    style={{
                      background: "linear-gradient(135deg, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.1) 50%, rgba(0,0,0,0.2) 100%)",
                      filter: "blur(20px)",
                      transform: "translateZ(-20px) scaleY(0.8)"
                    }}
                  />
                  
                  {/* Glow effect */}
                  <div className="absolute -bottom-12 left-[10%] right-[10%] h-24 bg-[var(--primary)]/[0.2] blur-[80px] rounded-full" />
                  
                  {/* Edge highlights */}
                  <div className="absolute inset-0 rounded-2xl border border-white/10 shadow-inner" />
                </motion.div>
              </motion.div>
            </div>

            {/* Scroll hint */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 2, duration: 1 }}
              className="absolute bottom-8 left-1/2 -translate-x-1/2 flex-col items-center gap-2 text-[var(--text-tertiary)] hidden md:flex"
            >
              <span className="text-xs uppercase tracking-[0.2em] font-semibold">{t("landing.hero.scrollHint")}</span>
              <motion.div animate={{ y: [0, 8, 0] }} transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}>
                <ArrowDown className="w-4 h-4" />
              </motion.div>
            </motion.div>
          </div>
        </ScrollEffects>
      ) : (
        // Non-hydrated fallback - static hero
        <div className="relative w-full min-h-[110dvh] flex flex-col items-center justify-center px-6 pt-28 pb-32 overflow-hidden">
          <SketchBackground variant="hero" />
          <div className="relative z-10 flex flex-col items-center text-center max-w-5xl w-full">
            <div className="mb-8 rounded-full px-5 py-2 text-sm font-medium bg-[var(--state-layer-primary)] text-[var(--primary)] border border-[var(--primary)]/20 backdrop-blur-sm">
              {t("landing.hero.badge")}
            </div>
            <div className="relative mb-6">
              <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-tighter leading-[1.05]">
                {t("landing.hero.title")}
              </h1>
              <DoodleUnderline className="absolute -bottom-2 left-[10%] right-[10%] h-3 md:h-4 opacity-40" />
            </div>
            <p className="text-lg sm:text-xl md:text-2xl text-[var(--text-secondary)] mb-12 max-w-3xl font-light leading-relaxed">
              {t("landing.hero.desc")}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
              <Button size="lg" className="rounded-full px-10 h-14 text-lg font-semibold shadow-md hover:shadow-lg transition-all hover:-translate-y-0.5" asChild>
                <Link href="/login">
                  {t("landing.hero.cta")}
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="rounded-full px-8 h-14 text-lg font-medium border-[var(--border-ui)] bg-[var(--background-surface)]/50 backdrop-blur-sm hover:bg-[var(--surface-state-hover)] transition-all" asChild>
                <Link href="https://github.com/enzonic-llc/Aevon" target="_blank">
                  <Github className="mr-2 h-5 w-5" />
                  {t("landing.hero.github")}
                </Link>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════ TRUST BAR ═══════ */}
      <section className="w-full py-8 px-6 border-y border-[var(--border-ui)]/40 bg-[var(--surface-container)]/30 backdrop-blur-sm z-10 relative">
        <div className="max-w-5xl mx-auto flex flex-wrap justify-center gap-x-12 gap-y-4">
          {[
            { icon: <Github className="w-4 h-4" />, text: t("landing.trust.opensource") },
            { icon: <Pen className="w-4 h-4" />, text: t("landing.trust.free") },
            { icon: <Monitor className="w-4 h-4" />, text: t("landing.trust.desktop") },
            { icon: <Cloud className="w-4 h-4" />, text: t("landing.trust.offline") },
          ].map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.4 }}
              className="flex items-center gap-2.5 text-sm font-medium text-[var(--text-secondary)]"
            >
              <span className="text-[var(--primary)]">{item.icon}</span>
              {item.text}
            </motion.div>
          ))}
        </div>
      </section>

      {/* ═══════ FEATURE SHOWCASE ═══════ */}
      <section className="w-full py-24 md:py-32 px-6 relative z-10 overflow-hidden">
        <SketchBackground variant="features" />
        <div className="max-w-7xl mx-auto flex flex-col gap-28 md:gap-40">
          {features.map((feat, idx) => {
            const isReversed = idx % 2 === 1;
            return (
              <div key={idx} className={`flex flex-col gap-12 lg:gap-20 items-center ${isReversed ? 'lg:flex-row-reverse' : 'lg:flex-row'}`}>
                {/* Text */}
                <motion.div
                  initial={{ opacity: 0, x: isReversed ? 40 : -40 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: "-80px" }}
                  transition={{ duration: 0.7 }}
                  className="flex-1 w-full"
                >
                  <span className="inline-block mb-4 text-xs font-bold uppercase tracking-[0.2em] text-[var(--primary)] bg-[var(--state-layer-primary)] px-3 py-1 rounded-full">
                    {feat.label}
                  </span>
                  <h3 className="text-3xl md:text-5xl font-bold mb-5 tracking-tight">{feat.title}</h3>
                  <p className="text-lg text-[var(--text-secondary)] leading-relaxed">{feat.desc}</p>
                </motion.div>

                {/* Screenshot */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.85, rotateY: isReversed ? -15 : 15 }}
                  whileInView={{ opacity: 1, scale: 1, rotateY: 0 }}
                  viewport={{ once: true, margin: "-80px" }}
                  transition={{ duration: 1, delay: 0.15 }}
                  className="flex-1 w-full"
                  style={{ perspective: "2000px", transformStyle: "preserve-3d" }}
                >
                  <motion.div 
                    className="relative rounded-2xl overflow-hidden border border-[var(--border-ui)]/30 backdrop-blur-sm bg-[var(--background-surface)]/10"
                    style={{ 
                      perspective: "1500px",
                      transform: `rotateX(-10deg) rotateY(${isReversed ? '-10deg' : '10deg'}) translateZ(40px)`,
                      transformStyle: "preserve-3d"
                    }}
                    whileHover={{ 
                      transform: `rotateX(-6deg) rotateY(${isReversed ? '-6deg' : '6deg'}) translateZ(60px) scale(1.02)`,
                      transition: { duration: 0.4, ease: "easeOut" }
                    }}
                  >
                    {/* Glass effect overlay */}
                    <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent pointer-events-none" />
                    
                    {/* Image with enhanced styling */}
                    <div className="relative">
                      <Image 
                        src={feat.src} 
                        alt={feat.alt} 
                        width={1920} 
                        height={1080} 
                        className="w-full h-auto" 
                        style={{ 
                          filter: "contrast(1.05) saturate(1.1)",
                          transform: "translateZ(20px)"
                        }}
                      />
                      
                      {/* Subtle gradient overlay for depth */}
                      <div className="absolute inset-0 bg-gradient-to-t from-[var(--background-app)]/30 via-transparent to-transparent opacity-80 pointer-events-none" />
                      <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-[var(--primary)]/5 pointer-events-none" />
                    </div>
                    
                    {/* Enhanced shadow with 3D effect */}
                    <div 
                      className="absolute -inset-4 rounded-2xl opacity-40"
                      style={{
                        background: "linear-gradient(135deg, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.1) 50%, rgba(0,0,0,0.2) 100%)",
                        filter: "blur(20px)",
                        transform: "translateZ(-20px) scaleY(0.8)"
                      }}
                    />
                    
                    {/* Glow effect */}
                    <div className="absolute -bottom-8 left-[10%] right-[10%] h-16 bg-[var(--primary)]/[0.15] blur-[60px] rounded-full" />
                    
                    {/* Edge highlights */}
                    <div className="absolute inset-0 rounded-2xl border border-white/10 shadow-inner" />
                  </motion.div>
                </motion.div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ═══════ BENTO GRID ═══════ */}
      <section className="w-full py-24 md:py-32 px-6 relative z-10 border-t border-[var(--border-ui)]/40 bg-[var(--surface-container)]/20 overflow-hidden">
        <SketchBackground variant="bento" />
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-5">{t("landing.bento.title")}</h2>
            <p className="text-lg text-[var(--text-secondary)] max-w-2xl mx-auto">{t("landing.bento.desc")}</p>
          </motion.div>

          <motion.div
            initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }} variants={stagger}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
          >
            {bentoItems.map((item, i) => (
              <motion.div
                key={i}
                variants={fadeUp}
                custom={i}
                className="group p-6 rounded-2xl border border-[var(--border-ui)]/50 bg-[var(--background-surface)] hover:bg-[var(--background-surface-hover)] transition-all duration-300 hover:shadow-md hover:-translate-y-1"
              >
                <div className="w-10 h-10 rounded-xl bg-[var(--state-layer-primary)] text-[var(--primary)] flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  {item.icon}
                </div>
                <h3 className="font-semibold text-base mb-1.5">{item.title}</h3>
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      
      {/* ═══════ PLATFORMS ═══════ */}
      <section id="downloads" className="w-full py-24 md:py-32 px-6 relative z-10 border-t border-[var(--border-ui)]/40 bg-[var(--surface-container)]/20">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-5">{t("landing.platforms.title")}</h2>
            <p className="text-lg text-[var(--text-secondary)] max-w-2xl mx-auto">{t("landing.platforms.desc")}</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: <Globe className="w-7 h-7" />, title: t("landing.platforms.web.title"), desc: t("landing.platforms.web.desc"), action: <Link href="/login" className="font-semibold text-[var(--primary)] hover:underline inline-flex items-center gap-1">{t("landing.platforms.web.action")} <ChevronRight className="w-4 h-4" /></Link>, highlight: false },
              { icon: <Monitor className="w-7 h-7" />, title: t("landing.platforms.desktop.title"), desc: t("landing.platforms.desktop.desc"), action: <a href="https://apps.enzonic.com/app/fXyEGedm1ROKxz30lCCe" target="_blank" rel="noopener noreferrer" className="font-semibold text-[var(--primary)] hover:underline inline-flex items-center gap-1">{t("landing.platforms.desktop.action")} <ChevronRight className="w-4 h-4" /></a>, highlight: true },
              { icon: <Smartphone className="w-7 h-7" />, title: t("landing.platforms.mobile.title"), desc: t("landing.platforms.mobile.desc"), action: <span className="text-[var(--text-tertiary)] font-medium">{t("landing.platforms.mobile.action")}</span>, highlight: false },
            ].map((p, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15, duration: 0.5 }}
                className={`p-8 rounded-2xl border flex flex-col items-center text-center transition-all duration-300 hover:-translate-y-1 hover:shadow-md ${p.highlight ? 'border-[var(--primary)]/30 bg-[var(--state-layer-primary)]/30' : 'border-[var(--border-ui)]/50 bg-[var(--background-surface)]'}`}
              >
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 ${p.highlight ? 'bg-[var(--primary)] text-white' : 'bg-[var(--surface-container-high)] text-[var(--text-primary)]'}`}>
                  {p.icon}
                </div>
                <h3 className="font-bold text-xl mb-2">{p.title}</h3>
                <p className="text-[var(--text-secondary)] text-sm mb-6 flex-1">{p.desc}</p>
                <div className="mt-auto text-sm">{p.action}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ CTA ═══════ */}
      <section className="w-full py-32 md:py-40 px-6 relative z-10 overflow-hidden">
        <SketchBackground variant="cta" />
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[var(--primary)]/[0.03] rounded-full blur-[140px]" />
        </div>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="max-w-3xl mx-auto text-center flex flex-col items-center relative z-10"
        >
          <h2 className="text-4xl md:text-6xl font-black tracking-tight mb-6">{t("landing.cta.title")}</h2>
          <p className="text-xl text-[var(--text-secondary)] mb-10 max-w-xl font-light">{t("landing.cta.desc")}</p>
          <Button size="lg" className="rounded-full px-12 h-16 text-xl font-semibold shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300" asChild>
            <Link href="/login">
              {t("landing.cta.button")}
              <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
          </Button>
        </motion.div>
      </section>

      {/* ═══════ FOOTER ═══════ */}
      <footer className="w-full py-12 px-6 border-t border-[var(--border-ui)]/40 bg-[var(--surface-container)]/20 relative z-10">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start gap-10 mb-10">
            <div className="max-w-xs">
              <div className="flex items-center gap-2.5 mb-3">
                <Image src="/aevon.png" alt="Aevon" width={24} height={24} className="w-6 h-6" />
                <span className="font-bold text-lg">Aevon</span>
              </div>
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{t("landing.footer.desc")}</p>
            </div>
            <div className="flex gap-16 text-sm">
              <div className="flex flex-col gap-2.5">
                <span className="font-semibold text-xs uppercase tracking-[0.15em] text-[var(--text-tertiary)] mb-1">{t("landing.footer.product")}</span>
                <Link href="/#features" className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">{t("landing.footer.features")}</Link>
                <Link href="/docs" className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">{t("landing.footer.docs")}</Link>
                <Link href="/blog" className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">{t("landing.footer.blog")}</Link>
              </div>
              <div className="flex flex-col gap-2.5">
                <span className="font-semibold text-xs uppercase tracking-[0.15em] text-[var(--text-tertiary)] mb-1">{t("landing.footer.legal")}</span>
                <Link href="/login" className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">{t("landing.footer.signIn")}</Link>
                <Link href="https://github.com/enzonic-llc/Aevon" target="_blank" className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">{t("landing.footer.github")}</Link>
              </div>
            </div>
          </div>
          <div className="pt-6 border-t border-[var(--border-ui)]/30 flex flex-col sm:flex-row justify-between items-center gap-3 text-xs text-[var(--text-tertiary)]">
            <span>&copy; 2026 Enzonic LLC. All rights reserved.</span>
            <span>{t("landing.footer.productBy")}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
