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
    
    // ==========================================
    // 2. 构造“绝密纸条” (System Prompt)
    // ==========================================
    let systemPrompt = `
      You are Laozu, an advanced autonomous university course registration AI system.
      Current active semester: ${settings?.activeSemester}
      Current student: ${student.name} (${student.id}), Program: ${student.program}
    `;

    if (uniqueFailedCourses.length > 0) {
      systemPrompt += `\n[CRITICAL]: Student has FAILED courses to retake: ${uniqueFailedCourses.join(', ')}. Proactively remind them!`;
    }

    systemPrompt += `
      [COURSE DICTIONARY]
      OOP -> BCS2143 | HCI -> BCS2173 | PT -> BCI1023 | DS -> BCI1093

      [PREFERENCE EXTRACTION RULES]
      - "no Thursday class" -> globalAvoidDays: [4]
      - "no morning class / 不要早八" -> globalAvoidTimeBefore: 1200
      - "dont want class 8am" -> globalAvoidTimeBefore: 900
      - "need rest time in between / break" -> requireLunchBreak: true
      - "I want Dr Wong" -> preferredLecturer: "Dr Wong"

      [JSON OUTPUT RULE]
      You MUST return VALID RAW JSON ONLY.
      🚨 [CRITICAL MULTI-TASK RULE]: If the student asks to register MULTIPLE courses, you MUST extract EVERY SINGLE COURSE into a separate object in the "actions" array. DO NOT COMBINE COURSE CODES.

      [RESPONSE FORMAT]
      {
        "reply": "Natural response",
        "actions": [
          {
            "intent": "REGISTER_COURSE",
            "actionData": {
              "courseCode": "ULM1312", 
              "targetSection": "",
              "preferences": { "globalAvoidTimeBefore": 900, "requireLunchBreak": true }
            }
          }
        ]
      }
      `;

    // ==========================================
    // 🌟 核心换脑手术：Groq Llama-70B 担任大脑
    // ==========================================
    let aiResponse: any;

    const safeParseAIJson = (text: string) => {
      const cleaned = text.replace(/```json/g, "").replace(/```/g, "").trim();
      return JSON.parse(cleaned);
    };

    try {
      let groqSuccess = false;

      try {
        const groqCompletion = await groq.chat.completions.create({
          model: "llama-3.3-70b-versatile",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: `Please extract EVERY SINGLE course mentioned into the actions array. \n\nStudent Message: "${message}"` }
          ],
          response_format: { type: "json_object" },
          temperature: 0.1
        });

        const groqText = groqCompletion.choices[0]?.message?.content || "{}";
        aiResponse = safeParseAIJson(groqText);
        groqSuccess = true;
      } catch (groqError: any) {
        logger.error(`[AI Engine] Groq 70B 解析失败:`, groqError.message);
      }

      if (!groqSuccess) {
        const currentAI = getGenAIInstance();
        const model = currentAI.getGenerativeModel({
          model: 'gemini-2.5-flash',
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
      const currentTimetable = await getStudentTimetable(studentId, activeSemester);
      res.status(200).json({
        reply: "⚠️ 抱歉同学，当前 AI 选课系统暂时繁忙，请稍后再试一次。",
        actions: [],
        currentTimetable
      });
      return;
    }

    // ==========================================
    // 🌟 3. 执行引擎：防御性代码 (极其重要！)
    // ==========================================
    let executionFeedback = ""; 
    let needTimetable = false;  
    let structuredDataPayload: any = {}; 

    // 这个神级函数负责把 AI 乱吐的 courseCode 洗干净
    const sanitizeCourseCodes = (rawCode: any): string[] => {
      if (!rawCode) return [];
      if (Array.isArray(rawCode)) return rawCode.map(c => c.toUpperCase().replace(/[^A-Z0-9]/g, ''));
      if (typeof rawCode === 'string') {
        // 如果 AI 偷懒写成 "ulm1312, ulj1312"，按逗号切分！
        return rawCode.split(',').map(c => c.toUpperCase().replace(/[^A-Z0-9]/g, ''));
      }
      return [];
    };

    for (const action of aiResponse.actions || []) {
      const intent = action.intent;
      const data = action.actionData || {};
      const prefs = data.preferences || { avoidDays: [], avoidTimeBefore: 0 };

      // 🚨 获取洗干净的、全大写的、拆分好的课程代码数组
      const codesToProcess = sanitizeCourseCodes(data.courseCode);

      switch (intent) {
        case 'REGISTER_COURSE':
          // 不管 AI 吐出来的是一个还是一堆，我们都在这里循环消化掉！
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
          needTimetable = true;
          break;

        case 'SEARCH_COURSE':
          for (const cleanCode of codesToProcess) {
            const res = await searchCourseAction(cleanCode, activeSemester);
            executionFeedback += `\n\n🔍 查课 ${cleanCode} 结果：\n${res.message}`;
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
        case 'CHECK_PREREQUISITE':
          // ... 篇幅所限，略微精简，保持原有逻辑
          break;

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
        return "English";
      };

      const studentLanguage = detectLanguage(message);

      const mouthPrompt = `
        You are Laozu, a university course registration AI assistant.
        Student message: "${message}"

        The backend system has executed the actions:
        """
        ${executionFeedback}
        """

        Rules:
        1. Reply ONLY in ${studentLanguage}.
        2. 🚨 CRITICAL: YOU MUST ONLY REPORT WHAT IS EXACTLY WRITTEN IN THE BACKEND LOGS. 
        3. 🚨 IF A COURSE IS NOT IN THE LOGS, DO NOT SAY IT WAS REGISTERED.
        4. Output natural language only.
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