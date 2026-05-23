"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

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
    info: "ℹ️"
  };
  return <span>{icons[name] || "•"}</span>;
};

interface DashboardMetrics {
  currentCredits: number;
  minCredits: number;
  maxCredits: number;
}

interface DashboardSystemNotice {
  status: string;
  message: string;
}

// 🌟 RECOMMENDED MODULE INTERFACE PATTERN FOR THE SIDEBAR ITEMS
interface RecommendedCourseItem {
  courseCode: string;
  courseName: string;
  creditHours: number;
  quotaRemaining: number;
  totalQuota: number;
}

interface DashboardAlert {
  id: string;
  type: "INFO" | "WARNING" | "CRITICAL";
  title: string;
  description: string;
  timeAgo: string;
  recommendedCourses?: RecommendedCourseItem[]; 
}

interface DashboardIntelResponse {
  success: boolean;
  data: {
    metrics: DashboardMetrics;
    systemNotice: DashboardSystemNotice;
    alerts: DashboardAlert[];
  };
}

interface BackendTimeSlot {
  dayOfWeek: number;
  startTime: number;
  endTime: number;
}

interface BackendCourse {
  courseCode: string;
  courseName: string;
  venue: string;
  timeSlots: BackendTimeSlot[];
}

export default function DesktopGridDashboard() {
  const router = useRouter();
  const [chatInput, setChatInput] = useState("");
  const [timetableCourses, setTimetableCourses] = useState<BackendCourse[]>([]);
  const [totalCredits, setTotalCredits] = useState(0);
  
  // Dashboard Intel API States
  const [metrics, setMetrics] = useState<DashboardMetrics>({ currentCredits: 0, minCredits: 12, maxCredits: 19 });
  const [systemNotice, setSystemNotice] = useState<DashboardSystemNotice>({ status: "SAFE", message: "Synchronizing intelligence context matrices..." });
  const [intelAlerts, setIntelAlerts] = useState<DashboardAlert[]>([]);

  useEffect(() => {
    const fetchTimetableData = async () => {
      try {
        const token = document.cookie
          .split("; ")
          .find((row) => row.startsWith("token="))
          ?.split("=")[1];

        const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
        const response = await fetch(`${baseUrl}/api/portal/timetable`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { "Authorization": `Bearer ${token}` } : {}),
          },
        });

        if (response.ok) {
          const json = await response.json();
          if (json.success && json.data) {
            setTimetableCourses(json.data);
            setTotalCredits(json.data.length * 3);
          }
        }
      } catch (err) {
        console.error("Dashboard timetable data fetch sync failure:", err);
      }
    };

    const fetchDashboardIntel = async () => {
      try {
        const token = document.cookie
          .split("; ")
          .find((row) => row.startsWith("token="))
          ?.split("=")[1];
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
        
        const response = await fetch(`${baseUrl}/api/portal/dashboard-intel`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { "Authorization": `Bearer ${token}` } : {}),
          },
        });

        if (response.ok) {
          const json: DashboardIntelResponse = await response.json();
          if (json.success && json.data) {
            setMetrics(json.data.metrics);
            setSystemNotice(json.data.systemNotice);
            setIntelAlerts(json.data.alerts);
          }
        }
      } catch (err) {
        console.error("Dashboard Intel telemetry load crash:", err);
      }
    };

    fetchTimetableData();
    fetchDashboardIntel();
  }, []);

  const handleChatRedirectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    
    const userQuery = chatInput.trim();
    const encodedQuery = encodeURIComponent(userQuery);
    router.push(`/main/chatbot?q=${encodedQuery}`);
  };

  const getCoursesForDay = (dayIndex: number) => {
    return timetableCourses.filter((course) =>
      course.timeSlots.some((slot) => slot.dayOfWeek === dayIndex)
    );
  };

  const formatTimeStr = (timeNum: number) => {
    const hours = Math.floor(timeNum / 100).toString().padStart(2, "0");
    const mins = (timeNum % 100).toString().padStart(2, "0");
    return `${hours}:${mins}`;
  };

  const DAYS_MAPPING = [
    { name: "MON", index: 1 },
    { name: "TUE", index: 2 },
    { name: "WED", index: 3 },
    { name: "THU", index: 4 },
    { name: "FRI", index: 5 },
  ];

  return (
    <div className="w-full max-w-[calc(100vw-16rem)] h-full p-5 select-text overflow-hidden transition-colors duration-300">
      
      <div className="grid grid-cols-4 grid-rows-6 gap-4 h-full w-full">
        
        {/* COLUMNS 1-3 | ROWS 1-2: CHATBOT PANEL */}
        <section className="col-span-3 row-span-2 rounded-2xl p-5 shadow-lg border-2 transition-all flex flex-col justify-between bg-white border-blue-500 shadow-blue-100/30 dark:bg-slate-900/50 dark:border-cyan-500 dark:shadow-cyan-950/5">
          <div className="flex items-center justify-between w-full">
            <div className="min-w-0">
               <h2 className="text-lg font-extrabold tracking-tight text-slate-900 dark:text-white">Welcome back! 👋</h2>
               <p className="text-[13px] text-slate-500 mt-0.5">How can I assist you with your academic vector pathways today?</p>
            </div>
            <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl font-bold shrink-0 shadow-sm bg-cyan-50 text-cyan-600 dark:bg-cyan-950/40 dark:text-cyan-400">
                <Icon name="robot" />
            </div>
          </div>

          <form onSubmit={handleChatRedirectSubmit} className="w-full space-y-2.5">
            <div className="relative w-full">
              <input 
                type="text" 
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Ask anything about courses, timetable schedules, or module prerequisites..." 
                className="w-full border rounded-full py-2.5 pl-4 pr-10 text-[12px] outline-none focus:ring-1 focus:ring-cyan-500 transition bg-slate-50 border-slate-200/80 text-slate-800 placeholder-slate-400 dark:bg-slate-950 dark:border-slate-800 dark:text-white dark:placeholder-slate-600"
              />
              <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-cyan-600 hover:text-cyan-500 transition">→</button>
            </div>
            <div className="flex gap-1.5">
              {['Alternative Courses', 'Optimize My Path', 'Prerequisites Check'].map(btn => (
                <button 
                  key={btn} 
                  type="button"
                  onClick={() => { setChatInput(btn); }}
                  className="text-[9px] font-bold py-1 px-2.5 rounded-full border transition bg-slate-100/80 border-slate-200 text-slate-600 hover:text-slate-900 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:text-white"
                >
                  {btn}
                </button>
              ))}
            </div>
          </form>
        </section>

        {/* ================================================================= */}
        {/* 🌟 核心修改点：仅重组 COLUMN 4 | ROWS 1-6 的 ALERTS AREA 行为样式 */}
        {/* ================================================================= */}
        <section className="col-span-1 row-span-6 rounded-2xl p-4 border flex flex-col shadow-sm transition-colors bg-white border-slate-200 dark:bg-slate-900 dark:border-slate-800 overflow-hidden">
          <div className="flex items-center justify-between mb-3 shrink-0 text-slate-900 dark:text-white">
             <h2 className="text-xs font-bold tracking-tight">Alerts & Notifications</h2>
             <span className="text-[10px] font-bold text-cyan-600 cursor-pointer">View all</span>
          </div>
          
          <div className="space-y-2.5 flex-grow overflow-y-auto pr-1 min-h-0">
             {intelAlerts.map((alert) => (
               <div key={alert.id} className="p-3 rounded-xl border text-[11px] border-slate-100 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-950/40 space-y-2 shadow-sm">
                 <div className="flex items-start gap-2">
                   <div className="w-6 h-6 rounded bg-cyan-50 dark:bg-slate-800 text-cyan-600 dark:text-cyan-400 text-[10px] flex items-center justify-center shrink-0 font-bold">
                     <Icon name={alert.type === "INFO" ? "info" : "alerts"} />
                   </div>
                   <div className="flex-1 min-w-0">
                     <p className="font-bold truncate text-slate-900 dark:text-slate-200">{alert.title}</p>
                     <p className="text-[10px] text-slate-500 leading-normal mt-0.5">{alert.description}</p>
                   </div>
                 </div>

                 {/* 🚀 AI Recommendation List Parser Node Map */}
                 {alert.recommendedCourses && alert.recommendedCourses.length > 0 && (
                   <div className="space-y-1.5 pt-1.5 border-t border-slate-200/60 dark:border-slate-800/60">
                     {alert.recommendedCourses.map((course, idx) => (
                       <div key={idx} className="p-2 rounded-lg border bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 flex flex-col gap-0.5 shadow-2xs">
                         <div className="flex justify-between items-center">
                           <span className="font-mono font-black text-[9.5px] text-cyan-600 dark:text-cyan-400">{course.courseCode}</span>
                           <span className="text-[8.5px] text-slate-400 font-medium font-mono">{course.creditHours} Cr</span>
                         </div>
                         <p className="text-[9.5px] font-bold text-slate-800 dark:text-zinc-300 truncate">{course.courseName}</p>
                         
                         <div className="flex items-center justify-between mt-1 text-[8.5px]">
                           <span className="text-slate-400 font-medium font-mono">Capacity Limit:</span>
                           <span className={`font-mono font-bold px-1 py-0.2 rounded ${
                             course.quotaRemaining <= 5 
                               ? "bg-rose-50 text-rose-600 dark:bg-rose-950/20 dark:text-rose-400" 
                               : "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400"
                           }`}>
                             {course.quotaRemaining} / {course.totalQuota} Left
                           </span>
                         </div>
                       </div>
                     ))}
                   </div>
                 )}

                 <span className="text-[8px] text-slate-400 font-mono block text-right mt-1">{alert.timeAgo}</span>
               </div>
             ))}
          </div>
        </section>

        {/* COLUMNS 1-3 | ROWS 3-4: INTAKE REGISTRATION SYSTEM STATUS */}
        <section className="col-span-3 row-span-2 rounded-2xl p-5 border flex flex-col justify-between shadow-sm transition-colors bg-white border-slate-200 dark:bg-slate-900 dark:border-slate-800">
          <div className="flex justify-between items-start w-full shrink-0">
            <div>
              <h2 className="text-xs font-bold tracking-tight uppercase tracking-wider text-slate-900 dark:text-white">Intake Registration System Status</h2>
              <p className="text-xs font-medium text-slate-400 mt-1">Real-time status vector tracking</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 mt-4 flex-grow items-stretch">
            <div className="p-4 rounded-xl border flex flex-col justify-between bg-slate-50/50 border-slate-100 dark:bg-slate-950/20 dark:border-slate-800">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Registration Status</p>
                <h3 className="text-sm font-bold text-slate-800 dark:text-zinc-200 mt-1">Pending Registration Open</h3>
              </div>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-2xl font-black text-cyan-600 dark:text-cyan-400">03</span>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Days Left</span>
              </div>
            </div>

            <div className="p-4 rounded-xl border flex flex-col justify-between bg-slate-50/50 border-slate-100 dark:bg-slate-950/20 dark:border-slate-800">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Credit Hours Load</p>
                <div className="flex justify-between items-center mt-1">
                  <h3 className="text-sm font-bold text-slate-800 dark:text-zinc-200">Current Load</h3>
                  <span className="text-[10px] font-mono font-bold text-slate-400">{totalCredits} / 19 Hours</span>
                </div>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden mt-3">
                <div 
                  className="bg-cyan-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${(totalCredits / 19) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </section>

        {/* COLUMNS 1-3 | ROWS 5-6: PLAN OVERVIEW WEEKDAY MATRIX */}
        <section className="col-span-3 row-span-2 rounded-2xl p-5 border flex flex-col shadow-sm transition-colors justify-between bg-white border-slate-200 dark:bg-slate-900 dark:border-slate-800">
          <div className="flex items-center justify-between w-full shrink-0">
             <h2 className="text-xs font-bold tracking-tight text-slate-900 dark:text-white">Current Plan Overview</h2>
             <span className="text-[10px] font-bold text-slate-600 font-mono">{totalCredits} Credits Registered</span>
          </div>

          <div className="grid grid-cols-5 gap-2.5 flex-grow mt-3 items-stretch">
             {DAYS_MAPPING.map((day) => {
               const dayCourses = getCoursesForDay(day.index);

               return (
                 <div key={day.name} className="rounded-xl border flex flex-col min-w-0 bg-slate-50/60 border-slate-100 dark:bg-slate-950/40 dark:border-slate-800">
                   <div className="text-[9px] font-black tracking-widest text-center py-1.5 border-b uppercase border-slate-100 text-slate-400 shadow-inner bg-slate-100/30 dark:border-slate-800 dark:text-slate-500">
                     {day.name}
                   </div>
                   <div className="p-1.5 space-y-1.5 flex-grow flex flex-col justify-start min-h-[100px]">
                     {dayCourses.length === 0 ? (
                       <div className="text-[8px] text-center text-slate-300 dark:text-slate-700 font-mono my-auto">FREE</div>
                     ) : (
                       dayCourses.map((course, cIdx) => {
                         const activeSlot = course.timeSlots.find(slot => slot.dayOfWeek === day.index);
                         const timeString = activeSlot 
                           ? `${formatTimeStr(activeSlot.startTime)}-${formatTimeStr(activeSlot.endTime)}`
                           : "";

                         return (
                           <div 
                             key={cIdx} 
                             title={`${course.courseName} (${timeString})`}
                             className="p-1.5 rounded-lg border text-[9px] font-bold bg-white border-slate-200 text-slate-800 shadow-sm dark:bg-slate-900 dark:border-slate-800 dark:text-zinc-300 flex items-center justify-between gap-1.5"
                           >
                             <span className="font-mono text-[9px] shrink-0">{course.courseCode}</span>
                             {timeString && (
                               <span className="text-[9px] font-normal text-slate-500 dark:text-slate-400 font-mono shrink-0">
                                 {timeString}
                               </span>
                             )}
                           </div>
                         );
                       })
                     )}
                   </div>
                 </div>
               );
             })}
          </div>
        </section>

      </div>
    </div>
  );
}