"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button"; 

const Icon = ({ name }: { name: string }) => {
  const icons: Record<string, string> = {
    dashboard: "📊",
    calendar: "📅",
    search: "🔍",
    structure: "📐",
    register: "📋", // 🌟 ADDED: Clipboard icon for manual registration
    chatbot: "🤖",
    
  };
  return <span>{icons[name] || "•"}</span>;
};

interface NavbarProps {
  isDarkMode: boolean;
  userName?: string;      
  studentId?: string;     
  onLogout?: () => void;
  onToggleTheme: () => void; 
}

export default function Navbar({ 
  isDarkMode, 
  userName = "Guest User", 
  studentId = "ID: ------", 
  onLogout, 
  onToggleTheme 
}: NavbarProps) {
  const pathname = usePathname();

  // 🌟 UPDATED: Added "Manual Register" item directly above Chatbot
  const navItems = [
    { name: "Dashboard", id: "dashboard", icon: "dashboard", href: "/main/dashboard" },
    { name: "My Timetable", id: "timetable", icon: "calendar", href: "/main/timetable" },
    { name: "Course Search", id: "search", icon: "search", href: "/main/search_course" },
    { name: "Manual Register", id: "register", icon: "register", href: "/main/manual_register" },
    { name: "Course Structure", id: "structure", icon: "structure", href: "/main/course_structure" }, 
    { name: "Chatbot", id: "chatbot", icon: "chatbot", href: "/main/chatbot" },
  ];

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .substring(0, 2)
      .toUpperCase();
  };

  return (
    <aside className={`w-64 h-screen border-r p-5 flex flex-col justify-between shadow-sm transition-colors shrink-0 ${
      isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200/80"
    }`}>
      
      {/* TOP CONTAINER BLOCK */}
      <div className="space-y-6 flex-grow flex flex-col">
        
        {/* 1. Header branding row */}
        <div className="flex items-center justify-between border-b pb-4 border-slate-100 dark:border-slate-800">
          <div className="flex items-center space-x-2.5">
            <img 
              src={isDarkMode ? "/dark logo.png" : "/white logo.png"} 
              alt="AI Course Assistant Logo" 
              className="w-8 h-8 object-contain rounded-xl select-none"
              draggable={false}
            />
            <span className={`text-xs font-extrabold tracking-tight uppercase leading-tight ${isDarkMode ? "text-white" : "text-slate-950"}`}>
              AI COURSE<br />ASSISTANT
            </span>
          </div>
          
          <button 
            onClick={onToggleTheme}
            type="button"
            className={`text-[10px] font-bold px-2.5 py-1.5 rounded-lg border transition active:scale-95 ${
              isDarkMode 
                ? "bg-slate-800 border-slate-700 text-yellow-400 hover:bg-slate-700" 
                : "bg-slate-50 border-slate-200 text-slate-700 shadow-sm hover:bg-slate-100"
            }`}
            title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {isDarkMode ? "☀️" : "🌙"}
          </button>
        </div>

        {/* 2. Menu options selection array */}
        <nav className="space-y-1 text-xs font-medium">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            
            return (
              <Button
                key={item.id}
                asChild
                variant="ghost"
                className={`w-full justify-start gap-3 p-2.5 py-5 rounded-xl border transition-all ${
                  isActive 
                    ? isDarkMode
                      ? "bg-slate-800 text-cyan-300 border-slate-700 font-semibold" 
                      : "bg-cyan-50 text-cyan-700 border-cyan-100/50 font-semibold shadow-sm hover:bg-cyan-50"
                    : isDarkMode
                      ? "hover:bg-slate-800/40 text-slate-400 hover:text-zinc-100 border-transparent" 
                      : "hover:bg-slate-100 text-slate-600 hover:text-slate-950 border-transparent"
                }`}
              >
                <Link href={item.href}>
                  <Icon name={item.icon} />
                  <span>{item.name}</span>
                </Link>
              </Button>
            );
          })}
        </nav>

      </div>

      {/* BOTTOM PROFILE SEGMENT */}
      <div className="border-t pt-4 border-slate-100 dark:border-slate-800 flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-full bg-slate-400 flex items-center justify-center text-[10px] text-white font-bold shrink-0 uppercase">
          {getInitials(userName)}
        </div>
        <div className="min-w-0 flex-1">
          <p className={`text-[11px] font-bold truncate ${isDarkMode ? "text-white" : "text-slate-900"}`}>
            {userName}
          </p>
          <p className="text-[9px] text-slate-500 font-mono truncate">
            ID: {studentId}
          </p>
        </div>
        
        <button 
          onClick={onLogout}
          className={`flex items-center justify-center rounded-xl font-bold tracking-wide transition-all duration-200 active:scale-95 shadow-sm border ${
            isDarkMode 
              ? "w-10 h-10 bg-slate-950/40 border-slate-800 text-slate-400 hover:text-rose-400 hover:border-rose-950/50 hover:bg-rose-950/20" 
              : "w-10 h-10 bg-slate-50 border-slate-200 text-slate-500 hover:text-rose-600 hover:border-rose-100 hover:bg-rose-50"
          }`}
          title="Sign Out Session"
        >
          <span className="text-base select-none">🚪</span>
        </button>
      </div>

    </aside>
  );
}