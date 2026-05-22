"use client"; // Required because we have interactive input fields

import { useState } from "react";
import Link from "next/link"; // Required for redirection within Next.js Apps Router

export default function LoginPage() {
  const [id, setId] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Login Attempt:", { id });
    alert(`Startup Demo Hook: Systems would now authenticate credentials for pathway node ${id.split('@')[0]}...`);
  };

  return (
    // Outer locked display frame - fixed on cold slate theme for security pages
    <div className="min-h-screen w-screen flex flex-col items-center justify-center bg-slate-950 font-sans p-6 relative overflow-hidden select-none">
      
      {/* 1. Subtle Background Cold Accent Glows (Blobs) */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-cyan-600/10 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-indigo-600/10 rounded-full blur-[100px] pointer-events-none"></div>

      {/* 2. Primary Logo branding section */}
      <div className="mb-10 text-center space-y-2.5 flex flex-col items-center z-10">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-600 to-indigo-600 flex items-center justify-center text-white text-3xl font-black shadow-lg shadow-cyan-900/10">
          R
        </div>
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">RegiSmart Matrix</h1>
          <p className="text-xs text-slate-500 mt-1 uppercase font-bold tracking-widest">ai course assistant authentication node</p>
        </div>
      </div>

      {/* 3. The Login Form Card - Glassmorphism Styling (50% transparent with blur) */}
      <main className="w-full max-w-md bg-slate-900/50 border border-slate-800 rounded-3xl p-10 shadow-2xl shadow-slate-950/30 backdrop-blur-xl z-10">
        
        <div className="text-center mb-10">
          <h2 className="text-xl font-bold text-slate-100">Sign in to your account</h2>
          <p className="text-xs text-slate-500 mt-1.5">Enter your institutional credentials below to initialize pathway diagnostics telemetry.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* id Input Field Group */}
          <div className="space-y-2">
            <label htmlFor="id" className="text-xs font-semibold text-slate-400">
              Institutional id <span className="text-cyan-400 font-mono">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-slate-600">👤</span>
              <input
                id="id"
                type="id"
                value={id}
                onChange={(e) => setId(e.target.value)}
                placeholder="name.path@university.edu"
                required
                className="w-full bg-slate-950/50 border border-slate-700/60 rounded-xl py-3 pl-11 pr-4 text-[11px] placeholder-slate-600 outline-none focus:ring-1 focus:ring-cyan-500 transition-colors text-white"
              />
            </div>
          </div>

          {/* Password Input Field Group */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label htmlFor="password" className="text-xs font-semibold text-slate-400">
                Network Password <span className="text-cyan-400 font-mono">*</span>
              </label>
              <a href="#" className="text-[10px] font-medium text-slate-600 hover:text-cyan-500 transition">Forgot?</a>
            </div>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-slate-600">🔒</span>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••"
                required
                className="w-full bg-slate-950/50 border border-slate-700/60 rounded-xl py-3 pl-11 pr-4 text-[11px] placeholder-slate-600 outline-none focus:ring-1 focus:ring-cyan-500 transition-colors text-white"
              />
            </div>
          </div>

          {/* Action Trigger Button */}
          <button
            type="submit"
            className="w-full bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-white font-bold py-3 rounded-xl text-xs tracking-wider transition-all active:scale-[0.99] shadow-lg shadow-cyan-900/10"
          >
            INITIALIZE AUTHENTICATION →
          </button>
        </form>

        {/* Footer links / Alt actions */}
        <div className="mt-10 border-t border-slate-800 pt-6 text-center">
          <p className="text-[11px] text-slate-600">
            Don&apos;t have an allocation node assigned? <br/>
            <Link href="#" className="font-semibold text-slate-400 hover:text-cyan-500 transition mt-1.5 inline-block">
               Consult AI Registrar Assistant Matrix
            </Link>
          </p>
        </div>
      </main>

      {/* 4. Minimal security footer for locked system page */}
      <footer className="mt-16 text-center text-[10px] text-slate-700 font-mono tracking-wide z-10">
          RegiSmart predictive backend engine | Authorization Node secured via Turbopack structural vector optimization.
      </footer>
    </div>
  );
}