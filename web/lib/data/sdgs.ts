// Sustainable Development Goals (SDGs)
// The 17 United Nations Sustainable Development Goals

export const sustainableDevelopmentGoals: string[] = [
  "No Poverty",
  "Zero Hunger",
  "Good Health and Well-being",
  "Quality Education",
  "Gender Equality",
  "Clean Water and Sanitation",
  "Affordable and Clean Energy",
  "Decent Work and Economic Growth",
  "Industry, Innovation and Infrastructure",
  "Reduced Inequalities",
  "Sustainable Cities and Communities",
  "Responsible Consumption and Production",
  "Climate Action",
  "Life Below Water",
  "Life on Land",
  "Peace, Justice and Strong Institutions",
  "Partnerships for the Goals",
];

/**
 * Get all SDG names
 */
export function getAllSDGs(): string[] {
  return sustainableDevelopmentGoals;
}

/**
 * Search SDGs by keyword
 */
export function searchSDGs(query: string): string[] {
  const lowerQuery = query.toLowerCase();
  return sustainableDevelopmentGoals.filter((sdg) =>
    sdg.toLowerCase().includes(lowerQuery)
  );
}
