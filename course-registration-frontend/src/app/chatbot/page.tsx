"use client";

import { useState, useRef, useEffect } from "react";

interface TimeSlot {
  dayOfWeek: number; // 1 = Mon, 2 = Tue, 3 = Wed, 4 = Thu, 5 = Fri
  startTime: number;
  endTime: number;
}

interface Course {
  courseCode: string;
  courseName: string;
  sectionNumber: string;
  venue: string;
  status: string;
  timeSlots: TimeSlot[];
}

interface RecommendedCourse {
  courseCode: string;
  courseName: string;
}

interface ApiResponse {
  intent: string;
  reply: string;
  actionData?: {
    courseCode: string;
    targetSection: string;
  };
  currentTimetable?: Course[];
  recommendations?: {
    mustRetake: RecommendedCourse[];
    canTake: RecommendedCourse[];
  };
}

interface ChatMessage {
  id: string;
  sender: "user" | "ai";
  text: string;
  structuredData?: ApiResponse;
}

export default function ChatbotPage() {
  const [inputQuery, setInputQuery] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const isExpanded = messages.length > 0;
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isExpanded) scrollToBottom();
  }, [messages, isProcessing, isExpanded]);

  const getDayName = (day: number) => ["", "MON", "TUE", "WED", "THU", "FRI"][day] || "ANY";
  
  const formatTime = (time: number) => {
    const hours = Math.floor(time / 100);
    const mins = time % 100;
    const padHours = hours.toString().padStart(2, "0");
    const padMins = mins.toString().padStart(2, "0");
    return `${padHours}:${padMins}`;
  };

  // FUNCTION A: Rearrange/Retake Pipeline Action
  const handleArrangeCourse = async (courseCode: string) => {
    if (isProcessing) return;
    setIsProcessing(true);
    

    try {
      const token = document.cookie
        .split("; ")
        .find((row) => row.startsWith("token="))
        ?.split("=")[1];

      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

      const response = await fetch(`${baseUrl}/api/timetable/arrange`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { "Authorization": `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ courseCode }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            sender: "ai",
            text: `🤖 System Notice: Arrangement parameters successfully initialized for module node ${courseCode}. Check your scheduler updates.`,
          },
        ]);
      } else {
        alert(data.message || "Failed to arrange course.");
      }
    } catch (error) {
      console.error("Error arranging course:", error);
      alert("Network error: Could not complete arrangement payload transaction.");
    } finally {
      setIsProcessing(false);
    }
  };

  // FUNCTION B: Add Suggested Module Pipeline Action
  const handleAddCourse = async (courseCode: string) => {
    if (isProcessing) return;
    setIsProcessing(true);

    try {
      const token = document.cookie
        .split("; ")
        .find((row) => row.startsWith("token="))
        ?.split("=")[1];

      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

      const response = await fetch(`${baseUrl}/api/timetable/add`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { "Authorization": `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ courseCode }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            sender: "ai",
            text: `✅ System Notice: Module node ${courseCode} successfully assigned to your workspace layout plan buffer!`,
          },
        ]);
      } else {
        alert(data.message || "Failed to add course.");
      }
    } catch (error) {
      console.error("Error adding course:", error);
      alert("Network error: Server staging timed out.");
    } finally {
      setIsProcessing(false);
    }
  };

  // CORE SEARCH/CHAT SEND HANDLER
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputQuery.trim() || isProcessing) return;

    const userText = inputQuery.trim();
    setInputQuery(""); 

    setMessages((prev) => [...prev, { id: crypto.randomUUID(), sender: "user", text: userText }]);
    setIsProcessing(true);

    try {
      const token = document.cookie
        .split("; ")
        .find((row) => row.startsWith("token="))
        ?.split("=")[1];

      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

      const response = await fetch(`${baseUrl}/api/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { "Authorization": `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ message: userText }),
      });

      const data: ApiResponse = await response.json();

      if (response.ok) {
        setMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            sender: "ai",
            text: data.reply,
            structuredData: data, 
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          { id: crypto.randomUUID(), sender: "ai", text: "⚠️ System error occurred parsing framework pipeline configurations." }
        ]);
      }
    } catch (error) {
      console.error("Network interface fault:", error);
      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), sender: "ai", text: "📡 Failed to communicate with engine host node router." }
      ]);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="w-full max-w-[calc(100vw-16rem)] h-full p-6 flex flex-col justify-start font-sans select-none overflow-hidden transition-all duration-500">
      
      {/* 1. TOP HEADER SECTION */}
      <div className="shrink-0 mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">Predictive AI Agent</h1>
          <p className="text-[10px] text-slate-400 font-mono mt-0.5">Telemetry Context Active</p>
        </div>
        {isExpanded && (
          <button onClick={() => setMessages([])} className="text-[10px] font-bold text-rose-500 hover:text-rose-600 transition px-2.5 py-1.5 rounded-lg border border-transparent hover:border-rose-200/40">
            Clear Thread
          </button>
        )}
      </div>

      {/* 2. CORE CANVAS HOUSING CHAT VIEWS */}
      <div className={`w-full rounded-3xl border shadow-xl flex flex-col transition-all duration-500 bg-white border-slate-200 shadow-slate-100/40 dark:bg-black dark:border-slate-900/40 dark:shadow-none overflow-hidden min-h-0 ${
        isExpanded ? "flex-1" : "h-auto py-10"
      }`}>
        
        {/* VIEW AREA A: Title Block & Messages container */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 min-h-0">
          {!isExpanded ? (
            <div className="w-full flex flex-col items-start px-4 transition-all duration-500">
              <h2 className="text-xl font-bold tracking-tight mb-1 text-slate-800 dark:text-white/90">
                Welcome back, Aisyah! 👋
              </h2>
              <p className="text-xs text-slate-400 leading-relaxed mb-4">
                How can I assist you with your academic vector pathways today?
              </p>
            </div>
          ) : (
            messages.map((msg) => (
              <div key={msg.id} className={`flex w-full ${msg.sender === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[85%] rounded-2xl p-4 text-xs font-medium leading-relaxed shadow-sm space-y-4 ${
                  msg.sender === "user"
                    ? "bg-cyan-600 text-white rounded-tr-none"
                    : "bg-slate-50 border border-slate-200 text-slate-800 rounded-tl-none dark:bg-slate-900/40 dark:border-slate-800/80 dark:text-zinc-200 w-full"
                }`}>
                  
                  <p className="whitespace-pre-wrap">{msg.text}</p>

                  {/* CUSTOM WORKSPACE METRIC UI RENDERERS */}
                  {msg.structuredData && (
                    <div className="space-y-4 pt-2 border-t border-slate-200/60 dark:border-slate-800/60 transition-all">
                      
                      {/* INTENT TASK BADGE */}
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
                          ⚙️ System Action: {msg.structuredData.intent}
                        </span>
                      </div>

                      {/* CURRENT TIMETABLE DISPLAY MATRIX */}
                      {msg.structuredData.currentTimetable && (
                        <div className="space-y-2">
                          <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active Schedule Preview</h4>
                          <div className="border rounded-xl overflow-hidden bg-white dark:bg-slate-950 border-slate-100 dark:border-slate-800/80">
                            <table className="w-full text-left border-collapse">
                              <thead>
                                <tr className="bg-slate-100/50 dark:bg-slate-900 text-[9px] font-black uppercase text-slate-400 tracking-wider border-b border-slate-100 dark:border-slate-800/80">
                                  <th className="p-2.5">Code</th>
                                  <th className="p-2.5">Course Module Name</th>
                                  <th className="p-2.5 text-center">Sec</th>
                                  <th className="p-2.5">Time & Venue</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50 font-medium text-[11px]">
                                {msg.structuredData.currentTimetable.map((course, idx) => (
                                  <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/20 text-slate-700 dark:text-zinc-300">
                                    <td className="p-2.5 font-mono text-[10px] font-bold text-cyan-600 dark:text-cyan-400">{course.courseCode}</td>
                                    <td className="p-2.5 truncate max-w-[180px]">{course.courseName}</td>
                                    <td className="p-2.5 text-center font-mono text-slate-400">{course.sectionNumber}</td>
                                    <td className="p-2.5 text-[10px]">
                                      {course.timeSlots.map((ts, tIdx) => (
                                        <div key={tIdx} className="leading-tight text-slate-500">
                                          🗓️ {getDayName(ts.dayOfWeek)} • {formatTime(ts.startTime)} - {formatTime(ts.endTime)} <span className="text-slate-400 dark:text-slate-600">({course.venue})</span>
                                        </div>
                                      ))}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}

                      {/* ACADEMIC COURSE RECOMMENDATION MATRIX DRAWER */}
                      {msg.structuredData.recommendations && (
                        <div className="space-y-3">
                          <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Recommended Actions Mapping</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            
                            {/* REQUIRED TO RETAKE LOCK BLOCK */}
                            {msg.structuredData.recommendations.mustRetake?.length > 0 && (
                              <div className="p-3 rounded-xl border border-rose-100 bg-rose-50/30 dark:border-rose-950/40 dark:bg-rose-950/10 space-y-2">
                                <span className="text-[9px] font-black text-rose-500 uppercase tracking-wider block">⚠️ Action Required: Must Retake</span>
                                {msg.structuredData.recommendations.mustRetake.map((rec, rIdx) => (
                                  <div key={rIdx} className="flex justify-between items-center p-2 rounded-lg bg-white dark:bg-slate-950 border border-rose-100 dark:border-rose-950/50">
                                    <div className="min-w-0">
                                      <p className="font-mono font-bold text-[10px] text-rose-600">{rec.courseCode}</p>
                                      <p className="text-[11px] truncate text-slate-700 dark:text-zinc-300">{rec.courseName}</p>
                                    </div>
                                    <button 
                                      onClick={() => handleArrangeCourse(rec.courseCode)}
                                      disabled={isProcessing}
                                      className="text-[10px] font-bold text-white bg-rose-600 hover:bg-rose-500 px-2.5 py-1 rounded-md transition whitespace-nowrap ml-2 disabled:opacity-50"
                                    >
                                      {isProcessing ? "..." : "+ Arrange"}
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* ELECTIVES / SUGGESTED OPEN MODULES */}
                            {msg.structuredData.recommendations.canTake?.length > 0 && (
                              <div className="p-3 rounded-xl border border-blue-100 bg-blue-50/20 dark:border-slate-800/80 dark:bg-slate-900/20 space-y-2">
                                <span className="text-[9px] font-black text-blue-500 dark:text-cyan-400 uppercase tracking-wider block">🎓 Suggested Module Registration Path</span>
                                <div className="space-y-1.5 max-h-[160px] overflow-y-auto pr-1">
                                  {msg.structuredData.recommendations.canTake.map((rec, rIdx) => (
                                    <div key={rIdx} className="flex justify-between items-center p-2 rounded-lg bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800/80">
                                      <div className="min-w-0">
                                        <p className="font-mono font-bold text-[10px] text-blue-600 dark:text-cyan-400">{rec.courseCode}</p>
                                        <p className="text-[10px] truncate text-slate-600 dark:text-zinc-400">{rec.courseName}</p>
                                      </div>
                                      <button 
                                        onClick={() => handleAddCourse(rec.courseCode)}
                                        disabled={isProcessing}
                                        className="text-[9px] font-bold text-cyan-600 border border-cyan-100 hover:bg-cyan-50 dark:border-slate-800 dark:text-cyan-400 dark:hover:bg-slate-900 px-2 py-1 rounded-md transition whitespace-nowrap ml-2 disabled:opacity-50"
                                      >
                                        {isProcessing ? "..." : "+ Add"}
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                          </div>
                        </div>
                      )}

                    </div>
                  )}

                </div>
              </div>
            ))
          )}

          {isProcessing && (
            <div className="flex w-full justify-start animate-pulse">
              <div className="max-w-[75%] rounded-2xl rounded-tl-none p-3.5 text-xs font-bold font-mono tracking-wider bg-slate-50 border border-slate-200 text-slate-400 dark:bg-slate-900 dark:border-slate-800">
                AI Core processing parameters<span className="animate-ping">...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* VIEW AREA B: Capsule Input Bar Allocation */}
        <div className={`p-4 shrink-0 transition-all duration-500 ${isExpanded ? "border-t border-slate-100 dark:border-slate-900" : ""}`}>
          <form onSubmit={handleSendMessage} className="w-full max-w-4xl mx-auto space-y-3 px-4">
            <div className="relative w-full rounded-full border p-1.5 flex items-center transition-all bg-slate-50 border-slate-200 focus-within:border-slate-300 dark:bg-slate-900/60 dark:backdrop-blur dark:border-white/10 dark:focus-within:border-white/20 shadow-sm">

              <input 
                type="text" 
                value={inputQuery}
                disabled={isProcessing}
                onChange={(e) => setInputQuery(e.target.value)}
                placeholder="Swap course, register for electives, check prerequisite paths..."
                className="w-full bg-transparent border-none outline-none py-2 text-xs font-medium pl-1 text-slate-900 placeholder-slate-400 dark:text-white dark:placeholder-slate-500 disabled:opacity-50"
              />

              <div className="flex items-center gap-2 shrink-0 pr-1">
                <button 
                  type="submit" 
                  disabled={isProcessing || !inputQuery.trim()}
                  className="w-7 h-7 rounded-full flex items-center justify-center text-xs bg-blue-600 hover:bg-blue-500 text-white shadow shadow-blue-500/20 transition font-black disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:text-slate-400"
                >
                  ➔
                </button>
              </div>
            </div>

            {/* Quick Action Selection Option Pills */}
            {!isExpanded && (
              <div className="flex items-center justify-start gap-2 pt-1 transition-all duration-300">
                {[
                  { label: "Swap ULE1310 to Section 02" },
                  { label: "Check Retake Requirements" }
                ].map((pill) => (
                  <button
                    key={pill.label}
                    type="button"
                    onClick={() => setInputQuery(pill.label)}
                    className="px-3 py-1.5 rounded-full border text-[10px] font-bold bg-white border-slate-200 text-slate-600 hover:bg-slate-50 transition dark:bg-white/5 dark:border-white/5 dark:text-slate-300 dark:hover:bg-white/10"
                  >
                    {pill.label}
                  </button>
                ))}
              </div>
            )}
          </form>
        </div>

      </div>

      {/* 3. BASE HISTORY FOOTER NOTATION */}
      <footer className="shrink-0 mt-4 text-center text-[9px] font-black tracking-widest uppercase transition-colors text-slate-400 dark:text-slate-600">
        {!isExpanded ? "no history" : `${messages.length} messages active in stream node`}
      </footer>

    </div>
  );
}