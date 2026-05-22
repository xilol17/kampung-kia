"use client";

import { useState } from "react";

// Mock interface for your course query results
interface Course {
  id: string;
  code: string;
  name: string;
  section: string;
  instructor: string;
  time: string;
  location: string;
}

interface SearchCourseTabProps {
  isDarkMode: boolean;
}

export default function SearchCourseTab({ isDarkMode }: SearchCourseTabProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Triggered when a user clicks the search button or presses enter
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsLoading(true);
    try {
      // Connect to your backend api endpoint
      const response = await fetch(`http://localhost:8080/api/courses/search?q=${encodeURIComponent(searchQuery)}`);
      if (response.ok) {
        const data = await response.json();
        setCourses(data);
      } else {
        console.error("Failed to fetch courses");
      }
    } catch (error) {
      console.error("Error searching courses:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 p-8 space-y-6 overflow-y-auto h-full">
      
      {/* 1. Header Title Block */}
      <div>
        <h1 className={`text-2xl font-extrabold tracking-tight transition-colors ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
          Search Course
        </h1>
        <p className={`text-xs mt-1 transition-colors ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
          Query institutional database for active module registration codes
        </p>
      </div>

      {/* 2. Top Section Container: Search Bar & Options */}
      <main className={`w-full border rounded-2xl p-6 transition-all ${
        isDarkMode 
          ? 'bg-slate-900/50 border-slate-800/80 shadow-2xl shadow-slate-950/20 backdrop-blur-xl' 
          : 'bg-white/70 border-slate-200 shadow-md shadow-slate-200/40 backdrop-blur-xl'
      }`}>
        <form onSubmit={handleSearch} className="space-y-4">
          <label 
            htmlFor="course-search" 
            className={`text-xs font-semibold tracking-wide transition-colors ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}
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
                placeholder="e.g., CSE101, Vector Calculus, Data Structures..."
                className={`w-full border rounded-xl py-3.5 pl-11 pr-4 text-[15px] outline-none focus:ring-1 focus:ring-cyan-500 transition-all ${
                  isDarkMode 
                    ? 'bg-slate-950/50 border-slate-700/60 placeholder-slate-600 text-white' 
                    : 'bg-slate-50 border-slate-300 placeholder-slate-400 text-slate-900'
                }`}
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

      {/* 3. Bottom Section Container: Search Results */}
      <section className={`w-full min-h-[400px] border rounded-2xl p-6 transition-all ${
        isDarkMode 
          ? 'bg-slate-900/50 border-slate-800/80 shadow-2xl shadow-slate-950/20 backdrop-blur-xl' 
          : 'bg-white/70 border-slate-200 shadow-md shadow-slate-200/40 backdrop-blur-xl'
      }`}>
        <h2 className={`text-sm font-bold tracking-wide uppercase mb-4 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
          Search Results
        </h2>

        {courses.length === 0 ? (
          /* Empty placeholder match inside your wireframe */
          <div className="flex flex-col items-center justify-center min-h-[300px] text-center border border-dashed rounded-xl p-8 transition-colors border-slate-700/40">
            <span className="text-2xl mb-2 text-slate-500">📥</span>
            <p className={`text-sm max-w-xs ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
              No courses queried yet. Enter a valid parameters or course identifier keyword above.
            </p>
          </div>
        ) : (
          /* Response List Grid Card matching the layout */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {courses.map((course) => (
              <div 
                key={course.id}
                className={`border rounded-xl p-4 flex flex-col justify-between transition-all hover:scale-[1.01] ${
                  isDarkMode 
                    ? 'bg-slate-950/40 border-slate-800 text-slate-300 hover:bg-slate-950/70' 
                    : 'bg-slate-50/80 border-slate-200 text-slate-700 hover:bg-slate-100/50'
                }`}
              >
                <div>
                  <div className="flex justify-between items-start gap-2 mb-2">
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-500">
                      {course.code}
                    </span>
                    <span className={`text-xs font-medium ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                      Sec: {course.section}
                    </span>
                  </div>
                  <h3 className={`font-bold text-[15px] mb-3 leading-snug ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                    {course.name}
                  </h3>
                  
                  <div className="space-y-1 text-xs font-medium text-slate-400">
                    <p><span className={isDarkMode ? 'text-slate-600' : 'text-slate-500'}>Instructor:</span> {course.instructor}</p>
                    <p><span className={isDarkMode ? 'text-slate-600' : 'text-slate-500'}>Time:</span> {course.time}</p>
                    <p><span className={isDarkMode ? 'text-slate-600' : 'text-slate-500'}>Location:</span> {course.location}</p>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t flex justify-between items-center text-xs border-slate-800/50">
                  <button className="font-semibold text-slate-400 hover:text-cyan-500 transition">
                    View Details
                  </button>
                  <button className="font-bold text-cyan-500 hover:text-cyan-400 transition">
                    + Add to Plan
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}