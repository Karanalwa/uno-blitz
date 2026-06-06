import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { motion, AnimatePresence } from "framer-motion";
import { Users, LogIn, Sparkles, Wifi, WifiOff, Play, Bot, HelpCircle } from "lucide-react";
import { useGameStore } from "@/store/gameStore";
import { useSound } from "@/hooks/useSound";
import { useMultiplayer } from "@/hooks/useMultiplayer";
import { AVATARS } from "@/engine/types";

export default function Home() {
  const navigate = useNavigate();
  const store = useGameStore();
  const sound = useSound();
  const { connected } = useMultiplayer();

  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [showSoloSetup, setShowSoloSetup] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [username, setUsername] = useState(store.username || localStorage.getItem("uno_username") || "");
  const [roomCode, setRoomCode] = useState("");
  const [maxPlayers, setMaxPlayers] = useState(4);
  const [mode, setMode] = useState<"classic" | "quick">("classic");
  const [botCount, setBotCount] = useState(3);
  const [avatarIndex, setAvatarIndex] = useState(0);

  // Navigate to lobby when room created/joined
  useEffect(() => {
    if (store.phase === "lobby" && store.roomCode) {
      navigate("/lobby");
    }
  }, [store.phase, store.roomCode, navigate]);

  const handleCreate = () => {
    if (!username.trim()) return;
    sound.playButton();
    store.createRoom({ name: `${username}'s Room`, maxPlayers, mode, turnTimer: 30 }, username.trim());
  };

  const handleJoin = () => {
    if (!username.trim() || roomCode.length !== 6) return;
    sound.playButton();
    store.joinRoom(roomCode, username.trim());
  };

  const handleSoloPlay = () => {
    if (!username.trim()) return;
    sound.playButton();
    localStorage.setItem("uno_username", username.trim());
    store.setPlayerName(username.trim());
    store.setPlayerAvatar(AVATARS[avatarIndex]);
    store.setSettings({ botCount, mode });
    store.startLocalGame();
    navigate("/game");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0D1B2A] via-[#0f2235] to-[#0D1B2A] flex flex-col items-center justify-center relative overflow-hidden">
      {/* Floating particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 20 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 rounded-full bg-white/10"
            style={{ left: `${(i * 37 + 13) % 100}%`, top: `${(i * 23 + 7) % 100}%` }}
            animate={{ y: [0, -30, 0], opacity: [0.1, 0.3, 0.1] }}
            transition={{ duration: 3 + (i % 3), repeat: Infinity, delay: (i % 5) * 0.5 }}
          />
        ))}
      </div>

      {/* Title */}
      <motion.div initial={{ y: -50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.8, type: "spring" }} className="text-center mb-8 z-10">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Sparkles className="w-8 h-8 text-yellow-400" />
          <h1 className="text-7xl md:text-9xl font-black tracking-tight">
            <span className="bg-gradient-to-r from-[#E84855] via-[#0077B6] to-[#2A9D8F] bg-clip-text text-transparent">UNO</span>
          </h1>
          <Sparkles className="w-8 h-8 text-yellow-400" />
        </div>
        <p className="text-2xl text-[#A8DADC] font-medium tracking-[0.3em]">BLITZ</p>
      </motion.div>

      {/* Username */}
      <div className="w-80 mb-6 z-10">
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Enter your name"
          maxLength={15}
          className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white text-center text-lg placeholder-gray-500 focus:outline-none focus:border-cyan-400 focus:bg-white/15 transition-all"
        />
      </div>

      {/* Main Menu */}
      <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.6, delay: 0.3 }} className="flex flex-col gap-3 w-80 z-10">
        {/* Solo Play - Always Works */}
        <button
          onClick={() => { if (!username.trim()) { setUsername("Player"); } setShowSoloSetup(true); }}
          className="flex items-center justify-center gap-3 py-4 rounded-xl bg-gradient-to-r from-[#2A9D8F] to-[#0077B6] text-white font-bold text-lg shadow-lg shadow-teal-500/30 hover:shadow-teal-500/50 hover:-translate-y-0.5 transition-all"
        >
          <Bot className="w-6 h-6" />
          Play Solo
        </button>

        {/* Multiplayer */}
        <button
          onClick={() => { if (!username.trim()) return; sound.playButton(); setShowCreate(true); }}
          disabled={!connected}
          className="flex items-center justify-center gap-3 py-4 rounded-xl bg-gradient-to-r from-[#0077B6] to-[#2A9D8F] text-white font-bold text-lg shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 hover:-translate-y-0.5 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Users className="w-6 h-6" />
          Create Room
          {!connected && <span className="text-xs font-normal opacity-60">(offline)</span>}
        </button>

        <button
          onClick={() => { if (!username.trim()) return; sound.playButton(); setShowJoin(true); }}
          disabled={!connected}
          className="flex items-center justify-center gap-3 py-4 rounded-xl bg-gradient-to-r from-[#E9C46A] to-[#d4a93a] text-[#0D1B2A] font-bold text-lg shadow-lg shadow-yellow-500/30 hover:shadow-yellow-500/50 hover:-translate-y-0.5 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <LogIn className="w-6 h-6" />
          Join Room
          {!connected && <span className="text-xs font-normal opacity-60">(offline)</span>}
        </button>

        <button
          onClick={() => setShowHelp(true)}
          className="flex items-center justify-center gap-2 py-3 rounded-xl bg-white/10 text-white font-medium hover:bg-white/20 transition-all border border-white/10"
        >
          <HelpCircle className="w-5 h-5 text-cyan-400" />
          How to Play
        </button>

        {/* Connection status */}
        <div className="flex items-center justify-center gap-2 mt-1">
          {connected ? (
            <span className="flex items-center gap-1 text-xs text-green-400">
              <Wifi className="w-3 h-3" /> Server Online - Multiplayer Ready
            </span>
          ) : (
            <span className="flex items-center gap-1 text-xs text-yellow-400">
              <WifiOff className="w-3 h-3" /> Solo mode available
            </span>
          )}
        </div>
      </motion.div>

      {/* Solo Setup Modal */}
      <AnimatePresence>
        {showSoloSetup && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowSoloSetup(false)}>
            <motion.div initial={{ scale: 0.8, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.8, y: 20 }}
              className="bg-[#1B2838] rounded-2xl p-6 w-full max-w-sm border border-white/10 shadow-2xl"
              onClick={(e) => e.stopPropagation()}>
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2"><Bot className="w-5 h-5 text-teal-400" /> Solo Setup</h2>

              {/* Avatar */}
              <div className="mb-3">
                <label className="text-xs text-gray-400 mb-1 block">Avatar</label>
                <div className="flex gap-2 flex-wrap justify-center">
                  {AVATARS.map((av, i) => (
                    <button key={i} onClick={() => setAvatarIndex(i)} className={`w-10 h-10 rounded-full border-2 transition-all ${i === avatarIndex ? "border-cyan-400 scale-110" : "border-white/20 opacity-50 hover:opacity-80"}`}>
                      <img src={av} alt="" className="w-full h-full rounded-full" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Bot Count */}
              <div className="mb-3">
                <label className="text-xs text-gray-400 mb-1 block">Bot Opponents: {botCount}</label>
                <input type="range" min={1} max={5} value={botCount} onChange={(e) => setBotCount(parseInt(e.target.value))} className="w-full accent-teal-400" />
              </div>

              {/* Mode */}
              <div className="mb-5">
                <label className="text-xs text-gray-400 mb-1 block">Mode</label>
                <div className="flex gap-2">
                  {(["classic", "quick"] as const).map((m) => (
                    <button key={m} onClick={() => setMode(m)} className={`flex-1 py-2 rounded-lg text-sm font-medium capitalize transition-all ${mode === m ? "bg-teal-500 text-white" : "bg-white/10 text-gray-400 hover:bg-white/20"}`}>{m}</button>
                  ))}
                </div>
              </div>

              <button onClick={handleSoloPlay} className="w-full py-3 rounded-xl bg-gradient-to-r from-[#2A9D8F] to-[#0077B6] text-white font-bold hover:shadow-lg hover:shadow-teal-500/30 transition-all">
                <span className="flex items-center justify-center gap-2"><Play className="w-5 h-5" /> Start Game</span>
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create Room Modal */}
      <AnimatePresence>
        {showCreate && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowCreate(false)}>
            <motion.div initial={{ scale: 0.8, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.8, y: 20 }}
              className="bg-[#1B2838] rounded-2xl p-6 w-full max-w-sm border border-white/10 shadow-2xl"
              onClick={(e) => e.stopPropagation()}>
              <h2 className="text-xl font-bold text-white mb-4">Create Room</h2>
              <div className="space-y-3">
                <div><label className="text-xs text-gray-400 mb-1 block">Max Players: {maxPlayers}</label><input type="range" min={2} max={8} value={maxPlayers} onChange={(e) => setMaxPlayers(parseInt(e.target.value))} className="w-full accent-cyan-400" /></div>
                <div><label className="text-xs text-gray-400 mb-1 block">Mode</label><div className="flex gap-2">{(["classic", "quick"] as const).map((m) => (<button key={m} onClick={() => setMode(m)} className={`flex-1 py-2 rounded-lg text-sm font-medium capitalize transition-all ${mode === m ? "bg-cyan-500 text-white" : "bg-white/10 text-gray-400 hover:bg-white/20"}`}>{m}</button>))}</div></div>
              </div>
              <div className="flex gap-3 mt-5">
                <button onClick={() => setShowCreate(false)} className="flex-1 py-3 rounded-xl bg-white/10 text-white font-medium hover:bg-white/20 transition-all text-sm">Cancel</button>
                <button onClick={handleCreate} className="flex-1 py-3 rounded-xl bg-gradient-to-r from-[#0077B6] to-[#2A9D8F] text-white font-bold hover:shadow-lg hover:shadow-cyan-500/30 transition-all text-sm">Create</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Join Room Modal */}
      <AnimatePresence>
        {showJoin && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowJoin(false)}>
            <motion.div initial={{ scale: 0.8, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.8, y: 20 }}
              className="bg-[#1B2838] rounded-2xl p-6 w-full max-w-sm border border-white/10 shadow-2xl"
              onClick={(e) => e.stopPropagation()}>
              <h2 className="text-xl font-bold text-white mb-4">Join Room</h2>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Room Code</label>
                <input type="text" value={roomCode} onChange={(e) => setRoomCode(e.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="000000" maxLength={6}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-4 text-white text-center text-2xl tracking-[0.5em] font-mono placeholder-gray-600 focus:outline-none focus:border-yellow-400 transition-colors" />
              </div>
              <div className="flex gap-3 mt-5">
                <button onClick={() => setShowJoin(false)} className="flex-1 py-3 rounded-xl bg-white/10 text-white font-medium hover:bg-white/20 transition-all text-sm">Cancel</button>
                <button onClick={handleJoin} disabled={roomCode.length !== 6} className="flex-1 py-3 rounded-xl bg-gradient-to-r from-[#E9C46A] to-[#d4a93a] text-[#0D1B2A] font-bold disabled:opacity-50 transition-all text-sm">Join</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* How to Play Modal */}
      <AnimatePresence>
        {showHelp && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowHelp(false)}>
            <motion.div initial={{ scale: 0.8, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.8, y: 20 }}
              className="bg-[#1B2838] rounded-2xl p-6 w-full max-w-md border border-white/10 shadow-2xl max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}>
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2"><HelpCircle className="w-6 h-6 text-cyan-400" /> How to Play</h2>
              <div className="space-y-3 text-gray-300 text-sm">
                <div className="bg-white/5 rounded-lg p-3"><h3 className="text-white font-bold mb-1">Goal</h3><p>Empty your hand first. Score points from opponents. First to target wins!</p></div>
                <div className="bg-white/5 rounded-lg p-3"><h3 className="text-white font-bold mb-1">Playing Cards</h3><p>Match top card by color or number. Click a glowing card to play it.</p></div>
                <div className="bg-white/5 rounded-lg p-3"><h3 className="text-white font-bold mb-1">Actions</h3><p className="text-yellow-400">Skip</p><p className="text-blue-400">Reverse</p><p className="text-green-400">+2 Draw</p><p className="text-purple-400">Wild (change color)</p><p className="text-red-400">Wild +4</p></div>
                <div className="bg-white/5 rounded-lg p-3"><h3 className="text-white font-bold mb-1">UNO!</h3><p>Click UNO! button when you have 1 card left. Forgot = draw 2 penalty!</p></div>
                <div className="bg-white/5 rounded-lg p-3"><h3 className="text-white font-bold mb-1">Controls</h3><p>Click draw pile to draw. Click Pass if you can't play.</p></div>
              </div>
              <button onClick={() => setShowHelp(false)} className="w-full mt-4 py-3 rounded-xl bg-white/10 text-white font-medium hover:bg-white/20 transition-all">Got it!</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
