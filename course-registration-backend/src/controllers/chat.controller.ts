import { Request, Response } from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { prisma } from '../config/prisma';
import { AuthRequest } from '../middlewares/auth.middleware';
import { logger } from '../utils/logger';

import { registerCourseAction, dropCourseAction, getStudentTimetable, searchCourseAction, swapCourseAction, recommendPlanAction, checkPrerequisiteAction } from '../services/course.service';
import { checkStudentProgressAction } from '../services/student.service';
import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const API_KEYS = [
  process.env.GEMINI_API_KEY,      
  process.env.GEMINI_KEY_MEMBER2,  
  process.env.GEMINI_KEY_MEMBER3   
].filter(Boolean) as string[];     

let keyIndex = 0;

const getGenAIInstance = () => {
  if (API_KEYS.length === 0) {
    throw new Error("没有配置任何 Gemini API Key！");
  }
  const currentKey = API_KEYS[keyIndex % API_KEYS.length];
  keyIndex++;
  return new GoogleGenerativeAI(currentKey);
};

export const handleChat = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { message } = req.body; 
    const studentId = req.user.userId;
    
    // ==========================================
    // 1. 搜集情报 (查库)
    // ==========================================
    const settings = await prisma.systemSetting.findFirst();
    const student = await prisma.user.findUnique({
      where: { id: studentId },
      include: { enrollments: { include: { section: { include: { course: true } } } } }
    });

    if (!student) {
      res.status(404).json({ error: 'Student not found' });
      return;
    }
    const activeSemester = settings?.activeSemester || '2526-SEM1';

    const passedCodes = new Set(student.enrollments.filter(e => e.status === 'PASSED').map(e => e.section.courseCode));
    const currentCodes = new Set(student.enrollments.filter(e => e.semester === activeSemester && ['PENDING_PA', 'APPROVED'].includes(e.status)).map(e => e.section.courseCode));

    const activeFailedCourses = student.enrollments
      .filter(e => e.status === 'FAILED')
      .filter(e => !passedCodes.has(e.section.courseCode) && !currentCodes.has(e.section.courseCode))
      .map(e => `${e.section.course.courseName} (${e.section.courseCode})`);

    const uniqueFailedCourses = [...new Set(activeFailedCourses)];
    
    // 🌟 修复 2：提取当前课表代码，喂给 AI，防止它幻觉说你没课！
    const currentCodesArray = Array.from(currentCodes);
    const currentCodesStr = currentCodesArray.length > 0 ? currentCodesArray.join(', ') : 'No courses registered yet';
    
    // ==========================================
    // 2. 构造“绝密纸条” (System Prompt)
    // ==========================================
    let systemPrompt = `
      You are Laozu, an advanced autonomous university course registration AI system.

      Current active semester: ${settings?.activeSemester}

      Current student:
      - Name: ${student.name}
      - Student ID: ${student.id}
      - Program: ${student.program}
      - Currently Enrolled Courses: ${currentCodesStr}

      Your role is NOT just to chat. You are an AI academic assistant capable of automatically registering courses, dropping courses, swapping sections, generating study plans, checking prerequisites, checking graduation progress, and searching available courses.
    `;

    if (uniqueFailedCourses.length > 0) {
      systemPrompt += `
      ==================================================
      [CRITICAL FAILED COURSE INFORMATION]
      ==================================================
        This student currently has FAILED courses that require retake:
        ${uniqueFailedCourses.join(', ')}

        You MUST proactively remind the student about retaking these courses whenever relevant.
      `;
    }

    systemPrompt += `
      ==================================================
      [COURSE DICTIONARY]
      ==================================================
      Translate course nicknames or abbreviations into official course codes.
      - OOP / Object Oriented Programming -> BCS2143
      - HCI / Human Computer Interaction -> BCS2173
      - PT / Programming Technique -> BCI1023
      - DS / Data Structure -> BCI1093

      ==================================================
      [ANTI-HALLUCINATION RULE]
      ==================================================
      If the course mentioned by the student does not exist, is unclear, ambiguous, or incomplete:
      - set courseCode to ""
      - NEVER invent fake course codes
      - NEVER guess

      ==================================================
      [SUPPORTED INTENTS & MAPPING]
      ==================================================
      Map student natural language to the correct intent:
      - "register/add/sign up" -> REGISTER_COURSE
      - "drop/remove/cancel" -> DROP_COURSE
      - "swap/switch/change section" -> SWAP_COURSE
      - "search/find/query course" -> SEARCH_COURSE
      - "recommend/recommendation/give me a plan" -> RECOMMEND_PLAN
      - "check credit/progress/graduation" -> CHECK_PROGRESS
      - "timetable/schedule/my classes" -> VIEW_TIMETABLE
      - "prerequisite/check pre-req" -> CHECK_PREREQUISITE\

      ==================================================
      [SECTION FORMATTING RULE]
      ==================================================
      If the student specifies a target section number (e.g., "section 1", "sec 2"), you MUST explicitly zero-pad it to a 2-digit string in the JSON output.
      
      Examples:
      - "section 1" -> "01"
      - "sec 2" -> "02"
      - "section 12" -> "12"

      ==================================================
      [PREFERENCE EXTRACTION RULES]
      ==================================================
      Translate natural language into preference object:
      - "no Thursday class" -> globalAvoidDays: [4]
      - "no morning class / 不要早八" -> globalAvoidTimeBefore: 900
      - "no 8am class" -> globalAvoidTimeBefore: 900
      - "dont want class 8 am" -> globalAvoidTimeBefore: 900
      - "不要早十" -> globalAvoidTimeBefore: 1100
      - "need lunch break" -> requireLunchBreak: true
      - "I want Dr Wong" -> preferredLecturer: "Dr Wong"

      [CONVERSATION GUIDELINES]
      1. If the student asks to drop or swap, and they haven't specified the course:
         - Acknowledge the request.
         - Show the list of their currently enrolled courses (from the context I gave you).
         - Ask them to pick one from the list.
         - Do NOT make them guess.

      ==================================================
      [JSON OUTPUT RULE]
      ==================================================
      You MUST return VALID RAW JSON ONLY.

      🚨 [CRITICAL MULTI-TASK RULE]: 
      If the student asks to register/drop/swap MULTIPLE courses (e.g., 6 courses), you MUST extract EVERY SINGLE COURSE into its own separate object inside the "actions" array.
      DO NOT COMBINE THEM. DO NOT JUST OUTPUT ONE. Extract ALL of them.

      [RESPONSE FORMAT EXAMPLE]
      {
        "reply": "Natural response to the student",
        "actions": [
          {
            "intent": "REGISTER_COURSE",
            "actionData": {
              "courseCode": "BCS2143",
              "targetSection": "",
              "preferences": { "globalAvoidTimeBefore": 900 }
            }
          },
          {
            "intent": "RECOMMEND_PLAN",
            "actionData": {}
          },
          {
            "intent": "VIEW_TIMETABLE",
            "actionData": {}
          }
        ]
      }
      `;

    // ==========================================
    // 🌟 核心换脑手术：Groq Llama-70B 担任最高智商大脑！
    // ==========================================
    let aiResponse: any;

    const safeParseAIJson = (text: string) => {
      const cleaned = text.replace(/```json/g, "").replace(/```/g, "").trim();
      return JSON.parse(cleaned);
    };

    try {
      let groqSuccess = false;

      // 1. 首发主力：Groq 70B 
      try {
        const groqCompletion = await groq.chat.completions.create({
          model: "llama-3.3-70b-versatile",
          messages: [
            { role: "system", content: systemPrompt },
            // 🌟 修复：解除只提取 course 的魔咒，允许全局意图！
            { role: "user", content: `Generate JSON response. If asking for recommendations or timetable, use corresponding intent with empty actionData. If registering/dropping, extract ALL courses mentioned into actions array. \n\nStudent Message: "${message}"` }
          ],
          response_format: { type: "json_object" },
          temperature: 0.1
        });

        const groqText = groqCompletion.choices[0]?.message?.content || "{}";
        aiResponse = safeParseAIJson(groqText);
        groqSuccess = true;
        logger.info(`[AI Engine] Groq 70B 大脑成功解析意图！`);

      } catch (groqError: any) {
        logger.error(`[AI Engine] Groq 70B 解析失败:`, groqError.message);
      }

      // 2. 替补队员：Gemini Lite 
      if (!groqSuccess) {
        logger.warn("[AI Engine] 切换至 Gemini 备用大脑...");
        const currentAI = getGenAIInstance();
        const model = currentAI.getGenerativeModel({
          model: 'gemini-3.1-flash-lite',
          generationConfig: { responseMimeType: "application/json" }
        });

        const result = await model.generateContent({
          contents: [
            { role: 'user', parts: [{ text: systemPrompt }] },
            { role: 'user', parts: [{ text: message }] }
          ]
        });
        aiResponse = safeParseAIJson(result.response.text());
      }

    } catch (allAIError: any) {
      logger.error(`[AI Engine] 所有 AI 引擎全部崩溃:`, allAIError.message);
      const currentTimetable = await getStudentTimetable(studentId, activeSemester);
      res.status(200).json({
        reply: "⚠️ 抱歉同学，当前 AI 选课系统暂时繁忙，请稍后再试一次。",
        actions: [],
        currentTimetable
      });
      return;
    }

    // ==========================================
    // 🌟 3. 执行引擎：防御与流水线处理
    // ==========================================
    let executionFeedback = ""; 
    let needTimetable = false;  
    let structuredDataPayload: any = {}; 

    const lowerMessage = message.toLowerCase();

    if (
      aiResponse.actions.length === 0 &&
      (
        lowerMessage.includes("drop course") ||
        lowerMessage.includes("drop a course") ||
        lowerMessage.includes("remove course") ||
        lowerMessage.includes("cancel course")
      )
    ) {
      needTimetable = true;
    }

    // 🌟 重新引回神级清洗函数，防止小写和数组崩溃！
    const sanitizeCourseCodes = (rawCode: any): string[] => {
      if (!rawCode) return [];
      if (Array.isArray(rawCode)) return rawCode.map(c => c.toUpperCase().replace(/[^A-Z0-9]/g, ''));
      if (typeof rawCode === 'string') {
        return rawCode.split(',').map(c => c.toUpperCase().replace(/[^A-Z0-9]/g, ''));
      }
      return [];
    };

    for (const action of aiResponse.actions || []) {
      const intent = action.intent;
      const data = action.actionData || {};
      const prefs = data.preferences || { avoidDays: [], avoidTimeBefore: 0 };
      const codesToProcess = sanitizeCourseCodes(data.courseCode);

      switch (intent) {
        case 'REGISTER_COURSE':
          for (const cleanCode of codesToProcess) {
            const res = await registerCourseAction(studentId, cleanCode, activeSemester, prefs);
            executionFeedback += `\n▶️ [选课 ${cleanCode}]: ${res.message}`;
            if (res.success && res.registeredSection) {
               executionFeedback += ` (分配至 Sec ${res.registeredSection.sectionNumber})`;
            }
            needTimetable = true;
          }
          break;
        
        case 'DROP_COURSE':
          for (const cleanCode of codesToProcess) {
            const res = await dropCourseAction(studentId, cleanCode, activeSemester);
            executionFeedback += `\n▶️ [退课 ${cleanCode}]: ${res.message}`;
            needTimetable = true;
          }
          break;

        case 'SWAP_COURSE':
          for (const cleanCode of codesToProcess) {
            const res = await swapCourseAction(studentId, cleanCode, activeSemester, data.targetSection || "", prefs);
            executionFeedback += `\n▶️ [换课 ${cleanCode}]: ${res.message}`;
            needTimetable = true;
          }
          break;

        case 'VIEW_TIMETABLE':
          executionFeedback += `\n✅ 已成功提取当前课表数据，准备在前端展示。`; // 🌟 修复 2：写入日志，激活嘴巴！
          needTimetable = true;
          break;

        case 'SEARCH_COURSE':
          for (const cleanCode of codesToProcess) {
            const res = await searchCourseAction(cleanCode, activeSemester);
            executionFeedback += `\n\n🔍 查课 ${cleanCode} 结果：\n${res.message}`;
            structuredDataPayload.searchResults = res.data;

            if (res.success && res.data) {
              structuredDataPayload.searchResults = res.data;
            }
          }
          break;

        case 'RECOMMEND_PLAN':
          const recRes = await recommendPlanAction(studentId, activeSemester);
          if (recRes.success) {
            executionFeedback += `\n✅ 已生成【智能选课推荐卡片】。`;
            structuredDataPayload.recommendations = recRes.data;
          }
          break;

        case 'CHECK_PROGRESS':
          const progRes = await checkStudentProgressAction(studentId, activeSemester);
          if (progRes.success) {
            executionFeedback += `\n✅ 已生成【毕业学分动态进度看板】。`;
            structuredDataPayload.progressReport = progRes.data;
          }
          break;

        case 'CHECK_PREREQUISITE':
          for (const cleanCode of codesToProcess) {
            const preRes = await checkPrerequisiteAction(cleanCode);
            if (preRes.success && preRes.data) {
              const listStr = preRes.data.hasPrerequisites 
                ? preRes.data.prerequisites.map((p: any) => `【${p.prerequisiteName} (${p.prerequisiteCode})】`).join('、')
                : '无前置科目门槛。';
              executionFeedback += `\n🔍 【${preRes.data.courseName}】的先修要求：${listStr}`;
              structuredDataPayload.prerequisiteInfo = preRes.data;
            } else {
              executionFeedback += `\n❌ 查询提示：${preRes.message}`;
            }
          }
          break;

        case 'CHAT':
        default:
          break;
      }
    }

    // ==========================================
    // 🌟 4. 二次反刍：Gemini Lite 担任“嘴巴”
    // ==========================================
    let finalNaturalReply = aiResponse.reply;

    if (executionFeedback) {
      const detectLanguage = (text: string) => {
        if (/[\u4e00-\u9fff]/.test(text)) return "Chinese";
        if (/[\u0E00-\u0E7F]/.test(text)) return "Thai";
        if (/[\u0600-\u06FF]/.test(text)) return "Arabic";
        return "English";
      };

      const studentLanguage = detectLanguage(message);

      const mouthPrompt = `
        You are Laozu, a university course registration AI assistant.
        Student message: "${message}"
        Detected student language: ${studentLanguage}

        The backend system has executed the following actions:
        """
        ${executionFeedback}
        """

        Rules:
        1. You MUST reply ONLY in ${studentLanguage}.
        2. Ignore the language used inside backend logs.
        3. Do not use Chinese unless the student's message is Chinese.
        4. Be friendly, clear, and professional.
        5. 🚨 CRITICAL ANTI-HALLUCINATION RULE: YOU MUST ONLY REPORT WHAT IS EXACTLY WRITTEN IN THE BACKEND LOGS. 
        6. 🚨 IF A COURSE IS NOT MENTIONED IN THE LOGS, DO NOT SAY YOU REGISTERED IT. Do not invent course codes.
        7. Output normal natural language only. Do not output JSON.
      `;

      try {
        await delay(1000); 
        const currentAI = getGenAIInstance();
        const mouthModel = currentAI.getGenerativeModel({
          model: 'gemini-3.1-flash-lite', 
        });
        
        const pass2Result = await mouthModel.generateContent({
          contents: [{ role: 'user', parts: [{ text: mouthPrompt }] }]
        });
        finalNaturalReply = pass2Result.response.text();

      } catch (pass2Error) {
        logger.error("[AI Mouth] 二次润色失败，回退到原始缝合文本", pass2Error);
        finalNaturalReply = `${aiResponse.reply}\n\n⚙️ 统筹执行反馈：${executionFeedback}`;
      }
    }

    let currentTimetable;
    if (needTimetable) {
      currentTimetable = await getStudentTimetable(studentId, activeSemester);
    }

    res.json({ 
        reply: finalNaturalReply, 
        actions: aiResponse.actions,
        ...structuredDataPayload,
        ...(currentTimetable && { currentTimetable })
    });

  } catch (error) {
    logger.error("AI 脑短路了:", error);
    res.status(500).json({ error: 'AI 暂时无法响应，请稍后再试。' });
  }
};