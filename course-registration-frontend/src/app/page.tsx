"use client";

import { useState } from "react";
import Link from "next/link";

// Standard icon set used by modern dashboards. 
const Icon = ({ name }: { name: string }) => {
  const icons: Record<string, string> = {
    bell: "🔔",
    dashboard: "📊",
    calendar: "📅",
    search: "🔍",
    structure: "📐",
    chatbot: "🤖",
    alerts: "⚠️",
    user: "👤",
    arrowRight: "→",
    robot: "🤖",
  };
  return <span>{icons[name] || "•"}</span>;
};

// Component for Alert items
const AlertItem = ({ type, text, time, darkMode }: { type: 'full' | 'conflict' | 'new', text: string, time: string, darkMode: boolean }) => {
  const config = {
    full: { icon: "alerts", color: "rose" },
    conflict: { icon: "alerts", color: "amber" },
    new: { icon: "bell", color: "cyan" },
  }[type];

  // Helper mapping to maintain solid Tailwind style strings safely
  const bgClasses = {
    rose: darkMode ? "bg-rose-500/10 text-rose-400" : "bg-rose-50 text-rose-600",
    amber: darkMode ? "bg-amber-500/10 text-amber-400" : "bg-amber-50 text-amber-600",
    cyan: darkMode ? "bg-cyan-500/10 text-cyan-400" : "bg-cyan-50 text-cyan-600",
  }[config.color];

  return (
    <div className={`flex items-center gap-3 p-2.5 rounded-xl border text-[11px] ${darkMode ? "border-slate-800 bg-slate-950/40" : "border-slate-100 bg-slate-50/50"}`}>
      <div className={`w-7 h-7 shrink-0 rounded-lg flex items-center justify-center text-xs ${bgClasses}`}>
        <Icon name={config.icon} />
      </div>
      <div className="flex-1 min-w-0">
        <p className={`font-semibold truncate ${darkMode ? "text-slate-200" : "text-slate-900"}`}>{text}</p>
        <p className="text-[9px] text-slate-500">{time}</p>
      </div>
    </div>
  );
};

// Component for Action items
const ActionItem = ({ icon, label, description, darkMode }: { icon: string, label: string, description: string, darkMode: boolean }) => {
  return (
    <button className={`w-full text-left p-3 rounded-xl border flex items-center gap-3 group transition h-full ${
      darkMode ? "bg-slate-900/60 border-slate-800 hover:border-slate-700" : "bg-white border-slate-100 hover:border-slate-200 hover:shadow-sm"
    }`}>
      <div className={`w-8 h-8 shrink-0 rounded-lg flex items-center justify-center text-xs transition ${
        darkMode ? "bg-slate-800 group-hover:bg-slate-700 text-cyan-400" : "bg-cyan-50 group-hover:bg-cyan-100/70 text-cyan-600"
      }`}>
        <Icon name={icon} />
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-[11px] font-bold truncate ${darkMode ? "text-zinc-100" : "text-slate-950"}`}>{label}</p>
        <p className="text-[9px] text-slate-500 truncate leading-tight mt-0.5">{description}</p>
      </div>
    </button>
  );
};

export default function DesktopGridDashboard() {
  const [darkMode, setDarkMode] = useState(false);

  const navItems = [
    { name: "Dashboard", id: "dashboard", icon: "dashboard", href:"/" },
    { name: "My Timetable", id: "timetable", icon: "calendar", href:"/timetable" },
    { name: "Course Search", id: "search", icon: "search", href:"/timetable"},
    { name: "Plan & Optimize", id: "structure", icon: "structure", href:"/timetable" },
    { name: "Chatbot", id: "chatbot", icon: "chatbot", href:"/login" },
  ];

  return (
    // Locked display frame configuration
    <div className={`h-screen w-screen p-5 font-sans transition-colors duration-300 overflow-hidden select-none ${
      darkMode ? "bg-slate-950 text-zinc-100" : "bg-slate-50 text-slate-900"
    }`}>
      
      {/* ================= MASTER 5-COLUMN, 6-ROW DESKTOP MESH ================= */}
      <div className="grid grid-cols-5 grid-rows-6 gap-4 h-full w-full">
        
        {/* COLUMN 1 | ROWS 1-6: HIGH-FIDELITY SIDEBAR NAVIGATION */}
        <aside className={`col-span-1 row-span-6 rounded-2xl border p-5 flex flex-col justify-between shadow-sm transition-colors ${
          darkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200/80"
        }`}>
          <div className="space-y-6 flex-grow flex flex-col">
            {/* Header branding row */}
            <div className="flex items-center justify-between border-b pb-4 border-slate-100 dark:border-slate-800">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-xl bg-cyan-600 flex items-center justify-center text-white text-xs font-black shadow-sm">R</div>
                <span className={`text-xs font-extrabold tracking-tight uppercase leading-tight ${darkMode ? "text-white" : "text-slate-950"}`}>
                  AI COURSE<br />ASSISTANT
                </span>
              </div>
              <button 
                onClick={() => setDarkMode(!darkMode)}
                className={`text-[10px] font-bold px-2.5 py-1.5 rounded-lg border transition active:scale-95 ${
                  darkMode ? "bg-slate-800 border-slate-700 text-yellow-400" : "bg-slate-50 border-slate-200 text-slate-700 shadow-sm"
                }`}
              >
                {darkMode ? "☀️" : "🌙"}
              </button>
            </div>

            {/* Menu options selection array */}
            <nav className="space-y-1 text-xs font-medium pt-2">
              {navItems.map((item) => (
                <Link 
                  key={item.id}
                  href={item.href}
                  className={`flex items-center gap-3 p-2.5 rounded-xl border transition cursor-pointer ${
                    item.id === 'dashboard' 
                      ? darkMode
                        ? 'bg-slate-800 text-cyan-300 border-slate-700 font-semibold' 
                        : 'bg-cyan-50 text-cyan-700 border-cyan-100/50 font-semibold shadow-sm'
                      : darkMode
                        ? 'hover:bg-slate-800/40 text-slate-400 hover:text-zinc-100 border-transparent' 
                        : 'hover:bg-slate-100 text-slate-600 hover:text-slate-950 border-transparent'
                  }`}
                >
                  <Icon name={item.icon} /> {item.name}
                </Link>
              ))}
            </nav>

            {/* Micro Contextual Helper Card */}
            <div className={`mt-auto border rounded-xl p-4 text-[11px] ${darkMode ? "bg-slate-950/40 border-slate-800" : "bg-slate-50 border-slate-150"}`}>
               <p className="font-bold">Need assistance?</p>
               <p className="text-slate-500 mt-0.5 mb-2.5 leading-relaxed">Our prediction core is tracking live module capacities.</p>
               <button className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-1.5 rounded-lg text-[10px] transition">Launch Matrix</button>
            </div>
          </div>

          {/* Profile segment configuration */}
          <div className="border-t pt-4 border-slate-100 dark:border-slate-800 flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-slate-400 flex items-center justify-center text-[10px] text-white font-bold shrink-0">AL</div>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-bold truncate">Aisyah Lim</p>
              <p className="text-[9px] text-slate-500 font-mono truncate">ID: 220034</p>
            </div>
            <button className={`text-xs p-1.5 rounded-lg ${darkMode ? "text-slate-500 hover:text-rose-400" : "text-slate-400 hover:text-rose-600"}`}>
               🚪
            </button>
          </div>
        </aside>

        {/* COLUMNS 2-4 | ROWS 1-2: THE CHATBOT PANEL (With custom blue highlight boundary) */}
        <section className={`col-span-3 row-span-2 rounded-2xl p-5 shadow-lg border-2 transition-all flex flex-col justify-between ${
          darkMode 
            ? "bg-slate-900/50 border-cyan-500 shadow-cyan-950/5" 
            : "bg-white border-blue-500 shadow-blue-100/30"
        }`}>
          <div className="flex items-center justify-between w-full">
            <div className="min-w-0">
               <h2 className="text-lg font-extrabold tracking-tight">Welcome back, Aisyah! 👋</h2>
               <p className="text-[11px] text-slate-500 mt-0.5">How can I assist you with your academic vector pathways today?</p>
            </div>
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl font-bold shrink-0 shadow-sm ${
                darkMode ? "bg-cyan-950/40 text-cyan-400" : "bg-cyan-50 text-cyan-600"
            }`}>
                <Icon name="robot" />
            </div>
          </div>

          {/* Form input channel elements */}
          <div className="w-full space-y-2.5">
            <div className="relative w-full">
              <input 
                type="text" 
                placeholder="Ask anything about courses, timetable schedules, or module prerequisites..." 
                className={`w-full border rounded-full py-2.5 pl-4 pr-10 text-[11px] outline-none focus:ring-1 focus:ring-cyan-500 transition ${
                  darkMode 
                    ? "bg-slate-950 border-slate-800 text-zinc-100 placeholder-slate-600" 
                    : "bg-slate-50 border-slate-200/80 text-slate-800 placeholder-slate-400"
                }`}
              />
              <button className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-cyan-600 hover:text-cyan-500 transition">→</button>
            </div>
            <div className="flex gap-1.5">
              {['Alternative Courses', 'Optimize My Path', 'Prerequisites Check'].map(btn => (
                <button key={btn} className={`text-[9px] font-bold py-1 px-2.5 rounded-full border transition ${
                    darkMode ? "bg-slate-800 border-slate-700 text-slate-300 hover:text-white" : "bg-slate-100/80 border-slate-200 text-slate-600 hover:text-slate-900"
                }`}>{btn}</button>
              ))}
            </div>
          </div>
        </section>

        {/* COLUMN 5 | ROWS 1-3: LIVE ALERTS LISTING (Notice for Class Full) */}
        <section className={`col-span-1 row-span-3 rounded-2xl p-4 border flex flex-col shadow-sm transition-colors ${
          darkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"
        }`}>
          <div className="flex items-center justify-between mb-3 shrink-0">
             <h2 className="text-xs font-bold tracking-tight">Alerts & Notifications</h2>
             <span className="text-[9px] font-bold text-cyan-600 cursor-pointer">View all</span>
          </div>
          
          {/* List sequence */}
          <div className="space-y-2 flex-grow overflow-y-auto pr-1">
             <AlertItem type="full" text="CS101 (Section B) is now FULL." time="2h ago" darkMode={darkMode} />
             <AlertItem type="conflict" text="Time clash detected on Network Lab." time="1d ago" darkMode={darkMode} />
             <AlertItem type="new" text="New module: AI Advanced Tech." time="2d ago" darkMode={darkMode} />
          </div>

          {/* Countdown sub-module integration inside space block */}
          <div className={`mt-3 p-3 rounded-xl border text-center shrink-0 ${
              darkMode ? "bg-slate-950/40 border-slate-800" : "bg-slate-50 border-slate-100 shadow-inner"
          }`}>
              <p className="text-[10px] text-slate-500 font-medium">Registration Node Opens In:</p>
              <p className="text-base font-black tracking-tight mt-0.5">3 Days <span className="text-[10px] text-slate-400 font-normal">at 9:00 AM</span></p>
          </div>
        </section>

        {/* COLUMNS 2-4 | ROWS 3-4: SOFT REMINDER COMPONENT */}
        <section className={`col-span-3 row-span-2 rounded-2xl p-5 border flex flex-col justify-between shadow-sm transition-colors ${
          darkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"
        }`}>
          <div>
            <h2 className="text-xs font-bold tracking-tight uppercase tracking-wider text-slate-400">Intake Registration System Status</h2>
            <p className="text-xs font-medium text-slate-500 mt-1">Real-time status vector tracking</p>
          </div>
          <div className={`p-3.5 rounded-xl border text-[11px] leading-relaxed flex items-center gap-3 ${
             darkMode ? "bg-cyan-950/10 border-cyan-800/50 text-cyan-300" : "bg-cyan-50/60 border-cyan-100 text-cyan-800 shadow-sm"
          }`}>
             <span className="text-base shrink-0">⚡</span>
             <p>
               **System Notice:** Course enrollment pipelines are operational. High-concurrency automated load balancing limits are handling waitlisted parameters automatically. No system conflicts detected.
             </p>
          </div>
        </section>

        {/* COLUMN 5 | ROWS 4-6: QUICK ACTIONS PANEL (AI Suggestions) */}
        <section className={`col-span-1 row-span-3 rounded-2xl p-4 border flex flex-col shadow-sm transition-colors ${
          darkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"
        }`}>
          <div className="mb-3 shrink-0">
             <h2 className="text-xs font-bold tracking-tight">AI Optimization Matrix</h2>
             <p className="text-[9px] text-slate-500 mt-0.5">Quick actions toolbar allocation</p>
          </div>
          
          {/* Action layout matrix grid block */}
          <div className="grid grid-cols-1 gap-2 flex-grow overflow-y-auto">
              <ActionItem icon="search" label="Search Courses" description="Filter dynamic module catalogs." darkMode={darkMode} />
              <ActionItem icon="structure" label="Optimize Plan" description="Balance degree structure path values." darkMode={darkMode} />
              <ActionItem icon="chatbot" label="Consult Assistant" description="Initialize diagnostic telemetry chat." darkMode={darkMode} />
          </div>
        </section>

        {/* COLUMNS 2-4 | ROWS 5-6: CURRENT TIMETABLE MATRIX */}
        <section className={`col-span-3 row-span-2 rounded-2xl p-5 border flex flex-col shadow-sm transition-colors justify-between ${
          darkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"
        }`}>
          <div className="flex items-center justify-between w-full shrink-0">
             <h2 className="text-xs font-bold tracking-tight">Current Plan Overview</h2>
             <span className="text-[10px] font-bold text-slate-400 font-mono">18 Credits Registered</span>
          </div>

          {/* Horizontal multi-column weekday alignment */}
          <div className="grid grid-cols-5 gap-2.5 flex-grow mt-3 items-stretch">
             {['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map((day, idx) => (
               <div key={day} className={`rounded-xl border flex flex-col min-w-0 ${
                 darkMode ? "bg-slate-950/40 border-slate-800" : "bg-slate-50/60 border-slate-100"
               }`}>
                 <div className={`text-[9px] font-black tracking-widest text-center py-1.5 border-b uppercase ${
                   darkMode ? "border-slate-800 text-slate-500" : "border-slate-100 text-slate-400 shadow-inner bg-slate-100/30"
                 }`}>{day}</div>
                 <div className="p-1.5 space-y-1.5 flex-grow flex flex-col justify-center">
                    {idx % 2 === 0 ? (
                      <>
                        <div className={`p-1.5 rounded-lg border text-[9px] font-bold truncate leading-tight ${
                            darkMode ? "bg-slate-900 border-slate-800 text-zinc-300" : "bg-white border-slate-200 text-slate-800 shadow-sm"
                        }`}>CS102</div>
                        <div className={`p-1.5 rounded-lg border text-[9px] font-bold truncate leading-tight ${
                            darkMode ? "bg-slate-900/40 border-slate-800 text-cyan-300" : "bg-cyan-50/40 border-cyan-100 text-cyan-700 shadow-sm"
                        }`}>MA123</div>
                      </>
                    ) : (
                      <div className={`p-1.5 rounded-lg border text-[9px] font-bold truncate leading-tight ${
                          darkMode ? "bg-slate-900 border-slate-800 text-zinc-300" : "bg-white border-slate-200 text-slate-800 shadow-sm"
                      }`}>SEC305</div>
                    )}
                 </div>
               </div>
             ))}
          </div>
        </section>

      </div>
    </div>
  );
}