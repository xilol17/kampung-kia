"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkStudentProgressAction = void 0;
const prisma_1 = require("../config/prisma");
const logger_1 = require("../utils/logger");
// ==========================================
// 📊 毕业学分与进度核算引擎 (Check Progress)
// ==========================================
const checkStudentProgressAction = async (userId, currentSemester) => {
    logger_1.logger.info(`[Action] Checking academic progress for student ${userId}`);
    // 1. 查出学生这辈子所有修课记录（包含已通过、挂科、以及本学期刚选的）
    const allEnrollments = await prisma_1.prisma.enrollment.findMany({
        where: { userId: userId },
        include: {
            section: {
                include: { course: true }
            }
        }
    });
    // 2. 算总账：算一算已经拿稳的学分（STATUS 为 PASSED）
    const passedEnrollments = allEnrollments.filter(e => e.status === 'PASSED');
    const totalPassedCredits = passedEnrollments.reduce((sum, e) => sum + (e.section.course.creditHours || 3), 0);
    // 3. 算现账：本学期正在修或申请中的学分
    const currentEnrollments = allEnrollments.filter(e => e.semester === currentSemester && ['PENDING_PA', 'APPROVED'].includes(e.status));
    const currentSemesterCredits = currentEnrollments.reduce((sum, e) => sum + (e.section.course.creditHours || 3), 0);
    // 4. 设定毕业标准硬性门槛为 130 学分
    const graduationRequiredCredits = 130;
    const remainingCredits = Math.max(0, graduationRequiredCredits - totalPassedCredits - currentSemesterCredits);
    // 5. 封装纯净的结构化数据交出去
    const structuredData = {
        totalPassedCredits, // 已获学分
        currentSemesterCredits, // 本学期在修学分
        graduationRequiredCredits, // 毕业要求总学分 (130)
        remainingCredits, // 距离毕业还差学分
        passedCourses: passedEnrollments.map(e => ({
            courseCode: e.section.courseCode,
            courseName: e.section.course.courseName,
            credit: e.section.course.creditHours || 3
        })),
        currentCourses: currentEnrollments.map(e => ({
            courseCode: e.section.courseCode,
            courseName: e.section.course.courseName,
            credit: e.section.course.creditHours || 3,
            status: e.status
        }))
    };
    return {
        success: true,
        message: "学业进度看板数据生成成功",
        data: structuredData
    };
};
exports.checkStudentProgressAction = checkStudentProgressAction;
