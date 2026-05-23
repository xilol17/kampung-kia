"use client";

import { useState, useEffect } from "react";
import Navbar from "@/components/ui/Navbar"; 

export default function MainAppLayout({ children }: { children: React.ReactNode }) {
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  // ADDED: State to hold logged-in user data dynamically
  const [userProfile, setUserProfile] = useState({
    name: "Guest User",
    studentId: "------"
  });

  // ADDED: Lifecycle hook to pull actual login info on component mount
  useEffect(() => {
    try {
      const storedMetadata = localStorage.getItem("user_metadata");
      if (storedMetadata) {
        const parsed = JSON.parse(storedMetadata);
        
        // Match these keys up with whatever your login page saves into localStorage
        setUserProfile({
          name: parsed.name || parsed.username || "Lee Jia Cheng",
          studentId: parsed.studentId || parsed.id || "CD24069"
        });
      }
    } catch (error) {
      console.error("Failed to parse local user session context:", error);
    }
  }, []);

  const handleLogout = () => {
    document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    localStorage.removeItem("user_metadata");
    window.location.href = "/"; 
  };

  return (
    <div className={`flex w-screen h-screen overflow-hidden transition-colors duration-300 ${isDarkMode ? "dark bg-slate-950 text-white" : "bg-slate-50 text-slate-900"}`}>
      
      {/* UPDATED HERE: Now passing our dynamic state down into the navbar props */}
      <Navbar 
        isDarkMode={isDarkMode} 
        userName={userProfile.name}
        studentId={userProfile.studentId}
        onLogout={handleLogout} 
        onToggleTheme={() => setIsDarkMode(!isDarkMode)} 
      />

      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        <main className="flex-1 h-full overflow-y-auto">
          <div className="h-full w-full" data-theme={isDarkMode ? "dark" : "light"}>
            {children}
          </div>
        </main>
      </div>

    </div>
  );
}