import { Request, Response } from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { prisma } from '../config/prisma';
import { AuthRequest } from '../middlewares/auth.middleware';

//
import { registerCourseAction } from '../services/course.service';

// initialize Gemini Client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

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

    // 找出挂科记录
    const failedCourses = student.enrollments
      .filter(e => e.status === 'FAILED')
      .map(e => `${e.section.course.courseName} (${e.section.courseCode})`);

    // ==========================================
    // 2. 构造“绝密纸条” (System Prompt)
    // ==========================================
    let systemPrompt = `
      你是一个名叫 Laozu 的大学高级教务 AI 中枢。当前学期是 ${settings?.activeSemester}。
      当前正在和你对话的学生是：${student.name} (学号: ${student.id}, 专业: ${student.program})。
    `;

    if (failedCourses.length > 0) {
      systemPrompt += `
      [极度重要情报]：该学生上学期挂了以下科目：${failedCourses.join(', ')}。
      你必须在回复中主动提醒他重修，并询问是否需要帮你查找这学期的重修班级！
      `;
    }

    // 🌟 新增：强制语言镜像规则 🌟
    systemPrompt += `
      [Language Rule / 语言规则]：
      You MUST detect the language of the student's message (e.g., English, Chinese, Malay).
      Your "reply" MUST be in the EXACT SAME LANGUAGE as the student's message.
      如果你检测到学生输入的是英语，你的高情商回复、重修提醒等所有文本，都必须翻译成流畅的英语。
      如果你检测到马来语，就用马来语回复。
    `;

    // 🌟 1. 强化 AI 的输出要求，逼它吐出 actionData
    systemPrompt += `
      [输出要求]：
      严格返回 JSON 格式。如果学生的意图是想要注册课程，必须在 actionData 中提取出目标科目代码（例如 BCS2143）。
      格式：
      {
        "intent": "CHAT 或者 REGISTER",
        "reply": "你给学生的回复 (遵守语言规则)",
        "actionData": {
          "courseCode": "如果是REGISTER必须填，否则为空"
        }
      }
    `;

    const model = genAI.getGenerativeModel({ 
        model: 'gemini-2.5-flash',
        generationConfig: { responseMimeType: "application/json" } 
    });

    const finalPrompt = `${systemPrompt}\n\n学生说：${message}`;
    const result = await model.generateContent(finalPrompt);
    const responseText = result.response.text();
    
    // 🌟 2. 意图拦截器正式上线！
    const aiResponse = JSON.parse(responseText);

    if (aiResponse.intent === 'REGISTER' && aiResponse.actionData?.courseCode) {
      // AI 下达了注册指令！拦截它，交给我们的算法处理！
      const actionResult = await registerCourseAction(
        studentId, 
        aiResponse.actionData.courseCode, 
        settings?.activeSemester || '2526-SEM1'
      );

      // 把我们系统执行的真实结果，覆盖掉 AI 原本打太极的 reply
      aiResponse.reply = actionResult.success 
        ? `${aiResponse.reply} \n\n✅ 系统执行反馈：${actionResult.message}`
        : `${aiResponse.reply} \n\n❌ 系统拦截提示：${actionResult.message}`;
    }

    // 3. 把最终结果发给前端
    res.json(aiResponse);

  } catch (error) {
    console.error("AI 脑短路了:", error);
    res.status(500).json({ error: 'AI 暂时无法响应，请稍后再试。' });
  }
};