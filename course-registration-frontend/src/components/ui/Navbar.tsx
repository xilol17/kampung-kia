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
    chatbot: "🤖",
  };
  return <span>{icons[name] || "•"}</span>;
};

interface NavbarProps {
  isDarkMode: boolean;
  userName?: string;      // ADDED: Dynamic name property
  studentId?: string;     // ADDED: Dynamic ID property
  onLogout?: () => void;
  onToggleTheme: () => void; 
}

export default function Navbar({ 
  isDarkMode, 
  userName = "Guest User", // Fallback text if user data isn't loaded yet
  studentId = "ID: ------", 
  onLogout, 
  onToggleTheme 
}: NavbarProps) {
  const pathname = usePathname();

  const navItems = [
    { name: "Dashboard", id: "dashboard", icon: "dashboard", href: "/main/dashboard" },
    { name: "My Timetable", id: "timetable", icon: "calendar", href: "/main/timetable" },
    { name: "Course Search", id: "search", icon: "search", href: "/main/search_course" },
    { name: "Course Structure", id: "structure", icon: "structure", href: "/main/course_structure" }, 
    { name: "Chatbot", id: "chatbot", icon: "chatbot", href: "/main/chatbot" },
  ];

  // Helper function to extract user initials for the avatar circle (e.g., "Aisyah Lim" -> "AL")
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .substring(0, 2)
      .toUpperCase();
  };

  return (
    <aside className={`w-64 h-screen border-r p-5 flex flex-col justify-between shadow-sm transition-colors select-none shrink-0 ${
      isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200/80"
    }`}>
      
      {/* TOP CONTAINER BLOCK */}
      <div className="space-y-6 flex-grow flex flex-col">
        
        {/* 1. Header branding row */}
        <div className="flex items-center justify-between border-b pb-4 border-slate-100 dark:border-slate-800">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-cyan-600 flex items-center justify-center text-white text-xs font-black shadow-sm">
              R
            </div>
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

        {/* 3. Micro Contextual Helper Card */}
        <div className={`mt-auto border rounded-xl p-4 text-[11px] ${
          isDarkMode ? "bg-slate-950/40 border-slate-800 text-zinc-300" : "bg-slate-50 border-slate-150 text-slate-700"
        }`}>
          <p className="font-bold">Need assistance?</p>
          <p className="text-slate-500 mt-0.5 mb-2.5 leading-relaxed">
            Our prediction core is tracking live module capacities.
          </p>
          <button className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-1.5 rounded-lg text-[10px] transition">
            Launch Matrix
          </button>
        </div>

      </div>

      {/* CHANGED HERE: BOTTOM PROFILE SEGMENT NOW RENDERS DYNAMIC VALUE VARIABLES */}
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
          className={`text-xs p-1.5 rounded-lg transition active:scale-95 ${
            isDarkMode ? "text-slate-500 hover:text-rose-400" : "text-slate-400 hover:text-rose-600"
          }`}
          title="Sign Out Session"
        >
          🚪
        </button>
      </div>

    </aside>
  );
}