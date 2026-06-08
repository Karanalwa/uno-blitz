import { useRef, useState } from "react";
import { useNavigate } from "react-router";
import { motion } from "framer-motion";
import { Upload, ArrowRight } from "lucide-react";
import { useGameStore } from "@/store/gameStore";
import { useSound } from "@/hooks/useSound";
import { AVATARS } from "@/engine/types";
import { fileToAvatar } from "@/lib/avatarUpload";
import { getUserId } from "@/lib/identity";

export default function Welcome() {
  const navigate = useNavigate();
  const store = useGameStore();
  const sound = useSound();
  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState(AVATARS[0]);
  const [err, setErr] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const onUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setErr("");
      setAvatar(await fileToAvatar(file));
      sound.playButton();
    } catch (e: any) {
      setErr(e?.message || "Upload failed");
    }
  };

  const start = () => {
    const finalName = name.trim() || "Player";
    localStorage.setItem("uno_username", finalName);
    getUserId(); // create + persist this player's unique ID
    store.setPlayerName(finalName);
    store.setPlayerAvatar(avatar);
    sound.playUno();
    navigate("/home", { replace: true });
  };

  return (
    <div className="casino-bg min-h-[100dvh] w-full flex items-center justify-center p-4 text-[#ece6da]">
      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-3xl p-7 w-full max-w-sm text-center">
        <h1 className="font-display font-extrabold text-5xl tracking-tight mb-1" style={{ color: "#ffce3a", textShadow: "0 0 24px rgba(224,30,30,0.55), 0 3px 0 #a81212" }}>
          UNO<span className="text-unored">!</span>
        </h1>
        <p className="text-xs font-bold tracking-[0.3em] text-[#caa15a] mb-6">CREATE YOUR PLAYER</p>

        {/* avatar preview + upload */}
        <div className="flex flex-col items-center mb-5">
          <div className="frame-ring w-24 h-24 mb-3"><img src={avatar} alt="" className="w-full h-full rounded-2xl object-cover" /></div>
          <button onClick={() => fileRef.current?.click()} className="btn-3d btn-ghost px-4 py-2 text-xs flex items-center gap-2"><Upload className="w-3.5 h-3.5" /> Upload Photo</button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onUpload} />
          {err && <p className="text-[11px] text-suit-red mt-1">{err}</p>}
        </div>

        {/* preset avatars */}
        <div className="grid grid-cols-4 gap-2.5 mb-5">
          {AVATARS.map((av, i) => (
            <button key={i} onClick={() => { setAvatar(av); sound.playButton(); }} className={`transition-transform ${av === avatar ? "scale-105" : "opacity-55 hover:opacity-100"}`}>
              <div className={`w-full aspect-square frame-ring ${av === avatar ? "" : "opacity-70"}`}><img src={av} alt="" className="w-full h-full rounded-[0.6rem] object-cover" /></div>
            </button>
          ))}
        </div>

        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && start()}
          placeholder="Enter your name"
          maxLength={15}
          autoFocus
          className="w-full panel-inset rounded-xl px-4 py-3 text-center font-bold mb-4 focus:outline-none focus:ring-2 focus:ring-gold"
        />

        <button onClick={start} className="btn-3d btn-gold w-full py-3.5 flex items-center justify-center gap-2 text-base">
          Let's Play <ArrowRight className="w-5 h-5" />
        </button>
      </motion.div>
    </div>
  );
}
