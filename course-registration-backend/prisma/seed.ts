import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const ACTIVE_SEMESTER = '2425-SEM2';

const courses = [
  // University Course
  { courseCode: 'UHC1012', courseName: 'Falsafah dan Isu Semasa', faculty: 'University', program: 'BCS', creditHours: 2 },
  { courseCode: 'UHC1032', courseName: 'Kursus Integriti dan Anti-Rasuah (KIAR)', faculty: 'University', program: 'BCS', creditHours: 2 },
  { courseCode: 'UQA2002', courseName: 'Co-Curriculum', faculty: 'University', program: 'BCS', creditHours: 2 },
  { courseCode: 'ULE1310', courseName: 'Fundamental of English Language', faculty: 'University', program: 'BCS', creditHours: 0 },
  { courseCode: 'ULE1322', courseName: 'English for Academic Communications', faculty: 'University', program: 'BCS', creditHours: 2 },
  { courseCode: 'ULA1312', courseName: 'Foreign Language - Arabic', faculty: 'University', program: 'BCS', creditHours: 2 },
  { courseCode: 'ULM1312', courseName: 'Foreign Language - Mandarin', faculty: 'University', program: 'BCS', creditHours: 2 },
  { courseCode: 'ULJ1312', courseName: 'Foreign Language - Japanese', faculty: 'University', program: 'BCS', creditHours: 2 },
  { courseCode: 'UHC2022', courseName: 'Penghayatan Etika & Peradaban', faculty: 'University', program: 'BCS', creditHours: 2 },
  { courseCode: 'ULE2332', courseName: 'English for Technical Communications', faculty: 'University', program: 'BCS', creditHours: 2 },
  { courseCode: 'UGE2002', courseName: 'Technopreneurship', faculty: 'University', program: 'BCS', creditHours: 2 },
  { courseCode: 'ULE2342', courseName: 'English for Professional Communication', faculty: 'University', program: 'BCS', creditHours: 2 },
  { courseCode: 'UEE3112', courseName: 'Social Science Elective I - Psychology', faculty: 'University', program: 'BCS', creditHours: 2 },
  { courseCode: 'UEE3122', courseName: 'Social Science Elective I - Communication', faculty: 'University', program: 'BCS', creditHours: 2 },
  { courseCode: 'UEE4212', courseName: 'Social Science Elective II - Leadership', faculty: 'University', program: 'BCS', creditHours: 2 },
  { courseCode: 'UEE4222', courseName: 'Social Science Elective II - Ethics and Society', faculty: 'University', program: 'BCS', creditHours: 2 },

  // Maths Course
  { courseCode: 'BUM1153', courseName: 'Intermediate Mathematics', faculty: 'Mathematics', program: 'BCS', creditHours: 3 },
  { courseCode: 'BUM1233', courseName: 'Discrete Mathematics & Applications', faculty: 'Mathematics', program: 'BCS', creditHours: 3 },
  { courseCode: 'BUM1433', courseName: 'Discrete Structure & Application', faculty: 'Mathematics', program: 'BCS', creditHours: 3 },
  { courseCode: 'BUM2413', courseName: 'Applied Statistics', faculty: 'Mathematics', program: 'BCS', creditHours: 3 },

  // Faculty Course
  { courseCode: 'BCN1043', courseName: 'Computer Architecture & Organization', faculty: 'Faculty of Computing', program: 'BCS', creditHours: 3 },
  { courseCode: 'BCI1143', courseName: 'Problem Solving', faculty: 'Faculty of Computing', program: 'BCS', creditHours: 3 },
  { courseCode: 'BCS1033', courseName: 'Software Engineering', faculty: 'Faculty of Computing', program: 'BCS', creditHours: 3 },
  { courseCode: 'BCI2023', courseName: 'Database Systems', faculty: 'Faculty of Computing', program: 'BCS', creditHours: 3 },
  { courseCode: 'BCN1053', courseName: 'Data Communications & Networking', faculty: 'Faculty of Computing', program: 'BCS', creditHours: 3 },
  { courseCode: 'BCI1023', courseName: 'Programming Technique', faculty: 'Faculty of Computing', program: 'BCS', creditHours: 3 },
  { courseCode: 'BCS1133', courseName: 'Systems Analysis & Design', faculty: 'Faculty of Computing', program: 'BCS', creditHours: 3 },
  { courseCode: 'BCI1093', courseName: 'Data Structure & Algorithms', faculty: 'Faculty of Computing', program: 'BCS', creditHours: 3 },
  { courseCode: 'BCS2143', courseName: 'Object Oriented Programming', faculty: 'Faculty of Computing', program: 'BCS', creditHours: 3 },
  { courseCode: 'BCS2173', courseName: 'Human Computer Interaction', faculty: 'Faculty of Computing', program: 'BCS', creditHours: 3 },
  { courseCode: 'BCN2053', courseName: 'Operating Systems', faculty: 'Faculty of Computing', program: 'BCS', creditHours: 3 },
  { courseCode: 'BCS2243', courseName: 'Web Engineering', faculty: 'Faculty of Computing', program: 'BCS', creditHours: 3 },
  { courseCode: 'BCS2313', courseName: 'Artificial Intelligence Techniques', faculty: 'Faculty of Computing', program: 'BCS', creditHours: 3 },
  { courseCode: 'BCI2313', courseName: 'Algorithm & Complexity', faculty: 'Faculty of Computing', program: 'BCS', creditHours: 3 },
  { courseCode: 'BCN2023', courseName: 'Data & Network Security', faculty: 'Faculty of Computing', program: 'BCS', creditHours: 3 },
  { courseCode: 'BCC3012', courseName: 'Undergraduate Project I', faculty: 'Faculty of Computing', program: 'BCS', creditHours: 2 },
  { courseCode: 'BCC3024', courseName: 'Undergraduate Project II', faculty: 'Faculty of Computing', program: 'BCS', creditHours: 4 },
  { courseCode: 'BCC4012', courseName: 'Industrial Training', faculty: 'Faculty of Computing', program: 'BCS', creditHours: 12 },

  // Software Engineering Program Course
  { courseCode: 'BCS2233', courseName: 'Software Requirement Workshop', faculty: 'Faculty of Computing', program: 'BCS', creditHours: 3 },
  { courseCode: 'BCS2343', courseName: 'Software Design Workshop', faculty: 'Faculty of Computing', program: 'BCS', creditHours: 3 },
  { courseCode: 'BCS2213', courseName: 'Formal Method', faculty: 'Faculty of Computing', program: 'BCS', creditHours: 3 },
  { courseCode: 'BCS3203', courseName: 'BCS Elective 1 - Mobile Application Development', faculty: 'Faculty of Computing', program: 'BCS', creditHours: 3 },
  { courseCode: 'BCS3233', courseName: 'Software Testing', faculty: 'Faculty of Computing', program: 'BCS', creditHours: 3 },
  { courseCode: 'BCS3303', courseName: 'BCS Elective 2 - Cloud Application Development', faculty: 'Faculty of Computing', program: 'BCS', creditHours: 3 },
  { courseCode: 'BCS3143', courseName: 'Software Project Management', faculty: 'Faculty of Computing', program: 'BCS', creditHours: 3 },
  { courseCode: 'BCS3153', courseName: 'Software Evolution & Maintenance', faculty: 'Faculty of Computing', program: 'BCS', creditHours: 3 },
  { courseCode: 'BCS3133', courseName: 'Software Engineering Practices', faculty: 'Faculty of Computing', program: 'BCS', creditHours: 3 },
  { courseCode: 'BCS4203', courseName: 'BCS Elective 3 - Secure Software Development', faculty: 'Faculty of Computing', program: 'BCS', creditHours: 3 },
  { courseCode: 'BCS3263', courseName: 'Software Quality Assurance', faculty: 'Faculty of Computing', program: 'BCS', creditHours: 3 },
];

const prerequisites = [
  ['ULE2332', 'ULE1322'],
  ['ULE2342', 'ULE2332'],
  ['BCI1023', 'BCI1143'],
  ['BCI1093', 'BCI1023'],
  ['BCS2143', 'BCI1023'],
  ['BCS2143', 'BCS1133'],
  ['BCS2173', 'BCS1033'],
  ['BCS2243', 'BCI1023'],
  ['BCS2243', 'BCS1133'],
  ['BCS2313', 'BCI1093'],
  ['BCS2313', 'BUM1233'],
  ['BCI2313', 'BCI1023'],
  ['BCI2313', 'BCI1093'],
  ['BCN2023', 'BCN1053'],
  ['BCC3024', 'BCC3012'],
  ['BCS2233', 'BCS1133'],
  ['BCS2343', 'BCS2233'],
  ['BCS2213', 'BUM1233'],
  ['BCS2213', 'BCS2233'],
  ['BCS3233', 'BCS1133'],
  ['BCS3143', 'BCS2343'],
  ['BCS3143', 'BCS3233'],
  ['BCS3153', 'BCS3233'],
  ['BCS3153', 'BCS2343'],
  ['BCS3133', 'BCS2343'],
  ['BCS3263', 'BCS3233'],
] as const;

const catalogItems = [
  // Year 1 Sem 1
  ['UHC1012', 1, 1, 'UNIVERSITY'],
  ['UHC1032', 1, 1, 'UNIVERSITY'],
  ['BUM1153', 1, 1, 'MATHS'],
  ['BUM1233', 1, 1, 'MATHS'],
  ['BCN1043', 1, 1, 'FACULTY'],
  ['BCI1143', 1, 1, 'FACULTY'],
  ['BCS1033', 1, 1, 'FACULTY'],

  // Year 1 Sem 2
  ['UQA2002', 1, 2, 'UNIVERSITY'],
  ['ULE1310', 1, 2, 'UNIVERSITY'],
  ['ULE1322', 1, 2, 'UNIVERSITY'],
  ['BUM1433', 1, 2, 'MATHS'],
  ['BCI2023', 1, 2, 'FACULTY'],
  ['BCN1053', 1, 2, 'FACULTY'],
  ['BCI1023', 1, 2, 'FACULTY'],
  ['BCS1133', 1, 2, 'FACULTY'],

  // Year 2 Sem 3
  ['ULA1312', 2, 1, 'UNIVERSITY_ELECTIVE'],
  ['ULM1312', 2, 1, 'UNIVERSITY_ELECTIVE'],
  ['ULJ1312', 2, 1, 'UNIVERSITY_ELECTIVE'],
  ['UHC2022', 2, 1, 'UNIVERSITY'],
  ['ULE2332', 2, 1, 'UNIVERSITY'],
  ['BCI1093', 2, 1, 'FACULTY'],
  ['BCS2143', 2, 1, 'FACULTY'],
  ['BCS2173', 2, 1, 'FACULTY'],
  ['BCS2233', 2, 1, 'PROGRAM'],

  // Year 2 Sem 4
  ['UGE2002', 2, 2, 'UNIVERSITY'],
  ['BUM2413', 2, 2, 'MATHS'],
  ['BCN2053', 2, 2, 'FACULTY'],
  ['BCS2243', 2, 2, 'FACULTY'],
  ['BCS2313', 2, 2, 'FACULTY'],
  ['BCS2343', 2, 2, 'PROGRAM'],

  // Year 3 Sem 5
  ['ULE2342', 3, 1, 'UNIVERSITY'],
  ['BCI2313', 3, 1, 'FACULTY'],
  ['BCN2023', 3, 1, 'FACULTY'],
  ['BCS2213', 3, 1, 'PROGRAM'],
  ['BCS3203', 3, 1, 'PROGRAM_ELECTIVE'],
  ['BCS3233', 3, 1, 'PROGRAM'],

  // Year 3 Sem 6
  ['UEE3112', 3, 2, 'UNIVERSITY_ELECTIVE'],
  ['UEE3122', 3, 2, 'UNIVERSITY_ELECTIVE'],
  ['BCC3012', 3, 2, 'FACULTY'],
  ['BCS3303', 3, 2, 'PROGRAM_ELECTIVE'],
  ['BCS3143', 3, 2, 'PROGRAM'],
  ['BCS3153', 3, 2, 'PROGRAM'],
  ['BCS3133', 3, 2, 'PROGRAM'],

  // Year 4 Sem 7
  ['UEE4212', 4, 1, 'UNIVERSITY_ELECTIVE'],
  ['UEE4222', 4, 1, 'UNIVERSITY_ELECTIVE'],
  ['BCC3024', 4, 1, 'FACULTY'],
  ['BCS4203', 4, 1, 'PROGRAM_ELECTIVE'],
  ['BCS3263', 4, 1, 'PROGRAM'],

  // Year 4 Sem 8
  ['BCC4012', 4, 2, 'FACULTY'],
] as const;

const lecturers = [
  { id: 'L001', name: 'Dr. Aina Rahman', email: 'aina.rahman@umpsa.edu.my', faculty: 'Faculty of Computing' },
  { id: 'L002', name: 'Dr. Lim Wei Jian', email: 'lim.weijian@umpsa.edu.my', faculty: 'Faculty of Computing' },
  { id: 'L003', name: 'Assoc. Prof. Ts. Mohd Hakim', email: 'hakim@umpsa.edu.my', faculty: 'Faculty of Computing' },
  { id: 'L004', name: 'Dr. Nurul Izzati', email: 'nurul.izzati@umpsa.edu.my', faculty: 'Faculty of Computing' },
  { id: 'L005', name: 'Dr. Chong Mei Ling', email: 'chong.meiling@umpsa.edu.my', faculty: 'Faculty of Computing' },
  { id: 'L006', name: 'Dr. Farid Hassan', email: 'farid.hassan@umpsa.edu.my', faculty: 'Faculty of Computing' },
  { id: 'L007', name: 'Dr. Siti Mariam', email: 'siti.mariam@umpsa.edu.my', faculty: 'Faculty of Computing' },
  { id: 'L008', name: 'Dr. Tan Kai Jun', email: 'tan.kaijun@umpsa.edu.my', faculty: 'Faculty of Computing' },
];

const venues = ['DK-01', 'DK-02', 'DK-03', 'BK-11', 'BK-12', 'LAB-01', 'LAB-02', 'LAB-03', 'SEMINAR-1', 'SEMINAR-2'];

const timePatterns = [
  // All classes strictly follow 2-hour blocks only:
  // 08:00-10:00, 10:00-12:00, 12:00-14:00, 14:00-16:00, 16:00-18:00
  [{ dayOfWeek: 1, startTime: 800, endTime: 1000 }],
  [{ dayOfWeek: 1, startTime: 1000, endTime: 1200 }],
  [{ dayOfWeek: 1, startTime: 1200, endTime: 1400 }],
  [{ dayOfWeek: 1, startTime: 1400, endTime: 1600 }],
  [{ dayOfWeek: 1, startTime: 1600, endTime: 1800 }],

  [{ dayOfWeek: 2, startTime: 800, endTime: 1000 }],
  [{ dayOfWeek: 2, startTime: 1000, endTime: 1200 }],
  [{ dayOfWeek: 2, startTime: 1200, endTime: 1400 }],
  [{ dayOfWeek: 2, startTime: 1400, endTime: 1600 }],
  [{ dayOfWeek: 2, startTime: 1600, endTime: 1800 }],

  [{ dayOfWeek: 3, startTime: 800, endTime: 1000 }],
  [{ dayOfWeek: 3, startTime: 1000, endTime: 1200 }],
  [{ dayOfWeek: 3, startTime: 1200, endTime: 1400 }],
  [{ dayOfWeek: 3, startTime: 1400, endTime: 1600 }],
  [{ dayOfWeek: 3, startTime: 1600, endTime: 1800 }],

  [{ dayOfWeek: 4, startTime: 800, endTime: 1000 }],
  [{ dayOfWeek: 4, startTime: 1000, endTime: 1200 }],
  [{ dayOfWeek: 4, startTime: 1200, endTime: 1400 }],
  [{ dayOfWeek: 4, startTime: 1400, endTime: 1600 }],
  [{ dayOfWeek: 4, startTime: 1600, endTime: 1800 }],

  [{ dayOfWeek: 5, startTime: 800, endTime: 1000 }],
  [{ dayOfWeek: 5, startTime: 1000, endTime: 1200 }],
  [{ dayOfWeek: 5, startTime: 1200, endTime: 1400 }],
  [{ dayOfWeek: 5, startTime: 1400, endTime: 1600 }],
  [{ dayOfWeek: 5, startTime: 1600, endTime: 1800 }],
];

function gradePointFromGrade(grade: string) {
  const map: Record<string, number> = {
    A: 4.0,
    'A-': 3.67,
    'B+': 3.33,
    B: 3.0,
    'B-': 2.67,
    'C+': 2.33,
    C: 2.0,
    D: 1.0,
    F: 0.0,
  };

  return map[grade] ?? 0;
}

async function resetDatabase() {
  await prisma.enrollment.deleteMany();
  await prisma.timeSlot.deleteMany();
  await prisma.section.deleteMany();
  await prisma.catalogItem.deleteMany();
  await prisma.prerequisite.deleteMany();
  await prisma.course.deleteMany();
  await prisma.user.deleteMany();
  await prisma.systemSetting.deleteMany();
}

async function seedSystemSetting() {
  await prisma.systemSetting.create({
    data: {
      id: 1,
      activeSemester: ACTIVE_SEMESTER,
      isRegistrationOpen: true,
    },
  });
}

async function seedUsers() {
  await prisma.user.createMany({
    data: [
      {
        id: 'PA001',
        name: 'Dr. Nadia Sofea',
        email: 'nadia.sofea@umpsa.edu.my',
        contact: '09-4311001',
        role: 'PA',
        faculty: 'Faculty of Computing',
        program: 'BCS',
      },
      {
        id: 'ADMIN001',
        name: 'Academic Admin',
        email: 'academic.admin@umpsa.edu.my',
        contact: '09-4311000',
        role: 'ADMIN',
        faculty: 'Academic Management Division',
        program: null,
      },
      {
        id: 'CB24184',
        name: 'NG TIAN XI',
        email: 'cb24184@student.umpsa.edu.my',
        contact: '012-3456789',
        role: 'STUDENT',
        faculty: 'Faculty of Computing',
        program: 'BCS',
        intakeYear: 2024,
        currentSem: 2,
        advisorId: 'PA001',
      },
      {
        id: 'CB25001',
        name: 'AARON LIM',
        email: 'cb25001@student.umpsa.edu.my',
        contact: '012-2500001',
        role: 'STUDENT',
        faculty: 'Faculty of Computing',
        program: 'BCS',
        intakeYear: 2025,
        currentSem: 1,
        advisorId: 'PA001',
      },
      {
        id: 'CB24001',
        name: 'NUR AISYAH BINTI RAZAK',
        email: 'cb24001@student.umpsa.edu.my',
        contact: '012-2400001',
        role: 'STUDENT',
        faculty: 'Faculty of Computing',
        program: 'BCS',
        intakeYear: 2024,
        currentSem: 3,
        advisorId: 'PA001',
      },
      {
        id: 'CB24002',
        name: 'CHONG KAI MING',
        email: 'cb24002@student.umpsa.edu.my',
        contact: '012-2400002',
        role: 'STUDENT',
        faculty: 'Faculty of Computing',
        program: 'BCS',
        intakeYear: 2024,
        currentSem: 3,
        advisorId: 'PA001',
      },
      ...lecturers.map((lecturer) => ({
        id: lecturer.id,
        name: lecturer.name,
        email: lecturer.email,
        contact: `09-43120${lecturer.id.replace('L', '')}`,
        role: 'LECTURER',
        faculty: lecturer.faculty,
        program: 'BCS',
      })),
    ],
  });
}

async function seedCourses() {
  await prisma.course.createMany({ data: courses });
}

async function seedPrerequisites() {
  await prisma.prerequisite.createMany({
    data: prerequisites.map(([courseCode, prerequisiteCode]) => ({
      courseCode,
      prerequisiteCode,
    })),
  });
}

async function seedCatalogItems() {
  await prisma.catalogItem.createMany({
    data: catalogItems.map(([courseCode, year, semester, courseType]) => ({
      programCode: 'BCS',
      year,
      semester,
      courseType,
      courseCode,
    })),
  });
}

async function createSection(courseCode: string, sectionNumber: string, patternIndex: number, lecturerIndex: number, capacity: number, semester = ACTIVE_SEMESTER) {
  const section = await prisma.section.create({
    data: {
      sectionNumber,
      capacity,
      venue: venues[patternIndex % venues.length],
      semester,
      courseCode,
      lecturerId: lecturers[lecturerIndex % lecturers.length].id,
    },
  });

  const pattern = timePatterns[patternIndex % timePatterns.length];

  await prisma.timeSlot.createMany({
    data: pattern.map((slot) => ({
      ...slot,
      sectionId: section.id,
    })),
  });

  return section;
}

async function seedSections() {
  let index = 0;

  // Generate sections for both the previous semester and current semester.
  // Previous semester is needed because CB24184 has PASSED history in 2425-SEM1.
  const semesters = ['2425-SEM1', ACTIVE_SEMESTER];

  for (const semester of semesters) {
    for (const course of courses) {
      await createSection(course.courseCode, '01', index, index, 35, semester);
      await createSection(course.courseCode, '02', index + 3, index + 1, 35, semester);
      await createSection(course.courseCode, '03', index + 6, index + 2, 30, semester);

      index += 1;
    }
  }

  // Extra deliberately crowded sections for hackathon demo.
  // These are useful to show that AI can skip full sections and pick another one.
  const demoCourses = ['BCI1023', 'BCS1133', 'BCI2023', 'BCN1053', 'BUM1433'];
  for (const courseCode of demoCourses) {
    await createSection(courseCode, '04', index + 2, index + 4, 1, ACTIVE_SEMESTER);
    index += 1;
  }
}

async function findSection(courseCode: string, sectionNumber = '01', semester = ACTIVE_SEMESTER) {
  const section = await prisma.section.findFirst({
    where: {
      courseCode,
      sectionNumber,
      semester,
    },
  });

  if (!section) {
    throw new Error(`Section not found: ${courseCode} Section ${sectionNumber}`);
  }

  return section;
}

async function enrollStudent(params: {
  userId: string;
  courseCode: string;
  sectionNumber?: string;
  semester: string;
  status: string;
  grade?: string;
}) {
  const section = await findSection(params.courseCode, params.sectionNumber ?? '01', params.semester);

  await prisma.enrollment.create({
    data: {
      userId: params.userId,
      sectionId: section.id,
      courseCode: params.courseCode, // Requires courseCode field in Enrollment model.
      semester: params.semester,
      status: params.status,
      grade: params.grade ?? null,
      gradePoint: params.grade ? gradePointFromGrade(params.grade) : null,
    },
  });
}

async function seedStudentHistory() {
  // =====================================================
  // Main demo user: CB24184 / NG TIAN XI
  // Currently Year 1 Semester 2.
  // Year 1 Sem 1 mostly completed, but BCS1033 is intentionally not taken yet.
  // This lets recommendation show both Year 1 Sem 2 courses and missed Year 1 Sem 1 courses.
  // =====================================================

  await enrollStudent({ userId: 'CB24184', courseCode: 'UHC1012', semester: '2425-SEM1', status: 'PASSED', grade: 'A-' });
  await enrollStudent({ userId: 'CB24184', courseCode: 'UHC1032', semester: '2425-SEM1', status: 'PASSED', grade: 'B+' });
  await enrollStudent({ userId: 'CB24184', courseCode: 'BUM1153', semester: '2425-SEM1', status: 'PASSED', grade: 'B' });
  await enrollStudent({ userId: 'CB24184', courseCode: 'BUM1233', semester: '2425-SEM1', status: 'PASSED', grade: 'A-' });
  await enrollStudent({ userId: 'CB24184', courseCode: 'BCN1043', semester: '2425-SEM1', status: 'PASSED', grade: 'B+' });
  await enrollStudent({ userId: 'CB24184', courseCode: 'BCI1143', semester: '2425-SEM1', status: 'PASSED', grade: 'A' });

  // Current semester sample enrollment.
  // Leave most Year 1 Sem 2 courses open so AI recommendation has useful output.
  await enrollStudent({ userId: 'CB24184', courseCode: 'ULE1310', semester: ACTIVE_SEMESTER, status: 'APPROVED', sectionNumber: '01' });

  // =====================================================
  // User 1: CB25001
  // Year 1 Semester 1, no courses registered yet.
  // Use this account to test fresh-student recommendation.
  // Expected recommendation: Year 1 Sem 1 catalog courses.
  // =====================================================

  // Intentionally no Enrollment for CB25001.

  // =====================================================
  // User 2: CB24001
  // Year 2 Semester 1, already completed all Year 1 courses.
  // Use this account to test normal Year 2 Sem 1 recommendation.
  // Expected recommendation: Year 2 Sem 1 catalog courses such as BCI1093, BCS2143, BCS2173, BCS2233, etc.
  // =====================================================

  const year1Sem1Courses = ['UHC1012', 'UHC1032', 'BUM1153', 'BUM1233', 'BCN1043', 'BCI1143', 'BCS1033'];
  const year1Sem2Courses = ['UQA2002', 'ULE1310', 'ULE1322', 'BUM1433', 'BCI2023', 'BCN1053', 'BCI1023', 'BCS1133'];

  for (const courseCode of year1Sem1Courses) {
    await enrollStudent({ userId: 'CB24001', courseCode, semester: '2425-SEM1', status: 'PASSED', grade: 'B+' });
  }

  for (const courseCode of year1Sem2Courses) {
    await enrollStudent({ userId: 'CB24001', courseCode, semester: ACTIVE_SEMESTER, status: 'PASSED', grade: 'A-' });
  }

  // =====================================================
  // User 3: CB24002
  // Year 2 Semester 1, has failed subject from Year 1.
  // BCI1023 Programming Technique is failed.
  // This is useful because BCI1023 blocks BCI1093, BCS2143, BCS2243, and BCI2313.
  // Expected behavior: AI should remind retake and avoid recommending locked courses unless retake is handled.
  // =====================================================

  for (const courseCode of year1Sem1Courses) {
    await enrollStudent({ userId: 'CB24002', courseCode, semester: '2425-SEM1', status: 'PASSED', grade: 'B' });
  }

  const cb24002PassedSem2 = ['UQA2002', 'ULE1310', 'ULE1322', 'BUM1433', 'BCI2023', 'BCN1053', 'BCS1133'];

  for (const courseCode of cb24002PassedSem2) {
    await enrollStudent({ userId: 'CB24002', courseCode, semester: '2425-SEM1', status: 'PASSED', grade: 'B' });
  }

  await enrollStudent({ userId: 'CB24002', courseCode: 'BCI1023', semester: '2425-SEM1', status: 'FAILED', grade: 'F' });

  // =====================================================
  // Dummy students to fill selected sections.
  // These create FULL sections for AI full-class fallback demo.
  // =====================================================

  await prisma.user.createMany({
    data: Array.from({ length: 8 }).map((_, i) => ({
      id: `CB24${200 + i}`,
      name: `Demo Student ${i + 1}`,
      email: `demo.student${i + 1}@student.umpsa.edu.my`,
      contact: `012-88888${i}`,
      role: 'STUDENT',
      faculty: 'Faculty of Computing',
      program: 'BCS',
      intakeYear: 2024,
      currentSem: 2,
      advisorId: 'PA001',
    })),
  });

  // Fill section 04 with capacity 1 to simulate FULL section.
  const fullSectionCourses = ['BCI1023', 'BCS1133', 'BCI2023', 'BCN1053', 'BUM1433'];
  for (let i = 0; i < fullSectionCourses.length; i++) {
    const courseCode = fullSectionCourses[i];
    const section = await findSection(courseCode, '04', ACTIVE_SEMESTER);

    await prisma.enrollment.create({
      data: {
        userId: `CB24${200 + i}`,
        sectionId: section.id,
        courseCode,
        semester: ACTIVE_SEMESTER,
        status: 'APPROVED',
      },
    });
  }
}

async function main() {
  console.log('Resetting database...');
  await resetDatabase();

  console.log('Seeding system setting...');
  await seedSystemSetting();

  console.log('Seeding users...');
  await seedUsers();

  console.log('Seeding courses...');
  await seedCourses();

  console.log('Seeding prerequisites...');
  await seedPrerequisites();

  console.log('Seeding catalog items...');
  await seedCatalogItems();

  console.log('Seeding sections and time slots...');
  await seedSections();

  console.log('Seeding student history and demo enrollments...');
  await seedStudentHistory();

  console.log('Seed completed successfully.');
}

main()
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
