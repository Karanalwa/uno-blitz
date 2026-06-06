import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { LogIn, QrCode } from "lucide-react";
import { ScreenShell } from "@/components/ScreenShell";
import { useGameStore } from "@/store/gameStore";
import { useSound } from "@/hooks/useSound";
import { useMultiplayer } from "@/hooks/useMultiplayer";
import { AVATARS } from "@/engine/types";

const RECENT = [
  { code: "A7B8C9", mode: "Classic", players: "2/4" },
  { code: "F2GSH1", mode: "Stacking", players: "3/4" },
  { code: "K9L0M3", mode: "7-0", players: "1/4" },
];

export default function JoinRoom() {
  const navigate = useNavigate();
  const store = useGameStore();
  const sound = useSound();
  const { connected } = useMultiplayer();
  const [code, setCode] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (store.phase === "lobby" && store.roomCode) navigate("/lobby");
  }, [store.phase, store.roomCode, navigate]);

  const join = (c: string) => {
    if (c.length !== 6) return;
    const name = store.username || localStorage.getItem("uno_username") || "Player";
    store.setPlayerName(name);
    store.setPlayerAvatar(localStorage.getItem("uno_playerAvatar") || AVATARS[0]);
    sound.playButton();
    store.joinRoom(c, name);
  };

  return (
    <ScreenShell title="JOIN ROOM" back="/home" maxWidth="max-w-lg">
      <div className="glass rounded-2xl p-5">
        <p className="text-[10px] font-bold tracking-[0.15em] text-[#caa15a] mb-2 text-center">ENTER ROOM CODE</p>
        <div className="relative mb-4" onClick={() => inputRef.current?.focus()}>
          <div className="flex justify-center gap-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className={`otp-box flex items-center justify-center w-11 h-14 ${code.length === i ? "ring-2 ring-gold" : ""}`}>{code[i] ?? ""}</div>
            ))}
          </div>
          <input ref={inputRef} value={code} onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6))} maxLength={6} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" aria-label="Room code" />
        </div>

        <button onClick={() => join(code)} disabled={!connected || code.length !== 6} className="btn-3d btn-green w-full py-3.5 flex items-center justify-center gap-2 mb-3">
          <LogIn className="w-5 h-5" /> JOIN ROOM
        </button>

        <div className="flex items-center gap-3 my-3">
          <div className="flex-1 h-px bg-white/10" /><span className="text-xs text-gray-500">OR</span><div className="flex-1 h-px bg-white/10" />
        </div>
        <button onClick={() => sound.playButton()} className="btn-3d btn-purple w-full py-3 flex items-center justify-center gap-2 mb-5 text-sm">
          <QrCode className="w-4 h-4" /> SCAN QR CODE
        </button>

        <p className="text-[10px] font-bold tracking-[0.15em] text-[#caa15a] mb-2">RECENT ROOMS</p>
        <div className="space-y-2">
          {RECENT.map((r) => (
            <div key={r.code} className="panel-inset rounded-xl px-3 py-2.5 flex items-center gap-3">
              <div className="flex-1">
                <p className="font-display font-bold text-gold tracking-wider">{r.code}</p>
                <p className="text-[11px] text-gray-400">{r.mode} · 4 Players</p>
              </div>
              <span className="count-badge">{r.players}</span>
              <button onClick={() => { setCode(r.code); join(r.code); }} disabled={!connected} className="btn-3d btn-gold px-4 py-1.5 text-xs">JOIN</button>
            </div>
          ))}
        </div>
        {!connected && <p className="text-center text-[11px] text-gray-500 mt-3">Multiplayer server is offline.</p>}
      </div>
    </ScreenShell>
  );
}
