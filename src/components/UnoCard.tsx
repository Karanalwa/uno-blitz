import { motion } from "framer-motion";
import type { Card } from "../../api/game/types";

interface UnoCardProps {
  card: Card;
  size?: "sm" | "md" | "lg";
  playable?: boolean;
  faceDown?: boolean;
  onClick?: () => void;
  className?: string;
}

const colorMap: Record<string, string> = {
  red: "from-[#E84855] to-[#c73a47]",
  blue: "from-[#0077B6] to-[#006094]",
  green: "from-[#2A9D8F] to-[#228377]",
  yellow: "from-[#E9C46A] to-[#d4b055]",
  wild: "from-[#1a1a2e] to-[#16213e]",
};

const sizeMap = {
  sm: { w: "w-14", h: "h-20", text: "text-lg", corner: "text-[8px]", inner: "w-10 h-14", pad: "p-1" },
  md: { w: "w-20", h: "h-28", text: "text-2xl", corner: "text-[10px]", inner: "w-14 h-20", pad: "p-1.5" },
  lg: { w: "w-28", h: "h-40", text: "text-4xl", corner: "text-xs", inner: "w-20 h-28", pad: "p-2" },
};

export function UnoCard({ card, size = "md", playable = false, faceDown = false, onClick, className = "" }: UnoCardProps) {
  const s = sizeMap[size];

  if (faceDown) {
    return (
      <motion.div
        whileHover={onClick ? { y: -8, scale: 1.05 } : {}}
        whileTap={onClick ? { scale: 0.95 } : {}}
        className={`${s.w} ${s.h} rounded-xl border-2 border-gray-600 flex items-center justify-center shadow-lg cursor-pointer ${className}`}
        onClick={onClick}
      >
        <img src="/assets/card-back.png" alt="Card back" className={`${s.w} ${s.h} rounded-xl object-cover`} />
      </motion.div>
    );
  }

  const isWild = card.type === "wild" || card.type === "wild4";
  const gradient = colorMap[card.color] || colorMap.wild;
  const playableClass = playable ? "uno-card-playable" : "";

  return (
    <motion.div
      whileHover={onClick ? { y: -12, scale: 1.08 } : {}}
      whileTap={onClick ? { scale: 0.95 } : {}}
      className={`${s.w} ${s.h} rounded-xl bg-gradient-to-br ${gradient} border-2 border-white/20 
        flex flex-col items-center justify-between shadow-lg cursor-pointer select-none
        ${playableClass} ${className}`}
      onClick={onClick}
    >
      {/* Top-left corner */}
      <div className={`${s.pad} self-start`}>
        <span className={`${s.corner} font-bold text-white drop-shadow`}>
          {isWild ? (card.type === "wild4" ? "+4" : "W") : card.display}
        </span>
      </div>

      {/* Center */}
      <div className={`${s.inner} rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm`}>
        {isWild ? (
          card.type === "wild4" ? (
            <div className="w-full h-full rounded-full bg-gradient-to-br from-red-500 via-blue-500 via-yellow-500 to-green-500 flex items-center justify-center">
              <span className={`${s.text} font-black text-white drop-shadow-lg`}>+4</span>
            </div>
          ) : (
            <div className="w-full h-full rounded-full bg-gradient-to-br from-red-500 via-blue-500 to-green-500 flex items-center justify-center">
              <span className={`${s.text} font-black text-white drop-shadow-lg`}>W</span>
            </div>
          )
        ) : (
          <span className={`${s.text} font-black text-white drop-shadow-lg`}>
            {card.type === "skip" ? "S" : card.type === "reverse" ? "R" : card.type === "draw2" ? "+2" : card.display}
          </span>
        )}
      </div>

      {/* Bottom-right corner (rotated) */}
      <div className={`${s.pad} self-end rotate-180`}>
        <span className={`${s.corner} font-bold text-white drop-shadow`}>
          {isWild ? (card.type === "wild4" ? "+4" : "W") : card.display}
        </span>
      </div>
    </motion.div>
  );
}

export function ColorPicker({ onSelect, className = "" }: { onSelect: (color: "red" | "blue" | "green" | "yellow") => void; className?: string }) {
  const colors: Array<{ color: "red" | "blue" | "green" | "yellow"; bg: string }> = [
    { color: "red", bg: "from-[#E84855] to-[#c73a47]" },
    { color: "blue", bg: "from-[#0077B6] to-[#006094]" },
    { color: "green", bg: "from-[#2A9D8F] to-[#228377]" },
    { color: "yellow", bg: "from-[#E9C46A] to-[#d4b055]" },
  ];

  return (
    <div className={`flex gap-3 ${className}`}>
      {colors.map(({ color, bg }) => (
        <motion.button
          key={color}
          whileHover={{ scale: 1.15, y: -5 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => onSelect(color)}
          className={`w-16 h-16 rounded-full bg-gradient-to-br ${bg} border-3 border-white/40 shadow-xl`}
        />
      ))}
    </div>
  );
}
