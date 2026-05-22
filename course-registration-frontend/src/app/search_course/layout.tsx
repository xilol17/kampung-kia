"use client";

import { useState } from "react";
import Navbar from "@/components/ui/Navbar"; 

export default function MainAppLayout({ children }: { children: React.ReactNode }) {
  const [isDarkMode, setIsDarkMode] = useState(false);

  const handleLogout = () => {
    document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    localStorage.removeItem("user_metadata");
    window.location.href = "/"; 
  };

  return (
    // By adding the "dark" class directly to the root wrapper when true, Tailwind's dark: prefix will automatically activate across ALL subcomponents nested inside it!
    <div className={`flex w-screen h-screen overflow-hidden transition-colors duration-300 ${isDarkMode ? "dark bg-slate-950 text-white" : "bg-slate-50 text-slate-900"}`}>
      
      <Navbar 
        isDarkMode={isDarkMode} 
        onLogout={handleLogout} 
        onToggleTheme={() => setIsDarkMode(!isDarkMode)} 
      />

      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        <main className="flex-1 h-full overflow-y-auto">
          {/* We wrap children here so that CSS variable values are accessible downstream */}
          <div className="h-full w-full" data-theme={isDarkMode ? "dark" : "light"}>
            {children}
          </div>
        </main>
      </div>

    </div>
  );
}