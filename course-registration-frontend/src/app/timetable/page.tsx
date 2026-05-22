"use client";

// Shared icon dictionary
const Icon = ({ name }: { name: string }) => {
  const icons: Record<string, string> = {
    bell: "🔔",
    dashboard: "📊",
    calendar: "📅",
    search: "🔍",
    structure: "📐",
    chatbot: "🤖",
    print: "🖨️",
    download: "📥"
  };
  return <span>{icons[name] || "•"}</span>;
};

// Mock dataset for a full academic schedule
const SCHEDULED_COURSES = [
  { day: "Mon", time: "09:00 AM", code: "CS102", name: "Programming Fundamentals", room: "Lab 3", color: "cyan" },
  { day: "Mon", time: "01:00 PM", code: "MA123", name: "Network Architecture", room: "Theatre 1", color: "blue" },
  { day: "Tue", time: "11:00 AM", code: "SEC305", name: "Database Systems", room: "Block G", color: "purple" },
  { day: "Wed", time: "09:00 AM", code: "CS102", name: "Programming Fundamentals", room: "Lab 3", color: "cyan" },
  { day: "Wed", time: "03:00 PM", code: "MA123", name: "Network Architecture", room: "Theatre 1", color: "blue" },
  { day: "Thu", time: "01:00 PM", code: "SEC305", name: "Database Systems", room: "Block G", color: "purple" },
  { day: "Fri", time: "11:00 AM", code: "ENG101", name: "Technical Communication", room: "Online", color: "slate" },
];

const TIME_SLOTS = ["09:00 AM", "11:00 AM", "01:00 PM", "03:00 PM", "05:00 PM"];
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri"];

export default function TimetablePage() {
  return (
    // Width constrained perfectly to prevent right side overflowing the layout edge
    <div className="w-full max-w-[calc(100vw-16rem)] h-full p-5 font-sans select-none overflow-hidden transition-colors duration-300">
      
      {/* MASSIVE MASTER TIME TABLE SHEET CANVAS (Takes full available column width) */}
      <main className="w-full h-full rounded-2xl border p-6 flex flex-col shadow-sm bg-white border-slate-200 dark:bg-slate-900 dark:border-slate-800 transition-colors overflow-hidden">
        
        {/* Calendar Management Header Line */}
        <div className="flex justify-between items-center pb-5 border-b border-slate-100 dark:border-slate-800 mb-5 shrink-0">
          <div>
            <h1 className="text-xl font-extrabold tracking-tight">My Class Schedule</h1>
            <p className="text-[11px] text-slate-500 mt-0.5">Semester 1 • Finalized Registration Plan</p>
          </div>
          
          {/* Quick Utility controls */}
          <div className="flex gap-2">
            <button className="flex items-center gap-2 px-3 py-1.5 text-[11px] font-bold border rounded-xl shadow-sm transition bg-slate-50 border-slate-200 hover:bg-slate-100 dark:bg-slate-800 dark:border-slate-700 dark:hover:bg-slate-700">
              <Icon name="print" /> Print Matrix
            </button>
            <button className="flex items-center gap-2 px-3 py-1.5 text-[11px] font-bold text-white bg-cyan-600 hover:bg-cyan-500 rounded-xl shadow-sm transition">
              <Icon name="download" /> Export iCal
            </button>
          </div>
        </div>

        {/* The Calendar Grid Container Block */}
        <div className="flex-grow flex flex-col min-h-0 border rounded-xl overflow-hidden border-slate-100 dark:border-slate-800">
          
          {/* Top Row: Weekday column titles headers */}
          <div className="grid grid-cols-6 border-b shrink-0 text-center text-[10px] font-black uppercase tracking-widest bg-slate-50 border-slate-100 text-slate-500 dark:bg-slate-950/60 dark:border-slate-800 dark:text-slate-400">
            <div className="py-3 border-r border-slate-100 dark:border-slate-800">Time Window</div>
            {DAYS.map((day) => (
              <div key={day} className="py-3 last:border-r-0 border-r border-slate-100 dark:border-slate-800">{day}</div>
            ))}
          </div>

          {/* Matrix Core Rows (Time Slots cross reference) */}
          <div className="flex-grow overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
            {TIME_SLOTS.map((timeSlot) => (
              <div key={timeSlot} className="grid grid-cols-6 items-stretch min-h-[90px]">
                
                {/* Time coordinate indicator box */}
                <div className="text-[10px] font-mono font-bold flex flex-col justify-center items-center border-r border-slate-100 dark:border-slate-800 p-2 text-center bg-slate-50/40 text-slate-400 dark:bg-slate-950/20 dark:text-slate-500">
                  {timeSlot}
                </div>

                {/* Day cell generator loop */}
                {DAYS.map((day) => {
                  const course = SCHEDULED_COURSES.find(c => c.day === day && c.time === timeSlot);

                  return (
                    <div key={day} className="border-r last:border-r-0 border-slate-100 dark:border-slate-800 p-2 flex items-stretch min-w-0">
                      {course ? (
                        <div className={`w-full rounded-xl p-3 border flex flex-col justify-between transition-all hover:scale-[1.01] ${
                          course.color === 'cyan'
                            ? 'bg-cyan-50 border-cyan-200 text-cyan-800 dark:bg-cyan-950/20 dark:border-cyan-800/80 dark:text-cyan-300'
                            : course.color === 'blue'
                            ? 'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-950/20 dark:border-blue-800/80 dark:text-blue-300'
                            : course.color === 'purple'
                            ? 'bg-purple-50 border-purple-200 text-purple-800 dark:bg-purple-950/20 dark:border-purple-800/80 dark:text-purple-300'
                            : 'bg-slate-100 border-slate-200 text-slate-700 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300'
                        }`}>
                          <div>
                            <div className="flex items-center justify-between gap-1">
                              <span className="text-[10px] font-mono font-extrabold tracking-wide uppercase opacity-75">{course.code}</span>
                              <span className="text-[9px] font-semibold opacity-60 px-1.5 py-0.5 rounded bg-black/5 dark:bg-white/5">{course.room}</span>
                            </div>
                            <h3 className="text-[11px] font-bold leading-tight mt-1 line-clamp-2">{course.name}</h3>
                          </div>
                          <p className="text-[9px] opacity-50 font-medium mt-1">Duration: 2 hours</p>
                        </div>
                      ) : (
                        <div className="w-full rounded-lg border border-dashed border-transparent transition hover:bg-slate-100/30 dark:hover:bg-slate-800/20"></div>
                      )}
                    </div>
                  );
                })}

              </div>
            ))}
          </div>

        </div>
      </main>

    </div>
  );
}