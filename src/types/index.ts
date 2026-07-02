export interface ChildInterests {
  favorite_sports?: string[];
  favorite_clubs?: string[];
  pets?: string[];
  family?: Record<string, string>;
  themes?: string[];
}

export interface User {
  id: string;
  google_id: string;
  email: string;
  display_name: string | null;
  avatar_url: string | null;
  family_id: string;
}

export interface Child {
  id: string;
  family_id: string;
  name: string;
  age: number | null;
  school_level: string;
  book: string | null;
  avatar: string;
  interests: ChildInterests;
  created_at: string;
}

export interface ChildProgress {
  child_id: string;
  current_unit_id: string | null;
  unlocked_units: string[];
  completed_units: string[];
  unit_progress: Record<string, unknown>;
  mic_tolerance: number;
  activities_completed: Record<string, boolean>;
}

export interface BackpackItem {
  id: string;
  child_id: string;
  word: string;
  context: string | null;
  unit_id: string | null;
  activity_id: string | null;
  attempts: number;
  released: boolean;
  added_at: string;
}

export interface Activity {
  id: string;
  type: 'drag_drop_audio' | 'visual_classification' | 'cloze' | 'teacher_mode';
  title: string;
  targetText: string;
  illustration: string;
  vocabulary: string[];
  [key: string]: unknown;
}

export interface Unit {
  id: string;
  unitNumber: number;
  title: string;
  emoji: string;
  vocabulary: string[];
  grammarTopics: string[];
  activities: Activity[];
  personalizedThemes: string[];
  generatedAt: string;
  sourceBook: 'small_big_things_1';
}

export interface Curriculum {
  id: string;
  child_id: string;
  book: string;
  units: Unit[];
  generated_from_image: boolean;
  generated_at: string;
}

export interface ExamQuestion {
  id: string;
  type: 'multiple_choice' | 'cloze' | 'voice' | 'classification';
  unitId: string;
  prompt: string;
  options?: string[];
  correctAnswer: string;
  fromBackpack: boolean;
}

export interface GenerateCurriculumInput {
  childId: string;
  /** Base64 limpio o con prefijo data-URI (desde RN) */
  imageBase64: string;
  /** Buffer binario de Multer (preferido cuando viene multipart) */
  imageBuffer?: Buffer;
  mimeType: string;
  childName: string;
  childAge: number;
  interests: ChildInterests;
  bookTitle: string;
}
