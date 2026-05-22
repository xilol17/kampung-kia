"use client"; // Required because we have interactive input fields

import { useState } from "react";
import Link from "next/link"; // Required for redirection within Next.js Apps Router
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [id, setId] = useState("");
  const [password, setPassword] = useState("");
  const [isDarkMode, setIsDarkMode] = useState(false); // Defaults to Light Mode (false)
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch("http://localhost:8080/api/login", { 
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id, password }),
      });

      const data = await response.json();

      console.log("Backend Response Data:", data);

      if (response.ok) {
        const daysToExpire = 7;
        const date = new Date();
        date.setTime(date.getTime() + daysToExpire * 24 * 60 * 60 * 1000);
        const expires = "; expires=" + date.toUTCString();

        document.cookie = `token=${data.token}${expires}; path=/; SameSite=Strict;`;
        localStorage.setItem("user_metadata", JSON.stringify(data.user));
        router.push("/dashboard");
      } else {
        alert(data.message || "Invalid id or password.");
      }
    } catch (error) {
      console.error("Connection error:", error);
      alert("Failed to connect to the authentication server. Ensure your backend is running.");
    }
  };

  return (
    // Outer Container wrapping everything with a conditional className based on theme status
    <div className={`min-h-screen w-screen flex flex-col items-center justify-center font-sans p-6 relative overflow-hidden select-none transition-colors duration-300 ${isDarkMode ? 'bg-slate-950' : 'bg-slate-50'}`}>
      
      {/* 0. Floating Theme Toggle Switch Button */}
      <button
        onClick={() => setIsDarkMode(!isDarkMode)}
        className={`absolute top-6 right-6 p-2.5 rounded-xl border text-sm font-semibold transition-all shadow-sm active:scale-95 z-20 ${
          isDarkMode 
            ? 'bg-slate-900 border-slate-800 text-yellow-400 hover:bg-slate-800' 
            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
        }`}
        type="button"
        title="Toggle Theme Mode"
      >
        {isDarkMode ? "☀️ Light Mode" : "🌙 Dark Mode"}
      </button>

      {/* 1. Background Accent Glows (Blobs) */}
      <div className={`absolute -top-40 -left-40 w-96 h-96 rounded-full blur-[100px] pointer-events-none transition-opacity ${isDarkMode ? 'bg-cyan-600/10' : 'bg-cyan-500/5'}`}></div>
      <div className={`absolute -bottom-40 -right-40 w-96 h-96 rounded-full blur-[100px] pointer-events-none transition-opacity ${isDarkMode ? 'bg-indigo-600/10' : 'bg-indigo-500/5'}`}></div>

      {/* 2. Primary Logo branding section */}
      <div className="mb-10 text-center space-y-2.5 flex flex-col items-center z-10">
        <div className="w-26 h-26 flex items-center justify-center overflow-hidden">
          {/* Dynamic Logo Image */}
          <img 
            src={isDarkMode ? "/dark%20logo.png" : "/white%20logo.png"} 
            alt="RegiSmart Logo" 
            className="w-full h-full object-contain"
          />
        </div>
        <div>
          <h1 className={`text-3xl font-extrabold tracking-tight transition-colors ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>RegiSmart</h1>
          <p className={`text-xs mt-1 uppercase font-bold tracking-widest transition-colors ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>ai course registration assistant</p>
        </div>
      </div>

      {/* 3. The Login Form Card - Adaptive Glassmorphism Styling */}
      <main className={`w-full max-w-md border rounded-3xl p-10 shadow-2xl backdrop-blur-xl z-10 transition-all ${
        isDarkMode 
          ? 'bg-slate-900/50 border-slate-800 shadow-slate-950/30' 
          : 'bg-white/70 border-slate-200 shadow-slate-200/50'
      }`}>
        
        <div className="text-center mb-10">
          <h2 className={`text-xl font-bold transition-colors ${isDarkMode ? 'text-slate-100' : 'text-slate-800'}`}>Sign in to your account</h2>
          <p className={`text-xs mt-1.5 transition-colors ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Enter your credential.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* id Input Field Group */}
          <div className="space-y-2">
            <label htmlFor="id" className={`text-xs font-semibold transition-colors ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
              Student id <span className="text-cyan-500 font-mono">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-slate-400">👤</span>
              <input
                id="id"
                type="text" // Fixed the type error 'type="id"' to standard 'text'
                value={id}
                onChange={(e) => setId(e.target.value)}
                placeholder="Student_id"
                required
                className={`w-full border rounded-xl py-3 pl-11 pr-4 text-[15px] outline-none focus:ring-1 focus:ring-cyan-500 transition-all ${
                  isDarkMode 
                    ? 'bg-slate-950/50 border-slate-700/60 placeholder-slate-600 text-white' 
                    : 'bg-slate-50 border-slate-300 placeholder-slate-400 text-slate-900'
                }`}
              />
            </div>
          </div>

          {/* Password Input Field Group */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label htmlFor="password" className={`text-xs font-semibold transition-colors ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                Password <span className="text-cyan-500 font-mono">*</span>
              </label>
            </div>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-slate-400">🔒</span>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••"
                required
                className={`w-full border rounded-xl py-3 pl-11 pr-4 text-[15px] outline-none focus:ring-1 focus:ring-cyan-500 transition-all ${
                  isDarkMode 
                    ? 'bg-slate-950/50 border-slate-700/60 placeholder-slate-600 text-white' 
                    : 'bg-slate-50 border-slate-300 placeholder-slate-400 text-slate-900'
                }`}
              />
            </div>
          </div>

          {/* Action Trigger Button */}
          <button
            type="submit"
            className="w-full bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-white font-bold py-3 rounded-xl text-xs tracking-wider transition-all active:scale-[0.99] shadow-lg shadow-cyan-500/10"
          >
            LOG IN
          </button>
        </form>

        {/* Footer links / Alt actions */}
        <div className={`mt-10 border-t pt-6 text-center transition-colors ${isDarkMode ? 'border-slate-800' : 'border-slate-200'}`}>
          <p className={`text-[15px] transition-colors ${isDarkMode ? 'text-slate-600' : 'text-slate-400'}`}>
            Don&apos;t have an allocation node assigned? <br/>
            <Link href="#" className={`font-semibold hover:text-cyan-500 transition mt-1.5 inline-block ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
               Consult AI Registration Assistant 
            </Link>
          </p>
        </div>
      </main>

      {/* 4. Minimal security footer */}
      <footer className={`mt-16 text-center text-[15px] font-mono tracking-wide z-10 transition-colors ${isDarkMode ? 'text-slate-700' : 'text-slate-400'}`}>
          RegiSmart predictive backend engine | COPYRIGHT&copy; KAMPUNG KIA.
      </footer>
    </div>
  );
}