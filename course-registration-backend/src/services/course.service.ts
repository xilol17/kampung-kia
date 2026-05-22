import { prisma } from '../config/prisma';
import { logger } from '../utils/logger'; // 引入 logger

export const registerCourseAction = async (userId: string, courseCode: string, semester: string) => {
  // 使用 logger.info 记录常规操作
  logger.info(`[Action] Initiating course registration. Student: ${userId} | Target Course: ${courseCode}`);

  const availableSections = await prisma.section.findMany({
    where: { courseCode: courseCode, semester: semester },
    include: { timeSlots: true }
  });

  if (availableSections.length === 0) {
    // 使用 logger.warn 记录警告（没有开班）
    logger.warn(`[Action] Registration failed. Course ${courseCode} has no available sections for ${semester}.`);
    return { success: false, message: `抱歉，${courseCode} 在本学期没有开班。` };
  }

  const targetSection = availableSections[0];

  try {
    await prisma.enrollment.create({
      data: {
        userId: userId,
        sectionId: targetSection.id,
        semester: semester,
        status: 'PENDING_PA' 
      }
    });
    // 成功记录
    logger.info(`[Action] Success! Student ${userId} successfully enrolled in ${courseCode} (Section: ${targetSection.sectionNumber}). Pending PA approval.`);
    return { success: true, message: `成功！已将 ${courseCode} 加入你的课表，等待 PA 审批。` };
    
  } catch (error) {
    // 使用 logger.error 记录数据库崩溃或唯一性冲突，同时附带 error 对象
    logger.error(`[Action] Database insertion failed for Student ${userId} on Course ${courseCode}.`, error);
    return { success: false, message: `写入数据库失败，可能是已经选过这门课了。` };
  }
};