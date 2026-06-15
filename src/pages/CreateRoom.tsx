import { useEffect, useState, type ReactNode } from "react";
import { useNavigate } from "react-router";
import { Users, Lock, Globe } from "lucide-react";
import { ScreenShell } from "@/components/ScreenShell";
import { useGameStore } from "@/store/gameStore";
import { useSound } from "@/hooks/useSound";
import { useMultiplayer } from "@/hooks/useMultiplayer";
import { AVATARS } from "@/engine/types";

const PLAYER_OPTS = [2, 3, 4, 6];
const MODE_OPTS = ["Classic", "Stacking", "7-0", "Jump-In"];

export default function CreateRoom() {
  const navigate = useNavigate();
  const store = useGameStore();
  const sound = useSound();
  const { connected } = useMultiplayer();

  const [players, setPlayers] = useState(4);
  const [modeIdx, setModeIdx] = useState(0);
  const [isPrivate, setIsPrivate] = useState(false);
  const [plus2, setPlus2] = useState(true);
  const [showCards, setShowCards] = useState(true);

  useEffect(() => {
    if (store.phase === "lobby" && store.roomCode) navigate("/lobby");
  }, [store.phase, store.roomCode, navigate]);

  const handleCreate = () => {
    const name = store.username || localStorage.getItem("uno_username") || "Player";
    store.setPlayerName(name);
    store.setPlayerAvatar(localStorage.getItem("uno_playerAvatar") || AVATARS[0]);
    sound.playButton();
    store.createRoom({ name: `${name}'s Room`, maxPlayers: players, mode: modeIdx === 0 ? "classic" : "quick", turnTimer: 30 }, name);
  };

  return (
    <ScreenShell title="CREATE ROOM" back="/home" maxWidth="max-w-lg">
      <div className="glass rounded-2xl p-4 sm:p-5 space-y-5">
        {/* Players */}
        <Section label="PLAYERS">
          <div className="grid grid-cols-4 gap-2">
            {PLAYER_OPTS.map((n) => (
              <button key={n} onClick={() => { setPlayers(n); sound.playButton(); }} className={`btn-3d ${players === n ? "btn-gold" : "btn-ghost"} py-2.5 text-sm touch-target`}>{n} Players</button>
            ))}
          </div>
        </Section>

        {/* Mode */}
        <Section label="GAME MODE">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {MODE_OPTS.map((m, i) => (
              <button key={m} onClick={() => { setModeIdx(i); sound.playButton(); }} className={`btn-3d ${modeIdx === i ? "btn-gold" : "btn-ghost"} py-2.5 text-xs touch-target`}>{m}</button>
            ))}
          </div>
        </Section>

        {/* Privacy */}
        <Section label="ROOM PRIVACY">
          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => setIsPrivate(false)} className={`btn-3d ${!isPrivate ? "btn-green" : "btn-ghost"} py-2.5 text-sm flex items-center justify-center gap-2 touch-target`}><Globe className="w-4 h-4" /> Public Room</button>
            <button onClick={() => setIsPrivate(true)} className={`btn-3d ${isPrivate ? "btn-purple" : "btn-ghost"} py-2.5 text-sm flex items-center justify-center gap-2 touch-target`}><Lock className="w-4 h-4" /> Private Room</button>
          </div>
        </Section>

        {/* Advanced */}
        <Section label="ADVANCED SETTINGS">
          <ToggleRow label="+2 On Draw" on={plus2} onToggle={() => { setPlus2((v) => !v); sound.playButton(); }} />
          <ToggleRow label="Show Cards to Opponent" on={showCards} onToggle={() => { setShowCards((v) => !v); sound.playButton(); }} />
        </Section>

        <button onClick={handleCreate} disabled={!connected} className="btn-3d btn-gold w-full py-3.5 flex items-center justify-center gap-2 text-base touch-target">
          <Users className="w-5 h-5" /> {connected ? "CREATE ROOM" : "Connecting…"}
        </button>
        {!connected && <p className="text-center text-[11px] text-gray-500">Multiplayer server is offline — try Solo from the home screen.</p>}
      </div>
    </ScreenShell>
  );
}

function Section({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <p className="text-[10px] font-bold tracking-[0.15em] text-[#caa15a] mb-2">{label}</p>
      {children}
    </div>
  );
}

function ToggleRow({ label, on, onToggle }: { label: string; on: boolean; onToggle: () => void }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-white/5">
      <span className="text-sm text-gray-200">{label}</span>
      <button onClick={onToggle} className={`toggle-pill flex ${on ? "toggle-on justify-end" : "toggle-off justify-start"}`}><span className="toggle-knob" /></button>
    </div>
  );
}
