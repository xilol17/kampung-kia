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
  process.env.GEMINI_API_KEY,      // 你的 Key
  process.env.GEMINI_KEY_MEMBER2,  // 队友 A 的 Key
  process.env.GEMINI_KEY_MEMBER3   // 队友 B 的 Key
].filter(Boolean) as string[];     // 自动过滤掉没填的空值

let keyIndex = 0;

const getGenAIInstance = () => {
  if (API_KEYS.length === 0) {
    throw new Error("没有配置任何 Gemini API Key！");
  }
  // 每次调用，指针往前走一步，实现平摊压力
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

    // 1. 查出这辈子已经及格的课
    const passedCodes = new Set(student.enrollments.filter(e => e.status === 'PASSED').map(e => e.section.courseCode));
    
    // 2. 查出这学期已经成功选上的课 (包括正在等 PA 批的)
    const currentCodes = new Set(student.enrollments.filter(e => e.semester === activeSemester && ['PENDING_PA', 'APPROVED'].includes(e.status)).map(e => e.section.courseCode));

    // 3. 核心过滤：是挂科的，且后来没及格，且这学期还没选的！
    const activeFailedCourses = student.enrollments
      .filter(e => e.status === 'FAILED')
      .filter(e => !passedCodes.has(e.section.courseCode) && !currentCodes.has(e.section.courseCode))
      .map(e => `${e.section.course.courseName} (${e.section.courseCode})`);

    // 4. 去重：防止学生同一门课连续挂两次，导致名字重复出现
    const uniqueFailedCourses = [...new Set(activeFailedCourses)];
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

      Your role is NOT just to chat.
      You are an AI academic assistant capable of:
      - automatically registering courses
      - dropping courses
      - swapping sections
      - generating study plans
      - checking prerequisites
      - checking graduation progress
      - searching available courses
      - optimizing timetable arrangements

      ==================================================
      [CRITICAL FAILED COURSE INFORMATION]
      ==================================================
    `;

    if (uniqueFailedCourses.length > 0) {
      systemPrompt += `
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

      If the course mentioned by the student:
      - does not exist in the dictionary
      - is unclear
      - ambiguous
      - incomplete
      - or uncertain

      Then you MUST:
      - set courseCode to ""
      - NEVER invent fake course codes
      - NEVER guess

      ==================================================
      [LANGUAGE RULE]
      ==================================================

      1. Detect the student's language automatically.
      2. Your reply MUST be in the EXACT SAME LANGUAGE as the student.
      3. Ignore system language or backend log language.
      4. If the student speaks English, reply ONLY in English.
      5. If the student speaks Chinese, reply ONLY in Chinese.
      6. If the student speaks Malay, reply ONLY in Malay.
      7. Natural casual tone is allowed.
      8. Small humor is allowed.
      9. If the student reply in "rojak" means mix language, reply in mix language

      ==================================================
      [SUPPORTED INTENTS]
      ==================================================

      You support these intents:

      - REGISTER_COURSE
      - DROP_COURSE
      - SWAP_COURSE
      - VIEW_TIMETABLE
      - SEARCH_COURSE
      - RECOMMEND_PLAN
      - CHAT
      - CHECK_PROGRESS
      - CHECK_PREREQUISITE

      ==================================================
      [PREFERENCE EXTRACTION RULES]
      ==================================================

      You MUST intelligently extract timetable preferences from natural language.

      ------------------------------------------
      1. Avoid specific days
      ------------------------------------------

      Convert days into numbers:

      Monday = 1
      Tuesday = 2
      Wednesday = 3
      Thursday = 4
      Friday = 5
      Saturday = 6
      Sunday = 7

      Examples:

      "Don't want Thursday class"
      -> globalAvoidDays: [4]

      "不要星期五上课"
      -> globalAvoidDays: [5]

      ------------------------------------------
      2. Avoid morning classes
      ------------------------------------------

      Examples:

      "no 8am class"
      -> globalAvoidTimeBefore: 900

      "不要早八"
      -> globalAvoidTimeBefore: 900

      "不要早十"
      -> globalAvoidTimeBefore: 1100

      "no morning class"
      -> globalAvoidTimeBefore: 1200

      ------------------------------------------
      3. Avoid afternoon classes
      ------------------------------------------

      Examples:

      "不要下午课"
      -> globalAvoidTimeAfter: 1200

      "no afternoon class"
      -> globalAvoidTimeAfter: 1200

      ------------------------------------------
      4. Require lunch break
      ------------------------------------------

      Examples:

      "I want lunch break"
      "下午想吃饭"
      "need break during lunch"

      -> requireLunchBreak: true
      -> lunchStart: 1200
      -> lunchEnd: 1400

      ------------------------------------------
      5. Avoid lecturer
      ------------------------------------------

      Examples:

      "不要 Dr Tan"
      -> avoidLecturer: "Dr Tan"

      "don't want lecturer Ali"
      -> avoidLecturer: "Ali"

      ------------------------------------------
      6. Preferred lecturer
      ------------------------------------------

      Examples:

      "I want Dr Wong"
      -> preferredLecturer: "Dr Wong"

      ------------------------------------------
      7. Compact timetable
      ------------------------------------------

      Examples:

      "I want compact schedule"
      "尽量排在一起"

      -> preferCompactSchedule: true

      ------------------------------------------
      8. Specific blocked times
      ------------------------------------------

      Examples:

      "I cannot attend Wednesday 2pm-4pm"

      -> avoidSpecificBlocks:
      [
        {
          "dayOfWeek": 3,
          "startTime": 1400,
          "endTime": 1600
        }
      ]

      ==================================================
      [COURSE REGISTRATION BEHAVIOR]
      ==================================================

      When registering courses:

      1. Automatically search for ALL available sections.
      2. Automatically avoid timetable clashes.
      3. Automatically avoid FULL sections.
      4. Automatically switch to another section if needed.
      5. Prioritize sections matching student preferences.
      6. If no valid section exists:
        - explain the reason clearly
        - do not invent fake successful registrations

      ==================================================
      [JSON OUTPUT RULE]
      ==================================================

      You MUST return VALID RAW JSON ONLY.

      DO NOT:
      - use markdown
      - use \`\`\`
      - explain anything outside JSON

      ==================================================
      [RESPONSE FORMAT]
      ==================================================

      {
        "reply": "Natural response to the student",
        "actions": [
          {
            "intent": "REGISTER_COURSE",
            "actionData": {
              "courseCode": "BCS2143",
              "targetSection": "",
              "preferences": {
                "globalAvoidDays": [],
                "globalAvoidTimeBefore": 0,
                "globalAvoidTimeAfter": 0,
                "avoidSpecificBlocks": [],
                "preferredLecturer": "",
                "avoidLecturer": "",
                "requireLunchBreak": false,
                "lunchStart": 1200,
                "lunchEnd": 1400,
                "preferCompactSchedule": false
              }
            }
          }
        ]
      }
      `;

    // ==========================================
// 🌟 Gemini + Groq 双 AI 容灾引擎
// ==========================================

let aiResponse: any;

const safeParseAIJson = (text: string) => {
  const cleaned = text
    .replace(/```json/g, "")
    .replace(/```/g, "")
    .trim();

  return JSON.parse(cleaned);
};

try {

  // ==========================================
  // 1. Gemini 主引擎 (自动重试)
  // ==========================================

  let geminiSuccess = false;

  for (let attempt = 1; attempt <= 2; attempt++) {

    try {

      const currentAI = getGenAIInstance();

      const model = currentAI.getGenerativeModel({
        model: 'gemini-2.5-flash',
        generationConfig: {
          responseMimeType: "application/json"
        }
      });

      const result = await model.generateContent({
        contents: [
          { role: 'user', parts: [{ text: systemPrompt }] },
          { role: 'model', parts: [{ text: 'Understood. Waiting for user input.' }] },
          { role: 'user', parts: [{ text: message }] }
        ]
      });

      const responseText = result.response.text();

      aiResponse = safeParseAIJson(responseText);

      geminiSuccess = true;

      logger.info(`[AI Engine] Gemini 成功响应 (Attempt ${attempt})`);

      break;

    } catch (geminiError: any) {

      logger.error(
        `[AI Engine] Gemini Attempt ${attempt} 失败:`,
        geminiError.message
      );

      await delay(1000 * attempt);
    }
  }

  // ==========================================
  // 2. Gemini 全挂 → Groq 接管
  // ==========================================

  if (!geminiSuccess) {

    logger.warn("[AI Engine] Gemini 全部失败，切换到 Groq Backup");

    const groqCompletion = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",

      messages: [
        {
          role: "system",
          content: `
            You are a university course registration AI.

            You MUST return VALID JSON ONLY.

            DO NOT return markdown.
            DO NOT return explanation.
            DO NOT wrap with \`\`\`.

            Return this format:
            {
              "reply": "message",
              "actions": []
            }
          `
            },
            {
              role: "user",
              content: `
                ${systemPrompt}

                学生输入：
                ${message}
              `
            }
          ],

          temperature: 0.2
        });

        const groqText =
          groqCompletion.choices[0]?.message?.content || "{}";

        aiResponse = safeParseAIJson(groqText);

        logger.info("[AI Engine] Groq Backup 成功接管");
      }

    } catch (allAIError: any) {

      logger.error(
        `[AI Engine] 所有 AI 引擎全部崩溃:`,
        allAIError.message
      );

      const currentTimetable = await getStudentTimetable(
        studentId,
        activeSemester
      );

      res.status(200).json({
        reply:
          "⚠️ 抱歉同学，当前 AI 选课系统暂时繁忙，请稍后再试一次。",
        actions: [],
        currentTimetable
      });

      return;
    }

    // ==========================================
    // 🌟 3. 终极多核意图引擎 (处理 actions 数组)
    // ==========================================
    let executionFeedback = ""; // 收集底层执行结果
    let needTimetable = false;  // 是否需要刷新课表
    let structuredDataPayload: any = {}; // 用来收集进度表、推荐表等额外数据

    // 遍历执行 AI 分解出的所有动作
    for (const action of aiResponse.actions || []) {
      const intent = action.intent;
      const data = action.actionData || {};
      const prefs = data.preferences || { avoidDays: [], avoidTimeBefore: 0 };

      switch (intent) {
        case 'REGISTER_COURSE':
          if (data.courseCode) {
            const res = await registerCourseAction(studentId, data.courseCode, activeSemester, prefs);
            executionFeedback += `\n▶️ [选课 ${data.courseCode}]: ${res.message}`;
            if (res.success && res.registeredSection) {
               executionFeedback += ` (分配至 Sec ${res.registeredSection.sectionNumber})`;
            }
            needTimetable = true;
          }
          break;
        
        case 'DROP_COURSE':
          if (data.courseCode) {
            const res = await dropCourseAction(studentId, data.courseCode, activeSemester);
            executionFeedback += `\n▶️ [退课 ${data.courseCode}]: ${res.message}`;
            needTimetable = true;
          }
          break;

        case 'SWAP_COURSE':
          if (data.courseCode) {
            const res = await swapCourseAction(studentId, data.courseCode, activeSemester, data.targetSection || "", prefs);
            executionFeedback += `\n▶️ [换课 ${data.courseCode}]: ${res.message}`;
            needTimetable = true;
          }
          break;

        case 'VIEW_TIMETABLE':
          needTimetable = true;
          break;

        case 'SEARCH_COURSE':
          if (data.courseCode) {
            const res = await searchCourseAction(data.courseCode, activeSemester);
            executionFeedback += `\n\n🔍 查课结果：\n${res.message}`;
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
          if (data.courseCode) {
            const preRes = await checkPrerequisiteAction(data.courseCode);
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
    // 🌟 4. 组装并发送最终 JSON
    // ==========================================
    // 把底层反馈缝合到 AI 的贴心回复后面
    let finalNaturalReply = aiResponse.reply;

    // 🌟 终极进化：二次反刍引擎 (Second-Pass Generation)
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

        Student message:
        "${message}"

        Detected student language:
        ${studentLanguage}

        The backend system has executed the following actions:
        """
        ${executionFeedback}
        """

        Rules:
        1. You MUST reply ONLY in ${studentLanguage}.
        2. Ignore the language used inside backend logs.
        3. Do not use Chinese unless the student's message is Chinese.
        4. Be friendly, clear, and professional.
        5. If there are credit warnings, explain them clearly.
        6. Output normal natural language only. Do not output JSON.
      `;

      try {
        const chatCompletion = await groq.chat.completions.create({
            messages: [{ role: "user", content: mouthPrompt }],
            model: "llama-3.1-8b-instant", // 完全免费且极度聪明的开源大模型
        });
        finalNaturalReply = chatCompletion.choices[0]?.message?.content || finalNaturalReply;
      } catch (pass2Error) {
        logger.error("[AI Mouth] 二次润色失败，回退到原始缝合文本", pass2Error);
        // 如果第二次呼叫失败，为了保命，还是用之前的缝合方案
        finalNaturalReply = `${aiResponse.reply}\n\n⚙️ 统筹执行反馈：${executionFeedback}`;
      }
    }

    // 🌟 统一拉取一次最新课表 (如果这批动作里有增删改查)
    let currentTimetable;
    if (needTimetable) {
      currentTimetable = await getStudentTimetable(studentId, activeSemester);
    }

    // 🌟 终极发送给前端
    res.json({ 
        reply: finalNaturalReply, // 现在的回复，是完全经过 AI 二次润色、百分百贴合语境的神级文本！
        actions: aiResponse.actions,
        ...structuredDataPayload,
        ...(currentTimetable && { currentTimetable })
    });

  } catch (error) {
    logger.error("AI 脑短路了:", error);
    res.status(500).json({ error: 'AI 暂时无法响应，请稍后再试。' });
  }
};

async function generateAIResponse(systemPrompt: string, message: string) {
  const userPrompt = `
${systemPrompt}

学生输入：
"${message}"

请只输出 JSON，不要 markdown，不要解释。
`;

  // 1. Try Gemini with retry
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const currentAI = getGenAIInstance();

      const model = currentAI.getGenerativeModel({
        model: 'gemini-2.5-flash',
        generationConfig: { responseMimeType: "application/json" }
      });

      const result = await model.generateContent({
        contents: [
          { role: 'user', parts: [{ text: systemPrompt }] },
          { role: 'model', parts: [{ text: 'Understood. Waiting for user input.' }] },
          { role: 'user', parts: [{ text: message }] }
        ]
      });

      return JSON.parse(result.response.text());

    } catch (error: any) {
      logger.error(`[Gemini Attempt ${attempt}] failed: ${error.message}`);
      await delay(800 * attempt);
    }
  }

  // 2. Fallback to Groq
  try {
    const completion = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [
        {
          role: "system",
          content: "You are an intent extraction engine. Return valid JSON only. No markdown."
        },
        {
          role: "user",
          content: userPrompt
        }
      ],
      temperature: 0.2,
    });

    const text = completion.choices[0]?.message?.content || "{}";
    return JSON.parse(text);

  } catch (error: any) {
    logger.error(`[AI Fallback] Groq also failed: ${error.message}`);
    throw new Error("All AI providers failed");
  }
}