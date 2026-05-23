"use client";

import { useState, useEffect } from "react";

// Interface models mapping your exact backend data schema layout fields
interface CourseRow {
  code: string;
  courseTitle: string;
  creditHours: number;
  category: string;
  year: number | string;
  status?: string;     // Handles incomplete states (e.g. IN_PROGRESS, NOT_TAKEN, FAILED)
  passFail?: string;   // Handles completed status states (e.g. Y, N)
  grade?: string;      // Optional student earned score letter
}

interface CourseStructureApiResponse {
  success: boolean;
  program: string;
  data: {
    completed: CourseRow[];
    incompleted: CourseRow[];
  };
}

export default function CourseStructurePage() {
  const [structureData, setStructureData] = useState<CourseStructureApiResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);

  // Synchronize remote dataset records upon interface mounting lifecycles
  useEffect(() => {
    const fetchCourseStructure = async () => {
      try {
        setIsLoading(true);
        setErrorNotice(null);

        const token = document.cookie
          .split("; ")
          .find((row) => row.startsWith("token="))
          ?.split("=")[1];

        const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

        const response = await fetch(`${baseUrl}/api/portal/course-structure`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { "Authorization": `Bearer ${token}` } : {}),
          },
        });

        // 🚨 DEBUG 1: Log the HTTP Status 
        console.log("📡 [HTTP STATUS]:", response.status, response.statusText);

        const json: CourseStructureApiResponse = await response.json();

        // 🔥 DEBUG 2: Dump the raw backend response in terminal formatting
        console.log("------------------ STRUCTURE DEBUG STREAM ------------------");
        console.log(JSON.stringify(json, null, 2));
        console.log("------------------------------------------------------------");

        if (response.ok && json.success) {
          setStructureData(json);
        } else {
          setErrorNotice("Failed to compile your degree tracker metrics.");
        }
      } catch (err) {
        // 🚨 DEBUG 3: Catch network crashes (CORS blocks, wrong ports, server offline)
        console.error("❌ [NETWORK CRASH EXCEPTION]:", err);
        setErrorNotice("Unable to reach central database repository nodes. Staging offline.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchCourseStructure();
  }, []);

  // Compute calculated cumulative numbers smoothly once payload parameters resolve
  const completed = structureData?.data?.completed || [];
  const incompleted = structureData?.data?.incompleted || [];

  const completedCredits = completed.reduce((sum, item) => sum + item.creditHours, 0);
  const incompleteCredits = incompleted.reduce((sum, item) => sum + item.creditHours, 0);
  const totalGraduationCredits = completedCredits + incompleteCredits;

  return (
    <div className="w-full max-w-[calc(100vw-16rem)] h-full p-6 space-y-6 flex flex-col justify-start overflow-hidden relative">
      
      {/* 1. TOP HEADER SECTION */}
      <div className="shrink-0 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Course Structure {structureData?.program ? `(${structureData.program})` : ""}
          </h1>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
            Track completed academic requirements and degree pathway modules
          </p>
        </div>
        
      </div>

      {/* 2. DYNAMIC CONTENT MAIN CANVAS STACK LAYER */}
      <div className="flex-1 min-h-0 relative flex flex-col">
        
        {/* VIEW STATE A: Blur overlay loading tracker element */}
        {isLoading && (
          <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] dark:bg-slate-950/60 flex items-center justify-center z-10 font-mono text-xs font-black tracking-widest text-slate-400 dark:text-slate-500 uppercase animate-pulse">
            Syncing progression data...
          </div>
        )}

        {/* VIEW STATE B: Network Connection Interface Error Window */}
        {errorNotice && !isLoading && (
          <div className="absolute inset-0 bg-rose-50/40 backdrop-blur-sm dark:bg-rose-950/5 flex flex-col items-center justify-center z-10 p-6 text-center border border-dashed rounded-2xl border-rose-200/60 dark:border-rose-950/40">
            <span className="text-2xl mb-2">📡</span>
            <p className="text-xs font-mono font-bold text-rose-600 dark:text-rose-400 max-w-sm">
              {errorNotice}
            </p>
            <button 
              onClick={() => window.location.reload()} 
              className="mt-4 text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 bg-slate-900 text-white dark:bg-white dark:text-slate-900 rounded-lg shadow active:scale-95 transition"
            >
              Re-Sync Progress Trace
            </button>
          </div>
        )}

        {/* VIEW STATE C: Core Render View Table Elements List */}
        {!errorNotice && (
          <div className="flex-1 overflow-y-auto pr-1 space-y-6 min-h-0">
            
            {/* COMPLETED MODULES MATRIX CONTAINER */}
            <div className="border rounded-2xl overflow-hidden bg-white border-slate-200 dark:bg-slate-900 dark:border-slate-800 shadow-sm">
              <div className="bg-[#2D0909] text-amber-100 dark:bg-zinc-950 dark:text-zinc-200 py-2.5 px-4 text-center text-[10px] font-black tracking-widest uppercase border-b dark:border-slate-800">
                Completed Courses
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-[11px] font-medium">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 dark:bg-slate-950/40 dark:border-slate-800 text-[9px] font-black text-slate-400 tracking-wider uppercase">
                      <th className="p-3 pl-5 w-24">Code</th>
                      <th className="p-3">Course Title</th>
                      <th className="p-3 text-center w-28">Credit Hours</th>
                      <th className="p-3 w-32">Category</th>
                      <th className="p-3 text-center w-20">Year</th>
                      <th className="p-3 text-center w-24">Pass/Fail</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-700 dark:text-zinc-300">
                    {completed.length === 0 && !isLoading ? (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-slate-400 font-mono text-[10px] uppercase tracking-wider">No completed course logs synchronized.</td>
                      </tr>
                    ) : (
                      completed.map((course) => {
                        // CHANGED HERE: Checks if explicit backend flag marks a failed module run
                        const isFailed = course.passFail === "N" || course.grade === "F";

                        return (
                          <tr key={course.code} className="hover:bg-slate-50/40 dark:hover:bg-slate-900/10">
                            <td className="p-3 pl-5 font-mono font-bold text-cyan-600 dark:text-cyan-400">{course.code}</td>
                            <td className="p-3 uppercase font-semibold">{course.courseTitle}</td>
                            <td className="p-3 text-center font-mono text-slate-500">{course.creditHours}</td>
                            <td className="p-3 text-slate-400 font-mono text-[10px]">{course.category}</td>
                            <td className="p-3 text-center font-mono text-slate-400">{course.year}</td>
                            <td className={`p-3 text-center font-mono font-bold ${
                              isFailed 
                                ? "text-rose-600 dark:text-rose-400" 
                                : "text-emerald-600 dark:text-emerald-400"
                            }`}>
                              {course.passFail || "Y"} {course.grade ? `(${course.grade})` : ""}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* INCOMPLETE MODULES MATRIX CONTAINER */}
            <div className="border rounded-2xl overflow-hidden bg-white border-slate-200 dark:bg-slate-900 dark:border-slate-800 shadow-sm">
              <div className="bg-[#2D0909] text-amber-100 dark:bg-zinc-950 dark:text-zinc-200 py-2.5 px-4 text-center text-[10px] font-black tracking-widest uppercase border-b dark:border-slate-800">
                Incomplete Courses
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-[11px] font-medium">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 dark:bg-slate-950/40 dark:border-slate-800 text-[9px] font-black text-slate-400 tracking-wider uppercase">
                      <th className="p-3 pl-5 w-24">Code</th>
                      <th className="p-3">Course Title</th>
                      <th className="p-3 text-center w-28">Credit Hours</th>
                      <th className="p-3 w-32">Category</th>
                      <th className="p-3 text-center w-20">Year</th>
                      <th className="p-3 text-center w-24">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-700 dark:text-zinc-300">
                    {incompleted.length === 0 && !isLoading ? (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-slate-400 font-mono text-[10px] uppercase tracking-wider">All degree courses mapped successfully!</td>
                      </tr>
                    ) : (
                      incompleted.map((course) => (
                        <tr key={course.code} className="hover:bg-slate-50/40 dark:hover:bg-slate-900/10">
                          <td className="p-3 pl-5 font-mono font-bold text-slate-400 dark:text-slate-500">{course.code}</td>
                          <td className="p-3 uppercase font-semibold text-slate-600 dark:text-zinc-400">{course.courseTitle}</td>
                          <td className="p-3 text-center font-mono text-slate-500">{course.creditHours}</td>
                          <td className="p-3 text-slate-400 font-mono text-[10px]">{course.category}</td>
                          <td className="p-3 text-center font-mono text-slate-500">{course.year}</td>
                          <td className="p-3 text-center font-mono font-bold text-[10px]">
                            {/* CHANGED HERE: Dynamically color status configurations including custom FAILED badge styling metrics */}
                            <span className={`px-2 py-0.5 rounded text-[9px] tracking-wide uppercase ${
                              course.status === "IN_PROGRESS" 
                                ? "bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400"
                                : course.status === "FAILED"
                                ? "bg-rose-50 text-rose-700 dark:bg-rose-950/20 dark:text-rose-400"
                                : "bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-600"
                            }`}>
                              {(course.status || "NOT_TAKEN").replace("_", " ")}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* DYNAMIC METRIC ARRAYS TOTAL WRAPPER BOX */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border rounded-2xl p-4 bg-slate-50 border-slate-200 dark:bg-slate-950 dark:border-slate-800 font-mono text-xs font-bold shadow-inner shrink-0">
              <div className="flex justify-between p-2 rounded-lg bg-white border border-slate-100 dark:bg-slate-900 dark:border-slate-800/60">
                <span className="text-slate-400 uppercase">Total Credit for Graduate:</span>
                <span className="text-slate-900 dark:text-white">{isLoading ? "---" : `${totalGraduationCredits} Hours`}</span>
              </div>
              <div className="flex justify-between p-2 rounded-lg bg-white border border-slate-100 dark:bg-slate-900 dark:border-slate-800/60">
                <span className="text-slate-400 uppercase">Total Acquired Credit Student:</span>
                <span className="text-cyan-600 dark:text-cyan-400">{isLoading ? "---" : `${completedCredits} Hours`}</span>
              </div>
            </div>

          </div>
        )}
      </div>

      {/* FOOTER MATRIX TELEMETRY SUMMARY */}
      <footer className="shrink-0 text-center text-[9px] font-black tracking-widest uppercase text-slate-400 dark:text-slate-600">
        Remaining Credit Required: {isLoading ? "---" : `${incompleteCredits} Hours`}
      </footer>

    </div>
  );
}