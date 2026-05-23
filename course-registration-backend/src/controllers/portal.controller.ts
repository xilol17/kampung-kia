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

    // 1. 抓取学生信息及所有的修课记录
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

    // 2. 抓取该学生专业的培养目录，并做成字典方便查找
    const catalogItems = await prisma.catalogItem.findMany({
      where: { programCode: student.program },
      include: { course: true }
    });
    const catalogMap = new Map(catalogItems.map(item => [item.courseCode, item]));

    const completed: any[] = [];
    const incompleted: any[] = [];

    // 3. 核心修复 1：Completed 列表直接来源于真实的及格记录！
    const passedEnrollments = student.enrollments.filter(e => e.status === 'PASSED');
    const passedCourseCodes = new Set(passedEnrollments.map(e => e.section.courseCode));

    passedEnrollments.forEach(record => {
      const course = record.section.course;
      const catalogInfo = catalogMap.get(course.courseCode); // 看看培养手册里有没有这门课

      completed.push({
        code: course.courseCode,
        courseTitle: course.courseName,           // 🌟 修复：对齐截图 COURSE TITLE
        creditHours: course.creditHours || 3,
        category: catalogInfo?.courseType || "-", // 🌟 修复：如果没有目录信息，显示 "-" (对齐截图)
        year: catalogInfo?.year || "-",           // 🌟 修复：如果没有目录信息，显示 "-" (对齐截图)
        passFail: "Y",                            // 🌟 修复：对齐截图 PASS/FAIL 列的绿字 "Y"
        grade: record.grade || "PASS"             // 保留具体的 A / B+ 供其他地方使用
      });
    });

    // 4. 核心修复 2：Incompleted 列表来源于 Catalog 中还没及格的课
    catalogItems.forEach(item => {
      // 如果这门课没有及格，就放进未完成列表
      if (!passedCourseCodes.has(item.courseCode)) {
        // 检查是不是这学期正在上
        const isCurrent = student.enrollments.some(
          e => e.section.courseCode === item.courseCode && ['PENDING_PA', 'APPROVED'].includes(e.status)
        );
        
        incompleted.push({
          code: item.courseCode,
          courseTitle: item.course.courseName,
          creditHours: item.course.creditHours || 3,
          category: item.courseType || "-",
          year: item.year || "-",
          status: isCurrent ? "IN_PROGRESS" : "NOT_TAKEN"
        });
      }
    });

    res.status(200).json({
      success: true,
      program: student.program,
      data: {
        completed,     // 前端直接拿去 map 渲染截图里的表格
        incompleted    // 前端画另一个未完成表格
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