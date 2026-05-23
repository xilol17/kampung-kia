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