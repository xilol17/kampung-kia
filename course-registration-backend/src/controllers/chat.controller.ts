import { Request, Response } from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { prisma } from '../config/prisma';
import { AuthRequest } from '../middlewares/auth.middleware';
import { logger } from '../utils/logger';

//
import { registerCourseAction, dropCourseAction, getStudentTimetable, searchCourseAction, swapCourseAction, recommendPlanAction, checkPrerequisiteAction } from '../services/course.service';
import { checkStudentProgressAction } from '../services/student.service';
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
      当前对话学生：${student.name} (学号: ${student.id}, 专业: ${student.program})。
    `;

    if (failedCourses.length > 0) {
      systemPrompt += `
      [极度重要情报]：该学生上学期挂了以下科目：${failedCourses.join(', ')}。
      你必须在回复中主动提醒他重修，并询问是否需要帮忙安排这学期的重修班级！
      `;
    }

    systemPrompt += `
      [🎓 内部课程字典 (Course Dictionary)]
      这是本校的课程代码映射表。当学生使用缩写或俗称时，你必须将其翻译为【精准的课程代码】，并填入 actionData.courseCode 中。绝对不能把缩写当作 courseCode 输出！
      - OOP / Object Oriented Programming -> BCS2143
      - HCI / Human Computer Interaction -> BCS2173
      - PT / Programming Technique -> BCI1023
      - DS / Data Structure -> BCI1093

      🚨 【极其重要的防幻觉死命令】：
      如果学生提到的课程名称/缩写不在上述字典中，或者学生根本没有提供明确的课程，你【绝对禁止】自行猜测或编造课程代码！
      在这种情况下，你必须将 courseCode 的值设为空字符串 ""，并在 reply 中礼貌地要求学生提供准确的课程全名或代码。
    `;

    // 🌟 新增：强制语言镜像规则 🌟
    systemPrompt += `
      [Language Rule / 语言规则]：
      You MUST detect the language of the student's message (e.g., English, Chinese, Malay).
      Your "reply" MUST be in the EXACT SAME LANGUAGE as the student's message.
      如果你检测到学生输入的是英语，你的高情商回复、重修提醒等所有文本，都必须翻译成流畅的英语。
      如果你检测到马来语，就用马来语回复。不限制语言。且最好不要太无趣，多一点搞笑也是可以的。
    `;

    // 🌟 1. 强化 AI 的输出要求，逼它吐出 actionData
    systemPrompt += `
      [Language Rule / 语言规则]：
      You MUST detect the language of the student's message (e.g., Chinese, English, Malay).
      Your "reply" MUST be in the EXACT SAME LANGUAGE as the student's message.

      [🎯 核心任务 1：全场景意图分类字典 (Intent Enum)]
      你必须精准理解学生的需求，并将意图严格归类为以下 9 种之一：
      
      1. "REGISTER_COURSE" : 选课/加课。要求报名某门具体课程。
      2. "DROP_COURSE"     : 退课/删课。要求退选已报名的课程。
      3. "SWAP_COURSE"     : 换课/调剂。要求把某门课的 A 班换成 B 班，或者拿甲课换乙课。
      4. "VIEW_TIMETABLE"  : 查课表。要求查看自己当前的课表，或询问“我明天有什么课”。
      5. "SEARCH_COURSE"   : 搜课/查资讯。仅查询某门课的开班信息、时间、地点、学分，但不要求立刻报名。
      6. "RECOMMEND_PLAN"  : 智能推荐。不知道该选什么，要求你根据专业、历史成绩推荐选课方案。
      7. "CHAT"            : 日常闲聊/问候。不属于上述教务操作的普通对话。
      8. "CHECK_PROGRESS"  : 毕业进度/学分查询。询问自己拿了多少学分、还差什么课、选修课够不够。
      9. "CHECK_PREREQUISITE": 查先修课。不报名，只是打听某门课的前置要求是什么。

      [🎯 核心任务 2：时间偏好精准翻译 (Time Preference Parser)]
      学生经常会提出各种刁钻的上课时间要求。你必须将他们的自然语言翻译成精确的机器参数：
      - "拜一"到"拜日" / 周一到周日 -> dayOfWeek: 1 到 7
      - "早八" -> startTime: 800, endTime: 1000
      - "早上" / "上午" -> startTime: 800, endTime: 1200
      - "下午" -> startTime: 1200, endTime: 1800
      - "晚上" -> startTime: 1800, endTime: 2200

      [⚠️ 极度严格的输出与免责要求]：
      1. 必须严格返回合法的 JSON 格式。
      2. 对于 REGISTER, DROP, SWAP 操作，你的 reply 绝对不能承诺“操作成功”！必须使用“正在向教务系统提交申请...”或“正在尝试为你匹配...”，因为最终的冲突检测由底层系统决定。

      [JSON 数据结构规范]：
      {
        "intent": "上述 9 种 Intent 之一",
        "reply": "你给学生的高情商回复 (遵守语言规则和免责声明)",
        "actionData": {
          "courseCode": "目标课程代码(如 BCS2143)。 \"\"，绝对不准乱填！如果是退/换多门课，提取主要的。没有则留空字符串",
          "targetSection": "用户是否明确指定了班级(如 01, 02)？如果有则提取，没有则留空",
          
          "preferences": {
            "globalAvoidDays": [
              "整天都不想上课的星期数组。例如不想在星期五和星期四上课，就输出 [4, 5]。没有则输出空数组 []"
            ],
            "globalAvoidTimeBefore": "如果用户要求所有日子都不想早起(如不要早八)，输出他们能接受的最早时间，如 1000。没有则输出 0",
            
            "avoidSpecificBlocks": [
              {
                "description": "这是为了处理『特定天+特定时间』的组合黑名单。例如：不要星期四的早八",
                "dayOfWeek": 4,
                "startTime": 800,
                "endTime": 1000
              }
            ],
            
            "preferredLecturer": "用户明确想要指定的老师名字，如 'Dr. Hong'。没有则为空字符串",
            "avoidLecturer": "用户明确要求避雷的老师名字，如 'Dr. Ali'。没有则为空字符串",
            "maxConsecutiveHours": "用户能忍受的最大连续上课小时数(如连上4小时就受不了了，输出 4)。没提则输出 0",
            "requireLunchBreak": "布尔值。用户是否强烈要求在 1200-1400 之间必须有休息时间吃饭。没提则为 false",
            "preferCompactSchedule": "布尔值。用户是否要求把课尽量集中在同几天上完(追求少来学校)。没提则为 false"
          }
        }
      }
    `;

    const model = genAI.getGenerativeModel({ 
        model: 'gemini-2.5-flash',
        generationConfig: { responseMimeType: "application/json" } 
    });

    const finalPrompt = `${systemPrompt}\n\n学生说：${message}`;
    let result;
    try {
      // 尝试呼叫 Gemini
      result = await model.generateContent({
        contents: [
          { role: 'user', parts: [{ text: systemPrompt }] },
          { role: 'model', parts: [{ text: 'Understood. Waiting for user input.' }] },
          { role: 'user', parts: [{ text: message }] }
        ]
      });
    } catch (apiError: any) {
      // 🚨 拦截 503 等 API 网络错误，绝对不能让后端死掉！
      logger.error(`[AI Engine] Gemini API 崩溃或过载:`, apiError.message);
      
      // 直接伪造一个友好的 JSON 退回给前端，假装无事发生，并附上当前课表
      const activeSemester = settings?.activeSemester || '2526-SEM1';
      const currentTimetable = await getStudentTimetable(studentId, activeSemester);
      
      res.status(200).json({
        intent: "CHAT",
        reply: "⚠️ 抱歉同学，当前选课系统 AI 节点访问人数过多（服务器高负载），请喝口水稍等几秒钟再试一次吧~",
        actionData: {},
        currentTimetable: currentTimetable
      });
      return;
    }
    const responseText = result.response.text();
    
    // 🌟 2. 意图拦截器正式上线！
    const aiResponse = JSON.parse(responseText);
    const preferences = aiResponse.actionData.preferences || { avoidDays: [], avoidTimeBefore: 0 };
    const activeSemester = settings?.activeSemester || '2526-SEM1';

    switch (aiResponse.intent) {
        case 'REGISTER_COURSE':
            if (aiResponse.actionData?.courseCode) {
                const prefs = aiResponse.actionData.preferences || {};
                const actionResult = await registerCourseAction(studentId, aiResponse.actionData.courseCode, activeSemester, prefs);
                
                aiResponse.reply = actionResult.success 
                    ? `${aiResponse.reply} \n\n✅ 执行反馈：${actionResult.message}`
                    : `${aiResponse.reply} \n\n❌ 拦截提示：${actionResult.message}`;

                    if (actionResult.success && actionResult.registeredSection) {
                        // 字典：把数字翻译成星期
                        const dayMap = ['', '周一', '周二', '周三', '周四', '周五', '周六', '周日'];
                        
                        // 遍历这门课所有的上课时间 (因为一门课可能有 Lab 和 Lecture 多个时间)
                        const timeStrings = actionResult.registeredSection.timeSlots.map((ts: any) => {
                        // 把 800 变成 "08:00", 把 1400 变成 "14:00"
                        const startStr = ts.startTime.toString().padStart(4, '0');
                        const endStr = ts.endTime.toString().padStart(4, '0');
                        return `${dayMap[ts.dayOfWeek]} ${startStr.slice(0, 2)}:${startStr.slice(2)} - ${endStr.slice(0, 2)}:${endStr.slice(2)}`;
                    }).join('，'); // 如果有多个时间，用逗号连起来

                    // 狠狠地追加到 reply 字符串的最后！
                    aiResponse.reply += `\n📅 排课详情：Sec ${actionResult.registeredSection.sectionNumber} | 时间：${timeStrings} | 地点：${actionResult.registeredSection.venue}`;
                }
                
            }else {
                aiResponse.reply += `\n\n❌ 系统提示：请告诉我你要退选的具体课程代码（例如 BCS2143）。`;
            }
            break;
        
        case 'DROP_COURSE':
            if (aiResponse.actionData?.courseCode) {
                const actionResult = await dropCourseAction(studentId, aiResponse.actionData.courseCode, activeSemester);
                
                // 把系统的物理执行结果，缝合在 AI 高情商回复的屁股后面
                aiResponse.reply = actionResult.success 
                    ? `${aiResponse.reply} \n\n✅ 执行反馈：${actionResult.message}`
                    : `${aiResponse.reply} \n\n❌ 拦截提示：${actionResult.message}`;
            } else {
                // 防御性编程：万一 AI 没能从用户话语里提取出课程代码
                aiResponse.reply += `\n\n❌ 系统提示：请告诉我你要退选的具体课程代码（例如 BCS2143）。`;
            }
        break;

        case 'SWAP_COURSE':
            if (aiResponse.actionData?.courseCode) {
                const targetSec = aiResponse.actionData.targetSection || "";
                const prefs = aiResponse.actionData.preferences || {};
                
                const swapResult = await swapCourseAction(studentId, aiResponse.actionData.courseCode, activeSemester, targetSec, prefs);
                
                aiResponse.reply = swapResult.success 
                    ? `${aiResponse.reply} \n\n✅ 执行反馈：${swapResult.message}`
                    : `${aiResponse.reply} \n\n❌ 拦截提示：${swapResult.message}`;
            } else {
                aiResponse.reply += `\n\n❌ 系统提示：请告诉我你要调剂的具体课程代码（例如 BCS2143）。`;
            }
        break;
      
        case 'VIEW_TIMETABLE':
            // 调用未来要写的 getTimetableAction，把课表数据塞进给前端的 JSON 里
            break;

        case 'SEARCH_COURSE':
            if (aiResponse.actionData?.courseCode) {
                const searchResult = await searchCourseAction(aiResponse.actionData.courseCode, activeSemester);
                // 把排版好的班级列表硬塞到 AI 聊天的屁股后面
                aiResponse.reply += `\n\n🔍 查课结果：\n${searchResult.message}`;
            } else {
                aiResponse.reply += `\n\n❌ 系统提示：请提供准确的课程代码（例如 BCS2143）以便我为您查询。`;
            }
            break;

        case 'RECOMMEND_PLAN':
            const recommendResult = await recommendPlanAction(studentId, activeSemester);
        
            if (recommendResult.success) {
                // 1. 让 AI 嘴巴闭上，不要再长篇大论，给一句高情商提示即可
                aiResponse.reply += `\n\n✅ 系统已为你生成专属的【智能选课推荐卡片】，请在下方/右侧面板查阅。`;
                
                // 2. 🌟 把极其干净的数组结构，塞进 actionData 里面给前端！
                aiResponse.actionData.recommendations = recommendResult.data;
            }
            break;

        case 'CHAT':
            break;

        case 'CHECK_PROGRESS':
            const progressResult = await checkStudentProgressAction(studentId, activeSemester);
            if (progressResult.success) {
                // 文本给个好消息
                aiResponse.reply += `\n\n✅ 系统已为你生成最新的【毕业学分动态进度看板】，请在右侧/下方直观查阅。`;
                // 结构化数据塞入 actionData 给前端画环形图或进度条
                aiResponse.actionData.progressReport = progressResult.data;
            }
            break;

        case 'CHECK_PREREQUISITE':
            if (aiResponse.actionData?.courseCode) {
                const prereqResult = await checkPrerequisiteAction(aiResponse.actionData.courseCode);
                
                // 🌟 重点改这里：加上 && prereqResult.data
                if (prereqResult.success && prereqResult.data) {
                    // 拼接可读性文本
                    const listStr = prereqResult.data.hasPrerequisites 
                    ? prereqResult.data.prerequisites.map((p: any) => `【${p.prerequisiteName} (${p.prerequisiteCode})】`).join('、')
                    : '该科目属于基础课，无任何前置科目门槛，可直接报考！';
                    
                    aiResponse.reply += `\n\n🔍 先修审查结果：修读科目【${prereqResult.data.courseName}】的前置要求为：${listStr}`;
                    // 结构化数据捎带过去
                    aiResponse.actionData.prerequisiteInfo = prereqResult.data;
                } else {
                    aiResponse.reply += `\n\n❌ 查询提示：${prereqResult.message}`;
                }
            } else {
                aiResponse.reply += `\n\n❌ 系统提示：请提供你要查询的科目代码或缩写（如想打听数据结构，请输入 DS 或者是 BCI1093）。`;
            }
            break;

        default:
            // 什么都不做，纯聊天，直接把 aiResponse 发给前端
            break;
    }
    // 3. 把最终结果发给前端

    let currentTimetable;

    // 🌟 2. 极其优雅的包含判断法 (避免繁琐的 || 符号)
    const timetableIntents = ["REGISTER_COURSE", "SWAP_COURSE", "DROP_COURSE", "VIEW_TIMETABLE"];

    if (timetableIntents.includes(aiResponse.intent)) {
      currentTimetable = await getStudentTimetable(studentId, activeSemester);
    }

    // 🌟 3. 发送给前端
    res.json({ 
        ...aiResponse, 
        ...(currentTimetable && { currentTimetable })
    });

  } catch (error) {
    console.error("AI 脑短路了:", error);
    res.status(500).json({ error: 'AI 暂时无法响应，请稍后再试。' });
  }
};