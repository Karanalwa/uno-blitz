import { motion } from "framer-motion";
import type { CSSProperties } from "react";
import type { Card } from "../../api/game/types";

interface UnoCardProps {
  card: Card;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  playable?: boolean;
  faceDown?: boolean;
  active?: boolean;
  onClick?: () => void;
  className?: string;
}

// Responsive pixel widths that scale with viewport via CSS variables
const sizeMap = {
  xs: { cw: "var(--card-sm)", aspect: "aspect-[2/3]" },
  sm: { cw: "var(--card-sm)", aspect: "aspect-[2/3]" },
  md: { cw: "var(--card-md)", aspect: "aspect-[2/3]" },
  lg: { cw: "var(--card-lg)", aspect: "aspect-[2/3]" },
  xl: { cw: "var(--card-xl)", aspect: "aspect-[2/3]" },
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
  const cwStyle = { "--cw": s.cw } as CSSProperties;

  if (faceDown) {
    return (
      <motion.div
        whileHover={onClick ? { y: -5, scale: 1.05 } : {}}
        className={`uno-shell ${s.aspect} ${onClick ? "cursor-pointer" : ""} ${className}`}
        style={cwStyle}
        onClick={onClick}
      >
        <div className="uno-inner" style={{ background: "linear-gradient(160deg,#222 0%,#000 100%)" }}>
          <div className="absolute left-1/2 top-1/2" style={{ width: "75%", height: "85%", transform: "translate(-50%,-50%) rotate(40deg)", borderRadius: "50%", border: "calc(var(--cw)*0.05) solid #fff", background: "radial-gradient(circle at 50% 42%,#ff3b33,#c40d0d)", boxShadow: "inset 0 2px 6px rgba(0,0,0,0.4)" }} />
          <div className="absolute inset-0 flex items-center justify-center">
            <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontStyle: "italic", fontWeight: 900, color: "#ffce3a", WebkitTextStrokeWidth: "calc(var(--cw)*0.018)", WebkitTextStrokeColor: "rgba(0,0,0,0.6)", paintOrder: "stroke fill", transform: "rotate(-20deg)", textShadow: "0 2px 2px rgba(0,0,0,0.45)", fontSize: "calc(var(--cw)*0.26)" }}>UNO</span>
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
      whileHover={onClick ? { y: -8, scale: 1.06, rotateX: 8, rotateY: 5, zIndex: 50 } : { y: -4 }}
      whileTap={onClick ? { scale: 0.95, rotateX: 0, rotateY: 0 } : {}}
      transition={{ type: "spring", stiffness: 320, damping: 22 }}
      style={{ ...cwStyle, transformPerspective: 800 }}
      className={`uno-shell ${s.aspect} ${onClick ? "cursor-pointer" : ""} ${active ? "card-active-glow" : playable ? "card-playable-glow" : ""} ${className}`}
      onClick={onClick}
    >
      <div className={`uno-inner suit-${suit}`}>
        {/* corner indices (top-left, bottom-right) */}
        <span className="uno-corner" style={{ top: "calc(var(--cw)*0.06)", left: "calc(var(--cw)*0.08)" }}>{corner}</span>
        <span className="uno-corner rotate-180" style={{ bottom: "calc(var(--cw)*0.06)", right: "calc(var(--cw)*0.08)" }}>{corner}</span>

        {/* large rotated oval */}
        <div
          className="uno-oval"
          style={isWild ? { background: "conic-gradient(#ff0000 0deg 90deg,#ffcc00 90deg 180deg,#00aa44 180deg 270deg,#0066ff 270deg 360deg)" } : undefined}
        />

        {/* huge centre numeral */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span
            className={`uno-glyph ${isWild ? "text-white" : `glyph-${suit}`}`}
            style={center.length > 1 ? { fontSize: "calc(var(--cw)*0.42)" } : undefined}
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
