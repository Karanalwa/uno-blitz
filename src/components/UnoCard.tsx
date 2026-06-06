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
  sm: { w: "w-16", h: "h-24", glyph: "text-2xl", corner: "text-[11px]", pad: "p-1" },
  md: { w: "w-20", h: "h-28", glyph: "text-3xl", corner: "text-sm", pad: "p-1.5" },
  lg: { w: "w-28", h: "h-40", glyph: "text-5xl", corner: "text-lg", pad: "p-2" },
};

// What to show in the center of the card
function centerGlyph(card: Card): string {
  if (card.type === "wild4") return "+4";
  if (card.type === "wild") return "★";
  if (card.type === "skip") return "⊘";
  if (card.type === "reverse") return "⇄";
  if (card.type === "draw2") return "+2";
  return card.display;
}

function cornerGlyph(card: Card): string {
  if (card.type === "wild4") return "+4";
  if (card.type === "wild") return "W";
  if (card.type === "skip") return "S";
  if (card.type === "reverse") return "R";
  if (card.type === "draw2") return "+2";
  return card.display;
}

export function UnoCard({
  card,
  size = "md",
  playable = false,
  faceDown = false,
  active = false,
  onClick,
  className = "",
}: UnoCardProps) {
  const s = sizeMap[size];

  if (faceDown) {
    return (
      <motion.div
        whileHover={onClick ? { y: -8, scale: 1.05 } : {}}
        whileTap={onClick ? { scale: 0.95 } : {}}
        className={`${s.w} ${s.h} rounded-2xl overflow-hidden shadow-lg ${onClick ? "cursor-pointer" : ""} ${className}`}
        onClick={onClick}
      >
        <img src="/assets/card-back.png" alt="Card back" className="w-full h-full object-cover" />
      </motion.div>
    );
  }

  const isWild = card.type === "wild" || card.type === "wild4";
  const suit = isWild ? "wild" : (card.color as "red" | "yellow" | "green" | "blue");
  const center = centerGlyph(card);
  const corner = cornerGlyph(card);

  return (
    <motion.div
      whileHover={onClick ? { y: -16, scale: 1.08 } : {}}
      whileTap={onClick ? { scale: 0.95 } : {}}
      className={`uno-shell ${s.w} ${s.h} ${onClick ? "cursor-pointer" : ""} ${
        active ? "card-active-glow" : playable ? "card-playable-glow" : ""
      } ${className}`}
      onClick={onClick}
    >
      <div className={`uno-inner suit-${suit}`}>
        {/* top-left corner */}
        <span className={`uno-corner ${s.corner} absolute top-1 left-1.5`}>{corner}</span>

        {/* white diagonal oval */}
        <div className="uno-oval" />

        {/* center glyph */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`uno-glyph ${s.glyph} glyph-${suit}`}>{center}</span>
        </div>

        {/* bottom-right corner (rotated) */}
        <span className={`uno-corner ${s.corner} absolute bottom-1 right-1.5 rotate-180`}>{corner}</span>
      </div>
    </motion.div>
  );
}

export function ColorPicker({
  onSelect,
  className = "",
}: {
  onSelect: (color: "red" | "blue" | "green" | "yellow") => void;
  className?: string;
}) {
  const colors: Array<{ color: "red" | "blue" | "green" | "yellow"; cls: string }> = [
    { color: "red", cls: "suit-red" },
    { color: "yellow", cls: "suit-yellow" },
    { color: "green", cls: "suit-green" },
    { color: "blue", cls: "suit-blue" },
  ];

  return (
    <div className={`grid grid-cols-2 gap-3 ${className}`}>
      {colors.map(({ color, cls }, i) => (
        <motion.button
          key={color}
          initial={{ scale: 0, rotate: -30 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: i * 0.05, type: "spring", stiffness: 320 }}
          whileHover={{ scale: 1.12, y: -4 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => onSelect(color)}
          aria-label={color}
          className={`${cls} w-16 h-16 rounded-2xl border-2 border-white/50 shadow-xl`}
        />
      ))}
    </div>
  );
}
