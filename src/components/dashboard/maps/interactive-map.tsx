"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { useTranslation } from "@/lib/i18n";
import { MapPin } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export interface MapWaypoint {
  id: string;
  x: number;
  y: number;
  name: string;
  notes: string;
}

interface InteractiveMapProps {
  imageUrl?: string | null;
  waypoints: MapWaypoint[];
  selectedWaypointId?: string | null;
  onAddWaypoint?: (coordinates: { xPercent: number; yPercent: number }) => void;
  onSelectWaypoint?: (waypointId: string) => void;
  children?: React.ReactNode;
  disabled?: boolean;
}

const pinVariants = {
  hidden: { opacity: 0, scale: 0, y: 10 },
  visible: { opacity: 1, scale: 1, y: 0 },
  exit: { opacity: 0, scale: 0 },
};

export function InteractiveMap({
  imageUrl,
  waypoints,
  onAddWaypoint,
  onSelectWaypoint,
  selectedWaypointId,
  children,
  disabled,
}: InteractiveMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [hoveredWaypointId, setHoveredWaypointId] = useState<string | null>(null);
  const { t } = useTranslation();

  const handleClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (disabled || !imageUrl || !onAddWaypoint || !containerRef.current) {
      return;
    }

    const bounds = containerRef.current.getBoundingClientRect();
    const xPercent = Number((((event.clientX - bounds.left) / bounds.width) * 100).toFixed(3));
    const yPercent = Number((((event.clientY - bounds.top) / bounds.height) * 100).toFixed(3));

    if (xPercent < 0 || xPercent > 100 || yPercent < 0 || yPercent > 100) {
      return;
    }

    onAddWaypoint({ xPercent, yPercent });
  };

  return (
    <div
      ref={containerRef}
      className={cn(
        "interactive-map relative h-full w-full overflow-hidden bg-[#1a1a1a]",
        disabled && "cursor-not-allowed",
        !disabled && imageUrl && "cursor-crosshair",
      )}
      onClick={handleClick}
    >
      {imageUrl ? (
        <>
          <Image
            src={imageUrl}
            alt="World map"
            fill
            priority
            className="pointer-events-none select-none object-contain"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 75vw, 60vw"
          />
          {/* Subtle vignette */}
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.4)_100%)]" />
        </>
      ) : (
         /* Placeholder handled by parent usually, but fallback here */
        <div className="flex h-full w-full flex-col items-center justify-center gap-3 p-10 text-center opacity-50">
          <MapPin className="h-10 w-10 text-emerald-500/60" />
        </div>
      )}

      {/* Render children (like overlays) */}
      {children}

      {/* Pins Layer */}
      <AnimatePresence>
        {imageUrl &&
          waypoints.map((waypoint) => {
            const isSelected = selectedWaypointId === waypoint.id;
            const isHovered = hoveredWaypointId === waypoint.id;

            return (
              <motion.div
                key={waypoint.id}
                initial="hidden"
                animate="visible"
                exit="exit"
                variants={pinVariants}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="absolute z-10"
                style={{ left: `${waypoint.x}%`, top: `${waypoint.y}%` }}
              >
                <button
                  type="button"
                  className={cn(
                    "group relative -translate-x-1/2 -translate-y-full transform transition-transform focus:outline-none",
                    isSelected ? "z-20 scale-125" : "z-10 hover:scale-110",
                  )}
                  onClick={(event) => {
                    event.stopPropagation();
                    onSelectWaypoint?.(waypoint.id);
                  }}
                  onMouseEnter={() => setHoveredWaypointId(waypoint.id)}
                  onMouseLeave={() => setHoveredWaypointId(null)}
                >
                  {/* Pin Icon */}
                  <MapPin
                    className={cn(
                      "h-8 w-8 drop-shadow-md transition-colors",
                      isSelected
                        ? "fill-emerald-500 text-emerald-900"
                        : "fill-emerald-500/80 text-white/90 hover:fill-emerald-400",
                    )}
                  />
                  
                  {/* Ripple effect for selected pin */}
                  {isSelected && (
                    <span className="absolute left-1/2 top-full -translate-x-1/2 -translate-y-1/2 flex h-3 w-3">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-500"></span>
                    </span>
                  )}

                  {/* Tooltip Label */}
                  <div
                    className={cn(
                      "absolute bottom-full left-1/2 mb-1 -translate-x-1/2 whitespace-nowrap rounded-md px-2 py-1 text-xs font-bold text-white shadow-lg backdrop-blur-md transition-all",
                      isSelected
                        ? "bg-emerald-600 opacity-100"
                        : "bg-black/60 opacity-0 group-hover:opacity-100",
                    )}
                  >
                    {waypoint.name || "Waypoint"}
                    {/* Arrow down */}
                    <div className={cn(
                        "absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent",
                        isSelected ? "border-t-emerald-600" : "border-t-black/60"
                    )} />
                  </div>
                </button>
              </motion.div>
            );
          })}
      </AnimatePresence>
    </div>
  );
}
