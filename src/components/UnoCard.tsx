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
  sm: { w: "w-16", h: "h-24", corner: "text-[9px]", disc: "text-2xl" },
  md: { w: "w-20", h: "h-28", corner: "text-[11px]", disc: "text-3xl" },
  lg: { w: "w-28", h: "h-40", corner: "text-sm", disc: "text-5xl" },
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
        className={`uno-shell ${s.w} ${s.h} ${onClick ? "cursor-pointer" : ""} ${className}`}
        onClick={onClick}
      >
        <div className="uno-inner" style={{ background: "linear-gradient(160deg,#222 0%,#000 100%)" }}>
          {/* red diagonal oval */}
          <div
            className="absolute left-1/2 top-1/2"
            style={{ width: "128%", height: "50%", transform: "translate(-50%,-50%) rotate(-26deg)", borderRadius: "9999px", background: "linear-gradient(160deg,#ea271f,#b3120f)", boxShadow: "inset 0 2px 6px rgba(0,0,0,0.45), 0 1px 2px rgba(0,0,0,0.35)" }}
          />
          {/* gold italic UNO wordmark */}
          <div className="absolute inset-0 flex items-center justify-center">
            <span
              style={{
                fontFamily: "'Plus Jakarta Sans', sans-serif", fontStyle: "italic", fontWeight: 900,
                color: "#ffce3a", WebkitTextStroke: "0.05em rgba(0,0,0,0.55)", paintOrder: "stroke fill",
                transform: "rotate(-8deg)", textShadow: "0 2px 2px rgba(0,0,0,0.45)",
                fontSize: size === "lg" ? "1.5rem" : size === "md" ? "1.1rem" : "0.92rem",
              }}
            >
              UNO
            </span>
          </div>
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
        {/* white corner index, tucked into opposite corners (diagonal) */}
        <span className={`uno-corner ${s.corner} absolute top-0.5 left-1 leading-none`}>{corner}</span>
        <span className={`uno-corner ${s.corner} absolute bottom-0.5 right-1 rotate-180 leading-none`}>{corner}</span>

        {/* diagonal oval + big numeral */}
        <div
          className="uno-oval"
          style={isWild ? { background: "conic-gradient(#e74c3c 0deg 90deg,#f1c40f 90deg 180deg,#2ecc71 180deg 270deg,#3498db 270deg 360deg)" } : undefined}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <span
            className={`uno-glyph ${s.disc} ${isWild ? "text-white" : `glyph-${suit}`}`}
            style={isWild ? { textShadow: "0 2px 4px rgba(0,0,0,0.65)" } : undefined}
          >
            {center}
          </span>
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
