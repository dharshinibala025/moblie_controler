/**
 * sectionsConfig.js
 * Single source of truth for which Sections exist under each Year.
 *
 * To change the sections available for a given year (e.g. a year that
 * only has A and B), edit ONLY this object -- no UI code needs to change.
 * FilterChipGroup and the Students/Staff screens read from here.
 */

export const YEARS = ['1st Year', '2nd Year', '3rd Year', '4th Year'];

export const SECTIONS_BY_YEAR = {
  '1st Year': ['A', 'B', 'C', 'D'],
  '2nd Year': ['A', 'B', 'C', 'D'],
  '3rd Year': ['A', 'B', 'C', 'D'],
  '4th Year': ['A', 'B', 'C', 'D'],
};

// Fallback used only if a year is missing from SECTIONS_BY_YEAR above.
const DEFAULT_SECTIONS = ['A', 'B', 'C', 'D'];

/**
 * Returns the list of sections to show in the Section filter.
 * - If a specific year is passed, returns that year's configured sections.
 * - If "All" (or no year) is passed, returns the de-duplicated union of
 *   every configured year's sections, so the filter still makes sense
 *   when no year has been picked yet.
 */
export const getSectionOptions = (year) => {
  if (!year || year === 'All') {
    const unique = [];
    Object.values(SECTIONS_BY_YEAR).forEach((sections) => {
      sections.forEach((section) => {
        if (!unique.includes(section)) unique.push(section);
      });
    });
    return unique;
  }
  return SECTIONS_BY_YEAR[year] || DEFAULT_SECTIONS;
};