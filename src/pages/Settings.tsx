import { useState } from "react";
import { useNavigate } from "react-router";
import { Volume2, Image as ImageIcon, Gamepad2, Globe, User, Sliders, Copy, Check, LogOut, Trash2 } from "lucide-react";
import { ScreenShell } from "@/components/ScreenShell";
import { useSound } from "@/hooks/useSound";
import { useSettings, setSettings, type Settings } from "@/lib/settings";
import { useGameStore } from "@/store/gameStore";
import { getUserId } from "@/lib/identity";

const CATS = [
  { id: "General", icon: Sliders },
  { id: "Audio", icon: Volume2 },
  { id: "Graphics", icon: ImageIcon },
  { id: "Controls", icon: Gamepad2 },
  { id: "Language", icon: Globe },
  { id: "Account", icon: User },
];

const LANGS = ["English", "Español", "Français", "Deutsch", "हिन्दी", "中文", "العربية"];

export default function Settings() {
  const sound = useSound();
  const navigate = useNavigate();
  const store = useGameStore();
  const settings = useSettings();
  const [cat, setCat] = useState("General");

  const toggle = (k: keyof Settings) => { setSettings({ [k]: !settings[k] } as Partial<Settings>); sound.playButton(); };

  return (
    <ScreenShell title="SETTINGS" maxWidth="max-w-2xl">
      <div className="grid grid-cols-1 md:grid-cols-[160px_1fr] gap-4">
        {/* category rail */}
        <div className="glass rounded-2xl p-2 flex md:flex-col gap-1 h-fit overflow-x-auto">
          {CATS.map(({ id, icon: Icon }) => (
            <button key={id} onClick={() => setCat(id)} className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap ${cat === id ? "btn-3d btn-gold" : "text-gray-400 hover:bg-white/5"}`}>
              <Icon className="w-4 h-4" /> {id}
            </button>
          ))}
        </div>

        {/* content */}
        <div className="glass rounded-2xl p-5 space-y-3">
          {cat === "General" && (
            <>
              <ToggleRow label="Tutorial Hints" desc="Show helpful tips during play" on={settings.tutorialHints} onToggle={() => toggle("tutorialHints")} />
              <ToggleRow label="Show Turn Timer" desc="Display the countdown clock in-game" on={settings.showTimer} onToggle={() => toggle("showTimer")} />
              <ToggleRow label="Auto-Ready in Lobby" desc="Mark yourself ready automatically" on={settings.autoReady} onToggle={() => toggle("autoReady")} />
            </>
          )}

          {cat === "Audio" && (
            <>
              <ToggleRow label="Mute All" desc="Silence every sound" on={settings.muteAll} onToggle={() => toggle("muteAll")} />
              <Slider label="Sound Effects" value={settings.sfxVolume} disabled={settings.muteAll} onChange={(v) => setSettings({ sfxVolume: v })} onCommit={() => sound.playCard()} />
              <Slider label="Music" value={settings.musicVolume} disabled={settings.muteAll} onChange={(v) => setSettings({ musicVolume: v })} />
              <ToggleRow label="Announcer Voice" desc="Call-outs for UNO, Skip, etc." on={settings.announcer} onToggle={() => toggle("announcer")} />
            </>
          )}

          {cat === "Graphics" && (
            <>
              <ToggleRow label="Card Animation" desc="Deal, draw and play card motion" on={settings.cardAnimation} onToggle={() => toggle("cardAnimation")} />
              <ToggleRow label="Particle Effects" desc="Floating sparks and confetti" on={settings.particles} onToggle={() => toggle("particles")} />
              <ToggleRow label="Background Effects" desc="Glows, floating cards on menus" on={settings.backgroundFx} onToggle={() => toggle("backgroundFx")} />
              <ToggleRow label="Reduced Motion" desc="Minimise animations for comfort" on={settings.reducedMotion} onToggle={() => toggle("reducedMotion")} />
            </>
          )}

          {cat === "Controls" && (
            <>
              <ToggleRow label="Vibration" desc="Haptic feedback on actions" on={settings.vibration} onToggle={() => toggle("vibration")} />
              <ToggleRow label="Quick Play" desc="Single tap to play a card" on={settings.quickPlay} onToggle={() => toggle("quickPlay")} />
              <ToggleRow label="Confirm Before Play" desc="Ask before committing a card" on={settings.confirmPlay} onToggle={() => toggle("confirmPlay")} />
              <ToggleRow label="Left-Handed Layout" desc="Mirror controls" on={settings.leftHanded} onToggle={() => toggle("leftHanded")} />
            </>
          )}

          {cat === "Language" && (
            <div className="grid grid-cols-2 gap-2">
              {LANGS.map((l) => (
                <button key={l} onClick={() => { setSettings({ language: l }); sound.playButton(); }} className={`py-2.5 rounded-xl text-sm font-bold ${settings.language === l ? "btn-3d btn-gold" : "btn-3d btn-ghost"}`}>{l}</button>
              ))}
            </div>
          )}

          {cat === "Account" && <AccountSection store={store} navigate={navigate} sound={sound} />}

          <p className="text-[11px] text-gray-500 pt-1">Settings save automatically on this device.</p>
        </div>
      </div>
    </ScreenShell>
  );
}

function AccountSection({ store, navigate, sound }: { store: any; navigate: (p: string) => void; sound: any }) {
  const [name, setName] = useState(store.username || localStorage.getItem("uno_username") || "Player");
  const [copied, setCopied] = useState(false);
  const userId = getUserId();

  const saveName = () => { const n = name.trim() || "Player"; setName(n); localStorage.setItem("uno_username", n); store.setPlayerName(n); sound.playButton(); };
  const copyId = () => { navigator.clipboard?.writeText(userId); setCopied(true); setTimeout(() => setCopied(false), 1500); };
  const reset = () => {
    if (!confirm("Reset all progress? This clears your stats, coins, history and achievements.")) return;
    ["uno_stats", "uno_wallet", "uno_history", "uno_ach_claimed", "uno_daily_streak", "uno_daily_date"].forEach((k) => localStorage.removeItem(k));
    location.reload();
  };
  const logout = () => {
    if (!confirm("Log out? You'll be asked to set up your player again.")) return;
    ["uno_username", "uno_playerAvatar", "uno_userid"].forEach((k) => localStorage.removeItem(k));
    navigate("/welcome");
  };

  return (
    <div className="space-y-3">
      <div>
        <label className="text-xs text-[#caa15a] mb-1 block">Display Name</label>
        <div className="flex gap-2">
          <input value={name} onChange={(e) => setName(e.target.value)} maxLength={15} className="flex-1 panel-inset rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gold" />
          <button onClick={saveName} className="btn-3d btn-gold px-4 text-sm">Save</button>
        </div>
      </div>
      <div>
        <label className="text-xs text-[#caa15a] mb-1 block">Player ID</label>
        <button onClick={copyId} className="w-full panel-inset rounded-lg px-3 py-2 flex items-center justify-between hover:brightness-125 transition">
          <span className="font-display font-bold text-gold tracking-wider">{userId}</span>
          {copied ? <span className="text-[11px] text-emerald-400 flex items-center gap-1"><Check className="w-3.5 h-3.5" /> Copied</span> : <Copy className="w-4 h-4 text-gray-400" />}
        </button>
      </div>
      <div className="pt-2 flex flex-col gap-2">
        <button onClick={reset} className="btn-3d btn-ghost w-full py-2.5 text-sm flex items-center justify-center gap-2 text-suit-red"><Trash2 className="w-4 h-4" /> Reset Progress</button>
        <button onClick={logout} className="btn-3d btn-red w-full py-2.5 text-sm flex items-center justify-center gap-2"><LogOut className="w-4 h-4" /> Log Out</button>
      </div>
    </div>
  );
}

function Slider({ label, value, onChange, onCommit, disabled }: { label: string; value: number; onChange: (n: number) => void; onCommit?: () => void; disabled?: boolean }) {
  return (
    <div className={`border-b border-white/5 pb-3 ${disabled ? "opacity-40" : ""}`}>
      <div className="flex items-center justify-between mb-2"><span className="text-sm text-gray-200">{label}</span><span className="text-xs font-bold text-gold">{value}%</span></div>
      <input type="range" min={0} max={100} value={value} disabled={disabled} onChange={(e) => onChange(parseInt(e.target.value))} onMouseUp={onCommit} onTouchEnd={onCommit} className="w-full accent-gold" />
    </div>
  );
}

function ToggleRow({ label, desc, on, onToggle }: { label: string; desc?: string; on: boolean; onToggle: () => void }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-white/5 gap-3">
      <div className="min-w-0">
        <p className="text-sm text-gray-200">{label}</p>
        {desc && <p className="text-[11px] text-gray-500">{desc}</p>}
      </div>
      <button onClick={onToggle} className={`toggle-pill flex flex-shrink-0 ${on ? "toggle-on justify-end" : "toggle-off justify-start"}`}><span className="toggle-knob" /></button>
    </div>
  );
}
