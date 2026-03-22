"use client"

import React from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { ArrowLeft, Map as MapIcon } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center relative overflow-hidden font-sans">
      {/* Animated Topographic Background */}
      <div className="absolute inset-0 z-0 opacity-20 pointer-events-none flex items-center justify-center">
        <svg viewBox="0 0 1000 1000" className="w-full h-full text-emerald-500" preserveAspectRatio="xMidYMid slice">
          {/* Topo lines */}
          {[1, 2, 3, 4, 5].map((i) => (
            <motion.path
              key={i}
              d={`M0 ${500 + i * 100} Q 250 ${400 - i * 50} 500 ${500 + i * 20} T 1000 ${500 + i * 80}`}
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeDasharray="10, 15"
              initial={{ x: -100, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 3 + i, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
            />
          ))}
           {[1, 2, 3, 4, 5].map((i) => (
            <motion.path
              key={`top-${i}`}
              d={`M0 ${500 - i * 100} Q 250 ${600 + i * 50} 500 ${500 - i * 20} T 1000 ${500 - i * 80}`}
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeDasharray="10, 15"
              initial={{ x: 100, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 4 + i, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
            />
          ))}
        </svg>
      </div>

      {/* Glowing Orb "Searching" Animation */}
      <div className="relative z-10 mb-12 flex justify-center items-center h-64 w-full">
        <motion.div
          className="absolute w-32 h-32 rounded-full bg-emerald-500/20 blur-xl"
          animate={{ 
            scale: [1, 1.5, 1],
            opacity: [0.5, 0.8, 0.5]
          }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute w-12 h-12 rounded-full bg-emerald-400 shadow-md z-20 flex items-center justify-center"
          animate={{ 
            x: [0, -50, 50, -30, 0],
            y: [0, -30, 20, 40, 0]
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        >
          <div className="w-4 h-4 rounded-full bg-white shadow-md" />
        </motion.div>
        
        {/* Radar scan effect */}
        <motion.div 
            className="absolute w-64 h-64 rounded-full border border-emerald-500/30"
            initial={{ scale: 0, opacity: 1 }}
            animate={{ scale: 1.5, opacity: 0 }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeOut" }}
        />
         <motion.div 
            className="absolute w-64 h-64 rounded-full border border-emerald-500/30"
            initial={{ scale: 0, opacity: 1 }}
            animate={{ scale: 1.5, opacity: 0 }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeOut", delay: 1.5 }}
        />
      </div>

      <div className="relative z-20 text-center px-6 max-w-2xl mx-auto">
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
        >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-medium mb-6">
                <MapIcon className="w-4 h-4" />
                <span>Uncharted Territory</span>
            </div>
            <h1 className="text-6xl md:text-8xl font-bold tracking-tighter text-white mb-4">
                404
            </h1>
            <h2 className="text-2xl md:text-3xl font-semibold text-emerald-50 mb-6">
                Lost in the void.
            </h2>
            <p className="text-lg text-muted-foreground mb-10 leading-relaxed max-w-lg mx-auto">
                The coordinates you entered don&apos;t exist in this universe. The entity you are looking for may have been deleted, moved, or never existed.
            </p>
            
            <Button size="lg" className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-md hover:shadow-md transition-all h-12 px-8 group" asChild>
                <Link href="/">
                <ArrowLeft className="mr-2 w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                Return to the known world
                </Link>
            </Button>
        </motion.div>
      </div>
    </div>
  )
}
