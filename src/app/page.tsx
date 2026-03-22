"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/lib/i18n';
import { Github, Monitor, Smartphone, Globe, BookOpen, Map, Users, Database, ArrowRight, Type } from 'lucide-react';
import { motion, Variants } from 'framer-motion';

// --- Doodles ---
const DoodleArrow = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M10 50 Q 50 10 90 50 M 70 30 L 92 51 L 65 70" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const DoodleCircle = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M50,10 C75,8 92,25 88,50 C85,75 60,92 35,85 C15,78 8,50 15,30 C20,15 40,8 55,12" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
  </svg>
);

const DoodleUnderline = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 100 30" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" className={className}>
    <path d="M5 20 Q 30 5 60 15 T 95 10" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
  </svg>
);

const DoodleStar = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M50 10 Q 52 40 90 50 Q 55 55 50 90 Q 45 55 10 50 Q 45 42 50 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: "easeOut" } }
};

const stagger: Variants = {
  visible: { transition: { staggerChildren: 0.15 } }
};

export default function Home() {
  const router = useRouter();
  const { t } = useLanguage();
  const [isTauri, setIsTauri] = useState<boolean | null>(null);

  useEffect(() => {
    const tauriEnv = typeof window !== 'undefined' &&
                    ('__TAURI_INTERNALS__' in window || '__TAURI__' in window);
    if (tauriEnv) {
      router.replace('/dashboard');
    }
    // Avoid synchronous state update that causes lint error
    setTimeout(() => setIsTauri(tauriEnv), 0);
  }, [router]);

  if (isTauri === null || isTauri === true) {
    return <div className="min-h-screen bg-background flex items-center justify-center"></div>;
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1 }}
      className="flex flex-col items-center w-full min-h-screen bg-background text-foreground font-sans selection:bg-primary/20 relative overflow-hidden"
    >
      
      {/* Initial Screen Reveal Animation */}
      <motion.div
        initial={{ y: 0 }}
        animate={{ y: "-100%" }}
        transition={{ duration: 1, ease: [0.76, 0, 0.24, 1], delay: 0.2 }}
        className="fixed inset-0 z-50 bg-background flex flex-col items-center justify-center pointer-events-none"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="text-4xl font-black flex items-center gap-4"
        >
          <div className="w-12 h-12 rounded-lg bg-foreground text-background flex items-center justify-center text-xl">A</div>
          Aevon
        </motion.div>
      </motion.div>

      {/* Background Gradients and Strokes */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden flex items-center justify-center">
        <svg className="absolute w-[200%] h-[200%] opacity-[0.02] text-foreground" xmlns="http://www.w3.org/2000/svg" style={{ transform: "rotate(-15deg)" }}>
          <defs>
            <pattern id="bg-lines" width="60" height="60" patternUnits="userSpaceOnUse">
              <path d="M0,30 L60,30" stroke="currentColor" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#bg-lines)" />
        </svg>
        <div className="absolute -top-1/4 -left-1/4 w-1/2 h-1/2 bg-primary/20 rounded-full blur-[180px] opacity-40" />
        <div className="absolute top-1/3 -right-1/4 w-1/2 h-1/2 bg-blue-500/10 rounded-full blur-[150px] opacity-30" />
      </div>

      {/* Hero */}
      <main className="w-full flex-1 flex flex-col items-center justify-center min-h-[100dvh] pt-32 pb-16 px-6 z-10 relative">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={stagger}
          className="flex flex-col items-center text-center max-w-5xl w-full relative mt-16 md:mt-0"
        >
          {/* Floating Doodles */}
          <motion.div
            animate={{ y: [0, -10, 0], rotate: [0, 5, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -top-16 -left-8 md:-top-12 md:-left-12 text-primary/40 hidden sm:block w-20 h-20 md:w-24 md:h-24 pointer-events-none"
          >
            <DoodleStar />
          </motion.div>
          <motion.div
            animate={{ y: [0, 10, 0], rotate: [0, -5, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-32 -right-8 md:top-20 md:-right-16 text-blue-500/40 hidden sm:block w-16 h-16 md:w-20 md:h-20 pointer-events-none"
          >
            <DoodleCircle />
          </motion.div>

          <motion.div
            variants={fadeUp}
            className="mb-8 rounded-full px-5 py-2 text-sm font-medium bg-primary/10 text-primary border border-primary/20 backdrop-blur-sm shadow-sm"
            style={{ transitionDelay: '0.8s' }} // Wait for screen reveal
          >
            {t("landing.hero.badge") || "The definitive world-building environment"}
          </motion.div>
          
          <motion.div variants={fadeUp} className="relative mb-6 w-full" style={{ transitionDelay: '0.9s' }}>
            <h1 className="text-5xl sm:text-6xl md:text-8xl lg:text-9xl font-black text-center tracking-tighter text-foreground leading-[1.05] relative z-10 px-2">
              {t("landing.hero.title")?.split(' ').map((word: string, i: number) => (
                <span key={i} className="inline-block mr-[0.25em]">
                  {word}
                </span>
              )) || "Craft Your Universe."}
            </h1>
            <div className="absolute -bottom-2 md:-bottom-4 left-[15%] right-[15%] md:left-1/4 md:right-1/4 h-6 md:h-8 text-primary/50 -z-10 transform -rotate-2">
              <DoodleUnderline className="w-full h-full" />
            </div>
          </motion.div>
          
          <motion.p variants={fadeUp} className="text-lg sm:text-xl md:text-2xl text-muted-foreground mb-12 max-w-3xl font-light leading-relaxed px-4" style={{ transitionDelay: '1.0s' }}>
            {t("landing.hero.desc") || "Aevon unifies your manuscript, interactive maps, and relationship networks into a single, cohesive workspace. Built for creators who demand depth."}
          </motion.p>
          
          <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-5 w-full sm:w-auto relative px-6 sm:px-0" style={{ transitionDelay: '1.1s' }}>
            <div className="absolute -left-16 top-1/2 -translate-y-1/2 text-primary/60 hidden lg:block w-12 h-12 transform -rotate-12 pointer-events-none">
              <DoodleArrow />
            </div>
            <Button size="lg" className="rounded-full px-12 h-16 text-xl font-semibold shadow-xl shadow-primary/25 hover:shadow-primary/40 transition-all hover:-translate-y-1" asChild>
              <Link href="/login">
                {t("landing.hero.startBuilding") || "Start Building"}
                <ArrowRight className="ml-2 w-6 h-6" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="rounded-full px-10 h-16 text-lg font-medium border-border/50 bg-background/50 backdrop-blur-sm hover:bg-muted/50 transition-all" asChild>
              <Link href="https://github.com/enzonic-llc/Aevon" target="_blank">
                <Github className="mr-2 h-6 w-6" />
                View on GitHub
              </Link>
            </Button>
          </motion.div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2.5, duration: 1 }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-muted-foreground/50 hidden md:flex"
        >
          <span className="text-xs uppercase tracking-widest font-semibold">Scroll to explore</span>
          <motion.div 
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="w-px h-12 bg-gradient-to-b from-current to-transparent"
          />
        </motion.div>
      </main>

      {/* Mention Showcase Section */}
      <section className="w-full py-32 px-6 border-t border-border/40 relative z-10 bg-primary/5">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-background to-background" />
        <div className="max-w-7xl mx-auto relative">
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.7 }}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-2xl mb-6 text-primary">
              <Type className="w-8 h-8" />
            </div>
            <h2 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
              {t("landing.mentions.title") || "Worldbuilding at the speed of thought"}
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              {t("landing.mentions.desc") || "Never break your flow. Just type @ to instantly reference characters, locations, and items. They automatically link to your database."}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="relative"
          >
            <div className="absolute -top-10 -right-10 w-32 h-32 text-primary/20 transform rotate-45 z-0">
              <DoodleStar />
            </div>
            <MentionShowcase t={t} />
          </motion.div>
        </div>
      </section>

      {/* Alternating Features Section */}
      <section className="w-full py-32 px-6 relative z-10">
        <div className="max-w-7xl mx-auto flex flex-col gap-40">
          
          {/* Feature 1 */}
          <FeatureShowcase 
            index={1}
            icon={<BookOpen className="w-8 h-8" />}
            title={t("landing.bento.feat1.title") || "Distraction-Free Manuscript"}
            description={t("landing.bento.feat1.desc") || "Write in a clean, focused environment that automatically links character names, locations, and items to your world database as you type."}
            visual={<TypingStory story={t("landing.bento.feat1.story") || "The shadow crept across the ancient map, revealing secrets long forgotten by the realm..."} />}
            align="left"
          />

          {/* Feature 2 */}
          <FeatureShowcase 
            index={2}
            icon={<Map className="w-8 h-8" />}
            title={t("landing.bento.feat2.title") || "Interactive Cartography"}
            description={t("landing.bento.feat2.desc") || "Upload maps and drop pins linking directly to your world bible."}
            visual={<MapVisual />}
            align="right"
          />

          {/* Feature 3 */}
          <FeatureShowcase 
            index={3}
            icon={<Users className="w-8 h-8" />}
            title={t("landing.bento.feat3.title") || "Relationship Webs"}
            description={t("landing.bento.feat3.desc") || "Visualize complex character dynamics and political factions automatically."}
            visual={<NetworkVisual />}
            align="left"
          />

          {/* Feature 4 */}
          <FeatureShowcase 
            index={4}
            icon={<Database className="w-8 h-8" />}
            title={t("landing.bento.feat4.title") || "Enterprise-Grade Storage"}
            description={t("landing.bento.feat4.desc") || "Every Aevon workspace comes with massive storage for all your world-building assets. Never worry about hitting limits."}
            visual={<StorageVisual />}
            align="right"
          />

        </div>
      </section>

      {/* Multi-platform */}
      <section className="w-full py-32 px-6 relative z-10 border-t border-border/40 bg-muted/10">
        <div className="max-w-7xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-20 text-center relative"
          >
            <div className="absolute top-0 left-1/4 w-16 h-16 text-primary/30 transform -rotate-12 hidden md:block">
              <DoodleCircle />
            </div>
            <h2 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
              {t("landing.platforms.title") || "Available Everywhere"}
            </h2>
            <p className="text-muted-foreground text-xl max-w-3xl mx-auto">
              {t("landing.platforms.desc") || "Seamlessly sync your workspace across all your devices."}
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <PlatformCard
              icon={<Globe className="w-8 h-8" />}
              title={t("landing.platforms.web.title") || "Web"}
              description={t("landing.platforms.web.desc") || "Access from any browser. Always up to date."}
              action={<Link href="/login" className="text-base font-semibold hover:text-primary transition-colors">{t("landing.platforms.web.action") || "Open App \u2192"}</Link>}
              delay={0}
            />
            <PlatformCard
              icon={<Monitor className="w-8 h-8" />}
              title={t("landing.platforms.desktop.title") || "Desktop"}
              description={t("landing.platforms.desktop.desc") || "Native performance for macOS, Windows, and Linux."}
              action={<a href="https://apps.enzonic.com/app/fXyEGedm1ROKxz30lCCe" target="_blank" rel="noopener noreferrer" className="text-base font-semibold text-primary hover:text-primary/80 transition-colors">{t("landing.platforms.desktop.action") || "Download App \u2192"}</a>}
              highlight
              delay={0.2}
            />
            <PlatformCard
              icon={<Smartphone className="w-8 h-8" />}
              title={t("landing.platforms.mobile.title") || "Mobile"}
              description={t("landing.platforms.mobile.desc") || "Review and capture ideas on the go."}
              action={<span className="text-base text-muted-foreground font-medium">{t("landing.platforms.mobile.action") || "Coming Soon"}</span>}
              delay={0.4}
            />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="w-full py-40 px-6 border-t border-border/40 bg-primary/5 relative z-10 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent pointer-events-none z-0" />
        
        {/* Background floating elements */}
        <motion.div 
          animate={{ y: [0, -20, 0], x: [0, 10, 0] }} 
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-20 left-20 w-32 h-32 bg-primary/20 rounded-full blur-[50px] z-0" 
        />
        <motion.div 
          animate={{ y: [0, 20, 0], x: [0, -10, 0] }} 
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-20 right-20 w-40 h-40 bg-blue-500/20 rounded-full blur-[60px] z-0" 
        />

        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="max-w-4xl mx-auto text-center flex flex-col items-center relative z-10"
        >
          <div className="relative mb-8">
            <h2 className="text-5xl md:text-7xl font-black tracking-tight">
              {t("landing.cta.title") || "Ready to build your world?"}
            </h2>
            <div className="absolute -top-6 -right-12 w-16 h-16 text-primary/40 transform rotate-12">
              <DoodleStar />
            </div>
          </div>
          <p className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-2xl font-light">
            {t("landing.cta.desc") || "Export your entire workspace at any time. Aevon guarantees your data remains yours, always accessible and secure."}
          </p>
          <Button size="lg" className="rounded-full px-14 h-20 text-2xl font-semibold shadow-2xl shadow-primary/30 hover:-translate-y-2 transition-transform duration-300" asChild>
            <Link href="/login">{t("landing.cta.button") || "Create Your Workspace"}</Link>
          </Button>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="w-full py-12 px-6 border-t border-border/40 bg-background text-sm relative z-10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6 text-muted-foreground">
          <div className="flex items-center gap-3 font-semibold text-base text-foreground">
            <div className="w-6 h-6 rounded bg-foreground text-background flex items-center justify-center text-[10px]">A</div>
            Aevon
          </div>
          <div className="text-center">&copy; {new Date().getFullYear()} Enzonic LLC. {t("landing.footer.productBy") || "All rights reserved."}</div>
          <div className="flex gap-8 text-base">
            <Link href="https://github.com/enzonic-llc/Aevon" className="hover:text-foreground transition-colors">GitHub</Link>
            <Link href="/login" className="hover:text-foreground transition-colors">Sign In</Link>
          </div>
        </div>
      </footer>
    </motion.div>
  );
}

// --- Components ---

function MentionShowcase({ t }: { t: (key: string) => string }) {
  const [text, setText] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const fullText = "The ancient sword was forged by @";
  
  useEffect(() => {
    let timeout: NodeJS.Timeout;
    let i = 0;
    setText("");
    setShowDropdown(false);

    const typeChar = () => {
      if (i < fullText.length) {
        setText(fullText.substring(0, i + 1));
        i++;
        
        if (fullText[i-1] === '@') {
          setShowDropdown(true);
        }
        
        timeout = setTimeout(typeChar, Math.random() * 50 + 40);
      } else {
        timeout = setTimeout(() => {
          i = 0;
          setText("");
          setShowDropdown(false);
          typeChar();
        }, 4000);
      }
    };

    timeout = setTimeout(typeChar, 1000);
    return () => clearTimeout(timeout);
  }, []);

  return (
    <div className="relative w-full max-w-2xl mx-auto bg-card rounded-2xl border border-border/50 shadow-2xl overflow-visible p-6 sm:p-8 min-h-[220px]">
      <div className="flex gap-2 mb-6">
        <div className="w-3 h-3 rounded-full bg-red-500/50" />
        <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
        <div className="w-3 h-3 rounded-full bg-green-500/50" />
      </div>
      <div className="font-mono text-lg sm:text-xl md:text-2xl text-foreground flex items-center flex-wrap leading-relaxed">
        <span>{text}</span>
        <motion.div
          animate={{ opacity: [1, 0] }}
          transition={{ repeat: Infinity, duration: 0.8 }}
          className="w-2 sm:w-3 h-6 sm:h-7 bg-primary ml-1 inline-block"
        />
      </div>
      
      {showDropdown && (
        <motion.div
          initial={{ opacity: 0, y: -10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          className="absolute top-28 sm:top-32 left-6 sm:left-10 md:left-48 w-[calc(100%-3rem)] sm:w-72 max-w-sm bg-popover border border-border/80 rounded-xl shadow-2xl overflow-hidden z-20"
        >
          <div className="px-4 py-2 text-xs font-semibold text-muted-foreground bg-muted/40 border-b border-border/50">
            Select a mention
          </div>
          <div className="p-1.5 flex flex-col gap-1">
            <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-primary/10 text-primary cursor-pointer border border-primary/20">
              <div className="bg-primary/20 p-1.5 rounded-md"><Users className="w-4 h-4" /></div>
              <div>
                <div className="text-sm font-bold">Arthur Pendragon</div>
                <div className="text-xs opacity-80">{t("landing.mentions.dropdown.character") || "Character"}</div>
              </div>
            </div>
            <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted/50 cursor-pointer text-foreground transition-colors">
              <div className="bg-muted p-1.5 rounded-md"><Map className="w-4 h-4" /></div>
              <div>
                <div className="text-sm font-medium">Avalon</div>
                <div className="text-xs text-muted-foreground">{t("landing.mentions.dropdown.location") || "Location"}</div>
              </div>
            </div>
            <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted/50 cursor-pointer text-foreground transition-colors">
              <div className="bg-muted p-1.5 rounded-md"><Database className="w-4 h-4" /></div>
              <div>
                <div className="text-sm font-medium">Excalibur</div>
                <div className="text-xs text-muted-foreground">{t("landing.mentions.dropdown.item") || "Item"}</div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  )
}

function FeatureShowcase({ index, icon, title, description, visual, align }: { index: number, icon: React.ReactNode, title: string, description: string, visual: React.ReactNode, align: 'left' | 'right' }) {
  const isLeft = align === 'left';
  
  return (
    <div className={`flex flex-col gap-12 lg:gap-20 items-center ${isLeft ? 'lg:flex-row' : 'lg:flex-row-reverse'}`}>
      <motion.div 
        initial={{ opacity: 0, x: isLeft ? -50 : 50 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.8 }}
        className="flex-1 w-full relative"
      >
        {/* Abstract doodle positioning based on index */}
        {index === 1 && <div className="absolute -top-10 -left-10 w-20 h-20 text-primary/20"><DoodleCircle /></div>}
        {index === 2 && <div className="absolute -bottom-10 -right-10 w-24 h-24 text-primary/20 transform rotate-180"><DoodleArrow /></div>}
        {index === 3 && <div className="absolute -top-10 -right-10 w-16 h-16 text-primary/20"><DoodleStar /></div>}
        
        <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-8 shadow-inner shadow-primary/20 border border-primary/20">
          {icon}
        </div>
        <h3 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight">{title}</h3>
        <p className="text-xl text-muted-foreground leading-relaxed">
          {description}
        </p>
      </motion.div>
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.8, delay: 0.2 }}
        className="flex-1 w-full"
      >
        <div className="relative w-full aspect-video md:aspect-[4/3] rounded-3xl border border-border/50 bg-card/40 backdrop-blur-sm overflow-hidden flex items-center justify-center p-6 shadow-2xl group">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
          {visual}
        </div>
      </motion.div>
    </div>
  );
}

function PlatformCard({ icon, title, description, action, highlight = false, delay = 0 }: { icon: React.ReactNode, title: string, description: string, action: React.ReactNode, highlight?: boolean, delay?: number }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.6, delay }}
      className={`p-10 rounded-3xl border flex flex-col items-center text-center transition-all duration-300 backdrop-blur-sm hover:-translate-y-2 ${highlight ? 'border-primary/40 bg-primary/5 shadow-xl shadow-primary/10' : 'border-border/40 bg-card/50 hover:bg-card/80 hover:shadow-xl'}`}
    >
      <div className={`w-20 h-20 rounded-2xl flex items-center justify-center mb-8 transition-transform duration-300 group-hover:scale-110 ${highlight ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/30' : 'bg-muted text-foreground'}`}>
        {icon}
      </div>
      <h3 className="font-bold text-2xl mb-4">{title}</h3>
      <p className="text-muted-foreground text-lg mb-8 flex-1">{description}</p>
      <div className="mt-auto">
        {action}
      </div>
    </motion.div>
  );
}

// --- Visual Components for Showcase ---

function TypingStory({ story }: { story: string }) {
  const [text, setText] = useState("");

  useEffect(() => {
    let timeout: NodeJS.Timeout;
    let i = 0;
    setText("");

    const typeChar = () => {
      if (i < story.length) {
        setText(story.substring(0, i + 1));
        i++;
        timeout = setTimeout(typeChar, Math.random() * 30 + 20);
      } else {
        timeout = setTimeout(() => {
          i = 0;
          setText("");
          typeChar();
        }, 5000);
      }
    };

    timeout = setTimeout(typeChar, 1000);
    return () => clearTimeout(timeout);
  }, [story]);

  const renderText = () => {
    const parts = text.split(/(mapa|map|shadow|sombra|secrets|secretos)/i);
    return parts.map((part, index) => {
      const lower = part.toLowerCase();
      if (["map", "mapa", "shadow", "sombra", "secrets", "secretos"].includes(lower)) {
        return (
          <span key={index} className="text-primary font-medium bg-primary/10 px-1.5 py-0.5 rounded-md border border-primary/20 cursor-pointer shadow-sm shadow-primary/10">
            {part}
          </span>
        );
      }
      return part;
    });
  };

  return (
    <div className="w-full h-full bg-background/80 rounded-xl border border-border/60 p-6 relative overflow-hidden font-mono text-base md:text-lg flex flex-col shadow-inner">
      <div className="flex gap-2 mb-4 opacity-50">
        <div className="w-2.5 h-2.5 rounded-full bg-muted-foreground" />
        <div className="w-2.5 h-2.5 rounded-full bg-muted-foreground" />
        <div className="w-2.5 h-2.5 rounded-full bg-muted-foreground" />
      </div>
      <div className="w-1/3 h-3 bg-muted rounded-full mb-6" />
      <div className="w-full flex-1 text-muted-foreground leading-loose break-words overflow-hidden text-left">
        {renderText()}
        <motion.span
          animate={{ opacity: [1, 0] }}
          transition={{ repeat: Infinity, duration: 0.8 }}
          className="inline-block w-2 h-5 bg-primary align-middle ml-1"
        />
      </div>
    </div>
  );
}

function MapVisual() {
  return (
    <div className="w-full h-full relative overflow-hidden rounded-xl border border-border/50 bg-background/50">
      <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary via-background to-background" />
      <motion.div
        animate={{ scale: [1, 1.2, 1], opacity: [0.6, 1, 0.6] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-1/2 left-1/2 w-6 h-6 bg-primary rounded-full shadow-[0_0_20px_rgba(var(--primary),0.8)] -translate-x-1/2 -translate-y-1/2 flex items-center justify-center z-10"
      >
        <div className="w-2 h-2 bg-background rounded-full" />
      </motion.div>
      <motion.div
        animate={{ scale: [1, 2], opacity: [0.5, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
        className="absolute top-1/2 left-1/2 w-6 h-6 bg-primary/40 rounded-full -translate-x-1/2 -translate-y-1/2 z-0"
      />
      <div className="absolute top-1/2 left-1/2 w-32 h-32 border-2 border-primary/20 rounded-full -translate-x-1/2 -translate-y-1/2 border-dashed" />
      <div className="absolute top-1/2 left-1/2 w-48 h-48 border border-primary/10 rounded-full -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute top-1/2 left-1/2 w-64 h-64 border border-primary/5 rounded-full -translate-x-1/2 -translate-y-1/2" />
      
      {/* Floating map pins */}
      <motion.div
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-[20%] left-[25%] flex flex-col items-center gap-1"
      >
        <div className="w-3 h-3 bg-primary/60 rounded-full" />
        <div className="w-16 h-1 bg-primary/20 rounded-full" />
      </motion.div>

      <motion.div
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        className="absolute bottom-[25%] right-[20%] flex flex-col items-center gap-1"
      >
        <div className="w-4 h-4 bg-primary/80 rounded-full shadow-lg shadow-primary/20" />
        <div className="w-20 h-1.5 bg-primary/30 rounded-full" />
      </motion.div>
    </div>
  )
}

function NetworkVisual() {
  return (
    <div className="w-full h-full relative rounded-xl border border-border/50 bg-background/50 overflow-hidden">
      <svg className="absolute inset-0 w-full h-full text-primary/30 stroke-current drop-shadow-md" strokeWidth="3">
        <motion.line
          x1="25%" y1="35%" x2="75%" y2="45%"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 2.5, repeat: Infinity, repeatType: 'reverse', ease: 'easeInOut' }}
        />
        <motion.line
          x1="75%" y1="45%" x2="50%" y2="80%"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 2.5, delay: 0.8, repeat: Infinity, repeatType: 'reverse', ease: 'easeInOut' }}
        />
        <motion.line
          x1="50%" y1="80%" x2="25%" y2="35%"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 2.5, delay: 1.6, repeat: Infinity, repeatType: 'reverse', ease: 'easeInOut' }}
        />
        <motion.line
          x1="25%" y1="35%" x2="15%" y2="65%"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 2, delay: 0.4, repeat: Infinity, repeatType: 'reverse', ease: 'easeInOut' }}
          className="text-primary/10"
        />
        <motion.line
          x1="75%" y1="45%" x2="85%" y2="20%"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 2, delay: 1.2, repeat: Infinity, repeatType: 'reverse', ease: 'easeInOut' }}
          className="text-primary/10"
        />
      </svg>
      <motion.div
        animate={{ scale: [1, 1.15, 1], boxShadow: ['0 0 0px rgba(var(--primary),0)', '0 0 20px rgba(var(--primary),0.3)', '0 0 0px rgba(var(--primary),0)'] }} 
        transition={{ duration: 3, repeat: Infinity }}
        className="absolute top-[35%] left-[25%] w-12 h-12 bg-card border-4 border-primary rounded-full -translate-x-1/2 -translate-y-1/2 z-10 flex items-center justify-center"
      >
        <div className="w-4 h-4 bg-primary/50 rounded-full" />
      </motion.div>
      <motion.div
        animate={{ scale: [1, 1.2, 1], boxShadow: ['0 0 0px rgba(var(--primary),0)', '0 0 25px rgba(var(--primary),0.4)', '0 0 0px rgba(var(--primary),0)'] }} 
        transition={{ duration: 3, delay: 0.8, repeat: Infinity }}
        className="absolute top-[45%] left-[75%] w-16 h-16 bg-card border-4 border-primary rounded-full -translate-x-1/2 -translate-y-1/2 z-10 flex items-center justify-center"
      >
        <div className="w-6 h-6 bg-primary/70 rounded-full" />
      </motion.div>
      <motion.div
        animate={{ scale: [1, 1.1, 1], boxShadow: ['0 0 0px rgba(var(--primary),0)', '0 0 15px rgba(var(--primary),0.2)', '0 0 0px rgba(var(--primary),0)'] }} 
        transition={{ duration: 3, delay: 1.6, repeat: Infinity }}
        className="absolute top-[80%] left-[50%] w-10 h-10 bg-card border-4 border-primary rounded-full -translate-x-1/2 -translate-y-1/2 z-10 flex items-center justify-center"
      >
        <div className="w-3 h-3 bg-primary/40 rounded-full" />
      </motion.div>
      
      {/* Minor nodes */}
      <div className="absolute top-[65%] left-[15%] w-6 h-6 bg-background border-2 border-primary/40 rounded-full -translate-x-1/2 -translate-y-1/2 z-10" />
      <div className="absolute top-[20%] left-[85%] w-8 h-8 bg-background border-2 border-primary/40 rounded-full -translate-x-1/2 -translate-y-1/2 z-10" />
    </div>
  )
}

function StorageVisual() {
  return (
    <div className="w-full h-full rounded-xl border border-border/50 bg-background/50 overflow-hidden flex flex-col items-center justify-center gap-4 p-8 relative">
      <div className="absolute inset-0 bg-gradient-to-t from-primary/10 to-transparent opacity-50" />
      
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          initial={{ x: -30, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: i * 0.2, repeat: Infinity, repeatDelay: 4 }}
          className="w-full max-w-sm h-12 border border-primary/30 bg-card rounded-lg flex items-center px-4 gap-4 shadow-lg shadow-primary/5 relative overflow-hidden z-10"
        >
          <motion.div 
            animate={{ left: ['-10%', '110%'] }}
            transition={{ duration: 2, repeat: Infinity, delay: i * 0.5 + 1 }}
            className="absolute top-0 bottom-0 w-8 bg-gradient-to-r from-transparent via-primary/20 to-transparent -skew-x-12"
          />
          <div className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse" style={{ animationDelay: `${i * 0.3}s` }} />
          <div className="w-full flex flex-col gap-2">
            <div className="w-3/4 h-2 bg-primary/20 rounded-full" />
            <div className="w-1/2 h-1.5 bg-muted rounded-full" />
          </div>
        </motion.div>
      ))}
    </div>
  )
}
