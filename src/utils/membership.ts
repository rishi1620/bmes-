/**
 * Utility functions for CUET BMES Membership IDs, Batch extraction, and Card Formatting
 */

export interface BatchInfo {
  batchNum: string;      // e.g. "20"
  batchTag: string;      // e.g. "Batch '20"
  batchYear: number;     // e.g. 2020
  batchLabel: string;    // e.g. "Batch 2020 (20th Batch)"
}

export interface MemberIdDetails {
  membershipId: string;  // e.g. "BMES-B20-2008015"
  batchInfo: BatchInfo;
  validThru: string;     // e.g. "2024 - 2028"
  issueDate: string;
}

/**
 * Extracts student batch from CUET student ID or year/semester
 * CUET Student IDs typically begin with 2-digit batch: 1908012 -> Batch '19, 2008015 -> Batch '20, 2108042 -> Batch '21, 2208003 -> Batch '22
 */
export function extractBatchInfo(studentId: string, yearSemester?: string, createdAt?: string): BatchInfo {
  const cleanId = (studentId || "").trim();
  
  // 1. Try matching first 2 digits of standard CUET ID (e.g. 2008015, 1908001, 2108034, 2208005)
  const numericMatch = cleanId.match(/^(\d{2})\d{3,}/);
  if (numericMatch) {
    const twoDigits = numericMatch[1];
    const num = parseInt(twoDigits, 10);
    const year = 2000 + num;
    return {
      batchNum: twoDigits,
      batchTag: `Batch '${twoDigits}`,
      batchYear: year,
      batchLabel: `Batch ${year} (${twoDigits}th Batch)`
    };
  }

  // 2. Match hyphenated patterns e.g. "BME-20-015" or "19-08-012"
  const hyphenMatch = cleanId.match(/(?:^|\D)(\d{2})(?:-\d+)+/);
  if (hyphenMatch) {
    const twoDigits = hyphenMatch[1];
    const num = parseInt(twoDigits, 10);
    const year = 2000 + num;
    return {
      batchNum: twoDigits,
      batchTag: `Batch '${twoDigits}`,
      batchYear: year,
      batchLabel: `Batch ${year} (${twoDigits}th Batch)`
    };
  }

  // 3. Check for 4-digit year in ID (e.g. 202008015)
  const fullYearMatch = cleanId.match(/(20[1-3]\d)/);
  if (fullYearMatch) {
    const year = parseInt(fullYearMatch[1], 10);
    const twoDigits = String(year % 100).padStart(2, "0");
    return {
      batchNum: twoDigits,
      batchTag: `Batch '${twoDigits}`,
      batchYear: year,
      batchLabel: `Batch ${year} (${twoDigits}th Batch)`
    };
  }

  // 4. Try inferring from year/semester text (e.g. "4th Year", "3rd Year", "Level-4 Term-I") and current year
  const currentYear = new Date().getFullYear();
  if (yearSemester) {
    const text = yearSemester.toLowerCase();
    if (text.includes("4th") || text.includes("level-4") || text.includes("level 4")) {
      const year = currentYear - 3;
      const twoDigits = String(year % 100).padStart(2, "0");
      return {
        batchNum: twoDigits,
        batchTag: `Batch '${twoDigits}`,
        batchYear: year,
        batchLabel: `Batch ${year} (${twoDigits}th Batch)`
      };
    }
    if (text.includes("3rd") || text.includes("level-3") || text.includes("level 3")) {
      const year = currentYear - 2;
      const twoDigits = String(year % 100).padStart(2, "0");
      return {
        batchNum: twoDigits,
        batchTag: `Batch '${twoDigits}`,
        batchYear: year,
        batchLabel: `Batch ${year} (${twoDigits}th Batch)`
      };
    }
    if (text.includes("2nd") || text.includes("level-2") || text.includes("level 2")) {
      const year = currentYear - 1;
      const twoDigits = String(year % 100).padStart(2, "0");
      return {
        batchNum: twoDigits,
        batchTag: `Batch '${twoDigits}`,
        batchYear: year,
        batchLabel: `Batch ${year} (${twoDigits}th Batch)`
      };
    }
    if (text.includes("1st") || text.includes("level-1") || text.includes("level 1")) {
      const year = currentYear;
      const twoDigits = String(year % 100).padStart(2, "0");
      return {
        batchNum: twoDigits,
        batchTag: `Batch '${twoDigits}`,
        batchYear: year,
        batchLabel: `Batch ${year} (${twoDigits}th Batch)`
      };
    }
  }

  // Fallback: registration year
  const regYear = createdAt ? new Date(createdAt).getFullYear() : currentYear;
  const twoDigits = String(regYear % 100).padStart(2, "0");
  return {
    batchNum: twoDigits,
    batchTag: `Batch '${twoDigits}`,
    batchYear: regYear,
    batchLabel: `Batch ${regYear}`
  };
}

/**
 * Standardized Membership ID format:
 * Pattern: BMES-B{batchNum}-{cleanId}
 * Example: BMES-B20-2008015 or BMES-B21-2108042
 */
export function generateMembershipId(
  studentId: string, 
  id?: string, 
  yearSemester?: string,
  createdAt?: string
): string {
  const batch = extractBatchInfo(studentId, yearSemester, createdAt);
  const cleanId = (studentId || "").replace(/[^a-zA-Z0-9]/g, "").toUpperCase();

  if (cleanId) {
    return `BMES-B${batch.batchNum}-${cleanId}`;
  }

  const shortUuid = (id || "0000").replace(/[^a-zA-Z0-9]/g, "").slice(0, 6).toUpperCase();
  return `BMES-B${batch.batchNum}-${shortUuid}`;
}

/**
 * Calculates academic tenure validity for the virtual ID card
 */
export function getMemberTenure(batchYear: number): string {
  const start = batchYear;
  const end = batchYear + 4;
  return `${start} - ${end}`;
}

/**
 * Clean department abbreviation
 */
export function getDepartmentAbbreviation(dept: string): string {
  if (!dept) return "BME";
  const lower = dept.toLowerCase();
  if (lower.includes("biomedical")) return "BME";
  if (lower.includes("electrical")) return "EEE";
  if (lower.includes("computer")) return "CSE";
  if (lower.includes("mechanical")) return "ME";
  if (lower.includes("civil")) return "CE";
  return dept.split(" ").map(w => w[0]?.toUpperCase()).join("");
}
