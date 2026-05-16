export const cebuUniversities: string[] = [
  "Cebu Institute of Technology - University",
  "University of San Carlos",
  "University of Cebu",
  "University of the Philippines Cebu",
  "University of San Jose - Recoletos",
  "Cebu Normal University",
];

export const searchUniversities = (query: string): string[] => {
  const lowercaseQuery = query.toLowerCase();
  return cebuUniversities.filter((university) =>
    university.toLowerCase().includes(lowercaseQuery)
  );
};
