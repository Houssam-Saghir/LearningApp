export type UserRole = 'Student' | 'Instructor' | 'Admin';
export type CourseLevel = 'Beginner' | 'Intermediate' | 'Advanced';
export type LessonType = 'Video' | 'Article' | 'Quiz';

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  createdAt: string;
}

export interface AuthResponse {
  token: string;
  expiresAt: string;
  user: User;
}

export interface Review {
  id: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface Lesson {
  id: string;
  title: string;
  content: string;
  videoUrl: string;
  duration: number;
  order: number;
  lessonType: LessonType;
}

export interface Module {
  id?: string;
  title: string;
  description: string;
  order: number;
  lessons: Lesson[];
}

export interface CourseSummary {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  category: string;
  level: CourseLevel;
  price: number;
  isPublished: boolean;
  instructorName: string;
  rating: number;
  reviewCount: number;
  enrollmentCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CourseDetails extends CourseSummary {
  instructorId: string;
  modules: Module[];
  reviews: Review[];
}

export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
}

export interface Enrollment {
  id: string;
  courseId: string;
  courseTitle: string;
  thumbnailUrl: string;
  instructorName: string;
  progress: number;
  enrolledAt: string;
  completedAt?: string | null;
}

export interface CourseProgress {
  courseId: string;
  progress: number;
  completedLessons: number;
  totalLessons: number;
  completedLessonIds: string[];
}

export interface DashboardStats {
  role: UserRole;
  totalUsers: number;
  totalCourses: number;
  totalEnrollments: number;
  enrolledCourses: number;
  averageProgress: number;
  publishedCourses: number;
  totalStudents: number;
  revenue: number;
}

export interface CourseQuery {
  category?: string;
  level?: CourseLevel | '';
  maxPrice?: number | null;
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface UpsertLessonRequest {
  title: string;
  content: string;
  videoUrl: string;
  duration: number;
  order: number;
  lessonType: LessonType;
}

export interface UpsertModuleRequest {
  title: string;
  description: string;
  order: number;
  lessons: UpsertLessonRequest[];
}

export interface UpsertCourseRequest {
  title: string;
  description: string;
  thumbnailUrl: string;
  category: string;
  level: CourseLevel;
  price: number;
  isPublished: boolean;
  modules: UpsertModuleRequest[];
}
