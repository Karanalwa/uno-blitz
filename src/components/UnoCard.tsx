import { motion } from "framer-motion";
import type { Card } from "../../api/game/types";

interface UnoCardProps {
  card: Card;
  size?: "sm" | "md" | "lg";
  playable?: boolean;
  faceDown?: boolean;
  active?: boolean;
  onClick?: () => void;
  className?: string;
}

const sizeMap = {
  sm: { w: "w-16", h: "h-24", glyph: "text-xl", corner: "text-[11px]", disc: "text-lg" },
  md: { w: "w-20", h: "h-28", glyph: "text-2xl", corner: "text-sm", disc: "text-xl" },
  lg: { w: "w-28", h: "h-40", glyph: "text-4xl", corner: "text-lg", disc: "text-3xl" },
};

function centerGlyph(card: Card): string {
  if (card.type === "wild4") return "+4";
  if (card.type === "wild") return "★";
  if (card.type === "skip") return "⊘";
  if (card.type === "reverse") return "↻";
  if (card.type === "draw2") return "+2";
  return card.display;
}
function cornerGlyph(card: Card): string {
  if (card.type === "wild4") return "+4";
  if (card.type === "wild") return "W";
  if (card.type === "skip") return "⊘";
  if (card.type === "reverse") return "↻";
  if (card.type === "draw2") return "+2";
  return card.display;
}

export function UnoCard({ card, size = "md", playable = false, faceDown = false, active = false, onClick, className = "" }: UnoCardProps) {
  const s = sizeMap[size];

  if (faceDown) {
    return (
      <motion.div
        whileHover={onClick ? { y: -5, scale: 1.05 } : {}}
        className={`${s.w} ${s.h} rounded-xl relative overflow-hidden ${onClick ? "cursor-pointer" : ""} ${className}`}
        style={{ background: "linear-gradient(135deg,#1a1a2e 0%,#0f0f1a 100%)", border: "2px solid rgba(245,166,35,0.3)", boxShadow: "0 8px 32px rgba(0,0,0,0.6)" }}
        onClick={onClick}
      >
        <div className="absolute inset-2 rounded-lg" style={{ border: "2px solid rgba(245,166,35,0.5)" }} />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="font-display font-black -rotate-[15deg]" style={{ color: "rgba(245,166,35,0.65)", fontSize: size === "lg" ? "1.4rem" : "1rem" }}>UNO</span>
        </div>
      </motion.div>
    );
  }

  const isWild = card.type === "wild" || card.type === "wild4";
  const suit = isWild ? "wild" : (card.color as "red" | "yellow" | "green" | "blue");
  const center = centerGlyph(card);
  const corner = cornerGlyph(card);

  return (
    <motion.div
      whileHover={onClick ? { y: -14, scale: 1.08, zIndex: 50 } : { y: -4 }}
      whileTap={onClick ? { scale: 0.95 } : {}}
      transition={{ type: "spring", stiffness: 320, damping: 22 }}
      className={`uno-shell ${s.w} ${s.h} ${onClick ? "cursor-pointer" : ""} ${active ? "card-active-glow" : playable ? "card-playable-glow" : ""} ${className}`}
      onClick={onClick}
    >
      <div className={`uno-inner suit-${suit}`}>
        {/* wild 4-quadrant tint */}
        {isWild && (
          <div className="absolute inset-1 rounded-lg overflow-hidden opacity-40 z-0">
            <div className="absolute top-0 left-0 w-1/2 h-1/2 bg-suit-red" />
            <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-suit-yellow" />
            <div className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-suit-blue" />
            <div className="absolute bottom-0 right-0 w-1/2 h-1/2 bg-suit-green" />
          </div>
        )}

        {/* corners */}
        <span className={`uno-corner glyph-${suit} ${s.corner} absolute top-1 left-1.5`}>{corner}</span>
        <span className={`uno-corner glyph-${suit} ${s.corner} absolute bottom-1 right-1.5 rotate-180`}>{corner}</span>

        {/* center disc + glyph */}
        <div className="uno-oval" style={isWild ? { background: "linear-gradient(135deg,#e74c3c,#f1c40f,#3498db)" } : undefined} />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`uno-glyph glyph-${suit} ${s.disc}`}>{center}</span>
        </div>
      </div>
    </motion.div>
  );
}

export function ColorPicker({ onSelect, className = "" }: { onSelect: (color: "red" | "blue" | "green" | "yellow") => void; className?: string }) {
  const colors: Array<{ color: "red" | "blue" | "green" | "yellow"; cls: string }> = [
    { color: "red", cls: "suit-red" },
    { color: "blue", cls: "suit-blue" },
    { color: "green", cls: "suit-green" },
    { color: "yellow", cls: "suit-yellow" },
  ];
  return (
    <div className={`grid grid-cols-2 gap-3 ${className}`}>
      {colors.map(({ color, cls }, i) => (
        <motion.button
          key={color}
          initial={{ scale: 0, rotate: -30 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: i * 0.05, type: "spring", stiffness: 320 }}
          whileHover={{ scale: 1.1, y: -4 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => onSelect(color)}
          aria-label={color}
          className={`${cls} w-16 h-16 rounded-2xl border-2 border-white/50 shadow-xl`}
        />
      ))}
    </div>
  );
}
