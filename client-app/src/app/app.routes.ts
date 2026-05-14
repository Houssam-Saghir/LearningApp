import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./features/home/home.component').then((m) => m.HomeComponent)
  },
  {
    path: 'courses',
    children: [
      {
        path: '',
        loadComponent: () => import('./features/courses/courses-list.component').then((m) => m.CoursesListComponent)
      },
      {
        path: ':id',
        loadComponent: () => import('./features/courses/course-detail.component').then((m) => m.CourseDetailComponent)
      }
    ]
  },
  {
    path: 'auth',
    children: [
      {
        path: 'login',
        loadComponent: () => import('./features/auth/login.component').then((m) => m.LoginComponent)
      },
      {
        path: 'register',
        loadComponent: () => import('./features/auth/register.component').then((m) => m.RegisterComponent)
      },
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'login'
      }
    ]
  },
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () => import('./features/dashboard/dashboard.component').then((m) => m.DashboardComponent)
  },
  {
    path: 'my-courses',
    canActivate: [authGuard],
    loadComponent: () => import('./features/dashboard/my-courses.component').then((m) => m.MyCoursesComponent)
  },
  {
    path: 'profile',
    canActivate: [authGuard],
    loadComponent: () => import('./features/dashboard/profile.component').then((m) => m.ProfileComponent)
  },
  {
    path: 'learn/:courseId/lesson/:lessonId',
    canActivate: [authGuard],
    loadComponent: () => import('./features/course-player/course-player.component').then((m) => m.CoursePlayerComponent)
  },
  {
    path: 'instructor/dashboard',
    canActivate: [authGuard, roleGuard(['Instructor', 'Admin'])],
    loadComponent: () => import('./features/instructor/instructor-dashboard.component').then((m) => m.InstructorDashboardComponent)
  },
  {
    path: 'instructor/courses',
    canActivate: [authGuard, roleGuard(['Instructor', 'Admin'])],
    loadComponent: () => import('./features/instructor/course-management.component').then((m) => m.CourseManagementComponent)
  },
  {
    path: 'instructor/courses/:id/edit',
    canActivate: [authGuard, roleGuard(['Instructor', 'Admin'])],
    loadComponent: () => import('./features/instructor/course-editor.component').then((m) => m.CourseEditorComponent)
  },
  {
    path: '**',
    redirectTo: ''
  }
];
