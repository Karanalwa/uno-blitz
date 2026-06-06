import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { motion } from "framer-motion";

const FLOATERS = [
  { label: "2", cls: "suit-red", glyph: "glyph-red", top: "12%", left: "12%", rot: -18, d: 0 },
  { label: "9", cls: "suit-blue", glyph: "glyph-blue", top: "18%", left: "82%", rot: 16, d: 0.3 },
  { label: "8", cls: "suit-green", glyph: "glyph-green", top: "68%", left: "16%", rot: 12, d: 0.6 },
  { label: "+2", cls: "suit-yellow", glyph: "glyph-yellow", top: "72%", left: "80%", rot: -14, d: 0.2 },
  { label: "+4", cls: "suit-wild", glyph: "glyph-wild", top: "40%", left: "88%", rot: 22, d: 0.5 },
  { label: "5", cls: "suit-red", glyph: "glyph-red", top: "44%", left: "6%", rot: -22, d: 0.4 },
];

export default function Splash() {
  const navigate = useNavigate();
  const [pct, setPct] = useState(0);

  useEffect(() => {
    const iv = setInterval(() => setPct((p) => Math.min(100, p + Math.random() * 14 + 4)), 180);
    const to = setTimeout(() => navigate("/home", { replace: true }), 2600);
    return () => { clearInterval(iv); clearTimeout(to); };
  }, [navigate]);

  return (
    <div className="felt-table h-[100dvh] w-full flex flex-col items-center justify-center overflow-hidden relative select-none">
      {/* radial glow */}
      <div className="absolute w-[120vw] h-[120vw] rounded-full" style={{ background: "radial-gradient(circle, rgba(224,30,30,0.5) 0%, transparent 55%)" }} />

      {/* floating cards */}
      {FLOATERS.map((c, i) => (
        <motion.div key={i} className="absolute" style={{ top: c.top, left: c.left }}
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{ opacity: 1, scale: 1, y: [0, -16, 0], rotate: c.rot }}
          transition={{ opacity: { delay: c.d }, scale: { delay: c.d }, y: { duration: 3 + i * 0.3, repeat: Infinity }, rotate: { delay: c.d } }}>
          <div className="uno-shell w-16 h-24 sm:w-20 sm:h-28">
            <div className={`uno-inner ${c.cls}`}><div className="uno-oval" /><div className="absolute inset-0 flex items-center justify-center"><span className={`uno-glyph text-2xl ${c.glyph}`}>{c.label}</span></div></div>
          </div>
        </motion.div>
      ))}

      {/* logo */}
      <motion.h1 initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 160, damping: 12 }}
        className="font-display font-extrabold text-7xl sm:text-8xl tracking-tight relative z-10"
        style={{ color: "#ffce3a", textShadow: "0 0 40px rgba(224,30,30,0.8), 0 5px 0 #a81212, 0 8px 18px rgba(0,0,0,0.7)" }}>
        UNO<span className="text-unored">!</span>
      </motion.h1>

      {/* loading bar */}
      <div className="relative z-10 mt-10 w-64">
        <div className="panel-inset rounded-full h-3 overflow-hidden">
          <motion.div className="h-full rounded-full" style={{ width: `${pct}%`, background: "linear-gradient(90deg, #ffd255, #f0a818)" }} transition={{ ease: "linear" }} />
        </div>
        <p className="text-center text-[11px] font-bold tracking-[0.2em] text-[#caa15a] mt-2">LOADING… {Math.round(pct)}%</p>
      </div>
    </div>
  );
}
