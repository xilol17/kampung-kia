"use client";

import { useState, useEffect } from "react";
import toast, { Toaster } from "react-hot-toast"; // 🌟 引入 Toast 引擎，保持选课提示的一致性

// =================================================================
// 📐 TYPES & DATA DESCRIPTIONS MATCHING Institutional SCHEMAS
// =================================================================
interface TimeSlot {
  id: number;
  dayOfWeek: number;
  startTime: number;
  endTime: number;
  sectionId: number;
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

export default function SearchCoursePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false); // 🌟 控制选课按钮的 Loading 状态

  // 分页管理状态：默认第一页，每页上限 20 条
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // 弹窗交互状态：存储当前被点击选中的课程对象
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);

  // Helper formats
  const getDayName = (day: number) => ["", "Mon", "Tue", "Wed", "Thu", "Fri"][day] || "Any";

  const formatTime = (time: number) => {
    const hours = Math.floor(time / 100);
    const mins = time % 100;
    return `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`;
  };

  // =================================================================
  // 📡 CORE DATA ROUTE PIPELINE (Reusable for Default Mount & Search)
  // =================================================================
  const fetchInstitutionalCourses = async (queryText: string) => {
    setIsLoading(true);
    try {
      const token = document.cookie
        .split("; ")
        .find((row) => row.startsWith("token="))
        ?.split("=")[1];

      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
      
      const response = await fetch(`${baseUrl}/api/portal/courses/search?q=${encodeURIComponent(queryText.trim())}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { "Authorization": `Bearer ${token}` } : {}),
        },
      });

      if (response.ok) {
        const json = await response.json();
        if (json.success && Array.isArray(json.data)) {
          setCourses(json.data);
          setCurrentPage(1); 
        } else {
          setCourses([]);
        }
      }
    } catch (error) {
      console.error("Error communicating with registry matrix router:", error);
      setCourses([]);
    } finally {
      setIsLoading(false);
    }
  };

  // 一打开网页（Component Mount），全自动加载默认列表结构
  useEffect(() => {
    fetchInstitutionalCourses("");
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchInstitutionalCourses(searchQuery);
  };

  // =================================================================
  // 🚀 核心增加点：连接后端真实的强制选课提交处理接口
  // =================================================================
  const handleAddSectionToPlan = async (courseCode: string, sectionNumber: string) => {
    if (isRegistering) return;
    setIsRegistering(true);

    // 唤起暗黑风科技质感选课进度条
    const registerToastId = toast.loading(`Routing payload parameters to link Sec ${sectionNumber}...`, {
      style: { background: '#0f172a', color: '#a78bfa', border: '1px solid #8b5cf6' }
    });

    try {
      const token = document.cookie
        .split("; ")
        .find((row) => row.startsWith("token="))
        ?.split("=")[1];

      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

      const response = await fetch(`${baseUrl}/api/portal/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { "Authorization": `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ courseCode, sectionNumber }),
      });

      const json = await response.json();

      if (json.success) {
        // 赛博青色成功通知
        toast.success(json.message || `Course node ${courseCode} linked successfully!`, {
          id: registerToastId,
          duration: 4000,
          style: { background: '#0f172a', color: '#06b6d4', border: '1px solid #0891b2', fontWeight: 'bold' },
          icon: '⚡'
        });
        
        setSelectedCourse(null); // 选课成功后，自动关闭当前的详情弹窗
        fetchInstitutionalCourses(searchQuery); // 隐式更新后台数据流（例如刷新名额）
      } else {
        // 红色冲突或满员警示
        toast.error(json.message || "Registration parameter conflict detected.", {
          id: registerToastId,
          duration: 5000,
          style: { background: '#1e1b4b', color: '#f87171', border: '1px solid #ef4444' },
          icon: '🛑'
        });
      }
    } catch (error) {
      console.error("Critical fault executing student stream registry connection:", error);
      toast.error("Network Error: Registration node gateway timeout.", { id: registerToastId });
    } finally {
      setIsRegistering(false);
    }
  };

  // =================================================================
  // ✂️ PAGINATION MATHEMATICS INTERCEPTOR (Limit 20 Courses Per Page)
  // =================================================================
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentPageCourses = courses.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(courses.length / itemsPerPage);

  return (
    <div className="w-full max-w-[calc(100vw-16rem)] h-full p-6 space-y-5 overflow-hidden flex flex-col justify-start relative select-none">
      
      {/* 挂载全局通知 Toast 引擎 */}
      <Toaster position="bottom-right" reverseOrder={false} />

      {/* 1. Header Title Block */}
      <div className="shrink-0">
        <h1 className="text-xl font-extrabold tracking-tight transition-colors text-slate-900 dark:text-white">
          Search Course Catalog
        </h1>
        <p className="text-[11px] mt-0.5 transition-colors text-slate-400 dark:text-slate-500">
          Query active modules and deploy detailed class telemetry structures into your session overlay plan
        </p>
      </div>

      {/* 2. Search Field Capsule */}
      <main className="w-full border rounded-2xl p-5 shadow-sm transition-all duration-300 bg-white border-slate-200 dark:bg-slate-900 dark:border-slate-800">
        <form onSubmit={handleSearchSubmit} className="space-y-3">
          <label 
            htmlFor="course-search" 
            className="text-[11px] font-bold uppercase tracking-wider text-slate-400 font-mono"
          >
            Filter Matrix Parameters (Code / Name Keyword)
          </label>
          
          <div className="flex gap-3">
            <div className="relative flex-1">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-slate-400">🔍</span>
              <input
                id="course-search"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Type course fields... e.g., BCS, Programming, Data Structure..."
                className="w-full border rounded-full py-2.5 pl-11 pr-4 text-xs font-medium outline-none transition-all bg-slate-50 border-slate-200 text-slate-900 focus:ring-1 focus:ring-cyan-500 dark:bg-slate-950/50 dark:border-slate-800 dark:text-white"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-white font-extrabold rounded-full text-xs tracking-wider transition-all active:scale-[0.98] shadow-sm"
            >
              {isLoading ? "SCANNING..." : "QUERY"}
            </button>
          </div>
        </form>
      </main>

      {/* 3. Search Results Matrix Display Cards Area */}
      <section className="w-full flex-1 min-h-0 border rounded-2xl p-5 transition-all bg-white border-slate-200 shadow-xs flex flex-col dark:bg-slate-900 dark:border-slate-800">
        <div className="flex justify-between items-center mb-3 shrink-0">
          <h2 className="text-xs font-bold tracking-wide uppercase text-slate-500 dark:text-slate-400">
            Catalog Array ({courses.length} Modules Found • Showing 20 max)
          </h2>
          
          {totalPages > 1 && (
            <span className="text-[10px] font-mono font-bold text-slate-400 bg-slate-50 dark:bg-slate-950 px-2 py-0.5 border border-slate-100 dark:border-slate-800 rounded">
              PAGE {currentPage} OF {totalPages}
            </span>
          )}
        </div>

        {/* Courses Cards Grid Scroll Box */}
        <div className="flex-1 overflow-y-auto pr-1 min-h-0">
          {isLoading ? (
            <div className="text-center py-20 font-mono text-xs font-bold tracking-widest text-slate-400 animate-pulse uppercase">
              Streaming relational data block node vectors...
            </div>
          ) : currentPageCourses.length === 0 ? (
            <div className="flex flex-col items-center justify-center min-h-[250px] text-center border border-dashed rounded-xl p-8 border-slate-100 dark:border-slate-800">
              <span className="text-xl mb-1">📥</span>
              <p className="text-xs font-medium text-slate-400 dark:text-slate-500">
                No matching academic items retrieved. Adjust parameters query string.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {currentPageCourses.map((course) => (
                <div 
                  key={course.courseCode}
                  onClick={() => setSelectedCourse(course)} 
                  className="border rounded-xl p-4 flex flex-col justify-between bg-slate-50/50 border-slate-100 dark:bg-slate-950/40 dark:border-slate-800/60 cursor-pointer shadow-2xs hover:border-cyan-500/30 dark:hover:border-cyan-500/20 hover:scale-[1.01] transition-all group duration-200"
                >
                  <div className="space-y-2">
                    <div className="flex justify-between items-center w-full">
                      <span className="font-mono text-[10px] font-black px-1.5 py-0.2 rounded bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/5">
                        {course.courseCode}
                      </span>
                      <span className="text-[10px] font-bold text-slate-400 font-mono">
                        {course.creditHours} Cr
                      </span>
                    </div>

                    <h3 className="font-bold text-[13px] text-slate-900 dark:text-white line-clamp-2 leading-snug group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">
                      {course.courseName}
                    </h3>
                  </div>

                  <div className="w-full flex items-center justify-between border-t border-slate-100 dark:border-slate-800/80 pt-2.5 mt-4 text-[10px] text-slate-400 font-medium">
                    <span>📚 {course.sections?.length || 0} Sections Active</span>
                    <span className="text-cyan-600 dark:text-cyan-400 font-bold group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">Inspect →</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* FOOTER COMPONENT: Standardized Pagination Buttons controls */}
        {totalPages > 1 && !isLoading && (
          <div className="shrink-0 flex items-center justify-center gap-2 pt-4 border-t border-slate-100 dark:border-slate-800/80 mt-3 bg-white dark:bg-slate-900">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 rounded-lg border text-[10px] font-bold uppercase transition bg-white border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed dark:bg-slate-950 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-900"
            >
              Previous Page
            </button>
            
            <div className="flex items-center gap-1 font-mono text-[10px] font-bold px-3 text-slate-500">
              <span className="text-slate-900 dark:text-white">{currentPage}</span> / <span>{totalPages}</span>
            </div>

            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 rounded-lg border text-[10px] font-bold uppercase transition bg-white border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed dark:bg-slate-950 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-900"
            >
              Next Page
            </button>
          </div>
        )}
      </section>

      {/* ================================================================= */}
      {/* 🌟 OVERLAY DETAILED FORM POP-UP MODAL (Click-Outside-To-Close Enabled) */}
      {/* ================================================================= */}
      {selectedCourse && (
        <div 
          onClick={() => setSelectedCourse(null)} 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fade-in"
        >
          <div 
            onClick={(e) => e.stopPropagation()} 
            className="w-full max-w-2xl rounded-2xl border shadow-2xl overflow-hidden bg-white border-slate-200 dark:bg-slate-900 dark:border-slate-800 p-5 space-y-4 max-h-[90vh] flex flex-col"
          >
            
            {/* Modal Header Title */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 shrink-0">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse" />
                <span className="font-mono font-black text-xs px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
                  {selectedCourse.courseCode}
                </span>
                <span className="text-[11px] font-bold font-mono text-slate-400">({selectedCourse.creditHours}.00 Credit Hours Load)</span>
              </div>
              <button 
                onClick={() => setSelectedCourse(null)}
                className="w-6 h-6 rounded-full border border-slate-100 hover:bg-slate-50 text-slate-400 text-xs font-bold flex items-center justify-center dark:border-slate-800 dark:hover:bg-slate-800 transition active:scale-90"
              >
                ✕
              </button>
            </div>

            {/* Modal Scrollable Core Content area */}
            <div className="flex-1 overflow-y-auto space-y-3.5 pr-0.5 custom-scrollbar min-h-0">
              <div>
                <label className="text-[9px] font-black uppercase tracking-wider text-slate-400 font-mono">Module Nomenclature Label</label>
                <h2 className="text-base font-extrabold text-slate-900 dark:text-white mt-0.5 leading-snug">{selectedCourse.courseName}</h2>
              </div>

              {/* Offerings list array nested parameters parser */}
              <div className="space-y-2 pt-2">
                <label className="text-[9px] font-black uppercase tracking-wider text-slate-400 font-mono block">Available Section Streams & Telemetry Slots</label>
                
                <div className="space-y-2">
                  {selectedCourse.sections && selectedCourse.sections.length > 0 ? (
                    selectedCourse.sections.map((sec) => (
                      <div 
                        key={sec.sectionNumber}
                        className="p-3 border rounded-xl bg-slate-50/50 border-slate-150 dark:bg-slate-950/40 dark:border-slate-800/80 flex items-center justify-between gap-4 shadow-3xs"
                      >
                        <div className="space-y-1 min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-black text-[10px] px-1.5 py-0.2 bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300 rounded">
                              SECTION {sec.sectionNumber}
                            </span>
                            <span className="text-xs font-bold text-slate-800 dark:text-zinc-200 truncate">
                              👤 {sec.lecturerName || "TBA"}
                            </span>
                          </div>

                          {sec.timeSlots?.map((ts) => (
                            <p key={ts.id} className="text-[11px] font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1">
                              <span>🗓️ {getDayName(ts.dayOfWeek)}</span>
                              <span>• {formatTime(ts.startTime)} - {formatTime(ts.endTime)}</span>
                              <span className="text-cyan-600 dark:text-cyan-400 font-mono">({sec.venue})</span>
                            </p>
                          ))}
                        </div>

                        <div className="shrink-0 flex items-center gap-4 pl-3 border-l border-slate-200/80 dark:border-slate-800/80">
                          <span className="font-mono text-[10px] font-bold text-slate-400">
                            Cap: <span className="text-slate-700 dark:text-zinc-300">{sec.capacity}</span>
                          </span>
                          
                          {/* 🌟 修改点：绑定真实的 handleAddSectionToPlan 处理流，添加 disabled 锁防并发 */}
                          <button
                            type="button"
                            disabled={isRegistering}
                            onClick={() => handleAddSectionToPlan(selectedCourse.courseCode, sec.sectionNumber)}
                            className="px-3 py-1.5 text-center bg-slate-900 hover:bg-slate-800 text-white dark:bg-cyan-600 dark:hover:bg-cyan-500 font-bold text-[10px] rounded-lg transition active:scale-95 shadow-2xs disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {isRegistering ? "..." : "Enroll Stream"}
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-[11px] font-mono font-bold text-slate-400 text-center py-4 border border-dashed rounded-xl dark:border-slate-800">
                      No active classroom streams registered for this configuration block.
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Bottom Close Action Button strip */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex justify-end shrink-0">
              <button
                type="button"
                onClick={() => setSelectedCourse(null)}
                className="px-4 py-2 text-[10px] font-bold uppercase border bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 rounded-xl transition active:scale-95 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-700"
              >
                Close Catalog Parameter
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}