/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type Grade = 1 | 2 | 3 | 4 | 5;

export type Subject = 
  | 'Toán' 
  | 'Tiếng Việt' 
  | 'Tiếng Anh' 
  | 'Tự nhiên & Xã hội' 
  | 'Đạo đức' 
  | 'Nghệ thuật';

export type ExamType = 
  | 'Giữa HK1' 
  | 'Cuối HK1' 
  | 'Giữa HK2' 
  | 'Cuối HK2';

export type Difficulty = 'Dễ' | 'Trung bình' | 'Khó';

export interface Question {
  id: string;
  type: 'multiple-choice' | 'essay';
  question: string;
  options?: string[]; // For multiple choice
  answer: string;
  explanation?: string;
  illustrationPrompt?: string;
  imageUrl?: string;
}

export interface Exam {
  id: string;
  code: string;
  title: string;
  grade: Grade;
  subject: Subject;
  examType: ExamType;
  schoolYear: string;
  timeAllowed: number; // in minutes
  questions: Question[];
  createdAt: string;
}

export interface ExamSettings {
  schoolYear: string;
  examType: ExamType;
  grade: Grade;
  subject: Subject;
  difficulty: Difficulty;
  multipleChoiceCount: number;
  essayCount: number;
  examCount: number;
  useWebSearch: boolean;
  generateIllustrations: boolean;
  sampleImage?: string; // base64
}
