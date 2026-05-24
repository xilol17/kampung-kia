"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import toast, { Toaster } from "react-hot-toast";

// Standard icon set aligned across institutional workspace layouts
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
    info: "ℹ️",
    book: "📖",
    target: "🎯",
    check: "✅",
    lock: "🕒",
    userGroup: "👥",
    trash: "🗑️"
  };
  return <span>{icons[name] || "•"}</span>;
};

interface TimeSlot {
  id?: number;
  dayOfWeek: number;
  startTime: number;
  endTime: number;
}

interface Section {
  sectionNumber: string;
  venue: string;
  capacity?: number;
  totalCapacity?: number;
  capacityRemaining?: number;
  lecturerName?: string;
  timeString?: string;
  timeSlots: TimeSlot[];
}

interface Course {
  courseCode: string;
  courseName: string;
  creditHours?: number;
  sections?: Section[];
  // 保持向下兼容一维平铺结构的旧字段
  sectionNumber?: string;
  venue?: string;
  status?: string;
  timeSlots?: TimeSlot[];
}

interface RecommendedCourse {
  courseCode: string;
  courseName: string;
}

interface CurrentCourseItem {
  courseCode: string;
  courseName: string;
  credit: number;
  status: string;
}

interface ProgressReportData {
  totalPassedCredits: number;
  currentSemesterCredits: number;
  graduationRequiredCredits: number;
  remainingCredits: number;
  passedCourses: any[];
  currentCourses: CurrentCourseItem[];
}

interface PrerequisiteItem {
  prerequisiteCode: string;
  prerequisiteName: string;
}

interface PrerequisiteInfoData {
  courseCode: string;
  courseName: string;
  hasPrerequisites: boolean;
  prerequisites: PrerequisiteItem[];
}

interface ApiResponse {
  intent: string;
  reply: string;
  actionData?: {
    courseCode: string;
    targetSection?: string;
  };
  currentTimetable?: Course[];
  recommendations?: {
    mustRetake: RecommendedCourse[];
    canTake: RecommendedCourse[];
  };
  progressReport?: ProgressReportData; 
  courseDetails?: {
    courseCode: string;
    courseName: string;
    sections: Section[];
  };
  searchResults?: Course[];
  prerequisiteInfo?: PrerequisiteInfoData; 
}

interface ChatMessage {
  id: string;
  sender: "user" | "ai";
  text: string;
  structuredData?: ApiResponse;
}

function ChatbotInnerContent() {
  const [inputQuery, setInputQuery] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const isExpanded = messages.length > 0;
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const searchParams = useSearchParams();
  const router = useRouter();
  const hasFiredRef = useRef(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isExpanded) scrollToBottom();
  }, [messages, isProcessing, isExpanded]);

  useEffect(() => {
    const queryFromUrl = searchParams.get("q");
    if (queryFromUrl && queryFromUrl.trim() && !hasFiredRef.current) {
      const cleanText = queryFromUrl.trim();
      hasFiredRef.current = true;
      sessionStorage.removeItem("pending_chatbot_query");
      setInputQuery(cleanText);
      router.replace("/main/chatbot");
      executeChatRequestPipeline(cleanText);
    }
  }, [searchParams, router]);

  const getDayName = (day: number) => ["", "MON", "TUE", "WED", "THU", "FRI"][day] || "ANY";
  
  const formatTime = (time: number) => {
    const hours = Math.floor(time / 100).toString().padStart(2, "0");
    const mins = (time % 100).toString().padStart(2, "0");
    return `${hours}:${mins}`;
  };

  const handleEnrollSection = (code: string, sec: string) => {
    if (isProcessing) return;
    setIsProcessing(true);

    const toastId = toast.loading(`Routing manual injection vectors for ${code} Section ${sec}...`, {
      style: { background: '#0f172a', color: '#06b6d4', border: '1px solid #0891b2' }
    });

    setTimeout(() => {
      toast.success(`Module ${code} (Sec ${sec}) registration staging locked!`, { id: toastId });
      setMessages((prev) => [
        ...prev,
        {
          id: `ai_override_sync_${Date.now()}`,
          sender: "ai",
          text: `⚡ **Manual Override Sync:** Course connection confirmed for module **${code}** (Section ${sec}). Timetable array state metrics updated.`,
        },
      ]);
      setIsProcessing(false);
    }, 1000);
  };

  const handleExecuteEnrollPipeline = async (courseCode: string, sectionNum: string = "01") => {
    if (isProcessing) return;
    setIsProcessing(true);

    const toastId = toast.loading(`Routing network payload vectors for ${courseCode} (Sec ${sectionNum})...`, {
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
        body: JSON.stringify({ courseCode, sectionNumber: sectionNum }), 
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast.success(`Module ${courseCode} Sec ${sectionNum} linked successfully!`, { id: toastId });
        
        setMessages((prev) => [
          ...prev,
          {
            id: `ai_enroll_sync_${Date.now()}`,
            sender: "ai",
            text: `✅ **AI System Sync:** Connection established! Module node **${courseCode}** (Section ${sectionNum}) has been injected into your registry workspace database.`,
          },
        ]);
      } else {
        toast.error(data.message || `Failed to parameter lock for ${courseCode}.`, { id: toastId });
      }
    } catch (error) {
      console.error(error);
      toast.error("Network interface error: Node pipeline timeout.", { id: toastId });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleArrangeCourse = async (courseCode: string) => {
    await handleExecuteEnrollPipeline(courseCode, "01");
  };

  const handleAddCourse = async (courseCode: string) => {
    await handleExecuteEnrollPipeline(courseCode, "01");
  };

  const handleDropCourseDirectly = async (courseCode: string) => {
    if (isProcessing) return;
    setIsProcessing(true);

    const toastId = toast.loading(`Requesting pipeline termination for ${courseCode}...`, {
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
        body: JSON.stringify({ courseCode }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast.success(`Successfully dropped ${courseCode}.`, {
          id: toastId,
          style: { background: '#0f172a', color: '#f43f5e', border: '1px solid #e11d48', fontWeight: 'bold' },
          icon: '🗑️'
        });

        setMessages((prev) => [
          ...prev,
          {
            id: `ai_drop_sync_${Date.now()}`,
            sender: "ai",
            text: `🗑️ **AI System Sync:** Module **${courseCode}** has been successfully dropped from your timetable matrix container.`,
          },
        ]);
      } else {
        toast.error(data.message || `Failed to drop course module parameters.`, { id: toastId });
      }
    } catch (error) {
      console.error(error);
      toast.error("Network Error: Relational registry link offline.", { id: toastId });
    } finally {
      setIsProcessing(false);
    }
  };

  const executeChatRequestPipeline = async (userText: string) => {
    if (!userText.trim() || isProcessing) return;

    setInputQuery(""); 
    setMessages((prev) => [...prev, { id: `user_msg_${Date.now()}`, sender: "user", text: userText }]);
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
        // =================================================================
        // 🛡️ FRONTEND SMART DATA ADAPTER (完美重写 AI 报错回复，激活多卡片多 Section 渲染)
        // =================================================================
        const courseCodeRegex = /[A-Z]{3,4}\d{4}/g;
        const matchedCodes = userText.toUpperCase().match(courseCodeRegex);
        const targetCode = matchedCodes && matchedCodes.length > 0 ? matchedCodes[0] : "";
        
        if (!data.searchResults && targetCode) {
          try {
            const fallbackRes = await fetch(`${baseUrl}/api/portal/courses/search?q=${targetCode}`, {
              method: "GET",
              headers: {
                "Content-Type": "application/json",
                ...(token ? { "Authorization": `Bearer ${token}` } : {}),
              },
            });
            const fallbackJson = await fallbackRes.json();
            if (fallbackJson.success && Array.isArray(fallbackJson.data) && fallbackJson.data.length > 0) {
              data.searchResults = fallbackJson.data;
            }
          } catch (e) {
            console.warn("Fallback network stream bypassed:", e);
          }
        }

        // 🌟 核心映射修正：如果 searchResults 包含单门完整课程，强制转译映射给 RENDERER 1 展开多 Section 独立卡片
        if (data.searchResults && data.searchResults.length === 1 && data.searchResults[0].sections) {
          const singleCourse = data.searchResults[0];
          data.courseDetails = {
            courseCode: singleCourse.courseCode,
            courseName: singleCourse.courseName,
            sections: singleCourse.sections
          };
          
          if (data.reply.includes("not a recognized") || data.reply.includes("not exist") || data.reply.includes("Searching for")) {
            data.reply = `🤖 **RegiSmart Telemetry Active:** Localized exact match for **${singleCourse.courseCode}** (${singleCourse.courseName}). Multiple section offering structures have been unpacked grid-wise below:`;
          }
        }
        // =================================================================

        console.log(
          "%c🤖 [CHATBOT ENG TELEMETRY STREAM]", 
          "background: #0ea5e9; color: white; font-weight: black; padding: 4px 10px; rounded-md; font-size: 11px;", 
          {
            intent: data.intent,
            reply: data.reply,
            hasTimetableArray: !!data.currentTimetable,
            hasProgressReport: !!data.progressReport,
            hasSearchResults: !!data.searchResults,
            hasCourseDetails: !!data.courseDetails,
            rawJsonPayload: data 
          }
        );

        setMessages((prev) => [
          ...prev,
          {
            id: `ai_msg_${Date.now()}`,
            sender: "ai",
            text: data.reply,
            structuredData: data, 
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          { id: `ai_err_${Date.now()}`, sender: "ai", text: "⚠️ System error occurred parsing framework pipeline configurations." }
        ]);
      }
    } catch (error) {
      console.error("Network interface fault:", error);
      setMessages((prev) => [
        ...prev,
        { id: `ai_net_fault_${Date.now()}`, sender: "ai", text: "📡 Failed to communicate with engine host node router." }
      ]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputQuery.trim()) return;
    await executeChatRequestPipeline(inputQuery);
  };

  return (
    <div className="w-full max-w-[calc(100vw-16rem)] h-full p-6 flex flex-col justify-start font-sans overflow-hidden transition-all duration-500">
      
      <Toaster position="bottom-right" reverseOrder={false} />

      {/* 1. TOP HEADER SECTION */}
      <div className="shrink-0 mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">Predictive AI Agent</h1>
          <p className="text-[10px] text-slate-400 font-mono mt-0.5">Telemetry Context Active</p>
        </div>
      </div>

      {/* 2. CORE CANVAS HOUSING CHAT VIEWS */}
      <div className={`w-full rounded-3xl border shadow-xl flex flex-col transition-all duration-500 bg-white border-slate-200 shadow-slate-100/40 dark:bg-black dark:border-slate-900/40 dark:shadow-none overflow-hidden min-h-0 ${
        isExpanded ? "flex-1" : "h-auto py-10"
      }`}>
        
        {/* VIEW AREA A: Messages flow block */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 min-h-0 custom-scrollbar">
          {!isExpanded ? (
            <div className="w-full flex flex-col items-start px-4 transition-all duration-500">
              <h2 className="text-xl font-bold tracking-tight mb-1 text-slate-800 dark:text-white/90">
                Welcome back! 👋
              </h2>
              <p className="text-xs text-slate-400 leading-relaxed mb-4">
                How can I assist you with your academic academic pathway structures today?
              </p>
            </div>
          ) : (
            messages.map((msg) => {
              const isAi = msg.sender === "ai";
              const isReport = !!msg.structuredData?.progressReport;

              return (
                <div key={msg.id} className={`flex w-full ${isAi ? "justify-start" : "justify-end"}`}>
                  <div className={`rounded-2xl p-4 text-xs font-medium leading-relaxed shadow-sm space-y-3.5 ${
                    !isAi
                      ? "bg-cyan-600 text-white rounded-tr-none max-w-[85%]"
                      : isReport
                      ? "bg-slate-50 border border-slate-200 text-slate-800 rounded-tl-none dark:bg-slate-900/40 dark:border-slate-800/80 dark:text-zinc-200 w-full" 
                      : "bg-slate-50 border border-slate-200 text-slate-800 rounded-tl-none dark:bg-slate-900/40 dark:border-slate-800/80 dark:text-zinc-200 max-w-[85%]"
                  }`}>
                    
                    <p className="whitespace-pre-wrap font-medium">{msg.text}</p>

                    {/* STRUCTURED RESPONSE COMPONENT PLUGINS */}
                    {msg.structuredData && (
                      <div className="space-y-4 pt-3 border-t border-slate-200/60 dark:border-slate-800/60 transition-all">
                        
                        {/* RENDERER 0: 先修课程卡片 */}
                        {msg.structuredData.prerequisiteInfo && (
                          <div className="w-full max-w-xl rounded-xl border border-slate-200 bg-white p-4 dark:bg-slate-950 dark:border-slate-800/80 shadow-md animate-fade-in space-y-3">
                            <div className="flex items-center justify-between border-b pb-2 border-slate-100 dark:border-slate-900">
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                                <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase font-mono tracking-tight">
                                  Prerequisite Telemetry Matrix
                                </h4>
                              </div>
                              <span className="text-[9px] font-mono font-black text-slate-400 bg-slate-50 dark:bg-slate-900 px-1.5 py-0.2 rounded border">
                                LINK LOCK
                              </span>
                            </div>

                            <div className="p-3 bg-slate-50/70 border border-slate-100 rounded-xl dark:bg-slate-900/40 dark:border-slate-800 flex items-center justify-between">
                              <div className="min-w-0">
                                <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 font-mono">Target Subject</span>
                                <h5 className="text-[12px] font-bold text-slate-900 dark:text-zinc-200 truncate mt-0.5">
                                  {msg.structuredData.prerequisiteInfo.courseName}
                                </h5>
                              </div>
                              <span className="font-mono text-[10px] font-black text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/5 shrink-0 ml-2">
                                {msg.structuredData.prerequisiteInfo.courseCode}
                              </span>
                            </div>

                            <div className="space-y-1.5">
                              <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 font-mono block pl-1">
                                🔑 Required Unlocked Nodes
                              </span>
                              
                              {msg.structuredData.prerequisiteInfo.hasPrerequisites && msg.structuredData.prerequisiteInfo.prerequisites?.length > 0 ? (
                                msg.structuredData.prerequisiteInfo.prerequisites.map((pre, pIdx) => (
                                  <div key={pIdx} className="p-3 bg-indigo-50/10 border border-indigo-500/20 dark:border-indigo-950/40 rounded-xl flex items-center justify-between gap-4 shadow-2xs hover:border-indigo-500/40 transition-colors">
                                    <div className="min-w-0 flex-1">
                                      <div className="flex items-center gap-2">
                                        <span className="font-mono text-[10px] font-extrabold text-indigo-600 dark:text-cyan-400 bg-indigo-500/10 dark:bg-cyan-500/10 px-1.5 py-0.2 rounded border border-indigo-500/5">
                                          {pre.prerequisiteCode}
                                        </span>
                                        <h6 className="text-[11.5px] font-bold text-slate-800 dark:text-zinc-100 truncate">
                                          {pre.prerequisiteName}
                                        </h6>
                                      </div>
                                      <p className="text-[9.5px] text-slate-400 font-medium mt-1">Must lock a passing grade record block before terminal core entry.</p>
                                    </div>
                                    <button
                                      type="button"
                                      disabled={isProcessing}
                                      onClick={() => handleExecuteEnrollPipeline(pre.prerequisiteCode, "01")}
                                      className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white dark:bg-cyan-600 dark:hover:bg-cyan-500 text-[10px] font-black rounded-lg transition active:scale-95 shadow-xs whitespace-nowrap disabled:opacity-40"
                                    >
                                      + Enroll
                                    </button>
                                  </div>
                                ))
                              ) : (
                                <div className="p-3 text-center border border-dashed rounded-xl font-mono text-[10px] text-emerald-600 dark:text-emerald-400 bg-emerald-500/5 border-emerald-500/20">
                                  🔓 Zero Prerequisite Restrictions. Open Pathway Node.
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* 🌟 RENDERER 1: 完美解析单科目下的所有 Sections (生成多张独立卡片) */}
                        {msg.structuredData.courseDetails && msg.structuredData.courseDetails.sections && (
                          <div className="w-full max-w-2xl rounded-xl border border-slate-200 bg-white p-4 space-y-4 dark:bg-slate-950 dark:border-slate-800 shadow-md animate-fade-in">
                            
                            <div className="flex items-center justify-between border-b pb-2 border-slate-100 dark:border-slate-900">
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-xs px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/5">
                                  {msg.structuredData.courseDetails.courseCode || "COURSE"}
                                </span>
                                <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                                  {msg.structuredData.courseDetails.courseName}
                                </h4>
                              </div>
                              <span className="text-[9px] font-mono font-black text-slate-400 uppercase tracking-widest">Active Intake Offerings</span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                              {msg.structuredData.courseDetails.sections.map((sec, sIdx) => {
                                const totalCap = sec.totalCapacity || sec.capacity || 35;
                                const capRemaining = typeof sec.capacityRemaining !== "undefined" ? sec.capacityRemaining : totalCap;
                                const isCritical = capRemaining <= 3;

                                return (
                                  <div 
                                    key={sIdx} 
                                    className="p-3.5 rounded-xl border border-slate-150 bg-slate-50/50 dark:border-slate-800/80 dark:bg-slate-900/10 flex flex-col justify-between gap-3 shadow-2xs hover:border-cyan-500/40 dark:hover:border-cyan-500/30 transition-all duration-200"
                                  >
                                    <div className="space-y-2">
                                      <div className="flex justify-between items-center">
                                        <span className="font-mono font-black text-xs text-slate-900 dark:text-white">
                                          Section {sec.sectionNumber}
                                        </span>
                                        <span className={`text-[8.5px] font-mono font-bold px-1.5 py-0.2 rounded-md border ${
                                          isCritical 
                                            ? "bg-rose-50 border-rose-100 text-rose-600 dark:bg-rose-950/40 dark:border-rose-900/50" 
                                            : "bg-emerald-50 border-emerald-100 text-emerald-600 dark:bg-emerald-950/40 dark:border-emerald-900/50"
                                        }`}>
                                          {capRemaining} / {totalCap} Seats
                                        </span>
                                      </div>

                                      <p className="text-[11px] font-bold text-slate-700 dark:text-zinc-300 truncate" title={sec.lecturerName}>
                                        👤 {sec.lecturer?.name || sec.lecturerName || "To Be Assigned"}
                                      </p>

                                      <div className="text-[10px] text-slate-500 dark:text-slate-400 space-y-0.5 font-mono">
                                        {sec.timeSlots && sec.timeSlots.length > 0 ? (
                                          sec.timeSlots.map((ts: any, tIdx: number) => (
                                            <p key={tIdx} className="tracking-tight flex items-center gap-1">
                                              🗓️ {getDayName(ts.dayOfWeek)} • {formatTime(ts.startTime)} - {formatTime(ts.endTime)}
                                            </p>
                                          ))
                                        ) : sec.timeString ? (
                                          <p className="tracking-tight">🕒 {sec.timeString}</p>
                                        ) : (
                                          <p className="italic text-slate-400">🕒 Schedule Matrix Staged</p>
                                        )}
                                      </div>

                                      <p className="text-[10px] text-slate-400 flex items-center gap-1">
                                        📍 Venue: <span className="font-bold font-mono text-slate-600 dark:text-slate-300">{sec.venue || "TBA"}</span>
                                      </p>
                                    </div>

                                    <button
                                      type="button"
                                      disabled={isProcessing}
                                      onClick={() => handleExecuteEnrollPipeline(msg.structuredData!.courseDetails!.courseCode, sec.sectionNumber)}
                                      className="w-full mt-2 py-1.5 text-center bg-slate-900 hover:bg-slate-800 text-white dark:bg-cyan-600 dark:hover:bg-cyan-500 font-black text-[10px] uppercase tracking-wider rounded-lg transition-all shadow-xs active:scale-[0.96] disabled:opacity-40"
                                    >
                                      Enroll Sec {sec.sectionNumber}
                                    </button>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* RENDERER 2: Credit/Progress Data Dashboard */}
                        {msg.structuredData.progressReport && (
                          <div className="w-full rounded-2xl border border-slate-200/70 bg-white p-6 space-y-6 dark:bg-slate-950 dark:border-slate-800 shadow-md animate-fade-in">
                            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                              <div className="p-3.5 border rounded-xl bg-slate-50/40 border-slate-100 dark:bg-slate-900/30 dark:border-slate-800/60 flex flex-col justify-between min-h-[70px]">
                                <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 font-mono">Passed Units</span>
                                <div className="flex items-baseline gap-1 mt-1">
                                  <span className="text-2xl font-black text-slate-950 dark:text-white font-mono">{msg.structuredData.progressReport.totalPassedCredits}</span>
                                  <span className="text-[9px] text-slate-400 font-bold uppercase font-mono">Hours</span>
                                </div>
                              </div>
                              <div className="p-3.5 border rounded-xl bg-cyan-50/10 border-cyan-100/40 dark:bg-cyan-950/10 dark:border-cyan-900/40 flex flex-col justify-between min-h-[70px]">
                                <span className="text-[9px] font-black uppercase tracking-wider text-cyan-600 dark:text-cyan-400 font-mono">Current Semester</span>
                                <div className="flex items-baseline gap-1 mt-1">
                                  <span className="text-2xl font-black text-cyan-600 dark:text-cyan-400 font-mono">+{msg.structuredData.progressReport.currentSemesterCredits}</span>
                                  <span className="text-[9px] text-cyan-500 font-bold uppercase font-mono">Hours</span>
                                </div>
                              </div>
                              <div className="p-3.5 border rounded-xl bg-slate-50/40 border-slate-100 dark:bg-slate-900/30 dark:border-slate-800/60 flex flex-col justify-between min-h-[70px]">
                                <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 font-mono">Remaining Load</span>
                                <div className="flex items-baseline gap-1 mt-1">
                                  <span className="text-2xl font-black text-slate-800 dark:text-zinc-300 font-mono">{msg.structuredData.progressReport.remainingCredits}</span>
                                  <span className="text-[9px] text-slate-400 font-bold uppercase font-mono">Hours</span>
                                </div>
                              </div>
                              <div className="p-3.5 border rounded-xl bg-slate-50/40 border-slate-100 dark:bg-slate-900/30 dark:border-slate-800/60 flex flex-col justify-between min-h-[70px]">
                                <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 font-mono">Graduation Target</span>
                                <div className="flex items-baseline gap-1 mt-1">
                                  <span className="text-2xl font-black text-slate-950 dark:text-white font-mono">{msg.structuredData.progressReport.graduationRequiredCredits}</span>
                                  <span className="text-[9px] text-slate-400 font-bold uppercase font-mono">Total</span>
                                </div>
                              </div>
                            </div>

                            <div className="space-y-2 bg-slate-50/30 p-4 rounded-xl border border-slate-100 dark:bg-slate-900/10 dark:border-slate-800/40">
                              <div className="flex justify-between items-center text-[10px] font-bold text-slate-500">
                                <span className="flex items-center gap-1.5">🎯 Degree Path Roadmap Completeness</span>
                                <span className="font-mono text-cyan-600 dark:text-cyan-400">
                                  {Math.round(((msg.structuredData.progressReport.totalPassedCredits + msg.structuredData.progressReport.currentSemesterCredits) / msg.structuredData.progressReport.graduationRequiredCredits) * 100)}% Accounted For
                                </span>
                              </div>
                              <div className="w-full h-3 rounded-full bg-slate-100 dark:bg-slate-900 border border-slate-200/40 dark:border-slate-800/60 overflow-hidden relative">
                                <div 
                                  className="absolute top-0 bottom-0 bg-cyan-500/20 transition-all"
                                  style={{ width: `${((msg.structuredData.progressReport.totalPassedCredits + msg.structuredData.progressReport.currentSemesterCredits) / msg.structuredData.progressReport.graduationRequiredCredits) * 100}%` }}
                                />
                                <div 
                                  className="absolute top-0 bottom-0 bg-gradient-to-r from-cyan-600 to-cyan-500 h-full rounded-full transition-all duration-500"
                                  style={{ width: `${(msg.structuredData.progressReport.totalPassedCredits / msg.structuredData.progressReport.graduationRequiredCredits) * 100}%` }}
                                />
                              </div>
                            </div>

                            <div className="space-y-2.5">
                              <h5 className="text-[9.5px] font-black uppercase tracking-wider text-slate-400 font-mono flex items-center gap-1.5">
                                <Icon name="book" /> Active Term Registered Segments (Waitlist Telemetry)
                              </h5>
                              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 max-h-[280px] overflow-y-auto pr-1 custom-scrollbar">
                                {msg.structuredData.progressReport.currentCourses?.map((course, cIdx) => (
                                  <div key={cIdx} className="p-3 rounded-xl border flex flex-col justify-between bg-slate-50/40 border-slate-100 dark:bg-slate-900/30 dark:border-slate-800/60 shadow-2xs hover:border-slate-200 transition-colors">
                                    <div className="w-full flex justify-between items-center gap-2">
                                      <span className="font-mono font-black text-[10.5px] text-cyan-600 dark:text-cyan-400">{course.courseCode}</span>
                                      <span className="text-[8.5px] font-bold font-mono px-1.5 py-0.2 bg-black/5 dark:bg-white/5 text-slate-400 rounded-md">{course.credit} Credits</span>
                                    </div>
                                    <p className="font-bold text-slate-900 dark:text-zinc-100 text-[11px] truncate mt-1.5" title={course.courseName}>
                                      {course.courseName}
                                    </p>
                                    <div className="w-full flex items-center justify-end mt-2">
                                      <span className="text-[8px] font-black font-mono tracking-tight px-1.5 py-0.5 rounded bg-amber-50 text-amber-600 dark:bg-amber-950/20 dark:text-amber-400 uppercase leading-none">
                                        {course.status}
                                      </span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* RENDERER 3: TIMETABLE GENERATOR PREVIEW MATRIX */}
                        {msg.structuredData.currentTimetable && (
                          <div className="space-y-2">
                            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active Schedule Preview</h4>
                            <div className="border rounded-xl overflow-hidden bg-white dark:bg-slate-950 border-slate-100 dark:border-slate-800/80">
                              <table className="w-full text-left border-collapse">
                                <thead>
                                  <tr className="bg-slate-100/50 dark:bg-slate-900 text-[9px] font-black uppercase text-slate-400 tracking-wider border-b border-slate-100 dark:border-slate-800/80">
                                    <th className="p-2.5 w-[12%]">Code</th>
                                    <th className="p-2.5 w-[35%]">Course Module Name</th>
                                    <th className="p-2.5 text-center w-[8%]">Sec</th>
                                    <th className="p-2.5 w-[33%]">Time & Venue</th>
                                    <th className="p-2.5 text-center w-[12%]">Action</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50 font-medium text-[11px]">
                                  {msg.structuredData.currentTimetable.map((course, idx) => (
                                    <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/20 text-slate-700 dark:text-zinc-300">
                                      <td className="p-2.5 font-mono text-[10px] font-bold text-cyan-600 dark:text-cyan-400">{course.courseCode}</td>
                                      <td className="p-2.5 truncate max-w-[180px] font-bold">{course.courseName}</td>
                                      <td className="p-2.5 text-center font-mono text-slate-400">{course.sectionNumber}</td>
                                      <td className="p-2.5 text-[10px]">
                                        {course.timeSlots?.map((ts, tIdx) => (
                                          <div key={tIdx} className="leading-tight text-slate-500">
                                            🗓️ {getDayName(ts.dayOfWeek)} • {formatTime(ts.startTime)} - {formatTime(ts.endTime)} <span className="text-slate-400 dark:text-slate-600 font-mono">({course.venue})</span>
                                          </div>
                                        ))}
                                      </td>
                                      <td className="p-2.5 text-center">
                                        <button
                                          type="button"
                                          disabled={isProcessing}
                                          onClick={() => handleDropCourseDirectly(course.courseCode)}
                                          className="px-2.5 py-1 text-[9px] font-black uppercase tracking-wider text-white bg-rose-600 hover:bg-rose-500 dark:bg-rose-600 dark:hover:bg-rose-500 rounded-md transition active:scale-95 shadow-xs whitespace-nowrap disabled:opacity-40"
                                        >
                                          Drop
                                        </button>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}

                        {/* RENDERER 4: ACADEMIC COURSE RECOMMENDATION MATRIX DRAWER */}
                        {msg.structuredData.recommendations && (
                          <div className="space-y-3">
                            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Recommended Actions Mapping</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {msg.structuredData.recommendations.mustRetake && msg.structuredData.recommendations.mustRetake.length > 0 && (
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

                              {msg.structuredData.recommendations.canTake && msg.structuredData.recommendations.canTake.length > 0 && (
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
                                          className="text-[9px] font-bold text-cyan-600 border border-cyan-100 hover:bg-cyan-50 dark:border-slate-800 dark:text-cyan-400 dark:hover:bg-cyan-900 px-2 py-1 rounded-md transition whitespace-nowrap ml-2 disabled:opacity-50"
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

                        {/* RENDERER 5: 多学科混合平铺卡片（当搜索包含多门课程时自动降级激活展示） */}
                        {msg.structuredData.searchResults && msg.structuredData.searchResults.length > 1 && (
                          <div className="w-full space-y-3 animate-fade-in">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {msg.structuredData.searchResults.map((course, idx) => (
                                <div key={idx} className="group relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm hover:border-cyan-500 transition-all">
                                  <div className="flex justify-between items-start mb-3">
                                    <div>
                                      <span className="font-mono text-[9px] font-black bg-cyan-100 dark:bg-cyan-900/40 text-cyan-700 dark:text-cyan-400 px-2 py-0.5 rounded-full">
                                        {course.courseCode}
                                      </span>
                                      <h4 className="text-[12px] font-bold text-slate-800 dark:text-white mt-1.5 leading-tight">
                                        {course.courseName}
                                      </h4>
                                    </div>
                                    <span className="text-[10px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md">
                                      {course.creditHours || 3} CR
                                    </span>
                                  </div>

                                  <div className="space-y-1.5 text-[10px] text-slate-500 dark:text-slate-400 mb-4">
                                    <p className="flex items-center gap-1.5">
                                      <Icon name="userGroup" /> Sec {course.sectionNumber || "01"}
                                    </p>
                                    <p className="flex items-center gap-1.5 font-mono">
                                      <Icon name="calendar" /> {course.timeSlots ? (
                                        course.timeSlots.map(ts => 
                                          `${getDayName(ts.dayOfWeek)} ${formatTime(ts.startTime)}-${formatTime(ts.endTime)}`
                                        ).join(", ")
                                      ) : (
                                        <span className="text-slate-400 italic">Open section offering links</span>
                                      )}
                                    </p>
                                    <p className="flex items-center gap-1.5 font-mono">
                                      <Icon name="structure" /> Venue: {course.venue || "TBA"}
                                    </p>
                                  </div>

                                  <button
                                    onClick={() => handleExecuteEnrollPipeline(course.courseCode, course.sectionNumber || "01")}
                                    className="w-full py-2 bg-slate-900 dark:bg-cyan-600 hover:bg-cyan-700 text-white text-[10px] font-black uppercase tracking-widest rounded-lg transition-all active:scale-[0.95]"
                                  >
                                    Enroll Module {course.courseCode}
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                      </div>
                    )}

                  </div>
                </div>
              );
            })
          )}

          {isProcessing && (
            <div className="flex w-full justify-start animate-pulse">
              <div className="max-w-[75%] rounded-2xl rounded-tl-none p-3.5 text-xs font-bold font-mono tracking-wider bg-slate-50 border border-slate-200 text-slate-400 dark:bg-slate-900/30 dark:border-slate-800">
                AI processing parameters<span className="animate-ping">...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* VIEW AREA B: Input form section */}
        <div className={`p-4 shrink-0 transition-all duration-500 ${isExpanded ? "border-t border-slate-100 dark:border-slate-900" : ""}`}>
          <form onSubmit={handleSendMessage} className="w-full max-w-4xl mx-auto space-y-3 px-4">
            <div className="relative w-full rounded-full border p-1.5 flex items-center transition-all bg-slate-50 border-slate-200 focus-within:border-slate-300 dark:bg-slate-900/60 dark:backdrop-blur dark:border-white/10 dark:focus-within:border-white/20 shadow-sm">
              <input 
                type="text" 
                value={inputQuery}
                disabled={isProcessing}
                onChange={(e) => setInputQuery(e.target.value)}
                placeholder="Search course code, check graduation required credits pathway parameters..."
                className="w-full bg-transparent border-none outline-none py-2 text-xs font-medium pl-1 text-slate-900 placeholder-slate-400 dark:text-white dark:placeholder-slate-500 disabled:opacity-50"
              />
              <div className="flex items-center gap-2 shrink-0 pr-1">
                <button 
                  type="submit" 
                  disabled={isProcessing || !inputQuery.trim()}
                  className="w-7 h-7 rounded-full flex items-center justify-center text-xs bg-blue-600 hover:bg-blue-500 text-white shadow shadow-blue-500/20 transition font-black disabled:bg-slate-200 dark:disabled:bg-slate-800"
                >
                  ➔
                </button>
              </div>
            </div>
          </form>
        </div>

      </div>
    </div>
  );
}

export default function ChatbotPage() {
  return (
    <Suspense fallback={
      <div className="w-full h-full flex items-center justify-center font-mono text-xs text-slate-400 uppercase animate-pulse">
        Streaming system routing modules...
      </div>
    }>
      <ChatbotInnerContent />
    </Suspense>
  );
}