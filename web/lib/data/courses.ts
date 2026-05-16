export interface CourseCategory {
  name: string;
  courses: string[];
}

export const courseCategories: CourseCategory[] = [
  {
    name: "Information Technology & Computer Science",
    courses: [
      "BS Information Technology",
      "BS Computer Science",
      "BS Computer Engineering",
      "BS Information Systems",
      "BS Entertainment and Multimedia Computing",
      "Associate in Computer Technology",
    ],
  },
  {
    name: "Engineering",
    courses: [
      "BS Civil Engineering",
      "BS Electrical Engineering",
      "BS Electronics Engineering",
      "BS Mechanical Engineering",
      "BS Chemical Engineering",
      "BS Industrial Engineering",
      "BS Geodetic Engineering",
      "BS Sanitary Engineering",
      "BS Mining Engineering",
      "BS Metallurgical Engineering",
      "BS Ceramic Engineering",
      "BS Agricultural and Biosystems Engineering",
    ],
  },
  {
    name: "Business & Management",
    courses: [
      "BS Business Administration",
      "BS Accountancy",
      "BS Management Accounting",
      "BS Accounting Information System",
      "BS Entrepreneurship",
      "BS Office Administration",
      "BS Marketing Management",
      "BS Finance",
      "BS Economics",
      "BS Real Estate Management",
    ],
  },
  {
    name: "Education",
    courses: [
      "Bachelor of Elementary Education",
      "Bachelor of Secondary Education",
      "Bachelor of Physical Education",
      "Bachelor of Special Needs Education",
      "Bachelor of Early Childhood Education",
      "BS in Industrial Education",
    ],
  },
  {
    name: "Health Sciences",
    courses: [
      "BS Nursing",
      "BS Pharmacy",
      "BS Physical Therapy",
      "BS Occupational Therapy",
      "BS Medical Technology",
      "BS Radiologic Technology",
      "BS Nutrition and Dietetics",
      "BS Midwifery",
      "BS Respiratory Therapy",
      "BS Speech-Language Pathology",
    ],
  },
  {
    name: "Architecture & Design",
    courses: [
      "BS Architecture",
      "BS Interior Design",
      "BS Landscape Architecture",
      "Bachelor of Fine Arts",
      "BS Industrial Design",
    ],
  },
  {
    name: "Social Sciences & Humanities",
    courses: [
      "AB Psychology",
      "AB Political Science",
      "AB Communication",
      "AB Mass Communication",
      "AB Broadcasting",
      "AB Journalism",
      "AB English",
      "AB Filipino",
      "AB History",
      "AB Philosophy",
      "AB Sociology",
      "AB Social Work",
      "BS Psychology",
      "BS Social Work",
    ],
  },
  {
    name: "Hospitality & Tourism",
    courses: [
      "BS Hotel and Restaurant Management",
      "BS Tourism Management",
      "BS Hospitality Management",
      "BS Cruise Ship Management",
      "BS Culinary Management",
    ],
  },
  {
    name: "Agriculture & Fisheries",
    courses: [
      "BS Agriculture",
      "BS Agricultural Technology",
      "BS Agribusiness",
      "BS Fisheries",
      "BS Food Technology",
      "BS Forestry",
      "BS Development Communication",
    ],
  },
  {
    name: "Science & Mathematics",
    courses: [
      "BS Biology",
      "BS Chemistry",
      "BS Physics",
      "BS Mathematics",
      "BS Statistics",
      "BS Applied Mathematics",
      "BS Environmental Science",
      "BS Marine Biology",
    ],
  },
  {
    name: "Maritime Studies",
    courses: [
      "BS Marine Transportation",
      "BS Marine Engineering",
      "BS Naval Architecture and Marine Engineering",
    ],
  },
  {
    name: "Criminology & Public Safety",
    courses: [
      "BS Criminology",
      "BS Forensic Science",
    ],
  },
  {
    name: "Other Programs",
    courses: [
      "BS Aviation",
      "BS Aeronautical Engineering",
      "BS Library and Information Science",
      "BS Customs Administration",
      "AB Legal Management",
      "Bachelor of Laws (LLB)",
    ],
  },
];

export const getAllCourses = (): string[] => {
  return courseCategories.flatMap((category) => category.courses);
};

export const searchCourses = (query: string): string[] => {
  const lowercaseQuery = query.toLowerCase();
  return getAllCourses().filter((course) =>
    course.toLowerCase().includes(lowercaseQuery)
  );
};
