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
  price: number;
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
  order: number;
  lessons: Lesson[];
}

export interface Lesson {
  id: string;
  moduleId: string;
  title: string;
  content: string;
  videoUrl: string;
  order: number;
}
