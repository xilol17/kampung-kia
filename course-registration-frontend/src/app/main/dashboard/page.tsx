"use client";

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

// Component for Alert items - Fully adaptive using Tailwind dark: rules
const AlertItem = ({ type, text, time }: { type: 'full' | 'conflict' | 'new', text: string, time: string }) => {
  const config = {
    full: { icon: "alerts", bgLight: "bg-rose-50 text-rose-600", bgDark: "dark:bg-rose-500/10 dark:text-rose-400" },
    conflict: { icon: "alerts", bgLight: "bg-amber-50 text-amber-600", bgDark: "dark:bg-amber-500/10 dark:text-amber-400" },
    new: { icon: "bell", bgLight: "bg-cyan-50 text-cyan-600", bgDark: "dark:bg-cyan-500/10 dark:text-cyan-400" },
  }[type];

  return (
    <div className="flex items-center gap-3 p-2.5 rounded-xl border text-[11px] border-slate-100 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-950/40">
      <div className={`w-7 h-7 shrink-0 rounded-lg flex items-center justify-center text-xs ${config.bgLight} ${config.bgDark}`}>
        <Icon name={config.icon} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold truncate text-slate-900 dark:text-slate-200">{text}</p>
        <p className="text-[9px] text-slate-500">{time}</p>
      </div>
    </div>
  );
};

// Component for Action items - Fully adaptive
const ActionItem = ({ icon, label, description }: { icon: string, label: string, description: string }) => {
  return (
    <button className="w-full text-left p-3 rounded-xl border flex items-center gap-3 group transition h-full bg-white border-slate-100 hover:border-slate-200 hover:shadow-sm dark:bg-slate-900/60 dark:border-slate-800 dark:hover:border-slate-700">
      <div className="w-8 h-8 shrink-0 rounded-lg flex items-center justify-center text-xs transition bg-cyan-50 group-hover:bg-cyan-100/70 text-cyan-600 dark:bg-slate-800 dark:group-hover:bg-slate-700 dark:text-cyan-400">
        <Icon name={icon} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-bold truncate text-slate-950 dark:text-zinc-100">{label}</p>
        <p className="text-[9px] text-slate-500 truncate leading-tight mt-0.5">{description}</p>
      </div>
    </button>
  );
};

export default function DesktopGridDashboard() {
  return (
    <div className="w-full max-w-[calc(100vw-16rem)] h-full p-5 select-none overflow-hidden transition-colors duration-300">
      
      {/* ================= MASTER 4-COLUMN, 6-ROW DESKTOP MESH ================= */}
      <div className="grid grid-cols-4 grid-rows-6 gap-4 h-full w-full">
        
        {/* COLUMNS 1-3 | ROWS 1-2: THE CHATBOT PANEL */}
        <section className="col-span-3 row-span-2 rounded-2xl p-5 shadow-lg border-2 transition-all flex flex-col justify-between bg-white border-blue-500 shadow-blue-100/30 dark:bg-slate-900/50 dark:border-cyan-500 dark:shadow-cyan-950/5">
          <div className="flex items-center justify-between w-full">
            <div className="min-w-0">
               <h2 className="text-lg font-extrabold tracking-tight">Welcome back, Aisyah! 👋</h2>
               <p className="text-[11px] text-slate-500 mt-0.5">How can I assist you with your academic vector pathways today?</p>
            </div>
            <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl font-bold shrink-0 shadow-sm bg-cyan-50 text-cyan-600 dark:bg-cyan-950/40 dark:text-cyan-400">
                <Icon name="robot" />
            </div>
          </div>

          <div className="w-full space-y-2.5">
            <div className="relative w-full">
              <input 
                type="text" 
                placeholder="Ask anything about courses, timetable schedules, or module prerequisites..." 
                className="w-full border rounded-full py-2.5 pl-4 pr-10 text-[11px] outline-none focus:ring-1 focus:ring-cyan-500 transition bg-slate-50 border-slate-200/80 text-slate-800 placeholder-slate-400 dark:bg-slate-950 dark:border-slate-800 text-slate-900 placeholder-slate-600"
              />
              <button className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-cyan-600 hover:text-cyan-500 transition">→</button>
            </div>
            <div className="flex gap-1.5">
              {['Alternative Courses', 'Optimize My Path', 'Prerequisites Check'].map(btn => (
                <button key={btn} className="text-[9px] font-bold py-1 px-2.5 rounded-full border transition bg-slate-100/80 border-slate-200 text-slate-600 hover:text-slate-900 dark:bg-slate-800 dark:border-slate-700 text-slate-300 hover:text-white">{btn}</button>
              ))}
            </div>
          </div>
        </section>

        {/* COLUMN 4 | ROWS 1-3: LIVE ALERTS LISTING */}
        <section className="col-span-1 row-span-3 rounded-2xl p-4 border flex flex-col shadow-sm transition-colors bg-white border-slate-200 dark:bg-slate-900 dark:border-slate-800">
          <div className="flex items-center justify-between mb-3 shrink-0">
             <h2 className="text-xs font-bold tracking-tight">Alerts & Notifications</h2>
             <span className="text-[9px] font-bold text-cyan-600 cursor-pointer">View all</span>
          </div>
          
          <div className="space-y-2 flex-grow overflow-y-auto pr-1">
             <AlertItem type="full" text="CS101 (Section B) is now FULL." time="2h ago" />
             <AlertItem type="conflict" text="Time clash detected on Network Lab." time="1d ago" />
             <AlertItem type="new" text="New module: AI Advanced Tech." time="2d ago" />
          </div>

          <div className="mt-3 p-3 rounded-xl border text-center shrink-0 bg-slate-50 border-slate-100 shadow-inner dark:bg-slate-950/40 dark:border-slate-800">
              <p className="text-[10px] text-slate-500 font-medium">Registration Node Opens In:</p>
              <p className="text-base font-black tracking-tight mt-0.5">3 Days <span className="text-[10px] text-slate-400 font-normal">at 9:00 AM</span></p>
          </div>
        </section>

        {/* COLUMNS 1-3 | ROWS 3-4: INTAKE SYSTEM NOTICES CONTAINER */}
        <section className="col-span-3 row-span-2 rounded-2xl p-5 border flex flex-col justify-between shadow-sm transition-colors bg-white border-slate-200 dark:bg-slate-900 dark:border-slate-800">
          <div>
            <h2 className="text-xs font-bold tracking-tight uppercase tracking-wider text-slate-900">Intake Registration System Status</h2>
            <p className="text-xs font-medium text-slate-700 mt-1">Real-time status vector tracking</p>
          </div>
          <div className="p-3.5 rounded-xl border text-[11px] leading-relaxed flex items-center gap-3 bg-cyan-50/60 border-cyan-100 text-cyan-800 shadow-sm dark:bg-cyan-950/10 dark:border-cyan-800/50 dark:text-cyan-300">
             <span className="text-base shrink-0">⚡</span>
             <p>
                <strong>System Notice:</strong> Course enrollment pipelines are operational. High-concurrency automated load balancing limits are handling waitlisted parameters automatically. No system conflicts detected.
             </p>
          </div>
        </section>

        {/* COLUMN 4 | ROWS 4-6: QUICK ACTIONS PANEL (AI Suggestions) */}
        <section className="col-span-1 row-span-3 rounded-2xl p-4 border flex flex-col shadow-sm transition-colors bg-white border-slate-200 dark:bg-slate-900 dark:border-slate-800">
          <div className="mb-3 shrink-0">
             <h2 className="text-xs font-bold tracking-tight">AI Optimization Matrix</h2>
             <p className="text-[9px] text-slate-500 mt-0.5">Quick actions toolbar allocation</p>
          </div>
          
          <div className="grid grid-cols-1 gap-2 flex-grow overflow-y-auto">
              <ActionItem icon="search" label="Search Courses" description="Filter dynamic module catalogs." />
              <ActionItem icon="structure" label="Optimize Plan" description="Balance degree structure path values." />
              <ActionItem icon="chatbot" label="Consult Assistant" description="Initialize diagnostic telemetry chat." />
          </div>
        </section>

        {/* COLUMNS 1-3 | ROWS 5-6: CURRENT TIMETABLE MATRIX */}
        <section className="col-span-3 row-span-2 rounded-2xl p-5 border flex flex-col shadow-sm transition-colors justify-between bg-white border-slate-200 dark:bg-slate-900 dark:border-slate-800">
          <div className="flex items-center justify-between w-full shrink-0">
             <h2 className="text-xs font-bold tracking-tight">Current Plan Overview</h2>
             <span className="text-[10px] font-bold text-slate-400 font-mono">18 Credits Registered</span>
          </div>

          <div className="grid grid-cols-5 gap-2.5 flex-grow mt-3 items-stretch">
             {['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map((day, idx) => (
               <div key={day} className="rounded-xl border flex flex-col min-w-0 bg-slate-50/60 border-slate-100 dark:bg-slate-950/40 dark:border-slate-800">
                 <div className="text-[9px] font-black tracking-widest text-center py-1.5 border-b uppercase border-slate-100 text-slate-400 shadow-inner bg-slate-100/30 dark:border-slate-800 dark:text-slate-500">{day}</div>
                 <div className="p-1.5 space-y-1.5 flex-grow flex flex-col justify-center">
                    {idx % 2 === 0 ? (
                      <>
                        <div className="p-1.5 rounded-lg border text-[9px] font-bold truncate leading-tight bg-white border-slate-200 text-slate-800 shadow-sm dark:bg-slate-900 dark:border-slate-800 dark:text-zinc-300">CS102</div>
                        <div className="p-1.5 rounded-lg border text-[9px] font-bold truncate leading-tight bg-cyan-50/40 border-cyan-100 text-cyan-700 shadow-sm dark:bg-slate-900/40 dark:border-slate-800 dark:text-cyan-300">MA123</div>
                      </>
                    ) : (
                      <div className="p-1.5 rounded-lg border text-[9px] font-bold truncate leading-tight bg-white border-slate-200 text-slate-800 shadow-sm dark:bg-slate-900 dark:border-slate-800 dark:text-zinc-300">SEC305</div>
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