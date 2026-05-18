import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';

export const routes: Routes = [
  { path: '', loadComponent: () => import('./features/home/home.component').then(m => m.HomeComponent) },
  { path: 'courses', loadComponent: () => import('./features/courses/courses.component').then(m => m.CoursesComponent) },
  { path: 'courses/:id', loadComponent: () => import('./features/courses/course-detail.component').then(m => m.CourseDetailComponent) },
  { path: 'instructors/:id', loadComponent: () => import('./features/instructors/instructor-profile.component').then(m => m.InstructorProfileComponent) },
  { path: 'auth/login', loadComponent: () => import('./features/auth/login.component').then(m => m.LoginComponent) },
  { path: 'auth/register', loadComponent: () => import('./features/auth/register.component').then(m => m.RegisterComponent) },
  { path: 'dashboard', canActivate: [authGuard], loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent) },
  { path: 'my-courses', canActivate: [authGuard], loadComponent: () => import('./features/my-courses/my-courses.component').then(m => m.MyCoursesComponent) },
  { path: 'learn/:courseId/lesson/:lessonId', canActivate: [authGuard], loadComponent: () => import('./features/course-player/course-player.component').then(m => m.CoursePlayerComponent) },
  { path: 'courses/:courseId/quizzes/:quizId', canActivate: [authGuard], loadComponent: () => import('./features/quiz/quiz-player.component').then(m => m.QuizPlayerComponent) },
  { path: 'courses/:courseId/quizzes/:quizId/result/:attemptId', canActivate: [authGuard], loadComponent: () => import('./features/quiz/quiz-result.component').then(m => m.QuizResultComponent) },
  { path: 'profile', canActivate: [authGuard], loadComponent: () => import('./features/profile/profile.component').then(m => m.ProfileComponent) },
  { path: 'instructor/dashboard', canActivate: [authGuard, roleGuard], data: { roles: ['Instructor', 'Admin'] }, loadComponent: () => import('./features/instructor/dashboard/instructor-dashboard.component').then(m => m.InstructorDashboardComponent) },
  { path: 'instructor/courses', canActivate: [authGuard, roleGuard], data: { roles: ['Instructor', 'Admin'] }, loadComponent: () => import('./features/instructor/courses/course-management.component').then(m => m.CourseManagementComponent) },
  { path: 'instructor/courses/:courseId/content', canActivate: [authGuard, roleGuard], data: { roles: ['Instructor', 'Admin'] }, loadComponent: () => import('./features/instructor/courses/course-content.component').then(m => m.CourseContentComponent) },
  { path: 'instructor/courses/:courseId/quizzes', canActivate: [authGuard, roleGuard], data: { roles: ['Instructor', 'Admin'] }, loadComponent: () => import('./features/quiz/quiz-builder.component').then(m => m.QuizBuilderComponent) },
  { path: 'admin/instructors', canActivate: [authGuard, roleGuard], data: { roles: ['Admin'] }, loadComponent: () => import('./features/instructors/manage-instructors.component').then(m => m.ManageInstructorsComponent) },
  { path: '**', redirectTo: '' }
];
