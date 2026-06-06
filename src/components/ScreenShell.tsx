import { type ReactNode } from "react";
import { useNavigate } from "react-router";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";

interface ScreenShellProps {
  title: string;
  children: ReactNode;
  back?: string;
  right?: ReactNode;
  maxWidth?: string;
}

/** Shared layout for the secondary dashboard screens: dark bg, back + title header. */
export function ScreenShell({ title, children, back = "/home", right, maxWidth = "max-w-3xl" }: ScreenShellProps) {
  const navigate = useNavigate();
  return (
    <div className="casino-bg min-h-[100dvh] w-full flex flex-col text-[#ece6da] overflow-x-hidden">
      <header className="flex items-center gap-3 px-4 py-3 z-20">
        <button onClick={() => navigate(back)} className="p-2 rounded-full bg-black/35 border border-white/10 text-gray-200 hover:text-white">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <h1 className="font-display font-extrabold text-lg tracking-wide flex-1">{title}</h1>
        {right}
      </header>
      <motion.main
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className={`flex-1 w-full ${maxWidth} mx-auto px-4 pb-6`}
      >
        {children}
      </motion.main>
    </div>
  );
}
