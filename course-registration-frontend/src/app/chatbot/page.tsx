"use client";

import { useState } from "react";

export default function ChatbotPage() {
  const [inputQuery, setInputQuery] = useState("");

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputQuery.trim()) return;
    setInputQuery("");
  };

  return (
    // Outer frame handles fluid padding boundaries
    <div className="w-full max-w-[calc(100vw-16rem)] h-full p-6 flex flex-col justify-between font-sans select-none overflow-hidden">
      
      {/* 1. TOP HEADER PLACEHOLDER BLOCK */}
    

      {/* 2. MAIN CENTER CANVAS (Changes color based on your Navbar toggle) */}
      <div className="flex-1 w-full rounded-3xl relative flex flex-col items-center justify-center border p-6 shadow-xl transition-all duration-300 bg-white border-slate-200 shadow-slate-100/40 dark:bg-black dark:border-slate-900/40 dark:shadow-none">
        
        {/* Prompt Header Title Text (Adapts color dynamically) */}
        <h2 className="text-lg font-bold tracking-tight mb-6 text-center transition-colors text-slate-800 dark:text-white/90">
          What are you working on?
        </h2>

        {/* Dynamic Capsule Chat Input Form Frame */}
        <form onSubmit={handleSendMessage} className="w-full max-w-2xl space-y-4">
          <div className="relative w-full rounded-full border p-1.5 flex items-center transition-all bg-slate-50 border-slate-200 focus-within:border-slate-300 dark:bg-slate-900/60 dark:backdrop-blur dark:border-white/10 dark:focus-within:border-white/20 shadow-sm">
            
            {/* Plus Utility icon */}
            <span className="pl-3.5 pr-2.5 text-slate-400 cursor-pointer hover:text-slate-600 dark:hover:text-white transition text-sm">
              ➕
            </span>

            {/* Core Text input pipeline */}
            <input 
              type="text" 
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              placeholder="Ask anything"
              className="w-full bg-transparent border-none outline-none py-2 text-xs font-medium pl-1 text-slate-900 placeholder-slate-400 dark:text-white dark:placeholder-slate-500"
            />

            {/* Quick configuration labels stack */}
            <div className="flex items-center gap-2 shrink-0 pr-1">
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border text-[10px] font-bold transition-all bg-white border-slate-200 text-slate-600 dark:bg-white/5 dark:border-white/5 dark:text-slate-300">
                <span className="text-emerald-500 dark:text-emerald-400 text-xs">🌀</span>
                <span>Instant</span>
                <span className="text-[8px] text-slate-400 dark:text-slate-500">▼</span>
              </div>
              
              <button type="button" className="w-7 h-7 rounded-full flex items-center justify-center text-xs border transition-all bg-white border-slate-200 text-slate-500 hover:bg-slate-50 dark:bg-white/5 dark:border-white/5 dark:text-slate-300 dark:hover:bg-white/10">
                🎙️
              </button>
              
              <button type="submit" className="w-7 h-7 rounded-full flex items-center justify-center text-xs bg-blue-600 hover:bg-blue-500 text-white shadow shadow-blue-500/20 transition font-black">
                ➔
              </button>
            </div>
          </div>

          {/* Alternative action pill buttons stack layout row */}
          <div className="flex items-center justify-center gap-2">
            {[
              { label: "Create an image", icon: "🎨" },
              { label: "Write or edit", icon: "✍️" },
              { label: "Look something up", icon: "🌐" }
            ].map((pill) => (
              <button
                key={pill.label}
                type="button"
                onClick={() => setInputQuery(pill.label)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all active:scale-95 text-[10px] font-bold bg-white border-slate-200 text-slate-600 hover:bg-slate-50 dark:bg-white/5 dark:border-white/5 dark:text-slate-300 dark:hover:bg-white/10"
              >
                <span>{pill.icon}</span>
                <span>{pill.label}</span>
              </button>
            ))}
          </div>
        </form>

      </div>

      {/* 3. BASE STATUS ANCHOR */}
      <footer className="shrink-0 mt-6 text-center text-[10px] font-bold tracking-widest uppercase transition-colors text-slate-400 dark:text-slate-600">
        no history
      </footer>

    </div>
  );
}