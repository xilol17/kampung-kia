"use client";

import { useState, useEffect } from "react";
import toast, { Toaster } from "react-hot-toast";

// 完美对齐后端 Prisma 模型的真实数据结构
interface TimeSlot {
  dayOfWeek: number;
  startTime: number;
  endTime: number;
}

interface Section {
  sectionNumber: string;
  venue: string;
  capacity: number;
  lecturerName: string;
  timeSlots: TimeSlot[];
}

interface Course {
  courseCode: string;
  courseName: string;
  creditHours: number;
  sections: Section[];
}

interface TimetableItem {
  courseCode: string;
  courseName: string;
  sectionNumber: string;
  venue: string;
  status: string;
  timeSlots: TimeSlot[];
  creditHours?: number; // 🌟 兼容详情页展示学分
}

export default function ManualRegisterPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [courses, setCourses] = useState<Course[]>([]);
  const [timetable, setTimetable] = useState<TimetableItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  
  // 🌟 新增状态：控制弹窗表单的开启以及存储当前点击待退选的课程详情
  const [selectedCourse, setSelectedCourse] = useState<TimetableItem | null>(null);

  const TIME_BLOCKS = [
    { label: "08:00 - 10:00", start: 800, end: 1000 },
    { label: "10:00 - 12:00", start: 1000, end: 1200 },
    { label: "12:00 - 14:00", start: 1200, end: 1400 },
    { label: "14:00 - 16:00", start: 1400, end: 1600 },
    { label: "16:00 - 18:00", start: 1600, end: 1800 },
  ];

  const DAYS = [
    { label: "MONDAY", value: 1 },
    { label: "TUESDAY", value: 2 },
    { label: "WEDNESDAY", value: 3 },
    { label: "THURSDAY", value: 4 },
    { label: "FRIDAY", value: 5 },
  ];

  const fetchTimetable = async () => {
    try {
      const token = document.cookie
          .split("; ")
          .find((row) => row.startsWith("token="))
          ?.split("=")[1];

      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

      const response = await fetch(`${baseUrl}/api/portal/timetable`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = await response.json();
      if (data.success) {
        setTimetable(data.data);
      }
    } catch (error) {
      console.error("Error fetching timetable:", error);
    }
  };

  useEffect(() => {
    fetchTimetable();
  }, []);

  const formatTimeSlots = (slots: TimeSlot[]) => {
    if (!slots || slots.length === 0) return "TBA";
    const dayMap = ['', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
    return slots.map(ts => {
      const s = ts.startTime.toString().padStart(4, '0');
      const e = ts.endTime.toString().padStart(4, '0');
      return `${dayMap[ts.dayOfWeek]} ${s.slice(0, 2)}:${s.slice(2)} - ${e.slice(0, 2)}:${e.slice(2)}`;
    }).join(' | ');
  };

  const getCourseAtCell = (dayOfWeek: number, startTime: number) => {
    return timetable.find(item => 
      item.timeSlots.some(ts => ts.dayOfWeek === dayOfWeek && ts.startTime === startTime)
    );
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsLoading(true);
    const searchToastId = toast.loading("Scanning institution network...", {
      style: { background: '#0f172a', color: '#38bdf8', border: '1px solid #0ea5e9' }
    });

    try {
      const token = document.cookie
          .split("; ")
          .find((row) => row.startsWith("token="))
          ?.split("=")[1];

      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

      const response = await fetch(`${baseUrl}/api/portal/courses/search?q=${encodeURIComponent(searchQuery)}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      
      if (data.success) {
        setCourses(data.data);
        if (data.data.length > 0) {
          toast.success("Telemetry acquired.", { id: searchToastId });
        } else {
          toast.error("No active sections found.", { id: searchToastId });
        }
      }
    } catch (error) {
      toast.error("Network sync failed.", { id: searchToastId });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEnroll = async (courseCode: string, sectionNumber: string) => {
    setIsRegistering(true);
    const enrollToastId = toast.loading(`Attempting to override Sec ${sectionNumber}...`, {
      style: { background: '#0f172a', color: '#a78bfa', border: '1px solid #8b5cf6' }
    });

    try {
      const token = document.cookie
          .split("; ")
          .find((row) => row.startsWith("token="))
          ?.split("=")[1];

      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

      const response = await fetch(`${baseUrl}/api/portal/register`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ courseCode, sectionNumber })
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast.success(data.message, { 
          id: enrollToastId,
          duration: 4000,
          style: { background: '#0f172a', color: '#06b6d4', border: '1px solid #0891b2', fontWeight: 'bold' },
          icon: '⚡'
        }); 
        fetchTimetable(); 
      } else {
        toast.error(data.message, { 
          id: enrollToastId,
          duration: 5000,
          style: { background: '#1e1b4b', color: '#f87171', border: '1px solid #ef4444' },
          icon: '🛑'
        }); 
      }
    } catch (error) {
      toast.error("Network Error: Registration node offline.", { 
        id: enrollToastId,
        style: { background: '#1e1b4b', color: '#f87171', border: '1px solid #ef4444' }
      });
    } finally {
      setIsRegistering(false);
    }
  };

  // 🌟 新增方法：退选课程执行逻辑 (Drop Course Function)
  const handleDropCourse = async (courseCode: string, sectionNumber: string) => {
    setSelectedCourse(null); // 先关闭弹窗
    const dropToastId = toast.loading(`Requesting pipeline termination for ${courseCode}...`, {
      style: { background: '#1e1b4b', color: '#f87171', border: '1px solid #ef4444' }
    });

    try {
      const token = document.cookie
          .split("; ")
          .find((row) => row.startsWith("token="))
          ?.split("=")[1];

      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

      // 假设退选接口符合标准 RESTful API 或你的通用解绑路由，向后端发送注销请求
      const response = await fetch(`${baseUrl}/api/portal/course/drop`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ courseCode, sectionNumber })
      });

      const data = await response.json();

      if (data.success) {
        toast.success(`Successfully dropped ${courseCode}. Credits recalculated.`, {
          id: dropToastId,
          style: { background: '#0f172a', color: '#f43f5e', border: '1px solid #e11d48', fontWeight: 'bold' },
          icon: '🗑️'
        });
        fetchTimetable(); // 刷新大课表结构
      } else {
        toast.error(data.message || "Failed to drop module parameter restrictions.", { id: dropToastId });
      }
    } catch (error) {
      toast.error("Network system fault. Failed to synchronize core node drop.", { id: dropToastId });
    }
  };

  return (
    <div className="w-full max-w-[calc(100vw-16rem)] h-full p-6 space-y-6 select-none overflow-y-auto pr-2 flex flex-col justify-start relative">
      
      {/* 挂载全局 Toast 引擎 */}
      <Toaster position="bottom-right" reverseOrder={false} />

      {/* 1. 头部标题 Block */}
      <div className="shrink-0">
        <h1 className="text-2xl font-extrabold tracking-tight transition-colors text-slate-900 dark:text-white">
          Manual Module Override
        </h1>
        <p className="text-xs mt-1 transition-colors text-slate-400 dark:text-slate-500">
          Query sections and force execute registration into the core telemetry pipeline.
        </p>
      </div>

      {/* 2. 搜索框区域 */}
      <main className="w-full border rounded-2xl p-6 shadow-md transition-all duration-300 bg-white/70 border-slate-200 shadow-slate-200/40 backdrop-blur-xl dark:bg-slate-900/50 dark:border-slate-800/80 dark:shadow-2xl dark:shadow-slate-950/20">
        <form onSubmit={handleSearch} className="space-y-4">
          <label htmlFor="course-search" className="text-xs font-semibold tracking-wide transition-colors text-slate-600 dark:text-slate-400">
            Target Module Identification (Code / Name)
          </label>
          <div className="flex gap-3">
            <div className="relative flex-1">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-slate-400">🎯</span>
              <input
                id="course-search"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="e.g., BCS2143, Object Oriented Programming..."
                className="w-full border rounded-xl py-3.5 pl-11 pr-4 text-[15px] outline-none transition-all bg-slate-50 border-slate-300 placeholder-slate-400 text-slate-900 focus:ring-1 focus:ring-cyan-500 dark:bg-slate-950/50 dark:border-slate-700/60 dark:placeholder-slate-600 dark:text-white"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="px-8 bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-white font-bold rounded-xl text-xs tracking-wider transition-all active:scale-[0.98] shadow-lg shadow-cyan-500/10 whitespace-nowrap"
            >
              {isLoading ? "SCANNING..." : "INITIALIZE"}
            </button>
          </div>
        </form>
      </main>

      {/* 3. 查询出来的 Section 列表 */}
      <section className="w-full border rounded-2xl p-6 transition-all duration-300 bg-white/70 border-slate-200 shadow-md shadow-slate-200/40 backdrop-blur-xl dark:bg-slate-900/50 dark:border-slate-800/80 dark:shadow-2xl dark:shadow-slate-950/20 flex flex-col">
        <h2 className="text-xs font-bold tracking-wide uppercase mb-4 text-slate-500 dark:text-cyan-600/70">
          Queried Module Matrix
        </h2>

        <div className="space-y-4 max-h-[400px] overflow-y-auto pr-1 custom-scrollbar">
          {courses.length === 0 ? (
            <div className="flex flex-col items-center justify-center min-h-[150px] text-center border border-dashed rounded-xl p-6 border-slate-200 dark:border-slate-700/40">
              <span className="text-xl mb-1 text-slate-400">📡</span>
              <p className="text-xs text-slate-400 dark:text-slate-500">
                Enter a parameters sequence above to inspect active classroom slots.
              </p>
            </div>
          ) : (
            courses.map((course) => (
              <div key={course.courseCode} className="border rounded-xl p-4 bg-slate-50/80 border-slate-200 dark:bg-slate-950/40 dark:border-slate-800">
                <div className="flex justify-between items-start mb-3 border-b border-slate-200 dark:border-slate-800/60 pb-2">
                  <div>
                    <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-500 border border-cyan-500/20">
                      {course.courseCode}
                    </span>
                    <h3 className="font-extrabold text-[15px] mt-1 text-slate-900 dark:text-white">
                      {course.courseName}
                    </h3>
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 bg-slate-200 dark:bg-slate-800 px-2 py-0.5 rounded">
                    {course.creditHours} CREDITS
                  </span>
                </div>

                <div className="space-y-2">
                  {course.sections.map(sec => (
                    <div key={sec.sectionNumber} className="flex flex-row justify-between items-center p-2.5 rounded-lg bg-white border border-slate-200 dark:bg-white/5 dark:border-slate-800/80 transition hover:border-cyan-500/30">
                      <div className="flex-1 grid grid-cols-3 gap-2 items-center">
                        <div>
                          <p className="text-xs font-bold text-slate-900 dark:text-slate-200">Sec {sec.sectionNumber}</p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">👤 {sec.lecturerName}</p>
                        </div>
                        <div className="col-span-2">
                          <p className="text-xs text-slate-600 dark:text-slate-300 font-mono tracking-tight">
                            🕒 {formatTimeSlots(sec.timeSlots)}
                          </p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-500">📍 {sec.venue}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 ml-2 pl-3 border-l border-slate-200 dark:border-slate-800">
                        <button 
                          onClick={() => handleEnroll(course.courseCode, sec.sectionNumber)}
                          disabled={isRegistering}
                          className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white dark:bg-cyan-600 dark:hover:bg-cyan-500 text-[11px] font-bold rounded-lg shadow-md transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          [ ENROLL ]
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* 4. 最底层区域：当前已经注册的时间表大网格 */}
      <section className="w-full border rounded-2xl p-6 transition-all duration-300 bg-white/70 border-slate-200 shadow-md shadow-slate-200/40 backdrop-blur-xl dark:bg-slate-900/50 dark:border-slate-800/80 dark:shadow-2xl dark:shadow-slate-950/20 flex flex-col">
        <div className="flex justify-between items-center mb-4 shrink-0">
          <h2 className="text-xs font-bold tracking-wide uppercase text-slate-500 dark:text-cyan-500">
            Current Timetable Grid Structure
          </h2>
          <span className="text-[11px] font-mono text-slate-400 bg-slate-100 dark:bg-slate-950 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-800">
            LIVE PREVIEW NODE
          </span>
        </div>

        <div className="w-full overflow-x-auto border rounded-xl border-slate-200 dark:border-slate-800/80 custom-scrollbar">
          <table className="w-full min-w-[700px] border-collapse text-left">
            <thead>
              <tr className="bg-slate-100 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800/80">
                <th className="p-3 text-xs font-bold tracking-wider text-slate-400 border-r border-slate-200 dark:border-slate-800/40 w-32 text-center">TIME SLOT</th>
                {DAYS.map(day => (
                  <th key={day.value} className="p-3 text-xs font-bold tracking-wider text-slate-500 dark:text-slate-400 text-center">{day.label}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60 bg-white/30 dark:bg-transparent">
              {TIME_BLOCKS.map(block => (
                <tr key={block.start} className="h-20 transition hover:bg-slate-50/40 dark:hover:bg-slate-950/20">
                  <td className="p-2 font-mono text-xs font-bold text-slate-500 dark:text-slate-400 border-r bg-slate-50/50 dark:bg-slate-950/30 border-slate-200 dark:border-slate-800/40 text-center">
                    {block.label}
                  </td>
                  {DAYS.map(day => {
                    const match = getCourseAtCell(day.value, block.start);
                    return (
                      <td key={day.value} className="p-1 border-r border-slate-200 dark:border-slate-800/40 align-middle w-1/5">
                        {match ? (
                          /* 🌟 修改点：绑定点击事件，将选中的课表项放入 selectedCourse 触发弹窗渲染 */
                          <div 
                            onClick={() => setSelectedCourse({ ...match })}
                            className="w-full h-full p-2 rounded-lg flex flex-col justify-center items-center text-center transition bg-cyan-500/10 border border-cyan-500/30 shadow-sm shadow-cyan-500/5 animate-fade-in cursor-pointer hover:bg-cyan-500/20 active:scale-[0.99]"
                          >
                            <p className="font-mono text-xs font-black text-cyan-500 tracking-wide">{match.courseCode}</p>
                            <p className="text-[11px] font-bold text-slate-900 dark:text-slate-100 mt-0.5 max-w-full truncate px-1">{match.courseName}</p>
                            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">Sec {match.sectionNumber} | 📍{match.venue}</p>
                          </div>
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-200 dark:text-slate-800/40 font-mono text-xs select-none">
                            ---
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ================================================================= */}
      {/* 🌟 新增的点击弹窗表单 (Course Details & Drop Handler Form Modal Overlay) */}
      {/* ================================================================= */}
      {selectedCourse && (
        <div 
          onClick={() => setSelectedCourse(null)} // 点击卡片外部空白暗黑区域自动关闭
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in"
        >
          <div 
            onClick={(e) => e.stopPropagation()} // 阻止冒泡，点击窗口内部不关闭
            className="w-full max-w-md rounded-2xl border shadow-2xl overflow-hidden bg-white border-slate-200 dark:bg-slate-900 dark:border-slate-800 transform transition-all scale-100 p-5 space-y-4"
          >
            
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse" />
                <h2 className="text-xs font-black tracking-widest uppercase text-slate-400 font-mono">Module Configuration Overview</h2>
              </div>
              <button 
  onClick={() => setSelectedCourse(null)}
  className="w-6 h-6 rounded-full border border-slate-100 hover:bg-slate-50 text-slate-400 flex items-center justify-center transition active:scale-95 dark:border-slate-800 dark:hover:bg-slate-800"
>
  ✕
</button>
            </div>

            {/* Modal Content Grid */}
            <div className="space-y-3">
              <div>
                <label className="text-[9px] font-black uppercase tracking-wider text-slate-400 block font-mono">Course Code & Active Section</label>
                <p className="text-sm font-extrabold text-cyan-600 dark:text-cyan-400 font-mono mt-0.5">
                  {selectedCourse.courseCode} <span className="text-slate-400 font-normal text-xs ml-1">(Section {selectedCourse.sectionNumber})</span>
                </p>
              </div>

              <div>
                <label className="text-[9px] font-black uppercase tracking-wider text-slate-400 block font-mono">Subject Nomenclature Title</label>
                <p className="text-xs font-bold text-slate-800 dark:text-zinc-200 mt-0.5 leading-relaxed">{selectedCourse.courseName}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[9px] font-black uppercase tracking-wider text-slate-400 block font-mono">Assigned Load Unit</label>
                  <p className="text-xs font-bold text-slate-800 dark:text-zinc-200 mt-0.5">
                    {selectedCourse.creditHours || 3}.00 Credit Hours
                  </p>
                </div>
                <div>
                  <label className="text-[9px] font-black uppercase tracking-wider text-slate-400 block font-mono">Staging Classroom Node</label>
                  <p className="text-xs font-bold text-slate-800 dark:text-zinc-200 mt-0.5 font-mono">📍 {selectedCourse.venue}</p>
                </div>
              </div>

              {/* Exact timing constraints */}
              <div className="p-3 rounded-xl border bg-slate-50/50 border-slate-100 dark:bg-slate-950/40 dark:border-slate-800">
                <label className="text-[9px] font-black uppercase tracking-wider text-slate-400 block font-mono">Scheduled Vector Windows</label>
                <div className="mt-1 font-mono text-[11px] font-bold text-slate-700 dark:text-zinc-300">
                  🗓️ {formatTimeSlots(selectedCourse.timeSlots)}
                </div>
              </div>
            </div>

            {/* Modal Bottom Buttons Matrix */}
            <div className="pt-2 flex gap-3">
              
              
              <button 
                onClick={() => handleDropCourse(selectedCourse.courseCode, selectedCourse.sectionNumber)}
                className="px-4 py-2 text-[11px] font-bold text-white bg-rose-600 hover:bg-rose-500 rounded-xl shadow-md transition active:scale-95"
              >
                Drop Course Module
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}