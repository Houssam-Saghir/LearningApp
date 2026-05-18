export type UserRole = 'Student' | 'Instructor' | 'Admin';
export type CourseLevel = 'Beginner' | 'Intermediate' | 'Advanced';

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  token: string;
}

export interface Instructor {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  category: string;
  level: CourseLevel;
  isPublished: boolean;
  createdAt: string;
  instructorId: string;
  instructor?: Instructor;
  modules?: Module[];
  enrollments?: Enrollment[];
}

export interface Enrollment {
  id: string;
  userId: string;
  courseId: string;
  progress: number;
  completedAt?: string;
  course?: Course;
}

export interface Review {
  id: string;
  courseId: string;
  userId: string;
  rating: number;
  comment: string;
  createdAt: string;
  userName?: string;
}

export interface Module {
  id: string;
  courseId: string;
  title: string;
  description: string;
  order: number;
  lessons: Lesson[];
}

export interface Lesson {
  id: string;
  moduleId: string;
  title: string;
  content: string;
  videoUrl: string;
  duration: number;
  order: number;
  lessonType: 'Video' | 'Article' | 'Quiz';
}

export interface Quiz {
  id: string;
  title: string;
  description: string;
  courseId: string;
  passingScore: number;
  timeLimitMinutes: number;
  isActive: boolean;
  createdAt: string;
  questions: QuizQuestion[];
}

export interface QuizQuestion {
  id: string;
  text: string;
  type: 'MultipleChoice' | 'TrueFalse' | 'MultiSelect';
  order: number;
  points: number;
  explanation?: string;
  options: QuizOption[];
}

export interface QuizOption {
  id: string;
  text: string;
  order: number;
  isCorrect?: boolean;
}

export interface QuizAttempt {
  id: string;
  quizId: string;
  score: number;
  passed: boolean;
  startedAt: string;
  completedAt?: string;
}

export interface QuizOptionResult {
  id: string;
  text: string;
  isCorrect: boolean;
}

export interface QuizAnswerResult {
  questionId: string;
  questionText: string;
  isCorrect: boolean;
  explanation?: string;
  selectedOptionIds: string[];
  correctOptionIds: string[];
  options: QuizOptionResult[];
}

export interface QuizResult {
  attemptId: string;
  score: number;
  passed: boolean;
  passingScore: number;
  correctCount: number;
  totalQuestions: number;
  timeTaken?: string;
  answers: QuizAnswerResult[];
}

export interface QuizPassStatusItem {
  quizId: string;
  title: string;
  passed: boolean;
  bestScore?: number;
  attemptCount: number;
}

export interface QuizStatus {
  hasQuizzes: boolean;
  allPassed: boolean;
  quizzes: QuizPassStatusItem[];
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  iconUrl: string;
  type: string;
  earnedAt: string;
}

export interface UserCertificate {
  id: string;
  courseId: string;
  courseName?: string;
  certificateNumber: string;
  issuedAt: string;
}
