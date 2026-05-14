import { CommonModule, CurrencyPipe } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { AuthService } from '../../core/services/auth.service';
import { CourseService } from '../../core/services/course.service';
import { DashboardService } from '../../core/services/dashboard.service';
import { EnrollmentService } from '../../core/services/enrollment.service';
import { CourseDetails, DashboardStats, Enrollment } from '../../core/models/app.models';
import { ProgressBarComponent } from '../../shared/components/progress-bar.component';

@Component({
  standalone: true,
  imports: [CommonModule, CurrencyPipe, MatButtonModule, MatCardModule, ProgressBarComponent],
  template: `
    <div class="page-shell page-grid">
      <section class="hero-panel">
        <span class="badge">Dashboard</span>
        <h1>{{ welcomeTitle }}</h1>
        <p>Track your stats, keep your learning momentum, and jump back into the right lesson instantly.</p>
      </section>

      <section class="stats-grid" *ngIf="stats">
        <div class="info-card"><strong>{{ stats.totalUsers || stats.enrolledCourses || stats.totalCourses }}</strong><p class="muted">Primary metric</p></div>
        <div class="info-card"><strong>{{ stats.totalCourses }}</strong><p class="muted">Courses</p></div>
        <div class="info-card"><strong>{{ stats.totalEnrollments }}</strong><p class="muted">Enrollments</p></div>
        <div class="info-card"><strong>{{ stats.revenue | currency }}</strong><p class="muted">Revenue</p></div>
      </section>

      <section class="section-card section-block" *ngIf="isStudentView">
        <div class="section-heading">
          <div>
            <span class="badge">My learning</span>
            <h2>Continue where you left off</h2>
          </div>
          <a mat-button routerLink="/my-courses">View all</a>
        </div>
        <div class="simple-grid" *ngIf="enrollments.length; else emptyCourses">
          <mat-card class="info-card" *ngFor="let enrollment of enrollments">
            <h3>{{ enrollment.courseTitle }}</h3>
            <p class="muted">{{ enrollment.instructorName }}</p>
            <app-progress-bar [value]="enrollment.progress" label="Course progress"></app-progress-bar>
            <button mat-stroked-button type="button" (click)="continueLearning(enrollment)">Continue learning</button>
          </mat-card>
        </div>
      </section>

      <section class="section-card section-block" *ngIf="isInstructorView">
        <div class="section-heading">
          <div>
            <span class="badge">Instructor snapshot</span>
            <h2>Your published catalog</h2>
          </div>
          <button mat-flat-button class="accent-button" type="button" (click)="router.navigate(['/instructor/courses'])">Manage courses</button>
        </div>
        <div class="simple-grid" *ngIf="instructorCourses.length; else emptyCourses">
          <mat-card class="info-card" *ngFor="let course of instructorCourses">
            <h3>{{ course.title }}</h3>
            <p class="muted">{{ course.category }} · {{ course.level }}</p>
            <div class="muted">{{ course.enrollmentCount }} enrollments · {{ course.reviewCount }} reviews</div>
          </mat-card>
        </div>
      </section>

      <ng-template #emptyCourses>
        <div class="empty-state">Nothing to show yet. Start by exploring the catalog or creating a course.</div>
      </ng-template>
    </div>
  `,
  styles: [`
    .section-block { padding: 1.5rem; }
    .section-heading { display: flex; justify-content: space-between; align-items: center; gap: 1rem; margin-bottom: 1rem; }
    .accent-button { background: var(--app-accent) !important; color: white !important; }
  `]
})
export class DashboardComponent implements OnInit {
  readonly authService = inject(AuthService);
  readonly router = inject(Router);
  private readonly dashboardService = inject(DashboardService);
  private readonly enrollmentService = inject(EnrollmentService);
  private readonly courseService = inject(CourseService);

  stats: DashboardStats | null = null;
  enrollments: Enrollment[] = [];
  instructorCourses: CourseDetails[] = [];

  get isStudentView(): boolean {
    return this.authService.currentUser?.role === 'Student';
  }

  get isInstructorView(): boolean {
    return this.authService.currentUser?.role === 'Instructor' || this.authService.currentUser?.role === 'Admin';
  }

  get welcomeTitle(): string {
    const user = this.authService.currentUser;
    return user ? `Welcome back, ${user.firstName}` : 'Dashboard';
  }

  ngOnInit(): void {
    this.dashboardService.getStats().subscribe((stats) => this.stats = stats);

    if (this.isStudentView) {
      this.enrollmentService.getMyEnrollments().subscribe((items) => this.enrollments = items);
    }

    if (this.isInstructorView) {
      this.courseService.getInstructorCourses().subscribe((courses) => this.instructorCourses = courses);
    }
  }

  continueLearning(enrollment: Enrollment): void {
    this.courseService.getCourse(enrollment.courseId).subscribe((course) => {
      const firstLesson = course.modules.flatMap((module) => module.lessons).sort((a, b) => a.order - b.order)[0];
      if (firstLesson) {
        this.router.navigate(['/learn', enrollment.courseId, 'lesson', firstLesson.id]);
      }
    });
  }
}
