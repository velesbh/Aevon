"use client"

import * as React from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { motion, useScroll, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useLanguage } from "@/lib/i18n"

export function Header() {
  const pathname = usePathname()
  const { scrollY } = useScroll()
  const [isScrolled, setIsScrolled] = React.useState(false)
  const [hoveredIndex, setHoveredIndex] = React.useState<number | null>(null)
  const { language, setLanguage, t } = useLanguage()

  React.useEffect(() => {
    return scrollY.on("change", (latest) => {
      setIsScrolled(latest > 50)
    })
  }, [scrollY])

  const navItems = [
    { name: t("header.product"), href: "/#features" },
    { name: language === "es" ? "Blog" : "Blog", href: "/blog" },
    { name: language === "es" ? "Documentación" : "Docs", href: "/docs" },
    { name: "Downloads", href: "/#downloads" },
    { name: "GitHub", href: "https://github.com/enzonic-llc/Aevon" },
  ]

  // Hide on auth pages or dashboard
  if (pathname.includes("/login") || pathname.includes("/dashboard") || pathname.includes("/onboarding")) {
    return null
  }

  return (
    <motion.header
      className={cn(
        "fixed top-0 w-full z-50 flex justify-center transition-all duration-500",
        isScrolled ? "pt-4" : "pt-6"
      )}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
    >
      <div 
        className={cn(
          "flex items-center justify-between px-4 transition-all duration-500",
          isScrolled 
            ? "w-[90%] md:w-[800px] bg-background/60 backdrop-blur-2xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.12)] rounded-full py-2.5" 
            : "w-full container mx-auto md:px-8 py-3 bg-transparent border-transparent"
        )}
      >
        <Link href="/" className="flex items-center gap-2 group pl-2">
          <div className="relative flex items-center justify-center w-8 h-8 rounded-full bg-brand-500/10 text-brand-500 transition-colors group-hover:bg-brand-500/20 group-hover:text-brand-400 overflow-hidden">
            <Image 
              src="/aevon.png" 
              alt="Aevon Logo" 
              width={32} 
              height={32} 
              className="w-5 h-5 object-contain"
            />
          </div>
          <span className="font-semibold text-base tracking-tight text-foreground/90 group-hover:text-foreground transition-colors">Aevon</span>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {navItems.map((item, index) => (
            <Link
              key={item.name}
              href={item.href}
              className="relative px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              <span className="relative z-10">{item.name}</span>
              <AnimatePresence>
                {hoveredIndex === index && (
                  <motion.div
                    className="absolute inset-0 bg-white/5 rounded-full z-0"
                    layoutId="hoverBackground"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1, transition: { duration: 0.15 } }}
                    exit={{ opacity: 0, transition: { duration: 0.15, delay: 0.2 } }}
                  />
                )}
              </AnimatePresence>
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3 pr-1">
          <div className="flex items-center bg-white/5 rounded-full p-0.5 border border-white/10 backdrop-blur-sm">
            <button
              onClick={() => setLanguage('en')}
              className={cn(
                "px-2.5 py-1 text-[11px] font-semibold rounded-full transition-all",
                language === 'en' ? "bg-white/10 text-white shadow-sm" : "text-muted-foreground hover:text-white"
              )}
            >
              EN
            </button>
            <button
              onClick={() => setLanguage('es')}
              className={cn(
                "px-2.5 py-1 text-[11px] font-semibold rounded-full transition-all",
                language === 'es' ? "bg-white/10 text-white shadow-sm" : "text-muted-foreground hover:text-white"
              )}
            >
              ES
            </button>
          </div>
          <Button variant="ghost" size="sm" asChild className="hidden md:inline-flex text-sm text-muted-foreground hover:text-white hover:bg-white/5 rounded-full px-4">
            <Link href="/login">{t("header.login")}</Link>
          </Button>
          <Button size="sm" asChild className="bg-brand-600/90 hover:bg-brand-500 text-white shadow-md hover:shadow-md transition-all rounded-full px-5 h-9 border border-brand-500/20">
            <Link href="/login">{t("header.getStarted")}</Link>
          </Button>
        </div>
      </div>
    </motion.header>
  )
}
