import { useState } from "react";
import { ScreenShell } from "@/components/ScreenShell";
import { useSound } from "@/hooks/useSound";

const CATS = ["General", "Audio", "Graphics", "Controls", "Language", "Account"];

export default function Settings() {
  const sound = useSound();
  const [cat, setCat] = useState("General");
  const [sfx, setSfx] = useState(80);
  const [music, setMusic] = useState(60);
  const [toggles, setToggles] = useState({ vibration: true, announcer: true, cardAnim: true, tutorial: true });
  const set = (k: keyof typeof toggles) => { sound.playButton(); setToggles((t) => ({ ...t, [k]: !t[k] })); };

  return (
    <ScreenShell title="SETTINGS" maxWidth="max-w-2xl">
      <div className="grid grid-cols-1 md:grid-cols-[150px_1fr] gap-4">
        <div className="glass rounded-2xl p-2 flex md:flex-col gap-1 h-fit overflow-x-auto">
          {CATS.map((c) => (
            <button key={c} onClick={() => setCat(c)} className={`px-3 py-2.5 rounded-xl text-xs font-bold text-left whitespace-nowrap ${cat === c ? "btn-3d btn-gold" : "text-gray-400 hover:bg-white/5"}`}>{c}</button>
          ))}
        </div>

        <div className="glass rounded-2xl p-5 space-y-4">
          <Slider label="Sound Effects" value={sfx} onChange={setSfx} />
          <Slider label="Music" value={music} onChange={setMusic} />
          <ToggleRow label="Vibration" on={toggles.vibration} onToggle={() => set("vibration")} />
          <ToggleRow label="Announcer Voice" on={toggles.announcer} onToggle={() => set("announcer")} />
          <ToggleRow label="Card Animation" on={toggles.cardAnim} onToggle={() => set("cardAnim")} />
          <ToggleRow label="Tutorial Hints" on={toggles.tutorial} onToggle={() => set("tutorial")} />
        </div>
      </div>
    </ScreenShell>
  );
}

function Slider({ label, value, onChange }: { label: string; value: number; onChange: (n: number) => void }) {
  return (
    <div className="border-b border-white/5 pb-3">
      <div className="flex items-center justify-between mb-2"><span className="text-sm text-gray-200">{label}</span><span className="text-xs font-bold text-gold">{value}%</span></div>
      <input type="range" min={0} max={100} value={value} onChange={(e) => onChange(parseInt(e.target.value))} className="w-full accent-gold" />
    </div>
  );
}

function ToggleRow({ label, on, onToggle }: { label: string; on: boolean; onToggle: () => void }) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-white/5">
      <span className="text-sm text-gray-200">{label}</span>
      <button onClick={onToggle} className={`toggle-pill flex ${on ? "toggle-on justify-end" : "toggle-off justify-start"}`}><span className="toggle-knob" /></button>
    </div>
  );
}
