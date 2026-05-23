"use client";

import { useState, useEffect } from "react";
import toast, { Toaster } from "react-hot-toast"; // 🌟 引入 Toast 引擎保证提示质感一致

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
    download: "📥",
    info: "ℹ️",
    close: "✕"
  };
  return <span>{icons[name] || "•"}</span>;
};

// TypeScript interfaces matching backend schema
interface BackendTimeSlot {
  dayOfWeek: number;
  startTime: number;
  endTime: number;
}

interface BackendCourse {
  courseCode: string;
  courseName: string;
  creditHours: number; 
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
  BCS: "cyan",
  ULA: "slate",
  ULJ: "slate",
  ULM: "slate"
};

export default function TimetablePage() {
  const [timetableData, setTimetableData] = useState<TimetableApiResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);
  
  // 动态状态：用来存储从后端拉取并累加出的真实总学分
  const [totalCredits, setTotalCredits] = useState(0);
  const [isDropping, setIsDropping] = useState(false); // 🌟 防连续触发锁状态
  
  // 控制弹窗表单的开启以及存储当前被点击的课程详情
  const [selectedCourse, setSelectedCourse] = useState<any | null>(null);

  // 📡 封装的核心数据获取管道
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
        
        // 遍历后端下发的真实 data 数组，将每一门课的 creditHours 累加
        if (json.data && json.data.length > 0) {
          const dynamicCalculatedCredits = json.data.reduce(
            (sum, course) => sum + (course.creditHours ?? 0), 
            0
          );
          setTotalCredits(dynamicCalculatedCredits);
        } else {
          setTotalCredits(0);
        }

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

  useEffect(() => {
    fetchTimetable();
  }, []);

  // 🌟 核心新增点：真实提交后端退选处理流程 (Integrated drop submission executor)
  const handleDropCourseSubmit = async (courseCode: string) => {
    if (isDropping) return;
    setIsDropping(true);

    setSelectedCourse(null); // 平滑关闭当前弹窗窗口
    
    // 触发暗黑硬核质感退选加载框
    const dropToastId = toast.loading(`Terminating registration records for ${courseCode}...`, {
      style: { background: '#1e1b4b', color: '#f87171', border: '1px solid #ef4444' }
    });

    try {
      const token = document.cookie
        .split("; ")
        .find((row) => row.startsWith("token="))
        ?.split("=")[1];

      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

      const response = await fetch(`${baseUrl}/api/portal/course/drop`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { "Authorization": `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ courseCode }), // 将要退选的科目代码打包传送给后端
      });

      const json = await response.json();

      if (json.success) {
        // 玫瑰红赛博注销通知
        toast.success(`Successfully dropped ${courseCode}. Credits recalculated.`, {
          id: dropToastId,
          style: { background: '#0f172a', color: '#f43f5e', border: '1px solid #e11d48', fontWeight: 'bold' },
          icon: '🗑️'
        });
        fetchTimetable(); // 隐式刷新，重新拉取并重构最新课表矩阵
      } else {
        toast.error(json.message || "Failed to drop module parameter restrictions.", { id: dropToastId });
      }
    } catch (error) {
      console.error(error);
      toast.error("Network system fault. Failed to synchronize core node drop.", { id: dropToastId });
    } finally {
      setIsDropping(false);
    }
  };

  // 格式化时间的辅助函数 (1600 -> "16:00")
  const formatTimeNum = (timeNum: number) => {
    const hours = Math.floor(timeNum / 100).toString().padStart(2, "0");
    const mins = (timeNum % 100).toString().padStart(2, "0");
    return `${hours}:${mins}`;
  };

  // Unrolls course arrays to matrix components
  const getProcessedCourses = () => {
    if (!timetableData || !timetableData.data) return [];
    
    const list: Array<{ 
      day: string; 
      time: string; 
      code: string; 
      name: string; 
      room: string; 
      color: string;
      raw: BackendCourse; 
    }> = [];
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

        for (let hour = startHour; hour < endHour; hour++) {
          const stringCoordinateTime = convertToSlotString(hour);
          
          list.push({
            day: targetDay,
            time: stringCoordinateTime,
            code: course.courseCode,
            name: course.courseName,
            room: course.venue,
            color: assignedColor,
            raw: course
          });
        }
      });
    });

    return list;
  };

  const processedCourses = getProcessedCourses();
  const totalCoursesCount = timetableData?.data?.length || 0;

  return (
    <div className="w-full max-w-[calc(100vw-16rem)] h-full p-3.5 font-sans overflow-hidden transition-colors duration-300">
      
      {/* 挂载全局全局 Toast 容器提示面板 */}
      <Toaster position="bottom-right" reverseOrder={false} />

      {/* MASSIVE MASTER TIME TABLE SHEET CANVAS */}
      <main className="w-full h-full rounded-2xl border p-4 flex flex-col shadow-sm bg-white border-slate-200 dark:bg-slate-900 dark:border-slate-800 transition-colors overflow-hidden">
        
        {/* Calendar Management Header Line */}
        <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800 mb-2.5 shrink-0">
          <div>
            <h1 className="text-lg font-extrabold tracking-tight text-slate-900 dark:text-white">My Class Schedule</h1>
            <p className="text-[10px] text-slate-500 mt-0.5">
              {isLoading 
                ? "Synchronizing registration matrices..." 
                : errorNotice 
                ? "Sync Offline" 
                : `Semester: ${timetableData?.semester} • Live Structural Grid Map`}
            </p>
          </div>
        </div>

        {/* The Calendar Grid Container Block */}
        <div className="flex-1 flex flex-col min-h-0 border rounded-xl overflow-hidden border-slate-100 dark:border-slate-800 relative mb-3">
          
          {/* View State overlays */}
          {isLoading && (
            <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] dark:bg-slate-950/60 flex items-center justify-center z-10 font-mono text-xs font-black tracking-widest text-slate-400 dark:text-slate-500 uppercase animate-pulse">
              Connecting database stream node...
            </div>
          )}

          {errorNotice && !isLoading && (
            <div className="absolute inset-0 bg-rose-50/40 backdrop-blur-sm dark:bg-rose-950/5 flex flex-col items-center justify-center z-10 p-6 text-center">
              <span className="text-2xl mb-2">📡</span>
              <p className="text-xs font-mono font-bold text-rose-600 dark:text-rose-400 max-w-sm">{errorNotice}</p>
              <button onClick={() => window.location.reload()} className="mt-4 text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 bg-slate-950 text-white dark:bg-white dark:text-slate-900 rounded-lg shadow active:scale-95 transition">
                Retry Matrix Sync
              </button>
            </div>
          )}

          {/* Top Row: Weekday headers */}
          <div className="grid grid-cols-6 border-b shrink-0 text-center text-[9px] font-black uppercase tracking-widest bg-slate-50 border-slate-100 text-slate-500 dark:bg-slate-950/60 dark:border-slate-800 dark:text-slate-400">
            <div className="py-2 border-r border-slate-100 dark:border-slate-800">Time Window</div>
            {DAYS.map((day) => (
              <div key={day} className="py-2 border-r last:border-r-0 border-slate-100 dark:border-slate-800">{day}</div>
            ))}
          </div>

          {/* Matrix Core Rows */}
          <div className="flex-grow overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
            {TIME_SLOTS.map((timeSlot) => (
              <div key={timeSlot} className="grid grid-cols-6 items-stretch min-h-[59px]">
                
                {/* Time indicator */}
                <div className="text-[11px] font-mono font-bold flex flex-col justify-center items-center border-r border-slate-100 dark:border-slate-800 p-0.5 text-center bg-slate-50/40 text-slate-400 dark:bg-slate-950/20 dark:text-slate-500">
                  {timeSlot}
                </div>

                {/* Day cells */}
                {DAYS.map((day) => {
                  const currentCourseNode = processedCourses.find(c => c.day === day && c.time === timeSlot);

                  return (
                    <div key={day} className="border-r last:border-r-0 border-slate-100 dark:border-slate-800 p-0.5 flex items-stretch min-w-0">
                      {currentCourseNode ? (
                        <div 
                          onClick={() => setSelectedCourse({
                            ...currentCourseNode.raw,
                            activeDay: day,
                            activeSlot: timeSlot
                          })}
                          className={`w-full rounded-md p-1.5 border flex flex-col justify-center cursor-pointer transition-all hover:scale-[1.01] hover:brightness-95 active:scale-95 ${
                            currentCourseNode.color === 'cyan'
                              ? 'bg-cyan-50 border-cyan-200 text-cyan-800 dark:bg-cyan-950/20 dark:border-cyan-800/80 dark:text-cyan-300'
                              : currentCourseNode.color === 'blue'
                              ? 'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-950/20 dark:border-blue-800/80 dark:text-blue-300'
                              : currentCourseNode.color === 'purple'
                              ? 'bg-purple-50 border-purple-200 text-purple-800 dark:bg-purple-950/20 dark:border-purple-800/80 dark:text-purple-300'
                              : currentCourseNode.color === 'slate'
                              ? 'bg-slate-50 border-slate-200 text-slate-700 dark:bg-slate-800/40 dark:border-slate-700/80 dark:text-slate-300'
                              : 'bg-slate-100 border-slate-200 text-slate-700 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300'
                          }`}
                        >
                          <div>
                            <div className="flex items-center justify-between gap-0.5">
                              <span className="text-[9px] font-mono font-extrabold tracking-tight opacity-90 leading-none">{currentCourseNode.code}</span>
                              <span className="text-[9px] font-semibold opacity-70 px-1 py-0.2 rounded bg-black/5 dark:bg-white/5 truncate max-w-[45px] leading-none">{currentCourseNode.room}</span>
                            </div>
                            <h3 className="text-[10px] font-bold leading-tight mt-0.5 truncate text-slate-800 dark:text-zinc-200">{currentCourseNode.name}</h3>
                          </div>
                        </div>
                      ) : (
                        <div className="w-full rounded-md border border-dashed border-transparent transition hover:bg-slate-100/30 dark:hover:bg-slate-800/20"></div>
                      )}
                    </div>
                  );
                })}

              </div>
            ))}
          </div>

        </div>

        {/* Registered Subjects 2-Column Split Matrix with Interactive Hover Effects */}
        <div className="shrink-0 mb-3 px-3 py-2 border rounded-xl bg-slate-50/30 border-slate-100 dark:bg-slate-950/20 dark:border-slate-800">
          <div className="grid grid-cols-2 gap-x-8 gap-y-0.5">
            {timetableData?.data && timetableData.data.length > 0 ? (
              timetableData.data.map((subj, index) => (
                <div 
                  key={index}
                  onClick={() => setSelectedCourse({ ...subj })}
                  className="flex items-center text-[10px] font-bold tracking-wide cursor-pointer transition-all duration-200 text-slate-800 dark:text-zinc-200 hover:text-cyan-600 dark:hover:text-cyan-400 py-1 px-2 rounded-md hover:bg-slate-100/60 dark:hover:bg-slate-800/40 hover:translate-x-1"
                >
                  <span className="font-mono text-slate-950 dark:text-white shrink-0 min-w-[65px]">
                    {subj.courseCode}
                  </span>
                  <span className="mx-1.5 text-slate-300 dark:text-slate-700 font-normal">-</span>
                  <span className="truncate font-sans uppercase text-slate-700 dark:text-zinc-300">
                    {subj.courseName}
                  </span>
                </div>
              ))
            ) : (
              <div className="col-span-2 text-center py-1 text-xs font-mono text-slate-400">
                No active course modules loaded in active plan registry buffer.
              </div>
            )}
          </div>
        </div>

        {/* Bottom Credits Counter Metrics Panel */}
        <div className="shrink-0 w-full p-2.5 rounded-xl border flex items-center justify-between bg-slate-50 border-slate-100 dark:bg-slate-950/40 dark:border-slate-800">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400">
              <span>Registered Modules:</span>
              <span className="font-mono font-bold text-slate-950 dark:text-white px-2 py-0.5 bg-slate-200/60 dark:bg-slate-800 rounded-md">{totalCoursesCount} Subjects</span>
            </div>
            <div className="w-px h-4 bg-slate-200 dark:bg-slate-800" />
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400">
              <span>Credit Load Limit:</span>
              <span className="text-slate-600 font-normal">19 Credit Hours</span>
            </div>
          </div>
          
          <div className="text-right flex items-center gap-2">
            <span className="text-[12px] font-bold uppercase tracking-wider text-slate-600">Current Credit Hours :</span>
            <span className="text-xs font-black font-mono text-cyan-600 dark:text-cyan-400">{totalCredits} Total Credits Registered</span>
          </div>
        </div>

      </main>

      {/* Details Form Modal Pop-up Layout */}
      {selectedCourse && (
        <div 
          onClick={() => setSelectedCourse(null)} 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in"
        >
          <div 
            onClick={(e) => e.stopPropagation()} 
            className="w-full max-w-md rounded-2xl border shadow-2xl overflow-hidden bg-white border-slate-200 dark:bg-slate-900 dark:border-slate-800 transform transition-all scale-100 p-5 space-y-4"
          >
            
            {/* Form Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse" />
                <h2 className="text-xs font-black tracking-widest uppercase text-slate-400 font-mono">Module Parameters</h2>
              </div>
              <button 
                onClick={() => setSelectedCourse(null)}
                className="w-6 h-6 rounded-full border border-slate-100 hover:bg-slate-50 text-slate-400 flex items-center justify-center transition active:scale-90 dark:border-slate-800 dark:hover:bg-slate-800"
              >
                <Icon name="close" />
              </button>
            </div>

            {/* Form Core Display Grid Fields */}
            <div className="space-y-3">
              <div>
                <label className="text-[9px] font-black uppercase tracking-wider text-slate-400 block font-mono">Course Code & Section</label>
                <p className="text-sm font-extrabold text-cyan-600 dark:text-cyan-400 font-mono mt-0.5">
                  {selectedCourse.courseCode} <span className="text-slate-400 font-normal text-xs ml-1">(Section {selectedCourse.sectionNumber || "01"})</span>
                </p>
              </div>

              <div>
                <label className="text-[9px] font-black uppercase tracking-wider text-slate-400 block font-mono">Subject Nomenclature</label>
                <p className="text-xs font-bold text-slate-800 dark:text-zinc-200 mt-0.5 leading-relaxed">{selectedCourse.courseName}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[9px] font-black uppercase tracking-wider text-slate-400 block font-mono">Assigned Credit Hours</label>
                  <p className="text-xs font-bold text-slate-800 dark:text-zinc-200 mt-0.5">{(selectedCourse.creditHours ?? 3).toFixed(2)} Credits</p>
                </div>
                <div>
                  <label className="text-[9px] font-black uppercase tracking-wider text-slate-400 block font-mono">Staging Venue Node</label>
                  <p className="text-xs font-bold text-slate-800 dark:text-zinc-200 mt-0.5 font-mono">📍 {selectedCourse.venue}</p>
                </div>
              </div>

              <div className="p-3 rounded-xl border bg-slate-50/50 border-slate-100 dark:bg-slate-950/40 dark:border-slate-800">
                <label className="text-[9px] font-black uppercase tracking-wider text-slate-400 block font-mono">Scheduled Windows</label>
                <div className="mt-1 space-y-1">
                  {selectedCourse.timeSlots ? (
                    selectedCourse.timeSlots.map((slot: BackendTimeSlot, idx: number) => {
                      const daysList = ["", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
                      return (
                        <div key={idx} className="text-[11px] font-medium text-slate-600 dark:text-slate-400 flex items-center justify-between">
                          <span>🗓️ {daysList[slot.dayOfWeek]}</span>
                          <span className="font-mono font-bold text-slate-900 dark:text-white">
                            {formatTimeNum(slot.startTime)} - {formatTimeNum(slot.endTime)}
                          </span>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-[11px] font-medium text-slate-400">Click a schedule slot card block to review timing windows.</div>
                  )}
                </div>
              </div>
            </div>

            {/* Form Action Footer Grid */}
            <div className="pt-2 flex justify-end gap-3">
              <button 
                type="button"
                onClick={() => setSelectedCourse(null)}
                className="px-4 py-2 text-[11px] font-bold border border-slate-200 text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 rounded-xl transition active:scale-95"
              >
                Cancel
              </button>
              {/* 🌟 核心调用：将原本无响应的闭合动作，绑定为你指定的动态后端注销请求 */}
              <button 
                type="button"
                onClick={() => handleDropCourseSubmit(selectedCourse.courseCode)}
                className="px-4 py-2 text-[11px] font-bold text-white bg-rose-600 hover:bg-rose-500 rounded-xl shadow-md transition active:scale-95"
              >
                Drop Course
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}