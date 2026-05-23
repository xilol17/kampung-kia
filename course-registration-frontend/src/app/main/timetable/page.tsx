"use client";

import { useState, useEffect } from "react";

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

// TypeScript interfaces matching your backend schema
interface BackendTimeSlot {
  dayOfWeek: number;
  startTime: number;
  endTime: number;
}

interface BackendCourse {
  courseCode: string;
  courseName: string;
  sectionNumber: string;
  venue: string;
  status: string;
  timeSlots: BackendTimeSlot[];
}

interface TimetableApiResponse {
  success: boolean;
  semester: string;
  data: BackendCourse[];
}

const TIME_SLOTS = [
  "08:00 AM", "09:00 AM", "10:00 AM", "11:00 AM", "12:00 PM",
  "01:00 PM", "02:00 PM", "03:00 PM", "04:00 PM", "05:00 PM"
];

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri"];

const COURSE_COLORS: Record<string, string> = {
  BCI: "cyan",
  UHC: "purple",
  ULE: "blue",
  BCS: "cyan"
};

export default function TimetablePage() {
  const [timetableData, setTimetableData] = useState<TimetableApiResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);

  // Dynamic side-effect fetch operation
  useEffect(() => {
    const fetchTimetable = async () => {
      try {
        setIsLoading(true);
        setErrorNotice(null);

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
          const json: TimetableApiResponse = await response.json();
          setTimetableData(json);
        } else {
          const errData = await response.json().catch(() => ({}));
          setErrorNotice(errData.message || "Failed to retrieve class schedule records.");
        }
      } catch (err) {
        console.error("Timetable bridge synchronization fault:", err);
        setErrorNotice("Network interface error: Could not connect to schedule server.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchTimetable();
  }, []);

  // Helper mapping transformer that unrolls multi-hour objects to slot coordinates
  const getProcessedCourses = () => {
    if (!timetableData || !timetableData.data) return [];
    
    const list: Array<{ day: string; time: string; code: string; name: string; room: string; color: string }> = [];
    const dayMap = ["", "Mon", "Tue", "Wed", "Thu", "Fri"];

    const convertToSlotString = (hour: number) => {
      if (hour === 12) return "12:00 PM";
      if (hour > 12) {
        const h = hour - 12;
        return `${h.toString().padStart(2, "0")}:00 PM`;
      }
      return `${hour.toString().padStart(2, "0")}:00 AM`;
    };

    timetableData.data.forEach((course) => {
      const prefix = course.courseCode.substring(0, 3);
      const assignedColor = COURSE_COLORS[prefix] || "slate";

      course.timeSlots.forEach((slot) => {
        const targetDay = dayMap[slot.dayOfWeek];
        if (!targetDay) return;

        const startHour = Math.floor(slot.startTime / 100);
        const endHour = Math.floor(slot.endTime / 100);

        // Duplicates entries dynamically into each hourly slot block boundary
        for (let hour = startHour; hour < endHour; hour++) {
          const stringCoordinateTime = convertToSlotString(hour);
          
          list.push({
            day: targetDay,
            time: stringCoordinateTime,
            code: course.courseCode,
            name: course.courseName,
            room: course.venue,
            color: assignedColor
          });
        }
      });
    });

    return list;
  };

  const processedCourses = getProcessedCourses();

  return (
    <div className="w-full max-w-[calc(100vw-16rem)] h-full p-5 font-sans select-none overflow-hidden transition-colors duration-300">
      
      {/* MASSIVE MASTER TIME TABLE SHEET CANVAS */}
      <main className="w-full h-full rounded-2xl border p-6 flex flex-col shadow-sm bg-white border-slate-200 dark:bg-slate-900 dark:border-slate-800 transition-colors overflow-hidden">
        
        {/* Calendar Management Header Line */}
        <div className="flex justify-between items-center pb-5 border-b border-slate-100 dark:border-slate-800 mb-5 shrink-0">
          <div>
            <h1 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">My Class Schedule</h1>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {isLoading 
                ? "Synchronizing registration matrices..." 
                : errorNotice 
                ? "Sync Offline" 
                : `Semester: ${timetableData?.semester} • Live Structural Grid Map`}
            </p>
          </div>
          
          {/* Quick Utility controls */}
          <div className="flex gap-2">
            <button className="flex items-center gap-2 px-3 py-1.5 text-[11px] font-bold border rounded-xl shadow-sm transition bg-slate-50 border-slate-200 hover:bg-slate-100 dark:bg-slate-800 dark:border-slate-700 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300">
              <Icon name="print" /> Print Matrix
            </button>
            <button className="flex items-center gap-2 px-3 py-1.5 text-[11px] font-bold text-white bg-cyan-600 hover:bg-cyan-500 rounded-xl shadow-sm transition">
              <Icon name="download" /> Export iCal
            </button>
          </div>
        </div>

        {/* The Calendar Grid Container Block */}
        <div className="flex-grow flex flex-col min-h-0 border rounded-xl overflow-hidden border-slate-100 dark:border-slate-800 relative">
          
          {/* View State overlay loader */}
          {isLoading && (
            <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] dark:bg-slate-950/60 flex items-center justify-center z-10 font-mono text-xs font-black tracking-widest text-slate-400 dark:text-slate-500 uppercase animate-pulse">
              Connecting database stream node...
            </div>
          )}

          {/* View State error handling message screen */}
          {errorNotice && !isLoading && (
            <div className="absolute inset-0 bg-rose-50/40 backdrop-blur-sm dark:bg-rose-950/5 flex flex-col items-center justify-center z-10 p-6 text-center">
              <span className="text-2xl mb-2">📡</span>
              <p className="text-xs font-mono font-bold text-rose-600 dark:text-rose-400 max-w-sm">
                {errorNotice}
              </p>
              <button 
                onClick={() => window.location.reload()} 
                className="mt-4 text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 bg-slate-900 text-white dark:bg-white dark:text-slate-900 rounded-lg shadow active:scale-95 transition"
              >
                Retry Matrix Sync
              </button>
            </div>
          )}

          {/* Top Row: Weekday column titles headers */}
          <div className="grid grid-cols-6 border-b shrink-0 text-center text-[10px] font-black uppercase tracking-widest bg-slate-50 border-slate-100 text-slate-500 dark:bg-slate-950/60 dark:border-slate-800 dark:text-slate-400">
            <div className="py-3 border-r border-slate-100 dark:border-slate-800">Time Window</div>
            {DAYS.map((day) => (
              <div key={day} className="py-3 last:border-r-0 border-r border-slate-100 dark:border-slate-800">{day}</div>
            ))}
          </div>

          {/* Matrix Core Rows */}
          <div className="flex-grow overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
            {TIME_SLOTS.map((timeSlot) => (
              <div key={timeSlot} className="grid grid-cols-6 items-stretch min-h-[85px]">
                
                {/* Time coordinate indicator box */}
                <div className="text-[10px] font-mono font-bold flex flex-col justify-center items-center border-r border-slate-100 dark:border-slate-800 p-2 text-center bg-slate-50/40 text-slate-400 dark:bg-slate-950/20 dark:text-slate-500">
                  {timeSlot}
                </div>

                {/* Day cell generator loop */}
                {DAYS.map((day) => {
                  const course = processedCourses.find(c => c.day === day && c.time === timeSlot);

                  return (
                    <div key={day} className="border-r last:border-r-0 border-slate-100 dark:border-slate-800 p-1 flex items-stretch min-w-0">
                      {course ? (
                        <div className={`w-full rounded-xl p-2.5 border flex flex-col justify-between transition-all hover:scale-[1.01] ${
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
                              <span className="text-[9px] font-mono font-extrabold tracking-wide uppercase opacity-75">{course.code}</span>
                              <span className="text-[8px] font-semibold opacity-60 px-1.5 py-0.5 rounded bg-black/5 dark:bg-white/5 truncate">{course.room}</span>
                            </div>
                            <h3 className="text-[10px] font-bold leading-tight mt-0.5 line-clamp-2 text-slate-800 dark:text-zinc-200">{course.name}</h3>
                          </div>
                          <p className="text-[8px] opacity-50 font-medium mt-0.5">Duration Segment Block</p>
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