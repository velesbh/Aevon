"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "@/lib/i18n";
import { Loader2, ArrowLeft, Check, BookOpen, PenTool, Award, Globe, Target, Heart, Moon, Sun, Monitor, ArrowRight } from "lucide-react";
import { hasSupabaseEnv, supabase } from "@/lib/supabase";
import { bootstrapWorkspaceForCurrentUser } from "@/lib/workspace";
import type { AuthError } from "@supabase/supabase-js";
import { useInstantTheme } from "@/components/theme-provider";

type ExperienceLevel = "beginner" | "intermediate" | "expert";
type Motivation = "hobby" | "professional" | "learning";
type ThemePref = "light" | "dark" | "system";

const GENRES = [
  { id: "fantasy", image: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=800&auto=format&fit=crop" },
  { id: "scifi", image: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=800&auto=format&fit=crop" },
  { id: "romance", image: "https://images.unsplash.com/photo-1518621736915-f3b1c41bfd00?q=80&w=800&auto=format&fit=crop" },
  { id: "mystery", image: "https://images.unsplash.com/photo-1514316454349-750a7fd3da3a?q=80&w=800&auto=format&fit=crop" },
  { id: "thriller", image: "https://images.unsplash.com/photo-1605806616949-1e87b487cb2a?q=80&w=800&auto=format&fit=crop" },
  { id: "literary", image: "https://images.unsplash.com/photo-1455390582262-044cdead27d8?q=80&w=800&auto=format&fit=crop" },
];

const OnboardingBackdrop = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none select-none z-0">
    <div className="hidden lg:block absolute top-16 left-[10%] w-64 h-64 rounded-[32px] border border-[var(--border-ui)] bg-[var(--surface-container-high)]/80 rotate-[5deg] elevation-1" />
    <div className="hidden lg:block absolute bottom-16 right-[12%] w-72 h-72 rounded-[40px] border border-[var(--border-ui)] bg-[var(--surface-container)]/90 -rotate-[4deg] elevation-2" />
    <div className="absolute inset-x-12 top-1/2 h-px bg-gradient-to-r from-transparent via-[var(--border-ui)]/60 to-transparent" />
    <div className="absolute inset-y-12 left-1/2 w-px bg-gradient-to-b from-transparent via-[var(--border-ui)]/40 to-transparent" />
  </div>
);

export default function OnboardingPage() {
  const { t, language, setLanguage } = useTranslation();
  const router = useRouter();
  
  const totalSteps = 9;
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    experience: "" as ExperienceLevel | "",
    motivation: "" as Motivation | "",
    dailyGoal: 500,
    theme: "" as ThemePref | "",
    genre: "",
    projectName: "",
    acceptTerms: false,
    newsletter: true,
  });

  const [error, setError] = useState<string | null>(null);
  const [[page, direction], setPage] = useState<[number, number]>([1, 0]);
  const step = page;
  const isGenerating = step === totalSteps && !error;
  const passwordTooShort = formData.password.length > 0 && formData.password.length < 6;
  const { setTheme } = useInstantTheme();

  useEffect(() => {
    if (!supabase) {
      return;
    }

    void supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        router.replace("/dashboard");
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        router.replace("/dashboard");
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [router]);

  const handleNext = () => {
    if (step < totalSteps - 1) {
      setPage([step + 1, 1]);
    } else if (step === totalSteps - 1) {
      setPage([totalSteps, 1]);
      handleComplete();
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setPage([step - 1, -1]);
      setError(null);
    }
  };

  const handleComplete = async () => {
    setError(null);

    try {
      if (!supabase || !hasSupabaseEnv) {
        throw new Error("Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and a public Supabase browser key.");
      }

      if (formData.password.length < 6) {
        throw new Error("Password should be at least 6 characters.");
      }

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            name: formData.name,
            language,
            experience_level: formData.experience,
            motivation: formData.motivation,
            daily_goal: formData.dailyGoal,
            theme: formData.theme,
            genre: formData.genre,
            project_name: formData.projectName,
            accept_terms: formData.acceptTerms,
            newsletter: formData.newsletter,
          },
        },
      });

      if (authError) throw authError;

      // Ensure we run bootstrap with the user's explicit input immediately if possible.
      // If we don't have a session (email confirmation required), the data is stored in user_metadata,
      // but we should ideally just bootstrap when they log in. Since user_metadata is reliable,
      // the issue might be that we need to pass the translation for chapter title as a fallback.
      if (authData.session) {
        const result = await bootstrapWorkspaceForCurrentUser({
          projectName: formData.projectName || undefined,
          chapterTitle: t("workspace.defaultChapterTitle"),
        });

        if (result?.project) {
          localStorage.setItem("aevon.activeProjectId", result.project.id);
        }

        router.replace("/dashboard");
        return;
      }

      // If email confirmation is required and no session is returned,
      // we still want to ensure the metadata is perfectly saved.
      // We can also store the project name temporarily in localStorage to ensure the next
      // login uses it, just in case user_metadata failed.
      if (typeof window !== "undefined") {
        window.localStorage.setItem("aevon.pendingProjectName", formData.projectName);
      }

      router.replace("/login");
    } catch (err) {
      console.error(err);
      const message =
        err && typeof err === "object" && "message" in err
          ? String((err as AuthError).message)
          : "An error occurred during workspace generation.";
      setError(message);
    }
  };

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 1000 : -1000,
      opacity: 0,
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 1000 : -1000,
      opacity: 0,
    }),
  };

  const canProceed = () => {
    switch (step) {
      case 1: return true; // Language (always has default)
      case 2: return formData.name.length > 0 && formData.email.length > 0 && formData.password.length >= 6 && formData.acceptTerms;
      case 3: return formData.experience !== "";
      case 4: return formData.motivation !== "";
      case 5: return formData.dailyGoal > 0;
      case 6: return formData.genre !== "";
      case 7: return formData.theme !== "";
      case 8: return formData.projectName.length > 0;
      default: return false;
    }
  };

  return (
    <div className="min-h-screen h-[100dvh] bg-[var(--background-app)] flex flex-col relative overflow-x-hidden text-[color:var(--text-primary)]">
      <OnboardingBackdrop />

      {/* Top Navigation / Progress */}
      {step < totalSteps && (
        <header className="relative z-10 p-6 flex items-center justify-between w-full max-w-6xl mx-auto">
          <button
            onClick={handleBack}
            className={`p-2 rounded-full hover:bg-muted transition-colors ${step === 1 ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          
          <div className="flex-1 max-w-md mx-8">
            <div className="h-1.5 w-full bg-[var(--surface-container-high)] rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-[var(--primary)]"
                initial={{ width: `${((step - 1) / (totalSteps - 2)) * 100}%` }}
                animate={{ width: `${((step) / (totalSteps - 1)) * 100}%` }}
                transition={{ duration: 0.5, ease: "easeInOut" }}
              />
            </div>
          </div>
          
          <div className="text-sm font-medium text-muted-foreground w-10 text-right">
            {step}/{totalSteps - 1}
          </div>
        </header>
      )}

      {/* Main Content Area */}
      <main className="flex-1 relative z-10 flex items-center justify-center p-4">
        <AnimatePresence initial={false} custom={direction} mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ x: { type: "spring", stiffness: 300, damping: 30 }, opacity: { duration: 0.2 } }}
              className="w-full max-w-xl text-center"
            >
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-8 bg-[var(--surface-container-high)] border border-[var(--border-ui)]">
                <Globe className="w-8 h-8 text-[var(--primary)]" />
              </div>
              <h1 className="text-4xl font-bold mb-4">{t("onboarding.step.language.title")}</h1>
              <p className="text-muted-foreground mb-12">{t("onboarding.step.language.subtitle")}</p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-12 text-left">
                  <button
                    onClick={() => setLanguage("en")}
                    className={`p-6 rounded-xl border-2 transition-all ${language === "en" ? "border-[var(--primary)] bg-[var(--primary-container)]" : "border-border hover:border-[var(--primary)]/50 hover:bg-[var(--surface-container)]"}`}
                  >
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xl font-semibold">English</span>
                    {language === "en" && <Check className="w-5 h-5 text-[var(--primary)]" />}
                  </div>
                  <span className="text-sm text-muted-foreground">Select English as primary</span>
                </button>
                <button
                  onClick={() => setLanguage("es")}
                  className={`p-6 rounded-xl border-2 transition-all ${language === "es" ? "border-[var(--primary)] bg-[var(--primary-container)]" : "border-border hover:border-[var(--primary)]/50 hover:bg-[var(--surface-container)]"}`}
                >
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xl font-semibold">Español</span>
                    {language === "es" && <Check className="w-5 h-5 text-[var(--primary)]" />}
                  </div>
                  <span className="text-sm text-muted-foreground">Seleccionar Español como principal</span>
                </button>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ x: { type: "spring", stiffness: 300, damping: 30 }, opacity: { duration: 0.2 } }}
              className="w-full max-w-md text-center"
            >
              <h1 className="text-4xl font-bold mb-4">{t("onboarding.step.account.title")}</h1>
              <p className="text-muted-foreground mb-8">{t("onboarding.step.account.subtitle")}</p>
              
              <div className="space-y-4 text-left">
                <div>
                  <label className="block text-sm font-medium mb-1.5">{t("onboarding.step.account.name")}</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 bg-[var(--background-surface)] border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/40 focus:border-[var(--primary)] transition-all"
                    placeholder="Jane Doe"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">{t("onboarding.step.account.email")}</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-3 bg-[var(--background-surface)] border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/40 focus:border-[var(--primary)] transition-all"
                    placeholder="jane@example.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">{t("onboarding.step.account.password")}</label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    minLength={6}
                    aria-invalid={passwordTooShort}
                    className="w-full px-4 py-3 bg-[var(--background-surface)] border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/40 focus:border-[var(--primary)] transition-all"
                    placeholder="••••••••"
                  />
                  <p className={`mt-2 text-sm ${passwordTooShort ? "text-red-500" : "text-muted-foreground"}`}>
                    {t("onboarding.step.account.password_hint")}
                  </p>
                </div>

                <div className="pt-4 space-y-4">
                  <label className="flex items-start gap-3 cursor-pointer group">
                    <div className="relative flex items-center mt-0.5">
                      <input
                        type="checkbox"
                        checked={formData.acceptTerms}
                        onChange={(e) => setFormData({ ...formData, acceptTerms: e.target.checked })}
                        className="peer h-5 w-5 appearance-none rounded border-2 border-border checked:bg-[var(--primary)] checked:border-[var(--primary)] transition-all cursor-pointer"
                      />
                      <Check className="absolute h-3.5 w-3.5 text-white scale-0 peer-checked:scale-100 transition-transform left-0.5 top-0.5 pointer-events-none" />
                    </div>
                    <span className="text-sm text-balance">
                      {t("onboarding.terms.prefix")}{" "}
                      <a href="/terms" className="text-[var(--primary)] hover:underline font-medium" onClick={(e) => e.stopPropagation()}>{t("onboarding.terms.link")}</a>
                      {" "}{t("onboarding.terms.and")}{" "}
                      <a href="/privacy" className="text-[var(--primary)] hover:underline font-medium" onClick={(e) => e.stopPropagation()}>{t("onboarding.privacy.link")}</a>
                    </span>
                  </label>

                  <label className="flex items-start gap-3 cursor-pointer group">
                    <div className="relative flex items-center mt-0.5">
                      <input
                        type="checkbox"
                        checked={formData.newsletter}
                        onChange={(e) => setFormData({ ...formData, newsletter: e.target.checked })}
                        className="peer h-5 w-5 appearance-none rounded border-2 border-border checked:bg-[var(--primary)] checked:border-[var(--primary)] transition-all cursor-pointer"
                      />
                      <Check className="absolute h-3.5 w-3.5 text-white scale-0 peer-checked:scale-100 transition-transform left-0.5 top-0.5 pointer-events-none" />
                    </div>
                    <span className="text-sm">
                      {t("onboarding.newsletter.label")}
                    </span>
                  </label>
                </div>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ x: { type: "spring", stiffness: 300, damping: 30 }, opacity: { duration: 0.2 } }}
              className="w-full max-w-2xl text-center"
            >
              <h1 className="text-4xl font-bold mb-4">{t("onboarding.step.experience.title")}</h1>
              <p className="text-muted-foreground mb-12">{t("onboarding.step.experience.subtitle")}</p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
                {[
                  { id: "beginner", icon: BookOpen, title: t("onboarding.step.experience.beginner"), desc: t("onboarding.step.experience.beginner.desc") },
                  { id: "intermediate", icon: PenTool, title: t("onboarding.step.experience.intermediate"), desc: t("onboarding.step.experience.intermediate.desc") },
                  { id: "expert", icon: Award, title: t("onboarding.step.experience.expert"), desc: t("onboarding.step.experience.expert.desc") }
                ].map((level) => (
                  <button
                    key={level.id}
                    onClick={() => setFormData({ ...formData, experience: level.id as ExperienceLevel })}
                    className={`p-6 rounded-2xl border-2 flex flex-col items-start transition-all ${
                      formData.experience === level.id 
                        ? "border-[var(--primary)] bg-[var(--primary-container)] shadow-sm scale-105" 
                        : "border-border hover:border-[var(--primary)]/40 hover:bg-[var(--surface-container)]"
                    }`}
                  >
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 ${formData.experience === level.id ? "bg-[var(--primary)] text-white" : "bg-muted text-muted-foreground"}`}>
                      <level.icon className="w-6 h-6" />
                    </div>
                    <h3 className="text-xl font-bold mb-2">{level.title}</h3>
                    <p className="text-sm text-muted-foreground">{level.desc}</p>
                    {formData.experience === level.id && (
                      <div className="absolute top-4 right-4">
                        <Check className="w-5 h-5 text-[var(--primary)]" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div
              key="step4-motivation"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ x: { type: "spring", stiffness: 300, damping: 30 }, opacity: { duration: 0.2 } }}
              className="w-full max-w-2xl text-center"
            >
              <h1 className="text-4xl font-bold mb-4">{t("onboarding.step.motivation.title")}</h1>
              <p className="text-muted-foreground mb-12">{t("onboarding.step.motivation.subtitle")}</p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
                {[
                  { id: "hobby", icon: Heart, title: t("onboarding.step.motivation.hobby.title"), desc: t("onboarding.step.motivation.hobby.desc") },
                  { id: "professional", icon: Target, title: t("onboarding.step.motivation.professional.title"), desc: t("onboarding.step.motivation.professional.desc") },
                  { id: "learning", icon: BookOpen, title: t("onboarding.step.motivation.learning.title"), desc: t("onboarding.step.motivation.learning.desc") }
                ].map((motive) => (
                  <button
                    key={motive.id}
                    onClick={() => setFormData({ ...formData, motivation: motive.id as Motivation })}
                    className={`p-6 rounded-2xl border-2 flex flex-col items-start transition-all ${
                      formData.motivation === motive.id 
                        ? "border-[var(--primary)] bg-[var(--primary-container)] shadow-sm scale-105" 
                        : "border-border hover:border-[var(--primary)]/40 hover:bg-[var(--surface-container)]"
                    }`}
                  >
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 ${formData.motivation === motive.id ? "bg-[var(--primary)] text-white" : "bg-muted text-muted-foreground"}`}>
                      <motive.icon className="w-6 h-6" />
                    </div>
                    <h3 className="text-xl font-bold mb-2">{motive.title}</h3>
                    <p className="text-sm text-muted-foreground">{motive.desc}</p>
                    {formData.motivation === motive.id && (
                      <div className="absolute top-4 right-4">
                        <Check className="w-5 h-5 text-[var(--primary)]" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {step === 5 && (
            <motion.div
              key="step5-goal"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ x: { type: "spring", stiffness: 300, damping: 30 }, opacity: { duration: 0.2 } }}
              className="w-full max-w-xl text-center"
            >
              <h1 className="text-4xl font-bold mb-4">{t("onboarding.step.goal.title")}</h1>
              <p className="text-muted-foreground mb-12">{t("onboarding.step.goal.subtitle")}</p>
              
              <div className="flex flex-col items-center justify-center space-y-8">
                <div className="text-6xl font-bold text-[var(--primary)] tracking-tighter">
                  {formData.dailyGoal}
                </div>
                <div className="w-full max-w-md">
                  <input
                    type="range"
                    min="100"
                    max="5000"
                    step="100"
                    value={formData.dailyGoal}
                    onChange={(e) => setFormData({ ...formData, dailyGoal: parseInt(e.target.value) })}
                    className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-[var(--primary)]"
                  />
                  <div className="flex justify-between text-sm text-muted-foreground mt-2">
                    <span>100</span>
                    <span>5000+</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {step === 6 && (
            <motion.div
              key="step4"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ x: { type: "spring", stiffness: 300, damping: 30 }, opacity: { duration: 0.2 } }}
              className="w-full max-w-4xl text-center"
            >
              <h1 className="text-4xl font-bold mb-4">{t("onboarding.step.genre.title")}</h1>
              <p className="text-muted-foreground mb-8">{t("onboarding.step.genre.subtitle")}</p>
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {GENRES.map((genre) => (
                  <button
                    key={genre.id}
                    onClick={() => setFormData({ ...formData, genre: genre.id })}
                    className={`relative aspect-[4/3] rounded-2xl overflow-hidden group transition-all ${
                      formData.genre === genre.id ? "border border-[var(--primary)]/80 scale-[1.01] shadow-[0_12px_30px_rgba(15,23,42,0.25)]" : "border border-transparent hover:border-[var(--primary)]/30"
                    }`}
                  >
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-black/5 z-10" />
                    <Image src={genre.image} alt={genre.id} fill className="object-cover" sizes="(max-width: 768px) 50vw, 33vw" />
                    <div className="absolute inset-0 z-20 flex items-center justify-center p-4">
                      <span className="text-2xl font-bold text-white drop-shadow-[0_8px_24px_rgba(0,0,0,0.35)]">
                        {t(`onboarding.step.genre.${genre.id}`)}
                      </span>
                    </div>
                    {formData.genre === genre.id && (
                      <div className="absolute top-4 right-4 z-30 bg-[var(--primary)] rounded-full p-1">
                        <Check className="w-5 h-5 text-white" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {step === 7 && (
            <motion.div
              key="step7-theme"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ x: { type: "spring", stiffness: 300, damping: 30 }, opacity: { duration: 0.2 } }}
              className="w-full max-w-2xl text-center"
            >
              <h1 className="text-4xl font-bold mb-4">{t("onboarding.step.theme.title")}</h1>
              <p className="text-muted-foreground mb-12">{t("onboarding.step.theme.subtitle")}</p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
                {[
                  { id: "light", icon: Sun, title: t("onboarding.step.theme.light.title"), desc: t("onboarding.step.theme.light.desc") },
                  { id: "dark", icon: Moon, title: t("onboarding.step.theme.dark.title"), desc: t("onboarding.step.theme.dark.desc") },
                  { id: "system", icon: Monitor, title: t("onboarding.step.theme.system.title"), desc: t("onboarding.step.theme.system.desc") }
                ].map((theme) => (
                  <button
                    key={theme.id}
                    onClick={() => {
                      setFormData({ ...formData, theme: theme.id as ThemePref });
                      setTheme(theme.id);
                    }}
                    className={`p-6 rounded-2xl border-2 flex flex-col items-start transition-all ${
                      formData.theme === theme.id 
                        ? "border-[var(--primary)] bg-[var(--primary-container)] shadow-sm scale-105" 
                        : "border-border hover:border-[var(--primary)]/40 hover:bg-[var(--surface-container)]"
                    }`}
                  >
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 ${formData.theme === theme.id ? "bg-[var(--primary)] text-white" : "bg-muted text-muted-foreground"}`}>
                      <theme.icon className="w-6 h-6" />
                    </div>
                    <h3 className="text-xl font-bold mb-2">{theme.title}</h3>
                    <p className="text-sm text-muted-foreground">{theme.desc}</p>
                    {formData.theme === theme.id && (
                      <div className="absolute top-4 right-4">
                        <Check className="w-5 h-5 text-[var(--primary)]" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {step === 8 && (
            <motion.div
              key="step8-project"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ x: { type: "spring", stiffness: 300, damping: 30 }, opacity: { duration: 0.2 } }}
              className="w-full max-w-md text-center"
            >
              <h1 className="text-4xl font-bold mb-4">{t("onboarding.step.project.title")}</h1>
              <p className="text-muted-foreground mb-12">{t("onboarding.step.project.subtitle")}</p>
              
              <div className="text-left">
                <input
                  type="text"
                  value={formData.projectName}
                  onChange={(e) => setFormData({ ...formData, projectName: e.target.value })}
                  className="w-full px-6 py-4 text-2xl bg-[var(--background-surface)] border-2 border-border rounded-2xl focus:outline-none focus:ring-0 focus:border-[var(--primary)] transition-all text-center placeholder:text-muted"
                  placeholder={t("onboarding.step.project.input")}
                  autoFocus
                />
              </div>
            </motion.div>
          )}

          {step === 9 && (
            <motion.div
              key="step9-loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="w-full max-w-md text-center flex flex-col items-center justify-center"
            >
              {error ? (
                <>
                  <div className="w-24 h-24 mb-8 text-red-500 bg-red-500/10 rounded-full flex items-center justify-center mx-auto">
                    <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </div>
                  <h1 className="text-3xl font-bold mb-4 text-red-500">{t("onboarding.error.title")}</h1>
                  <p className="text-muted-foreground mb-8">{error}</p>
                  <div className="flex gap-4 justify-center">
                    <button
                      onClick={handleBack}
                      className="px-6 py-2 rounded-full border border-border hover:bg-muted transition-colors"
                    >
                      {t("onboarding.error.goBack")}
                    </button>
                    <button
                      onClick={handleComplete}
                      className="px-6 py-2 rounded-full bg-[var(--primary)] hover:bg-[var(--primary-strong)] text-white transition-colors"
                    >
                      {t("onboarding.error.tryAgain")}
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="relative w-24 h-24 mb-8 mx-auto flex items-center justify-center">
                    <div className="absolute inset-0 border-4 border-[var(--primary)]/20 rounded-full" />
                    <Loader2 className="w-12 h-12 text-[var(--primary)] animate-spin" />
                  </div>
                  <h1 className="text-3xl font-bold mb-4">{t("onboarding.step.loading.title")}</h1>
                  <p className="text-muted-foreground">{isGenerating ? t("onboarding.step.loading.subtitle") : t("onboarding.step.loading.preparing")}</p>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Bottom Actions */}
      {step < totalSteps && (
        <div className="relative z-10 p-8 flex justify-center pb-12">
          <button
            onClick={handleNext}
            disabled={!canProceed()}
            className="px-12 py-4 rounded-full bg-[var(--primary)] hover:bg-[var(--primary-strong)] text-white font-semibold text-lg shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-md flex items-center gap-2"
          >
            {t("onboarding.next")}
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
}
