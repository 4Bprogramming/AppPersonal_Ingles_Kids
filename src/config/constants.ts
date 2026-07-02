export const VOICE_DEFAULT_TOLERANCE = 0.58;
export const VOICE_TOLERANCE_MIN = 0.4;
export const VOICE_TOLERANCE_MAX = 0.9;
export const BACKPACK_FAIL_THRESHOLD = 3;
export const EXAM_PASS_PERCENTAGE = 80;
export const EXAM_QUESTION_COUNT = 10;

export const SCHOOL_LEVELS = [
  'jardin',
  '1_grado',
  '2_grado',
  '3_grado',
  '4_grado',
  '5_grado',
  '6_grado',
] as const;

export type SchoolLevel = (typeof SCHOOL_LEVELS)[number];

export const DEFAULT_BENJA_INTERESTS = {
  favorite_sports: ['football'],
  favorite_clubs: ['River Plate'],
  family: { mom: 'Mamá', sister: 'Juli', dad: 'Papá', dog: 'Buba' },
};
