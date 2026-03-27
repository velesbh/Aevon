"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

interface ScrollEffectsProps {
  children: React.ReactNode;
}

export function ScrollEffects({ children }: ScrollEffectsProps) {
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ 
    target: heroRef, 
    offset: ["start start", "end start"] 
  });
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 150]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  return (
    <motion.div style={{ y: heroY, opacity: heroOpacity }}>
      <section ref={heroRef}>
        {children}
      </section>
    </motion.div>
  );
}
