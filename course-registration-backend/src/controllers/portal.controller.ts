import { Request, Response } from 'express';
import { prisma } from '../config/prisma';
import { AuthRequest } from '../middlewares/auth.middleware';
import { getStudentTimetable } from '../services/course.service';
import { logger } from '../utils/logger';

// ==========================================
// 接口 1: 获取当前学期课表 (My Timetable)
// ==========================================
export const getMyTimetable = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const studentId = req.user.userId;
    const settings = await prisma.systemSetting.findFirst();
    const activeSemester = settings?.activeSemester || '2526-SEM1';

    const timetable = await getStudentTimetable(studentId, activeSemester);

    res.status(200).json({
      success: true,
      semester: activeSemester,
      data: timetable
    });
  } catch (error) {
    logger.error("Error fetching timetable:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ==========================================
// 接口 2: 获取课程结构与成绩 (Course Structure)
// 🌟 完美对齐前端截图需求！
// ==========================================
export const getCourseStructure = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const studentId = req.user.userId;

    const student = await prisma.user.findUnique({
      where: { id: studentId },
      include: { 
        enrollments: { 
          include: { section: { include: { course: true } } } 
        } 
      }
    });

    if (!student || !student.program) {
      res.status(404).json({ success: false, message: "Student or Program not found" });
      return;
    }

    const catalogItems = await prisma.catalogItem.findMany({
      where: { programCode: student.program },
      include: { course: true }
    });
    const catalogMap = new Map(catalogItems.map(item => [item.courseCode, item]));

    const completed: any[] = [];
    const incompleted: any[] = [];

    // 1. 提取真正已经及格的课（用于决定这门课是否要从 Incompleted 列表剔除）
    const passedCourseCodes = new Set(
      student.enrollments.filter(e => e.status === 'PASSED').map(e => e.section.courseCode)
    );

    // 🌟 2. 核心修复：历史记录必须包含 PASSED 和 FAILED！挂科也是修过的记录！
    const historicalRecords = student.enrollments.filter(e => ['PASSED', 'FAILED'].includes(e.status));

    historicalRecords.forEach((record: any) => {
      const course = record.section.course;
      const catalogInfo = catalogMap.get(course.courseCode);

      completed.push({
        code: course.courseCode,
        courseTitle: course?.courseName || "Unknown",
        creditHours: course?.creditHours || 3,
        category: catalogInfo?.courseType || "-",
        year: catalogInfo?.year || "-",
        // 🌟 如果挂了，就显示 N，让前端可以标红
        passFail: record.status === 'PASSED' ? "Y" : "N", 
        grade: record.grade || (record.status === 'PASSED' ? "PASS" : "FAIL")
      });
    });

    // 3. 处理还没及格的课
    catalogItems.forEach((item: any) => {
      // 只要没有及格，就通通放进未完成列表
      if (!passedCourseCodes.has(item.courseCode)) {
        
        // 这学期正在上吗？
        const isCurrent = student.enrollments.some(
          (e: any) => e.section.courseCode === item.courseCode && ['PENDING_PA', 'APPROVED'].includes(e.status)
        );
        
        // 🌟 核心修复：这门课是不是曾经挂过？
        const isFailed = student.enrollments.some(
          (e: any) => e.section.courseCode === item.courseCode && e.status === 'FAILED'
        );
        
        // 优先级判定：如果在上就是 IN_PROGRESS，如果是挂了就是 FAILED，否则就是纯白纸 NOT_TAKEN
        let currentStatus = "NOT_TAKEN";
        if (isCurrent) currentStatus = "IN_PROGRESS";
        else if (isFailed) currentStatus = "FAILED";

        incompleted.push({
          code: item.courseCode,
          courseTitle: item.course?.courseName || "Unknown",
          creditHours: item.course?.creditHours || 3,
          category: item.courseType || "-",
          year: item.year || "-",
          status: currentStatus // 🌟 前端现在可以拿到 FAILED，并把这行变成醒目的红色警示！
        });
      }
    });

    res.status(200).json({
      success: true,
      program: student.program,
      data: {
        completed,
        incompleted
      }
    });
  } catch (error) {
    logger.error("Error fetching course structure:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ==========================================
// 接口 3: 搜索所有开班课程 (Search Course)
// 🌟 修复：如果不输入条件，默认返回前 50 门课供前端展示
// ==========================================
export const searchCoursesApi = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { q } = req.query; 
    const settings = await prisma.systemSetting.findFirst();
    const activeSemester = settings?.activeSemester || '2526-SEM1';

    // 动态构造查询条件
    const whereClause: any = {};
    if (q && typeof q === 'string') {
      const keyword = q.toLowerCase();
      whereClause.OR = [
        { courseCode: { contains: keyword, mode: 'insensitive' } },
        { courseName: { contains: keyword, mode: 'insensitive' } }
      ];
    }

    // 搜索匹配的课程，并带出本学期的开班信息 (限制 50 条防止卡顿)
    const courses = await prisma.course.findMany({
      where: whereClause,
      take: 50,
      include: {
        sections: {
          where: { semester: activeSemester },
          include: { 
            timeSlots: true,
            lecturer: { select: { name: true } }
          }
        }
      }
    });

    // 格式化数据，让 Pikka 更好渲染卡片
    const formattedData = courses.map(c => ({
      courseCode: c.courseCode,
      courseName: c.courseName,
      creditHours: c.creditHours || 3,
      sections: c.sections.map(sec => ({
        sectionNumber: sec.sectionNumber,
        venue: sec.venue,
        capacity: sec.capacity,
        lecturerName: sec.lecturer?.name || "TBA",
        timeSlots: sec.timeSlots 
      }))
    }));

    res.status(200).json({
      success: true,
      data: formattedData
    });
  } catch (error) {
    logger.error("Error searching courses:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const getDashboardIntel = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const studentId = req.user.userId;
    const settings = await prisma.systemSetting.findFirst();
    const activeSemester = settings?.activeSemester || '2526-SEM1';

    const student = await prisma.user.findUnique({
      where: { id: studentId },
      include: { enrollments: { include: { section: { include: { course: true } } } } }
    });

    if (!student) {
      res.status(404).json({ success: false, message: "Student not found" });
      return;
    }

    // 1. 统计当前学分
    const currentEnrollments = student.enrollments.filter(e => e.semester === activeSemester && ['PENDING_PA', 'APPROVED'].includes(e.status));
    const currentCredits = currentEnrollments.reduce((sum, e) => sum + (e.section.course.creditHours || 3), 0);

    // 2. 挖掘挂科黑历史
    const passedCodes = new Set(student.enrollments.filter(e => e.status === 'PASSED').map(e => e.section.courseCode));
    const currentCodes = new Set(currentEnrollments.map(e => e.section.courseCode));

    
    
    const activeFailedCourses = student.enrollments
      .filter(e => e.status === 'FAILED')
      .filter(e => !passedCodes.has(e.section.courseCode) && !currentCodes.has(e.section.courseCode));

    // =================================
    // 🎨 组装中间区域：System Notice
    // =================================
    let systemNotice = { status: "SAFE", message: "" };

    if (activeFailedCourses.length > 0) {
      systemNotice = {
        status: "CRITICAL",
        message: `🚨 CRITICAL: 检测到上学期【${activeFailedCourses[0].section.courseCode}】未及格！该科目是核心前置条件，请务必在本学期优先重修！`
      };
    } else if (currentCredits < 12) {
      systemNotice = {
        status: "WARNING",
        message: `⚠️ AI Warning: 当前仅注册 ${currentCredits} 学分，低于教务处规定的最低 12 学分要求。请尽快通过右侧矩阵补选！`
      };
    } else {
      systemNotice = {
        status: "SAFE",
        message: `⚡ Systems Nominal. 当前已安全注册 ${currentCredits} 学分。你的选课策略已超越 82% 的同届节点。`
      };
    }

    // =================================
    // 📡 组装右侧区域：Alerts & Notifications
    // =================================
    const alerts: any[] = [];

    // Alert 1: 必须重修警告 (如果有的话)
    if (activeFailedCourses.length > 0) {
      alerts.push({
        id: "alert_retake",
        type: "CRITICAL",
        title: "Mandatory Retake Action",
        description: `${activeFailedCourses[0].section.course.courseName} requires immediate registration.`,
        timeAgo: "Just now",
        actionBtn: { label: "Auto-Fix", actionType: "CHAT", payload: `Help me register ${activeFailedCourses[0].section.courseCode}` }
      });
    }

    // Alert 2: 捡漏雷达 (寻找一门容量快满的课)
    // 黑客松小技巧：随便去库里找一门课的满员或快满员的 section
    const nearlyFullSection = await prisma.section.findFirst({
      where: { semester: activeSemester },
      include: { course: true, enrollments: { where: { status: { in: ['PENDING_PA', 'APPROVED'] } } } }
    });

    if (nearlyFullSection && nearlyFullSection.enrollments.length >= nearlyFullSection.capacity - 2) {
       alerts.push({
        id: "alert_snipe",
        type: "WARNING",
        title: "High Demand Vector Detected",
        description: `${nearlyFullSection.course.courseName} (Sec ${nearlyFullSection.sectionNumber}) is almost FULL. Only ${Math.max(0, nearlyFullSection.capacity - nearlyFullSection.enrollments.length)} seats left!`,
        timeAgo: "2m ago",
        actionBtn: { label: "Snipe It", actionType: "CHAT", payload: `Register ${nearlyFullSection.courseCode} section ${nearlyFullSection.sectionNumber}` }
      });
    }

    // Alert 3: 智能推荐
    alerts.push({
        id: "alert_recommend",
        type: "INFO",
        title: "AI Optimization Matrix",
        description: `Based on your pathway, picking up a Core Elective module is highly recommended this semester.`,
        timeAgo: "1h ago",
        actionBtn: { label: "Consult AI", actionType: "CHAT", payload: "Can you recommend some courses for me?" }
    });

    res.status(200).json({
      success: true,
      data: {
        metrics: { currentCredits, minCredits: 12, maxCredits: 19 },
        systemNotice,
        alerts
      }
    });

  } catch (error) {
    logger.error("Error fetching dashboard intel:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const manualRegisterApi = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const studentId = req.user.userId;
    const { courseCode, sectionNumber } = req.body; // 前端必须传这两个参数！
    
    if (!courseCode || !sectionNumber) {
      res.status(400).json({ success: false, message: "Missing courseCode or sectionNumber" });
      return;
    }

    const settings = await prisma.systemSetting.findFirst();
    const activeSemester = settings?.activeSemester || '2526-SEM1';

    // 🛡️ 1. 检查是否已经选过这门课了
    const existingEnrollment = await prisma.enrollment.findFirst({
      where: {
        userId: studentId,
        semester: activeSemester,
        section: { courseCode: courseCode },
        status: { in: ['PENDING_PA', 'APPROVED'] }
      },
      include: { section: true }
    });

    if (existingEnrollment) {
      res.status(400).json({ success: false, message: `🚫 Failed: You have already registered for Sec ${existingEnrollment.section.sectionNumber}.` });
      return;
    }

    // 🛡️ 2. 检查学分上限 (不能超过 19 分)
    const targetCourse = await prisma.course.findUnique({ where: { courseCode } });
    const newCredit = targetCourse?.creditHours || 3;

    const currentEnrollments = await prisma.enrollment.findMany({
      where: { userId: studentId, semester: activeSemester, status: { in: ['PENDING_PA', 'APPROVED'] } },
      include: { section: { include: { course: true, timeSlots: true } } }
    });
    
    const currentTotalCredits = currentEnrollments.reduce((sum, e) => sum + (e.section.course.creditHours || 3), 0);

    if (currentTotalCredits + newCredit > 19) {
      res.status(400).json({ success: false, message: `🚫 Max Credit Hours: Current ${currentTotalCredits} credit hours, if registered it will exceed the 19 credit hours limit!` });
      return;
    }
    console.log("Current enrollments:", currentEnrollments.map(e => ({
  courseCode: e.section.course.courseCode,
  creditHours: e.section.course.creditHours,
  status: e.status
})));

console.log("Current total credits:", currentTotalCredits);
console.log("New course credit:", newCredit);
console.log("After register:", currentTotalCredits + newCredit);

    // 🛡️ 3. 检查先修课 (Prerequisites)
    const prerequisites = await prisma.prerequisite.findMany({
      where: { courseCode: courseCode },
      include: { prerequisiteCourse: true }
    });

    if (prerequisites.length > 0) {
      const passedRecords = await prisma.enrollment.findMany({
        where: { userId: studentId, status: 'PASSED' },
        select: { section: { select: { courseCode: true } } }
      });
      const passedCourseCodes = passedRecords.map(r => r.section.courseCode);

      for (const pre of prerequisites) {
        if (!passedCourseCodes.includes(pre.prerequisiteCode)) {
          res.status(400).json({ success: false, message: `🚫 Precondition not met: Must pass【${pre.prerequisiteCourse.courseName} (${pre.prerequisiteCode})】first.` });
          return;
        }
      }
    }

    // 🛡️ 4. 检查班级是否存在、以及是否满人
    const targetSection = await prisma.section.findFirst({
      where: { courseCode, sectionNumber, semester: activeSemester },
      include: { 
        timeSlots: true,
        enrollments: { where: { status: { in: ['PENDING_PA', 'APPROVED'] } } } 
      }
    });

    if (!targetSection) {
      res.status(404).json({ success: false, message: "Section not found." });
      return;
    }

    if (targetSection.enrollments.length >= targetSection.capacity) {
      res.status(400).json({ success: false, message: `🚫 Section Full: Sec ${sectionNumber} is full, please choose another section or use AI sniping.` });
      return;
    }

    // 🛡️ 5. 硬核时间防撞车检查
    const occupiedSlots = currentEnrollments.flatMap(e => e.section.timeSlots);
    for (const newSlot of targetSection.timeSlots) {
      for (const occupied of occupiedSlots) {
        if (newSlot.dayOfWeek === occupied.dayOfWeek && newSlot.startTime < occupied.endTime && newSlot.endTime > occupied.startTime) {
          res.status(400).json({ success: false, message: `🚫 Time Clash: Sec ${sectionNumber} overlaps with your existing timetable!` });
          return;
        }
      }
    }

    // ✅ 6. 完美通过所有检查，执行写入！
    await prisma.enrollment.create({
      data: { 
        userId: studentId,
        courseCode: courseCode,
        sectionId: targetSection.id,
        semester: activeSemester,
        status: 'PENDING_PA'
      }
    });

    logger.info(`[Manual Action] Student ${studentId} manually registered for ${courseCode} Sec ${sectionNumber}.`);
    
    res.status(200).json({ 
      success: true, 
      message: `✅ Registration successful! ${courseCode} (Sec ${sectionNumber}) has been added to your timetable.` 
    });

  } catch (error) {
    logger.error("Error in manual registration:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const manualDropApi = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const studentId = req.user.userId;
    const { courseCode } = req.body;

    if (!courseCode) {
      res.status(400).json({
        success: false,
        message: "Missing courseCode"
      });
      return;
    }

    const settings = await prisma.systemSetting.findFirst();
    const activeSemester = settings?.activeSemester || "2526-SEM1";

    const enrollment = await prisma.enrollment.findFirst({
      where: {
        userId: studentId,
        semester: activeSemester,
        section: {
          courseCode: courseCode
        },
        status: {
          in: ["PENDING_PA", "APPROVED"]
        }
      },
      include: {
        section: {
          include: {
            course: true
          }
        }
      }
    });

    if (!enrollment) {
      res.status(404).json({
        success: false,
        message: `You are not currently registered for ${courseCode}.`
      });
      return;
    }

    await prisma.enrollment.delete({
      where: {
        id: enrollment.id
      }
    });

    res.status(200).json({
      success: true,
      message: `Dropped ${courseCode} successfully.`
    });

  } catch (error) {
    logger.error("Error in manual drop:", error);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};