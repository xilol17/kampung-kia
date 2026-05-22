import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// 辅助函数：随机获取 1-5（周一到周五）
const getRandomDay = () => Math.floor(Math.random() * 5) + 1;
// 辅助函数：随机获取上课时间槽
const timeBlocks = [
  { start: 800, end: 1000 }, { start: 1000, end: 1200 }, 
  { start: 1400, end: 1600 }, { start: 1600, end: 1800 }
];
const getRandomTimeSlot = () => timeBlocks[Math.floor(Math.random() * timeBlocks.length)];

async function main() {
  console.log('🌱 开始清理旧数据...')
  await prisma.enrollment.deleteMany()
  await prisma.timeSlot.deleteMany()
  await prisma.section.deleteMany()
  await prisma.prerequisite.deleteMany()
  await prisma.catalogItem.deleteMany()
  await prisma.course.deleteMany()
  await prisma.user.deleteMany()
  await prisma.systemSetting.deleteMany()

  // 1. 系统设置
  console.log('⚙️ 初始化系统环境 (2526-SEM1)...')
  await prisma.systemSetting.create({
    data: { id: 1, activeSemester: '2526-SEM1', isRegistrationOpen: true }
  })

  // 2. 用户设定
  console.log('👤 创建测试用户...')
  const paHong = await prisma.user.create({
    data: { id: 'STF001', name: 'Dr. Hong', email: 'hong@umpsa.edu.my', role: 'PA', faculty: 'Faculty of Computing' }
  })
  // 用于教其他课的虚拟讲师
  const lecturerAli = await prisma.user.create({
    data: { id: 'STF002', name: 'Dr. Ali', email: 'ali@umpsa.edu.my', role: 'LECTURER', faculty: 'Faculty of Computing' }
  })

  const studentTianXi = await prisma.user.create({
    data: {
      id: 'CB24184', name: 'NG TIAN XI', email: 'cb24184@student.umpsa.edu.my',
      role: 'STUDENT', faculty: 'Faculty of Computing', program: 'Software Engineering',
      advisorId: paHong.id
    }
  })

  // 3. 全量课程大字典
  console.log('📚 正在大批量注入全系课程...')
  const courses = [
    // University Courses
    { code: 'UHC1012', name: 'Falsafah dan Isu Semasa', faculty: 'University', program: 'UNIVERSITI', credit: 2 },
    { code: 'UHC1032', name: 'Kursus Integriti dan Anti-Rasuah', faculty: 'University', program: 'UNIVERSITI', credit: 2 },
    { code: 'UQA2002', name: 'Co-Curriculum', faculty: 'University', program: 'UNIVERSITI', credit: 2 },
    { code: 'ULE1310', name: 'Fundamental of English Language', faculty: 'University', program: 'UNIVERSITI', credit: 0 },
    { code: 'ULE1322', name: 'English for Academic Communications', faculty: 'University', program: 'UNIVERSITI', credit: 2 },
    { code: 'UHL2412', name: 'Foreign Language (Mandarin)', faculty: 'University', program: 'UNIVERSITI', credit: 2 },
    { code: 'UHC2022', name: 'Penghayatan Etika & Peradaban', faculty: 'University', program: 'UNIVERSITI', credit: 2 },
    { code: 'ULE2332', name: 'English for Technical Communications', faculty: 'University', program: 'UNIVERSITI', credit: 2 },
    { code: 'UGE2002', name: 'Technopreneurship', faculty: 'University', program: 'UNIVERSITI', credit: 2 },
    { code: 'ULE2342', name: 'English for Professional Communication', faculty: 'University', program: 'UNIVERSITI', credit: 2 },
    { code: 'UEE3012', name: 'Kursus Elektif Sains Sosial 1', faculty: 'University', program: 'UNIVERSITI', credit: 2 },
    { code: 'UEE4012', name: 'Kursus Elektif Sains Sosial 2', faculty: 'University', program: 'UNIVERSITI', credit: 2 },
    
    // Maths Courses
    { code: 'BUM1153', name: 'Intermediate Mathematics', faculty: 'Maths', program: 'UNIVERSITI', credit: 3 },
    { code: 'BUM1233', name: 'Discrete Mathematics & Applications', faculty: 'Maths', program: 'UNIVERSITI', credit: 3 },
    { code: 'BUM1433', name: 'Discrete Structure & Application', faculty: 'Maths', program: 'UNIVERSITI', credit: 3 },
    { code: 'BUM2413', name: 'Applied Statistics', faculty: 'Maths', program: 'UNIVERSITI', credit: 3 },

    // Core Faculty Courses
    { code: 'BCN1043', name: 'Computer Architecture & Organization', faculty: 'Core Faculty', program: 'BCS', credit: 3 },
    { code: 'BCI1143', name: 'Problem Solving', faculty: 'Core Faculty', program: 'BCS', credit: 3 },
    { code: 'BCS1033', name: 'Software Engineering', faculty: 'Core Faculty', program: 'BCS', credit: 3 },
    { code: 'BCI2023', name: 'Database Systems', faculty: 'Core Faculty', program: 'BCS', credit: 3 },
    { code: 'BCN1053', name: 'Data Communications & Networking', faculty: 'Core Faculty', program: 'BCS', credit: 3 },
    { code: 'BCI1023', name: 'Programming Technique', faculty: 'Core Faculty', program: 'BCS', credit: 3 },
    { code: 'BCS1133', name: 'Systems Analysis & Design', faculty: 'Core Faculty', program: 'BCS', credit: 3 },
    { code: 'BCI1093', name: 'Data Structure & Algorithms', faculty: 'Core Faculty', program: 'BCS', credit: 3 },
    { code: 'BCS2143', name: 'Object Oriented Programming', faculty: 'Core Faculty', program: 'BCS', credit: 3 },
    { code: 'BCS2173', name: 'Human Computer Interaction', faculty: 'Core Faculty', program: 'BCS', credit: 3 },
    { code: 'BCN2053', name: 'Operating Systems', faculty: 'Core Faculty', program: 'BCS', credit: 3 },
    { code: 'BCS2243', name: 'Web Engineering', faculty: 'Core Faculty', program: 'BCS', credit: 3 },
    { code: 'BCS2313', name: 'Artificial Intelligence Techniques', faculty: 'Core Faculty', program: 'BCS', credit: 3 },
    { code: 'BCI2313', name: 'Algorithm & Complexity', faculty: 'Core Faculty', program: 'BCS', credit: 3 },
    { code: 'BCN2023', name: 'Data & Network Security', faculty: 'Core Faculty', program: 'BCS', credit: 3 },
    { code: 'BCC3012', name: 'Undergraduate Project I', faculty: 'Core Faculty', program: 'BCS', credit: 2 },
    { code: 'BCC3024', name: 'Undergraduate Project II', faculty: 'Core Faculty', program: 'BCS', credit: 4 },
    { code: 'BCC4012', name: 'Industrial Training', faculty: 'Core Faculty', program: 'BCS', credit: 12 },

    // Core Program (Software Engineering)
    { code: 'BCS2233', name: 'Software Requirement Workshop', faculty: 'Software Engineering', program: 'Software Engineering', credit: 3 },
    { code: 'BCS2343', name: 'Software Design Workshop', faculty: 'Software Engineering', program: 'Software Engineering', credit: 3 },
    { code: 'BCS2213', name: 'Formal Method', faculty: 'Software Engineering', program: 'Software Engineering', credit: 3 },
    { code: 'BCS3233', name: 'Software Testing', faculty: 'Software Engineering', program: 'Software Engineering', credit: 3 },
    { code: 'BCS3143', name: 'Software Project Management', faculty: 'Software Engineering', program: 'Software Engineering', credit: 3 },
    { code: 'BCS3153', name: 'Software Evolution & Maintenance', faculty: 'Software Engineering', program: 'Software Engineering', credit: 3 },
    { code: 'BCS3133', name: 'Software Engineering Practices', faculty: 'Software Engineering', program: 'Software Engineering', credit: 3 },
    { code: 'BCS3263', name: 'Software Quality Assurance', faculty: 'Software Engineering', program: 'Software Engineering', credit: 3 },
    
    // Virtual Electives
    { code: 'BCS2423', name: 'Elective 1: Mobile App Dev', faculty: 'Software Engineering', program: 'Software Engineering', credit: 3 },
    { code: 'BCS3453', name: 'Elective 2: Cloud Computing', faculty: 'Software Engineering', program: 'Software Engineering', credit: 3 },
    { code: 'BCS3463', name: 'Elective 3: Game Development', faculty: 'Software Engineering', program: 'Software Engineering', credit: 3 }
  ];

  for (const c of courses) {
    await prisma.course.create({ data: { courseCode: c.code, courseName: c.name, faculty: c.faculty, program: c.program, creditHours: c.credit } })
  }

  // 4. 精准的前置规则绑定 (Prerequisites)
  console.log('🔗 绑定全校先修课规则...')
  const preReqs = [
    { code: 'ULE2332', req: 'ULE1322' }, { code: 'ULE2342', req: 'ULE2332' },
    { code: 'BCI1023', req: 'BCI1143' }, { code: 'BCI1093', req: 'BCI1023' },
    { code: 'BCS2143', req: 'BCI1023' }, { code: 'BCS2143', req: 'BCS1133' },
    { code: 'BCS2173', req: 'BCS1033' }, { code: 'BCS2243', req: 'BCI1023' },
    { code: 'BCS2243', req: 'BCS1133' }, { code: 'BCS2313', req: 'BCI1093' },
    { code: 'BCS2313', req: 'BUM1233' }, { code: 'BCI2313', req: 'BCI1023' },
    { code: 'BCI2313', req: 'BCI1093' }, { code: 'BCN2023', req: 'BCN1053' },
    { code: 'BCC3024', req: 'BCC3012' }, { code: 'BCS2233', req: 'BCS1133' },
    { code: 'BCS2343', req: 'BCS2233' }, { code: 'BCS2213', req: 'BUM1233' },
    { code: 'BCS2213', req: 'BCS2233' }, { code: 'BCS3233', req: 'BCS1133' },
    { code: 'BCS3143', req: 'BCS2343' }, { code: 'BCS3143', req: 'BCS3233' },
    { code: 'BCS3153', req: 'BCS3233' }, { code: 'BCS3153', req: 'BCS2343' },
    { code: 'BCS3133', req: 'BCS2343' }, { code: 'BCS3263', req: 'BCS3233' },
  ];

  for (const pr of preReqs) {
    await prisma.prerequisite.create({ data: { courseCode: pr.code, prerequisiteCode: pr.req } })
  }

  // 5. 培养方案 (Catalog Y1S1 到 Y4S2)
  console.log('📖 生成完整的大学 4 年 Course Catalog...')
  const catalogDefinition = [
    { sem: 'Y1S1', courses: ['UHC1012', 'UHC1032', 'BUM1153', 'BUM1233', 'BCN1043', 'BCI1143', 'BCS1033'] },
    { sem: 'Y1S2', courses: ['UQA2002', 'ULE1310', 'ULE1322', 'BUM1433', 'BCI2023', 'BCN1053', 'BCI1023', 'BCS1133'] },
    { sem: 'Y2S1', courses: ['UHL2412', 'UHC2022', 'ULE2332', 'BCI1093', 'BCS2143', 'BCS2173', 'BCS2233'] }, // <-- 这是你的主战场
    { sem: 'Y2S2', courses: ['UGE2002', 'BUM2413', 'BCN2053', 'BCS2243', 'BCS2313', 'BCS2343'] },
    { sem: 'Y3S1', courses: ['ULE2342', 'BCI2313', 'BCN2023', 'BCS2213', 'BCS2423', 'BCS3233'] },
    { sem: 'Y3S2', courses: ['UEE3012', 'BCC3012', 'BCS3453', 'BCS3143', 'BCS3153', 'BCS3133'] },
    { sem: 'Y4S1', courses: ['UEE4012', 'BCC3024', 'BCS3463', 'BCS3263'] },
    { sem: 'Y4S2', courses: ['BCC4012'] }
  ];

  for (const cat of catalogDefinition) {
    for (const code of cat.courses) {
      await prisma.catalogItem.create({ data: { programName: 'Software Engineering', recommendedSemester: cat.sem, courseCode: code } })
    }
  }

  // 6. 自动化海量排课引擎 (自动为每一门课生成 2 个班级和随机时间)
  console.log('⏰ 启动超级排课引擎：自动生成全校班级与时间表...')
  const demoCourses = ['BCS2173', 'BCS2143', 'BCI1023']; // 排除这三门用于演示的核心冲突课

  for (const c of courses) {
    if (demoCourses.includes(c.code)) continue;

    // 为每门课自动创建 Section 01
    const t1 = getRandomTimeSlot();
    await prisma.section.create({
      data: {
        sectionNumber: '01', capacity: 30, venue: `DK-${getRandomDay()}${Math.floor(Math.random()*10)}`, semester: '2526-SEM1', courseCode: c.code, lecturerId: lecturerAli.id,
        timeSlots: { create: [{ dayOfWeek: getRandomDay(), startTime: t1.start, endTime: t1.end }] }
      }
    });

    // 为每门课自动创建 Section 02
    const t2 = getRandomTimeSlot();
    await prisma.section.create({
      data: {
        sectionNumber: '02', capacity: 30, venue: `Lab-${getRandomDay()}${Math.floor(Math.random()*10)}`, semester: '2526-SEM1', courseCode: c.code, lecturerId: lecturerAli.id,
        timeSlots: { create: [{ dayOfWeek: getRandomDay(), startTime: t2.start, endTime: t2.end }] }
      }
    });
  }

  // ==========================================
  // 🌟 路演剧本：精心设计的冲突局与退路 🌟
  // ==========================================
  // HCI (BCS2173) 只有一个班：周一 08:00 - 10:00
  await prisma.section.create({
    data: {
      sectionNumber: '01', capacity: 30, venue: 'WDK01', semester: '2526-SEM1', courseCode: 'BCS2173', lecturerId: paHong.id,
      timeSlots: { create: [{ dayOfWeek: 1, startTime: 800, endTime: 1000 }] }
    }
  })

  // OOP (BCS2143) Sec 01：周一 08:00 - 10:00 (🔥 致命撞车！)
  await prisma.section.create({
    data: {
      sectionNumber: '01', capacity: 30, venue: 'WDK02', semester: '2526-SEM1', courseCode: 'BCS2143', lecturerId: paHong.id,
      timeSlots: { create: [{ dayOfWeek: 1, startTime: 800, endTime: 1000 }] }
    }
  })
  // OOP (BCS2143) Sec 02：周四 14:00 - 16:00 (✅ AI 救命退路)
  await prisma.section.create({
    data: {
      sectionNumber: '02', capacity: 30, venue: 'WDK03', semester: '2526-SEM1', courseCode: 'BCS2143', lecturerId: paHong.id,
      timeSlots: { create: [{ dayOfWeek: 4, startTime: 1400, endTime: 1600 }] }
    }
  })

  // 重修班 Programming Technique (BCI1023) Sec 01：周三 10:00 - 12:00
  await prisma.section.create({
    data: {
      sectionNumber: '01', capacity: 30, venue: 'Lab 1', semester: '2526-SEM1', courseCode: 'BCI1023', lecturerId: paHong.id,
      timeSlots: { create: [{ dayOfWeek: 3, startTime: 1000, endTime: 1200 }] } 
    }
  })
  await prisma.section.create({
    data: {
      sectionNumber: '02', capacity: 30, venue: 'Lab 2', semester: '2526-SEM1', courseCode: 'BCI1023', lecturerId: paHong.id,
      timeSlots: { create: [{ dayOfWeek: 5, startTime: 800, endTime: 1000 }] } 
    }
  })

  // 7. 学生历史成绩 (挂科剧本)
  console.log('📜 写入历史档案，激活拦截系统...')
  const pastSec1 = await prisma.section.create({ data: { sectionNumber: '01', capacity: 30, venue: 'NA', semester: '2425-SEM2', courseCode: 'BCI1143', lecturerId: paHong.id } })
  const pastSec2 = await prisma.section.create({ data: { sectionNumber: '01', capacity: 30, venue: 'NA', semester: '2425-SEM2', courseCode: 'BCS1033', lecturerId: paHong.id } })
  const pastSec3 = await prisma.section.create({ data: { sectionNumber: '01', capacity: 30, venue: 'NA', semester: '2425-SEM2', courseCode: 'BCI1023', lecturerId: paHong.id } })

  await prisma.enrollment.create({ data: { userId: 'CB24184', sectionId: pastSec1.id, semester: '2425-SEM2', status: 'PASSED' } })
  await prisma.enrollment.create({ data: { userId: 'CB24184', sectionId: pastSec2.id, semester: '2425-SEM2', status: 'PASSED' } })
  await prisma.enrollment.create({ data: { userId: 'CB24184', sectionId: pastSec3.id, semester: '2425-SEM2', status: 'FAILED' } }) // 挂科触发器

  console.log('🎉 终极系统数据基建完成！您的数据库现在拥有大学规模的数据量。')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })