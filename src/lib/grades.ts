export const GRADES = [
  'G',
  'S+',
  'S',
  'S-',
  'A+',
  'A',
  'A-',
  'B+',
  'B',
  'B-',
  'C+',
  'C',
  'C-',
  'F+',
  'F',
] as const

export type Grade = (typeof GRADES)[number]

const FAMILY_COLORS: Record<string, string> = {
  G: '#d1495b',
  S: '#d8a534',
  A: '#dd8c3c',
  B: '#57a05a',
  C: '#4a8fd0',
  F: '#8a6fd1',
}

export function gradeFamily(grade: string): string {
  return grade.charAt(0)
}

export function gradeColor(grade: string): string {
  return FAMILY_COLORS[gradeFamily(grade)] ?? '#8a8a92'
}

export function gradeRank(grade: string): number {
  const index = (GRADES as readonly string[]).indexOf(grade)
  return index === -1 ? GRADES.length : index
}
