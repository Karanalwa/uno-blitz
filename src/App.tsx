import { Routes, Route } from "react-router";
import Splash from "./pages/Splash";
import Home from "./pages/Home";
import CreateRoom from "./pages/CreateRoom";
import JoinRoom from "./pages/JoinRoom";
import Lobby from "./pages/Lobby";
import Game from "./pages/Game";
import Profile from "./pages/Profile";
import Friends from "./pages/Friends";
import Leaderboard from "./pages/Leaderboard";
import Rewards from "./pages/Rewards";
import Settings from "./pages/Settings";
import MatchHistory from "./pages/MatchHistory";
import Achievements from "./pages/Achievements";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Splash />} />
      <Route path="/home" element={<Home />} />
      <Route path="/create" element={<CreateRoom />} />
      <Route path="/join" element={<JoinRoom />} />
      <Route path="/lobby" element={<Lobby />} />
      <Route path="/game" element={<Game />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/friends" element={<Friends />} />
      <Route path="/leaderboard" element={<Leaderboard />} />
      <Route path="/rewards" element={<Rewards />} />
      <Route path="/settings" element={<Settings />} />
      <Route path="/history" element={<MatchHistory />} />
      <Route path="/achievements" element={<Achievements />} />
      <Route path="/login" element={<Login />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
