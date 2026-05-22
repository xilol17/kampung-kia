"use client";

interface CourseRow {
  code: string;
  name: string;
  creditHours: number;
  category: string;
  year: string;
  status: string; // "Y" or "-"
}

export default function CourseStructurePage() {
  // Static dataset mapping your wireframe requirements exactly
  const completedCourses: CourseRow[] = [
    { code: "BCI1033", name: "PROGRAMMING TECHNIQUES", creditHours: 3, category: "-", year: "-", status: "Y" },
    { code: "BCI1153", name: "DATABASE SYSTEMS", creditHours: 3, category: "-", year: "-", status: "Y" },
    { code: "BCI2033", name: "DATA STRUCTURE & ALGORITHMS", creditHours: 3, category: "-", year: "-", status: "Y" },
    { code: "BCI2323", name: "WEB DEVELOPMENT", creditHours: 3, category: "-", year: "-", status: "Y" },
    { code: "BCI3363", name: "MOBILE APPLICATION DEVELOPMENT", creditHours: 3, category: "-", year: "-", status: "Y" },
    { code: "BCM1013", name: "FUNDAMENTAL OF DIGITAL MEDIA", creditHours: 3, category: "-", year: "-", status: "Y" },
    { code: "BCN1073", name: "COMPUTER ARCHITECTURE & ORGANIZATION", creditHours: 3, category: "-", year: "-", status: "Y" },
    { code: "BCN2173", name: "OPERATING SYSTEMS", creditHours: 3, category: "-", year: "-", status: "Y" },
    { code: "BCS1043", name: "SOFTWARE ENGINEERING", creditHours: 3, category: "-", year: "-", status: "Y" },
    { code: "BCS2163", name: "OBJECT ORIENTED DESIGN & IMPLEMENTATION", creditHours: 3, category: "-", year: "-", status: "Y" },
    { code: "BCY1023", name: "INFORMATION SECURITY", creditHours: 3, category: "-", year: "-", status: "Y" },
    { code: "BUM1153", name: "INTERMEDIATE MATHEMATICS", creditHours: 3, category: "-", year: "-", status: "Y" },
    { code: "BUM1233", name: "DISCRETE MATHEMATICS AND APPLICATIONS", creditHours: 3, category: "-", year: "-", status: "Y" },
    { code: "UHC1012", name: "FALSAFAH DAN ISU SEMASA", creditHours: 2, category: "-", year: "-", status: "Y" },
    { code: "UHC2022", name: "PENGHAYATAN ETIKA DAN PERADABAN", creditHours: 2, category: "-", year: "-", status: "Y" },
    { code: "ULE1310", name: "FUNDAMENTALS OF ENGLISH LANGUAGE", creditHours: 0, category: "-", year: "-", status: "Y" },
    { code: "ULE1322", name: "ENGLISH FOR ACADEMIC COMMUNICATION", creditHours: 2, category: "-", year: "-", status: "Y" },
    { code: "ULE2342", name: "ENGLISH FOR PROFESSIONAL COMMUNICATION", creditHours: 2, category: "-", year: "-", status: "Y" },
  ];

  const incompleteCourses: CourseRow[] = [
    { code: "BCI2353", name: "ALGORITHM & COMPLEXITY", creditHours: 3, category: "FACULTY", year: "3", status: "Y" },
    { code: "BCM2123", name: "3D DIGITAL ANIMATION", creditHours: 3, category: "PROGRAM CORE", year: "3", status: "Y" },
    { code: "BCM3293", name: "GAME PROGRAMMING AND DEVELOPMENT", creditHours: 3, category: "PROGRAM CORE", year: "3", status: "Y" },
    { code: "ULE2332", name: "ENGLISH FOR TECHNICAL COMMUNICATION", creditHours: 2, category: "UNIVERSITY", year: "2", status: "Y" },
    { code: "BC*3**3", name: "ELECTIVE III", creditHours: 3, category: "ELECTIVE", year: "4", status: "Y" },
    { code: "BCM3013", name: "VIRTUAL REALITY", creditHours: 3, category: "PROGRAM CORE", year: "3", status: "Y" },
    { code: "BCS2323", name: "ARTIFICIAL INTELLIGENCE", creditHours: 3, category: "FACULTY", year: "3", status: "Y" },
    { code: "BCC3013", name: "UNDERGRADUATE PROJECT 1", creditHours: 3, category: "FACULTY", year: "3", status: "Y" },
    { code: "BCC3044", name: "UNDERGRADUATE PROJECT II", creditHours: 4, category: "FACULTY", year: "4", status: "Y" },
    { code: "BCI3302", name: "PROJECT MANAGEMENT & PROFESIONAL PRACTICE", creditHours: 2, category: "FACULTY", year: "3", status: "Y" },
    { code: "BCP2173", name: "HUMAN COMPUTER INTERACTION", creditHours: 3, category: "FACULTY", year: "2", status: "Y" },
    { code: "UQA2002", name: "KOKURIKULUM", creditHours: 2, category: "UNIVERSITY", year: "1", status: "Y" },
    { code: "BC*****", name: "ELECTIVE I", creditHours: 3, category: "ELECTIVE", year: "2", status: "Y" },
    { code: "BC****3", name: "ELECTIVE II", creditHours: 3, category: "ELECTIVE", year: "4", status: "Y" },
    { code: "BCC4112", name: "INDUSTRIAL TRAINING", creditHours: 12, category: "FACULTY", year: "4", status: "Y" },
  ];

  return (
    <div className="w-full max-w-[calc(100vw-16rem)] h-full p-6 space-y-6 select-none flex flex-col justify-start overflow-hidden">
      
      {/* 1. TOP HEADER SECTION (Grey box placeholder layout) */}
      <div className="shrink-0 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">Course Structure</h1>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Track your degree progression and graduation milestones</p>
        </div>
      </div>

      {/* 2. MAIN SCROLLABLE MATRIX CONTAINING THE TABLES */}
      <div className="flex-1 min-h-0 overflow-y-auto pr-1 space-y-6">
        
        {/* COMPLETED COURSES BLOCK */}
        <div className="border rounded-2xl overflow-hidden bg-white border-slate-200 dark:bg-slate-900 dark:border-slate-800 shadow-sm">
          <div className="bg-[#2D0909] text-amber-100 dark:bg-zinc-950 dark:text-zinc-200 py-2.5 px-4 text-center text-[10px] font-black tracking-widest uppercase border-b dark:border-slate-800">
            Vertical Credit Transfer (Completed Courses)
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
                {completedCourses.map((course, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/40 dark:hover:bg-slate-900/10">
                    <td className="p-3 pl-5 font-mono font-bold text-cyan-600 dark:text-cyan-400">{course.code}</td>
                    <td className="p-3 uppercase font-semibold">{course.name}</td>
                    <td className="p-3 text-center font-mono text-slate-500">{course.creditHours}</td>
                    <td className="p-3 text-slate-400 font-mono">{course.category}</td>
                    <td className="p-3 text-center font-mono text-slate-400">{course.year}</td>
                    <td className="p-3 text-center font-bold text-emerald-600 dark:text-emerald-400 font-mono">{course.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* INCOMPLETE COURSES BLOCK */}
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
                  <th className="p-3 text-center w-24">Pass/Fail</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-700 dark:text-zinc-300">
                {incompleteCourses.map((course, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/40 dark:hover:bg-slate-900/10">
                    <td className="p-3 pl-5 font-mono font-bold text-slate-400 dark:text-slate-500">{course.code}</td>
                    <td className="p-3 uppercase font-semibold text-slate-500 dark:text-zinc-400">{course.name}</td>
                    <td className="p-3 text-center font-mono text-slate-500">{course.creditHours}</td>
                    <td className="p-3 font-semibold text-slate-400 font-mono text-[10px]">{course.category}</td>
                    <td className="p-3 text-center font-mono text-slate-500">{course.year}</td>
                    <td className="p-3 text-center font-mono text-slate-300 dark:text-slate-700">{course.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 3. BASE ACCOUNT SUMMARY FOOTER */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border rounded-2xl p-4 bg-slate-50 border-slate-200 dark:bg-slate-950 dark:border-slate-800 font-mono text-xs font-bold shadow-inner">
          <div className="flex justify-between p-2 rounded-lg bg-white border border-slate-100 dark:bg-slate-900 dark:border-slate-800/60">
            <span className="text-slate-400 uppercase">Total Credit for Graduate:</span>
            <span className="text-slate-900 dark:text-white">126 Hours</span>
          </div>
          <div className="flex justify-between p-2 rounded-lg bg-white border border-slate-100 dark:bg-slate-900 dark:border-slate-800/60">
            <span className="text-slate-400 uppercase">Total Acquired Credit Student:</span>
            <span className="text-cyan-600 dark:text-cyan-400">77 Hours</span>
          </div>
        </div>

      </div>

      <footer className="shrink-0 text-center text-[9px] font-black tracking-widest uppercase text-slate-400 dark:text-slate-600">
        Remaining Credit Required: 49 Hours
      </footer>

    </div>
  );
}