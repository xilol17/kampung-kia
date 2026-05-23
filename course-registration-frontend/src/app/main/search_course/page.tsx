"use client";

import { useState } from "react";

// 1. FIXED: Matching your exact backend data object properties
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

  const getDayName = (day: number) => ["", "Mon", "Tue", "Wed", "Thu", "Fri"][day] || "Any";

  const formatTime = (time: number) => {
    const hours = Math.floor(time / 100);
    const mins = time % 100;
    return `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`;
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim() || isLoading) return;

    setIsLoading(true);
    try {
      const token = document.cookie
        .split("; ")
        .find((row) => row.startsWith("token="))
        ?.split("=")[1];

      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

      // FIXED: Pointing to your correct active route matching portal.controller.ts
      const response = await fetch(`${baseUrl}/api/portal/courses/search?q=${encodeURIComponent(searchQuery.trim())}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { "Authorization": `Bearer ${token}` } : {}),
        },
      });

      if (response.ok) {
        const json = await response.json();
        
        // ✨ CORE FIX: Extract the actual nested array from json.data instead of saving the whole object!
        if (json.success && Array.isArray(json.data)) {
          setCourses(json.data);
        } else {
          setCourses([]);
        }
      } 
    } catch (error) {
      console.error("Error searching courses:", error);
      setCourses([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddSectionToPlan = (courseCode: string, sectionNum: string) => {
    alert(`Added ${courseCode} Section ${sectionNum} to staging registry plan buffer!`);
  };

  return (
    <div className="w-full max-w-[calc(100vw-16rem)] h-full p-6 space-y-6 overflow-hidden flex flex-col justify-start">
      
      {/* 1. Header Title Block */}
      <div className="shrink-0">
        <h1 className="text-2xl font-extrabold tracking-tight transition-colors text-slate-900 dark:text-white">
          Search Course
        </h1>
        <p className="text-xs mt-1 transition-colors text-slate-400 dark:text-slate-500">
          Query institutional database for active module registration codes
        </p>
      </div>

      {/* 2. Search Field Capsule */}
      <main className="w-full border rounded-2xl p-6 shadow-md transition-all duration-300 bg-white border-slate-200 dark:bg-slate-900 dark:border-slate-800 dark:shadow-2xl dark:shadow-slate-950/20">
        <form onSubmit={handleSearch} className="space-y-4">
          <label 
            htmlFor="course-search" 
            className="text-xs font-semibold tracking-wide transition-colors text-slate-600 dark:text-slate-400"
          >
            Search by course name / course id then output course info below
          </label>
          
          <div className="flex gap-3">
            <div className="relative flex-1">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-slate-400">🔍</span>
              <input
                id="course-search"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="e.g., BCI1023, Database Systems, Problem Solving..."
                className="w-full border rounded-xl py-3.5 pl-11 pr-4 text-[14px] font-medium outline-none transition-all bg-slate-50 border-slate-300 placeholder-slate-400 text-slate-900 focus:ring-1 focus:ring-cyan-500 dark:bg-slate-950/50 dark:border-slate-700/60 dark:placeholder-slate-600 dark:text-white"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-white font-bold rounded-xl text-xs tracking-wider transition-all active:scale-[0.98] shadow-lg shadow-cyan-500/10 whitespace-nowrap"
            >
              {isLoading ? "SEARCHING..." : "SEARCH"}
            </button>
          </div>
        </form>
      </main>

      {/* 3. Search Results Matrix Display Cards */}
      <section className="w-full flex-1 min-h-0 border rounded-2xl p-6 transition-all duration-300 bg-white border-slate-200 shadow-sm flex flex-col dark:bg-slate-900 dark:border-slate-800">
        <h2 className="text-xs font-bold tracking-wide uppercase mb-4 shrink-0 text-slate-500 dark:text-slate-400">
          Search Results ({courses.length} Modules Found)
        </h2>

        <div className="flex-1 overflow-y-auto pr-1">
          {courses.length === 0 ? (
            <div className="flex flex-col items-center justify-center min-h-[300px] text-center border border-dashed rounded-xl p-8 transition-colors border-slate-200 dark:border-slate-800">
              <span className="text-2xl mb-2 text-slate-400">📥</span>
              <p className="text-sm max-w-xs text-slate-400 dark:text-slate-500">
                No active courses queried yet. Enter a valid parameters keyword above to populate section slots.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
              {courses.map((course) => (
                <div 
                  key={course.courseCode}
                  className="border rounded-2xl p-5 flex flex-col justify-between bg-slate-50/60 border-slate-200 dark:bg-slate-950/40 dark:border-slate-800/80"
                >
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-mono text-xs font-black px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
                        {course.courseCode}
                      </span>
                      <span className="text-[11px] font-bold text-slate-400 font-mono">
                        Credits: {course.creditHours}
                      </span>
                    </div>

                    <h3 className="font-extrabold text-[15px] text-slate-900 dark:text-white mb-4 leading-snug">
                      {course.courseName}
                    </h3>
                    
                    {/* Render active class sections arrays nested within the module */}
                    <div className="space-y-3">
                      {course.sections.map((sec) => (
                        <div 
                          key={sec.sectionNumber}
                          className="flex flex-col sm:flex-row sm:items-center justify-between p-3 border rounded-xl bg-white border-slate-200 dark:bg-slate-900 dark:border-slate-800/60 gap-3 hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-mono font-black text-slate-400 px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded">
                                SEC {sec.sectionNumber}
                              </span>
                              <span className="text-xs font-bold text-slate-700 dark:text-zinc-300">
                                {sec.lecturerName}
                              </span>
                            </div>
                            
                            {sec.timeSlots.map((ts) => (
                              <p key={ts.id} className="text-[11px] font-medium text-slate-400 dark:text-slate-500 flex items-center gap-1">
                                <span>🗓️ {getDayName(ts.dayOfWeek)}</span>
                                <span>• {formatTime(ts.startTime)} - {formatTime(ts.endTime)}</span>
                                <span className="text-cyan-600 dark:text-cyan-400 font-mono">({sec.venue})</span>
                              </p>
                            ))}
                          </div>

                          <div className="flex items-center justify-between sm:justify-end gap-3 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100 dark:border-slate-800">
                            <span className="text-[10px] font-bold font-mono text-slate-400">
                              Cap: {sec.capacity}
                            </span>
                            <button 
                              type="button"
                              onClick={() => handleAddSectionToPlan(course.courseCode, sec.sectionNumber)}
                              className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-[10px] tracking-wide transition shadow shadow-cyan-600/10"
                            >
                              + Add Section
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

    </div>
  );
}