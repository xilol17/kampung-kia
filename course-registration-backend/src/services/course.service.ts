import { prisma } from '../config/prisma';
import { logger } from '../utils/logger';

export const registerCourseAction = async (userId: string, courseCode: string, semester: string, rawPreferences: any = {}) => {
  logger.info(`[Action] Student ${userId} attempting to register for ${courseCode} in ${semester}`);

  // 🌟 0. 安全解构偏好设置 (防止 AI 漏传字段导致报错)
  const prefs = {
    globalAvoidDays: [], globalAvoidTimeBefore: 0, avoidSpecificBlocks: [],
    preferredLecturer: '', avoidLecturer: '', 
    requireLunchBreak: false, preferCompactSchedule: false,
    ...rawPreferences
  };

  const existingEnrollment = await prisma.enrollment.findFirst({
    where: {
      userId: userId,
      semester: semester,
      section: { courseCode: courseCode }, // 关联查这门课的代码
      status: { in: ['PENDING_PA', 'APPROVED'] } // 只要是待审批或已通过的，都不准再选！
    },
    include: { section: true }
  });

  if (existingEnrollment) {
    logger.warn(`[Action] Blocked! Student ${userId} is already enrolled in ${courseCode} (Sec ${existingEnrollment.section.sectionNumber}).`);
    return {
      success: false,
      message: `🚫 选课失败：你已经报名了这门课的 Sec ${existingEnrollment.section.sectionNumber}！请勿重复选课。如果想换班级，请先退课或使用换课功能。`
    };
  }

  const targetCourse = await prisma.course.findUnique({ where: { courseCode: courseCode } });
  const newCourseCredit = targetCourse?.creditHours || 3; 

  // 2. 查出学生这学期已经选了多少课
  const currentEnrollments = await prisma.enrollment.findMany({
    where: { userId: userId, semester: semester, status: { in: ['PENDING_PA', 'APPROVED'] } },
    include: { section: { include: { course: true, timeSlots: true } } }
  });
  
  // 3. 极其优雅地把现有总学分加起来
  const currentTotalCredits = currentEnrollments.reduce((sum, e) => sum + (e.section.course.creditHours || 3), 0);

  // 4. 判死刑：如果现有学分 + 新课学分 > 19，直接踢回去！
  if (currentTotalCredits + newCourseCredit > 19) {
    logger.warn(`[Action] Blocked! Student ${userId} exceeded 19 credit limit.`);
    return {
      success: false,
      message: `🚫 选课拦截：UMPSA 规定每学期最高上限为 19 学分。你当前已选 ${currentTotalCredits} 学分，加上这门课（${newCourseCredit} 学分）将达到 ${currentTotalCredits + newCourseCredit} 学分，超出系统限制！请先退选其他科目。`
    };
  }

  // ==========================================
  // 🛡️ 第一关：前置科目 (Prerequisites) 绝对防御系统
  // ==========================================
  const prerequisites = await prisma.prerequisite.findMany({
    where: { courseCode: courseCode },
    include: { prerequisiteCourse: true }
  });

  if (prerequisites.length > 0) {
    const passedRecords = await prisma.enrollment.findMany({
      where: { userId: userId, status: 'PASSED' },
      select: { section: { select: { courseCode: true } } }
    });
    const passedCourseCodes = passedRecords.map(r => r.section.courseCode);

    for (const pre of prerequisites) {
      if (!passedCourseCodes.includes(pre.prerequisiteCode)) {
        logger.warn(`[Action] Blocked! Student ${userId} failed prerequisite ${pre.prerequisiteCode} for ${courseCode}.`);
        return { 
          success: false, 
          message: `🚫 选课失败：你必须先及格前置科目【${pre.prerequisiteCourse.courseName} (${pre.prerequisiteCode})】才能选修这门课！` 
        };
      }
    }
  }

  // ==========================================
  // ⏰ 第二关：提取已有课表与备选班级
  // ==========================================
  
  const occupiedSlots = currentEnrollments.flatMap(e => e.section.timeSlots);
  const existingDays = new Set(occupiedSlots.map(s => s.dayOfWeek)); // 记录学生哪几天已经有课了

  // ⚠️ 注意：这里必须 include lecturer，否则没法判断避雷老师！
  const availableSections = await prisma.section.findMany({
    where: { courseCode: courseCode, semester: semester },
    include: { timeSlots: true, lecturer: true }
  });

  if (availableSections.length === 0) {
    return { success: false, message: `抱歉，${courseCode} 在本学期没有开班。` };
  }

  // ==========================================
  // 🧠 第三关：智能偏好打分引擎 (Preference Scoring)
  // ==========================================
  let scoredSections = availableSections.map(section => {
    let score = 100; // 初始满分 100 分
    let compromises: string[] = []; // 记录扣分原因，用于最后给学生反馈

    // 1. 老师偏好检查
    if (prefs.preferredLecturer && section.lecturer?.name.includes(prefs.preferredLecturer)) {
      score += 50; // 遇到喜欢的老师，疯狂加分！
    }
    if (prefs.avoidLecturer && section.lecturer?.name.includes(prefs.avoidLecturer)) {
      score -= 100; 
      compromises.push("妥协了避雷老师");
    }

    // 2. 时间与作息偏好检查
    for (const slot of section.timeSlots) {
      // 触犯全局黑名单日期 (比如拜五)
      if (prefs.globalAvoidDays.includes(slot.dayOfWeek)) {
        score -= 50; compromises.push("妥协了休息日");
      }
      // 触犯早起禁忌 (比如早八)
      if (prefs.globalAvoidTimeBefore > 0 && slot.startTime < prefs.globalAvoidTimeBefore) {
        score -= 50; compromises.push("妥协了早起时间");
      }
      // 侵犯午饭时间 (假设午饭时间是 1200 - 1400)
      if (prefs.requireLunchBreak && slot.startTime < 1400 && slot.endTime > 1200) {
        score -= 40; compromises.push("挤占了午休时间");
      }
      // 紧凑排课奖励 (如果这天本来就有课，奖励加分，鼓励把课凑在同一天)
      if (prefs.preferCompactSchedule && existingDays.has(slot.dayOfWeek)) {
        score += 20; 
      }
      // 触犯特定时段黑名单 (比如拜四早八)
      for (const block of prefs.avoidSpecificBlocks) {
        if (slot.dayOfWeek === block.dayOfWeek && slot.startTime < block.endTime && slot.endTime > block.startTime) {
          score -= 60; compromises.push("妥协了特定回避时段");
        }
      }
    }
    
    // 返回带分数的班级对象
    return { ...section, preferenceScore: score, compromises: [...new Set(compromises)] };
  });

  // 🏅 将班级按分数从高到低排序！系统会优先测试最爽的班级！
  scoredSections.sort((a, b) => b.preferenceScore - a.preferenceScore);

  // ==========================================
  // ⚔️ 第四关：防撞车查杀与最终定夺
  // ==========================================
  let targetSection = null;

  for (const section of scoredSections) {
    let hasConflict = false;

    // 严格的时间碰撞检测 (不可妥协的硬性条件)
    for (const newSlot of section.timeSlots) {
      for (const occupied of occupiedSlots) {
        if (newSlot.dayOfWeek === occupied.dayOfWeek) {
          if (newSlot.startTime < occupied.endTime && newSlot.endTime > occupied.startTime) {
            hasConflict = true;
            break;
          }
        }
      }
      if (hasConflict) break;
    }

    if (!hasConflict) {
      targetSection = section; // 找到了不撞车的最高分班级！
      break; 
    }
  }

  if (!targetSection) {
    logger.error(`[Action] Failed. All sections for ${courseCode} conflict with ${userId}'s schedule.`);
    return { success: false, message: `⚠️ 选课失败：这门课所有可用的班级都与你目前的课表存在时间冲突！` };
  }

  // ==========================================
  // ✅ 第五关：完美入库与高情商反馈
  // ==========================================
  try {
    await prisma.enrollment.create({
      data: { userId: userId, sectionId: targetSection.id, semester: semester, status: 'PENDING_PA' }
    });
    
    // 动态生成系统的邀功/解释信息
    let extraMsg = '';
    if (targetSection.preferenceScore < 100 && targetSection.compromises.length > 0) {
      extraMsg = `\n(⚠️ 注：为了避开你的课表冲突，系统不得不安排了 Sec ${targetSection.sectionNumber}。由于资源限制，本次排课 ${targetSection.compromises.join('、')}，敬请谅解。)`;
    } else if (targetSection.preferenceScore >= 100 && Object.keys(rawPreferences).length > 0) {
      extraMsg = `\n(✨ 完美！系统为你锁定的 Sec ${targetSection.sectionNumber} 不仅没冲突，还完美满足了你的所有作息和老师偏好！)`;
    } else {
      extraMsg = `\n(✅ 已成功排入 Sec ${targetSection.sectionNumber}，无时间冲突。)`;
    }

    logger.info(`[Action] Success! Student enrolled in ${courseCode} Sec ${targetSection.sectionNumber}. Score: ${targetSection.preferenceScore}`);
    return { 
      success: true, 
      message: `成功提交 ${courseCode} 的选课申请，等待 PA 审批。${extraMsg}`,
      registeredSection: targetSection // 核心！交出刚选上的班级数据
    };

  } catch (error) {
    logger.error(`[Action] Database error for Student ${userId} on Course ${courseCode}.`, error);
    return { success: false, message: `数据库写入失败，可能该科目已在你的课表中。` };
  }
};


export const getStudentTimetable = async (userId: string, semester: string) => {
  const enrollments = await prisma.enrollment.findMany({
    where: {
      userId: userId,
      semester: semester,
      status: { in: ['PENDING_PA', 'APPROVED'] } 
    },
    include: {
      section: {
        include: { course: true, timeSlots: true }
      }
    }
  });

  return enrollments.map(e => ({
    courseCode: e.section.courseCode,
    courseName: e.section.course.courseName,
    sectionNumber: e.section.sectionNumber,
    venue: e.section.venue,
    status: e.status,
    timeSlots: e.section.timeSlots.map(ts => ({
      dayOfWeek: ts.dayOfWeek,
      startTime: ts.startTime,
      endTime: ts.endTime
    }))
  }));
};


export const dropCourseAction = async (userId: string, courseCode: string, semester: string) => {
  logger.info(`[Action] Student ${userId} attempting to drop ${courseCode} in ${semester}`);

  // 1. 查找该学生这学期有没有选这门课
  const existingEnrollment = await prisma.enrollment.findFirst({
    where: {
      userId: userId,
      semester: semester,
      section: { courseCode: courseCode },
      status: { in: ['PENDING_PA', 'APPROVED'] } // 必须是正常在读的课才能退
    },
    include: { section: true } // 顺便把班级信息带出来，用于写日志和提示
  });

  // 2. 拦截：如果他根本没选这门课，直接报错
  if (!existingEnrollment) {
    logger.warn(`[Action] Drop failed. Student ${userId} is not enrolled in ${courseCode}.`);
    return {
      success: false,
      message: `🚫 退课失败：你的课表中并没有找到 ${courseCode}。系统无法退选你没有报名的课程。`
    };
  }

  // 3. 执行：在黑客松为了数据干净，我们直接物理删除这条报名记录（释放时间槽）
 try {
    // 找出这门被退掉的课的学分
    const droppedCourse = await prisma.course.findUnique({ where: { courseCode: courseCode }});
    const droppedCredit = droppedCourse?.creditHours || 3;

    // 算出学生退课前这学期总共有多少学分
    const currentEnrollments = await prisma.enrollment.findMany({
      where: { userId: userId, semester: semester, status: { in: ['PENDING_PA', 'APPROVED'] } },
      include: { section: { include: { course: true } } }
    });
    const oldTotalCredits = currentEnrollments.reduce((sum, e) => sum + (e.section.course.creditHours || 3), 0);
    
    // 退课后的剩余学分
    const newTotalCredits = oldTotalCredits - droppedCredit;

    // 物理删除记录
    await prisma.enrollment.delete({
      where: { id: existingEnrollment.id }
    });

    // 🌟 动态生成高情商/严厉的反馈信息
    let extraMsg = '';
    if (newTotalCredits < 12) {
      extraMsg = `\n🚨 【严重警告】：退选后你本学期的总学分将降至 ${newTotalCredits} 分！已低于 UMPSA 全日制本科生规定的最低下限（12 学分）。这可能会导致你的 PA 拒绝审批或影响你的全职学生身份，请务必尽快补选其他课程！`;
    }

    logger.info(`[Action] Success! Student ${userId} dropped ${courseCode}. Remaining credits: ${newTotalCredits}`);
    return {
      success: true,
      message: `✅ 退课成功！已将 ${courseCode} 从课表中移除。${extraMsg}`
    };

  } catch (error) {
    logger.error(`[Action] Database error during drop for ${userId} on ${courseCode}.`, error);
    return { success: false, message: `系统数据库发生错误，退课失败。` };
  }
};

export const swapCourseAction = async (userId: string, courseCode: string, semester: string, targetSectionNum: string = "", rawPreferences: any = {}) => {
  logger.info(`[Action] Student ${userId} attempting to swap ${courseCode} in ${semester}`);

  // 1. 拦截检查：看看他现在到底有没有选这门课
  const existingEnrollment = await prisma.enrollment.findFirst({
    where: { userId: userId, semester: semester, section: { courseCode: courseCode }, status: { in: ['PENDING_PA', 'APPROVED'] } },
    include: { section: true }
  });

  if (!existingEnrollment) {
    return { success: false, message: `🚫 换课失败：你的课表中目前没有找到 ${courseCode}，请直接使用加课功能。` };
  }

  const oldSectionNumber = existingEnrollment.section.sectionNumber;

  // 2. 如果用户指定了想换去的班级，且刚好就是现在的班级，直接打回
  if (targetSectionNum && targetSectionNum === oldSectionNumber) {
    return { success: false, message: `⚠️ 你目前已经在 ${courseCode} 的 Sec ${oldSectionNumber} 了，无需更换。` };
  }

  // 3. 💥 核心算法：提取当前时间表，但必须“假装”那门老课已经被删掉了！(时间海剔除)
  const allEnrollments = await prisma.enrollment.findMany({
    where: { userId: userId, semester: semester, status: { in: ['PENDING_PA', 'APPROVED'] } },
    include: { section: { include: { timeSlots: true } } }
  });
  
  const occupiedSlots = allEnrollments
    .filter(e => e.id !== existingEnrollment.id) // 极其关键：把即将被换掉的老班级时间挪走，腾出空间！
    .flatMap(e => e.section.timeSlots);

  // 4. 找到所有可以换的候选班级 (剔除现在的班级)
  let availableSections = await prisma.section.findMany({
    where: { courseCode: courseCode, semester: semester, id: { not: existingEnrollment.sectionId } },
    include: { timeSlots: true, lecturer: true }
  });

  // 如果用户明确指定了要换去哪个班 (比如 02 班)
  if (targetSectionNum) {
    availableSections = availableSections.filter(sec => sec.sectionNumber === targetSectionNum);
    if (availableSections.length === 0) return { success: false, message: `抱歉，${courseCode} 本学期没有 Sec ${targetSectionNum}。` };
  } else if (availableSections.length === 0) {
    return { success: false, message: `抱歉，${courseCode} 目前没有其他可供调剂的班级了。` };
  }

  // 5. 再次请出我们的智能偏好查杀引擎 (极简版)
  let targetSection = null;
  for (const section of availableSections) {
    let hasConflict = false;
    for (const newSlot of section.timeSlots) {
      for (const occupied of occupiedSlots) {
        if (newSlot.dayOfWeek === occupied.dayOfWeek && newSlot.startTime < occupied.endTime && newSlot.endTime > occupied.startTime) {
          hasConflict = true; break;
        }
      }
      if (hasConflict) break;
    }
    if (!hasConflict) {
      targetSection = section; // 找到第一个不撞车的就直接锁定
      break; 
    }
  }

  if (!targetSection) {
    return { success: false, message: `⚠️ 换课失败：其他班级的时间都与你的现存课表有冲突！已为你保留原有的 Sec ${oldSectionNumber}。` };
  }

  // 6. 🏆 终极绝杀：Prisma 原子事务 (Transaction) 保证绝对安全
  try {
    await prisma.$transaction([
      // 动作 A：删掉老班级
      prisma.enrollment.delete({ where: { id: existingEnrollment.id } }),
      // 动作 B：加入新班级
      prisma.enrollment.create({ data: { userId: userId, sectionId: targetSection.id, semester: semester, status: 'PENDING_PA' } })
    ]);

    logger.info(`[Action] Swap Success! Student ${userId} moved from Sec ${oldSectionNumber} to Sec ${targetSection.sectionNumber}.`);
    
    // 翻译新班级的时间用于通知
    const dayMap = ['', '周一', '周二', '周三', '周四', '周五', '周六', '周日'];
    const timeStrings = targetSection.timeSlots.map(ts => {
      const s = ts.startTime.toString().padStart(4, '0'); const e = ts.endTime.toString().padStart(4, '0');
      return `${dayMap[ts.dayOfWeek]} ${s.slice(0,2)}:${s.slice(2)} - ${e.slice(0,2)}:${e.slice(2)}`;
    }).join('，');

    return { 
      success: true, 
      message: `✅ 换课成功！已安全将你从 Sec ${oldSectionNumber} 调剂至 Sec ${targetSection.sectionNumber}。\n📅 新上课时间：${timeStrings} | 地点：${targetSection.venue}` 
    };
  } catch (error) {
    logger.error(`[Action] Transaction error during swap for ${userId}.`, error);
    return { success: false, message: `系统数据库发生错误，换课失败，你的原班级已保留。` };
  }
};

export const searchCourseAction = async (courseCode: string, semester: string) => {
  // 查找所有开班信息，把时间、讲师、科目名称全带出来
  const sections = await prisma.section.findMany({
    where: { courseCode: courseCode, semester: semester },
    include: { timeSlots: true, lecturer: true, course: true }
  });

  if (sections.length === 0) {
    return { success: false, message: `抱歉，${courseCode} 在本学期没有任何开班记录。` };
  }

  // 把复杂的数据翻译成极其漂亮的排版文字！
  const courseName = sections[0].course.courseName;
  let resultText = `为您查到【${courseName} (${courseCode})】本学期的开班信息如下：\n`;
  
  const dayMap = ['', '周一', '周二', '周三', '周四', '周五', '周六', '周日'];
  
  sections.forEach(sec => {
    const times = sec.timeSlots.map(ts => {
      const startStr = ts.startTime.toString().padStart(4, '0');
      const endStr = ts.endTime.toString().padStart(4, '0');
      return `${dayMap[ts.dayOfWeek]} ${startStr.slice(0,2)}:${startStr.slice(2)} - ${endStr.slice(0,2)}:${endStr.slice(2)}`;
    }).join('，');
    
    const lecturer = sec.lecturer ? sec.lecturer.name : '待定(TBA)';
    resultText += `▶ Sec ${sec.sectionNumber} | 讲师: ${lecturer} | 时间: ${times} | 地点: ${sec.venue} | 容量: ${sec.capacity}人\n`;
  });

  return { success: true, message: resultText };
};

export const recommendPlanAction = async (userId: string, semester: string) => {
  logger.info(`[Action] Generating course recommendations for Student ${userId} in ${semester}`);

  // 1. 抓取学生的“前世今生”（所有修课记录）
  const history = await prisma.enrollment.findMany({
    where: { userId: userId },
    include: { section: { include: { course: true } } }
  });

  // 分类历史记录
  const passedCodes = new Set(history.filter(e => e.status === 'PASSED').map(e => e.section.courseCode));
  const currentCodes = new Set(history.filter(e => e.semester === semester && ['PENDING_PA', 'APPROVED'].includes(e.status)).map(e => e.section.courseCode));
  const failedCodes = new Set(history.filter(e => e.status === 'FAILED').map(e => e.section.courseCode));
  
  // 找出那些挂了科，且至今没重修及格，且这学期还没选的“待重修科目”
  const activeFailedCodes = [...failedCodes].filter(code => !passedCodes.has(code) && !currentCodes.has(code));

  // 2. 抓取本学期所有的开班信息，并去重提取出“开了哪些课”
  const availableSections = await prisma.section.findMany({
    where: { semester: semester },
    include: { course: true }
  });
  
  const availableCoursesMap = new Map();
  availableSections.forEach(sec => {
    if (!availableCoursesMap.has(sec.courseCode)) {
      availableCoursesMap.set(sec.courseCode, sec.course);
    }
  });
  const availableCourses = Array.from(availableCoursesMap.values());

  // 3. 查出这些开班科目的所有“前置条件 (Prerequisites)”
  const prerequisites = await prisma.prerequisite.findMany({
    where: { courseCode: { in: Array.from(availableCoursesMap.keys()) } }
  });
  
  const preReqMap = new Map<string, string[]>();
  prerequisites.forEach(p => {
    if (!preReqMap.has(p.courseCode)) preReqMap.set(p.courseCode, []);
    preReqMap.get(p.courseCode)!.push(p.prerequisiteCode);
  });

  // 4. 🧠 核心算法：循环判断，分类推荐
  const recommendations = { mustRetake: [] as any[], canTake: [] as any[] };

  for (const course of availableCourses) {
    const code = course.courseCode;

    // 剔除：已经及格了，或者这学期已经选了的课
    if (passedCodes.has(code) || currentCodes.has(code)) continue;

    // 查杀：是否有资格上这门课？(先修课必须全过)
    const reqs = preReqMap.get(code) || [];
    const meetsAllReqs = reqs.every(req => passedCodes.has(req));

    if (meetsAllReqs) {
      if (activeFailedCodes.includes(code)) {
        recommendations.mustRetake.push(course); // 挂科急救区
      } else {
        recommendations.canTake.push(course); // 正常推进区
      }
    }
  }

  // 5. 组装极其专业的排版输出
  const formatCourse = (c: any) => ({
    courseCode: c.courseCode,
    courseName: c.courseName,
    credit: c.credit // 假设你的数据库里有学分字段，没有可以删掉这行
  });

  const structuredData = {
    mustRetake: recommendations.mustRetake.map(formatCourse),
    canTake: recommendations.canTake.map(formatCourse)
  };

  return { 
    success: true, 
    message: "推荐数据已成功生成", 
    data: structuredData // 🌟 核心：把纯净的数组交出去！
  };
};

export const checkPrerequisiteAction = async (courseCode: string) => {
  logger.info(`[Action] Querying prerequisites for course ${courseCode}`);

  // 1. 查出这门科目本身的信息
  const targetCourse = await prisma.course.findUnique({
    where: { courseCode: courseCode }
  });

  if (!targetCourse) {
    return { success: false, message: `未能在系统数据库中找到科目代码为 [${courseCode}] 的课程。` };
  }

  // 2. 查出该科目绑定的所有前置科目
  const prerequisites = await prisma.prerequisite.findMany({
    where: { courseCode: courseCode },
    include: { prerequisiteCourse: true }
  });

  const structuredData = {
    courseCode: targetCourse.courseCode,
    courseName: targetCourse.courseName,
    hasPrerequisites: prerequisites.length > 0,
    prerequisites: prerequisites.map(p => ({
      prerequisiteCode: p.prerequisiteCode,
      prerequisiteName: p.prerequisiteCourse.courseName
    }))
  };

  return {
    success: true,
    message: "先修条件数据提取成功",
    data: structuredData
  };
};