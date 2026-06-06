import { useMemo } from "react";
import { motion } from "framer-motion";

const COLORS = ["#e4322b", "#f6b500", "#18a558", "#1e7fd6", "#ffd15c", "#27d9f8", "#ffffff"];

interface ConfettiProps {
  /** number of pieces */
  count?: number;
  /** loop the burst forever (e.g. for a winner screen) */
  loop?: boolean;
}

/**
 * Lightweight viewport confetti burst. Pure Framer Motion — no external deps.
 * Pieces erupt from the top-center and rain down with rotation + drift.
 */
export function Confetti({ count = 90, loop = false }: ConfettiProps) {
  const pieces = useMemo(
    () =>
      Array.from({ length: count }).map((_, i) => {
        const angle = (Math.random() - 0.5) * 2; // -1..1 horizontal spread
        return {
          id: i,
          left: 50 + angle * 45, // vw, clustered toward center
          color: COLORS[i % COLORS.length],
          size: 6 + Math.random() * 8,
          delay: Math.random() * (loop ? 2.2 : 0.5),
          duration: 2.2 + Math.random() * 1.8,
          drift: (Math.random() - 0.5) * 220,
          rotate: (Math.random() - 0.5) * 720,
          rounded: Math.random() > 0.5,
        };
      }),
    [count, loop],
  );

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-[60]">
      {pieces.map((p) => (
        <motion.span
          key={p.id}
          initial={{ y: "-10vh", x: 0, opacity: 1, rotate: 0 }}
          animate={{ y: "110vh", x: p.drift, opacity: [1, 1, 0.9, 0], rotate: p.rotate }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            ease: "easeIn",
            repeat: loop ? Infinity : 0,
            repeatDelay: loop ? Math.random() * 1.5 : 0,
          }}
          style={{
            position: "absolute",
            left: `${p.left}%`,
            top: 0,
            width: p.size,
            height: p.size * (p.rounded ? 1 : 1.6),
            backgroundColor: p.color,
            borderRadius: p.rounded ? "9999px" : "2px",
            boxShadow: `0 0 6px ${p.color}88`,
          }}
        />
      ))}
    </div>
  );
}
